// Vice Cover — canvas rendering engine. No dependencies, no network.
// Draws the multi-panel cover art: layouts, grades, procedural skyline,
// per-panel label chips and the big gradient caption.

export const LAYOUTS = ['poster', 'triptych', 'grid', 'single', 'strip'];
export const GRADE_KEYS = ['sunset', 'neon', 'dusk', 'vice', 'noir'];

/** The four post sizes the app exports, in order. */
export const EXPORT_SIZES = [
  { name: '1x1', width: 1080, height: 1080 },
  { name: '4x5', width: 1080, height: 1350 },
  { name: '9x16', width: 1080, height: 1920 },
  { name: '16x9', width: 1920, height: 1080 },
];

/** One grade's palette. Noir is grayscale by design. */
export const GRADES = {
  sunset: {
    skyTop: '#2b1055', skyMid: '#7597de', skyLow: '#ff9a5a',
    sun: '#ffd166', sunGlow: 'rgba(255, 209, 102, 0.55)',
    building: '#1d1233', buildingAlt: '#2a1b4d',
    windowLit: '#ffd166', windowDim: '#b06a3b',
    captionA: '#ffb347', captionB: '#ff5e62', tagline: '#ffe8c9',
    chipBg: 'rgba(20, 8, 40, 0.85)', chipText: '#ffe8c9', scrim: 'rgba(10, 4, 24, 0.62)',
  },
  neon: {
    skyTop: '#0b0033', skyMid: '#3b0f66', skyLow: '#ff2e88',
    sun: '#ff5df2', sunGlow: 'rgba(255, 93, 242, 0.55)',
    building: '#12082e', buildingAlt: '#1e0b45',
    windowLit: '#35f1ff', windowDim: '#a13b8f',
    captionA: '#35f1ff', captionB: '#ff2e88', tagline: '#eafcff',
    chipBg: 'rgba(8, 4, 32, 0.85)', chipText: '#eafcff', scrim: 'rgba(6, 2, 24, 0.62)',
  },
  dusk: {
    skyTop: '#1a2340', skyMid: '#5a4a7a', skyLow: '#e07856',
    sun: '#ffb37a', sunGlow: 'rgba(255, 179, 122, 0.5)',
    building: '#141a2e', buildingAlt: '#232a4a',
    windowLit: '#ffc46b', windowDim: '#8a5a3c',
    captionA: '#ffb37a', captionB: '#e07856', tagline: '#ffe9d6',
    chipBg: 'rgba(14, 16, 34, 0.85)', chipText: '#ffe9d6', scrim: 'rgba(8, 8, 20, 0.62)',
  },
  vice: {
    skyTop: '#12082e', skyMid: '#7a1e6e', skyLow: '#ff7a3d',
    sun: '#ffcf4d', sunGlow: 'rgba(255, 207, 77, 0.55)',
    building: '#1c0a33', buildingAlt: '#2e1048',
    windowLit: '#ff8ad8', windowDim: '#96406f',
    captionA: '#ffcf4d', captionB: '#ff2e88', tagline: '#ffe3f2',
    chipBg: 'rgba(24, 6, 40, 0.85)', chipText: '#ffe3f2', scrim: 'rgba(12, 4, 26, 0.62)',
  },
  noir: {
    skyTop: '#101010', skyMid: '#3a3a3a', skyLow: '#777777',
    sun: '#eeeeee', sunGlow: 'rgba(238, 238, 238, 0.4)',
    building: '#0a0a0a', buildingAlt: '#1c1c1c',
    windowLit: '#d8d8d8', windowDim: '#5a5a5a',
    captionA: '#ffffff', captionB: '#9a9a9a', tagline: '#e8e8e8',
    chipBg: 'rgba(0, 0, 0, 0.85)', chipText: '#f2f2f2', scrim: 'rgba(0, 0, 0, 0.62)',
  },
};

