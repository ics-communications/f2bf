import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const fileUrl = (p) => 'file://' + path.join(root, p);

const SOURCE = 'convocation-card.html';

const browser = await chromium.launch();

// PDF: 2 pages at 7.25 × 5.25 in
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(fileUrl(SOURCE), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({
    content: `html, body { background: #ffffff !important; padding: 0 !important; gap: 0 !important; }
              .label { display: none !important; }
              .card { box-shadow: none !important; }`
  });
  await page.pdf({
    path: path.join(root, 'convocation-card.pdf'),
    width: '7.25in',
    height: '5.25in',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    preferCSSPageSize: true,
  });
  await ctx.close();
  console.log('[ok] convocation-card.pdf');
}

// PNG: each card individually at 2x for visual review
const CARDS = [
  { sel: '.card.front', out: 'preview-front.png' },
  { sel: '.card.back',  out: 'preview-back.png' },
];

for (const { sel, out } of CARDS) {
  const ctx = await browser.newContext({
    viewport: { width: 800, height: 600 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(fileUrl(SOURCE), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const target = page.locator(sel);
  await target.waitFor();
  await target.screenshot({ path: path.join(root, out), type: 'png' });
  await ctx.close();
  console.log(`[ok] ${out}`);
}

await browser.close();
