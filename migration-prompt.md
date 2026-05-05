# Claude Code Execution Prompt: F2BF GitHub Pages Migration

Use this prompt in Claude Code to execute the migration plan. Run it from the repo root at `C:\Users\12345\Documents\GitHub\f2bf\`.

---

## Prompt

Migrate this F2BF site from Google Sites embeds to standalone GitHub Pages. The repo contains 7 HTML files and a CSV mapping filenames to URLs. Read `migration-plan.md` for the full plan. Execute the following steps in order.

### Step 1: Create directory structure and config files

Create these directories and files:

```
assets/css/
assets/js/
_includes/
f2bf-program/
f2bf-courses/
f2bf-community/
events/
f2bf-resource/
conference-may13/
```

Create `CNAME` with content: `f2bf.icscanada.edu`

Create `.nojekyll` as an empty file.

### Step 2: Extract shared CSS into `assets/css/global.css`

Read `f2bf-landing.html` and extract the shared design system CSS into `assets/css/global.css`. Include:

- The Google Fonts `@import` for Playfair Display and Source Sans 3 (just one copy)
- A universal reset scoped to `.f2bf` and its variants (box-sizing, margin, padding)
- All CSS custom properties as a `:root` block:
  ```
  --teal: #1B3A4B; --teal-deep: #0F2631; --teal-mid: #25516A;
  --red: #C83C2C; --red-hover: #D9503F;
  --slate: #BCC7D0; --slate-light: #D6DDE2;
  --cream: #F0EBE3; --cream-lt: #F7F4EF;
  --white: #FFFFFF; --ink: #1A2A33;
  --body: #3D4F59; --muted: #7E929E;
  --faint: rgba(27,58,75,0.08);
  --display: 'Playfair Display', Georgia, serif;
  --text: 'Source Sans 3', 'Helvetica Neue', Arial, sans-serif;
  ```
- Shared button styles (`.f2bf-btn`, `.f2bf-btn--red`, `.f2bf-btn--ghost`, `.f2bf-btn--teal`, `.f2bf-btn--outline`, `.f2bf-btn--sm`)
- Horizontal rule component (`.f2bf-rule`, `.f2bf-rule--center`)
- Shared reveal animation keyframe (`f2bfReveal` or similar names used across pages)

Do NOT include page-specific section styles (hero, pillars, etc.) — those stay in each page.

### Step 3: Extract nav CSS and HTML

Read the nav section from `f2bf-landing.html` (between the comments `<!-- ===== F2BF NAVIGATION BAR ===== -->` and `<!-- ===== END F2BF NAVIGATION BAR ===== -->`).

**3a.** Extract all nav-related CSS (`.f2bf-header`, `.f2bf-nav`, `.f2bf-burger`, `.f2bf-mobile-menu` and all their sub-selectors) into `assets/css/nav.css`. Remove the Squarespace override lines at the top (`.sqs-block-code` etc.). Remove the full-bleed hack (`width: 100vw !important; margin-left: calc(50% - 50vw) !important; max-width: 100vw;`) from `.f2bf-header`.

**3b.** Extract the nav HTML (the `<header class="f2bf-header">` through the closing `</div>` of `f2bfMobileMenu`) into `_includes/nav.html`. Do NOT include `<style>` tags — the CSS is now in `nav.css`.

**3c.** Replace all absolute internal links in the nav HTML with relative paths:
- `https://f2bf.icscanada.edu/` becomes `/`
- `https://f2bf.icscanada.edu/f2bf-program` becomes `/f2bf-program`
- `https://f2bf.icscanada.edu/f2bf-courses` becomes `/f2bf-courses`
- `https://f2bf.icscanada.edu/f2bf-community` becomes `/f2bf-community`
- `https://f2bf.icscanada.edu/events` becomes `/events`
- `https://f2bf.icscanada.edu/f2bf-resource` becomes `/f2bf-resource`
- `https://f2bf.icscanada.edu/conference-may13` becomes `/conference-may13`

**3d.** Remove the `.f2bf-nav__item--active` class from the nav HTML in `_includes/nav.html`. Each page will add its own active state.

### Step 4: Extract footer CSS and HTML

Read the footer section from `f2bf-landing.html`.

**4a.** Extract all footer CSS (`.f2bf-footer` and all sub-selectors, the wave SVG styles, footer grid, social icons, bottom bar) into `assets/css/footer.css`. Remove Squarespace overrides (`#footer-sections` rules). Remove the full-bleed hack from `.f2bf-footer`.

**4b.** Extract the footer HTML into `_includes/footer.html`. Replace all absolute internal links with relative paths (same mapping as Step 3c).

### Step 5: Create `assets/js/nav.js`

Create a small JS file that handles:
- Mobile menu open: adds `is-open` class to `#f2bfMobileMenu`
- Mobile menu close: removes `is-open` class
- Close on Escape key

Then update the nav HTML in `_includes/nav.html` to remove inline `onclick` attributes and reference this script instead (add `id` attributes to burger and close buttons, use `addEventListener` in the JS file).

### Step 6: Process each page

For each of the 7 pages, create a new clean HTML file at the correct path. The source files and their targets:

