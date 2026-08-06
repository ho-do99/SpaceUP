import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const wrap = document.querySelector("#canvasWrap");
const emptyState = document.querySelector("#emptyState");
const labelsLayer = document.querySelector("#labelsLayer");
const fileInput = document.querySelector("#fileInput");
const dropZone = document.querySelector("#dropZone");
const progress = document.querySelector("#progress");
const progressText = document.querySelector("#progressText");
const progressPercent = document.querySelector("#progressPercent");
const progressBar = document.querySelector("#progressBar");
const summary = document.querySelector("#summary");
const roomCount = document.querySelector("#roomCount");
const pixelCount = document.querySelector("#pixelCount");
const legendItems = document.querySelector("#legendItems");
const planTitle = document.querySelector("#planTitle");
const planSubtitle = document.querySelector("#planSubtitle");
const roomTooltip = document.querySelector("#roomTooltip");
const roomTooltipName = document.querySelector("#roomTooltipName");
const roomTooltipValue = document.querySelector("#roomTooltipValue");

const palette = [
  "#76c9b0", "#f4be6c", "#86b8e7", "#d98a80", "#b391d4", "#e6ce70",
  "#67b9c3", "#e79ac0", "#9bc27d", "#ef9d73", "#7fa8d8", "#c3a27c",
  "#75c99d", "#e6a36c", "#a9a0d8", "#78c4d4", "#d5ad76", "#8dc490",
];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xedf3f1);
scene.fog = new THREE.Fog(0xedf3f1, 26, 52);

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
wrap.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = .07;
controls.minDistance = 8;
controls.maxDistance = 35;
controls.maxPolarAngle = Math.PI * .49;
controls.target.set(0, 0, 0);

scene.add(new THREE.HemisphereLight(0xfffdf7, 0x9eaaa4, 2.35));
const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
keyLight.position.set(-8, 14, 10);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -15;
keyLight.shadow.camera.right = 15;
keyLight.shadow.camera.top = 15;
keyLight.shadow.camera.bottom = -15;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xdff6ec, 1.2);
fillLight.position.set(12, 8, -7);
scene.add(fillLight);

