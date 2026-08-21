"""8004 viewer entrypoint with shared wall and enclosed-space postprocessing."""

import asyncio
import copy
import hashlib
import json
from collections import OrderedDict

import cv2
import numpy as np
import requests
from fastapi import File, HTTPException, UploadFile
from starlette.responses import Response
from starlette.routing import Route

from . import approved_main


app = approved_main.app


_ANALYSIS_CACHE_LIMIT = 16
_analysis_cache = OrderedDict()
_analysis_cache_lock = asyncio.Lock()


def _bbox_overlap_ratio(fragment, target):
    first = fragment.get("bbox") or {}
    second = target.get("bbox") or {}
    fx1, fy1 = int(first.get("x", 0)), int(first.get("y", 0))
    fx2 = fx1 + int(first.get("width", 0))
    fy2 = fy1 + int(first.get("height", 0))
    tx1, ty1 = int(second.get("x", 0)), int(second.get("y", 0))
    tx2 = tx1 + int(second.get("width", 0))
    ty2 = ty1 + int(second.get("height", 0))
    overlap = max(0, min(fx2, tx2) - max(fx1, tx1)) * max(
        0, min(fy2, ty2) - max(fy1, ty1)
    )
    fragment_area = max(1, (fx2 - fx1) * (fy2 - fy1))
    return overlap / fragment_area


def _polygon_mask(polygons, shape):
    mask = np.zeros(shape, dtype=np.uint8)
    for polygon in polygons or []:
        points = np.asarray(polygon, dtype=np.int32)
        if points.ndim == 2 and points.shape[0] >= 3 and points.shape[1] == 2:
            cv2.fillPoly(mask, [points], 255)
    return mask


def _mask_polygons(mask):
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    polygons = []
    for contour in sorted(contours, key=cv2.contourArea, reverse=True):
        if cv2.contourArea(contour) < 12:
            continue
        approximate = cv2.approxPolyDP(contour, 1.5, True).reshape(-1, 2)
        if len(approximate) >= 3:
            polygons.append([[int(x), int(y)] for x, y in approximate])
    return polygons


def _is_legacy_solid_line_result(rooms):
    """Return True when the approved solid-line wall-grid result is active.

    The demo drawings 1/2/3/4 already have a reliable wall-grid geometry from
    the old solid-line postprocess.  Segment-only cleanup must not run on top of
    that result, because anonymous/X helper regions can be incorrectly absorbed
    into nearby rooms (for example 4번 도면 욕실2).
    """

    named_rooms = [
        room
        for room in rooms
        if room.get("viewer_polygons")
        and not str(room.get("room_name") or "").startswith("class_")
    ]
    if len(named_rooms) < 6:
        return False

    wall_grid_count = sum(
        1
        for room in named_rooms
        if str(room.get("viewer_geometry_source") or "") == "original_wall_grid"
    )
    return wall_grid_count / max(1, len(named_rooms)) >= 0.72


def _room_name(room):
    return str(room.get("room_name") or "").replace(" ", "")


def _is_open_living_kitchen_pair(first, second):
    first_name = _room_name(first)
    second_name = _room_name(second)
    first_living = "거실" in first_name
    second_living = "거실" in second_name
    first_kitchen = "주방" in first_name or "식당" in first_name
    second_kitchen = "주방" in second_name or "식당" in second_name
    return (first_living and second_kitchen) or (second_living and first_kitchen)


def _polygon_bounds(room):
    points = [
        point
        for polygon in (room.get("viewer_polygons") or [])
        for point in polygon
        if isinstance(point, (list, tuple)) and len(point) == 2
    ]
    if not points:
        return None
    xs = [int(point[0]) for point in points]
    ys = [int(point[1]) for point in points]
    return min(xs), min(ys), max(xs), max(ys)


def _set_room_boundary(room, axis, side, value):
    bounds = _polygon_bounds(room)
    if not bounds:
        return False
    left, top, right, bottom = bounds
    value = int(round(value))
    changed = False
    for polygon in room.get("viewer_polygons") or []:
        for point in polygon:
            if not isinstance(point, list) or len(point) != 2:
                continue
            if axis == "y":
                if side == "top" and abs(int(point[1]) - top) <= 2:
                    point[1] = value
                    changed = True
                elif side == "bottom" and abs(int(point[1]) - bottom) <= 2:
                    point[1] = value
                    changed = True
            else:
                if side == "left" and abs(int(point[0]) - left) <= 2:
                    point[0] = value
                    changed = True
                elif side == "right" and abs(int(point[0]) - right) <= 2:
                    point[0] = value
                    changed = True
    if changed:
        updated = _polygon_bounds(room)
        if updated:
            left, top, right, bottom = updated
            room["bbox"] = {
                "x": int(left),
                "y": int(top),
                "width": int(max(1, right - left)),
                "height": int(max(1, bottom - top)),
            }
            room["viewer_geometry_source"] = (
                f"{room.get('viewer_geometry_source') or 'viewer'}_thin_overlap_snap"
            )
    return changed


def _polygon_area(polygon):
    if not polygon or len(polygon) < 3:
        return 0.0
    area = 0.0
    previous_x, previous_y = polygon[-1]
    for current_x, current_y in polygon:
        area += previous_x * current_y - current_x * previous_y
        previous_x, previous_y = current_x, current_y
    return abs(area) / 2.0


