// Vice Cover — editor wiring: state, controls, pointer interaction,
// keyboard shortcuts, shuffle, export. The canvas is drawn by cover.js.

import {
  EXPORT_SIZES,
  GRADE_KEYS,
  GRADES,
  LAYOUTS,
  panelAtPoint,
  renderCover,
  renderToCanvas,
} from './cover.js';
import { applyScene, parseScene } from './shots.js';

const LABEL_WORDS = ['PIER', 'BOULEVARD', 'OCEAN', 'PALM ROW', 'VICE', 'NEON', 'CHROME', 'DUSK', 'SUNSET', 'HEIST'];
const SAMPLE_NAMES = ['pier', 'boulevard'];

const canvas = document.getElementById('cover');
const layoutBar = document.getElementById('layout-bar');
const gradeBar = document.getElementById('grade-bar');
const shuffleBtn = document.getElementById('shuffle');
const exportBtn = document.getElementById('export-all');
const formatSel = document.getElementById('format');
const captionInput = document.getElementById('caption');
const taglineInput = document.getElementById('tagline');
const panelsBox = document.getElementById('panels');
const samplesBtn = document.getElementById('load-samples');

/** One panel: a photo (or none for the skyline), its crop and its label. */
function freshPanel(sample, label) {
  return { image: null, sample, offsetX: 0, offsetY: 0, zoom: 1, label };
}

const state = {
  layout: 'poster',
  grade: 'sunset',
  caption: 'SUNSET HEIST',
  tagline: 'EVERY SCORE HAS A SUNSET.',
  format: 'png',
  selected: 0,
  panels: [
    freshPanel('pier', 'PIER'),
    freshPanel('boulevard', 'BOULEVARD'),
    freshPanel(null, 'OCEAN'),
    freshPanel(null, 'PALM ROW'),
  ],
};

/** Load a built-in sample photo; null when it fails to load. */
function loadSample(name) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = `samples/${name}.jpg`;
  });
}

/** Clear every panel's photo first, then load the samples in fresh. */
async function loadSamples() {
  // Panels that already hold an image (a scene just loaded one) keep it;
  // only a panel with no sample loses its photo here.
  state.panels.forEach((p) => {
    if (!p.sample) p.image = null;
  });
  const jobs = state.panels.map(async (panel) => {
    if (!panel.sample || panel.image) return;
    panel.image = await loadSample(panel.sample);
  });
  await Promise.all(jobs);
  render();
}

function render() {
  renderCover(canvas, state);
  syncControls();
}

/** Keep buttons, inputs and panel rows showing the current state. */
function syncControls() {
  layoutBar.querySelectorAll('button').forEach((b) => {
    b.classList.toggle('on', b.dataset.layout === state.layout);
    b.setAttribute('aria-pressed', b.dataset.layout === state.layout ? 'true' : 'false');
  });
  gradeBar.querySelectorAll('button').forEach((b) => {
    b.classList.toggle('on', b.dataset.grade === state.grade);
    b.setAttribute('aria-pressed', b.dataset.grade === state.grade ? 'true' : 'false');
  });
  if (captionInput.value !== state.caption) captionInput.value = state.caption;
  if (taglineInput.value !== state.tagline) taglineInput.value = state.tagline;
  panelsBox.querySelectorAll('.panel-row').forEach((row, i) => {
    row.classList.toggle('active', i === state.selected);
    const zoom = row.querySelector('.zoom');
    if (zoom && Number(zoom.value) !== state.panels[i].zoom) zoom.value = state.panels[i].zoom;
    const label = row.querySelector('.label');
    if (label && label.value !== state.panels[i].label) label.value = state.panels[i].label;
  });
}

/** Set the layout, then redraw. */
function setLayout(layout) {
  if (!LAYOUTS.includes(layout)) return;
  state.layout = layout;
  render();
}

/** Step to the next grade, wrapping around. */
function cycleGrade() {
  const i = GRADE_KEYS.indexOf(state.grade);
  state.grade = GRADE_KEYS[(i + 1) % GRADE_KEYS.length];
  render();
}

/** Random layout, grade, crops and labels. */
function randomize() {
  state.layout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)];
  state.grade = GRADE_KEYS[Math.floor(Math.random() * GRADE_KEYS.length)];
  state.panels.forEach((panel) => {
    panel.zoom = 1 + Math.random() * 1.4;
    panel.offsetX = (Math.random() - 0.5) * 120;
    panel.offsetY = (Math.random() - 0.5) * 120;
    panel.label = LABEL_WORDS[Math.floor(Math.random() * LABEL_WORDS.length)];
  });
  render();
}

/** Reset one panel's crop, keeping its photo and label. */
function resetPanel(i) {
  const panel = state.panels[i];
  panel.offsetX = 0;
  panel.offsetY = 0;
  panel.zoom = 1;
  render();
}

/** Download one canvas as a file. */
function downloadCanvas(art, name, format) {
  const type = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const quality = format === 'jpeg' ? 0.92 : undefined;
  art.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, type, quality);
}

/** Export all four post sizes in the chosen format. */
function exportAll() {
  const format = formatSel.value === 'jpeg' ? 'jpeg' : 'png';
  const ext = format === 'jpeg' ? 'jpg' : 'png';
  EXPORT_SIZES.forEach((size) => {
    const art = renderToCanvas(state, size.width, size.height);
    downloadCanvas(art, `vice-cover-${size.name}.${ext}`, format);
  });
}

