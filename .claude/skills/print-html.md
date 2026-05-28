# Print-Ready HTML

When building print-ready HTML documents (posters, booklets, flyers, cards, etc.), follow these conventions for guide lines, print controls, and PDF rendering.

## CSS Custom Properties

Define dimensions in `:root` using inch units:

```css
:root {
  --bleed:   0.125in;          /* bleed past trim on each side */
  --safe:    0.375in;          /* from artboard edge = 0.25in inside trim */
  --page-w:  <artboard-width>;  /* trim width  + 2 × bleed */
  --page-h:  <artboard-height>; /* trim height + 2 × bleed */
}
```

Standard bleed is 0.125in. Safe area is 0.375in from artboard edge (0.25in inside trim).

## @page Rule

Set `@page` size to the **artboard** (trim + bleed), zero margins:

```css
@page {
  size: var(--page-w) var(--page-h);
  margin: 0;
}
```

## Color Preservation

Always include on `html, body`:

```css
-webkit-print-color-adjust: exact;
print-color-adjust: exact;
```

## Guide Lines (Trim + Safe Area)

Use `::before` for the trim guide and `::after` for the safe-area guide on each page/artboard element.

**Critical: use the "hidden by default, shown on screen" pattern** — NOT `@media print { display: none }`. Edge headless does not reliably apply `@media print` rules, so elements must be hidden by default and only shown for screen viewing.

```css
/* Hidden by default — safe for PDF rendering */
.page::before,
.page::after {
  content: none;
}

/* Shown on screen only */
@media screen {
  .page::before,
  .page::after {
    content: '';
    position: absolute;
    pointer-events: none;
    z-index: 9999;
  }
  .page::before {
    /* Trim guide — red dashed */
    inset: var(--bleed);
    outline: 1px dashed rgba(255, 80, 80, 0.55);
  }
  .page::after {
    /* Safe-area guide — green dashed */
    inset: var(--safe);
    outline: 1px dashed rgba(80, 200, 120, 0.4);
  }
}
```

Replace `.page` with whatever class the artboard element uses (`.poster`, `.card`, etc.).

## Print Bar (Screen-Only Controls)

A fixed toolbar in the top-right with the document title, dimensions, a guide toggle checkbox, and a Print/Save as PDF button.

**Again, hidden by default, shown on screen only:**

```css
.print-bar {
  position: fixed;
  top: 12px; right: 12px;
  background: #111;
  color: #fff;
  font-family: var(--text);
  font-size: 11px;
  padding: 10px 14px;
  border-radius: 8px;
  display: none;                /* hidden by default */
  gap: 10px; align-items: center;
  z-index: 99999;
  box-shadow: 0 8px 30px rgba(0,0,0,0.4);
}
@media screen {
  .print-bar { display: flex; } /* shown on screen only */
}
.print-bar button {
  background: var(--red); color: #fff;
  border: 0; padding: 6px 12px;
  font-weight: 600;
  font-size: 11px; letter-spacing: 0.05em;
  text-transform: uppercase; cursor: pointer;
  border-radius: 5px;
}
.print-bar label {
  display: inline-flex; align-items: center; gap: 4px;
  cursor: pointer; user-select: none;
}
```

### Guide Toggle

A `.no-guides` class hides the pseudo-element guides:

```css
.no-guides .page::before,
.no-guides .page::after { display: none; }
```

### Bleed Toggle

A `.no-bleed` class shrinks each page to trim size and clips the bleed area. This lets the user preview what the final trimmed piece looks like on screen:

```css
.no-bleed .page {
  width: calc(var(--page-w) - 2 * var(--bleed));
  height: calc(var(--page-h) - 2 * var(--bleed));
  overflow: hidden;
}
/* Shift content inward so the trim edge aligns to the element edge */
.no-bleed .page > * {
  position: relative;
  margin-top: calc(-1 * var(--bleed));
  margin-left: calc(-1 * var(--bleed));
}
/* Absolutely-positioned children need inset adjustment instead */
.no-bleed .page > [style*="position: absolute"],
.no-bleed .page > .safe-area,
.no-bleed .page > .cover__photo,
.no-bleed .page > .cover__gradient,
.no-bleed .page > .cover__grain {
  margin: 0;
  top: calc(-1 * var(--bleed));
  left: calc(-1 * var(--bleed));
  right: calc(-1 * var(--bleed));
  bottom: calc(-1 * var(--bleed));
}
/* Hide trim guide in no-bleed mode (it would sit at the edge, not useful) */
.no-bleed .page::before { display: none; }
/* Safe-area guide adjusts inward */
.no-bleed .page::after {
  inset: calc(var(--safe) - var(--bleed));
}
```