const woodTexture = createWoodTexture();
const tileTexture = createTileTexture("#d8e1df", "#aebbb7");
const warmTileTexture = createTileTexture("#ddd2c4", "#bcae9d");

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60),
  new THREE.ShadowMaterial({ color: 0x627168, opacity: .13 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -.04;
ground.receiveShadow = true;
scene.add(ground);

let planGroup = new THREE.Group();
scene.add(planGroup);
let furnitureGroup = new THREE.Group();
furnitureGroup.name = "furniture";
planGroup.add(furnitureGroup);
let labelPoints = [];
let currentExtent = 10;
let pendingWallSegments = [];
let pendingWallPolygons = [];
let roomHoverTargets = [];
const roomRaycaster = new THREE.Raycaster();
const roomPointer = new THREE.Vector2();
let roomTouchStart = null;

function clearPlan() {
  scene.remove(planGroup);
  planGroup.traverse((item) => {
    item.geometry?.dispose();
    if (Array.isArray(item.material)) item.material.forEach((m) => m.dispose());
    else item.material?.dispose();
  });
  planGroup = new THREE.Group();
  scene.add(planGroup);
  furnitureGroup = new THREE.Group();
  furnitureGroup.name = "furniture";
  furnitureGroup.visible = false;
  planGroup.add(furnitureGroup);
  labelsLayer.replaceChildren();
  labelPoints = [];
  pendingWallSegments = [];
  pendingWallPolygons = [];
  roomHoverTargets = [];
  roomTooltip.classList.add("hidden");
  renderer.domElement.style.cursor = "";
}

function safeRoomName(room) {
  const text = String(room.display_name || room.room_name || "").trim();
  if (!text || text.includes("class_")) return `공간 ${room.instance_id}`;
  return text;
}

function buildPlan(data) {
  clearPlan();
  emptyState.classList.add("hidden");

  const rooms = (data.rooms || []).filter((room) => {
    const name = String(room.display_name || room.room_name || "").trim();
    const isUnnamedStructure =
      room.class_id === 12 && (!name || name.includes("class_"));
    return (
      room.bbox &&
      room.pixel_count > 800 &&
      room.class_id !== 0 &&
      !isUnnamedStructure
    );
  });
  if (!rooms.length) throw new Error("표시할 공간을 찾지 못했습니다.");

  const minX = Math.min(...rooms.map((r) => r.bbox.x));
  const minY = Math.min(...rooms.map((r) => r.bbox.y));
  const maxX = Math.max(...rooms.map((r) => r.bbox.x + r.bbox.width));
  const maxY = Math.max(...rooms.map((r) => r.bbox.y + r.bbox.height));
  const sourceW = Math.max(maxX - minX, 1);
  const sourceH = Math.max(maxY - minY, 1);
  const scale = 12 / Math.max(sourceW, sourceH);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  currentExtent = Math.max(sourceW, sourceH) * scale;

  rooms.forEach((room, index) => {
    const color = palette[index % palette.length];
    const { x, y, width, height } = room.bbox;
    const w = Math.max(width * scale, .32);
    const d = Math.max(height * scale, .32);
    const cx = (x + width / 2 - centerX) * scale;
    const cz = (y + height / 2 - centerY) * scale;
    const polygons = (room.viewer_polygons || room.polygons || [])
      .filter((polygon) => polygon.length >= 3);

    if (polygons.length) {
      polygons.forEach((polygon) => addPolygonRoom(
        polygon,
        color,
        safeRoomName(room),
        { centerX, centerY, scale },
        room
      ));
    } else {
      addBoxRoom({ w, d, cx, cz, color, roomName: safeRoomName(room), room });
    }

    const label = document.createElement("span");
    label.className = "room-label";
    label.textContent = safeRoomName(room);
    labelsLayer.appendChild(label);
    const labelPosition = labelPositionForRoom(room, { centerX, centerY, scale });
    labelPoints.push({
      element: label,
      position: new THREE.Vector3(labelPosition.x, 1.12, labelPosition.z),
    });
  });

  renderContourWalls();
  addFurnitureHints(rooms, { centerX, centerY, scale });
  updateLegend(rooms);
  roomCount.textContent = rooms.length.toLocaleString("ko-KR");
  pixelCount.textContent = Math.round(
    rooms.reduce((sum, room) => sum + room.pixel_count, 0) / 1000
  ).toLocaleString("ko-KR") + "K";
  summary.classList.remove("hidden");
  planTitle.textContent = "우리 집 3D 공간";
  planSubtitle.textContent = `${rooms.length}개 공간을 입체 구조로 변환했습니다`;
  setIsometricView();
}

function createWoodTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  context.fillStyle = "#c9a77f";
  context.fillRect(0, 0, 512, 512);
  const plankHeight = 42;
  for (let y = 0; y < 512; y += plankHeight) {
    const tone = 166 + ((y / plankHeight) % 4) * 6;
    context.fillStyle = `rgb(${tone + 35}, ${tone + 10}, ${tone - 18})`;
    context.fillRect(0, y + 1, 512, plankHeight - 2);
    context.strokeStyle = "rgba(95, 62, 34, .22)";
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(512, y);
    context.stroke();
    const offset = ((y / plankHeight) % 3) * 100;
    for (let x = offset; x < 512; x += 180) {
      context.strokeStyle = "rgba(94, 65, 39, .16)";
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x, y + plankHeight);
      context.stroke();
    }
    for (let x = 0; x < 512; x += 11) {
      const wave = Math.sin((x + y) * .045) * 3;
      context.fillStyle = "rgba(95, 67, 42, .06)";
      context.fillRect(x, y + 12 + wave, 7, 1);
      context.fillRect(x, y + 27 - wave, 9, 1);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.6, 2.6);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function createTileTexture(base, line) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  context.fillStyle = base;
  context.fillRect(0, 0, 256, 256);
  context.strokeStyle = line;
  context.lineWidth = 3;
  for (let value = 0; value <= 256; value += 64) {
    context.beginPath();
    context.moveTo(value, 0);
    context.lineTo(value, 256);
    context.stroke();
    context.beginPath();
    context.moveTo(0, value);
    context.lineTo(256, value);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function roomFloorMaterial(roomName, fallbackColor) {
  if (/욕실|화장실/.test(roomName)) {
    return new THREE.MeshStandardMaterial({
      map: tileTexture,
      color: 0xffffff,
      roughness: .78,
      metalness: 0,
      side: THREE.DoubleSide,
    });
  }
  if (/발코니|실외기|다용도|현관/.test(roomName)) {
    return new THREE.MeshStandardMaterial({
      map: warmTileTexture,
      color: 0xffffff,
      roughness: .86,
      metalness: 0,
      side: THREE.DoubleSide,
    });
  }
  return new THREE.MeshStandardMaterial({
    map: woodTexture,
    color: new THREE.Color(fallbackColor).lerp(new THREE.Color(0xffffff), .4),
    roughness: .7,
    metalness: 0,
    side: THREE.DoubleSide,
  });
}

function addPolygonRoom(points, color, roomName, transform, room) {
  const { centerX, centerY, scale } = transform;
  const vertices = points.map(([x, y]) => ({
    x: (x - centerX) * scale,
    z: (y - centerY) * scale,
  }));
  const shape = new THREE.Shape();
  vertices.forEach((point, index) => {
    if (index === 0) shape.moveTo(point.x, point.z);
    else shape.lineTo(point.x, point.z);
  });
  shape.closePath();

  const floorGeometry = new THREE.ExtrudeGeometry(shape, {
    depth: .12,
    bevelEnabled: false,
    curveSegments: 1,
  });
  floorGeometry.rotateX(Math.PI / 2);
  const floor = new THREE.Mesh(
    floorGeometry,
    roomFloorMaterial(roomName, color)
  );
  floor.position.y = .24;
  floor.castShadow = true;
  floor.receiveShadow = true;
  registerRoomHoverTarget(floor, room, roomName);
  planGroup.add(floor);

  addContourWalls(vertices, roomName);
}

function addContourWalls(vertices, roomName) {
  pendingWallPolygons.push({ vertices, roomName });
  vertices.forEach((start, index) => {
    const end = vertices[(index + 1) % vertices.length];
    pendingWallSegments.push({ start, end, roomName });
  });
}

function isOpenPlanPair(firstName, secondName) {
  const firstLiving = /거실/.test(firstName);
  const secondLiving = /거실/.test(secondName);
  const firstKitchen = /주방|식당/.test(firstName);
  const secondKitchen = /주방|식당/.test(secondName);
  return (firstLiving && secondKitchen) || (secondLiving && firstKitchen);
}

function pointToSegmentDistance(point, start, end) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const lengthSquared = dx * dx + dz * dz;
  if (!lengthSquared) return Math.hypot(point.x - start.x, point.z - start.z);
  const ratio = Math.max(0, Math.min(
    1,
    ((point.x - start.x) * dx + (point.z - start.z) * dz) / lengthSquared
  ));
  return Math.hypot(
    point.x - (start.x + ratio * dx),
    point.z - (start.z + ratio * dz)
  );
}

function segmentsShareOpenBoundary(segment, other) {
  if (!isOpenPlanPair(segment.roomName, other.roomName)) return false;
  const dx1 = segment.end.x - segment.start.x;
  const dz1 = segment.end.z - segment.start.z;
  const dx2 = other.end.x - other.start.x;
  const dz2 = other.end.z - other.start.z;
  const length1 = Math.hypot(dx1, dz1);
  const length2 = Math.hypot(dx2, dz2);
  if (length1 < .05 || length2 < .05) return false;
  const parallel = Math.abs((dx1 * dx2 + dz1 * dz2) / (length1 * length2));
  const midpoint = {
    x: (segment.start.x + segment.end.x) / 2,
    z: (segment.start.z + segment.end.z) / 2,
  };
  const otherMidpoint = {
    x: (other.start.x + other.end.x) / 2,
    z: (other.start.z + other.end.z) / 2,
  };
  const sharedDistance = Math.min(
    pointToSegmentDistance(midpoint, other.start, other.end),
    pointToSegmentDistance(otherMidpoint, segment.start, segment.end)
  );
  const alignedSharedEdge = parallel > .94 && sharedDistance < .18;
  const tinyOpeningFragment = Math.min(length1, length2) < .28 && sharedDistance < .12;
  return alignedSharedEdge || tinyOpeningFragment;
}

function pointInsidePolygon(point, vertices) {
  let inside = false;
  for (let index = 0, previous = vertices.length - 1; index < vertices.length; previous = index++) {
    const currentPoint = vertices[index];
    const previousPoint = vertices[previous];
    const crosses = (
      (currentPoint.z > point.z) !== (previousPoint.z > point.z)
      && point.x < (
        (previousPoint.x - currentPoint.x) * (point.z - currentPoint.z)
        / (previousPoint.z - currentPoint.z)
        + currentPoint.x
      )
    );
    if (crosses) inside = !inside;
  }
  return inside;
}

function segmentRunsThroughOpenPlanRoom(segment, wallThickness) {
  const dx = segment.end.x - segment.start.x;
  const dz = segment.end.z - segment.start.z;
  const length = Math.hypot(dx, dz);
  if (length < wallThickness * 2) return false;
  const nx = -dz / length;
  const nz = dx / length;
  const offset = wallThickness * 1.35;
  const sampleRatios = [.25, .5, .75];

  return pendingWallPolygons.some((polygon) => {
    if (!isOpenPlanPair(segment.roomName, polygon.roomName)) return false;
    const interiorSamples = sampleRatios.filter((ratio) => {
      const sample = {
        x: segment.start.x + dx * ratio,
        z: segment.start.z + dz * ratio,
      };
      return (
        pointInsidePolygon(
          { x: sample.x + nx * offset, z: sample.z + nz * offset },
          polygon.vertices
        )
        || pointInsidePolygon(
          { x: sample.x - nx * offset, z: sample.z - nz * offset },
          polygon.vertices
        )
      );
    }).length;
    return interiorSamples >= 2;
  });
}

function renderContourWalls() {
  const wallHeight = .78;
  const wallThickness = Math.min(.095, Math.max(.045, currentExtent * .0052));
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8faf8,
    roughness: .84,
    metalness: 0,
  });
  const isRemovedOpenPlanDiagonal = (segment) => {
    const dx = segment.end.x - segment.start.x;
    const dz = segment.end.z - segment.start.z;
    const length = Math.hypot(dx, dz);
    return (
      Math.abs(dx) > wallThickness * 1.5
      && Math.abs(dz) > wallThickness * 1.5
      && length < Math.max(.56, currentExtent * .047)
      && /\uAC70\uC2E4|\uC8FC\uBC29|\uC2DD\uB2F9/.test(String(segment.roomName || ""))
    );
  };
  const removedBoundaryEndpoints = pendingWallSegments
    .filter((segment) => (
      isRemovedOpenPlanDiagonal(segment)
      || segmentRunsThroughOpenPlanRoom(segment, wallThickness)
    ))
    .flatMap((segment) => [segment.start, segment.end]);
  const touchesRemovedBoundary = (point) => removedBoundaryEndpoints.some(
    (endpoint) => Math.hypot(point.x - endpoint.x, point.z - endpoint.z) < wallThickness * .55
  );
  const extendedSegment = (start, end, startExtension, endExtension) => {
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const length = Math.hypot(dx, dz);
    const ux = dx / length;
    const uz = dz / length;
    const drawStart = {
      x: start.x - ux * startExtension,
      z: start.z - uz * startExtension,
    };
    const drawEnd = {
      x: end.x + ux * endExtension,
      z: end.z + uz * endExtension,
    };
    return {
      length: Math.hypot(drawEnd.x - drawStart.x, drawEnd.z - drawStart.z),
      centerX: (drawStart.x + drawEnd.x) / 2,
      centerZ: (drawStart.z + drawEnd.z) / 2,
    };
  };

  pendingWallSegments.forEach((segment, segmentIndex) => {
    if (pendingWallSegments.some((other, otherIndex) =>
      otherIndex !== segmentIndex && segmentsShareOpenBoundary(segment, other)
    )) return;
    if (segmentRunsThroughOpenPlanRoom(segment, wallThickness)) return;
    const { start, end } = segment;
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const length = Math.hypot(dx, dz);
    if (length < wallThickness * .75) return;
    if (isRemovedOpenPlanDiagonal(segment)) return;

    const startTouchesRemoved = touchesRemovedBoundary(start);
    const endTouchesRemoved = touchesRemovedBoundary(end);
    const wallSegment = extendedSegment(
      start,
      end,
      startTouchesRemoved ? 0 : wallThickness * .175,
      endTouchesRemoved ? 0 : wallThickness * .175
    );

    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(wallSegment.length, wallHeight, wallThickness),
      wallMaterial
    );
    wall.position.set(
      wallSegment.centerX,
      wallHeight / 2 + .18,
      wallSegment.centerZ
    );
    wall.rotation.y = -Math.atan2(dz, dx);
    wall.castShadow = true;
    wall.receiveShadow = true;
    planGroup.add(wall);

    const capSegment = extendedSegment(
      start,
      end,
      startTouchesRemoved ? 0 : wallThickness * .225,
      endTouchesRemoved ? 0 : wallThickness * .225
    );
    const wallCap = new THREE.Mesh(
      new THREE.BoxGeometry(capSegment.length, .045, wallThickness * 1.2),
      new THREE.MeshStandardMaterial({
        color: 0x555e5b,
        roughness: .7,
        metalness: 0,
      })
    );
    wallCap.position.set(
      capSegment.centerX,
      wallHeight + .205,
      capSegment.centerZ
    );
    wallCap.rotation.y = wall.rotation.y;
    wallCap.castShadow = true;
    planGroup.add(wallCap);
  });
}

