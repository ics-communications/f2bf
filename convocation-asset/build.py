#!/usr/bin/env python3
"""Build convocation-card.html by inlining the QR SVG and three base64 portraits.

Reads source JPEGs from assets/, resizes each to a print-appropriate size at JPEG
quality 85, base64-encodes them, and substitutes into the HTML template along
with the inline QR SVG path.
"""
import base64
import io
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).parent
ASSETS = ROOT / "assets"

# Each tuple: (placeholder_name, source_jpeg, max_dimension_px at print size)
PORTRAITS = [
    ("CAROLYN", "carolyn.jpg", 1200),
    ("ANN",     "ann.jpg",     900),
    ("DAVE",    "dave.jpg",    900),
]


def encode_portrait(filename: str, target: int) -> str:
    """Resize JPEG to fit within target px on its longest edge, return base64."""
    im = Image.open(ASSETS / filename).convert("RGB")
    w, h = im.size
    scale = target / max(w, h)
    if scale < 1.0:
        im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=85, optimize=True, progressive=True)
    return base64.b64encode(buf.getvalue()).decode()


def encode_logo_png(filename: str, target: int = 500) -> str:
    """Resize transparent PNG (preserve alpha) for inlining as base64 data URL payload."""
    im = Image.open(ASSETS / filename).convert("RGBA")
    w, h = im.size
    scale = target / max(w, h)
    if scale < 1.0:
        im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "PNG", optimize=True)
    return base64.b64encode(buf.getvalue()).decode()


def read_qr_path() -> str:
    """Pull just the <path> from the QR SVG so we can recolor and resize in CSS."""
    svg = (ASSETS / "qr-donate.svg").read_text()
    start = svg.index("<path")
    end = svg.index("</svg>")
    return svg[start:end].strip()


TEMPLATE = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Institute for Christian Studies · Convocation 2026</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Outfit:wght@300;400;500;600;700&display=swap">
<style>
/* ──────────────────────────────────────────────────────────────────
   Tokens
   ────────────────────────────────────────────────────────────────── */
:root {
  --wine: #9B0D24;
  --wine-deep: #7A0A1C;
  --accent: #A85A32;
  --accent-light: #C87A52;
  --pale: #EEDACA;
  --cream: #FDFBF7;
  --warm: #F9F5ED;
  --ink: #2E1318;
  --ink-muted: #857E78;

  /* Print dimensions */
  --bleed: 0.125in;
  --safe: 0.25in;          /* distance from trim to safe */
  --card-w: 7.25in;        /* trim + bleed */
  --card-h: 5.25in;
}

/* ──────────────────────────────────────────────────────────────────
   Page + screen wrapper
   ────────────────────────────────────────────────────────────────── */
@page { size: 7.25in 5.25in; margin: 0; }

* { box-sizing: border-box; }

html, body {
  margin: 0; padding: 0;
  background: #ffffff;
  font-family: 'Libre Baskerville', Georgia, serif;
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
}

.label { display: none; }

