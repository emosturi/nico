import { loadGithub } from "./github.js";

const STAGES = ["presentacion", "trabajos", "habilidades", "github", "contacto"];
const LABELS = ["Presentación", "Trabajos", "Habilidades", "GitHub", "Contacto"];
const PACK = "Pixel Crawler - Free Pack";
const NPC = `${PACK}/Entities/Npc's`;
const PEOPLE = [
  {
    name: "Campesina",
    walk: "peasantWalk",
    idle: "peasantIdle",
    walkFrames: 6,
    idleFrames: 4,
    foot: 47,
  },
  {
    name: "Taberna",
    walk: "tavernAWalk",
    idle: "tavernAIdle",
    walkFrames: 6,
    idleFrames: 4,
    foot: 47,
  },
  {
    name: "Posadera",
    walk: "tavernBWalk",
    idle: "tavernBIdle",
    walkFrames: 6,
    idleFrames: 4,
    foot: 47,
  },
  { name: "Caballero", walk: "knightRun", idle: "knightRun", walkFrames: 6, idleFrames: 1, foot: 63 },
  { name: "Pícara", walk: "rogueRun", idle: "rogueRun", walkFrames: 6, idleFrames: 1, foot: 63 },
  { name: "Maga", walk: "wizardRun", idle: "wizardRun", walkFrames: 6, idleFrames: 1, foot: 63 },
];
const HOUSES = [
  {
    shadow: [0, 32, 80, 32],
    wall: [0, 8, 72, 48],
    roof: [0, 6, 128, 72],
    door: [128, 25, 30, 46],
  },
  {
    shadow: [0, 0, 79, 32],
    wall: [208, 16, 80, 56],
    roof: [128, 6, 128, 72],
    door: [160, 25, 30, 46],
  },
  {
    shadow: [80, 0, 48, 48],
    wall: [0, 184, 128, 48],
    roof: [0, 80, 128, 88],
    door: [101, 29, 22, 40],
  },
  {
    shadow: [0, 32, 80, 32],
    wall: [0, 444, 104, 64],
    roof: [144, 80, 96, 88],
    door: [128, 25, 30, 46],
  },
  {
    shadow: [0, 32, 80, 32],
    wall: [320, 8, 96, 56],
    roof: [0, 6, 128, 72],
    door: [101, 29, 22, 40],
  },
];
const TREES = [
  { sheet: "pine", sx: 3, sy: 1, sw: 45, sh: 47 },
  { sheet: "pine", sx: 67, sy: 1, sw: 45, sh: 47 },
  { sheet: "pine", sx: 3, sy: 49, sw: 45, sh: 47 },
  { sheet: "pine", sx: 67, sy: 49, sw: 45, sh: 47 },
  { sheet: "round", sx: 32, sy: 2, sw: 32, sh: 62 },
  { sheet: "round", sx: 96, sy: 2, sw: 32, sh: 62 },
  { sheet: "round", sx: 161, sy: 17, sw: 26, sh: 47 },
  { sheet: "slim", sx: 0, sy: 5, sw: 30, sh: 75 },
  { sheet: "slim", sx: 64, sy: 5, sw: 30, sh: 75 },
  { sheet: "slim", sx: 0, sy: 85, sw: 30, sh: 75 },
  { sheet: "oak", sx: 4, sy: 4, sw: 37, sh: 76 },
  { sheet: "oak", sx: 52, sy: 4, sw: 37, sh: 76 },
  { sheet: "oak", sx: 99, sy: 6, sw: 40, sh: 74 },
];

