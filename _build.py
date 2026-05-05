#!/usr/bin/env python3
"""Build script: transforms source HTML files into clean GitHub Pages output."""
import re, os, html

NAV_TEMPLATE = open('_includes/nav.html', encoding='utf-8').read()
FOOTER_TEMPLATE = open('_includes/footer.html', encoding='utf-8').read()
FAVICON_HREF = '/assets/img/ICS_New_Favicon.png'

LINK_MAP = {
    'https://f2bf.icscanada.edu/f2bf-program': '/f2bf-program',
    'https://f2bf.icscanada.edu/f2bf-courses': '/f2bf-courses',
    'https://f2bf.icscanada.edu/f2bf-community': '/f2bf-community',
    'https://f2bf.icscanada.edu/events': '/events',
    'https://f2bf.icscanada.edu/f2bf-resource': '/f2bf-resource',
    'https://f2bf.icscanada.edu/conference-may13': '/conference-may13',
    'https://f2bf.icscanada.edu/': '/',
    'https://f2bf.icscanada.edu': '/',
}

PAGES = [
    {
        'source': 'f2bf-landing.html',
        'target': 'index.html',
        'title': 'Free to be Faithful | Institute for Christian Studies',
        'desc': 'Courses, resources, and community for Christians exploring how ancient faith engages the pressing issues of our time. A lifelong learning initiative of ICS.',
        'canonical': '',
        'active_nav_text': 'Free to be Faithful',
        'active_nav_type': 'link',
        'wave_bg': '#BCC7D0',
        'btn_replacements': {},
        'animation_remove': ['f2bfReveal'],
    },
    {
        'source': 'f2bf-program.html',
        'target': 'f2bf-program/index.html',
        'title': 'Program | Free to be Faithful | ICS',
        'desc': 'Explore the Free to be Faithful program: online courses, three learning pillars, and pathways toward an ICS Master of Worldview Studies degree.',
        'canonical': 'f2bf-program',
        'active_nav_text': 'Program',
        'active_nav_type': 'link',
        'wave_bg': '#1B3A4B',
        'btn_replacements': {'f2bf-prog-btn': 'f2bf-btn', 'f2bf-prog-rule': 'f2bf-rule'},
        'animation_remove': [],
    },
    {
        'source': 'f2bf-courses.html',
        'target': 'f2bf-courses/index.html',
        'title': 'Courses | Free to be Faithful | ICS',
        'desc': 'Enroll in six-week online seminars led by world-class scholars. Take courses for personal enrichment or earn ICS credit toward a Master\'s degree.',
        'canonical': 'f2bf-courses',
        'active_nav_text': 'Courses',
        'active_nav_type': 'link',
        'wave_bg': '#0F2631',
        'btn_replacements': {'f2bf-c-btn': 'f2bf-btn', 'f2bf-c-rule': 'f2bf-rule'},
        'animation_remove': [],
    },
    {
        'source': 'f2bf-community.html',
        'target': 'f2bf-community/index.html',
        'title': 'Community | Free to be Faithful | ICS',
        'desc': 'Join a welcoming community of Christians committed to renewing public life. Open events, team introductions, and ways to connect.',
        'canonical': 'f2bf-community',
        'active_nav_text': 'Community',
        'active_nav_type': 'dropdown',
        'wave_bg': '#BCC7D0',
        'btn_replacements': {'f2bf-comm-btn': 'f2bf-btn', 'f2bf-comm-rule': 'f2bf-rule'},
        'animation_remove': [],
    },
    {
        'source': 'f2bf-events.html',
        'target': 'events/index.html',
        'title': 'Events | Free to be Faithful | ICS',
        'desc': 'Browse upcoming and past Free to be Faithful events, view photo galleries, and check the calendar for open community gatherings.',
        'canonical': 'events',
        'active_nav_text': 'Community',
        'active_nav_type': 'dropdown',
        'wave_bg': '#0F2631',
        'btn_replacements': {'f2bf-ev-btn': 'f2bf-btn', 'f2bf-ev-rule': 'f2bf-rule'},
        'animation_remove': [],
    },
    {
        'source': 'f2bf-resource.html',
        'target': 'f2bf-resource/index.html',
        'title': 'Resources | Free to be Faithful | ICS',
        'desc': 'Timely writing, curated reading lists, shared expertise, and enriching dialogues for Christians engaging faith and public life.',
        'canonical': 'f2bf-resource',
        'active_nav_text': 'Resources',
        'active_nav_type': 'link',
        'wave_bg': '#BCC7D0',
        'btn_replacements': {},
        'animation_remove': ['f2bfReveal'],
    },
    {
        'source': '_conference_decoded.html',
        'target': 'conference-may13/index.html',
        'title': 'Courageous Faith in a Time of Fear | Free to be Faithful',
        'desc': 'A two-day conference on pastoral leadership, public responsibility, and courageous faith. May 13–14, 2026, Toronto. In-person and livestream.',
        'canonical': 'conference-may13',
        'active_nav_text': 'Community',
        'active_nav_type': 'dropdown',
        'wave_bg': '#0F2631',
        'btn_replacements': {},
        'animation_remove': [],
        'keep_page_btns': True,
    },
]