def _remove_tiny_room_fragments(rooms):
    """Drop tiny detached viewer polygons attached to a named room.

    Solid-line tracing can occasionally leave a small triangular shard near an
    X/fixture mark.  It is visually worse than omitting it, and it should not be
    converted into a floor patch in the 3D demo view.
    """

    changed = 0
    for room in rooms:
        if _room_name(room).startswith("class_"):
            continue
        polygons = room.get("viewer_polygons") or []
        if len(polygons) < 2:
            continue
        areas = [_polygon_area(polygon) for polygon in polygons]
        largest = max(areas or [0.0])
        keep = [
            polygon
            for polygon, area in zip(polygons, areas)
            if area >= 400 or area >= largest * 0.05
        ]
        if keep and len(keep) < len(polygons):
            room["viewer_polygons"] = keep
            bounds = _polygon_bounds(room)
            if bounds:
                left, top, right, bottom = bounds
                room["bbox"] = {
                    "x": int(left),
                    "y": int(top),
                    "width": int(max(1, right - left)),
                    "height": int(max(1, bottom - top)),
                }
            room["viewer_geometry_source"] = (
                f"{room.get('viewer_geometry_source') or 'viewer'}_tiny_fragment_removed"
            )
            changed += 1
    return changed


def _snap_thin_room_overlaps(rooms):
    """Remove small accidental floor overlaps between solid-line rooms.

    A few approved wall-grid rooms can overlap by one wall thickness after OCR
    naming/splitting.  In 3D that appears as a broken or doubled wall between
    adjacent rooms.  If the overlap is only a thin strip, snap the lower/right
    room start edge to the upper/left room end edge.
    """

    named_rooms = [
        room
        for room in rooms
        if room.get("viewer_polygons")
        and not _room_name(room).startswith("class_")
    ]
    changed = 0
    max_overlap = 18

    for first_index, first in enumerate(named_rooms):
        first_bounds = _polygon_bounds(first)
        if not first_bounds:
            continue
        fx1, fy1, fx2, fy2 = first_bounds
        fw, fh = fx2 - fx1, fy2 - fy1
        if fw <= 0 or fh <= 0:
            continue
        for second in named_rooms[first_index + 1 :]:
            if _is_open_living_kitchen_pair(first, second):
                continue
            second_bounds = _polygon_bounds(second)
            if not second_bounds:
                continue
            sx1, sy1, sx2, sy2 = second_bounds
            sw, sh = sx2 - sx1, sy2 - sy1
            if sw <= 0 or sh <= 0:
                continue

            overlap_x = max(0, min(fx2, sx2) - max(fx1, sx1))
            overlap_y = max(0, min(fy2, sy2) - max(fy1, sy1))
            if not overlap_x or not overlap_y:
                continue

            if (
                overlap_y <= max_overlap
                and overlap_x >= min(fw, sw) * 0.45
            ):
                first_center_y = (fy1 + fy2) / 2
                second_center_y = (sy1 + sy2) / 2
                upper, lower = (first, second) if first_center_y < second_center_y else (second, first)
                upper_name = _room_name(upper)
                lower_name = _room_name(lower)
                upper_bounds = _polygon_bounds(upper)
                lower_bounds = _polygon_bounds(lower)
                if not upper_bounds or not lower_bounds:
                    continue
                if "욕실" in upper_name and "침실" in lower_name:
                    shared_y = upper_bounds[3]
                    if abs(lower_bounds[1] - shared_y) <= max_overlap:
                        changed += int(_set_room_boundary(lower, "y", "top", shared_y))
                elif "침실" in upper_name and "욕실" in lower_name:
                    shared_y = lower_bounds[1]
                    if abs(upper_bounds[3] - shared_y) <= max_overlap:
                        changed += int(_set_room_boundary(upper, "y", "bottom", shared_y))
                else:
                    continue
                continue

            if (
                overlap_x <= max_overlap
                and overlap_y >= min(fh, sh) * 0.45
            ):
                first_center_x = (fx1 + fx2) / 2
                second_center_x = (sx1 + sx2) / 2
                left_room, right_room = (first, second) if first_center_x < second_center_x else (second, first)
                left_name = _room_name(left_room)
                right_name = _room_name(right_room)
                left_bounds = _polygon_bounds(left_room)
                right_bounds = _polygon_bounds(right_room)
                if not left_bounds or not right_bounds:
                    continue
                if "욕실" in left_name and "침실" in right_name:
                    shared_x = left_bounds[2]
                    if abs(right_bounds[0] - shared_x) <= max_overlap:
                        changed += int(_set_room_boundary(right_room, "x", "left", shared_x))
                elif "침실" in left_name and "욕실" in right_name:
                    shared_x = right_bounds[0]
                    if abs(left_bounds[2] - shared_x) <= max_overlap:
                        changed += int(_set_room_boundary(left_room, "x", "right", shared_x))
    return changed