const viewport = document.querySelector(".viewport");
const canvas = document.querySelector("#mundo");
const ctx = canvas.getContext("2d");
const dialog = document.querySelector("#dialog");
const sections = STAGES.map((id) => document.getElementById(id));
const buttons = [...document.querySelectorAll("nav button")];
const live = document.querySelector("#anuncio");
const aspecto = document.querySelector("#aspecto");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const sources = {
  floors: `${PACK}/Environment/Tilesets/Floors_Tiles.png`,
  water: `${PACK}/Environment/Tilesets/Water_tiles.png`,
  roofs: `${PACK}/Environment/Structures/Buildings/Roofs.png`,
  bwalls: `${PACK}/Environment/Structures/Buildings/Walls.png`,
  props: `${PACK}/Environment/Structures/Buildings/Props.png`,
  shadows: `${PACK}/Environment/Structures/Buildings/Shadows.png`,
  pine: `${PACK}/Environment/Props/Static/Trees/Model_02/Size_02.png`,
  round: `${PACK}/Environment/Props/Static/Trees/Model_01/Size_02.png`,
  slim: `${PACK}/Environment/Props/Static/Trees/Model_03/Size_02.png`,
  oak: `${PACK}/Environment/Props/Static/Trees/Model_02/Size_03.png`,
  peasantWalk: `${NPC}/Citizen_F/Peasant_A/Walk/Walk-Sheet.png`,
  peasantIdle: `${NPC}/Citizen_F/Peasant_A/Idle/Idle-Sheet.png`,
  tavernAWalk: `${NPC}/Citizen_F/Tavern_A/Walk/Walk_Side-Sheet.png`,
  tavernAIdle: `${NPC}/Citizen_F/Tavern_A/Idle/Idle_Side-Sheet.png`,
  tavernBWalk: `${NPC}/Citizen_F/Tavern_B/Walk/Walk_Side-Sheet.png`,
  tavernBIdle: `${NPC}/Citizen_F/Tavern_B/Idle/Idle_Side-Sheet.png`,
  knightRun: `${NPC}/Knight/Run/Run-Sheet.png`,
  rogueRun: `${NPC}/Rogue/Run/Run-Sheet.png`,
  wizardRun: `${NPC}/Wizzard/Run/Run-Sheet.png`,
};

let images = {};
let stageW = 800;
let stageH = 480;
let scale = 3;
let tilePx = 48;
let tilesX = 20;
let tilesY = 12;
let pathRow = 6;
let trees = [];
let charX = 0;
let charY = 0;
let facing = -1;
let toIndex = 0;
let personIndex = 0;
let anim = null;
let announced = "";

function hash(x, y) {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function span() {
  return tilesX / STAGES.length;
}

function doorOf(index) {
  const width = span();
  const left = Math.floor(index * width + width * 0.32);
  return { tx: left + 2, ty: pathRow - 1 };
}

function isWater(tx, ty) {
  if (ty === pathRow || ty === pathRow + 1) return false;
  if (ty <= 1 || ty >= tilesY - 2) return true;
  const width = span();
  for (let index = 1; index < STAGES.length; index += 1) {
    const col = Math.floor(index * width) + Math.round(Math.sin(ty * 0.55 + index) * 1);
    if (Math.abs(tx - col) <= 1) return true;
  }
  return false;
}

function waterAt(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= tilesX || ty >= tilesY) return false;
  return isWater(tx, ty);
}

function underHouse(tx, ty) {
  for (let index = 0; index < STAGES.length; index += 1) {
    const door = doorOf(index);
    if (Math.abs(tx - door.tx) <= 3 && ty <= pathRow + 4 && ty >= pathRow - 5) return true;
  }
  return false;
}

function stand(index) {
  const door = doorOf(index);
  return {
    x: (door.tx + 0.5) * tilePx,
    y: (pathRow + 1.2) * tilePx,
  };
}

