#!/usr/bin/env python3
"""Build script: syncs the shared nav and footer into the site's pages.

The pages themselves are the source of truth and are edited directly. (The
original Squarespace-export sources this script used to transform were removed
in d1ed42c; see git history for the old version.) This script only keeps the
shared parts in step:

  1. Every page with the f2bf nav gets the current _includes/nav.html, keeping
     the page's own active nav item, and loads /assets/js/nav.js.
  2. Every page with the f2bf footer gets the current _includes/footer.html,
     keeping the page's own wave colours (tuned to the section above it).
  3. Route aliases are regenerated: /f2bf-landing is a copy of the home page
     with relative URLs made root-absolute, and /courses is a redirect stub.

Usage:
  python3 _build.py          update pages in place
  python3 _build.py --check  list out-of-date pages without writing (exit 1 if any)
"""
import re, os, sys
from urllib.parse import urljoin

os.chdir(os.path.dirname(os.path.abspath(__file__)))

NAV_TEMPLATE = open('_includes/nav.html', encoding='utf-8').read().strip('\n')
FOOTER_TEMPLATE = open('_includes/footer.html', encoding='utf-8').read().strip('\n')
FAVICON_HREF = '/assets/img/ICS_New_Favicon.png'
NAV_JS = '<script src="/assets/js/nav.js"></script>'

NAV_START = '<header class="f2bf-header">'
MOBILE_MENU_START = '<div class="f2bf-mobile-menu"'
FOOTER_START = '<footer class="f2bf-footer"'
WAVE_START = '<div class="f2bf-footer__wave"'

ROUTE_ALIASES = [
    {
        'source': 'index.html',
        'target': 'f2bf-landing/index.html',
    },
    {
        # /courses is a legacy route kept alive for links already in the wild
        # (e.g. the F26 announcement email). It emits a redirect stub so the
        # page itself only ever has to be edited at /f2bf-courses.
        'redirect_to': '/f2bf-courses',
        'target': 'courses/index.html',
        'title': 'Courses | Free to be Faithful | ICS',
    },
]

REDIRECT_TEMPLATE = '''<!DOCTYPE html>
<html lang="en-CA">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/png" href="{favicon}">
  <title>{title}</title>
  <!-- Route alias: this path is a stub. The real page lives at {dest}. -->
  <link rel="canonical" href="https://f2bf.icscanada.edu{dest}">
  <meta name="robots" content="noindex, follow">
  <meta http-equiv="refresh" content="0; url={dest}">
  <script>location.replace("{dest}" + location.search + location.hash);</script>
  <style>
    body {{
      margin: 0; min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: #1B3A4B; color: #F4F1EA;
      font-family: 'Source Sans 3', 'Helvetica Neue', Arial, sans-serif;
      text-align: center; padding: 2rem;
    }}
    a {{ color: #F4F1EA; }}
  </style>
</head>
<body>
  <p>Redirecting to the <a href="{dest}">Free to be Faithful courses page</a>&hellip;</p>
</body>
</html>
'''

warnings = []

def warn(msg):
    warnings.append(msg)

def div_end(text, start):
    """Index just past the </div> that closes the <div> opening at `start`."""
    depth = 0
    for m in re.finditer(r'<div\b|</div>', text[start:]):
        depth += 1 if m.group().startswith('<div') else -1
        if depth == 0:
            return start + m.end()
    return -1

def find_nav(text):
    start = text.find(NAV_START)
    if start == -1:
        return None
    menu = text.find(MOBILE_MENU_START, start)
    end = div_end(text, menu) if menu != -1 else -1
    return (start, end) if end != -1 else None

def find_footer(text):
    start = text.find(FOOTER_START)
    if start == -1:
        return None
    end = text.find('</footer>', start)
    return (start, end + len('</footer>')) if end != -1 else None

def get_active_nav(nav_html):
    """('link', text), ('dropdown', text), or None for the page's active item."""
    m = re.search(
        r'<li class="f2bf-nav__item f2bf-nav__item--active">\s*<(a|button)\b[^>]*>\s*([^<]*)',
        nav_html)
    if not m:
        return None
    return ('link' if m.group(1) == 'a' else 'dropdown', m.group(2).strip())

def set_active_nav(nav_html, active, page):
    if active is None:
        return nav_html
    kind, text = active
    tag = r'<a class="f2bf-nav__link" href="[^"]*">' if kind == 'link' else r'<button\b[^>]*>\s*'
    pattern = rf'<li class="f2bf-nav__item">(\s*{tag}{re.escape(text)}(?=[<\s]))'
    nav_html, n = re.subn(pattern, r'<li class="f2bf-nav__item f2bf-nav__item--active">\1', nav_html, count=1)
    if n == 0:
        warn(f'{page}: active nav item "{text}" is not in _includes/nav.html; no item marked active')
    return nav_html

