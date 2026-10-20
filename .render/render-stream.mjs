import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const fileUrl = (p) => 'file://' + path.join(root, p);

// Livestream kit for the Fall 2026 Big Read: one YouTube thumbnail
// (1280x720) and the 1920x1080 holding slides that rotate on the stream.
const SOURCE = 'social/2026-fall-big-read-stream.html';
const OUT = 'social/stream/';
const TARGETS = [
  ['#yt-thumb',              'f2bf-2026-big-read-youtube-thumbnail.png'],
  ['#slide-defying-tyrants', 'slide-1-defying-tyrants.png'],
  ['#slide-f2bf',            'slide-2-free-to-be-faithful.png'],
  ['#slide-ics',             'slide-3-institute-for-christian-studies.png'],
  ['#slide-course-bick',     'slide-4-course-broken-hallelujah.png'],
  ['#slide-course-kuipers',  'slide-5-course-arendt.png'],
  ['#slide-course-taylor',   'slide-6-course-christian-antichrists.png'],
  ['#slide-winter-2027',     'slide-7-courses-winter-2027.png'],
];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 2040, height: 1200 },
  deviceScaleFactor: 1,            // slides are exactly 1920x1080, thumbnail 1280x720
});
const page = await ctx.newPage();
await page.goto(fileUrl(SOURCE), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);

for (const [sel, out] of TARGETS) {
  const target = page.locator(sel);
  await target.waitFor();
  await target.screenshot({ path: path.join(root, OUT, out), type: 'png' });
  console.log('[ok]', OUT + out);
}
await ctx.close();
await browser.close();