def rewrite_links(text):
    for old, new in sorted(LINK_MAP.items(), key=lambda x: -len(x[0])):
        text = text.replace(old, new)
    return text

def set_active_nav(nav_html, active_text, active_type):
    if active_type == 'link':
        nav_html = nav_html.replace(
            f'<a class="f2bf-nav__link" href',
            f'<a class="f2bf-nav__link" href',
        )
        pattern = rf'(<li class="f2bf-nav__item">)\s*\n(\s*<a class="f2bf-nav__link" href="[^"]*">{re.escape(active_text)}</a>)'
        nav_html = re.sub(pattern, r'<li class="f2bf-nav__item f2bf-nav__item--active">\n\2', nav_html)
    elif active_type == 'dropdown':
        nav_html = nav_html.replace(
            '<li class="f2bf-nav__item">\n          <button aria-expanded',
            '<li class="f2bf-nav__item f2bf-nav__item--active">\n          <button aria-expanded',
        )
    return nav_html

def extract_head_css(source):
    m = re.search(r'<style>\s*\n(.*?)\n\s*</style>\s*\n</head>', source, re.DOTALL)
    if not m:
        m = re.search(r'<style>(.*?)</style>', source, re.DOTALL)
    if not m:
        return ''
    css = m.group(1)
    return css

def clean_css(css, page_cfg):
    lines = css.split('\n')
    cleaned = []
    skip_block = False
    brace_depth = 0
    skip_patterns = [
        r'^\s*html\s*,\s*body\s*\{',
        r'^\s*\.page-section',
        r'^\s*\.sqs-block-code',
        r'^\s*@import\s+url',
    ]

    wrapper_classes = ['.f2bf ', '.f2bf-prog ', '.f2bf-c ', '.f2bf-comm ', '.f2bf-ev ', '.cf ']
    wrapper_selectors = ['.f2bf {', '.f2bf-prog {', '.f2bf-c {', '.f2bf-comm {', '.f2bf-ev {', '.cf {']
    reset_selectors = [' *, ', ' *::before', ' *::after']

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Skip Squarespace overrides
        skip = False
        for pat in skip_patterns:
            if re.match(pat, stripped):
                skip = True
                break
        if skip:
            depth = 0
            while i < len(lines):
                depth += lines[i].count('{') - lines[i].count('}')
                i += 1
                if depth <= 0:
                    break
            continue

        # Skip reset (box-sizing) blocks
        if any(sel in stripped for sel in reset_selectors) and 'box-sizing' in stripped:
            i += 1
            continue

        # Skip wrapper class with custom properties
        is_wrapper = False
        for ws in wrapper_selectors:
            if stripped.startswith(ws):
                is_wrapper = True
                break
        if is_wrapper:
            depth = 0
            while i < len(lines):
                depth += lines[i].count('{') - lines[i].count('}')
                i += 1
                if depth <= 0:
                    break
            continue

        # Skip shared button styles
        btn_prefixes_to_skip = ['.f2bf-btn', '.f2bf-prog-btn', '.f2bf-c-btn', '.f2bf-comm-btn', '.f2bf-ev-btn']
        if not page_cfg.get('keep_page_btns'):
            btn_prefixes_to_skip.append('.cf-btn')
        is_btn = False
        for bp in btn_prefixes_to_skip:
            if stripped.startswith(bp):
                is_btn = True
                break
        if is_btn:
            depth = 0
            while i < len(lines):
                depth += lines[i].count('{') - lines[i].count('}')
                i += 1
                if depth <= 0:
                    break
            continue

        # Skip shared rule styles
        rule_prefixes = ['.f2bf-rule', '.f2bf-prog-rule', '.f2bf-c-rule', '.f2bf-comm-rule', '.f2bf-ev-rule']
        if not page_cfg.get('keep_page_btns'):
            rule_prefixes.append('.cf-rule')
        is_rule = False
        for rp in rule_prefixes:
            if stripped.startswith(rp):
                is_rule = True
                break
        if is_rule:
            depth = 0
            while i < len(lines):
                depth += lines[i].count('{') - lines[i].count('}')
                i += 1
                if depth <= 0:
                    break
            continue

        # Skip shared animation
        for anim in page_cfg.get('animation_remove', []):
            if f'@keyframes {anim}' in stripped:
                depth = 0
                while i < len(lines):
                    depth += lines[i].count('{') - lines[i].count('}')
                    i += 1
                    if depth <= 0:
                        break
                skip = True
                break
        if skip:
            skip = False
            continue

        # Skip comments about buttons/rules/grain
        if stripped.startswith('/* ─── Buttons') or stripped.startswith('/* ─── Horizontal rule'):
            i += 1
            continue

        # Skip grain overlay for shared ones
        if stripped.startswith('.cf-grain') and not page_cfg.get('keep_page_btns'):
            depth = 0
            while i < len(lines):
                depth += lines[i].count('{') - lines[i].count('}')
                i += 1
                if depth <= 0:
                    break
            continue

        cleaned.append(line)
        i += 1

    # Remove full-bleed hack lines
    result = '\n'.join(cleaned)
    result = re.sub(r'\s*width:\s*100vw\s*!important\s*;', '', result)
    result = re.sub(r'\s*margin-left:\s*calc\(50%\s*-\s*50vw\)\s*!important\s*;', '', result)
    result = re.sub(r'\s*max-width:\s*100vw\s*;', '', result)

    # Remove Squarespace comment blocks
    result = re.sub(r'/\*\s*={3,}.*?={3,}\s*\*/', '', result, flags=re.DOTALL)

    # Clean excessive blank lines
    result = re.sub(r'\n{3,}', '\n\n', result)

    return result.strip()