def keep_wave_colours(old_footer, new_footer, page):
    """Copy the page's wave fill/stroke colours onto the template's wave."""
    old_start = old_footer.find(WAVE_START)
    new_start = new_footer.find(WAVE_START)
    if old_start == -1 or new_start == -1:
        return new_footer
    old_wave = old_footer[old_start:div_end(old_footer, old_start)]
    new_end = div_end(new_footer, new_start)
    new_wave = new_footer[new_start:new_end]
    colour_attr = r'\b(fill|stroke)="(#[0-9A-Fa-f]{3,8})"'
    old_colours = re.findall(colour_attr, old_wave)
    if [a for a, _ in old_colours] != [a for a, _ in re.findall(colour_attr, new_wave)]:
        warn(f'{page}: footer wave differs in shape from _includes/footer.html; template colours used')
        return new_footer
    colours = iter(old_colours)
    new_wave = re.sub(colour_attr, lambda m: f'{m.group(1)}="{next(colours)[1]}"', new_wave)
    return new_footer[:new_start] + new_wave + new_footer[new_end:]

def sync_page(text, page):
    span = find_nav(text)
    if span:
        start, end = span
        nav = set_active_nav(NAV_TEMPLATE, get_active_nav(text[start:end]), page)
        text = text[:start] + nav + text[end:]
        if 'assets/js/nav.js' not in text:
            body_end = text.rfind('</body>')
            if body_end == -1:
                warn(f'{page}: no </body>; nav.js not added')
            else:
                text = text[:body_end] + NAV_JS + '\n' + text[body_end:]
    elif NAV_START in text:
        warn(f'{page}: nav found but its mobile menu is missing; nav not synced')

    span = find_footer(text)
    if span:
        start, end = span
        footer = keep_wave_colours(text[start:end], FOOTER_TEMPLATE, page)
        text = text[:start] + footer + text[end:]
    return text

def root_absolute(text):
    """Rewrite relative URLs in src/href/poster/srcset and CSS url() to root-absolute."""
    def fix(url):
        if re.match(r'^(/|#|[a-z][a-z0-9+.-]*:|\{|$)', url.strip(), re.I):
            return url
        return urljoin('/', url.strip())
    text = re.sub(r'\b(src|href|poster)="([^"]*)"', lambda m: f'{m.group(1)}="{fix(m.group(2))}"', text)
    text = re.sub(
        r'\bsrcset="([^"]*)"',
        lambda m: 'srcset="' + ', '.join(
            ' '.join([fix(c.split()[0])] + c.split()[1:]) for c in m.group(1).split(',') if c.strip()
        ) + '"',
        text)
    text = re.sub(r'url\((["\']?)([^"\')]*)\1\)', lambda m: f'url({m.group(1)}{fix(m.group(2))}{m.group(1)})', text)
    return text

def site_pages():
    alias_targets = {a['target'] for a in ROUTE_ALIASES}
    for dirpath, dirnames, filenames in os.walk('.'):
        dirnames[:] = sorted(d for d in dirnames
                             if not d.startswith(('.', '_')) and d != 'node_modules')
        for name in sorted(filenames):
            if not name.endswith('.html') or name.startswith('._'):
                continue
            path = os.path.relpath(os.path.join(dirpath, name))
            if path not in alias_targets:
                yield path

def build():
    """Return {path: new content} for every file whose content would change."""
    outputs = {}
    for page in site_pages():
        with open(page, encoding='utf-8') as f:
            old = f.read()
        if NAV_START not in old and FOOTER_START not in old:
            continue
        outputs[page] = (old, sync_page(old, page))

    for alias in ROUTE_ALIASES:
        if alias.get('redirect_to'):
            new = REDIRECT_TEMPLATE.format(
                favicon=FAVICON_HREF,
                title=alias['title'],
                dest=alias['redirect_to'],
            )
        else:
            source = outputs[alias['source']][1] if alias['source'] in outputs else \
                open(alias['source'], encoding='utf-8').read()
            new = root_absolute(source)
        old = open(alias['target'], encoding='utf-8').read() if os.path.exists(alias['target']) else None
        outputs[alias['target']] = (old, new)

    return {path: new for path, (old, new) in outputs.items() if old != new}

if __name__ == '__main__':
    check = '--check' in sys.argv[1:]
    changed = build()
    for path, new in sorted(changed.items()):
        if check:
            print(f'out of date: {path}')
        else:
            os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new)
            print(f'updated: {path}')
    for w in warnings:
        print(f'WARNING: {w}', file=sys.stderr)
    if not changed:
        print('All pages up to date.')
    sys.exit(1 if check and changed else 0)
