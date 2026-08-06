"""Experimental 8004 viewer using original drawing walls as display geometry.

The OCR and SPA services remain unchanged.  This module reuses the stable
8003 application and swaps only its display-only polygon postprocessor.
"""

import cv2
import numpy as np
from fastapi.responses import Response
from starlette.routing import Route

from base_app import main as base


def _cluster_coordinates(values, tolerance):
    values = sorted(float(value) for value in values)
    if not values:
        return []
    groups = [[values[0]]]
    for value in values[1:]:
        if value - groups[-1][-1] <= tolerance:
            groups[-1].append(value)
        else:
            groups.append([value])
    return [int(round(float(np.median(group)))) for group in groups]


def _nearest_segment_coordinate(lines, coordinate, span_start, span_end, tolerance):
    low, high = sorted((float(span_start), float(span_end)))
    candidates = []
    for line in lines:
        overlap = min(high, float(line["end"])) - max(low, float(line["start"]))
        if overlap < max(10.0, (high - low) * 0.22):
            continue
        distance = abs(float(line["coord"]) - float(coordinate))
        if distance <= tolerance:
            candidates.append((distance, -float(line["length"]), float(line["coord"])))
    return min(candidates)[2] if candidates else float(coordinate)


def _polygon_mask(polygon, shape):
    mask = np.zeros(shape, dtype=np.uint8)
    contour = np.asarray(polygon, dtype=np.int32).reshape((-1, 1, 2))
    cv2.fillPoly(mask, [contour], 255)
    return mask


def _significant_grid_coordinates(polygon, horizontal, vertical, image_shape):
    contour = np.asarray(polygon, dtype=np.int32).reshape((-1, 1, 2))
    perimeter = cv2.arcLength(contour, True)
    simplified = cv2.approxPolyDP(
        contour, max(2.0, perimeter * 0.0035), True
    ).reshape((-1, 2))
    if len(simplified) < 4:
        return [], []

    height, width = image_shape
    snap_tolerance = max(10.0, min(30.0, min(image_shape) * 0.0075))
    minimum_edge = max(10.0, min(image_shape) * 0.004)
    x_values = []
    y_values = []
    count = len(simplified)
    for index in range(count):
        start = simplified[index].astype(float)
        end = simplified[(index + 1) % count].astype(float)
        dx = float(end[0] - start[0])
        dy = float(end[1] - start[1])
        if abs(dx) >= minimum_edge and abs(dx) >= abs(dy) * 2.0:
            coordinate = (start[1] + end[1]) / 2.0
            y_values.append(
                _nearest_segment_coordinate(
                    horizontal, coordinate, start[0], end[0], snap_tolerance
                )
            )
        elif abs(dy) >= minimum_edge and abs(dy) >= abs(dx) * 2.0:
            coordinate = (start[0] + end[0]) / 2.0
            x_values.append(
                _nearest_segment_coordinate(
                    vertical, coordinate, start[1], end[1], snap_tolerance
                )
            )

    xs = [int(point[0]) for point in simplified]
    ys = [int(point[1]) for point in simplified]
    x_values.extend([min(xs), max(xs)])
    y_values.extend([min(ys), max(ys)])
    cluster_tolerance = max(4.0, min(14.0, min(image_shape) * 0.0035))
    x_values = [max(0, min(width - 1, value)) for value in x_values]
    y_values = [max(0, min(height - 1, value)) for value in y_values]
    return (
        _cluster_coordinates(x_values, cluster_tolerance),
        _cluster_coordinates(y_values, cluster_tolerance),
    )