def _merge_enclosed_anonymous_regions(rooms):
    """Absorb only anonymous pixels that substantially lie inside one room.

    This handles X-marked fixture/shaft masks enclosed by a bathroom or utility
    room.  External X regions have no strong bbox containment and are omitted.
    """

    coordinates = [
        point
        for room in rooms
        for polygon in (room.get("viewer_polygons") or [])
        for point in polygon
        if isinstance(point, (list, tuple)) and len(point) == 2
    ]
    if not coordinates:
        return 0
    width = max(int(point[0]) for point in coordinates) + 4
    height = max(int(point[1]) for point in coordinates) + 4
    shape = (height, width)
    removed = []

    enclosed_space_names = (
        "욕실",
        "다용도실",
        "파우더룸",
        "드레스룸",
        "W.I.C",
        "WIC",
    )

    for fragment in list(rooms):
        if not str(fragment.get("room_name") or "").startswith("class_12"):
            continue
        candidates = [
            (_bbox_overlap_ratio(fragment, target), target)
            for target in rooms
            if target is not fragment
            and not str(target.get("room_name") or "").startswith("class_")
            and any(
                token in str(target.get("room_name") or "")
                for token in enclosed_space_names
            )
            and target.get("viewer_polygons")
        ]
        if not candidates:
            continue
        ratio, target = max(candidates, key=lambda item: item[0])
        if ratio < 0.82:
            continue

        target_mask = _polygon_mask(target.get("viewer_polygons"), shape)
        fragment_mask = _polygon_mask(fragment.get("viewer_polygons"), shape)
        combined = cv2.bitwise_or(target_mask, fragment_mask)
        polygons = _mask_polygons(combined)
        if not polygons:
            continue
        target["viewer_polygons"] = polygons
        target["viewer_geometry_source"] = "wall_grid_with_enclosed_space_merge"
        removed.append(fragment)

    for fragment in removed:
        rooms.remove(fragment)
    return len(removed)


def _fill_narrow_internal_gaps(rooms):
    """Assign only thin gaps trapped between two rendered room floors.

    The source wall grid can leave a wall-width zero strip between two room
    polygons.  Directional closing finds those strips without expanding the
    exterior silhouette.  Each strip is assigned to the adjacent room with
    the largest floor area; the shared wall is still rendered by the wall
    graph on top of the floor.
    """

    named_rooms = [
        room
        for room in rooms
        if room.get("viewer_polygons")
        and not str(room.get("room_name") or "").startswith("class_")
    ]
    coordinates = [
        point
        for room in named_rooms
        for polygon in room.get("viewer_polygons") or []
        for point in polygon
        if isinstance(point, (list, tuple)) and len(point) == 2
    ]
    if not coordinates:
        return 0

    width = max(int(point[0]) for point in coordinates) + 4
    height = max(int(point[1]) for point in coordinates) + 4
    shape = (height, width)
    extent = max(width, height)
    max_gap = max(10, min(34, int(round(extent * 0.0105))))

    masks = {
        id(room): _polygon_mask(room.get("viewer_polygons"), shape)
        for room in named_rooms
    }
    occupied = np.zeros(shape, dtype=np.uint8)
    for mask in masks.values():
        occupied = cv2.bitwise_or(occupied, mask)

    vertical = cv2.morphologyEx(
        occupied,
        cv2.MORPH_CLOSE,
        np.ones((max_gap + 1, 1), dtype=np.uint8),
    )
    horizontal = cv2.morphologyEx(
        occupied,
        cv2.MORPH_CLOSE,
        np.ones((1, max_gap + 1), dtype=np.uint8),
    )
    candidates = cv2.bitwise_and(cv2.bitwise_or(vertical, horizontal), cv2.bitwise_not(occupied))
    count, labels, stats, _ = cv2.connectedComponentsWithStats(candidates, 8)
    changed = 0

    for label_id in range(1, count):
        x, y, component_width, component_height, area = [
            int(value) for value in stats[label_id]
        ]
        short_side = min(component_width, component_height)
        long_side = max(component_width, component_height)
        if short_side > max_gap or long_side < short_side * 2 or area < 16:
            continue
        if area > max_gap * max(160, int(extent * 0.28)):
            continue

        component = (labels == label_id).astype(np.uint8) * 255
        ring = cv2.dilate(component, np.ones((5, 5), np.uint8), iterations=1)
        ring = cv2.bitwise_and(ring, cv2.bitwise_not(component))
        touching = []
        for room in named_rooms:
            mask = masks[id(room)]
            contact = cv2.countNonZero(cv2.bitwise_and(ring, mask))
            if contact:
                touching.append((contact, cv2.countNonZero(mask), room))
        if len(touching) < 2:
            continue

        touching_names = [
            str(item[2].get("room_name") or "").replace(" ", "")
            for item in touching
        ]
        # The visible zero-strip regression occurs where the interior living
        # floor meets a balcony floor.  Other inter-room strips are normally
        # covered by an internal wall and must retain their original geometry.
        if not (
            any("거실" in name for name in touching_names)
            and any("발코니" in name for name in touching_names)
        ):
            continue

        target_pool = [
            item
            for item in touching
            if (
                "거실" in str(item[2].get("room_name") or "").replace(" ", "")
                or "발코니" in str(item[2].get("room_name") or "").replace(" ", "")
            )
        ]
        _, _, target = max(target_pool, key=lambda item: (item[0], item[1]))
        combined = cv2.bitwise_or(masks[id(target)], component)
        polygons = _mask_polygons(combined)
        if not polygons:
            continue
        masks[id(target)] = combined
        target["viewer_polygons"] = polygons
        target["viewer_geometry_source"] = "wall_grid_with_narrow_gap_fill"
        occupied = cv2.bitwise_or(occupied, component)
        changed += 1

    return changed