function addBoxRoom({ w, d, cx, cz, color, roomName, room }) {
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(Math.max(w - .09, .2), .12, Math.max(d - .09, .2)),
    roomFloorMaterial(roomName, color)
  );
  floor.position.set(cx, .18, cz);
  floor.castShadow = true;
  floor.receiveShadow = true;
  registerRoomHoverTarget(floor, room, roomName);
  planGroup.add(floor);

  addContourWalls([
    { x: cx - w / 2, z: cz - d / 2 },
    { x: cx + w / 2, z: cz - d / 2 },
    { x: cx + w / 2, z: cz + d / 2 },
    { x: cx - w / 2, z: cz + d / 2 },
  ], roomName);
}

function registerRoomHoverTarget(mesh, room, roomName) {
  mesh.userData.roomHover = {
    roomName,
    pixelCount: Number(room?.pixel_count || 0),
    instanceId: room?.instance_id ?? null,
  };
  roomHoverTargets.push(mesh);
}

function hideRoomTooltip() {
  roomTooltip.classList.add("hidden");
  renderer.domElement.style.cursor = "";
}

function showRoomTooltip(event, room) {
  const wrapRect = wrap.getBoundingClientRect();
  roomTooltipName.textContent = room.roomName;
  roomTooltipValue.textContent = "평수 선택 후 표시";
  roomTooltip.dataset.pixelCount = String(room.pixelCount);
  roomTooltip.dataset.instanceId = String(room.instanceId ?? "");
  roomTooltip.classList.remove("hidden");

  const tooltipWidth = roomTooltip.offsetWidth || 218;
  const tooltipHeight = roomTooltip.offsetHeight || 138;
  let left = event.clientX - wrapRect.left;
  let top = event.clientY - wrapRect.top;
  if (left + tooltipWidth + 24 > wrapRect.width) left -= tooltipWidth + 28;
  top = Math.max(tooltipHeight / 2 + 10, Math.min(
    wrapRect.height - tooltipHeight / 2 - 10,
    top
  ));
  roomTooltip.style.left = `${left}px`;
  roomTooltip.style.top = `${top}px`;
  renderer.domElement.style.cursor = "help";
}

