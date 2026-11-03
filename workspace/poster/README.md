# Poster generator (CoRL 2026)

`CoRL2026_Hiratsuka.pptx` (48 x 23 in, print at 200 % for a 96 x 46 in board) is generated from:

- `prep_assets.py` – crops / rasterises figures from `fig/`, `qrcode/`, `ロゴ/` and the media of the previous poster
- `build.js` – pptxgenjs script with the layout, all text and the native bar charts (data from Tables 2 and 3 of the paper)
- `fix_pptx.py` – keeps only the first `<a:pPr>` per paragraph (pptxgenjs emits one per run, which drops bullets) and injects the custom error bars (STD over seeds) listed in the `*.errbars.json` sidecar that `build.js` writes
- `make.sh` – runs the three steps

```bash
cd workspace/poster && npm install pptxgenjs sharp && bash make.sh
```

The deck is generated from scratch (plain light-blue background); the slide master of the previous Genigraphics template is not reused.

Font floors: body text 28 pt, text inside figures and charts 20 pt. Reference numbers [n] map to the list at the bottom of the poster.