_approved_apply_ocr_names = approved_main.base.apply_ocr_display_names


def _apply_ocr_names_with_enclosed_merge(rooms, ocr_result):
    result = _approved_apply_ocr_names(rooms, ocr_result)
    _postprocess_display_rooms(rooms)
    return result


def _postprocess_display_rooms(rooms):
    """Apply the 8004-only room cleanup even when SPA already supplied OCR names.

    The team pipeline intentionally avoids a second OCR request in viewer3d.
    Keeping the cleanup independent from that optional OCR hook preserves the
    approved 8004 geometry while retaining the faster single-OCR call path.
    """

    if _is_legacy_solid_line_result(rooms):
        _remove_tiny_room_fragments(rooms)
        _snap_thin_room_overlaps(rooms)
    else:
        _merge_enclosed_anonymous_regions(rooms)
        _fill_narrow_internal_gaps(rooms)


approved_main.base.apply_ocr_display_names = _apply_ocr_names_with_enclosed_merge

_source = approved_main._VIEWERWALL_JAVASCRIPT

_floor_helper_marker = "function addPolygonRoom(points, color, roomName, transform, room) {"
_floor_helper = r"""
function cleanLegacyShallowFloorSteps(vertices, room) {
  if (!room || room.viewer_geometry_source !== "original_wall_grid" || vertices.length < 6) {
    return vertices;
  }
  const axisTolerance = currentExtent * .0015;
  const stepLimit = currentExtent * .022;
  const longSideMin = stepLimit * 2.4;
  const points = vertices.map((point) => ({ ...point }));
  const length = (start, end) => Math.hypot(end.x - start.x, end.z - start.z);
  const horizontal = (start, end) => Math.abs(end.z - start.z) <= axisTolerance;
  const vertical = (start, end) => Math.abs(end.x - start.x) <= axisTolerance;

  for (let pass = 0; pass < 3 && points.length >= 6; pass += 1) {
    let changed = false;
    for (let index = 0; index < points.length; index += 1) {
      const beforeIndex = (index - 1 + points.length) % points.length;
      const afterIndex = (index + 1) % points.length;
      const afterAfterIndex = (index + 2) % points.length;
      const before = points[beforeIndex];
      const start = points[index];
      const end = points[afterIndex];
      const after = points[afterAfterIndex];
      const connectorLength = length(start, end);
      const beforeLength = length(before, start);
      const afterLength = length(end, after);
      if (connectorLength <= axisTolerance || connectorLength > stepLimit) continue;
      if (beforeLength < longSideMin || afterLength < longSideMin) continue;

      const verticalStep = vertical(start, end)
        && horizontal(before, start) && horizontal(end, after);
      const horizontalStep = horizontal(start, end)
        && vertical(before, start) && vertical(end, after);
      if (!verticalStep && !horizontalStep) continue;

      if (verticalStep) {
        const targetZ = beforeLength >= afterLength ? start.z : end.z;
        if (beforeLength >= afterLength) {
          end.z = targetZ;
          after.z = targetZ;
        } else {
          before.z = targetZ;
          start.z = targetZ;
        }
      } else {
        const targetX = beforeLength >= afterLength ? start.x : end.x;
        if (beforeLength >= afterLength) {
          end.x = targetX;
          after.x = targetX;
        } else {
          before.x = targetX;
          start.x = targetX;
        }
      }
      changed = true;
      break;
    }
    if (!changed) break;
    for (let index = points.length - 1; index >= 0; index -= 1) {
      const next = points[(index + 1) % points.length];
      if (length(points[index], next) <= axisTolerance) points.splice(index, 1);
    }
  }
  return points.length >= 3 ? points : vertices;
}

"""
if _floor_helper_marker not in _source:
    raise RuntimeError("viewer floor cleanup marker was not found")
_source = _source.replace(
    _floor_helper_marker,
    _floor_helper + _floor_helper_marker,
    1,
)
_source = _source.replace(
    """  const vertices = points.map(([x, y]) => ({
    x: (x - centerX) * scale,
    z: (y - centerY) * scale,
  }));
  const shape = new THREE.Shape();""",
    """  let vertices = points.map(([x, y]) => ({
    x: (x - centerX) * scale,
    z: (y - centerY) * scale,
  }));
  vertices = cleanLegacyShallowFloorSteps(vertices, room);
  const shape = new THREE.Shape();""",
    1,
)

_source = _source.replace(
    "  addContourWalls(vertices, roomName);",
    "  addContourWalls(vertices, roomName, room);",
    1,
)
_source = _source.replace(
    "function addContourWalls(vertices, roomName) {",
    "function addContourWalls(vertices, roomName, room) {",
    1,
)
_source = _source.replace(
    "  pendingWallPolygons.push({ vertices, roomName });",
    "  const roomSource = room && room.viewer_geometry_source;\n  pendingWallPolygons.push({ vertices, roomName, roomSource });",
    1,
)
_source = _source.replace(
    "    pendingWallSegments.push({ start, end, roomName });",
    "    pendingWallSegments.push({ start, end, roomName, roomSource });",
    1,
)