/** Build the four panel rows: label, upload, zoom, reset. */
function buildPanelRows() {
  state.panels.forEach((panel, i) => {
    const row = document.createElement('div');
    row.className = 'panel-row';
    row.dataset.index = String(i);

    const title = document.createElement('span');
    title.className = 'panel-name';
    title.textContent = `Panel ${i + 1}`;
    row.appendChild(title);

    const label = document.createElement('input');
    label.className = 'label';
    label.type = 'text';
    label.value = panel.label;
    label.maxLength = 12;
    label.setAttribute('aria-label', `Label for panel ${i + 1}`);
    label.addEventListener('input', () => {
      panel.label = label.value.toUpperCase();
      render();
    });
    row.appendChild(label);

    const upload = document.createElement('label');
    upload.className = 'upload';
    upload.textContent = 'Upload photo';
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'image/*';
    file.setAttribute('aria-label', `Upload a photo for panel ${i + 1}`);
    file.addEventListener('change', () => {
      const picked = file.files && file.files[0];
      if (!picked) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          panel.image = img;
          panel.sample = null;
          panel.offsetX = 0;
          panel.offsetY = 0;
          panel.zoom = 1;
          render();
        };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(picked);
    });
    upload.appendChild(file);
    row.appendChild(upload);

    const zoom = document.createElement('input');
    zoom.className = 'zoom';
    zoom.type = 'range';
    zoom.min = '1';
    zoom.max = '3';
    zoom.step = '0.05';
    zoom.value = String(panel.zoom);
    zoom.setAttribute('aria-label', `Zoom for panel ${i + 1}`);
    zoom.addEventListener('input', () => {
      panel.zoom = Number(zoom.value);
      render();
    });
    row.appendChild(zoom);

    const reset = document.createElement('button');
    reset.className = 'reset';
    reset.type = 'button';
    reset.textContent = 'Reset';
    reset.setAttribute('aria-label', `Reset panel ${i + 1} crop`);
    reset.addEventListener('click', () => resetPanel(i));
    row.appendChild(reset);

    row.addEventListener('click', (e) => {
      if (e.target === row || e.target === title) {
        state.selected = i;
        render();
      }
    });
    panelsBox.appendChild(row);
  });
}

/** Canvas pointer position in backing pixels. */
function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * canvas.width,
    y: ((e.clientY - rect.top) / rect.height) * canvas.height,
  };
}

let drag = null;

canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const hit = panelAtPoint(state.layout, canvas.width, canvas.height, p.x, p.y);
  if (hit < 0) return;
  state.selected = hit;
  drag = { x: p.x, y: p.y, moved: false };
  canvas.setPointerCapture(e.pointerId);
  render();
});

canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const panel = state.panels[state.selected];
  if (!panel || !panel.image) return;
  const dx = p.x - drag.x;
  const dy = p.y - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
  panel.offsetX += dx;
  panel.offsetY += dy;
  drag.x = p.x;
  drag.y = p.y;
  render();
});

canvas.addEventListener('pointerup', () => {
  drag = null;
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = state.panels[state.selected];
  if (!panel) return;
  const next = panel.zoom + (e.deltaY < 0 ? 0.1 : -0.1);
  panel.zoom = Math.min(3, Math.max(1, next));
  render();
}, { passive: false });

layoutBar.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-layout]');
  if (btn) setLayout(btn.dataset.layout);
});

gradeBar.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-grade]');
  if (btn && GRADES[btn.dataset.grade]) {
    state.grade = btn.dataset.grade;
    render();
  }
});

shuffleBtn.addEventListener('click', randomize);
exportBtn.addEventListener('click', exportAll);
samplesBtn.addEventListener('click', loadSamples);
formatSel.addEventListener('change', () => {
  state.format = formatSel.value;
});
captionInput.addEventListener('input', () => {
  state.caption = captionInput.value.toUpperCase();
  render();
});
taglineInput.addEventListener('input', () => {
  state.tagline = taglineInput.value;
  render();
});

document.addEventListener('keydown', (e) => {
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (e.key >= '1' && e.key <= '5') setLayout(LAYOUTS[Number(e.key) - 1]);
  else if (e.key === 'g' || e.key === 'G') cycleGrade();
  else if (e.key === 'r' || e.key === 'R') randomize();
  else if (e.key === 'e' || e.key === 'E') exportAll();
});

/** Cover mode: the canvas fills the viewport and the chrome hides. */
function fitCoverCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

async function start() {
  buildPanelRows();
  const scene = parseScene(window.location.search);
  if (scene.framing === 'compact') {
    for (const id of ['panels-group', 'caption-group']) {
      const group = document.getElementById(id);
      if (group) group.style.display = 'none';
    }
  }
  if (scene.mode === 'cover') {
    document.body.classList.add('cover-mode');
    fitCoverCanvas();
    window.addEventListener('resize', () => {
      fitCoverCanvas();
      render();
    });
  } else {
    canvas.width = 1080;
    canvas.height = 1080;
  }
  await applyScene(state, scene, loadSample);
  await loadSamples();
  render();
}

start();
