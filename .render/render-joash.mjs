import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const fileUrl = (p) => 'file://' + path.join(root, p);

// [source, selector, output, viewport, scale]
// The 4:5 ships at native 1080x1350 like the rest of the course series;
// the 16:9 is rendered at 2x and stays 3840x2160, matching the fall pair.
const JOBS = [
  ['social/2027-winter-joash.html', '#tile-joash',
   'social/f2bf-2027-decolonizing-the-great-commission-thomas.png', { width: 1240, height: 1500 }, 1],
  ['social/2027-winter-joash-16x9.html', '#tile-joash-16x9',
   'social/f2bf-2027-decolonizing-the-great-commission-thomas-16x9.png', { width: 1920, height: 1080 }, 2],
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