_helper_marker = "function renderContourWalls() {"
_helper = r"""
function buildContinuousWallGraph(sourceSegments, wallThickness) {
  const axisTolerance = wallThickness * .58;
  const joinTolerance = wallThickness * .72;
  const axis = [];
  const diagonal = [];

  sourceSegments.forEach((segment) => {
    const dx = segment.end.x - segment.start.x;
    const dz = segment.end.z - segment.start.z;
    const length = Math.hypot(dx, dz);
    if (length < wallThickness * .72) return;
    if (Math.abs(dz) <= axisTolerance) {
      axis.push({
        orientation: "h",
        coordinate: (segment.start.z + segment.end.z) / 2,
        from: Math.min(segment.start.x, segment.end.x),
        to: Math.max(segment.start.x, segment.end.x),
        roomName: segment.roomName,
      });
    } else if (Math.abs(dx) <= axisTolerance) {
      axis.push({
        orientation: "v",
        coordinate: (segment.start.x + segment.end.x) / 2,
        from: Math.min(segment.start.z, segment.end.z),
        to: Math.max(segment.start.z, segment.end.z),
        roomName: segment.roomName,
      });
    } else {
      diagonal.push(segment);
    }
  });

  const rows = [];
  axis
    .sort((a, b) => a.orientation.localeCompare(b.orientation)
      || a.coordinate - b.coordinate || a.from - b.from)
    .forEach((item) => {
      let row = rows.find((candidate) => (
        candidate.orientation === item.orientation
        && Math.abs(candidate.coordinate - item.coordinate) <= axisTolerance
      ));
      if (!row) {
        row = { orientation: item.orientation, coordinate: item.coordinate, items: [] };
        rows.push(row);
      } else {
        row.coordinate = (
          row.coordinate * row.items.length + item.coordinate
        ) / (row.items.length + 1);
      }
      row.items.push(item);
    });

  const merged = [];
  rows.forEach((row) => {
    const intervals = row.items.sort((a, b) => a.from - b.from || a.to - b.to);
    let active = null;
    intervals.forEach((interval) => {
      if (!active || interval.from > active.to + joinTolerance) {
        if (active) merged.push(active);
        active = {
          orientation: row.orientation,
          coordinate: row.coordinate,
          from: interval.from,
          to: interval.to,
          roomNames: new Set([interval.roomName]),
        };
      } else {
        active.to = Math.max(active.to, interval.to);
        active.roomNames.add(interval.roomName);
      }
    });
    if (active) merged.push(active);
  });

  const result = merged.map((item) => ({
    start: item.orientation === "h"
      ? { x: item.from, z: item.coordinate }
      : { x: item.coordinate, z: item.from },
    end: item.orientation === "h"
      ? { x: item.to, z: item.coordinate }
      : { x: item.coordinate, z: item.to },
    roomName: Array.from(item.roomNames).join("|"),
    orientation: item.orientation,
  }));

  // Connect only tiny endpoint gaps to a perpendicular wall.  This closes
  // T-junctions without extending a wall across a doorway or open room.
  result.forEach((segment) => {
    ["start", "end"].forEach((side) => {
      const point = segment[side];
      let best = null;
      result.forEach((other) => {
        if (other === segment || other.orientation === segment.orientation) return;
        const crossing = segment.orientation === "h"
          ? { x: other.start.x, z: segment.start.z }
          : { x: segment.start.x, z: other.start.z };
        const otherMin = other.orientation === "h"
          ? Math.min(other.start.x, other.end.x)
          : Math.min(other.start.z, other.end.z);
        const otherMax = other.orientation === "h"
          ? Math.max(other.start.x, other.end.x)
          : Math.max(other.start.z, other.end.z);
        const crossValue = other.orientation === "h" ? crossing.x : crossing.z;
        if (crossValue < otherMin - axisTolerance || crossValue > otherMax + axisTolerance) return;
        const distance = Math.hypot(point.x - crossing.x, point.z - crossing.z);
        if (distance <= joinTolerance && (!best || distance < best.distance)) {
          best = { crossing, distance };
        }
      });
      if (best) segment[side] = best.crossing;
    });
  });

  return result.concat(diagonal);
}

function collapseLegacyShallowSteps(sourceSegments, wallThickness) {
  const axisTolerance = wallThickness * .7;
  const stepLimit = Math.max(wallThickness * 3.2, currentExtent * .022);
  const longSideMin = stepLimit * 2.4;
  const cloned = sourceSegments.map((segment) => ({
    ...segment,
    start: { ...segment.start },
    end: { ...segment.end },
  }));
  const near = (a, b) => Math.abs(a - b) <= axisTolerance;
  const lengthOf = (segment) => Math.hypot(
    segment.end.x - segment.start.x,
    segment.end.z - segment.start.z,
  );
  const horizontal = (segment) => Math.abs(segment.end.z - segment.start.z) <= axisTolerance;
  const vertical = (segment) => Math.abs(segment.end.x - segment.start.x) <= axisTolerance;
  const touches = (segment, point) => (
    Math.hypot(segment.start.x - point.x, segment.start.z - point.z) <= axisTolerance * 1.8
    || Math.hypot(segment.end.x - point.x, segment.end.z - point.z) <= axisTolerance * 1.8
  );

  cloned.forEach((connector) => {
    const connectorLength = lengthOf(connector);
    if (connectorLength <= axisTolerance || connectorLength > stepLimit) return;
    const isVerticalConnector = vertical(connector);
    const isHorizontalConnector = horizontal(connector);
    if (!isVerticalConnector && !isHorizontalConnector) return;

    const firstSides = cloned.filter((candidate) => (
      candidate !== connector
      && (isVerticalConnector ? horizontal(candidate) : vertical(candidate))
      && lengthOf(candidate) >= longSideMin
      && touches(candidate, connector.start)
    ));
    const secondSides = cloned.filter((candidate) => (
      candidate !== connector
      && (isVerticalConnector ? horizontal(candidate) : vertical(candidate))
      && lengthOf(candidate) >= longSideMin
      && touches(candidate, connector.end)
    ));
    if (!firstSides.length || !secondSides.length) return;

    const first = firstSides.sort((a, b) => lengthOf(b) - lengthOf(a))[0];
    const second = secondSides.sort((a, b) => lengthOf(b) - lengthOf(a))[0];
    if (first === second) return;
    const target = lengthOf(first) >= lengthOf(second) ? first : second;

    if (isVerticalConnector) {
      const oldA = (first.start.z + first.end.z) / 2;
      const oldB = (second.start.z + second.end.z) / 2;
      const targetZ = (target.start.z + target.end.z) / 2;
      const moved = [];
      cloned.forEach((segment) => {
        if (horizontal(segment)) {
          const z = (segment.start.z + segment.end.z) / 2;
          if (near(z, oldA) || near(z, oldB)) {
            const minX = Math.min(segment.start.x, segment.end.x);
            const maxX = Math.max(segment.start.x, segment.end.x);
            if (connector.start.x >= minX - stepLimit && connector.start.x <= maxX + stepLimit) {
              moved.push({
                oldStart: { ...segment.start },
                oldEnd: { ...segment.end },
              });
              segment.start.z = targetZ;
              segment.end.z = targetZ;
            }
          }
        }
      });
      moved.forEach(({ oldStart, oldEnd }) => {
        cloned.forEach((segment) => {
          ["start", "end"].forEach((side) => {
            const point = segment[side];
            const attachedToStart = near(point.x, oldStart.x) && near(point.z, oldStart.z);
            const attachedToEnd = near(point.x, oldEnd.x) && near(point.z, oldEnd.z);
            if (attachedToStart || attachedToEnd) point.z = targetZ;
          });
        });
      });
    } else {
      const oldA = (first.start.x + first.end.x) / 2;
      const oldB = (second.start.x + second.end.x) / 2;
      const targetX = (target.start.x + target.end.x) / 2;
      const moved = [];
      cloned.forEach((segment) => {
        if (vertical(segment)) {
          const x = (segment.start.x + segment.end.x) / 2;
          if (near(x, oldA) || near(x, oldB)) {
            const minZ = Math.min(segment.start.z, segment.end.z);
            const maxZ = Math.max(segment.start.z, segment.end.z);
            if (connector.start.z >= minZ - stepLimit && connector.start.z <= maxZ + stepLimit) {
              moved.push({
                oldStart: { ...segment.start },
                oldEnd: { ...segment.end },
              });
              segment.start.x = targetX;
              segment.end.x = targetX;
            }
          }
        }
      });
      moved.forEach(({ oldStart, oldEnd }) => {
        cloned.forEach((segment) => {
          ["start", "end"].forEach((side) => {
            const point = segment[side];
            const attachedToStart = near(point.x, oldStart.x) && near(point.z, oldStart.z);
            const attachedToEnd = near(point.x, oldEnd.x) && near(point.z, oldEnd.z);
            if (attachedToStart || attachedToEnd) point.x = targetX;
          });
        });
      });
    }
  });

  return cloned.filter((segment) => lengthOf(segment) > axisTolerance);
}

function buildLegacySolidLineWallSegments(sourceSegments, wallThickness) {
  const axisTolerance = wallThickness * .7;
  const minPartLength = wallThickness * .85;
  const isLegacyLivingName = (name) => /거실/.test(String(name || ""));
  const isLegacyKitchenName = (name) => /주방|식당/.test(String(name || ""));
  const isLegacyOpenPlanPair = (firstName, secondName) => (
    (isLegacyLivingName(firstName) && isLegacyKitchenName(secondName))
    || (isLegacyKitchenName(firstName) && isLegacyLivingName(secondName))
  );
  const isLegacyRemovedOpenPlanDiagonal = (segment) => {
    const dx = segment.end.x - segment.start.x;
    const dz = segment.end.z - segment.start.z;
    const length = Math.hypot(dx, dz);
    return (
      Math.abs(dx) > wallThickness * 1.5
      && Math.abs(dz) > wallThickness * 1.5
      && length < Math.max(.56, currentExtent * .047)
      && /거실|주방|식당/.test(String(segment.roomName || ""))
    );
  };
  const clamp01 = (value) => Math.max(0, Math.min(1, value));
  const subtractInterval = (parts, rawFrom, rawTo) => {
    const from = clamp01(Math.min(rawFrom, rawTo));
    const to = clamp01(Math.max(rawFrom, rawTo));
    if (to - from <= .001) return parts;
    const next = [];
    parts.forEach((part) => {
      if (to <= part.from || from >= part.to) {
        next.push(part);
        return;
      }
      if (from > part.from) next.push({ from: part.from, to: from });
      if (to < part.to) next.push({ from: to, to: part.to });
    });
    return next;
  };
  const boundsOf = (vertices) => vertices.reduce((bounds, point) => ({
    minX: Math.min(bounds.minX, point.x),
    maxX: Math.max(bounds.maxX, point.x),
    minZ: Math.min(bounds.minZ, point.z),
    maxZ: Math.max(bounds.maxZ, point.z),
  }), {
    minX: Infinity,
    maxX: -Infinity,
    minZ: Infinity,
    maxZ: -Infinity,
  });
  const ratioAt = (coord, startCoord, endCoord) => {
    const denom = endCoord - startCoord;
    if (Math.abs(denom) < 1e-6) return 0;
    return clamp01((coord - startCoord) / denom);
  };
  const interpolate = (segment, ratio) => ({
    x: segment.start.x + (segment.end.x - segment.start.x) * ratio,
    z: segment.start.z + (segment.end.z - segment.start.z) * ratio,
  });

  const result = [];
  collapseLegacyShallowSteps(sourceSegments, wallThickness).forEach((segment) => {
    if (isLegacyRemovedOpenPlanDiagonal(segment)) return;

    const dx = segment.end.x - segment.start.x;
    const dz = segment.end.z - segment.start.z;
    const length = Math.hypot(dx, dz);
    if (length < minPartLength) return;

    const vertical = Math.abs(dx) <= axisTolerance;
    const horizontal = Math.abs(dz) <= axisTolerance;
    if (!vertical && !horizontal) {
      if (!segmentRunsThroughOpenPlanRoom(segment, wallThickness)) result.push(segment);
      return;
    }

    let parts = [{ from: 0, to: 1 }];
    pendingWallPolygons.forEach((polygon) => {
      if (!isLegacyOpenPlanPair(segment.roomName, polygon.roomName)) return;
      const bounds = boundsOf(polygon.vertices);

      if (vertical) {
        const x = (segment.start.x + segment.end.x) / 2;
        if (x < bounds.minX - wallThickness * 1.6 || x > bounds.maxX + wallThickness * 1.6) return;
        const cutMin = Math.max(Math.min(segment.start.z, segment.end.z), bounds.minZ);
        const cutMax = Math.min(Math.max(segment.start.z, segment.end.z), bounds.maxZ);
        if (cutMax - cutMin < minPartLength) return;
        parts = subtractInterval(
          parts,
          ratioAt(cutMin, segment.start.z, segment.end.z),
          ratioAt(cutMax, segment.start.z, segment.end.z),
        );
      } else if (horizontal) {
        const z = (segment.start.z + segment.end.z) / 2;
        if (z < bounds.minZ - wallThickness * 1.6 || z > bounds.maxZ + wallThickness * 1.6) return;
        const cutMin = Math.max(Math.min(segment.start.x, segment.end.x), bounds.minX);
        const cutMax = Math.min(Math.max(segment.start.x, segment.end.x), bounds.maxX);
        if (cutMax - cutMin < minPartLength) return;
        parts = subtractInterval(
          parts,
          ratioAt(cutMin, segment.start.x, segment.end.x),
          ratioAt(cutMax, segment.start.x, segment.end.x),
        );
      }
    });

    parts.forEach((part) => {
      if (length * (part.to - part.from) < minPartLength) return;
      result.push({
        ...segment,
        start: interpolate(segment, part.from),
        end: interpolate(segment, part.to),
      });
    });
  });

  return result;
}

"""