function roomAtPointerEvent(event) {
  if (!roomHoverTargets.length) return null;
  const rect = renderer.domElement.getBoundingClientRect();
  roomPointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  roomPointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  roomRaycaster.setFromCamera(roomPointer, camera);
  const hit = roomRaycaster.intersectObjects(roomHoverTargets, false)[0];
  return hit?.object?.userData?.roomHover || null;
}

function handleRoomPointerDown(event) {
  roomTouchStart = {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
  };
}

function handleRoomPointerUp(event) {
  if (!roomTouchStart) return;
  const start = roomTouchStart;
  roomTouchStart = null;
  if (start.pointerId !== event.pointerId) return;

  const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y);
  if (distance > 12) return;

  const room = roomAtPointerEvent(event);
  if (!room) {
    hideRoomTooltip();
    return;
  }
  showRoomTooltip(event, room);
}

function handleRoomPointerCancel() {
  roomTouchStart = null;
}

function nearestBoundaryDirection(room, anchor) {
  const polygon = (room.polygons || []).reduce(
    (largest, candidate) => candidate.length > largest.length ? candidate : largest,
    []
  );
  if (!anchor || polygon.length < 2) return { axis: "z", sign: 1 };

  let nearest = null;
  polygon.forEach((start, index) => {
    const end = polygon[(index + 1) % polygon.length];
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const lengthSquared = dx * dx + dy * dy;
    const ratio = lengthSquared
      ? Math.max(0, Math.min(
        1,
        ((anchor[0] - start[0]) * dx + (anchor[1] - start[1]) * dy) / lengthSquared
      ))
      : 0;
    const point = [start[0] + ratio * dx, start[1] + ratio * dy];
    const distance = Math.hypot(point[0] - anchor[0], point[1] - anchor[1]);
    if (!nearest || distance < nearest.distance) nearest = { point, distance };
  });

  const deltaX = nearest.point[0] - anchor[0];
  const deltaY = nearest.point[1] - anchor[1];
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return { axis: "x", sign: Math.sign(deltaX) || 1 };
  }
  return { axis: "z", sign: Math.sign(deltaY) || 1 };
}

