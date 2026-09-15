import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const fileUrl = (p) => 'file://' + path.join(root, p);

const SOURCE = 'social/2026-fall-big-read.html';
const TILES = [
  ['#tile-big-read', 'social/f2bf-2026-big-read-defying-tyrants.png'],
];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1240, height: 1500 },
  deviceScaleFactor: 1,            // deliverable is exactly 1080x1350
});
const page = await ctx.newPage();
await page.goto(fileUrl(SOURCE), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);

for (const [sel, out] of TILES) {
  const target = page.locator(sel);
  await target.waitFor();
  await target.screenshot({ path: path.join(root, out), type: 'png' });
  console.log('[ok]', out);
}
await ctx.close();
await browser.close();
