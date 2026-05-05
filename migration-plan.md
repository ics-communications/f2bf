# F2BF Migration Plan: Google Sites to GitHub Pages

## Current State

Seven self-contained HTML files are embedded as full-page code blocks on Google Sites at `f2bf.icscanada.edu`. Each file contains all CSS inlined in `<style>` tags, duplicated navigation and footer markup, Squarespace CSS override hacks, and full-bleed viewport workarounds needed for container-constrained embeds.

### File Inventory

| File | Current URL | CSS Prefix | Lines | Notes |
|------|-------------|------------|-------|-------|
| `f2bf-landing.html` | `/` | `.f2bf` | ~1280 | Home page, hero + pillars + CTA |
| `f2bf-program.html` | `/f2bf-program` | `.f2bf-prog` | ~1360 | Program overview, course cards, pricing bar |
| `f2bf-courses.html` | `/f2bf-courses` | `.f2bf-c` | ~1500 | Course listings, PayPal registration modal, Google Forms |
| `f2bf-events.html` | `/events` | `.f2bf-ev` | ~1646 | Google Calendar API, Lightroom iframe |
| `f2bf-community.html` | `/f2bf-community` | `.f2bf-comm` | ~1328 | Team profiles, event cards |
| `f2bf-resource.html` | `/f2bf-resource` | `.f2bf` / `.f2bf-comm-writing` | ~1634 | Substack RSS feed, CORS proxy fallback |
| `conference-may13.html` | `/conference-may13` | `.cf-` | ~2478 | Full Squarespace page save (HTML-entity encoded), PayPal + Google Forms |

### Key External Dependencies

- **Google Fonts**: Playfair Display, Source Sans 3 (via `@import`)
- **PayPal SDK**: Client ID `AdZ0cWK3Bl7wjgmrmgk_On-ac13XCdpZxx8te_4IPlRDVoYx3ZNoGG8vK7mb8VXdKH2L-TM1M3sMj6oI` (courses + conference)
- **Google Calendar API**: Calendar ID `c_69d54f953052b91b0291db43e425f6a6d3fc4d132761d91188ea8aa25dec5880@group.calendar.google.com`, API key `AIzaSyC5bmvG6-SBuhHBpKaSz2cjkdd8pVntjXQ`
- **Google Forms**: Two form endpoints (courses registration + conference registration)
- **Substack RSS**: Via `rss2json` and `allorigins` CORS proxies with static fallback
- **Adobe Lightroom CDN**: Hero images, team photos, slideshow iframe
- **Squarespace CDN**: Some team/content images
- **Constant Contact**: Logo image

---

## Target Architecture (GitHub Pages)

### Directory Structure

```
f2bf/
  index.html                  (landing page, mapped from /)
  f2bf-program/
    index.html                (mapped from /f2bf-program)
  f2bf-courses/
    index.html                (mapped from /f2bf-courses)
  f2bf-community/
    index.html                (mapped from /f2bf-community)
  events/
    index.html                (mapped from /events)
  f2bf-resource/
    index.html                (mapped from /f2bf-resource)
  conference-may13/
    index.html                (mapped from /conference-may13)
  assets/
    css/
      global.css              (shared design tokens, reset, typography)
      nav.css                 (navigation bar styles)
      footer.css              (footer styles)
    js/
      nav.js                  (mobile menu toggle)
  _includes/                  (for reference; content is injected at build or manually)
    nav.html
    footer.html
  CNAME                       (custom domain: f2bf.icscanada.edu)
  .nojekyll                   (bypass Jekyll processing)
  404.html                    (custom 404 page)
```

Each page becomes a `directory/index.html` to preserve clean URLs (e.g., `/f2bf-program` serves `f2bf-program/index.html`). The landing page stays at root `index.html`.

### URL Mapping

