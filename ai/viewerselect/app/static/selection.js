const fileInput = document.querySelector("#fileInput");
const uploadCard = document.querySelector("#uploadCard");
const loadingPanel = document.querySelector("#loadingPanel");
const loadingText = document.querySelector("#loadingText");
const resultPanel = document.querySelector("#resultPanel");
const errorMessage = document.querySelector("#errorMessage");
const floorPlan = document.querySelector("#floorPlan");
const roomCards = document.querySelector("#roomCards");
const selectedRoom = document.querySelector("#selectedRoom");
const selectedState = document.querySelector("#selectedState");
const detectedCount = document.querySelector("#detectedCount");
const selectAll = document.querySelector("#selectAll");
const clearSelection = document.querySelector("#clearSelection");
const nextButton = document.querySelector("#nextButton");

const SVG_NS = "http://www.w3.org/2000/svg";
const colors = [
  "#a8d39a", "#efc47d", "#d3cbc0", "#da9b8c", "#9bc9e8", "#d9b5e7",
  "#9bd7d2", "#f0df95", "#c8b18e", "#e7a4c2", "#b8d5a2", "#d8b9a5",
  "#b6c9e4", "#cad6bc", "#efd0a1", "#b7d9d3"
];

let rooms = [];
const selectedIds = new Set();
let activeId = null;

function roomId(room, index) {
  return String(room.instance_id ?? `${room.class_id ?? "room"}-${index}`);
}

function roomName(room, index) {
  const value = String(room.display_name || room.room_name || "").trim();
  return value && !value.startsWith("class_") ? value : `공간 ${index + 1}`;
}

function roomPolygons(room) {
  const polygons = room.viewer_polygons || room.polygons || [];
  if (polygons.length) return polygons;
  const box = room.bbox;
  if (!box) return [];
  return [[
    [box.x, box.y],
    [box.x + box.width, box.y],
    [box.x + box.width, box.y + box.height],
    [box.x, box.y + box.height]
  ]];
}

function polygonArea(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    sum += current[0] * next[1] - next[0] * current[1];
  }
  return Math.abs(sum / 2);
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const crosses = (yi > point[1]) !== (yj > point[1])
      && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function distanceToSegment(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const lengthSquared = dx * dx + dy * dy;
  const ratio = lengthSquared
    ? Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / lengthSquared))
    : 0;
  return Math.hypot(point[0] - (start[0] + dx * ratio), point[1] - (start[1] + dy * ratio));
}

function distanceToPolygon(point, polygon) {
  let minimum = Infinity;
  for (let i = 0; i < polygon.length; i += 1) {
    minimum = Math.min(minimum, distanceToSegment(point, polygon[i], polygon[(i + 1) % polygon.length]));
  }
  return minimum;
}

function polygonCenter(polygons, fallback) {
  const polygon = [...polygons].sort((a, b) => polygonArea(b) - polygonArea(a))[0];
  if (!polygon?.length) {
    return [fallback.x + fallback.width / 2, fallback.y + fallback.height / 2];
  }
  const xs = polygon.map((point) => point[0]);
  const ys = polygon.map((point) => point[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const columns = 32;
  const rows = 32;
  let bestPoint = [fallback.x + fallback.width / 2, fallback.y + fallback.height / 2];
  let bestDistance = pointInPolygon(bestPoint, polygon) ? distanceToPolygon(bestPoint, polygon) : -1;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const candidate = [
        minX + ((column + .5) / columns) * (maxX - minX),
        minY + ((row + .5) / rows) * (maxY - minY)
      ];
      if (!pointInPolygon(candidate, polygon)) continue;
      const distance = distanceToPolygon(candidate, polygon);
      if (distance > bestDistance) {
        bestPoint = candidate;
        bestDistance = distance;
      }
    }
  }
  return bestPoint;
}

function createSvgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

function updateSelectionUI() {
  document.querySelectorAll("[data-room-id]").forEach((element) => {
    element.classList.toggle("selected", selectedIds.has(element.dataset.roomId));
  });

  const roomLookup = new Map(
    rooms.map((room, index) => [
      roomId(room, index),
      { id: roomId(room, index), name: roomName(room, index) }
    ])
  );
  const selectedRooms = [...selectedIds]
    .map((id) => roomLookup.get(id))
    .filter(Boolean);
  const selectedNames = selectedRooms.map((room) => room.name);

  if (selectedNames.length) {
    selectedRoom.replaceChildren();
    selectedRooms.forEach(({ id, name }) => {
      const chip = document.createElement("span");
      chip.className = "selected-room-chip";

      const label = document.createElement("span");
      label.textContent = name;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.setAttribute("aria-label", `${name} 선택 해제`);
      remove.textContent = "×";
      remove.addEventListener("click", () => {
        selectedIds.delete(id);
        updateSelectionUI();
      });

      chip.append(label, remove);
      selectedRoom.append(chip);
    });
    selectedState.textContent = `${selectedNames.length}개 공간 선택됨`;
  } else {
    selectedRoom.textContent = "-";
    selectedState.textContent = "공간을 선택해주세요";
  }
  nextButton.disabled = selectedIds.size === 0;
}

