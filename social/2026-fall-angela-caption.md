# "Broken Hallelujah" — Angela Reitsma Bick

Fall 2026 · Tuesdays, November 3 – December 8, 2026 · 6:30 PM ET · six weeks, fully online

| Asset | File | Size |
|---|---|---|
| 4:5 feed tile (Instagram, Facebook, LinkedIn) | `f2bf-2026-broken-hallelujah-reitsma-bick.png` | 1080 × 1350 |

Source: `2026-fall-angela.html`. Re-render with `node .render/render-angela.mjs`. The portrait
plate is cut by `social/make-plates.py` (Angela is the fourth sitter) from
`assets/img/Angela-Reitsma-Bick.jpg`, the course-card portrait.

**Planned post:** Thursday, October 22, 2026, 11:00 AM ET, via Constant Contact.
**Substack Note:** Monday, October 26, 2026, 11:00 AM ET, scheduled in Buffer (primary caption,
without the hashtags, with the tile).

**Not on this tile:** the `christiancourier` $300 reader price. That offer belongs to
*Christian Courier* readers only (see `christian-courier-angela-ads/README.md`); public posts
keep the regular price.

---

## Primary caption

What happens to faith when certainty gives way to doubt, and the Church no longer feels like
home?

Sometimes the most honest answers come from songs. Springsteen and Cohen. Noah Kahan.
Singer-songwriters wrestling with the beauty and brokenness of our world, in stadiums and on
the streets.

This November, Angela Reitsma Bick, author of *Blessed Are the Undone* and former
editor-in-chief of *Christian Courier*, spends six Tuesday evenings listening closely to them:
songs that preach, protest, lament, connect and heal. Alongside stories gathered for her book
and readings from Brian Walsh, Kristin Kobes Du Mez, John Van Sloten and others, the course
makes room for voices dismissed or silenced within Christian communities, and for your own
story too.

Provocative to cathartic. Ultimately, anthems of hope.

Tuesdays, November 3 – December 8, 6:30 PM ET. Six weeks, fully online. Take it for your own
sake, or for ICS credit.

Register at f2bf.icscanada.edu/courses

*Free to be Faithful · Institute for Christian Studies*

**#FreeToBeFaithful #InstituteForChristianStudies #BrokenHallelujah #BlessedAreTheUndone
#Deconstruction #FaithAndMusic #Springsteen #LeonardCohen #NoahKahan #Spirituality
#OnlineLearning**

## Short caption (stories, X, reposts)

Songs that preach, protest, lament, connect and heal. Angela Reitsma Bick on faith,
deconstruction and the singer-songwriters wrestling with both. "Broken Hallelujah": six
Tuesday evenings online, Nov 3 – Dec 8. f2bf.icscanada.edu/courses

## Alt text

Portrait of Angela Reitsma Bick smiling, with shoulder-length blonde hair and colourful stacked
earrings, over a deep teal panel reading "Broken Hallelujah — Faith, deconstruction, and
spirituality through music. Angela Reitsma Bick, Author of Blessed Are the Undone, Former
editor-in-chief, Christian Courier. Tuesdays, six weeks, online. Now enrolling, Nov 3 – Dec 8,
2026."

---

## Production notes

- **Her plate is an upscale.** The best source is the 1080 × 800 course-card portrait (the other
  copies in `assets/img/` are smaller re-saves of the same frame). Her plate is a 1.41×
  enlargement; the grade and grain carry it at feed size, but ask Angela for the original
  photographer's file if this portrait is used larger.
- **Her head box is not the series head box.** The frame has only ~60 source px above her
  hair, so the crown can never reach the series y=140. At the series size (480) her chin fell
  at y≈577, deep in the wash, and her lower face disappeared. She runs smaller instead (420,
  crown 85 → chin 505), flush to the source top, and is offset 100px right of centre so her
  hair clears the masthead.
- **Her wash dissolves later than the series** (solid at 81% / y≈672 instead of 78% / y≈647).
  The two-line title starts the type field at y≈677, so this costs nothing, and it keeps her
  chin, earrings and jacket collar in the light.
- **Series grade, unchanged** (`saturate(.52) contrast(1.08) brightness(.97)`). She is a pale,
  high-key sitter like Olthuis and Berglund, and the desaturation also mutes the orange
  autumn bokeh behind her.
- **The title's opening quote hangs** into the left margin so "Broken" and "Hallelujah" share
  the bill's edge, matching the Christian Courier ads for this course.
