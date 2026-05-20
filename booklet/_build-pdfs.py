"""
Build two print-ready PDFs for the F2BF booklet via headless Edge.

  F2BF-booklet.pdf           5.75 x 8.75 in artboard, bleed only.
  F2BF-booklet-cropmarks.pdf 6.25 x 9.25 in artboard, crop marks at trim corners.

Trim:        5.5  x 8.5  in
Bleed:       0.125 in past trim  -> 5.75 x 8.75 in
Slug margin: 0.25  in past bleed -> 6.25 x 9.25 in (crops version only)

Crop marks: black L-shaped ticks, 0.125 in long, 0.5 pt thick,
positioned 0.125 in past the bleed line (0.25 in past trim).
"""

import re
import subprocess
import sys
import time
from pathlib import Path

EDGE = r"C:\Program Files (x86)\Microsoft\EdgeCore\147.0.3912.98\msedge.exe"
ROOT = Path(__file__).resolve().parent
SRC = ROOT / "index.html"
TMP = ROOT / "_print-crops.html"
PDF_NO_CROPS = ROOT / "F2BF-booklet.pdf"
PDF_CROPS = ROOT / "F2BF-booklet-cropmarks.pdf"


def edge_print(html_path: Path, pdf_path: Path) -> None:
    """Render an HTML file to PDF using Edge headless."""
    url = "file:///" + str(html_path).replace("\\", "/")
    if pdf_path.exists():
        pdf_path.unlink()
    cmd = [
        EDGE,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        "--no-margins",
        "--run-all-compositor-stages-before-draw",
        "--virtual-time-budget=20000",
        f"--print-to-pdf={pdf_path}",
        url,
    ]
    print(f"  -> {pdf_path.name}")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if not pdf_path.exists():
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        raise RuntimeError(f"Edge did not produce {pdf_path}")
    size_kb = pdf_path.stat().st_size / 1024
    print(f"     wrote {size_kb:,.0f} KB")


# ─────────────────────────────────────────────────────────────────────
# 1. No-crops PDF — render index.html directly
# ─────────────────────────────────────────────────────────────────────
print("Building PDFs...")
print()
print("1/2  No crops (5.75 x 8.75 in, bleed only)")
edge_print(SRC, PDF_NO_CROPS)
print()

# ─────────────────────────────────────────────────────────────────────
# 2. Crops PDF — build a temp HTML that wraps each .page in a crop-wrap
#    div and adds crop-mark elements, then resize @page to 6.25 x 9.25 in.
# ─────────────────────────────────────────────────────────────────────
print("2/2  With crop marks (6.25 x 9.25 in artboard)")

src = SRC.read_text(encoding="utf-8")

crops_css = """
/* ════════════════════════════════════════════════════════════════
   CROP MARKS BUILD — added by _build-pdfs.py for the crops PDF only.
   ════════════════════════════════════════════════════════════════ */
@page { size: 6.25in 9.25in; margin: 0; }
.book { gap: 0.4in; }
.crop-wrap {
  position: relative;
  width: 6.25in;
  height: 9.25in;
  background: #fff;
  page-break-after: always;
  break-after: page;
  box-shadow: 0 12px 50px rgba(0,0,0,0.35);
}
.crop-wrap:last-child {
  page-break-after: auto;
  break-after: auto;
}
.crop-wrap .page {
  position: absolute;
  top: 0.25in;
  left: 0.25in;
  width: 5.75in;
  height: 8.75in;
  box-shadow: none;
  page-break-after: auto;
  break-after: auto;
}
@media print {
  .crop-wrap { box-shadow: none; }
  .book { gap: 0; padding: 0; background: none; }
  html, body { background: #fff; }
}
/* ─── Crop marks ───────────────────────────────────────────────────
   crop-wrap artboard: 6.25 x 9.25 in.
   bleed edge: 0.25 in inside.   trim line: 0.375 in inside.
   tick: 0.125 in long, 0.5 pt thick, gap 0.125 in from trim corner. */
.cm {
  position: absolute;
  background: #000;
}
.cm-h { width: 0.125in; height: 0.5pt; }
.cm-v { width: 0.5pt;   height: 0.125in; }
/* Top-left corner */
.cm-tl-h { top: 0.375in; left: 0.125in; }
.cm-tl-v { left: 0.375in; top: 0.125in; }
/* Top-right corner */
.cm-tr-h { top: 0.375in; right: 0.125in; }
.cm-tr-v { right: 0.375in; top: 0.125in; }
/* Bottom-left corner */
.cm-bl-h { bottom: 0.375in; left: 0.125in; }
.cm-bl-v { left: 0.375in; bottom: 0.125in; }
/* Bottom-right corner */
.cm-br-h { bottom: 0.375in; right: 0.125in; }
.cm-br-v { right: 0.375in; bottom: 0.125in; }
"""

# Insert the crops CSS just before </style>.
if "</style>" not in src:
    raise RuntimeError("Could not find </style> in source HTML")
src = src.replace("</style>", crops_css + "\n</style>", 1)

# Crop-marks HTML block to insert inside every .crop-wrap.
crop_marks_html = (
    '<div class="cm cm-h cm-tl-h"></div>'
    '<div class="cm cm-v cm-tl-v"></div>'
    '<div class="cm cm-h cm-tr-h"></div>'
    '<div class="cm cm-v cm-tr-v"></div>'
    '<div class="cm cm-h cm-bl-h"></div>'
    '<div class="cm cm-v cm-bl-v"></div>'
    '<div class="cm cm-h cm-br-h"></div>'
    '<div class="cm cm-v cm-br-v"></div>'
)

# Wrap each <section class="page ..."> ... </section> in a <div class="crop-wrap">.
# Pages are top-level direct children of .book and don't nest <section> inside, so a
# non-greedy match against the closing </section> is safe here.
page_re = re.compile(
    r'(<section class="page [^"]*"[^>]*>.*?</section>)',
    re.DOTALL,
)


def wrap(match: re.Match) -> str:
    return f'<div class="crop-wrap">{crop_marks_html}{match.group(1)}</div>'


new_src, count = page_re.subn(wrap, src)
print(f"     wrapped {count} pages with crop marks")

if count != 8:
    print(f"     WARNING: expected 8 pages, wrapped {count}")

TMP.write_text(new_src, encoding="utf-8")
edge_print(TMP, PDF_CROPS)

# Keep the temp HTML around for inspection. Comment out next line to clean up.
# TMP.unlink()

print()
print("Done.")
print(f"  - {PDF_NO_CROPS}")
print(f"  - {PDF_CROPS}")
