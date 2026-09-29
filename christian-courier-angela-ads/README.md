# Christian Courier ads: "Broken Hallelujah" (Angela Reitsma Bick, Fall 2026)

Two display ads promoting Angela Reitsma Bick's Free to be Faithful course to *Christian Courier*
readers, with a $100 scholarship ($300 CAD instead of the regular $400 CAD non-credit tuition).
Campaign runs from about October 1, 2026 until the course starts on November 3, 2026.

The $300 price is a scholarship only for Christian Courier readers. Every ad pairs it with the
"Christian Courier readers" label and the regular $400 price. The public course page keeps $400.

| File | Size | Use |
| --- | --- | --- |
| `christian-courier-angela-300x300.png` | 300 × 300 px | Christian Courier website display ad |
| `christian-courier-angela-600x200.png` | 600 × 200 px | Christian Courier email newsletter |
| `christian-courier-angela-300x300.html` | editable source | HTML/CSS, the canvas is `#ad` |
| `christian-courier-angela-600x200.html` | editable source | HTML/CSS, the canvas is `#ad` |
| `assets/angela-reitsma-bick.jpg` | 1080 × 800 | local copy of the site portrait |
| `assets/ics-logo-white.png` | 900 × 160 | local copy of the site header logo |

The sources are HTML/CSS rather than SVG. That way they use the same web fonts and CSS tokens as
the site, and they render through the repo's existing Playwright pipeline.

## Editing and re-rendering

1. Edit the `CONFIG` block at the bottom of either HTML file (promo code and prices), or the markup.
2. Render both PNGs at exact size, with `deviceScaleFactor: 1` and no resizing:

   ```sh
   cd .render && node render-cc-ads.mjs
   ```

   The script stops with an error if a web font failed to load or if the canvas is the wrong
   size. It also warns if any text sits within 4 px of the canvas edge or outside it. Rendering needs a network
   connection to reach Google Fonts.
3. Optional lossless recompression (these files were saved this way):
   `python3 -c "from PIL import Image; import sys; [Image.open(f).save(f, optimize=True) for f in sys.argv[1:]]" *.png`

## Promo code variable

```js
const CONFIG = {
  promoCode:    'christiancourier',   // ← change here
  readerPrice:  '$300 CAD',
  regularPrice: '$400',               // 600×200 file uses '$400 CAD'
  registerUrl:  'f2bf.icscanada.edu/courses',
};
```

This matches the code seeded in `_scripts/course-discount-codes.gs`. Codes are not case-sensitive there.

## Registration URL

https://f2bf.icscanada.edu/courses (redirects to `/f2bf-courses`). Both ads print it as text,
`f2bf.icscanada.edu/courses` (the `registerUrl` config value), so readers know where to go even
where the image isn't linked. The ad network or newsletter should still make the whole image a
link to this address.

## Design system (from the live f2bf.icscanada.edu/f2bf-courses page)

- **Top/course block**: the hero treatment. The title is Playfair Display 900 in cream, set roman
  throughout with no italics. Its opening quote hangs into the margin, so "Broken" and "Hallelujah"
  share a left edge.
- **Offer block**: the site's short red rule (`.f2bf-rule`, 24 × 3 px here), then the cream-lt section background, a red letterspaced uppercase eyebrow
  (like the page's `__label` classes), and a Playfair 700 value in teal (like the pricing bar).
- **Call to action**: plain text (the registration address and promo code), not a button. The ads are static images, so a button would look clickable when only the whole image is a link.
- **Portrait**: `filter: saturate(0.75)`, the same as the course cards.
- No gradients, stock imagery, icons or effects.

### Fonts (Google Fonts, same as the site)

- Playfair Display: 900 (title), 700 ("$100 scholarship", set with lining numerals). No italics are used.
- Source Sans 3: 400 (body), 700 (name, schedule, labels, address, code)

### Colours (from `/assets/css/global.css`)

| Token | Hex | Used for |
| --- | --- | --- |
| `--teal` | `#1B3A4B` | course block, offer headings, address and code |
| `--red` | `#C83C2C` | eyebrow label, short rule above it, schedule separators (300×300) |
| `--cream` | `#F0EBE3` | title |
| `--cream-lt` | `#F7F4EF` | offer block background |
| `--slate-light` | `#D6DDE2` | schedule separators (600×200) |
| `--body` | `#3D4F59` | supporting offer text |
| `--white` | `#FFFFFF` | instructor name |

Red text only appears on cream-lt (about 4.6:1 contrast). On teal, text is cream or white.

## Source images

- Portrait: https://f2bf.icscanada.edu/assets/img/Angela-Reitsma-Bick.jpg (repo: `assets/img/Angela-Reitsma-Bick.jpg`), the photo used on the course card. It is cropped with CSS only; nothing is retouched or generated.
- ICS logo (white text): https://files.constantcontact.com/0e42c4d3901/6fbe9de8-34f9-412d-b5e8-390aec72cad0.png, the site header logo. The site has no separate F2BF logo; "Free to be Faithful" appears as text.
- No Christian Courier logo is used. The text "Christian Courier readers" identifies the offer.

## Exact copy

### 300 × 300

```
[ICS logo]
“Broken Hallelujah”
Angela Reitsma Bick
Faith, Deconstruction, and Spirituality through Music
Nov. 3 to Dec. 8 · Online · Tuesdays, 6:30 PM ET
CHRISTIAN COURIER READERS
$100 scholarship
$300 CAD, regularly $400
Register at f2bf.icscanada.edu/courses
Use code christiancourier
```

### 600 × 200

```
[ICS logo]
“Broken Hallelujah”
Angela Reitsma Bick
Faith, Deconstruction, and Spirituality through Music
Nov. 3 to Dec. 8 · Online
Tuesdays, 6:30 PM ET
CHRISTIAN COURIER READERS
A $100 scholarship
Register for $300 CAD
Regularly $400 CAD
f2bf.icscanada.edu/courses
Use code christiancourier
```

## QC notes

- Both PNGs were checked at 300 × 300 and 600 × 200, at 1× and zoomed in. No text is clipped,
  the fonts loaded (no fallback fonts), quotation marks are curly, and there are no em dashes.
- **Narrow email clients**: on a phone, the 600 × 200 ad shrinks to about 320 px wide (about 53%).
  The title, Angela's name and "$100 scholarship" still read at that size. The schedule and
  promo code get very small, so the linked landing page should repeat them.
- Smallest text in the square ad: 9.5 px (the uppercase eyebrow label), with everything else at 11 px or larger.