function measure() {
  stageW = viewport.clientWidth;
  stageH = viewport.clientHeight;
  scale = Math.max(2, Math.min(3, Math.round(stageH / 240)));
  tilePx = 16 * scale;
  tilesX = Math.ceil((stageW * STAGES.length) / tilePx);
  tilesY = Math.max(10, Math.ceil(stageH / tilePx));
  pathRow = Math.max(5, Math.floor(tilesY * 0.48));
  trees = [];
  for (let ty = 0; ty < tilesY; ty += 1) {
    for (let tx = 0; tx < tilesX; tx += 1) {
      if (underHouse(tx, ty) || isWater(tx, ty)) continue;
      if (ty >= pathRow - 1 && ty <= pathRow + 1) continue;
      const roll = hash(tx, ty);
      const border = ty === 3 || ty === tilesY - 4;
      if (!border && roll < 0.8) continue;
      if (border && roll < 0.28) continue;
      trees.push({ tx, ty, kind: Math.floor(hash(tx + 9, ty + 3) * TREES.length) });
    }
  }
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.round(stageW * dpr));
  canvas.height = Math.max(1, Math.round(stageH * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

function tile(sheet, col, row, x, y) {
  const image = images[sheet];
  if (!image) return;
  ctx.drawImage(image, col * 16, row * 16, 16, 16, x, y, tilePx + 1, tilePx + 1);
}

function shoreOnLand(tx, ty) {
  const n = waterAt(tx, ty - 1);
  const s = waterAt(tx, ty + 1);
  const w = waterAt(tx - 1, ty);
  const e = waterAt(tx + 1, ty);
  if (n && w) return [1, 1];
  if (n && e) return [3, 1];
  if (s && w) return [1, 3];
  if (s && e) return [3, 3];
  if (n) return [2, 0];
  if (s) return [2, 4];
  if (w) return [0, 2];
  if (e) return [4, 2];
  if (waterAt(tx - 1, ty - 1)) return [1, 1];
  if (waterAt(tx + 1, ty - 1)) return [3, 1];
  if (waterAt(tx - 1, ty + 1)) return [1, 3];
  if (waterAt(tx + 1, ty + 1)) return [3, 3];
  return null;
}

function shoreOnWater(tx, ty) {
  if (waterAt(tx, ty - 1) && waterAt(tx, ty + 1) && waterAt(tx - 1, ty) && waterAt(tx + 1, ty)) {
    const se = !waterAt(tx + 1, ty + 1);
    const sw = !waterAt(tx - 1, ty + 1);
    const ne = !waterAt(tx + 1, ty - 1);
    const nw = !waterAt(tx - 1, ty - 1);
    if (se && !sw && !ne && !nw) return [0, 0];
    if (sw && !se && !ne && !nw) return [4, 0];
    if (ne && !se && !sw && !nw) return [0, 4];
    if (nw && !se && !sw && !ne) return [4, 4];
  }
  return null;
}

function drawGround(tx, ty, dx, dy, now) {
  if (ty === pathRow || ty === pathRow + 1) {
    tile("floors", (tx + ty) % 2 === 0 ? 16 : 17, 1, dx, dy);
    return;
  }
  if (isWater(tx, ty)) {
    tile("water", Math.floor(now / 480) % 2 ? 2 : 1, 6, dx, dy);
    const lip = shoreOnWater(tx, ty);
    if (lip) tile("water", lip[0], lip[1], dx, dy);
    return;
  }
  const lip = shoreOnLand(tx, ty);
  if (lip) {
    tile("water", lip[0], lip[1], dx, dy);
    return;
  }
  const roll = hash(tx, ty);
  tile("floors", roll > 0.82 ? 2 : 1, roll > 0.94 ? 11 : 10, dx, dy);
}

function blit(sheet, rect, centerX, bottomY) {
  const image = images[sheet];
  if (!image || !rect) return 0;
  const [sx, sy, sw, sh] = rect;
  const k = scale * 0.72;
  const w = sw * k;
  const h = sh * k;
  ctx.drawImage(image, sx, sy, sw, sh, centerX - w / 2, bottomY - h, w, h);
  return h;
}

function drawHouse(index, camX) {
  const house = HOUSES[index];
  const x = stand(index).x - camX;
  const foot = pathRow * tilePx;
  const k = scale * 0.72;
  if (house.shadow && images.shadows) {
    const shadowH = house.shadow[3] * k;
    ctx.save();
    ctx.globalAlpha = 0.8;
    blit("shadows", house.shadow, x, foot + shadowH * 0.62);
    ctx.restore();
  }
  const wallH = blit("bwalls", house.wall, x, foot);
  blit("props", house.door, x, foot);
  blit("roofs", house.roof, x, foot - wallH + 10 * scale);
}

function drawTree(tree, camX) {
  const crop = TREES[tree.kind];
  const image = images[crop.sheet];
  if (!image) return;
  const w = crop.sw * scale * 0.9;
  const h = crop.sh * scale * 0.9;
  const footX = tree.tx * tilePx + tilePx / 2 - camX;
  const footY = (tree.ty + 1) * tilePx + 4;
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, footX - w / 2, footY - h, w, h);
}

function drawCharacter(now, camX) {
  const person = PEOPLE[personIndex];
  const walking = Boolean(anim);
  const sheet = images[walking ? person.walk : person.idle];
  if (!sheet) return;
  const frames = walking ? person.walkFrames : person.idleFrames;
  const frame = Math.floor(now / (walking ? 110 : 220)) % frames;
  const drawn = 64 * scale * 0.82;
  const foot = (person.foot / 64) * drawn;
  ctx.save();
  ctx.translate(charX - camX, charY - foot + drawn / 2);
  if (facing > 0) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sheet, frame * 64, 0, 64, 64, -drawn / 2, -drawn / 2, drawn, drawn);
  ctx.restore();
}

