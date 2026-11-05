import { loadGithub } from "./github.js";

const STAGES = ["presentacion", "trabajos", "habilidades", "github", "contacto"];
const LABELS = ["Presentación", "Trabajos", "Habilidades", "GitHub", "Contacto"];
const PACK = "Pixel Crawler - Free Pack";

const viewport = document.querySelector(".viewport");
const canvas = document.querySelector("#mundo");
const ctx = canvas.getContext("2d");
const track = document.querySelector("#track");
const sections = STAGES.map((id) => document.getElementById(id));
const buttons = [...document.querySelectorAll("nav button")];
const live = document.querySelector("#anuncio");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const assets = {
  floors: `${PACK}/Environment/Tilesets/Floors_Tiles.png`,
  walk: `${PACK}/Entities/Characters/Body_A/Animations/Walk_Base/Walk_Side-Sheet.png`,
  idle: `${PACK}/Entities/Characters/Body_A/Animations/Idle_Base/Idle_Side-Sheet.png`,
  trees: `${PACK}/Environment/Props/Static/Trees/Model_02/Size_02.png`,
  props: `${PACK}/Environment/Structures/Stations/Workbench/Workbench.png`,
};

const props = [
  { sheet: "trees", sx: 3, sy: 1, sw: 45, sh: 47, at: 0.06 },
  { sheet: "trees", sx: 67, sy: 49, sw: 45, sh: 47, at: 0.9 },
  { sheet: "props", sx: 48, sy: 72, sw: 48, sh: 40, at: 1.72 },
  { sheet: "trees", sx: 3, sy: 49, sw: 45, sh: 47, at: 1.08 },
  { sheet: "props", sx: 112, sy: 294, sw: 80, sh: 58, at: 2.62 },
  { sheet: "props", sx: 0, sy: 199, sw: 32, sh: 25, at: 3.55 },
  { sheet: "trees", sx: 67, sy: 1, sw: 45, sh: 47, at: 3.12 },
  { sheet: "props", sx: 48, sy: 250, sw: 48, sh: 38, at: 4.7 },
  { sheet: "trees", sx: 3, sy: 1, sw: 45, sh: 47, at: 4.08 },
];

let images = {};
let stageW = 800;
let stageH = 480;
let scale = 3;
let cam = 0;
let charX = 0;
let facing = 1;
let toIndex = 0;
let anim = null;
let announced = -1;

function stand(index) {
  return index * stageW + stageW * 0.58;
}

function measure() {
  stageW = viewport.clientWidth;
  stageH = viewport.clientHeight;
  scale = Math.max(2, Math.min(3, Math.round(stageH / 240)));
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.round(stageW * dpr));
  canvas.height = Math.max(1, Math.round(stageH * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  track.style.width = `${stageW * STAGES.length}px`;
  for (const section of sections) section.style.flexBasis = `${stageW}px`;
}

function tile(sheet, col, row, x, y, size) {
  const image = images[sheet];
  if (!image) return;
  ctx.drawImage(image, col * 16, row * 16, 16, 16, x, y, size, size);
}

function drawProp(prop, groundY) {
  const image = images[prop.sheet];
  if (!image) return;
  const x = prop.at * stageW - cam;
  const w = prop.sw * scale;
  const h = prop.sh * scale;
  ctx.drawImage(image, prop.sx, prop.sy, prop.sw, prop.sh, x, groundY - h, w, h);
}

function drawCharacter(now, groundY) {
  const walking = Boolean(anim);
  const sheet = images[walking ? "walk" : "idle"];
  if (!sheet) return;
  const count = walking ? 6 : 4;
  const frame = Math.floor(now / (walking ? 110 : 180)) % count;
  const body = scale + 1;
  const size = 64 * body;
  const feet = 47 * body;
  const screenX = charX - cam - 32 * body;
  const screenY = groundY - feet;
  ctx.save();
  ctx.translate(screenX + size / 2, screenY);
  ctx.scale(facing, 1);
  ctx.drawImage(sheet, frame * 64, 0, 64, 64, -size / 2, 0, size, size);
  ctx.restore();
}

function draw(now) {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#8ec8e3";
  ctx.fillRect(0, 0, stageW, stageH);

  const tilePx = 16 * scale;
  const pathTop = stageH - tilePx * 2;
  const grassTop = pathTop - tilePx * 4;
  const worldW = stageW * STAGES.length;

  for (let x = -tilePx; x < worldW + tilePx; x += tilePx) {
    const col = Math.floor(x / tilePx);
    for (let row = 0; row < 4; row += 1) {
      const variant = (col + row) % 3 === 0 ? 2 : 1;
      tile("floors", variant, 10, x - cam, grassTop + row * tilePx, tilePx + 1);
    }
    const pathCol = col % 2 === 0 ? 16 : 17;
    tile("floors", pathCol, 1, x - cam, pathTop, tilePx + 1);
    tile("floors", pathCol, 2, x - cam, pathTop + tilePx, tilePx + 1);
  }

  const ordered = [...props].sort((a, b) => a.at - b.at);
  for (const prop of ordered) drawProp(prop, pathTop + 2);
  drawCharacter(now, pathTop + 4);
  track.style.transform = `translate3d(${-cam}px, 0, 0)`;
}

function mark(index) {
  buttons.forEach((button, item) => {
    if (item === index) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  });
  sections.forEach((section, item) => {
    section.inert = item !== index;
  });
  if (announced !== index) {
    announced = index;
    live.textContent = LABELS[index];
  }
}

function go(index) {
  const next = Math.max(0, Math.min(STAGES.length - 1, index));
  if (next === toIndex && !anim) return;
  const previous = toIndex;
  toIndex = next;
  facing = Math.sign(next - previous) || facing;
  mark(next);
  const x1 = stand(next);
  const cam1 = next * stageW;
  if (reduce) {
    anim = null;
    charX = x1;
    cam = cam1;
    return;
  }
  anim = {
    t0: performance.now(),
    dur: Math.min(1400, 460 + Math.abs(x1 - charX) * 0.32),
    x0: charX,
    x1,
    cam0: cam,
    cam1,
  };
}

function tick(now) {
  if (anim) {
    const t = Math.min(1, (now - anim.t0) / anim.dur);
    const lead = 1 - (1 - t) * (1 - t);
    const follow = t * t * (3 - 2 * t);
    charX = anim.x0 + (anim.x1 - anim.x0) * lead;
    cam = anim.cam0 + (anim.cam1 - anim.cam0) * follow;
    if (t === 1) anim = null;
  }
  draw(now);
  requestAnimationFrame(tick);
}

buttons.forEach((button) => {
  button.addEventListener("click", () => go(Number(button.dataset.stage)));
});

document.querySelector(".skip")?.addEventListener("click", () => go(0));

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
  event.preventDefault();
  go(toIndex + (event.key === "ArrowRight" ? 1 : -1));
});

window.addEventListener("resize", () => {
  measure();
  anim = null;
  cam = toIndex * stageW;
  charX = stand(toIndex);
});

measure();
charX = stand(0);
cam = 0;
mark(0);

Promise.all(
  Object.entries(assets).map(async ([key, src]) => {
    const image = new Image();
    image.src = src;
    try {
      await image.decode();
      images[key] = image;
    } catch {
      /* el escenario sigue con el cielo si un sprite no carga */
    }
  }),
).then(() => {
  images = { ...images };
});

requestAnimationFrame(tick);
loadGithub();