| Current URL | GitHub Pages Path | Status |
|-------------|-------------------|--------|
| `https://f2bf.icscanada.edu/` | `/index.html` | Clean URL preserved |
| `https://f2bf.icscanada.edu/f2bf-program` | `/f2bf-program/index.html` | Clean URL preserved |
| `https://f2bf.icscanada.edu/f2bf-courses` | `/f2bf-courses/index.html` | Clean URL preserved |
| `https://f2bf.icscanada.edu/f2bf-community` | `/f2bf-community/index.html` | Clean URL preserved |
| `https://f2bf.icscanada.edu/events` | `/events/index.html` | Clean URL preserved |
| `https://f2bf.icscanada.edu/f2bf-resource` | `/f2bf-resource/index.html` | Clean URL preserved |
| `https://f2bf.icscanada.edu/conference-may13` | `/conference-may13/index.html` | Clean URL preserved |

---

## Migration Steps

### Phase 1: Extract Shared Components

**1.1 Create `assets/css/global.css`**

Extract the shared design system that is duplicated across all pages:

- CSS custom properties (`--teal`, `--red`, `--cream`, `--display`, `--text`, etc.)
- Base reset (`box-sizing: border-box`, `margin: 0`, `padding: 0`)
- Google Fonts `@import` (consolidate into one)
- Button component styles (`.f2bf-btn`, `.f2bf-btn--red`, `.f2bf-btn--ghost`, etc.)
- Horizontal rule component (`.f2bf-rule`)
- Reveal animation keyframes

**1.2 Create `assets/css/nav.css`**

Extract the navigation bar CSS from any page (identical across all). Includes:

- `.f2bf-header` and inner layout
- Desktop nav links, dropdowns, caret
- Mobile burger button, overlay menu
- Responsive breakpoints at 1060px

**1.3 Create `assets/css/footer.css`**

Extract the footer CSS from any page (identical across all). Includes:

- `.f2bf-footer` and all sub-components
- Decorative SVG wave
- Footer grid layout, link columns
- Bottom bar with social icons

**1.4 Create `assets/js/nav.js`**

Extract the inline `onclick` handlers into a small JS file:

- Mobile menu open/close toggle
- Keyboard accessibility (Escape to close)

**1.5 Prepare `nav.html` and `footer.html` reference files**

Create canonical copies of the navigation and footer HTML. These are manually copied into each page (GitHub Pages has no server-side includes without Jekyll). Place in `_includes/` for reference.

### Phase 2: Remove Squarespace/Embed Cruft

From every page, remove:

- Squarespace override CSS blocks:
  ```css
  .sqs-block-code { padding: 0 !important; }
  .sqs-block-code .sqs-block-content { margin: 0 !important; }
  ```
- Footer Squarespace overrides:
  ```css
  #footer-sections .page-section .content-wrapper { ... }
  #footer-sections .sqs-block-code { ... }
  #footer-sections .fluid-engine { ... }
  ```
- Full-bleed viewport hacks (now unnecessary since the page owns the full viewport):
  ```css
  width: 100vw !important;
  margin-left: calc(50% - 50vw) !important;
  max-width: 100vw;
  ```

**Special case: `conference-may13.html`**

This file is a full Squarespace page save, not just the embed code block. The actual F2BF content is HTML-entity encoded inside the Squarespace page body. This file needs:

