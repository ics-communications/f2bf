import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const fileUrl = (p) => 'file://' + path.join(root, p);

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
await page.goto(fileUrl('social/2026-fall-pair-16x9.html'), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const target = page.locator('#tile-fall-pair');
await target.waitFor();
await target.screenshot({ path: path.join(root, 'social/f2bf-2026-fall-olthuis-berglund-16x9.png'), type: 'png' });
await ctx.close();
await browser.close();
console.log('[ok] social/f2bf-2026-fall-olthuis-berglund-16x9.png');
