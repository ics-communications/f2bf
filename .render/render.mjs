import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const fileUrl = (p) => 'file://' + path.join(root, p);

const SOURCE = 'social/2026-27-tiles.html';
const TILES = [
  ['#tile-olthuis',  'social/f2bf-2026-spirals-of-love-and-healing-olthuis.png'],
  ['#tile-berglund', 'social/f2bf-2026-keeping-faith-under-dictators-berglund.png'],
  ['#tile-fall-2026', 'social/f2bf-2026-fall-courses.png'],
];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1240, height: 1500 },
  deviceScaleFactor: 1,            // deliverables are exactly 1080x1350
});
const page = await ctx.newPage();
await page.goto(fileUrl(SOURCE), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

for (const [sel, out] of TILES) {
  const target = page.locator(sel);
  await target.waitFor();
  await target.screenshot({ path: path.join(root, out), type: 'png' });
  console.log('[ok]', out);
}

await ctx.close();
await browser.close();