| Source | Target |
|--------|--------|
| `f2bf-landing.html` | `index.html` |
| `f2bf-program.html` | `f2bf-program/index.html` |
| `f2bf-courses.html` | `f2bf-courses/index.html` |
| `f2bf-community.html` | `f2bf-community/index.html` |
| `f2bf-events.html` | `events/index.html` |
| `f2bf-resource.html` | `f2bf-resource/index.html` |
| `conference-may13.html` | `conference-may13/index.html` |

For each page:

**6a. Build the `<head>`:**
```html
<!DOCTYPE html>
<html lang="en-CA">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>[Keep existing title]</title>
  <meta name="description" content="[Write a concise SEO description based on the page content]">
  <link rel="canonical" href="https://f2bf.icscanada.edu/[path]">
  <meta property="og:title" content="[Same as title]">
  <meta property="og:description" content="[Same as meta description]">
  <meta property="og:url" content="https://f2bf.icscanada.edu/[path]">
  <meta property="og:type" content="website">
  <link rel="stylesheet" href="/assets/css/global.css">
  <link rel="stylesheet" href="/assets/css/nav.css">
  <link rel="stylesheet" href="/assets/css/footer.css">
  <style>
    /* Page-specific CSS here (hero, sections, etc.) */
  </style>
</head>
```

**6b. Clean the page-specific CSS:**
- Remove the Google Fonts `@import` (now in global.css)
- Remove the CSS custom properties block (now in global.css)
- Remove the universal reset (now in global.css)
- Remove shared button styles (now in global.css)
- Remove the full-bleed hack from the page wrapper class
- Remove all Squarespace override rules
- Keep only the page's section-specific styles

**6c. Assemble the `<body>`:**
- Insert the nav HTML from `_includes/nav.html`, adding `.f2bf-nav__item--active` to the correct nav item for this page
- Insert the page's main content sections (everything between nav and footer)
- Insert the footer HTML from `_includes/footer.html`
- Include `<script src="/assets/js/nav.js"></script>` before `</body>`
- Keep page-specific `<script>` blocks (PayPal, Google Calendar, Substack) inline at the bottom

**6d. Rewrite all internal links** in the page content (CTAs, cross-page references) from absolute to relative paths.

### Step 7: Special handling for `conference-may13.html`

This file is a full Squarespace page save. The actual F2BF content is HTML-entity encoded inside the Squarespace wrapper. To process it:

1. Find the actual conference content within the Squarespace page body. The content uses CSS class prefix `cf-` and contains sections for the conference (hero, speakers, schedule, registration modal).
2. Decode all HTML entities: `&lt;` to `<`, `&gt;` to `>`, `&amp;` to `&`, `&#39;` to `'`, `&quot;` to `"`.
3. Extract the decoded HTML, CSS, and JavaScript.
4. Reconstruct as a clean page following the same structure as the other 6 pages (proper `<head>`, shared nav/footer, page-specific CSS in `<style>`, scripts at bottom).
5. The conference page uses the `cf-` CSS prefix — keep this as-is (it's page-scoped and doesn't conflict).
6. The PayPal integration and Google Forms submission use different endpoint IDs than the courses page — preserve these exactly.

### Step 8: Create a 404 page

Create `404.html` at the repo root with:
- The shared `<head>` structure (global.css, nav.css, footer.css)
- The shared nav (no active state)
- A centered message: "Page Not Found" with a link back to the home page
- The shared footer
- Style it using the existing design tokens

### Step 9: Verify link integrity

After all pages are created, scan every HTML file in the output for:
- Any remaining `https://f2bf.icscanada.edu/` absolute links that should be relative
- Any remaining Squarespace override CSS (`.sqs-block-code`, `#footer-sections`, `.fluid-engine`)
- Any remaining full-bleed hacks (`calc(50% - 50vw)`)
- Broken relative links (paths that don't match the directory structure)

Report any issues found.

### Step 10: Clean up

Keep the original source files in place (don't delete `f2bf-landing.html`, etc.) so they can be used as reference. They can be removed later after verification.

Do NOT push to remote or modify git config. Just create all the files locally.

---

## Important Notes

- **PayPal Client ID**: `AdZ0cWK3Bl7wjgmrmgk_On-ac13XCdpZxx8te_4IPlRDVoYx3ZNoGG8vK7mb8VXdKH2L-TM1M3sMj6oI` — appears in both courses and conference pages. Preserve exactly.
- **Google Calendar API Key**: `AIzaSyC5bmvG6-SBuhHBpKaSz2cjkdd8pVntjXQ` — preserve exactly in events page.
- **Google Forms endpoints**: Two different form URLs (courses vs conference). Preserve both exactly with their entry ID mappings.
- **Image URLs**: All images are hosted externally (Lightroom CDN, Constant Contact, Squarespace CDN, Open Library). Keep all image `src` URLs exactly as they are.
- **Substack RSS proxies**: The resource page uses `rss2json` and `allorigins` as CORS proxies. Keep these exactly.
- **Adobe Lightroom iframe**: The events page embeds a Lightroom slideshow. Keep the iframe src exactly.