if _helper_marker not in _source:
    raise RuntimeError("viewer wall graph helper marker was not found")
_source = _source.replace(_helper_marker, _helper + _helper_marker, 1)

_graph_marker = """  const removedBoundaryEndpoints = pendingWallSegments
    .filter((segment) => (
      isRemovedOpenPlanDiagonal(segment)
      || segmentRunsThroughOpenPlanRoom(segment, wallThickness)
    ))
    .flatMap((segment) => [segment.start, segment.end]);"""
_graph_replacement = _graph_marker + r"""
  const legacySolidLineWallMode = (() => {
    const namedSegments = pendingWallSegments.filter((segment) => (
      segment.roomSource && !String(segment.roomName || "").startsWith("class_")
    ));
    if (namedSegments.length < 18) return false;
    const wallGridSegments = namedSegments.filter((segment) => (
      segment.roomSource === "original_wall_grid"
    )).length;
    return wallGridSegments / Math.max(1, namedSegments.length) >= .72;
  })();
  const drawableWallSegments = pendingWallSegments.filter((segment, segmentIndex) => {
    if (isRemovedOpenPlanDiagonal(segment)) return false;
    if (segmentRunsThroughOpenPlanRoom(segment, wallThickness)) return false;
    return !pendingWallSegments.some((other, otherIndex) => (
      otherIndex !== segmentIndex && segmentsShareOpenBoundary(segment, other)
    ));
  });
  const renderWallSegments = legacySolidLineWallMode
    ? buildLegacySolidLineWallSegments(pendingWallSegments, wallThickness)
    : buildContinuousWallGraph(drawableWallSegments, wallThickness);"""