/* Screen-only preview surround */
@media screen {
  html, body { background: #2a2a2a; }
  body {
    padding: 2rem;
    display: flex; flex-direction: column; align-items: center; gap: 1.25rem;
  }
  .label {
    display: block;
    color: #aaa; font: 500 12px/1 'Outfit', sans-serif;
    letter-spacing: 0.18em; text-transform: uppercase;
    align-self: flex-start; padding-left: calc(50% - 3.625in);
  }
  .card { box-shadow: 0 14px 40px rgba(0,0,0,0.45); }
}

/* ──────────────────────────────────────────────────────────────────
   Card chassis
   ────────────────────────────────────────────────────────────────── */
.card {
  width: var(--card-w);
  height: var(--card-h);
  position: relative;
  overflow: hidden;
  background: var(--cream);
  page-break-after: always;
}
.card:last-of-type { page-break-after: auto; }

/* ──────────────────────────────────────────────────────────────────
   Guides (trim + safe area). Toggle by adding `show-guides` to body.
   ────────────────────────────────────────────────────────────────── */
.guide {
  position: absolute; pointer-events: none; z-index: 9999;
  border-style: dashed;
}
.guide.trim {
  top: var(--bleed); right: var(--bleed); bottom: var(--bleed); left: var(--bleed);
  border: 0.5pt dashed rgba(155,13,36,0.7);
}
.guide.safe {
  top: calc(var(--bleed) + var(--safe));
  right: calc(var(--bleed) + var(--safe));
  bottom: calc(var(--bleed) + var(--safe));
  left: calc(var(--bleed) + var(--safe));
  border: 0.5pt dashed rgba(168,90,50,0.55);
}
body:not(.show-guides) .guide { display: none; }

/* ──────────────────────────────────────────────────────────────────
   Crop lines — full-edge lines drawn at the trim boundary so the
   distance from content to the cut line is easy to read at a glance.
   ────────────────────────────────────────────────────────────────── */
.crop-line {
  position: absolute;
  background: #000;
  z-index: 9999;
  pointer-events: none;
}
.crop-line.top    { top: var(--bleed);    left: 0; right: 0;  height: 0.5pt; }
.crop-line.bottom { bottom: var(--bleed); left: 0; right: 0;  height: 0.5pt; }
.crop-line.left   { top: 0; bottom: 0; left: var(--bleed);    width: 0.5pt; }
.crop-line.right  { top: 0; bottom: 0; right: var(--bleed);   width: 0.5pt; }

/* ──────────────────────────────────────────────────────────────────
   Shared atoms
   ────────────────────────────────────────────────────────────────── */
.eyebrow {
  font: 600 8pt/1.1 'Outfit', sans-serif;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.attribution-name {
  font: 700 10.5pt/1.15 'Outfit', sans-serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.attribution-meta {
  font: 500 7.5pt/1.3 'Outfit', sans-serif;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-muted);
}
.url-tag {
  font: 600 7.5pt/1 'Outfit', sans-serif;
  letter-spacing: 0.12em;
  text-transform: lowercase;
}

/* Ornamental rule */
.rule {
  display: inline-block;
  width: 0.55in; height: 1px;
  background: currentColor; vertical-align: middle;
}

/* ══════════════════════════════════════════════════════════════════
   FRONT
   ══════════════════════════════════════════════════════════════════ */
.front .title-band {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2.0in;
  background:
    radial-gradient(ellipse at 70% 30%, rgba(168,90,50,0.18), transparent 60%),
    radial-gradient(ellipse at 20% 80%, rgba(0,0,0,0.18), transparent 55%),
    linear-gradient(180deg, var(--wine) 0%, var(--wine-deep) 100%);
  color: var(--cream);
  padding: 0.17in
           calc(var(--bleed) + var(--safe))
           0
           calc(var(--bleed) + var(--safe));
  display: flex; flex-direction: column;
}

/* paper texture overlay (subtle) */
.front .title-band::before {
  content: ''; position: absolute; top: 0; right: 0; bottom: 0; left: 0;
  background-image:
    repeating-linear-gradient(45deg, rgba(255,255,255,0.025), rgba(255,255,255,0.025) 1px, transparent 1px, transparent 3px);
  pointer-events: none;
  opacity: 0.6;
}

/* Top eyebrow row — eyebrow text on the left, ICS brand mark on the right */
.front .topline {
  position: relative; z-index: 1;
  color: var(--pale);
  height: 0.55in;
}
.front .topline .eyebrow {
  position: absolute;
  left: 0; top: 50%;
  transform: translateY(-50%);
}
.front .topline .ics-logo {
  position: absolute;
  right: 0; top: 0;
  height: 0.55in;
  width: auto;
  display: block;
}

/* Headline cluster */
.front .headline-wrap {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
  text-align: center;
  position: relative; z-index: 1;
  padding-bottom: 0.34in;
}
.front .ornament {
  color: var(--accent-light);
  font: 400 14pt/1 'Libre Baskerville', serif;
  letter-spacing: 0.65em;
  margin-bottom: 0.08in;
  opacity: 0.9;
}
.front h1 {
  margin: 0;
  font-family: 'Libre Baskerville', serif;
  font-weight: 700;
  font-size: 26pt;
  line-height: 1.08;
  letter-spacing: -0.005em;
  color: var(--cream);
  white-space: nowrap;
}
.front h1 .line2 {
  display: block;
  font-style: italic;
  font-weight: 400;
  color: var(--pale);
  font-size: 28pt;
}
/* Bottom zone — photo + quote (absolute positioning for weasyprint reliability) */
.front .lower {
  position: absolute;
  top: 2.0in; left: 0; right: 0; bottom: 0;
  background: var(--cream);
}

/* Decorative accent strip at the seam */
.front .lower::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 0.06in;
  background: var(--accent);
  opacity: 0.9;
}

.front .portrait {
  position: absolute;
  top: 0.06in; left: 0; bottom: 0;
  width: 2.9in;
  background-color: #2c1010;
  background-image: url("data:image/jpeg;base64,{{CAROLYN_B64}}");
  background-size: cover;
  background-position: center 22%;
}
/* Gradient kiss along right edge for soft tonal continuity */
.front .portrait::after {
  content: '';
  position: absolute; top: 0; right: 0; bottom: 0; left: 0;
  background: linear-gradient(to right, transparent 70%, rgba(253,251,247,0.55) 100%);
  pointer-events: none;
}

.front .quote-zone {
  position: absolute;
  top: 0.06in; left: 2.9in; right: 0; bottom: 0;
  padding: 0.28in 0.34in 0.26in 0.4in;
}
.front .quote-mark {
  position: absolute;
  top: 0.18in; left: 0.36in;   /* moved inward + down so it sits cleanly in the cream area, clear of the photo edge fade */
  font: 700 56pt/0.8 'Libre Baskerville', serif;
  color: var(--accent);
  opacity: 0.85;
}
.front .quote {
  position: absolute;
  top: 0.62in; left: 0.4in; right: 0.34in;   /* clearer space below quote-mark and to the right of photo */
  margin: 0;
  font: italic 400 12.5pt/1.36 'Libre Baskerville', serif;
  color: var(--ink);
  hyphens: auto;
}
.front .attribution {
  position: absolute;
  left: 0.4in; right: 0.34in; bottom: 0.3in;
}
.front .attribution .attribution-name {
  color: var(--wine);
  display: block;
  margin-bottom: 0.04in;
  font: 700 11pt/1.1 'Outfit', sans-serif;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.front .attribution .attribution-meta {
  display: block;
  margin-bottom: 0.06in;
  font: 500 8pt/1.36 'Outfit', sans-serif;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--ink-muted);
}
.front .attribution .url-tag {
  display: block;
  padding-top: 0.05in;
  border-top: 0.5pt solid rgba(168,90,50,0.5);
  color: var(--wine);
  font: 600 8pt/1 'Outfit', sans-serif;
  letter-spacing: 0.08em;
  text-transform: lowercase;
}

/* ══════════════════════════════════════════════════════════════════
   BACK
   ══════════════════════════════════════════════════════════════════ */
/* Two voice rows — equal height for visual balance.
   Dave's longer quote is accommodated by reducing the body type to 9.5pt
   and widening the body column (smaller photo). */
.back .voice {
  position: absolute;
  left: 0;
  width: 4.65in;
  height: 2.375in;
  padding: 0.22in 0.18in 0.22in calc(var(--bleed) + var(--safe));
}
.back .voice.ann   { top: 0;      height: 2.20in; background: var(--warm); }
.back .voice.dave  { top: 2.20in; height: 2.55in; background: var(--pale); }

/* Ann's content shifted down 5mm (≈0.197in) within her now-smaller block */
.back .voice.ann .portrait { top: 0.437in; }
.back .voice.ann .body     { top: 0.417in; }

/* Dave's content nudged down so the URL sits the same distance from the
   purple footer as Ann's URL sits from the off-white/pale boundary. */
.back .voice.dave .portrait { top: 0.34in; }
.back .voice.dave .body     { top: 0.32in; bottom: 0.12in; }

.back .voice .portrait {
  position: absolute;
  top: 0.24in; left: calc(var(--bleed) + var(--safe));
  width: 1.2in;
  height: 1.45in;
  background-size: cover;
  background-position: center 20%;
  border: 3pt solid var(--cream);
  background-color: #2c1010;
}
.back .voice.ann  .portrait { background-image: url("data:image/jpeg;base64,{{ANN_B64}}"); }
.back .voice.dave .portrait { background-image: url("data:image/jpeg;base64,{{DAVE_B64}}"); }

.back .voice .body {
  position: absolute;
  top: 0.22in; left: 1.78in; right: 0.18in; bottom: 0.22in;
  padding-left: 0.12in;
}
/* Drop-quote glyph sits inside the body — small negative top for hang effect
   but stays comfortably inside the safe area to clear the top bleed. */
.back .voice .quote-mark-sm {
  position: absolute;
  top: 0.02in; left: 0;
  font: 700 36pt/0.8 'Libre Baskerville', serif;
  color: var(--accent);
  opacity: 0.85;
}
.back .voice .quote {
  margin: 0.3in 0 0 0;  /* drop below the quote-mark glyph */
  padding-left: 0.04in;
  font: italic 400 9.5pt/1.36 'Libre Baskerville', serif;
  color: var(--ink);
  hyphens: auto;
}
.back .voice .who {
  margin-top: 0.12in;
}
.back .voice .who > div .attribution-name {
  color: var(--wine);
  display: block;
  margin-bottom: 0.05in;
  font: 700 10pt/1.1 'Outfit', sans-serif;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.back .voice .who .attribution-meta {
  display: block;
  font: 500 7.5pt/1.35 'Outfit', sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-muted);
}
.back .voice .who .url-tag {
  display: block;
  margin-top: 0.08in;
  padding-top: 0.05in;
  border-top: 0.5pt solid rgba(168,90,50,0.5);
  color: var(--wine);
  font: 600 8pt/1 'Outfit', sans-serif;
  letter-spacing: 0.06em;
  text-transform: lowercase;
}

/* CTA panel */
.back .cta {
  position: absolute;
  top: 0; right: 0; bottom: 0.5in;
  width: 2.6in;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(168,90,50,0.25), transparent 60%),
    linear-gradient(180deg, var(--wine) 0%, var(--wine-deep) 100%);
  color: var(--cream);
  padding: 0.3in calc(var(--bleed) + var(--safe)) 0.28in 0.32in;
}
.back .cta::before {
  content: '';
  position: absolute; top: 0; right: 0; bottom: 0; left: 0;
  background-image:
    repeating-linear-gradient(45deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03) 1px, transparent 1px, transparent 3px);
  pointer-events: none;
  opacity: 0.6;
}
/* Perforated ticket-stub edge — dotted column */
.back .cta::after {
  content: '';
  position: absolute; top: 0.2in; bottom: 0.2in; left: -0.025in;
  width: 0.05in;
  border-left: 0.5pt dashed rgba(253,251,247,0.55);
  pointer-events: none;
}