def extract_content(source):
    # Find end of nav marker
    nav_end = source.find('<!-- ===== END F2BF NAVIGATION BAR ===== -->')
    if nav_end == -1:
        # For conference page, look for after the nav div closes
        nav_end = source.find('<!-- ===== END F2BF NAVIGATION BAR ===== -->')
    if nav_end == -1:
        return '', ''

    after_nav = source[nav_end + len('<!-- ===== END F2BF NAVIGATION BAR ===== -->'):]

    # Find start of footer CSS or footer HTML
    footer_css_start = after_nav.find('\n<style>\n  /* ====')
    if footer_css_start == -1:
        footer_css_start = after_nav.find('\n<style>\n  #footer-sections')
    if footer_css_start == -1:
        footer_css_start = after_nav.find('\n<style>\n  /* ============')

    footer_html_start = after_nav.find('<footer class="f2bf-footer"')

    # Content is between nav end and footer CSS/HTML start
    if footer_css_start != -1:
        content = after_nav[:footer_css_start].strip()
    elif footer_html_start != -1:
        content = after_nav[:footer_html_start].strip()
    else:
        content = after_nav.split('</body>')[0].strip()

    # Extract scripts (PayPal, etc.) that come after the main content div
    scripts = ''
    script_matches = re.findall(r'(<script\b[^>]*>.*?</script>)', after_nav, re.DOTALL)
    for sm in script_matches:
        # Skip nav-related scripts
        if 'f2bfMobileMenu' in sm or 'classList' in sm:
            continue
        scripts += sm + '\n'

    return content, scripts

def extract_scripts_after_content(source):
    """Extract standalone script tags between content and footer."""
    nav_end_idx = source.find('<!-- ===== END F2BF NAVIGATION BAR ===== -->')
    if nav_end_idx == -1:
        return ''
    after_nav = source[nav_end_idx:]

    # Find the footer style block or footer tag
    footer_idx = after_nav.find('<footer class="f2bf-footer"')
    if footer_idx == -1:
        return ''

    between = after_nav[:footer_idx]
    # Find all script tags after the closing wrapper div
    scripts = []
    for m in re.finditer(r'(<script\b[^>]*>.*?</script>)', between, re.DOTALL):
        s = m.group(1)
        if 'paypal' in s.lower() or 'f2bfOpenReg' in s or 'f2bfCloseReg' in s or 'google' in s.lower() or 'substack' in s.lower() or 'rss2json' in s.lower() or 'allorigins' in s.lower() or 'calendar' in s.lower():
            scripts.append(s)
    return '\n'.join(scripts)