### HTML

```html
<div class="print-bar">
  <strong>PROJECT &middot; Type</strong>
  <span>W&times;H in &middot; 0.125 in bleed</span>
  <label><input type="checkbox" id="toggleGuides" checked> Show guides</label>
  <label><input type="checkbox" id="toggleBleed" checked> Show bleed</label>
  <button onclick="window.print()">Print / Save as PDF</button>
</div>
```

Fill in the project name, document type, and dimensions.

### JavaScript

Toggle the `.no-guides` and `.no-bleed` classes on the wrapper element:

```js
document.getElementById('toggleGuides').addEventListener('change', function (e) {
  document.getElementById('wrapper').classList.toggle('no-guides', !e.target.checked);
});
document.getElementById('toggleBleed').addEventListener('change', function (e) {
  document.getElementById('wrapper').classList.toggle('no-bleed', !e.target.checked);
});
```

Replace `'wrapper'` with the actual wrapper element ID.

## Print Styles

Clean up shadows, padding, and background for print/PDF:

```css
@media print {
  .page-wrap { padding: 0; background: none; }
  html, body { background: #fff; }
  .page { box-shadow: none; }
}
```

## PDF Rendering via Edge Headless

Use Microsoft Edge headless to render HTML to PDF:

```
msedge.exe --headless=new --disable-gpu --no-pdf-header-footer --no-margins --run-all-compositor-stages-before-draw --virtual-time-budget=20000 "--print-to-pdf=<output.pdf>" "<file:///path/to/file.html>"
```

Find the Edge executable under `C:\Program Files (x86)\Microsoft\EdgeCore\<version>\msedge.exe`. Use the latest version directory.

### Rendering Without Bleed (Trim-Size PDF)

To produce a PDF at the final trim size (no bleed), generate a temporary HTML file that:
1. Overrides `@page` size to the **trim** dimensions (artboard minus 2 × bleed per axis)
2. Sets the page element to trim size
3. Shifts all content inward by the bleed amount so it clips at the trim edge

Inject this CSS block before `</style>` in the temp file:

```css
/* ── No-bleed render ── */
@page { size: <trim-w> <trim-h>; margin: 0; }
.page {
  width: <trim-w>;
  height: <trim-h>;
}
/* Shift absolutely-positioned layers to clip the bleed area */
.page > * {
  position: relative;
  margin-top: calc(-1 * var(--bleed));
  margin-left: calc(-1 * var(--bleed));
}
.page > [style*="position: absolute"],
.page > .safe-area,
.page > .cover__photo,
.page > .cover__gradient,
.page > .cover__grain {
  margin: 0;
  top: calc(-1 * var(--bleed));
  left: calc(-1 * var(--bleed));
  right: calc(-1 * var(--bleed));
  bottom: calc(-1 * var(--bleed));
}
```

Then render the temp file with Edge headless and delete it (or keep for inspection).

## Crop Marks (Optional — Build Script)

For a version with crop marks, the build script:
1. Expands `@page` size by adding 0.25in slug margin on each side (0.5in total per axis)
2. Wraps each page in a `.crop-wrap` container, centering the page 0.25in inward
3. Adds L-shaped crop mark elements at each trim corner:
   - Ticks are 0.125in long, 0.5pt thick, black
   - Positioned at the trim line, 0.125in past the bleed edge

Crop marks CSS:
```css
.cm { position: absolute; background: #000; }
.cm-h { width: 0.125in; height: 0.5pt; }
.cm-v { width: 0.5pt;   height: 0.125in; }
/* Position at each corner using top/bottom/left/right */
```

## Summary of Key Principle

**Never rely on `@media print` to hide screen-only elements.** Edge headless doesn't reliably apply print media rules. Instead, hide by default (`display: none` / `content: none`) and show on screen (`@media screen { ... }`).