.back .cta .eyebrow {
  color: var(--pale); opacity: 0.9;
  position: relative; z-index: 1;
  display: block;
}
.back .cta h2 {
  margin: 0.16in 0 0 0;
  font: 700 15pt/1.1 'Libre Baskerville', serif;
  letter-spacing: -0.01em;
  position: relative; z-index: 1;
}
.back .cta h2 em { color: var(--accent-light); font-style: italic; font-weight: 400; }
.back .cta h2 .nowrap { white-space: nowrap; }

.back .qr-card {
  margin: 0.18in auto 0.06in;
  background: var(--cream);
  padding: 0.08in;
  width: 1.3in;
  border: 2pt solid rgba(255,255,255,0.4);
  position: relative; z-index: 1;
  text-align: center;
}
.back .qr-card svg {
  width: 1.12in; height: 1.12in; display: block; margin: 0 auto;
}
.back .qr-card .qr-cap {
  margin-top: 0.04in;
  font: 700 6pt/1 'Outfit', sans-serif;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--wine);
}

.back .cta .qr-url {
  text-align: center;
  font: 600 7.5pt/1 'Outfit', sans-serif;
  letter-spacing: 0.06em;
  color: var(--pale);
  margin-top: 0.04in;
  position: relative; z-index: 1;
}

