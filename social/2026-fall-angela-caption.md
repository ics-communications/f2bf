# "Broken Hallelujah" — Angela Reitsma Bick

Fall 2026 · Tuesdays, November 3 – December 8, 2026 · 6:30 PM ET · six weeks, fully online

| Asset | File | Size |
|---|---|---|
| 4:5 feed tile (Instagram, Facebook, LinkedIn) | `f2bf-2026-broken-hallelujah-reitsma-bick.png` | 1080 × 1350 |
| 9:16 promo video, 2:03 (Reel, Facebook, Substack) | `f2bf-2026-broken-hallelujah-promo.mp4` | 720 × 1280 |

Source: `2026-fall-angela.html`. Re-render with `node .render/render-angela.mjs`. The portrait
plate is cut by `social/make-plates.py` (Angela is the fourth sitter) from
`assets/img/Angela-Reitsma-Bick.jpg`, the course-card portrait.

**Planned post:** Thursday, October 22, 2026, 11:00 AM ET, via Constant Contact.
**Promo video:** Monday, October 26, 2026, 11:00 AM ET, using the video caption below. Instagram
Reel and Facebook video post are scheduled in Buffer. The Substack Note is scheduled natively in
Substack (not Buffer) so Angela is a real @mention there.

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

Tuesdays, November 3 – December 8, 6:30 PM ET. Six weeks, fully online.

Register at f2bf.icscanada.edu/courses

*Free to be Faithful · Institute for Christian Studies*

**#FreeToBeFaithful #InstituteForChristianStudies #BrokenHallelujah #BlessedAreTheUndone
#Deconstruction #FaithAndMusic #Springsteen #LeonardCohen #NoahKahan #Spirituality
#OnlineLearning**

## Video caption (promo video)

Kept plain on purpose: the video carries the pitch, the caption just says who, what and when.
The Substack Note drops the hashtags.

Angela's handles: Instagram **@rogue_librarian**, Substack **@angelareitsmabick**
(angelareitsmabick.substack.com). The Note opens with a live Substack mention of her name instead of the bracketed handle.
Facebook can't tag her: she has no public Page, and personal profiles can't be tagged via API.

Angela Reitsma Bick (@rogue_librarian), author of *Blessed Are the Undone* and former
editor-in-chief of *Christian Courier*, introduces her fall course, "Broken Hallelujah": faith, deconstruction and
spirituality through music.

Tuesdays, November 3 – December 8, 6:30 PM ET. Six weeks, fully online.

Register at f2bf.icscanada.edu/courses

*Free to be Faithful · Institute for Christian Studies*

**#FreeToBeFaithful #InstituteForChristianStudies #BrokenHallelujah #Deconstruction
#FaithAndMusic**

The source is an iPhone HLG HDR clip (HEVC 10-bit). The MP4 is tone-mapped to SDR BT.709
H.264 (`zscale` + `tonemap=mobius`, npl 203) so it doesn't wash out on Instagram or Facebook.

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
