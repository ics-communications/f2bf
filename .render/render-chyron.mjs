import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const fileUrl = (p) => 'file://' + path.join(root, p);

// Pre-show chyron for the Fall 2026 Big Read stream: a transparent PNG
// overlaid bottom-right in OBS on the 1920x1080 holding slides.
const SOURCE = 'social/2026-fall-big-read-chyron.html';
const OUT = 'social/stream/chyron-big-read-begins-7pm.png';

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 400 },
  deviceScaleFactor: 1,            // native pixels for a 1920x1080 OBS canvas
});
const page = await ctx.newPage();
await page.goto(fileUrl(SOURCE), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);

await page.locator('#chyron').screenshot({
  path: path.join(root, OUT), type: 'png', omitBackground: true,
});
console.log('[ok]', OUT);
await ctx.close();
await browser.close();
