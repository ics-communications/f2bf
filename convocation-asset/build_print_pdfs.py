#!/usr/bin/env python3
"""Render index.html to two print-ready PDFs via headless Chrome.

  convocation-card_bleed.pdf       — 7.25 x 5.25 in, full bleed, no crop marks
  convocation-card_bleed-marks.pdf — 7.75 x 5.75 in, full bleed with traditional
                                     corner crop ticks just outside the trim.
"""
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "index.html"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

# Card geometry (matches index.html tokens)
PAGE_NOMARKS = "7.25in 5.25in"
PAGE_MARKS = "7.75in 5.75in"
MARGIN = "0.25in"          # white gutter on each side around the card
BLEED = "0.125in"          # card bleed beyond trim
TRIM_OFFSET = "0.375in"    # MARGIN + BLEED = where trim corner sits on page
TICK_LEN = "0.2in"
TICK_W = "0.25pt"


def render_bleed_only(html: str) -> str:
    """Variant A: page stays 7.25x5.25, hide the existing crop-line and guides."""
    override = """
<style id="print-override">
  .crop-line, .guide { display: none !important; }
  @media screen { html, body { background: #ffffff; } body { padding: 0; gap: 0; } }
</style>
"""
    return html.replace("</head>", override + "</head>", 1)


def render_with_marks(html: str) -> str:
    """Variant B: 7.75x5.75 page, card centered with 0.25in margin, corner ticks."""
    override = f"""
<style id="print-override">
  @page {{ size: {PAGE_MARKS}; margin: 0; }}
  .crop-line, .guide {{ display: none !important; }}
  @media screen {{ html, body {{ background: #2a2a2a; }} }}

  .page-wrap {{
    width: {PAGE_MARKS.split()[0]};
    height: {PAGE_MARKS.split()[1]};
    position: relative;
    background: #ffffff;
    page-break-after: always;
    overflow: hidden;
  }}
  .page-wrap:last-of-type {{ page-break-after: auto; }}
  .page-wrap > .card {{
    position: absolute;
    top: {MARGIN};
    left: {MARGIN};
  }}
  .page-wrap > .label {{ display: none; }}

  .mark {{ position: absolute; background: #000; z-index: 10000; }}
  .mark.h {{ height: {TICK_W}; width: {TICK_LEN}; }}
  .mark.v {{ width: {TICK_W}; height: {TICK_LEN}; }}

  .mark.tl-h {{ top: {TRIM_OFFSET}; left: 0; }}
  .mark.tl-v {{ top: 0;             left: {TRIM_OFFSET}; }}
  .mark.tr-h {{ top: {TRIM_OFFSET}; right: 0; }}
  .mark.tr-v {{ top: 0;             right: {TRIM_OFFSET}; }}
  .mark.bl-h {{ bottom: {TRIM_OFFSET}; left: 0; }}
  .mark.bl-v {{ bottom: 0;             left: {TRIM_OFFSET}; }}
  .mark.br-h {{ bottom: {TRIM_OFFSET}; right: 0; }}
  .mark.br-v {{ bottom: 0;             right: {TRIM_OFFSET}; }}

  @media screen {{
    body {{ background: #2a2a2a; padding: 2rem; display: flex; flex-direction: column; align-items: center; gap: 1.25rem; }}
    .page-wrap {{ box-shadow: 0 14px 40px rgba(0,0,0,0.45); }}
  }}
</style>
"""
    html = html.replace("</head>", override + "</head>", 1)

    marks_html = (
        '<span class="mark h tl-h"></span><span class="mark v tl-v"></span>'
        '<span class="mark h tr-h"></span><span class="mark v tr-v"></span>'
        '<span class="mark h bl-h"></span><span class="mark v bl-v"></span>'
        '<span class="mark h br-h"></span><span class="mark v br-v"></span>'
    )

    # Wrap each <section class="card ..."> ... </section> in a .page-wrap
    # that also contains the corner marks. The page-wrap is the printable page.
    pattern = re.compile(
        r'(<section class="card[^"]*"[^>]*>)(.*?)(</section>)',
        re.DOTALL,
    )

    def wrap(match: re.Match) -> str:
        return f'<div class="page-wrap">{match.group(0)}{marks_html}</div>'

    return pattern.sub(wrap, html)


def render_pdf(html_path: Path, pdf_path: Path) -> None:
    cmd = [
        CHROME,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        "--no-margins",
        "--virtual-time-budget=15000",
        f"--print-to-pdf={pdf_path}",
        html_path.as_uri(),
    ]
    print(f"  rendering -> {pdf_path.name}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0 or not pdf_path.exists():
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        raise RuntimeError(f"Chrome failed for {pdf_path}")


def main() -> int:
    src_html = SRC.read_text(encoding="utf-8")

    variants = {
        "convocation-card_bleed.html": (render_bleed_only, "convocation-card_bleed.pdf"),
        "convocation-card_bleed-marks.html": (render_with_marks, "convocation-card_bleed-marks.pdf"),
    }

    with tempfile.TemporaryDirectory(prefix="conv-print-") as td:
        td_path = Path(td)
        # Copy/assemble each variant into the temp dir alongside any relative assets.
        # index.html references absolute URLs for portraits, so no asset copy needed.
        for html_name, (transform, pdf_name) in variants.items():
            html_out = td_path / html_name
            html_out.write_text(transform(src_html), encoding="utf-8")
            render_pdf(html_out, ROOT / pdf_name)

    for name in ("convocation-card_bleed.pdf", "convocation-card_bleed-marks.pdf"):
        size = (ROOT / name).stat().st_size // 1024
        print(f"  {name}: {size} KB")


if __name__ == "__main__":
    sys.exit(main() or 0)