function labelPositionForRoom(room, transform) {
  const { centerX, centerY, scale } = transform;
  const { x, y, width, height } = room.bbox;
  const anchor = Array.isArray(room.ocr_anchor)
    ? room.ocr_anchor
    : Array.isArray(room.viewer_anchor)
    ? room.viewer_anchor
    : [x + width / 2, y + height / 2];

  return {
    x: (anchor[0] - centerX) * scale,
    z: (anchor[1] - centerY) * scale,
  };
}

function addFurnitureHints(rooms, transform) {
  const { centerX, centerY, scale } = transform;
  rooms.forEach((room) => {
    const name = safeRoomName(room);
    const { x, y, width, height } = room.bbox;
    const bboxW = width * scale;
    const bboxD = height * scale;
    const safeRadius = Math.max(
      .28,
      Number(room.viewer_radius || Math.min(width, height) * .28) * scale
    );
    const w = Math.min(bboxW * .88, safeRadius * 1.6);
    const d = Math.min(bboxD * .88, safeRadius * 1.6);
    const anchor = Array.isArray(room.viewer_anchor) ? room.viewer_anchor : null;
    const cx = ((anchor?.[0] ?? (x + width / 2)) - centerX) * scale;
    const cz = ((anchor?.[1] ?? (y + height / 2)) - centerY) * scale;
    const addBox = (bw, bh, bd, ox = 0, oz = 0, color = 0xd8ddd9, y = .28) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(Math.max(.12, bw), bh, Math.max(.12, bd)),
        new THREE.MeshStandardMaterial({ color, roughness: .8 })
      );
      mesh.position.set(cx + ox, y + bh / 2, cz + oz);
      mesh.castShadow = true;
      furnitureGroup.add(mesh);
      return mesh;
    };

    if (/침실|안방/.test(name) && w > .65 && d > .65) {
      const wall = nearestBoundaryDirection(room, anchor);
      const alongX = wall.axis === "x";
      const bedW = alongX
        ? Math.min(w * .72, safeRadius * 1.18)
        : Math.min(w * .56, safeRadius * .82);
      const bedD = alongX
        ? Math.min(d * .56, safeRadius * .82)
        : Math.min(d * .72, safeRadius * 1.18);
      const usableRadius = safeRadius * .9;
      const halfAlong = alongX ? bedW / 2 : bedD / 2;
      const halfAcross = alongX ? bedD / 2 : bedW / 2;
      const maxOffset = Math.max(
        0,
        Math.sqrt(Math.max(0, usableRadius ** 2 - halfAcross ** 2)) - halfAlong
      );
      const offsetX = alongX ? wall.sign * maxOffset : 0;
      const offsetZ = alongX ? 0 : wall.sign * maxOffset;
      addBox(bedW, .13, bedD, offsetX, offsetZ, 0x8a654c, .25);
      addBox(bedW * .88, .14, bedD * .88, offsetX, offsetZ, 0xe9e2d7, .38);
      if (alongX) {
        const headX = offsetX + wall.sign * bedW * .43;
        addBox(bedW * .11, .055, bedD * .3, offsetX + wall.sign * bedW * .25, -bedD * .2, 0xf6f2eb, .53);
        addBox(bedW * .11, .055, bedD * .3, offsetX + wall.sign * bedW * .25, bedD * .2, 0xf6f2eb, .53);
        addBox(bedW * .055, .25, bedD, headX, 0, 0x6f4e3d, .25);
      } else {
        const headZ = offsetZ + wall.sign * bedD * .43;
        addBox(bedW * .3, .055, bedD * .11, -bedW * .2, offsetZ + wall.sign * bedD * .25, 0xf6f2eb, .53);
        addBox(bedW * .3, .055, bedD * .11, bedW * .2, offsetZ + wall.sign * bedD * .25, 0xf6f2eb, .53);
        addBox(bedW, .25, bedD * .055, 0, headZ, 0x6f4e3d, .25);
      }
    } else if (/거실/.test(name) && w > 1.2 && d > 1.2) {
      addBox(w * .52, .25, d * .18, 0, d * .18, 0xb8b4a9, .26);
      addBox(w * .29, .13, d * .2, 0, -d * .08, 0x9b775b, .25);
      addBox(w * .43, .02, d * .34, 0, -d * .07, 0xd8cab8, .245);
      addBox(w * .43, .31, d * .05, 0, -d * .3, 0x5a4438, .24);
    } else if (/주방|식당/.test(name) && w > 1 && d > 1) {
      addBox(w * .68, .39, d * .14, 0, -d * .29, 0xb89570, .24);
      addBox(w * .43, .39, d * .24, 0, d * .05, 0xe7ded0, .24);
      addBox(w * .46, .045, d * .26, 0, d * .05, 0xf5f2ea, .63);
      [-.18, -.06, .06, .18].forEach((fraction) => {
        addBox(w * .04, .23, d * .04, w * fraction, d * .24, 0x7c604b, .24);
      });
    } else if (/욕실|화장실/.test(name) && w > .65 && d > .65) {
      addBox(w * .28, .34, d * .22, -w * .2, -d * .18, 0xf6f7f4, .24);
      addBox(w * .18, .3, d * .2, w * .2, d * .15, 0xf7f8f5, .24);
      addBox(w * .42, .5, d * .06, 0, -d * .36, 0x93a7a8, .24);
    } else if (/드레스룸|WIC|W\\.I\\.C/.test(name) && w > .7 && d > .7) {
      addBox(w * .13, .65, d * .72, -w * .35, 0, 0x9e7657, .24);
      addBox(w * .13, .65, d * .72, w * .35, 0, 0x9e7657, .24);
    }
  });
}