/** Deterministic PRNG so a skyline looks the same on every run. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Panel rectangles for a layout inside a W x H canvas. */
export function layoutRects(layout, w, h) {
  const gap = 6;
  if (layout === 'single') return [{ x: 0, y: 0, w, h }];
  if (layout === 'triptych') {
    const cw = (w - gap * 2) / 3;
    return [0, 1, 2].map((i) => ({ x: i * (cw + gap), y: 0, w: cw, h }));
  }
  if (layout === 'grid') {
    const cw = (w - gap) / 2;
    const ch = (h - gap) / 2;
    return [
      { x: 0, y: 0, w: cw, h: ch },
      { x: cw + gap, y: 0, w: cw, h: ch },
      { x: 0, y: ch + gap, w: cw, h: ch },
      { x: cw + gap, y: ch + gap, w: cw, h: ch },
    ];
  }
  if (layout === 'strip') {
    const ch = (h - gap * 3) / 4;
    return [0, 1, 2, 3].map((i) => ({ x: 0, y: i * (ch + gap), w, h: ch }));
  }
  // poster: one tall panel left, three stacked right.
  const leftW = Math.round(w * 0.58);
  const rightX = leftW + gap;
  const rightW = w - rightX;
  const rh = (h - gap * 2) / 3;
  return [
    { x: 0, y: 0, w: leftW, h },
    { x: rightX, y: 0, w: rightW, h: rh },
    { x: rightX, y: rh + gap, w: rightW, h: rh },
    { x: rightX, y: (rh + gap) * 2, w: rightW, h: rh },
  ];
}

/** Which panel index, if any, holds the point (x, y) on a W x H canvas. */
export function panelAtPoint(layout, w, h, x, y) {
  const rects = layoutRects(layout, w, h);
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return i;
  }
  return -1;
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** An original procedural sunset skyline: gradient sky, glowing sun, buildings, lit windows. */
export function drawSkyline(ctx, r, pal, seed) {
  const rnd = mulberry32(seed);
  const sky = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
  sky.addColorStop(0, pal.skyTop);
  sky.addColorStop(0.55, pal.skyMid);
  sky.addColorStop(1, pal.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Sun with a soft glow, grade-aware (grayscale for Noir).
  const sx = r.x + r.w * (0.28 + rnd() * 0.44);
  const sy = r.y + r.h * 0.44;
  const sr = Math.min(r.w, r.h) * 0.17;
  const glow = ctx.createRadialGradient(sx, sy, sr * 0.2, sx, sy, sr * 2.4);
  glow.addColorStop(0, pal.sunGlow);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sx - sr * 2.4, sy - sr * 2.4, sr * 4.8, sr * 4.8);
  ctx.fillStyle = pal.sun;
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  ctx.fill();

  // Buildings with lit windows, left to right.
  let x = r.x;
  while (x < r.x + r.w - 4) {
    const bw = Math.max(18, r.w * (0.07 + rnd() * 0.13));
    const bh = r.h * (0.22 + rnd() * 0.48);
    const bx = x;
    const by = r.y + r.h - bh;
    ctx.fillStyle = rnd() < 0.5 ? pal.building : pal.buildingAlt;
    ctx.fillRect(bx, by, bw, bh);
    const cols = Math.max(1, Math.floor(bw / 15));
    const rows = Math.max(1, Math.floor(bh / 19));
    for (let c = 0; c < cols; c++) {
      for (let row = 0; row < rows; row++) {
        const lit = rnd() < 0.45;
        ctx.fillStyle = lit ? pal.windowLit : pal.windowDim;
        ctx.globalAlpha = lit ? 0.95 : 0.5;
        ctx.fillRect(bx + 4 + c * 15, by + 6 + row * 19, 7, 9);
      }
    }
    ctx.globalAlpha = 1;
    x += bw + 2;
  }
}