def build_page(page_cfg):
    print(f"Processing {page_cfg['source']} -> {page_cfg['target']}")

    with open(page_cfg['source'], encoding='utf-8') as f:
        source = f.read()

    # Extract page-specific CSS
    css = extract_head_css(source)
    css = clean_css(css, page_cfg)

    # Extract content between nav and footer
    content, _ = extract_content(source)

    # Scripts are already included in the content extraction (they sit between
    # the closing wrapper div and the footer CSS/HTML). No separate extraction needed.
    scripts = ''

    # Replace button/rule class prefixes in content
    for old, new in page_cfg.get('btn_replacements', {}).items():
        content = content.replace(old, new)
        scripts = scripts.replace(old, new)

    # Rewrite absolute links
    content = rewrite_links(content)
    scripts = rewrite_links(scripts)

    # Set active nav
    nav = set_active_nav(NAV_TEMPLATE, page_cfg['active_nav_text'], page_cfg['active_nav_type'])

    # Set footer wave background
    footer = FOOTER_TEMPLATE.replace(
        'background: #0F2631;',
        f"background: {page_cfg['wave_bg']};",
        1
    ) if page_cfg['wave_bg'] != '#0F2631' else FOOTER_TEMPLATE

    # Build canonical URL
    canonical_path = page_cfg['canonical']
    if canonical_path:
        canonical_url = f'https://f2bf.icscanada.edu/{canonical_path}'
    else:
        canonical_url = 'https://f2bf.icscanada.edu/'

    # Build the page
    output = f'''<!DOCTYPE html>
<html lang="en-CA">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/png" href="{FAVICON_HREF}">
  <link rel="apple-touch-icon" href="{FAVICON_HREF}">
  <title>{page_cfg['title']}</title>
  <meta name="description" content="{page_cfg['desc']}">
  <link rel="canonical" href="{canonical_url}">
  <meta property="og:title" content="{page_cfg['title']}">
  <meta property="og:description" content="{page_cfg['desc']}">
  <meta property="og:url" content="{canonical_url}">
  <meta property="og:type" content="website">
  <link rel="stylesheet" href="/assets/css/global.css">
  <link rel="stylesheet" href="/assets/css/nav.css">
  <link rel="stylesheet" href="/assets/css/footer.css">
  <style>
    {css}
  </style>
</head>
<body>
<!-- Navigation -->
{nav}

<!-- Main Content -->
{content}

<!-- Footer -->
{footer}

{scripts}
<script src="/assets/js/nav.js"></script>
</body>
</html>
'''

    # Final cleanup — do NOT rewrite_links on the full output (canonical/OG URLs must stay absolute)

    # Remove any remaining Squarespace overrides
    output = re.sub(r'^\s*\.sqs-block-code\b.*$', '', output, flags=re.MULTILINE)
    output = re.sub(r'^\s*#footer-sections\b.*$', '', output, flags=re.MULTILINE)

    # Write
    os.makedirs(os.path.dirname(page_cfg['target']) if os.path.dirname(page_cfg['target']) else '.', exist_ok=True)
    with open(page_cfg['target'], 'w', encoding='utf-8') as f:
        f.write(output)

    print(f"  -> Written to {page_cfg['target']} ({len(output)} chars)")

# Process all pages
for page in PAGES:
    try:
        build_page(page)
    except Exception as e:
        print(f"ERROR processing {page['source']}: {e}")
        import traceback
        traceback.print_exc()

print("\nDone! Now creating 404.html...")

# Create 404 page
nav_404 = NAV_TEMPLATE  # No active state
footer_404 = FOOTER_TEMPLATE

html_404 = f'''<!DOCTYPE html>
<html lang="en-CA">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/png" href="{FAVICON_HREF}">
  <link rel="apple-touch-icon" href="{FAVICON_HREF}">
  <title>Page Not Found | Free to be Faithful</title>
  <meta name="description" content="The page you are looking for could not be found.">
  <link rel="stylesheet" href="/assets/css/global.css">
  <link rel="stylesheet" href="/assets/css/nav.css">
  <link rel="stylesheet" href="/assets/css/footer.css">
  <style>
    .f2bf-404 {{
      background: var(--cream-lt);
      padding: 8rem 2.5rem;
      text-align: center;
      min-height: 50vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }}
    .f2bf-404__inner {{
      max-width: 600px;
    }}
    .f2bf-404__heading {{
      font-family: var(--display);
      font-weight: 900;
      font-size: clamp(2.5rem, 5vw, 4rem);
      color: var(--teal);
      line-height: 1.1;
      margin-bottom: 1rem;
    }}
    .f2bf-404__text {{
      font-family: var(--text);
      font-size: 1.1rem;
      color: var(--body);
      line-height: 1.85;
      margin-bottom: 2.5rem;
    }}
  </style>
</head>
<body>
{nav_404}

<div class="f2bf-404">
  <div class="f2bf-404__inner">
    <h1 class="f2bf-404__heading">Page Not Found</h1>
    <p class="f2bf-404__text">Sorry, the page you're looking for doesn't exist or has been moved.</p>
    <a href="/" class="f2bf-btn f2bf-btn--teal">Back to Home &rarr;</a>
  </div>
</div>

{footer_404}

<script src="/assets/js/nav.js"></script>
</body>
</html>
'''

with open('404.html', 'w', encoding='utf-8') as f:
    f.write(html_404)
print("  -> Written 404.html")
