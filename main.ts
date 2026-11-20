// Vice Cover — entrypoint (Node 22, standard library only).
// Copies app/ and screenshots/ to the output directory and writes
// /output/dossier.json with buildDossier from vendor/makefun-app.ts.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const REPO = dirname(fileURLToPath(import.meta.url));
const OUT = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const SHOT_MAX = 4;
const SHOT_MAX_BYTES = 262144;
const SHOT_EXTS = new Set(['.png', '.jpg', '.jpeg']);

/** Screenshots, validated up front: at most 4, each a PNG or JPEG of at most 256 KiB. */
function checkShots(dir) {
  if (!existsSync(dir)) throw new Error(`screenshots/: no such directory: ${dir}`);
  const names = readdirSync(dir).filter((n) => !n.startsWith('.')).sort();
  if (names.length < 3) throw new Error(`screenshots/: holds ${names.length} images, needs 3 or 4`);
  if (names.length > SHOT_MAX) throw new Error(`screenshots/: holds ${names.length} images, over the ${SHOT_MAX} allowed`);
  let bytes = 0;
  for (const name of names) {
    const ext = extname(name).toLowerCase();
    if (!SHOT_EXTS.has(ext)) throw new Error(`screenshots/${name}: not a PNG or JPEG`);
    const size = statSync(join(dir, name)).size;
    if (size > SHOT_MAX_BYTES) throw new Error(`screenshots/${name}: ${size} bytes, over the ${SHOT_MAX_BYTES} allowed`);
    bytes += size;
  }
  return { names, bytes };
}

/** Every file under a directory, recursively, as paths relative to it. */
function walkFiles(dir, base = '') {
  const out = [];
  for (const name of readdirSync(dir)) {
    const rel = base === '' ? name : `${base}/${name}`;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walkFiles(full, rel));
    else out.push(rel);
  }
  return out;
}

function main() {
  const shots = checkShots(join(REPO, 'screenshots'));
  const appFiles = walkFiles(join(REPO, 'app'));

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  cpSync(join(REPO, 'app'), join(OUT, 'app'), { recursive: true });
  cpSync(join(REPO, 'screenshots'), join(OUT, 'screenshots'), { recursive: true });

  const dossier = buildDossier(OUT, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
  writeFileSync(join(OUT, 'dossier.json'), dossier);

  console.log(`Vice Cover handed in to ${OUT} (app ${appFiles.length} files; ${shots.names.length} screenshots, ${shots.bytes} bytes; dossier ${dossier.length} bytes)`);
}

main();
