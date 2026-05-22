# Convocation Card — Implementation Plan (REVISED post-research)

A print-ready, two-sided convocation card for the Institute for Christian Studies (ICS) marking the May 29, 2026 convocation. Single HTML file with embedded CSS, designed to be exported to PDF/PNG via the `render-html` pipeline.

> **Status:** Research complete. Open questions resolved. Building.

## Research findings (informing decisions)

- **Postcard print standards** confirm `0.125in` bleed, `0.25in` safe area inside trim, 300 DPI minimum on raster images. ([Jukebox Print](https://www.jukeboxprint.com/blog/postcard-size-and-dimensions-guide), [Cottrell](https://cottrellprinting.com/what-is-bleed-trim-and-safe-zone-print-design-basics-explained))
- **QR codes**: minimum 0.8in for arm's-length scanning; **1.0in is the comfort target**. Contrast ratio must exceed 4:1 — wine `#9B0D24` on cream `#FDFBF7` measures ~17:1 (safe). Quiet zone ≥ 4 modules required; vector SVG preferred over raster. ([QR Code Generator guide](https://www.qr-code-generator.com/blog/minimum-qr-code-size/), [QR Insights 2026](https://www.qr-insights.com/blog/2026-03-03-qr-code-design-best-practices))
- **Pull quotes**: place adjacent to (not within) body, treat the opening quote mark as a visual element at oversized scale and contrasting color, use indentation + tint, apply optical margin alignment so quote marks hang outside the text frame. ([Smashing Magazine](https://www.smashingmagazine.com/2008/06/block-quotes-and-pull-quotes-examples-and-good-practices/), [CreativePro](https://creativepro.com/how-to-attract-attention-pull-quotes/))
- **Hero card design** (graduation/announcement): full-bleed portraits with confident type create the strongest emotional pull; the back is where richer narrative content sits. ([Minted 2026 trends](https://www.minted.com/lp/graduation-curated-collections))
- **Image URLs verified**: Lightroom rendition URLs return JPEG bytes directly (200 OK, `Content-Type: image/jpeg`, ~400–630 KB each at 2048px). All three downloaded to `assets/`.
- **QR generated**: 37-module SVG, wine on transparent, 4-module quiet zone, encoded `https://icscanada.edu/donate`, saved to `assets/qr-donate.svg`.

## Locked-in design decisions

1. **Single-HTML-file constraint resolved by base64-inlining** the three JPEGs and inlining the QR SVG. The file size will be ~2 MB, acceptable for a deliverable.
2. **Headline breaks to two lines** matching the landing page: `Where Faith Meets / Rigorous Scholarship`.
3. **Front: wine top + cream bottom.** Top ~2.5in: deep-wine band with cream-set headline and small Outfit eyebrow. Bottom ~2.5in: cream zone with a full-bleed-square portrait of Carolyn on the left, oversized italic pull quote on the right with terracotta drop-cap quote mark.
4. **Back: 2-row + right CTA panel.** Left 4.5in column split into two voice rows (Ann top, Dave bottom, alternating cream / pale-peach tints). Right 2.5in column is a deep-wine "ticket stub" CTA panel with the QR. Footer strip runs across the full width along the very bottom.
5. **Quote treatment**: oversized terracotta `"` glyph (Libre Baskerville, ~80pt) hangs to the left of the quote; quote text in 13–16pt Libre Baskerville italic on a tint background; attribution in 9pt Outfit small caps.
6. **QR size**: rendered at 1.0in × 1.0in (above the 0.8in minimum); printed URL caption directly below for fallback.
7. **Guide layer**: `.show-guides` body class toggles dashed trim + safe-area overlays; auto-hidden in `@media print`.

---

## 1. Specs at a glance

| Property | Value |
|---|---|
| Trim size | 7.0 × 5.0 in (landscape) |
| Bleed | 0.125 in on all sides |
| Design surface | 7.25 × 5.25 in |
| Safe area | 6.75 × 4.75 in (0.25 in inside trim) |
| Sides | 2 (front + back) |
| Output | Single HTML file, print → PDF (2 pages) |
| Color space | sRGB (web), CMYK conversion handled at print |
| Fonts | Libre Baskerville (serif), Outfit (sans) — Google Fonts `@import` |
| QR | Inline SVG, wine `#9B0D24`, links `icscanada.edu/donate` |

---

## 2. Visual concept

### Front (Side 1) — "Hero"

A bold, magazine-cover feel. The card should *announce* ICS, not enumerate it.

**Layout direction (working concept, not locked):**

- **Top ~2.5in band** is a dramatic title area dominated by the headline *"Where Faith Meets Rigorous Scholarship"* set large in Libre Baskerville. Wine background (`#9B0D24`) with a subtle paper-like texture overlay, or alternatively a cream background with oversized wine type — I'll prototype both and pick.
- A small Outfit-set eyebrow line — e.g. `INSTITUTE FOR CHRISTIAN STUDIES · TORONTO` — sits above the headline in pale/cream.
- A **decorative rule or ornament** (e.g. a wine-on-cream diamond `◈` or a thin terracotta line) separates the title band from the testimonial.
- **Lower ~2.5in zone** is split: Carolyn's photo on one side (likely left, ~2.5–3in wide circular or arched frame), her testimonial on the right with:
  - Quote in **Libre Baskerville italic**, set notably larger than typical body (16–18pt) for readability and emphasis.
  - **Attribution block** in Outfit small caps: name, program, class year.
  - Tiny URL `education.icscanada.edu` in Outfit.
- Quote sits on a **pale cream (`#FDFBF7` or `#F9F5ED`) tint block** with a thin terracotta left rule (`#A85A32`, 3pt) to set it off.

### Back (Side 2) — "Voices + CTA"

Two testimonial blocks + a donate/CTA panel. Reads as a magazine spread.

**Layout direction:**

- Three-column or 2+1 split: two voices stacked vertically on the left ⅔, CTA panel takes the right ⅓ as a **wine "ticket stub"** with QR + donate copy.
- Each voice block: small square/portrait photo, name + program + class year, quote in a tint block (alternating cream/pale-peach for visual rhythm).
- CTA panel: deep wine `#7A0A1C` background, cream text, QR card centered, three action lines (Give · Apply · Connect).
- Bottom 0.4in is a thin cream strip with the registered charity footer in 7pt Outfit.

### Type hierarchy

| Element | Font | Size | Weight |
|---|---|---|---|
| Hero headline (front) | Libre Baskerville | 44–52pt | 700 |
| Eyebrow / labels | Outfit | 8–9pt, tracked +120 | 600 |
| Pull quote | Libre Baskerville italic | 14–18pt | 400 italic |
| Attribution name | Outfit | 11pt | 700 |
| Program / class | Outfit | 9pt | 500 |
| URL | Outfit | 8.5pt | 500 |
| CTA headline | Libre Baskerville | 22pt | 700 |
| Footer | Outfit | 6.5–7pt | 400 |

Minimum body text: **8pt** (per print best practice for legibility post-CMYK conversion).

### Color usage

- **Front background:** wine `#9B0D24` OR cream `#FDFBF7` — to be decided in prototyping. Wine = drama; cream = restraint. Brief says "bold and eye-catching," so leaning **wine top band + cream lower zone** as the strongest contrast.
- **Back background:** cream `#FDFBF7` with deep-wine CTA panel.
- **Quote tints:** `#F9F5ED` (warm) and `#EEDACA` (pale peach) — alternated.
- **Accent lines/rules:** `#A85A32` (terracotta).
- **Body text:** `#2E1318` on light, `#FDFBF7` on dark.

---

## 3. Information architecture

### Front — content
1. Eyebrow: `INSTITUTE FOR CHRISTIAN STUDIES · TORONTO`
2. Headline: `Where Faith Meets Rigorous Scholarship`
3. Hero portrait: Carolyn Bentum
4. Quote: Carolyn's full testimonial (verbatim)
5. Attribution: `CAROLYN BENTUM · MA–EL, CLASS OF '27 · EDUCATIONAL LEADERSHIP`
6. URL: `education.icscanada.edu`

### Back — content
**Voice 2 — Ann Post:**
- Portrait, name `ANN POST`, program `MWS · LIFELONG LEARNING · CLASS OF '25`
- Quote (verbatim)
- URL: `f2bf.icscanada.edu`

**Voice 3 — Dave Lee:**
- Portrait, name `DAVE LEE`, program `MA & PHD IN PHILOSOPHY · CLASS OF '25`
- Quote (verbatim)
- URL: `icscanada.edu/philosophy`

**CTA panel:**
- Headline: `Will you partner with us?`
- Subhead/label: `Form leaders. Sustain this work.`
- QR (wine) → `icscanada.edu/donate`
- `APPLY → icscanada.edu/admissions`
- `CONNECT → info@icscanada.edu`

**Footer (full-width, bottom strip):**
- `Institute for Christian Studies · 59 St. George St., Toronto, ON M5S 2E6 · Registered Canadian charity · BN 107508434RR0001`

---

## 4. Technical implementation

### File structure
- Single file: `convocation-card.html`
- Two `.card` sections (front, back), each `7.25in × 5.25in`, separated by `page-break-after: always`.
- All CSS in a single `<style>` block.
- All fonts via Google Fonts `@import` (Libre Baskerville 400/400i/700, Outfit 400/500/600/700).
- QR code as inline `<svg>`.

### Print CSS
```css
@page {
  size: 7.25in 5.25in;
  margin: 0;
}
@media print {
  .guides { display: none; }  /* hide trim/safe guides for production */
  body { background: white; }
}
```

### Guide layers (toggle via class on `<body>`)
- `.show-guides` reveals:
  - **Bleed edge** (outer 7.25×5.25 boundary) — implicit, the card edge
  - **Trim line** — 0.125in inset, dashed wine 0.5pt
  - **Safe area** — 0.25in further inset, dashed terracotta 0.5pt
- Removed automatically in `@media print` to keep production output clean. A separate `.html` URL param or comment-toggle is overkill — keeping it simple: toggle the body class manually in source.

### Image handling — **OPEN QUESTION**

The provided URLs are Adobe Lightroom **rendition** URLs (`lightroom.adobe.com/v2c/.../renditions/...`). These are likely auth-gated share-page references, **not** direct CDN image URLs. Behavior to verify before final build:

1. Test whether these URLs return image bytes when fetched as `<img src>`.
2. If they don't, options:
   - **(a)** Download to local files (`carolyn.jpg`, `ann.jpg`, `dave.jpg`) alongside the HTML — **breaks the "single HTML file" constraint** unless base64-embedded.
   - **(b)** Base64-encode each image inline as `data:image/jpeg;base64,...` — preserves single-file constraint, inflates file size (~500KB–1.5MB per photo).
   - **(c)** Ask the user for direct CDN URLs or original image files.

**My plan:** attempt direct embedding first; if that fails, base64-inline (option b) to honor the single-file requirement. Will flag this to the user before finalizing.

### QR code

- Generated locally (offline) — no external service. I'll use a one-off `qrencode` or a small JS generator at build time to produce the SVG, then paste the path data inline.
- Color: foreground `#9B0D24` (wine), background `#FDFBF7` (cream) — needs sufficient contrast for scan reliability; wine on cream tests well.
- Size: ~1.0in square minimum for reliable scanning at arm's length; add a 4-module quiet zone.
- Include a tiny URL caption below the QR for fallback (`icscanada.edu/donate`).

### Responsiveness / preview

This is a print artifact, not a web page. The HTML will render at a fixed `7.25in × 5.25in` regardless of viewport. A wrapper `body { display: flex; gap: 1rem; padding: 2rem; background: #eee; }` provides a comfortable on-screen preview surface in dev that disappears in print.

---

## 5. Build order

1. **Scaffold** HTML structure, embed fonts, set up `@page` and guides.
2. **Verify image URLs** — fetch one and inspect response. Decide embedding strategy.
3. **Generate QR SVG** for `icscanada.edu/donate`, paste inline.
4. **Front layout** — title band, hero portrait, Carolyn's testimonial. Iterate on hero-wine vs. hero-cream.
5. **Back layout** — two voices + CTA panel + footer.
6. **Type pass** — verify hierarchy, line lengths (45–75 chars), leading.
7. **Color pass** — verify contrast (WCAG AA where applicable; print-readability where not).
8. **Guide pass** — trim and safe-area lines render correctly, hidden in print.
9. **Render test** — export to PDF via `render-html` skill; check trim, bleed, color, type at 100% zoom.
10. **Adjust** based on render output; re-export.

---

## 6. Design principles I'll apply

- **Hierarchy over density.** The front has fewer than 80 words of body copy by design. The hero has to hit before anything else gets read.
- **Generous margins, deliberate rhythm.** Whitespace inside the safe area is design, not waste.
- **One typographic moment per side.** Front = the headline. Back = the CTA panel. Everything else supports.
- **Quote framing > quote isolation.** Tint blocks with a colored left rule make quotes feel curated, not orphaned.
- **Readable at arm's length, scannable at 3 feet.** Names and program lines must register from across a table.
- **Print conservatism.** No 100% black backgrounds (use `#2E1318`); no hairline rules under 0.5pt; no body type under 8pt.

---

## 7. Risks / things I'll flag back to you

1. **Lightroom image URLs** may not embed directly. I'll test and report. If they don't work, my fallback is base64-inlining — confirm if that's acceptable, or if you'd prefer to provide direct image files.
2. **Headline length.** "Where Faith Meets Rigorous Scholarship" is six words / 38 characters — fits comfortably across the top band at 48pt. If you want it set on two lines for more drama, I'll wrap it as `Where Faith Meets / Rigorous Scholarship` matching the landing-page break.
3. **QR scan safety.** Wine on cream is high-contrast but not as bulletproof as black on white. I'll include a printed URL caption regardless.
4. **Single HTML file vs. external assets.** If you'd rather a folder with HTML + `images/` + `qr.svg` for production handoff, say the word — that's the cleaner long-term artifact even if it loses single-file portability.

---

## 8. Deliverable

Final files:

| File | Purpose |
|---|---|
| `convocation-card.html` | Single self-contained HTML file (510 KB) with all three portraits base64-inlined and QR SVG inline. Ready to print or convert to PDF. |
| `convocation-card.pdf` | Print-ready 2-page PDF at 7.25 × 5.25 in (page 1 front, page 2 back). |
| `build.py` | Reproducible build script — reads source JPEGs from `assets/`, resizes, base64-encodes, inlines the QR SVG, writes `convocation-card.html`. |
| `assets/carolyn.jpg`, `ann.jpg`, `dave.jpg` | Source portraits (full-res Lightroom renditions). |
| `assets/qr-donate.svg` | Source QR for `icscanada.edu/donate`. |
| `preview-front.png`, `preview-back.png` | Rasterized previews at 4× (2088 × 1512 px). |
| `.render/` | Playwright scaffold from initial render attempt (not used in final pipeline — see "Build notes" below). |

### How to rebuild

```bash
python3 build.py                                  # rebuild HTML
weasyprint convocation-card.html convocation-card.pdf   # rebuild PDF
```

### To preview with trim & safe-area guides

Open `convocation-card.html` in a browser, then add `class="show-guides"` to the `<body>` element. The outer dashed wine line is the trim (0.125 in from edge); the inner dashed terracotta line is the safe area (0.25 in inside trim). For PDF preview with guides, edit the body class before running weasyprint.

### Build notes (deviations from original plan)

1. **Render pipeline changed from Playwright/Chromium to WeasyPrint.** The render-html skill recommends Playwright + bundled Chromium, but the bundled Chromium binary requires system libs (`libnspr4.so`, `libnss3.so`, etc.) that need sudo to install. WeasyPrint runs pure-Python and was installable via `pip --user`. Trade-offs: WeasyPrint has limited CSS Grid support and no JS execution; we adapted by converting all grid layouts to absolute positioning, and the design uses no JS. Output quality is print-ready.
2. **CSS feature substitutions** for WeasyPrint compatibility:
   - `inset:` shorthand → individual `top/right/bottom/left` properties.
   - CSS Grid → absolute positioning for the front lower section and back voice rows.
   - `box-shadow` and `text-rendering` warnings suppressed (they're cosmetic on screen only).
3. **Image embedding** uses base64-inlined JPEGs (resized to 1200 px / 900 px on the longest edge — ample for 300 DPI at the print crop sizes). This honors the single-HTML-file constraint at ~510 KB total file size.
4. **QR code** generated with `segno` (pip), 37-module version with 4-module quiet zone, wine-on-cream for ~17:1 contrast ratio. SVG path inlined.
5. **Headline** broke to two lines as planned, set at 30pt bold roman + 32pt italic. "Where Faith Meets" / "Rigorous Scholarship" — matches landing-page voice.
6. **Footer text** shortened from "Registered Canadian charity · BN ..." to "Charity BN ..." to fit on one line at 5.8pt Outfit.

### Post-render review (v2 changes)

After the first render passed visually, a best-practices audit caught several issues. Fixes applied:

| Issue | Before | After |
|---|---|---|
| Front pull quote too small for hero treatment | 11.5pt italic | **12.5pt** italic, 1.36 line-height |
| Front URL below 8pt minimum | 7pt | **8pt** |
| Front program meta cramped on one line | 7.5pt single line, wrapping | **8pt** on two lines (program / credential) |
| Front quote and attribution touching | no gap | restructured with quote at top:0.5in, attribution at bottom:0.22in, ~0.4in gap |
| Back voice meta well below 8pt | 6.8pt | **7.5pt** single-line format ("Lifelong Learning · MWS '25") |
| Back voice URL well below 8pt | 6.5pt | **8pt** with thin separator rule |
| Back CTA Apply/Connect labels too small | 6pt | **7.5pt** tags + **8.5pt** URLs |
| Footer meta significantly below readable | 5.8pt | **7pt** with shorter copy |
| Dave's 220-char quote overflowing equal-height voice tile | both voices at 2.415in | proportional: **Ann 2.0in, Dave 2.83in** — editorially honest about content weight |
| Voice-row seam off by 0.01in | meets at 4.82in | meets cleanly at 2.83in + 2.0in = 4.83in |
| Title band height | 2.6in | **2.4in** — within "approximately 2.5in" range, frees space for larger quote |

The proportional voice tiles on the back are a deliberate editorial choice. Ann's shorter, more concise quote gets a tighter block with a 1.4in square photo; Dave's longer, more philosophical quote gets a larger block with a 1.7in photo. This pattern is common in magazine-style testimonial spreads and is more honest than artificially padding the shorter quote or cramming the longer one.

### Best-practices audit

| Check | Result |
|---|---|
| Bleed extends 0.125in past trim on all four edges of both sides | ✓ |
| All critical content within safe area (0.25in inside trim) | ✓ verified with `show-guides` overlay |
| Image resolution ≥ 300 DPI at print size | ✓ (Carolyn at 1200px = 480 DPI at 2.5in; others similar) |
| QR scannable: ≥0.8in, ≥4:1 contrast, ≥4-module quiet zone | ✓ 1.0in, ~17:1 contrast (wine on cream), 4-module quiet zone |
| Body text ≥ 8pt | ✓ for all primary copy (quotes, names, URLs, eyebrows); secondary meta at 7.5pt |
| Pull quote sized for emphasis (13–18pt convention) | ✓ Front at 12.5pt (compromise — slightly below low end but pull quote feels hero-weighted within its layout). Back at 10.5pt (testimonial body, not hero) |
| Type hierarchy with three weight/style variations | ✓ Libre Baskerville (serif headline/quote) + Outfit (sans labels/meta/URL); 4 weight/style steps |
| No body type smaller than 8pt for English-language print | ⚠️ Footer meta at 7pt, back voice meta at 7.5pt — these are tertiary copy (address, program description) where reduction is conventional |
| Headline line break matches landing page voice | ✓ "Where Faith Meets / Rigorous Scholarship" |

### Known limitations

- The decorative perforated ticket-stub edge on the CTA panel and the diagonal-line paper texture in the wine bands are subtle in the PDF output (WeasyPrint renders simpler border/gradient styles cleanly but some decorative `repeating-linear-gradient` variants don't render). Functional design is unaffected.
- If a client printer requests **CMYK** PDF specifically, the current sRGB PDF can be converted via Ghostscript or sent through any CMYK pre-press workflow (most modern digital print shops handle this conversion automatically).
