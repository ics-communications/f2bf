# Free to be Faithful — posters

## 8.5 × 11 letter poster (evergreen)

Built for **office / desktop printers**: no bleed, artwork sits inside a 0.3 in white paper
margin. Nothing dated (no course titles, seasons or prices), so it can stay up all year.

| File | Use |
|---|---|
| `out/f2bf-poster-letter.pdf` | **Print this.** US Letter, 1 page, "Actual size" / 100 %. |
| `out/f2bf-poster-letter.png` | 300 DPI proof for screens and email. |
| `f2bf-poster-letter.html` | Source of truth — edit this, then rebuild. |

QR → `https://f2bf.icscanada.edu/?utm_source=poster&utm_medium=print&utm_campaign=f2bf-letter-poster`

```bash
node poster/render-letter.mjs   # from the repo root; uses .render/node_modules
```

Regenerates the QR, PDF and proof, then decodes the QR at 300/150/96/72 DPI and exits
non-zero on any failure. All copy is drawn from the homepage.

## Alternate version (11×17 style)

`f2bf-poster-letter-alt.html` → `out/f2bf-poster-letter-alt.pdf` / `.png`. Same office-printer spec, laid out
like the F2BF 11×17 poster (`f2bf/poster/index-v2.html`): full-panel photo fading to dark,
stacked wordmark, italic three-line manifesto and QR tile anchored at the bottom.

```bash
node poster/render-letter.mjs alt
```

Its QR carries `utm_campaign=f2bf-letter-poster-alt`, so scans can be compared against the main version.

## 11 × 17 poster

`index-v2.html` / `F2BF-poster-v2-new.pdf` — the earlier tabloid press poster (with bleed).