function draw(now) {
  ctx.imageSmoothingEnabled = false;
  const camX = Math.max(0, Math.min(charX - stageW * 0.46, stageW * STAGES.length - stageW));
  const x0 = Math.floor(camX / tilePx) - 1;
  const x1 = Math.ceil((camX + stageW) / tilePx) + 1;
  ctx.fillStyle = "#2f6d18";
  ctx.fillRect(0, 0, stageW, stageH);

  for (let ty = 0; ty < tilesY; ty += 1) {
    for (let tx = x0; tx <= x1; tx += 1) {
      drawGround(tx, ty, tx * tilePx - camX, ty * tilePx, now);
    }
  }

  const sprites = trees
    .filter((tree) => tree.tx >= x0 - 2 && tree.tx <= x1 + 2)
    .map((tree) => ({ y: (tree.ty + 1) * tilePx, draw: () => drawTree(tree, camX) }));
  for (let index = 0; index < STAGES.length; index += 1) {
    sprites.push({ y: pathRow * tilePx, draw: () => drawHouse(index, camX) });
  }
  sprites.push({ y: charY, draw: () => drawCharacter(now, camX) });
  sprites.sort((a, b) => a.y - b.y);
  for (const sprite of sprites) sprite.draw();
}

function say(text) {
  if (announced === text) return;
  announced = text;
  live.textContent = text;
}

function mark(index) {
  buttons.forEach((button, item) => {
    if (item === index) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  });
  sections.forEach((section, item) => {
    section.hidden = item !== index;
    section.inert = item !== index;
  });
  say(LABELS[index]);
}

function arrive() {
  anim = null;
  dialog.hidden = false;
  mark(toIndex);
  sections[toIndex].querySelector(".card")?.scrollTo(0, 0);
}

function go(index) {
  const next = Math.max(0, Math.min(STAGES.length - 1, index));
  if (next === toIndex && !anim) return;
  const previous = toIndex;
  toIndex = next;
  facing = Math.sign(stand(next).x - charX) || (next >= previous ? 1 : -1);
  dialog.hidden = true;
  mark(next);
  const spot = stand(next);
  if (reduce) {
    charX = spot.x;
    charY = spot.y;
    arrive();
    return;
  }
  anim = {
    t0: performance.now(),
    dur: Math.min(1500, 480 + Math.abs(spot.x - charX) * 0.28),
    x0: charX,
    x1: spot.x,
    y: spot.y,
  };
}

function setPerson(step) {
  personIndex = (personIndex + step + PEOPLE.length) % PEOPLE.length;
  aspecto.textContent = `Personaje: ${PEOPLE[personIndex].name}`;
  say(aspecto.textContent);
}

buttons.forEach((button) => {
  button.addEventListener("click", () => go(Number(button.dataset.stage)));
});

document.querySelector(".skip")?.addEventListener("click", () => go(0));

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  if (event.key === "ArrowRight") {
    event.preventDefault();
    go(toIndex + 1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    go(toIndex - 1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    setPerson(1);
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    setPerson(-1);
  }
});

let touch = null;
canvas.addEventListener(
  "touchstart",
  (event) => {
    if (event.touches.length !== 1) return;
    touch = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  },
  { passive: true },
);
canvas.addEventListener(
  "touchmove",
  (event) => {
    if (touch) event.preventDefault();
  },
  { passive: false },
);
canvas.addEventListener("touchend", (event) => {
  if (!touch) return;
  const point = event.changedTouches[0];
  const dx = point.clientX - touch.x;
  const dy = point.clientY - touch.y;
  touch = null;
  if (Math.hypot(dx, dy) < 36) return;
  if (Math.abs(dx) >= Math.abs(dy)) go(toIndex + (dx > 0 ? 1 : -1));
  else setPerson(dy > 0 ? -1 : 1);
});

window.addEventListener("resize", () => {
  measure();
  anim = null;
  const spot = stand(toIndex);
  charX = spot.x;
  charY = spot.y;
  arrive();
});

function tick(now) {
  if (anim) {
    const t = Math.min(1, (now - anim.t0) / anim.dur);
    const lead = 1 - (1 - t) * (1 - t);
    charX = anim.x0 + (anim.x1 - anim.x0) * lead;
    charY = anim.y;
    if (t === 1) arrive();
  }
  draw(now);
  requestAnimationFrame(tick);
}

measure();
const home = stand(0);
charX = home.x;
charY = home.y;
mark(0);
dialog.hidden = false;

Promise.all(
  Object.entries(sources).map(async ([key, src]) => {
    const image = new Image();
    image.src = src;
    await image.decode();
    images[key] = image;
  }),
).catch(() => {
  /* el mapa sigue en pasto si un sprite no carga */
});

requestAnimationFrame(tick);
loadGithub();
