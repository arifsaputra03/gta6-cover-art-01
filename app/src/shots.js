// Vice Cover — scene driver. Reads the page's query string and applies a
// screenshot scene to the editor state: layout, grade, labels, samples,
// caption and tagline. Used by the screenshot flow and by hand for testing.
//
//   ?mode=cover|editor
//   &layout=poster|triptych|grid|single|strip
//   &grade=sunset|neon|dusk|vice|noir
//   &labels=PIER,BOULEVARD,OCEAN,PALM ROW   (one per panel, comma separated)
//   &samples=pier,boulevard,pier,boulevard  (sample photo per panel, or "none")
//   &caption=SUNSET HEIST&tagline=EVERY SCORE HAS A SUNSET.
//   &framing=compact   (compact framing for the editor shot: hides the
//                       panels and caption groups so the layout, grade
//                       and export controls all fit in one frame)

import { GRADE_KEYS, LAYOUTS } from './cover.js';

export const SCENE_MODES = ['editor', 'cover'];

/** Split a comma list, trimming each entry and dropping empties. */
function splitList(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** The scene the current URL asks for, with every field validated. */
export function parseScene(search) {
  const params = new URLSearchParams(search);
  const mode = params.get('mode');
  const layout = params.get('layout');
  const grade = params.get('grade');
  const scene = {
    mode: SCENE_MODES.includes(mode) ? mode : 'editor',
    layout: LAYOUTS.includes(layout) ? layout : null,
    grade: GRADE_KEYS.includes(grade) ? grade : null,
    labels: splitList(params.get('labels')),
    samples: splitList(params.get('samples')),
    framing: params.get('framing') === 'compact' ? 'compact' : 'full',
    caption: params.get('caption'),
    tagline: params.get('tagline'),
  };
  return scene;
}

/**
 * Apply a parsed scene to `state` and load the sample photos it names.
 * Returns a promise that resolves once every named sample has loaded
 * (or failed and fallen back to the procedural skyline).
 */
export function applyScene(state, scene, loadSample) {
  if (scene.layout) state.layout = scene.layout;
  if (scene.grade) state.grade = scene.grade;
  if (scene.caption !== null && scene.caption !== undefined) state.caption = scene.caption;
  if (scene.tagline !== null && scene.tagline !== undefined) state.tagline = scene.tagline;
  scene.labels.forEach((label, i) => {
    if (state.panels[i]) state.panels[i].label = label.toUpperCase();
  });
  const jobs = scene.samples.map((name, i) => {
    const panel = state.panels[i];
    if (!panel) return Promise.resolve();
    if (name === 'none') {
      panel.sample = null;
      panel.image = null;
      return Promise.resolve();
    }
    panel.sample = name;
    return loadSample(name).then((img) => {
      panel.image = img || null;
    });
  });
  return Promise.all(jobs);
}