function updateLegend(rooms) {
  legendItems.replaceChildren();
  rooms.forEach((room, index) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    const swatch = document.createElement("i");
    swatch.style.background = palette[index % palette.length];
    const name = document.createElement("span");
    name.textContent = safeRoomName(room);
    item.append(swatch, name);
    legendItems.appendChild(item);
  });
}

function setIsometricView() {
  controls.enabled = true;
  controls.enableRotate = true;
  controls.enablePan = true;
  controls.enableZoom = true;
  camera.up.set(0, 1, 0);
  const distance = Math.max(13, currentExtent * 1.25);
  camera.position.set(distance * .68, distance * 1.18, distance * .8);
  controls.target.set(0, .25, 0);
  controls.update();
  setActiveView("isoView");
}

function setTopView() {
  controls.enabled = true;
  controls.enableRotate = false;
  controls.enablePan = false;
  controls.enableZoom = true;
  const distance = Math.max(18, currentExtent * 1.9);
  camera.up.set(0, 0, -1);
  camera.position.set(0, distance, .001);
  controls.target.set(0, 0, 0);
  controls.update();
  setActiveView("topView");
}

function setActiveView(id) {
  document.querySelectorAll("#topView, #isoView").forEach((button) =>
    button.classList.toggle("active", button.id === id)
  );
}