if _graph_marker not in _source:
    raise RuntimeError("viewer wall graph insertion marker was not found")
_source = _source.replace(_graph_marker, _graph_replacement, 1)

_source = _source.replace(
    "const endpointHitsWallInterior = (point, segmentIndex, segment) => pendingWallSegments.some((other, otherIndex) => {",
    "const endpointHitsWallInterior = (point, segmentIndex, segment) => renderWallSegments.some((other, otherIndex) => {",
    1,
)
_source = _source.replace(
    "  pendingWallSegments.forEach((segment, segmentIndex) => {",
    "  renderWallSegments.forEach((segment, segmentIndex) => {",
    1,
)

# Open-plan boundaries were removed before graph construction, so the two
# request-time checks below are intentionally neutralized for merged names.
_source = _source.replace(
    """    if (pendingWallSegments.some((other, otherIndex) =>
      otherIndex !== segmentIndex && segmentsShareOpenBoundary(segment, other)
    )) return;
    if (segmentRunsThroughOpenPlanRoom(segment, wallThickness)) return;""",
    """    // Open-plan candidates were filtered before canonical merging.""",
    1,
)

# A canonical T-junction reaches the crossing wall centre.  Do not shorten it
# again; the two wall boxes overlap by half their thickness and stay closed.
_source = _source.replace(
    """      startHitsWallInterior ? -wallThickness * .52 : 0,
      endHitsWallInterior ? -wallThickness * .52 : 0""",
    """      legacySolidLineWallMode
        ? (startHitsWallInterior ? -wallThickness * .52 : 0)
        : (startTouchesRemoved ? 0 : wallThickness * .10),
      legacySolidLineWallMode
        ? (endHitsWallInterior ? -wallThickness * .52 : 0)
        : (endTouchesRemoved ? 0 : wallThickness * .10)""",
    1,
)
_source = _source.replace(
    """      startHitsWallInterior ? -wallThickness * .62 : 0,
      endHitsWallInterior ? -wallThickness * .62 : 0""",
    """      legacySolidLineWallMode
        ? (startHitsWallInterior ? -wallThickness * .62 : 0)
        : (startTouchesRemoved ? 0 : wallThickness * .13),
      legacySolidLineWallMode
        ? (endHitsWallInterior ? -wallThickness * .62 : 0)
        : (endTouchesRemoved ? 0 : wallThickness * .13)""",
    1,
)