.back .cta .divider {
  height: 1px; background: rgba(238,218,202,0.4);
  margin: 0.14in 0 0.12in;
  position: relative; z-index: 1;
}

.back .cta .links {
  position: relative; z-index: 1;
}
.back .cta .links .row {
  margin-bottom: 0.11in;
  position: relative;
}
.back .cta .links .row:last-child { margin-bottom: 0; }
.back .cta .links .tag {
  display: block;
  font: 700 7.5pt/1 'Outfit', sans-serif;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent-light);
  margin-bottom: 0.035in;
}
.back .cta .links .url {
  font: 600 8.5pt/1.18 'Outfit', sans-serif;
  color: var(--cream);
  overflow-wrap: anywhere;
  word-wrap: break-word;
  display: block;
}

/* Footer
   Footer is 0.5in tall. Text is positioned in the UPPER PORTION of the
   footer so its bottom edge stays a safe distance from the trim line
   (~0.18in clearance, well outside ±1/16in print tolerance). The dark
   color still bleeds to the bottom edge. */
.back .footer {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 0.5in;
  background: var(--ink);
  color: var(--cream);
}
.back .footer .mark {
  position: absolute;
  left: calc(var(--bleed) + var(--safe));
  bottom: 0.25in;
  font: 700 8.5pt/1.15 'Libre Baskerville', serif;
  letter-spacing: 0.04em;
}
.back .footer .mark em {
  font-style: italic; font-weight: 400; color: var(--accent-light);
}
.back .footer .meta {
  position: absolute;
  right: calc(var(--bleed) + var(--safe));
  bottom: 0.25in;
  font: 500 7pt/1.3 'Outfit', sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(253,251,247,0.82);
  text-align: right;
  max-width: 4.6in;
}
</style>
</head>
<body>
  <!-- Toggle the line below to `<body class="show-guides">` to see trim+safe overlays in dev -->

  <div class="label">Front · 7.25 × 5.25 in (bleed)</div>
  <section class="card front" aria-label="Convocation card front">
    <div class="title-band">
      <div class="topline">
        <span class="eyebrow">Institute&nbsp;for&nbsp;Christian&nbsp;Studies</span>
        <img class="ics-logo" src="data:image/png;base64,{{LOGO_B64}}" alt="ICS">
      </div>
      <div class="headline-wrap">
        <h1>
          Where Faith Meets
          <span class="line2">Rigorous Scholarship</span>
        </h1>
      </div>
    </div>

    <div class="lower">
      <div class="portrait" role="img" aria-label="Portrait of Carolyn Bentum"></div>
      <div class="quote-zone">
        <div class="quote-mark" aria-hidden="true">&ldquo;</div>
        <p class="quote">
          In an intimate group, you can become more vulnerable; you can talk about your experiences that are happening right now and connect it to your learning, and know that people are there to support you and pray for you.
        </p>
        <div class="attribution">
          <span class="attribution-name">Carolyn Bentum</span>
          <span class="attribution-meta">Educational Leadership<br>MA–EL · Class of '27</span>
          <span class="url-tag">education.icscanada.edu</span>
        </div>
      </div>
    </div>

    <span class="guide trim"></span>
    <span class="guide safe"></span>

    <span class="crop-line top"></span>
    <span class="crop-line bottom"></span>
    <span class="crop-line left"></span>
    <span class="crop-line right"></span>
  </section>

  <div class="label">Back · 7.25 × 5.25 in (bleed)</div>
  <section class="card back" aria-label="Convocation card back">
    <div class="voice ann">
        <div class="portrait" role="img" aria-label="Portrait of Ann Post"></div>
        <div class="body">
          <div class="quote-mark-sm" aria-hidden="true">&ldquo;</div>
          <p class="quote">ICS offers a unique educational perspective which is irreplaceable… I am proud and happy to be a part of its story.</p>
          <div class="who">
            <div>
              <div class="attribution-name">Ann Post</div>
              <div class="attribution-meta">Lifelong Learning · MWS '25</div>
            </div>
            <span class="url-tag">f2bf.icscanada.edu</span>
          </div>
        </div>
      </div>

      <div class="voice dave">
        <div class="portrait" role="img" aria-label="Portrait of Dave Lee"></div>
        <div class="body">
          <div class="quote-mark-sm" aria-hidden="true">&ldquo;</div>
          <p class="quote">I thought my M.A. at ICS was just going to be an academic pursuit on the side, but I felt like it made everything more holistic. At ICS, there is no separation between academia and ministry—they go hand in hand.</p>
          <div class="who">
            <div>
              <div class="attribution-name">Dave Lee</div>
              <div class="attribution-meta">Philosophy · MA &amp; PhD '25</div>
            </div>
            <span class="url-tag">icscanada.edu/philosophy</span>
          </div>
        </div>
      </div>

    <aside class="cta" aria-label="Partner with ICS">
      <div class="eyebrow">Will you partner with us?</div>
      <h2>Form leaders.<br><span class="nowrap"><em>Foster</em> spacious</span><br>faith</h2>

      <div class="qr-card">
        <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg" aria-label="QR code linking to icscanada.edu/donate">
          {{QR_PATH}}
        </svg>
        <div class="qr-cap">scan to give</div>
      </div>
      <div class="qr-url">icscanada.edu/donate</div>

      <div class="divider"></div>

      <div class="links">
        <div class="row"><span class="tag">Apply</span><span class="url">icscanada.edu/admissions</span></div>
        <div class="row"><span class="tag">Connect</span><span class="url">info@icscanada.edu</span></div>
      </div>
    </aside>

    <div class="footer">
      <div class="mark">Institute for <em>Christian</em> Studies</div>
      <div class="meta">59 St. George St. · Toronto ON M5S 2E6 &nbsp;·&nbsp; Charity BN 107508434RR0001</div>
    </div>

    <span class="guide trim"></span>
    <span class="guide safe"></span>

    <span class="crop-line top"></span>
    <span class="crop-line bottom"></span>
    <span class="crop-line left"></span>
    <span class="crop-line right"></span>
  </section>
</body>
</html>
"""


def main():
    qr_path_markup = read_qr_path()
    # Strip the scale(10) transform — our SVG is now declared with viewBox 0 0 45 45
    # so the path coordinates (already scaled by 10) need re-scaling back.
    # Easier: rebuild path coords by removing transform="scale(10)" and re-emitting
    # at the natural 1-module-per-unit scale.
    # segno's path uses coords already in module space (the transform scales them up).
    # So we replace transform="scale(10)" with "" and viewBox stays 0 0 45 45.
    qr_path_markup = qr_path_markup.replace('transform="scale(10)" ', "")
    qr_path_markup = qr_path_markup.replace('stroke="#9b0d24"', 'stroke="#9B0D24" fill="none"')

    html = TEMPLATE.replace("{{QR_PATH}}", qr_path_markup)
    html = html.replace("{{LOGO_B64}}", encode_logo_png("ics-logo.png"))
    for name, src, target in PORTRAITS:
        html = html.replace(f"{{{{{name}_B64}}}}", encode_portrait(src, target))

    out = ROOT / "convocation-card.html"
    out.write_text(html)
    print(f"wrote {out} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