function resize() {
  const width = wrap.clientWidth;
  const height = wrap.clientHeight;
  camera.aspect = width / Math.max(height, 1);
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function updateLabels() {
  const width = wrap.clientWidth;
  const height = wrap.clientHeight;
  labelPoints.forEach(({ element, position }) => {
    const projected = position.clone().project(camera);
    const visible = projected.z > -1 && projected.z < 1;
    element.style.display = visible ? "block" : "none";
    element.style.left = `${(projected.x * .5 + .5) * width}px`;
    element.style.top = `${(-projected.y * .5 + .5) * height}px`;
  });
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateLabels();
  renderer.render(scene, camera);
}

let progressTimer;
function startProgress() {
  progress.classList.remove("hidden");
  let value = 8;
  progressBar.style.width = `${value}%`;
  progressPercent.textContent = `${value}%`;
  progressText.textContent = "공간 분석 중";
  progressTimer = setInterval(() => {
    value = Math.min(92, value + Math.max(1, Math.round((92 - value) / 9)));
    progressBar.style.width = `${value}%`;
    progressPercent.textContent = `${value}%`;
  }, 900);
}

function finishProgress(ok = true) {
  clearInterval(progressTimer);
  progressBar.style.width = ok ? "100%" : "0%";
  progressPercent.textContent = ok ? "100%" : "오류";
  progressText.textContent = ok ? "3D 변환 완료" : "분석하지 못했습니다";
  if (ok) setTimeout(() => progress.classList.add("hidden"), 900);
}

async function analyze(file) {
  if (!file) return;
  if (!["image/png", "image/jpeg"].includes(file.type)) {
    alert("PNG 또는 JPG 평면도를 선택해주세요.");
    return;
  }
  startProgress();
  planTitle.textContent = file.name;
  planSubtitle.textContent = "공간을 분석하고 있습니다";
  const body = new FormData();
  body.append("file", file);
  try {
    const response = await fetch("/api/analyze", { method: "POST", body });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    buildPlan(data);
    finishProgress(true);
  } catch (error) {
    console.error(error);
    finishProgress(false);
    alert("3D 변환 중 문제가 발생했습니다. Docker의 SPA 서비스가 실행 중인지 확인해주세요.");
  }
}

fileInput.addEventListener("change", () => analyze(fileInput.files[0]));
dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("dragging");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragging"));
dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("dragging");
  analyze(event.dataTransfer.files[0]);
});

document.querySelector("#isoView").addEventListener("click", setIsometricView);
document.querySelector("#topView").addEventListener("click", setTopView);
document.querySelector("#resetView").addEventListener("click", setIsometricView);
document.querySelector("#furnitureToggle").addEventListener("click", (event) => {
  furnitureGroup.visible = !furnitureGroup.visible;
  event.currentTarget.classList.toggle("active", furnitureGroup.visible);
  event.currentTarget.textContent = furnitureGroup.visible ? "가구 숨기기" : "가구 보기";
});
renderer.domElement.addEventListener("pointerdown", handleRoomPointerDown);
renderer.domElement.addEventListener("pointerup", handleRoomPointerUp);
renderer.domElement.addEventListener("pointercancel", handleRoomPointerCancel);
renderer.domElement.addEventListener("pointerleave", handleRoomPointerCancel);
window.addEventListener("resize", resize);

resize();
setIsometricView();
animate();