/** A panel's photo, cover-fit with its pan and zoom; skyline when it has no photo. */
function drawPanelImage(ctx, r, panel, pal, index) {
  if (!panel.image) {
    drawSkyline(ctx, r, pal, 1000 + index * 77);
    return;
  }
  const img = panel.image;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(r.w / iw, r.h / ih) * (panel.zoom || 1);
  const dw = iw * base;
  const dh = ih * base;
  const dx = r.x + (r.w - dw) / 2 + (panel.offsetX || 0);
  const dy = r.y + (r.h - dh) / 2 + (panel.offsetY || 0);
  ctx.drawImage(img, dx, dy, dw, dh);
}

/** A short label chip at the panel's top-left corner, sized to the panel. */
function drawChip(ctx, r, label, pal) {
  const pad = 10;
  const fontSize = Math.max(13, Math.round(Math.min(r.w, r.h) * 0.045));
  const chipH = fontSize + 15;
  ctx.font = `700 ${fontSize}px "Helvetica Neue", Arial, sans-serif`;
  const tw = ctx.measureText(label).width;
  const cw = tw + pad * 2;
  const cx = r.x + 12;
  const cy = r.y + 12;
  ctx.fillStyle = pal.chipBg;
  roundRectPath(ctx, cx, cy, cw, chipH, 8);
  ctx.fill();
  ctx.fillStyle = pal.chipText;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx + pad, cy + chipH / 2 + 1);
}

/** Filmstrip sprocket holes along a strip frame's edges. */
function drawSprockets(ctx, r) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  const hole = 10;
  const step = 26;
  for (let y = r.y + 8; y + hole < r.y + r.h - 4; y += step) {
    roundRectPath(ctx, r.x + 5, y, hole, hole, 3);
    ctx.fill();
    roundRectPath(ctx, r.x + r.w - 15, y, hole, hole, 3);
    ctx.fill();
  }
}

/** The caption band: scrim, huge condensed gradient lettering, tagline. */
function drawCaptionBlock(ctx, w, h, caption, tagline, pal) {
  const bandH = Math.round(h * 0.21);
  const scrim = ctx.createLinearGradient(0, h - bandH, 0, h);
  scrim.addColorStop(0, 'rgba(0, 0, 0, 0)');
  scrim.addColorStop(1, pal.scrim);
  ctx.fillStyle = scrim;
  ctx.fillRect(0, h - bandH, w, bandH);

  const family = '"Arial Narrow", Impact, "Helvetica Neue", sans-serif';
  let size = Math.round(w * 0.115);
  const fit = (s) => {
    ctx.font = `900 ${s}px ${family}`;
    return ctx.measureText(caption).width;
  };
  while (size > 26 && fit(size) > w * 0.92) size -= 2;
  ctx.font = `900 ${size}px ${family}`;
  const grad = ctx.createLinearGradient(0, h - bandH * 0.85, 0, h - 6);
  grad.addColorStop(0, pal.captionA);
  grad.addColorStop(1, pal.captionB);
  ctx.fillStyle = grad;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(caption, w / 2, h - bandH * 0.3);

  const tagSize = Math.max(14, Math.round(w * 0.018));
  ctx.font = `600 ${tagSize}px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = pal.tagline;
  ctx.fillText(tagline, w / 2, h - Math.round(bandH * 0.09));
}

/** Draw the whole cover for `state` onto `canvas` (its width/height are the render size). */
export function renderCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const pal = GRADES[state.grade] || GRADES.sunset;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = pal.skyLow;
  ctx.fillRect(0, 0, w, h);
  const rects = layoutRects(state.layout, w, h);
  rects.forEach((r, i) => {
    const panel = state.panels[i];
    if (!panel) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    drawPanelImage(ctx, r, panel, pal, i);
    ctx.restore();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
    if (panel.label) drawChip(ctx, r, panel.label, pal);
    if (state.layout === 'strip') drawSprockets(ctx, r);
  });
  drawCaptionBlock(ctx, w, h, state.caption, state.tagline, pal);
}

/** An offscreen canvas with the cover rendered at width x height. */
export function renderToCanvas(state, width, height) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  renderCover(c, state);
  return c;
}