1. Extract the actual content from between the Squarespace wrapper
2. Decode HTML entities (`&lt;` to `<`, `&gt;` to `>`, `&amp;` to `&`, `&#39;` to `'`, `&quot;` to `"`)
3. Reconstruct as a clean standalone HTML page
4. Normalize the `cf-` CSS prefix to be consistent (or keep it; it's page-scoped)

### Phase 3: Restructure Each Page

For each of the 7 pages:

1. **Add proper `<head>`** with:
   - `<meta charset="UTF-8">`
   - `<meta name="viewport" content="width=device-width, initial-scale=1">`
   - `<title>` (already present in most)
   - `<meta name="description" content="...">` (add SEO descriptions)
   - `<link rel="canonical" href="https://f2bf.icscanada.edu/...">` 
   - `<link rel="stylesheet" href="/assets/css/global.css">`
   - `<link rel="stylesheet" href="/assets/css/nav.css">`
   - `<link rel="stylesheet" href="/assets/css/footer.css">`
   - Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`)
   - Favicon link

2. **Replace inline nav/footer** with the canonical HTML from `_includes/`

3. **Keep page-specific CSS** in a `<style>` tag in the page's `<head>` (or extract to `assets/css/<page>.css`)

4. **Keep page-specific JavaScript** inline at the bottom (PayPal, Google Calendar, Substack RSS)

5. **Update active nav state**: Set `.f2bf-nav__item--active` on the correct nav item per page

### Phase 4: Rewrite Internal Links

All internal links currently use absolute URLs like `https://f2bf.icscanada.edu/f2bf-program`. Convert these to relative paths:

| Current | New |
|---------|-----|
| `https://f2bf.icscanada.edu/` | `/` |
| `https://f2bf.icscanada.edu/f2bf-program` | `/f2bf-program` |
| `https://f2bf.icscanada.edu/f2bf-courses` | `/f2bf-courses` |
| `https://f2bf.icscanada.edu/f2bf-community` | `/f2bf-community` |
| `https://f2bf.icscanada.edu/events` | `/events` |
| `https://f2bf.icscanada.edu/f2bf-resource` | `/f2bf-resource` |
| `https://f2bf.icscanada.edu/conference-may13` | `/conference-may13` |

This applies to:
- Navigation links (nav + mobile menu, duplicated 7 times)
- Footer links
- In-page CTAs and cross-page links

### Phase 5: GitHub Pages Configuration

1. **Create `CNAME` file** containing `f2bf.icscanada.edu`
2. **Create `.nojekyll` file** (empty) to prevent Jekyll processing
3. **Create `404.html`** with a branded 404 page using the shared nav/footer
4. **Enable GitHub Pages** in repo Settings > Pages, source: Deploy from branch (`main`, root `/`)
5. **DNS Configuration**: Update DNS for `f2bf.icscanada.edu` to point to GitHub Pages:
   - If apex domain: A records to GitHub's IPs (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`)
   - If subdomain: CNAME record pointing to `<username>.github.io`
6. **Enable HTTPS** in GitHub Pages settings after DNS propagates

### Phase 6: Handle External Integrations

**PayPal SDK** (courses + conference pages):
- No changes needed. The PayPal client ID and SDK script tag work on any domain.
- Verify PayPal app settings allow the new domain if using domain restrictions.

**Google Calendar API** (events page):
- The API key `AIzaSyC5bmvG6-SBuhHBpKaSz2cjkdd8pVntjXQ` may have HTTP referrer restrictions.
- Update allowed referrers in Google Cloud Console to include the GitHub Pages domain (or the custom domain).

**Google Forms** (courses + conference):
- No changes needed. Google Forms `no-cors` submission works from any origin.

**Substack RSS / CORS proxies** (resource page):
- `rss2json` and `allorigins` proxies work from any domain. No changes needed.
- The static fallback cards remain as backup.

**Adobe Lightroom embeds** (events photo gallery iframe):
- No changes needed. The iframe src is a direct Lightroom URL.

**Images hosted externally** (Lightroom CDN, Squarespace CDN, Constant Contact, Open Library):
- No changes needed initially. All use absolute external URLs.
- Future improvement: download critical images to `assets/img/` for reliability.

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| DNS propagation delay | Temporary downtime during cutover | Set low TTL on current DNS records 24-48 hours before migration |
| Google Calendar API key domain restriction | Events page calendar breaks | Update API key allowed referrers before cutover |
| PayPal domain restrictions | Registration breaks | Verify PayPal app domain settings |
| External image CDN changes | Broken images | Download critical images to local assets (future phase) |
| SEO ranking impact | Temporary ranking drop | Add canonical URLs, submit sitemap, verify redirects |
| Conference page HTML entity decoding | Content corruption | Carefully test decoded output against live site |

---

## Post-Migration Checklist

- [ ] All 7 pages render correctly on GitHub Pages
- [ ] Custom domain `f2bf.icscanada.edu` resolves to GitHub Pages
- [ ] HTTPS is enabled and working
- [ ] All internal navigation links work
- [ ] Mobile responsive layout works on all pages
- [ ] PayPal registration flow works (courses + conference)
- [ ] Google Calendar events load on events page
- [ ] Substack RSS feed loads on resource page
- [ ] Lightroom slideshow iframe loads on events page
- [ ] All external images load (Lightroom CDN, Constant Contact, etc.)
- [ ] 404 page displays for invalid URLs
- [ ] Google Search Console updated with new sitemap
- [ ] Old Google Sites pages redirect or are taken down