def _grid_rectified_polygon(polygon, horizontal, vertical, image_shape):
    if len(polygon) < 4:
        return None
    source_mask = _polygon_mask(polygon, image_shape)
    source_area = float(cv2.countNonZero(source_mask))
    if source_area < 100:
        return None

    x_coordinates, y_coordinates = _significant_grid_coordinates(
        polygon, horizontal, vertical, image_shape
    )
    if len(x_coordinates) < 2 or len(y_coordinates) < 2:
        return None

    result_mask = np.zeros(image_shape, dtype=np.uint8)
    for x0, x1 in zip(x_coordinates[:-1], x_coordinates[1:]):
        if x1 - x0 < 2:
            continue
        for y0, y1 in zip(y_coordinates[:-1], y_coordinates[1:]):
            if y1 - y0 < 2:
                continue
            cell = source_mask[y0:y1, x0:x1]
            cell_area = float(cell.size)
            if cell_area <= 0:
                continue
            overlap = float(cv2.countNonZero(cell)) / cell_area
            if overlap >= 0.46:
                cv2.rectangle(result_mask, (x0, y0), (x1, y1), 255, thickness=-1)

    contours, _ = cv2.findContours(
        result_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    if not contours:
        return None
    contour = max(contours, key=cv2.contourArea)
    result_area = float(cv2.contourArea(contour))
    area_ratio = result_area / max(source_area, 1.0)
    if not 0.82 <= area_ratio <= 1.18:
        return None

    points = [[int(point[0][0]), int(point[0][1])] for point in contour]
    points = base.remove_redundant_polygon_points(points)
    if len(points) < 4:
        return None
    return points


def _rectify_small_service_room_corner(room_name, polygon):
    """Fill a minor missing corner in compact utility-room display geometry."""
    normalized_name = str(room_name or "").replace(" ", "")
    if "다용도실" not in normalized_name or len(polygon) != 6:
        return polygon, False

    contour = np.asarray(polygon, dtype=np.int32).reshape((-1, 1, 2))
    area = float(abs(cv2.contourArea(contour)))
    x, y, width, height = cv2.boundingRect(contour)
    rectangle_area = float(max(0, width - 1) * max(0, height - 1))
    if area <= 0 or rectangle_area <= area:
        return polygon, False
    missing_ratio = (rectangle_area - area) / rectangle_area
    if missing_ratio > 0.10:
        return polygon, False

    return [
        [x, y],
        [x + width - 1, y],
        [x + width - 1, y + height - 1],
        [x, y + height - 1],
    ], True


def _snap_micro_wall_offsets(rooms, image_shape):
    """Align only near-identical display wall coordinates.

    Wall detection can return the same wall at y=1442 for one room and y=1443
    for its neighbour.  Three.js then renders the one-pixel disagreement as a
    short tooth at the joint.  Cluster only coordinates within a very small
    tolerance and reject any polygon whose area changes materially.  This is
    display-only and never changes SPA masks or pixel counts.
    """
    tolerance = max(2.0, min(4.0, min(image_shape) * 0.0012))
    minimum_edge = max(10.0, min(image_shape) * 0.003)
    horizontal_values = []
    vertical_values = []

    for room in rooms:
        for polygon in room.get("viewer_polygons") or []:
            count = len(polygon)
            for index in range(count):
                start = polygon[index]
                end = polygon[(index + 1) % count]
                dx = abs(float(end[0] - start[0]))
                dy = abs(float(end[1] - start[1]))
                if dx >= minimum_edge and dy <= tolerance:
                    horizontal_values.append((float(start[1]) + float(end[1])) / 2.0)
                elif dy >= minimum_edge and dx <= tolerance:
                    vertical_values.append((float(start[0]) + float(end[0])) / 2.0)

    horizontal_targets = _cluster_coordinates(horizontal_values, tolerance)
    vertical_targets = _cluster_coordinates(vertical_values, tolerance)

    def nearest(value, targets):
        candidates = [target for target in targets if abs(float(target) - value) <= tolerance]
        return min(candidates, key=lambda target: abs(float(target) - value)) if candidates else value

    changed = 0
    for room in rooms:
        polygons = room.get("viewer_polygons") or []
        for polygon_index, polygon in enumerate(polygons):
            if len(polygon) < 4:
                continue
            original_area = base.polygon_area(polygon)
            adjusted = []
            count = len(polygon)
            for index, point in enumerate(polygon):
                previous = polygon[index - 1]
                following = polygon[(index + 1) % count]
                x = float(point[0])
                y = float(point[1])
                if (
                    abs(float(previous[0]) - x) <= tolerance
                    or abs(float(following[0]) - x) <= tolerance
                ):
                    x = nearest(x, vertical_targets)
                if (
                    abs(float(previous[1]) - y) <= tolerance
                    or abs(float(following[1]) - y) <= tolerance
                ):
                    y = nearest(y, horizontal_targets)
                adjusted.append([int(round(x)), int(round(y))])

            adjusted = base.remove_redundant_polygon_points(adjusted)
            adjusted, _ = base.clean_viewer_micro_notches(adjusted, image_shape)
            adjusted_area = base.polygon_area(adjusted)
            if (
                len(adjusted) < 4
                or original_area <= 0
                or abs(adjusted_area - original_area) / original_area > 0.006
            ):
                continue
            if adjusted != polygon:
                polygons[polygon_index] = adjusted
                changed += 1

    return changed


def _snap_utility_room_bottom_to_neighbor(rooms, image_shape):
    """Remove a tiny display-only gap below a rectangular utility room.

    Opposite sides of the same source wall can be detected a few pixels apart.
    Only the lower edge of a compact ``다용도실`` rectangle is considered, and
    it is moved only when a neighbouring horizontal edge overlaps most of the
    room width and is within the conservative wall-thickness tolerance.
    """
    tolerance = max(6.0, min(14.0, min(image_shape) * 0.0035))
    changed = 0
    for room in rooms:
        room_name = str(room.get("room_name") or "").replace(" ", "")
        if "\ub2e4\uc6a9\ub3c4\uc2e4" not in room_name:
            continue
        polygons = room.get("viewer_polygons") or []
        for polygon_index, polygon in enumerate(polygons):
            if len(polygon) != 4:
                continue
            xs = [int(point[0]) for point in polygon]
            ys = [int(point[1]) for point in polygon]
            left, right = min(xs), max(xs)
            bottom = max(ys)
            width = right - left
            if width <= 0:
                continue

            candidates = []
            for other in rooms:
                if other is room:
                    continue
                for other_polygon in other.get("viewer_polygons") or []:
                    count = len(other_polygon)
                    for edge_index in range(count):
                        start = other_polygon[edge_index]
                        end = other_polygon[(edge_index + 1) % count]
                        if int(start[1]) != int(end[1]):
                            continue
                        candidate_y = int(start[1])
                        distance = abs(candidate_y - bottom)
                        if not 0 < distance <= tolerance:
                            continue
                        edge_left, edge_right = sorted((int(start[0]), int(end[0])))
                        overlap = min(right, edge_right) - max(left, edge_left)
                        if overlap < width * 0.45:
                            continue
                        candidates.append((distance, -overlap, candidate_y))

            if not candidates:
                continue
            target_y = min(candidates)[2]
            polygons[polygon_index] = [
                [int(x), target_y if int(y) == bottom else int(y)]
                for x, y in polygon
            ]
            changed += 1
    return changed


def _bridge_utility_floor_to_living(rooms, image_shape):
    """Fill only the tiny display gap below a utility-room corner.

    The utility room and living room can use opposite sides of the same source
    wall, leaving a narrow uncovered strip in the rendered floor.  This joins
    that strip to the living-room display polygon without changing SPA masks or
    pixel statistics.
    """
    utility_rooms = [
        room for room in rooms
        if "\ub2e4\uc6a9\ub3c4\uc2e4" in str(room.get("room_name") or "").replace(" ", "")
    ]
    living_rooms = [
        room for room in rooms
        if "\uac70\uc2e4" in str(room.get("room_name") or "").replace(" ", "")
    ]
    max_gap = max(12, min(36, int(round(min(image_shape) * 0.0105))))
    changed = 0

    for utility in utility_rooms:
        for utility_polygon in utility.get("viewer_polygons") or []:
            if len(utility_polygon) != 4:
                continue
            ux = [int(point[0]) for point in utility_polygon]
            uy = [int(point[1]) for point in utility_polygon]
            left, right, bottom = min(ux), max(ux), max(uy)
            if right - left < 20:
                continue

            for living in living_rooms:
                polygons = living.get("viewer_polygons") or []
                for polygon_index, living_polygon in enumerate(polygons):
                    lx = [int(point[0]) for point in living_polygon]
                    ly = [int(point[1]) for point in living_polygon]
                    if max(lx) <= left or min(lx) >= right or max(ly) <= bottom:
                        continue
                    lower_edges = sorted({
                        int(y) for y in ly if bottom < int(y) <= bottom + max_gap
                    })
                    if not lower_edges:
                        continue
                    gap_bottom = lower_edges[0]

                    source_mask = _polygon_mask(living_polygon, image_shape)
                    before = float(cv2.countNonZero(source_mask))
                    cv2.rectangle(
                        source_mask,
                        (left, bottom),
                        (right, gap_bottom),
                        255,
                        thickness=-1,
                    )
                    contours, _ = cv2.findContours(
                        source_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
                    )
                    if not contours:
                        continue
                    contour = max(contours, key=cv2.contourArea)
                    after = float(cv2.contourArea(contour))
                    if before <= 0 or after / before > 1.025:
                        continue
                    bridged = [
                        [int(point[0][0]), int(point[0][1])] for point in contour
                    ]
                    bridged = base.remove_redundant_polygon_points(bridged)
                    if len(bridged) < 4:
                        continue
                    polygons[polygon_index] = bridged
                    changed += 1
                    break
                if changed:
                    break
    return changed


def _align_entry_utility_kitchen_row(rooms, image_shape):
    """Align a nearly-horizontal service-room row for display only.

    Some plans place the entrance, utility room and kitchen side by side, but
    the SPA/display polygons can choose opposite sides of the same thick wall.
    When all three lower edges are already close and their horizontal spans
    form one row, snap those edges and the matching living-room upper edge to
    a single conservative baseline.  The original SPA masks and pixel counts
    are never changed.
    """
    names = {
        "entry": "\ud604\uad00",
        "utility": "\ub2e4\uc6a9\ub3c4\uc2e4",
        "living": "\uac70\uc2e4",
    }

    def find_room(token):
        return next(
            (
                room
                for room in rooms
                if token in str(room.get("room_name") or "").replace(" ", "")
            ),
            None,
        )

    entry = find_room(names["entry"])
    utility = find_room(names["utility"])
    living = find_room(names["living"])
    kitchen = next(
        (
            room
            for room in rooms
            if any(
                token in str(room.get("room_name") or "").replace(" ", "")
                for token in ("\uc8fc\ubc29", "\uc2dd\ub2f9")
            )
        ),
        None,
    )
    if not all((entry, utility, kitchen, living)):
        return 0

    def largest_polygon(room):
        polygons = room.get("viewer_polygons") or []
        return max(
            polygons,
            key=lambda polygon: abs(
                cv2.contourArea(np.asarray(polygon, dtype=np.int32).reshape((-1, 1, 2)))
            ),
            default=None,
        )

    row = [entry, utility, kitchen]
    polygons = [largest_polygon(room) for room in row]
    living_polygon = largest_polygon(living)
    if any(polygon is None or len(polygon) < 4 for polygon in polygons):
        return 0
    if living_polygon is None or len(living_polygon) < 4:
        return 0

    bounds = []
    for polygon in polygons:
        xs = [int(point[0]) for point in polygon]
        ys = [int(point[1]) for point in polygon]
        bounds.append((min(xs), max(xs), max(ys)))

    image_height, image_width = image_shape[:2]
    max_vertical_spread = max(24, min(48, int(round(image_height * 0.014))))
    bottoms = [bound[2] for bound in bounds]
    if max(bottoms) - min(bottoms) > max_vertical_spread:
        return 0

    # Require a left-to-right adjoining chain.  This prevents the rule from
    # affecting plans where these rooms exist in unrelated parts of the home.
    ordered = sorted(bounds, key=lambda bound: bound[0])
    max_horizontal_gap = max(16, min(70, int(round(image_width * 0.015))))
    for previous, current in zip(ordered, ordered[1:]):
        gap = current[0] - previous[1]
        if gap > max_horizontal_gap or gap < -max_horizontal_gap:
            return 0

    # Entrance and utility-room walls provide the stable structural baseline;
    # the kitchen prediction is allowed to retract to that line.
    target_y = int(round(float(np.median([bounds[0][2], bounds[1][2]]))))
    row_left = min(bound[0] for bound in bounds)
    row_right = max(bound[1] for bound in bounds)

    changed = 0
    for room, polygon, (_, _, bottom) in zip(row, polygons, bounds):
        adjusted = [
            [int(x), target_y if int(y) == bottom else int(y)]
            for x, y in polygon
        ]
        adjusted = base.remove_redundant_polygon_points(adjusted)
        room["viewer_polygons"][room["viewer_polygons"].index(polygon)] = adjusted
        changed += 1

    # Flatten only the living-room vertices that already lie close to the same
    # row.  Deeper corners and genuine openings stay untouched.
    living_tolerance = max_vertical_spread
    adjusted_living = []
    living_changed = False
    for x, y in living_polygon:
        x, y = int(x), int(y)
        if abs(y - target_y) <= living_tolerance:
            y = target_y
            living_changed = True
        adjusted_living.append([x, y])
    if living_changed:
        adjusted_living = base.remove_redundant_polygon_points(adjusted_living)
        if len(adjusted_living) >= 4:
            living["viewer_polygons"][
                living["viewer_polygons"].index(living_polygon)
            ] = adjusted_living
            changed += 1

    return 1 if changed == 4 else 0


def _split_master_bedroom_l_shape(rooms, image_shape=None):
    """Return a misplaced bedroom lobe to the adjoining master room.

    In a small family of plans the semantic bedroom mask joins the rectangular
    second bedroom to the lower part of the master room.  The source drawing
    still has a clear wall-grid pattern: a rectangular master room above, an
    L-shaped bedroom below it, and a small balcony directly under the L-shape's
    left lobe.  Only when that complete geometric signature is present do we
    move the lobe to the master-room *viewer* polygon.  SPA masks, pixel counts
    and the 8002 calculation data are not modified.
    """

    def normalized_name(room):
        return str(room.get("room_name") or "").replace(" ", "")

    master = next(
        (room for room in rooms if "\uc548\ubc29" in normalized_name(room)), None
    )
    bedroom = next(
        (room for room in rooms if "\uce68\uc2e42" in normalized_name(room)), None
    )
    balconies = [
        room for room in rooms if "\ubc1c\ucf54\ub2c8" in normalized_name(room)
    ]
    if master is None or bedroom is None or not balconies:
        return 0

    def largest_polygon_with_index(room):
        polygons = room.get("viewer_polygons") or []
        if not polygons:
            return None, None
        index = max(
            range(len(polygons)),
            key=lambda item: abs(
                cv2.contourArea(
                    np.asarray(polygons[item], dtype=np.int32).reshape((-1, 1, 2))
                )
            ),
        )
        return index, polygons[index]

    master_index, master_polygon = largest_polygon_with_index(master)
    bedroom_index, bedroom_polygon = largest_polygon_with_index(bedroom)
    if master_polygon is None or bedroom_polygon is None:
        return 0

    def clustered_coordinates(values, tolerance=3):
        clusters = []
        for value in sorted(int(item) for item in values):
            if not clusters or value - clusters[-1][-1] > tolerance:
                clusters.append([value])
            else:
                clusters[-1].append(value)
        return [int(round(float(np.median(cluster)))) for cluster in clusters]

    adjacency = (
        max(14, min(28, int(round(min(image_shape[:2]) * 0.008))))
        if image_shape is not None
        else 28
    )

    # 8002 may already have reassigned the L-shaped lobe correctly.  In that
    # case the wall-grid conversion can still leave the rectangular bedroom's
    # left edge a few pixels past the master's vertical seam.  Snap only those
    # two display edges together; room masks and pixel counts stay untouched.
    if len(master_polygon) == 6 and len(bedroom_polygon) == 4:
        master_x = clustered_coordinates(point[0] for point in master_polygon)
        master_y = clustered_coordinates(point[1] for point in master_polygon)
        bedroom_x = clustered_coordinates(point[0] for point in bedroom_polygon)
        bedroom_y = clustered_coordinates(point[1] for point in bedroom_polygon)
        if (
            len(master_x) == 3
            and len(master_y) == 3
            and len(bedroom_x) == 2
            and len(bedroom_y) == 2
        ):
            left, split_x, master_right = master_x
            master_top, seam_y, shoulder_y = master_y
            bedroom_left, bedroom_right = bedroom_x
            bedroom_top, bedroom_bottom = bedroom_y
            balcony_confirmed = False
            for balcony in balconies:
                _, balcony_polygon = largest_polygon_with_index(balcony)
                if balcony_polygon is None or len(balcony_polygon) != 4:
                    continue
                bx = clustered_coordinates(point[0] for point in balcony_polygon)
                by = clustered_coordinates(point[1] for point in balcony_polygon)
                if (
                    len(bx) == 2
                    and len(by) == 2
                    and abs(bx[0] - left) <= adjacency
                    and abs(bx[1] - split_x) <= adjacency
                    and abs(by[0] - shoulder_y) <= adjacency
                ):
                    balcony_confirmed = True
                    break
            if (
                balcony_confirmed
                and abs(bedroom_left - split_x) <= adjacency
                and abs(bedroom_top - seam_y) <= adjacency
                and split_x < master_right < bedroom_right
            ):
                seam_y = int(round((seam_y + bedroom_top) / 2.0))
                master_display = [
                    [left, master_top],
                    [master_right, master_top],
                    [master_right, seam_y],
                    [split_x, seam_y],
                    [split_x, shoulder_y],
                    [left, shoulder_y],
                ]
                bedroom_display = [
                    [split_x, seam_y],
                    [bedroom_right, seam_y],
                    [bedroom_right, bedroom_bottom],
                    [split_x, bedroom_bottom],
                ]
                master["viewer_polygons"][master_index] = (
                    base.remove_redundant_polygon_points(master_display)
                )
                bedroom["viewer_polygons"][bedroom_index] = (
                    base.remove_redundant_polygon_points(bedroom_display)
                )
                return 1

    if len(master_polygon) != 4 or not (6 <= len(bedroom_polygon) <= 8):
        return 0

    master_x = clustered_coordinates(point[0] for point in master_polygon)
    master_y = clustered_coordinates(point[1] for point in master_polygon)
    bedroom_x = clustered_coordinates(point[0] for point in bedroom_polygon)
    bedroom_y = clustered_coordinates(point[1] for point in bedroom_polygon)
    if len(master_x) != 2 or len(master_y) != 2:
        return 0
    if len(bedroom_x) != 3 or len(bedroom_y) != 3:
        return 0

    left, split_x, right = bedroom_x
    bedroom_top, shoulder_y, bedroom_bottom = bedroom_y
    master_left, master_right = master_x
    master_top, master_bottom = master_y

    if abs(master_left - left) > adjacency:
        return 0
    if abs(master_bottom - bedroom_top) > adjacency:
        return 0
    if not (left < split_x < right and master_top < master_bottom < shoulder_y):
        return 0
    if master_right <= split_x or master_right >= right + adjacency:
        return 0

    balcony_match = None
    for balcony in balconies:
        balcony_index, balcony_polygon = largest_polygon_with_index(balcony)
        if balcony_polygon is None or len(balcony_polygon) != 4:
            continue
        bx = clustered_coordinates(point[0] for point in balcony_polygon)
        by = clustered_coordinates(point[1] for point in balcony_polygon)
        if len(bx) != 2 or len(by) != 2:
            continue
        if (
            abs(bx[0] - left) <= adjacency
            and abs(bx[1] - split_x) <= adjacency
            and abs(by[0] - shoulder_y) <= adjacency
            and by[1] > by[0]
        ):
            balcony_match = balcony
            break
    if balcony_match is None:
        return 0

    seam_y = int(round((master_bottom + bedroom_top) / 2.0))
    master_display = [
        [master_left, master_top],
        [master_right, master_top],
        [master_right, seam_y],
        [split_x, seam_y],
        [split_x, shoulder_y],
        [left, shoulder_y],
    ]
    bedroom_display = [
        [split_x, seam_y],
        [right, seam_y],
        [right, bedroom_bottom],
        [split_x, bedroom_bottom],
    ]
    master["viewer_polygons"][master_index] = base.remove_redundant_polygon_points(
        master_display
    )
    bedroom["viewer_polygons"][bedroom_index] = base.remove_redundant_polygon_points(
        bedroom_display
    )
    return 1


def _align_bedroom_living_shared_boundary(rooms, image_shape):
    """Join a bedroom rectangle to the matching living-room wall edge.

    SPA contours can select opposite sides of a thick wall. After wall-grid
    rectification this appears as a short step where a rectangular bedroom and
    the living room should share one straight corner. Move only the bedroom's
    top/right display edges when a nearby living-room edge already supplies the
    matching structural corner. Source masks and pixel counts stay unchanged.
    """
    living = next(
        (
            room
            for room in rooms
            if "\uac70\uc2e4" in str(room.get("room_name") or "").replace(" ", "")
        ),
        None,
    )
    if living is None:
        return 0

    living_polygons = living.get("viewer_polygons") or []
    tolerance = max(10, min(28, int(round(min(image_shape) * 0.0065))))
    changed = 0

    for bedroom in rooms:
        name = str(bedroom.get("room_name") or "").replace(" ", "")
        if "\uce68\uc2e4" not in name or "\uc548\ubc29" in name:
            continue

        polygons = bedroom.get("viewer_polygons") or []
        for polygon_index, polygon in enumerate(polygons):
            if len(polygon) != 4:
                continue

            xs = [int(point[0]) for point in polygon]
            ys = [int(point[1]) for point in polygon]
            left, right = min(xs), max(xs)
            top = min(ys)
            width = right - left
            if width <= 0:
                continue

            candidates = []
            for living_polygon in living_polygons:
                count = len(living_polygon)
                for edge_index in range(count):
                    start = living_polygon[edge_index]
                    end = living_polygon[(edge_index + 1) % count]
                    x1, y1 = int(start[0]), int(start[1])
                    x2, y2 = int(end[0]), int(end[1])
                    if abs(y1 - y2) > 2:
                        continue

                    target_y = int(round((y1 + y2) / 2.0))
                    vertical_gap = target_y - top
                    if not 0 < vertical_gap <= tolerance:
                        continue

                    edge_left, edge_right = sorted((x1, x2))
                    overlap = min(right, edge_right) - max(left, edge_left)
                    if overlap < max(35, width * 0.30):
                        continue
                    if abs(edge_right - right) > tolerance:
                        continue
                    candidates.append((vertical_gap, -overlap, target_y, edge_right))

            if not candidates:
                continue

            _, _, target_y, target_right = min(candidates)
            adjusted = []
            for x, y in polygon:
                x, y = int(x), int(y)
                if y == top:
                    y = target_y
                if x == right and abs(target_right - right) <= tolerance:
                    x = target_right
                adjusted.append([x, y])

            adjusted = base.remove_redundant_polygon_points(adjusted)
            if len(adjusted) != 4:
                continue
            polygons[polygon_index] = adjusted
            changed += 1

    return changed


def add_wall_grid_viewer_polygons(original_content: bytes, rooms: list):
    image = cv2.imdecode(
        np.frombuffer(original_content, np.uint8), cv2.IMREAD_GRAYSCALE
    )
    if image is None or not rooms:
        return {"wall_grid_rooms": 0, "fallback_rooms": len(rooms)}

    horizontal, vertical = base.detect_wall_segments(original_content, rooms)
    wall_grid_rooms = 0
    fallback_rooms = 0
    for room in rooms:
        display_polygons = []
        used_wall_grid = False
        for polygon in room.get("polygons", []):
            rectified = _grid_rectified_polygon(
                polygon, horizontal, vertical, image.shape[:2]
            )
            if rectified is not None:
                # Grid cells can leave a tiny one-cell tooth at a wall join.
                # Reuse the conservative 8003 display-only cleaner after the
                # wall-grid conversion; large openings and room shapes remain.
                rectified, _ = base.clean_viewer_micro_notches(
                    rectified, image.shape[:2]
                )
                rectified, _ = _rectify_small_service_room_corner(
                    room.get("room_name"), rectified
                )
                display_polygons.append(rectified)
                used_wall_grid = True
            else:
                aligned = base.align_polygon_to_walls(
                    polygon, horizontal, vertical, image.shape[:2]
                )
                cleaned, _ = base.clean_viewer_micro_notches(
                    aligned or polygon, image.shape[:2]
                )
                display_polygons.append(cleaned)

        if display_polygons:
            room["viewer_polygons"] = display_polygons
            room["viewer_geometry_source"] = (
                "original_wall_grid" if used_wall_grid else "viewer3d_fallback"
            )
        if used_wall_grid:
            wall_grid_rooms += 1
        else:
            fallback_rooms += 1

    utility_bottom_snaps = _snap_utility_room_bottom_to_neighbor(
        rooms, image.shape[:2]
    )
    utility_floor_bridges = _bridge_utility_floor_to_living(
        rooms, image.shape[:2]
    )
    service_row_alignments = _align_entry_utility_kitchen_row(
        rooms, image.shape[:2]
    )
    master_bedroom_splits = _split_master_bedroom_l_shape(
        rooms, image.shape[:2]
    )
    bedroom_living_boundary_alignments = _align_bedroom_living_shared_boundary(
        rooms, image.shape[:2]
    )
    micro_wall_offset_snaps = _snap_micro_wall_offsets(rooms, image.shape[:2])

    return {
        "mode": "original_drawing_wall_grid",
        "wall_grid_rooms": wall_grid_rooms,
        "fallback_rooms": fallback_rooms,
        "total_rooms": len(rooms),
        "horizontal_wall_candidates": len(horizontal),
        "vertical_wall_candidates": len(vertical),
        "utility_bottom_snaps": utility_bottom_snaps,
        "utility_floor_bridges": utility_floor_bridges,
        "service_row_alignments": service_row_alignments,
        "master_bedroom_splits": master_bedroom_splits,
        "bedroom_living_boundary_alignments": bedroom_living_boundary_alignments,
        "micro_wall_offset_snaps": micro_wall_offset_snaps,
    }


# base.analyze resolves this global at request time, so 8004 can reuse all
# stable OCR/SPA/UI behavior while keeping 8003 files and container untouched.
base.add_wall_aligned_viewer_polygons = add_wall_grid_viewer_polygons

# OCR room names are attached after the wall-grid hook runs.  Apply the
# name-dependent master/bedroom correction once more immediately after OCR
# enrichment; this still changes only viewer_polygons used by port 8004.
_base_apply_ocr_display_names = base.apply_ocr_display_names


def _apply_ocr_display_names_with_master_split(rooms, ocr_result):
    result = _base_apply_ocr_display_names(rooms, ocr_result)
    _split_master_bedroom_l_shape(rooms)
    coordinates = [
        point
        for room in rooms
        for polygon in (room.get("viewer_polygons") or [])
        for point in polygon
    ]
    if coordinates:
        inferred_height = max(int(point[1]) for point in coordinates) + 1
        inferred_width = max(int(point[0]) for point in coordinates) + 1
        _align_bedroom_living_shared_boundary(
            rooms, (inferred_height, inferred_width)
        )
        _snap_micro_wall_offsets(rooms, (inferred_height, inferred_width))
    return result


base.apply_ocr_display_names = _apply_ocr_display_names_with_master_split


def _build_viewerwall_javascript():
    """Patch only 8004 so wall boxes stop at the inner edge of T-junctions.

    The shared viewer extends wall boxes to hide ordinary corner gaps.  At a
    T-junction, however, an endpoint that lands in the middle of another wall
    must be shortened to that wall's inner face; otherwise a small nib remains
    visible inside the neighbouring room.  Only those interior intersections
    are trimmed.  SPA polygons and pixel counts are never changed.
    """
    source = (base.STATIC_DIR / "viewer.js").read_text(encoding="utf-8")
    replacements = {
        "scene.background = new THREE.Color(0xedf3f1);": "scene.background = new THREE.Color(0xf4f7fc);",
        "  pendingWallSegments.forEach((segment, segmentIndex) => {": """  const endpointHitsWallInterior = (point, segmentIndex, segment) => pendingWallSegments.some((other, otherIndex) => {
    if (otherIndex === segmentIndex) return false;
    const odx = other.end.x - other.start.x;
    const odz = other.end.z - other.start.z;
    const otherLength2 = odx * odx + odz * odz;
    if (otherLength2 < wallThickness * wallThickness) return false;
    const t = ((point.x - other.start.x) * odx + (point.z - other.start.z) * odz) / otherLength2;
    if (t <= .06 || t >= .94) return false;
    const closestX = other.start.x + odx * t;
    const closestZ = other.start.z + odz * t;
    if (Math.hypot(point.x - closestX, point.z - closestZ) > wallThickness * .42) return false;
    const sdx = segment.end.x - segment.start.x;
    const sdz = segment.end.z - segment.start.z;
    const segmentLength = Math.hypot(sdx, sdz);
    const otherLength = Math.sqrt(otherLength2);
    if (segmentLength < wallThickness || otherLength < wallThickness) return false;
    const perpendicularity = Math.abs((sdx * odx + sdz * odz) / (segmentLength * otherLength));
    return perpendicularity < .28;
  });

  pendingWallSegments.forEach((segment, segmentIndex) => {""",
        "    const wallSegment = extendedSegment(\n      start,\n      end,": """    const startHitsWallInterior = endpointHitsWallInterior(start, segmentIndex, segment);
    const endHitsWallInterior = endpointHitsWallInterior(end, segmentIndex, segment);
    const wallSegment = extendedSegment(
      start,
      end,""",
        "startTouchesRemoved ? 0 : wallThickness * .175": "startHitsWallInterior ? -wallThickness * .52 : 0",
        "endTouchesRemoved ? 0 : wallThickness * .175": "endHitsWallInterior ? -wallThickness * .52 : 0",
        "startTouchesRemoved ? 0 : wallThickness * .225": "startHitsWallInterior ? -wallThickness * .62 : 0",
        "endTouchesRemoved ? 0 : wallThickness * .225": "endHitsWallInterior ? -wallThickness * .62 : 0",
    }
    for marker, replacement in replacements.items():
        if marker not in source:
            raise RuntimeError(f"viewerwall JavaScript marker was not found: {marker}")
        source = source.replace(marker, replacement, 1)
    return source


_VIEWERWALL_JAVASCRIPT = _build_viewerwall_javascript()


def _build_viewerwall_stylesheet():
    """Give only port 8004 the blue visual language used by the app UI."""
    source = (base.STATIC_DIR / "styles.css").read_text(encoding="utf-8")
    replacements = {
        "--ink: #17211d;": "--ink: #17233d;",
        "--muted: #708078;": "--muted: #7b8498;",
        "--line: #e2e8e4;": "--line: #e1e7f0;",
        "--paper: #f4f7f4;": "--paper: #f4f7fc;",
        "--green: #19a56f;": "--green: #2f6fed;",
        "--green-dark: #087b50;": "--green-dark: #205bd8;",
        "background: #edf2ee;": "background: #f3f6fb;",
        "background: linear-gradient(145deg, #23b982, #07875a);": "background: linear-gradient(145deg, #4b82f4, #2563eb);",
        "box-shadow: 0 8px 18px rgba(17, 152, 100, .22);": "box-shadow: 0 8px 18px rgba(37, 99, 235, .22);",
        "color: #597168;": "color: #315ea8;",
        "border: 1px solid #dce9e1;": "border: 1px solid #dbe6fb;",
        "background: #f5fbf7;": "background: #f5f8ff;",
        "background: #22b87f;": "background: #2f6fed;",
        "box-shadow: 0 0 0 4px rgba(34, 184, 127, .12);": "box-shadow: 0 0 0 4px rgba(47, 111, 237, .12);",
        "background: #fbfcfb;": "background: #fbfcff;",
        "border: 1.5px dashed #b9ccc0;": "border: 1.5px dashed #b9cbef;",
        "background: #f4faf6;": "background: #f7f9fe;",
        "background: #eaf8f0;": "background: #edf4ff;",
        "box-shadow: 0 8px 18px rgba(25, 165, 111, .22);": "box-shadow: 0 8px 18px rgba(47, 111, 237, .22);",
        "background: #e8eeea;": "background: #e8edf6;",
        "background: linear-gradient(90deg, #1bb17a, #7bd8af);": "background: linear-gradient(90deg, #2563eb, #7ba7ff);",
        "border: 1px solid #e0e6e2;": "border: 1px solid #dfe6f1;",
        "background: #f5f7f5;": "background: #f5f7fb;",
        "color: #6c7972;": "color: #69758c;",
        "linear-gradient(#f1f5f2 1px, transparent 1px)": "linear-gradient(#edf2fa 1px, transparent 1px)",
        "linear-gradient(90deg, #f1f5f2 1px, transparent 1px);": "linear-gradient(90deg, #edf2fa 1px, transparent 1px);",
        "background: #eef7f2;": "background: #eef4ff;",
    }
    for marker, replacement in replacements.items():
        if marker not in source:
            raise RuntimeError(f"viewerwall stylesheet marker was not found: {marker}")
        source = source.replace(marker, replacement, 1)
    return source


_VIEWERWALL_STYLESHEET = _build_viewerwall_stylesheet()


async def _viewerwall_javascript(_request):
    return Response(
        _VIEWERWALL_JAVASCRIPT,
        media_type="application/javascript",
        headers={"Cache-Control": "no-store"},
    )


async def _viewerwall_stylesheet(_request):
    return Response(
        _VIEWERWALL_STYLESHEET,
        media_type="text/css",
        headers={"Cache-Control": "no-store"},
    )


async def _viewerwall_index(_request):
    """Serve the 8004 page with cache-busted 8004-only assets."""
    source = (base.STATIC_DIR / "index.html").read_text(encoding="utf-8")
    source = source.replace(
        "/static/styles.css?v=shape-15-square-tooltip",
        "/static/styles.css?v=viewerwall-blue-20260803",
    )
    source = source.replace(
        "/static/viewer.js?v=shape-40-tap-click-tooltip",
        "/static/viewer.js?v=viewerwall-blue-20260803",
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


# The stable app mounts /static before this module is imported.  Put the
# 8004-only JavaScript route first so 8003's source file stays untouched.
base.app.router.routes.insert(
    0, Route("/static/viewer.js", endpoint=_viewerwall_javascript, methods=["GET"])
)
base.app.router.routes.insert(
    0, Route("/static/styles.css", endpoint=_viewerwall_stylesheet, methods=["GET"])
)
base.app.router.routes.insert(
    0, Route("/", endpoint=_viewerwall_index, methods=["GET"])
)
base.app.title = "SpaceUP Wall-guided 3D Floor Plan Viewer"
base.app.version = "0.1.0"
app = base.app
