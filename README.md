[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/arifsaputra03/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/arifsaputra03/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Vice Cover

An offline web app that makes GTA 6-style cover art. Pick a layout, drop in
photos (or use the two built-in samples), grade it, label the panels, and
export the cover in every post size. No network requests, no libraries —
plain HTML, CSS and canvas JavaScript.

Entry for the [make.fun bounty](https://make.fun/bounty/gta6-cover-art-01).

## Features

- **5 layouts** — Poster, Triptych, Grid 2×2, Single, and Strip (a 4-frame filmstrip).
- **5 grades** — Sunset, Neon, Dusk, Vice, and Noir (grayscale sun and windows).
- **Per-panel photos** — upload your own, or use the built-in sample photos.
  Click a panel to select it, drag to pan, scroll or slide to zoom, reset per panel.
- **Procedural skyline** — empty panels draw an original sunset skyline
  (gradient sky, glowing sun, buildings with lit windows) in the current grade.
- **Per-panel label chips** — short text at each panel's top corner.
- **Caption** — huge condensed lettering with a sunset-gradient fill, plus a tagline.
- **Shuffle** — randomizes layout, grade, photo crops and labels.
- **Export** — one click writes all four post sizes as PNG or JPEG (quality 0.92):
  1:1 (1080×1080), 4:5 (1080×1350), 9:16 (1080×1920), 16:9 (1920×1080).

## Keyboard shortcuts

| Key | Action |
| --- | ------ |
| `1`–`5` | Switch layout (Poster, Triptych, Grid, Single, Strip) |
| `G` | Cycle grade |
| `R` | Shuffle |
| `E` | Export all four sizes |

## Run it

```sh
node serve.ts            # serves app/ at http://127.0.0.1:8080/
```

## Screenshots

`screenshots/` holds four renders of the app, listed in `shots.json`:
`1-cover.jpg` (Poster cover), `2-editor.jpg` (the editor with the Strip
layout), `3-cover.jpg` (Strip in the Vice grade), `4-cover.jpg` (Grid in the
Noir grade). Each scene is a URL the app's scene driver (`src/shots.js`)
reads: `?mode=`, `&layout=`, `&grade=`, `&labels=`, `&samples=`,
`&caption=` and `&tagline=` pick what the page shows; `&framing=compact`
hides the panels and caption groups so the editor shot frames the
layout, grade and export controls in one frame.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with the kit's `buildDossier`.

## License

MIT — see [LICENSE](LICENSE). All artwork is original; the two sample photos
are the author's own.
