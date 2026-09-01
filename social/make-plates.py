#!/usr/bin/env python3
"""
Cut the 1080x830 portrait plates for the F2BF course tiles.

WHY THIS EXISTS
    The first pass at these plates was cut by hand and the numbers drifted:
    the two heads sat 25-35px apart vertically and 98px apart horizontally,
    and both chins landed below the point where the tile's wash goes solid,
    so the jaws were erased and the lower faces read as murk. This script
    puts the crop under version control so the series can be re-cut exactly.

THE REGISTRATION RULE
    Register the HEAD BOX -- crown and chin -- not the eye line.

    Olthuis sits with his chin up in a three-quarter turn; Berglund is
    frontal and level. That pose difference foreshortens Olthuis's forehead,
    so no single crop can match both the crown/chin box and the eye line.
    Matching the box is the better trade: it makes the two heads occupy an
    identical rectangle, which is what carries the "these are a set" read in
    a feed. The residual eye-line offset (~36px, down from 68px) is the
    irreducible cost of the pose difference.

THE VERTICAL BUDGET
    HEAD_TOP is floored at ~140 because the masthead's second line
    ("INSTITUTE FOR CHRISTIAN STUDIES") occupies y=118-133 and runs to
    x=405 -- straight through where Berglund's hair would be. HEAD_BOTTOM
    is capped near 620 because the tile's type field begins at y~635 and
    the wash must be solid by then. Those two walls are 480px apart, which
    is what sets HEAD_HEIGHT.

SOURCE LIMITS (both sitters are pinned, in opposite directions)
    Berglund's winter portrait exists only at 1000x1000, and his head sits
    left in that frame, so his crop is flush to the source's left edge --
    he cannot move further right than x~445 without upscaling harder.
    Olthuis's crop already spans almost the full width of his 2268px
    source, so he cannot move further left than x~594. A symmetric pair
    is therefore unreachable; the offsets below are each sitter's best
    available position, not a chosen composition.

USAGE
    python3 social/make-plates.py            # writes social/plate-*.jpg
    python3 social/make-plates.py --check    # report only, touch nothing
"""

import sys
from PIL import Image

PLATE_W, PLATE_H = 1080, 830

# --- registration targets, in plate space -----------------------------------
HEAD_TOP    = 140            # crown; floored by the masthead's second line
# Crown-to-chin. The floor is ~479: below that, Olthuis's crop needs more
# width than his 2268px source has. The ceiling is ~480 before the chin
# starts pushing into the type field. There is exactly one usable value.
HEAD_HEIGHT = 480            # chin lands at 620
CANVAS_MID  = PLATE_W / 2

# --- sitters ----------------------------------------------------------------
# Landmarks are in SOURCE pixels. They were recovered by correlation-matching
# the shipped plates back onto their originals (Berglund: 777x597 crop at
# 1.390x from left=0,top=74.8; Olthuis: 2160x1660 crop at 0.500x from
# left=96,top=368), then mapping the measured plate landmarks through that
# transform. Re-measure only if the source files themselves change.
SITTERS = [
    {
        'name':   'berglund',
        'src':    'assets/img/_originals/BruceBerglund.png',   # 1000x1000
        'out':    'social/plate-berglund.jpg',
        'crown':  177.7,
        'chin':   546.0,
        'eye':    368.3,
        'mid_x':  343.2,
        # Frontal sitter: aim for the canvas centre. The clamp below will pull
        # him left to ~445, because the source runs out of photograph first.
        'want_x': CANVAS_MID,
    },
    {
        'name':   'olthuis',
        'src':    'assets/img/_originals/JimOlthuis.jpg',      # 2268x2268
        'out':    'social/plate-olthuis.jpg',
        'crown':  604.0,
        'chin':   1608.0,
        'eye':    1048.0,
        'mid_x':  1246.0,
        # Turned sitter: offset against the gaze so the lead room falls on the
        # side he is looking toward. Clamps to ~594.
        'want_x': CANVAS_MID + 95,
    },
]


def plan(s, src_w, src_h):
    """Return the crop box in source pixels, plus a report of any clamping."""
    head_src = s['chin'] - s['crown']
    scale = HEAD_HEIGHT / head_src
    crop_w, crop_h = PLATE_W / scale, PLATE_H / scale

    notes = []
    if crop_w > src_w or crop_h > src_h:
        raise SystemExit(
            f"{s['name']}: HEAD_HEIGHT={HEAD_HEIGHT} needs a "
            f"{crop_w:.0f}x{crop_h:.0f} crop from a {src_w}x{src_h} source. "
            f"Raise HEAD_HEIGHT to at least "
            f"{head_src * max(PLATE_W / src_w, PLATE_H / src_h):.0f}."
        )

    left = s['mid_x'] - s['want_x'] / scale
    top = s['crown'] - HEAD_TOP / scale

    clamped_left = min(max(left, 0.0), src_w - crop_w)
    clamped_top = min(max(top, 0.0), src_h - crop_h)
    if abs(clamped_left - left) > 0.5:
        got = (s['mid_x'] - clamped_left) * scale
        notes.append(f"x pinned by source edge: wanted {s['want_x']:.0f}, got {got:.0f}")
    if abs(clamped_top - top) > 0.5:
        notes.append(f"y pinned by source edge: crown off target by "
                     f"{(clamped_top - top) * scale:+.0f}px")

    return clamped_left, clamped_top, crop_w, crop_h, scale, notes


def main():
    check_only = '--check' in sys.argv
    print(f'plate {PLATE_W}x{PLATE_H} | head box: crown {HEAD_TOP} -> '
          f'chin {HEAD_TOP + HEAD_HEIGHT} ({HEAD_HEIGHT}px)\n')

    for s in SITTERS:
        img = Image.open(s['src'])
        src_w, src_h = img.size
        left, top, crop_w, crop_h, scale, notes = plan(s, src_w, src_h)

        # Where the landmarks actually land once cropped.
        at = lambda v: (v - top) * scale
        mid_x = (s['mid_x'] - left) * scale

        print(f"{s['name']:9s} {src_w}x{src_h} -> crop "
              f"{crop_w:.0f}x{crop_h:.0f} @ ({left:.0f},{top:.0f})  "
              f"scale {scale:.3f}{'  [UPSCALE]' if scale > 1 else ''}")
        print(f"          crown {at(s['crown']):.0f}  eye {at(s['eye']):.0f}  "
              f"chin {at(s['chin']):.0f}  centre x {mid_x:.0f}")
        for n in notes:
            print(f'          note: {n}')

        if not check_only:
            plate = img.convert('RGB').resize(
                (PLATE_W, PLATE_H), Image.LANCZOS,
                box=(left, top, left + crop_w, top + crop_h))
            plate.save(s['out'], quality=92, subsampling=0)
            print(f"          wrote {s['out']}")
        print()


if __name__ == '__main__':
    main()
