# F2BF — Fall 2026 Course Card (7 × 5 in)

Print adaptation of the Fall 2026 social tile (`social/2026-27-tiles.html` → `#tile-fall-2026`).
Two-sided landscape card. Source of truth is **`f2bf-fall-2026-card.html`**; everything in
`out/` is generated — never hand-edit it.

- **Front** — the four Fall 2026 courses, with a QR to the courses page.
- **Back** — the churches page: what ICS has made for congregations, and a QR to connect
  their church. Copy is drawn from `churches/index.html`; keep the two in step.

## Rebuild

```bash
node .render/render-card.mjs      # from the repo root — regenerates everything in out/
node .render/preflight.mjs        # safe-area + overlap check (exits non-zero on a problem)
node .render/verify-qr.mjs        # decodes the QR back out; MUST pass before printing
```

Needs network access on first run (Google Fonts: Playfair Display, Source Sans 3).

**Run all three after any edit.** `preflight` catches content drifting outside the safe area
or blocks colliding — including band *content*, which must stay inside safe even though the
band itself bleeds — and it fails loudly if a selector matches nothing, so a check can never
silently pass by measuring an element that no longer exists. `verify-qr` protects you from
printing a dead QR code.

## Files in `out/`

| File | Size | Use |
|---|---|---|
| **`f2bf-fall-2026-card-PRESS.pdf`** | 7.25 × 5.25 in, 2 pp | **Send this to the printer.** p1 front, p2 back. Bleed included, no marks. |
| `f2bf-fall-2026-card-front.pdf` | 7.25 × 5.25 in, 1 p | If the printer wants each side as its own file. |
| `f2bf-fall-2026-card-back.pdf` | 7.25 × 5.25 in, 1 p | " |
| `f2bf-fall-2026-card-CROPMARKS.pdf` | 7.75 × 5.75 in, 2 pp | Only if the shop explicitly asks for crop marks (offset/local shops sometimes do). |
| `proof-front.png` / `proof-back.png` | 2175 × 1575 px @ 300 DPI | On-screen proofs. Magenta dashes = trim, cyan dashes = safe area. **Proof only — never send these.** |

Most online printers (Vistaprint, Moo, Printful, Printing For Less) want the **PRESS** file:
bleed included, no marks. Sending a marks file to those is a common cause of rejected uploads.

## Specification

| | |
|---|---|
| Trim | 7.000 × 5.000 in (landscape) |
| Bleed | 0.125 in all sides → **7.250 × 5.250 in** total |
| Safe area | 0.250 in inside trim → 6.500 × 4.500 in |
| Sides | 2 (4/4 — full colour both sides) |
| Resolution | Vector type + 300 DPI raster proofs |
| Fonts | Embedded in the PDF (Playfair Display, Source Sans 3) |
| Colour | **RGB** — see note below |

Suggested stock: 16pt C2S or 130lb silk cover, matte or soft-touch. The dark teal front
covers most of the sheet, so matte hides handling marks far better than gloss.

## Colour — read before ordering

The PDFs are **RGB**, because the render pipeline (headless Chromium) cannot emit CMYK.
Every printer listed above accepts RGB and converts on their end, so this is normally fine.

If your printer requires CMYK, either:

- send the PRESS PDF and ask them to convert to their profile (usually **US Web Coated
  SWOP v2** for North American commercial work), or
- convert locally — `gs -sDEVICE=pdfwrite -dProcessColorModel=/DeviceCMYK …` (Ghostscript is
  not installed in this repo's environment), or open the PDF in Acrobat/InDesign and export
  to PDF/X-1a.

Two things to flag to the printer either way:

1. **The dark teal ground (`#0F2631`) is a large solid.** Ask for a rich black / four-colour
   build rather than 100% K, or it will look washed out and blotchy.
2. **Total ink coverage** should be capped at ~300% for coated stock during conversion.
3. **The front is a heavy dark flood** — measured at **79% of pixels below 0.15 luminance**
   (the back is 18%). Flag this to the printer: it is the coverage level that invites
   set-off/drying attention on uncoated stock, and any mottle in the large flat will show.
   This is a luminance proxy from an RGB proof, **not** a CMYK TAC number — TAC can only be
   confirmed after conversion.

## The two QR codes

| | Front | Back |
|---|---|---|
| Target | `https://f2bf.icscanada.edu/courses` | `https://f2bf.icscanada.edu/churches/` |
| Call to action | "Scan to register" | "Connect your church" |
| Modules | 33 + 4-module quiet zone = 41 | 37 + 4-module quiet zone = 45 |
| Printed size | 0.90 in → 0.56 mm/module | 0.98 in → 0.55 mm/module |
| Colour | cream on dark teal | teal on cream |

Both use error-correction level **H** (tolerates 30% damage), are inline vector SVG, and
carry their quiet zone inside the `viewBox` so it cannot be cropped by a layout change.
Module sizes are above the ~0.4 mm printing floor.

**They are verified, not assumed.** `verify-qr.mjs` renders the card and decodes both codes
with **jsQR** — a different library from the one that generated them — at 300, 150, 96, and
72 DPI (8 decodes total). The 72 DPI pass is far below what a phone camera gets off a
printed inch-wide code, so passing there is a wide margin. Re-run it after any URL change.

## Design decisions worth preserving

Arrived at by measurement; reverting them reintroduces a real defect.

- **`--red-on-dark: #E97C6E`.** The brand red `#C83C2C` measures only **2.6:1** against the
  dark ground (the radial lift behind the title makes the real ground lighter than the token,
  so it is worse than the raw numbers suggest). It fails as text. `--red-on-dark` holds
  **4.77:1** on the measured worst ground. Use `--red` for rules, bands, and anything on
  cream; use `--red-on-dark` for red *text* on the teal side.
- **`.course__meta` at 7.3pt.** The weekday/date line was both the smallest type on the card
  and its worst contrast, while carrying the information readers actually decide on. Do not
  put it back under 7pt.
- **The portrait grade** (`filter: saturate(0.45)…` plus the flat `.course__face::after`
  teal overlay) is what makes four unrelated photographs read as one series. It uses a flat
  overlay rather than the source tile's `mix-blend-mode: color`, which is unreliable through
  a print PDF pipeline.
- **`.band` bottom padding of 0.30in with a 0.24in logo.** Band content optically centres
  low; without these the strapline and ICS mark sit inside the 0.25in safe margin.
- **Type floor: nothing is below 7pt.** The card is read at arm's length, often in poor
  light, by an audience that skews older.

## Editing

Course data lives directly in the markup of `f2bf-fall-2026-card.html` — front roster rows
are `.course` blocks and the front QR is `.qr`; back copy is in `.bk__head`, `.shelf`
(the recorded conversations), and `.connect` (the call to action and its QR). All measurements are in
physical units (`in` / `pt`) so the PDF comes out true-size; **don't switch anything to `px`.**

After editing, re-render and check `proof-front.png` / `proof-back.png`: nothing important
should cross the cyan safe line, and the background must reach the outer edge everywhere.
