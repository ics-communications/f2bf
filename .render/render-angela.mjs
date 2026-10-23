import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const fileUrl = (p) => 'file://' + path.join(root, p);

// [source, selector, output, viewport, scale]
// Ships at native 1080x1350 like the rest of the course series.
const JOBS = [
  ['social/2026-fall-angela.html', '#tile-angela',
   'social/f2bf-2026-broken-hallelujah-reitsma-bick.png', { width: 1240, height: 1500 }, 1],
];

const browser = await chromium.launch();
for (const [src, sel, out, viewport, dsf] of JOBS) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: dsf });
  const page = await ctx.newPage();
  await page.goto(fileUrl(src), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const target = page.locator(sel);
  await target.waitFor();
  await target.screenshot({ path: path.join(root, out), type: 'png' });
  await ctx.close();
  console.log('[ok]', out);
}
await browser.close();
