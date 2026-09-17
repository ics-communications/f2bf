# Decolonizing The Great Commission — Fr. Joash P. Thomas

Winter 2027 · Tuesdays, January 12 – February 16, 2027 · 6:30 PM ET · six weeks, fully online

| Asset | File | Size |
|---|---|---|
| 4:5 feed tile (Instagram, Facebook) | `f2bf-2027-decolonizing-the-great-commission-thomas.png` | 1080 × 1350 |
| 16:9 (LinkedIn, X, email header, slide) | `f2bf-2027-decolonizing-the-great-commission-thomas-16x9.png` | 3840 × 2160 |

Sources: `2027-winter-joash.html`, `2027-winter-joash-16x9.html`.
Re-render both with `node .render/render-joash.mjs`. The 4:5 portrait plate is cut by
`social/make-plates.py` (Joash is the third sitter) from
`assets/img/_originals/JoashThomas.jpg`; the 16:9 uses that original directly.

**Note on timing.** Registration for Winter 2027 courses opens closer to the start date, so
both pieces say *Winter 2027* and point at the courses index rather than claiming "now
enrolling." Swap the band to `Now enrolling · Jan 12 – Feb 16, 2027` when registration opens
and re-render — that is a one-line change in each file.

---

## Primary caption

What if the way we were taught to read the Great Commission has more to do with empire than
with Jesus?

"Go and make disciples of all nations" has carried a great deal of freight it was never given.
For five centuries it travelled with ships, and the church has not always been able to tell the
difference between the commission and the conquest.

This winter, Fr. Joash P. Thomas takes six Tuesday evenings to pull those apart. Drawing on his
*Decolonizing the Great Commission* series on Masala Chai Theology, and on his own St. Thomas
Indian Christian roots, he reconsiders mission, evangelism, and discipleship through a
decolonized, Jesus-shaped lens — and goes looking for older and wider models of witness, from
Celtic Christianity to the Thomas Christians of Kerala.

Not a takedown of mission. A recovery of it.

Six weeks. Fully online. Take it for your own sake, or for ICS credit.

*Free to be Faithful · Institute for Christian Studies*

**#FreeToBeFaithful #InstituteForChristianStudies #Decolonizing #GreatCommission #Missiology
#GlobalChristianity #StThomasChristians #CelticChristianity #PublicTheology #Discipleship
#OnlineLearning**

## Short caption (stories, X, reposts)

"Go and make disciples of all nations." Five centuries of ships came with that verse. What did
it mean before them — and what could it mean now?

Fr. Joash P. Thomas, *Decolonizing The Great Commission* — six Tuesday evenings online,
January 12 – February 16, 2027.

## First comment / alt text

*Alt text (4:5):* Portrait of Fr. Joash P. Thomas smiling broadly, in a dark vest with a
pectoral cross, over a deep teal panel reading "Decolonizing The Great Commission — Rethinking
mission through a decolonized, Jesus-shaped lens. Fr. Joash P. Thomas, Author of The Justice of
Jesus, St. Stephen's University. Tuesdays, Jan 12 – Feb 16, 2027."

*Alt text (16:9):* The same course billing set to the left of a full-height portrait of Fr.
Joash P. Thomas, with a red band across the foot reading "Course information and registration
at f2bf.icscanada.edu/courses."

---

## Production notes

- **His head box is not the series head box.** The series registers crown-to-chin and puts every
  crown at plate y=140, which works because the two original sitters carry nothing above the
  hairline or below the jaw. Joash has ~40 plate px of top-knot above his hairline and ~48
  below his jaw in beard, so crown-to-chin registration puts neither end where it looks like it
  is — it left the bun crowding the top edge and ran the beard past the point where the wash
  goes solid, cutting the bottom off the face.

  He is registered on **bun-to-beard instead, centred in the band the tile actually shows him
  in**: y=0 down to y≈647, where the wash reaches solid `#0F2631`. At the only scale the source
  width permits (0.432 — a full-width crop of the 2500px original) that mass is 544px tall and
  lands with 51px of air above the bun and 51px below the beard. `make-plates.py` now takes
  per-sitter `head_top` / `head_height` overrides for this; his are 90 and 458, which is that
  solution expressed in the script's crown/chin terms. Re-derive them if any landmark moves.
- **His grade is not the series grade.** The other course plates run
  `saturate(.52) contrast(1.08) brightness(.97)`, numbers set on two pale, high-key sitters.
  Joash is dark hair, dark beard, dark vest, and the tile's wash has already taken 40% of his
  lower face by the time it reaches his mouth — at the series numbers the beard and the ground
  became one mass. Both files run `contrast(1.04) brightness(1.16)` instead. Saturation is
  untouched, so he still greys into the set.
- **His photograph has a hard seam in it** — teal wall on the left, lit white wall on the
  right — and at full bleed that white corner reads before his face does. Both files add a
  right-edge gradient (`.plate__edge`) on top of the series wash to close the gap. Any future
  tile cut from this photograph will need the same.
- **The 16:9 is not the fall pair's construction.** That piece is a two-up spread, one column
  per course; halved for a single course it leaves 960px of nothing. This one splits
  vertically instead: portrait bleeding full height in the right third, type centred in the
  left. It is the layout to reuse for any other single-course landscape.
- **The title runs three lines at 84px on the 4:5**, not the series 96. A third line costs
  ~90px of type field, and the field must not climb above the point where the wash goes solid
  (y≈647). The 16:9 has the width to keep 96 on two lines.
- **Any future sitter whose visible head is not crown-to-chin** — a hat, a hood, a top-knot, a
  long beard — should be centred on the visible mass the same way rather than hand-cut. The
  script reports its clamps, so it will tell you when the source has run out of picture.
