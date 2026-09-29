import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dir = 'christian-courier-angela-ads';
const fileUrl = (p) => 'file://' + path.join(root, p);

const ADS = [
  [`${dir}/christian-courier-angela-300x300.html`, `${dir}/christian-courier-angela-300x300.png`, 300, 300],
  [`${dir}/christian-courier-angela-600x200.html`, `${dir}/christian-courier-angela-600x200.png`, 600, 200],
];
const FONTS = ['900 20px "Playfair Display"',
  '700 20px "Playfair Display"', '400 12px "Source Sans 3"', '700 12px "Source Sans 3"'];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 800, height: 500 },
  deviceScaleFactor: 1,            // deliverables are exact pixel sizes
});
const page = await ctx.newPage();
for (const [src, out, w, h] of ADS) {
  await page.goto(fileUrl(src), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const missing = await page.evaluate((f) => f.filter((s) => !document.fonts.check(s)), FONTS);
  if (missing.length) throw new Error(`${src}: fonts not loaded: ${missing.join(', ')}`);
  // Flag any element whose content overflows its box (clipped text).
  const overflow = await page.evaluate(() => {
    const ad = document.querySelector('#ad').getBoundingClientRect();
    return [...document.querySelectorAll('#ad *')]
      .filter((el) => el.tagName !== 'IMG' && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
      .filter((el) => { const r = el.getBoundingClientRect();
        return r.right > ad.right - 4 || r.bottom > ad.bottom - 4 || r.left < ad.left || r.top < ad.top; })
      .map((el) => el.className || el.tagName);
  });
  if (overflow.length) console.warn('[warn] within 4px of an edge or outside the canvas:', overflow.join(', '));
  const box = await page.locator('#ad').boundingBox();
  if (box.width !== w || box.height !== h) throw new Error(`${src}: ${box.width}x${box.height}, expected ${w}x${h}`);
  await page.locator('#ad').screenshot({ path: path.join(root, out), type: 'png' });
  console.log('[ok]', out);
}
await ctx.close();
await browser.close();