function toggleRoom(id) {
  activeId = id;
  if (selectedIds.has(id)) selectedIds.delete(id);
  else selectedIds.add(id);
  updateSelectionUI();
}

function renderPlan(data) {
  rooms = (data.rooms || []).filter((room) => {
    const name = String(room.display_name || room.room_name || "").trim();
    const unnamedStructure = room.class_id === 12 && (!name || name.includes("class_"));
    return room.class_id !== 0 && Number(room.pixel_count || 0) > 800 && !unnamedStructure && roomPolygons(room).length;
  });
  if (!rooms.length) throw new Error("표시할 공간을 찾지 못했습니다.");
  selectedIds.clear();
  activeId = null;
  floorPlan.replaceChildren();
  roomCards.replaceChildren();

  const allPoints = rooms.flatMap((room) => roomPolygons(room).flat());
  const minX = Math.min(...allPoints.map((point) => point[0]));
  const minY = Math.min(...allPoints.map((point) => point[1]));
  const maxX = Math.max(...allPoints.map((point) => point[0]));
  const maxY = Math.max(...allPoints.map((point) => point[1]));
  const padding = Math.max(18, Math.min(maxX - minX, maxY - minY) * .035);
  floorPlan.setAttribute("viewBox", `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`);
  floorPlan.setAttribute("preserveAspectRatio", "xMidYMid meet");

  rooms.forEach((room, index) => {
    const id = roomId(room, index);
    const name = roomName(room, index);
    const polygons = roomPolygons(room);
    const group = createSvgElement("g", { "data-room-id": id, tabindex: "0", role: "button", "aria-label": `${name} 선택` });
    group.dataset.roomId = id;

    polygons.forEach((points) => {
      const polygon = createSvgElement("polygon", {
        points: points.map((point) => point.join(",")).join(" "),
        fill: colors[index % colors.length],
        class: "room-shape",
        "data-room-id": id
      });
      group.appendChild(polygon);
    });

    const center = polygonCenter(polygons, room.bbox || { x: 0, y: 0, width: 0, height: 0 });
    const label = createSvgElement("text", { x: center[0], y: center[1], class: "room-label" });
    label.textContent = name;
    group.appendChild(label);
    group.addEventListener("click", () => toggleRoom(id));
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleRoom(id);
      }
    });
    floorPlan.appendChild(group);

    const card = document.createElement("button");
    card.type = "button";
    card.className = "room-card";
    card.dataset.roomId = id;
    card.textContent = name;
    card.addEventListener("click", () => toggleRoom(id));
    roomCards.appendChild(card);
  });

  detectedCount.textContent = `${rooms.length}개`;
  updateSelectionUI();
}

async function analyze(file) {
  if (!file) return;
  uploadCard.classList.add("hidden");
  resultPanel.classList.add("hidden");
  errorMessage.classList.add("hidden");
  loadingPanel.classList.remove("hidden");
  loadingText.textContent = "OCR·SPA 결과를 불러오는 중입니다.";

  const body = new FormData();
  body.append("file", file);
  try {
    const response = await fetch("/api/analyze", { method: "POST", body });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `분석 요청 실패 (${response.status})`);
    }
    loadingText.textContent = "선택 가능한 평면도를 만드는 중입니다.";
    renderPlan(await response.json());
    loadingPanel.classList.add("hidden");
    resultPanel.classList.remove("hidden");
  } catch (error) {
    loadingPanel.classList.add("hidden");
    uploadCard.classList.remove("hidden");
    errorMessage.textContent = `평면도를 분석하지 못했습니다. ${error.message}`;
    errorMessage.classList.remove("hidden");
  }
}

fileInput.addEventListener("change", () => analyze(fileInput.files[0]));
selectAll.addEventListener("click", () => {
  rooms.forEach((room, index) => selectedIds.add(roomId(room, index)));
  activeId = null;
  updateSelectionUI();
});
clearSelection.addEventListener("click", () => {
  selectedIds.clear();
  activeId = null;
  updateSelectionUI();
});

nextButton.addEventListener("click", () => {
  const roomLookup = new Map(rooms.map((room, index) => [roomId(room, index), room]));
  const selectedRooms = [...selectedIds].map((id) => roomLookup.get(id)).filter(Boolean);
  window.dispatchEvent(new CustomEvent("spaceup:rooms-selected", { detail: { rooms: selectedRooms } }));
});