approved_main._VIEWERWALL_JAVASCRIPT = _source


async def _viewerwall_index_no_cache(_request):
    """Serve 8004 with a fresh asset version after wall-render patches."""

    source = (approved_main.base.STATIC_DIR / "index.html").read_text(encoding="utf-8")
    source = source.replace(
        "/static/styles.css?v=shape-15-square-tooltip",
        "/static/styles.css?v=viewerwall-linefix-20260820f",
    )
    source = source.replace(
        "/static/viewer.js?v=shape-40-tap-click-tooltip",
        "/static/viewer.js?v=viewerwall-linefix-20260820f",
    )
    return Response(
        source,
        media_type="text/html",
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
        },
    )


approved_main.base.app.router.routes.insert(
    0, Route("/", endpoint=_viewerwall_index_no_cache, methods=["GET"])
)


_original_analyze_endpoint = next(
    route.endpoint
    for route in approved_main.base.app.router.routes
    if getattr(route, "path", None) == "/api/analyze"
    and "POST" in getattr(route, "methods", set())
)


async def _analyze_cached(file: UploadFile = File(...)):
    """Reuse completed results while leaving the original analysis untouched."""

    if file.content_type not in {"image/jpeg", "image/png"}:
        raise HTTPException(415, "PNG 또는 JPG 평면도만 사용할 수 있습니다.")

    content = await file.read()
    cache_key = hashlib.sha256(
        (file.content_type + "\0").encode("utf-8") + content
    ).hexdigest()

    async with _analysis_cache_lock:
        cached = _analysis_cache.get(cache_key)
        if cached is not None:
            _analysis_cache.move_to_end(cache_key)
            return copy.deepcopy(cached)

    # The endpoint reads the upload itself, so rewind after hashing it.  Every
    # first-time result is therefore still produced by the approved pipeline.
    await file.seek(0)
    result = await _original_analyze_endpoint(file)
    try:
        # The approved 8003/8004 result performs one final OCR-to-room anchor
        # pass after SPA geometry is ready.  Keep this refinement in the
        # display wrapper instead of restoring the duplicate call in the
        # shared viewer3d base used by the team pipeline.
        ocr_response = requests.post(
            f"{approved_main.base.OCR_URL}/ocr",
            files={
                "file": (
                    file.filename or "floorplan.png",
                    content,
                    file.content_type,
                )
            },
            data={"rotate_clockwise": "false"},
            timeout=240,
        )
        ocr_response.raise_for_status()
        approved_main.base.apply_ocr_display_names(
            result.get("rooms", []), ocr_response.json()
        )
    except (requests.RequestException, ValueError, json.JSONDecodeError):
        # Geometry remains usable if the optional refinement call is down.
        _postprocess_display_rooms(result.get("rooms", []))
    async with _analysis_cache_lock:
        _analysis_cache[cache_key] = copy.deepcopy(result)
        _analysis_cache.move_to_end(cache_key)
        while len(_analysis_cache) > _ANALYSIS_CACHE_LIMIT:
            _analysis_cache.popitem(last=False)
    return result


# Keep the approved endpoint intact and place only the cache wrapper before it.
approved_main.base.app.post("/api/analyze", include_in_schema=False)(
    _analyze_cached
)
_cached_analyze_route = approved_main.base.app.router.routes.pop()
approved_main.base.app.router.routes.insert(0, _cached_analyze_route)
