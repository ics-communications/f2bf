/**
 * F2BF Fall 2026 — 7x5 print card renderer.
 *
 * Outputs (print/out/):
 *   f2bf-fall-2026-card-PRESS.pdf        2 pages, 7.25x5.25in bleed, no marks  ← send this
 *   f2bf-fall-2026-card-front.pdf        single page, bleed size
 *   f2bf-fall-2026-card-back.pdf         single page, bleed size
 *   f2bf-fall-2026-card-CROPMARKS.pdf    2 pages, 7.75x5.75in with crop marks
 *   proof-front.png / proof-back.png     300 DPI proofs with trim + safe guides
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const SOURCE = 'print/f2bf-fall-2026-card.html';
const OUT = path.join(root, 'print/out');
fs.mkdirSync(OUT, { recursive: true });

const BLEED_W = '7.25in', BLEED_H = '5.25in';
const MARKS_W = '7.75in', MARKS_H = '5.75in';

const browser = await chromium.launch();

async function open({ proof = false } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1400, height: 1100 },
    deviceScaleFactor: proof ? 300 / 96 : 1,   // 300 DPI proofs
  });
  const page = await ctx.newPage();
  await page.goto('file://' + path.join(root, SOURCE), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  if (proof) await page.evaluate(() => document.body.classList.add('proof'));
  return { ctx, page };
}

/* ── 1. Press PDFs at exact bleed size, no marks ── */
{
  const { ctx, page } = await open();

  await page.pdf({
    path: path.join(OUT, 'f2bf-fall-2026-card-PRESS.pdf'),
    width: BLEED_W, height: BLEED_H, printBackground: true, preferCSSPageSize: true,
  });
  console.log('[ok] PRESS.pdf (2 pages)');

  for (const [id, name] of [['card-back', 'front'], ['card-front', 'back']]) {
    await page.evaluate((hide) => {
      document.getElementById(hide).style.display = 'none';
    }, id);
    await page.pdf({
      path: path.join(OUT, `f2bf-fall-2026-card-${name}.pdf`),
      width: BLEED_W, height: BLEED_H, printBackground: true, preferCSSPageSize: true,
    });
    await page.evaluate((show) => {
      document.getElementById(show).style.display = '';
    }, id);
    console.log('[ok]', name + '.pdf');
  }
  await ctx.close();
}

/* ── 2. Crop-marks version: each card wrapped in a 7.75x5.75in sheet.
      NOTE: .card has overflow:hidden, so marks must live on a WRAPPER,
      not on the card itself, or they get clipped away. ── */
{
  const { ctx, page } = await open();

  await page.evaluate(() => {
    for (const card of Array.from(document.querySelectorAll('.card'))) {
      const sheet = document.createElement('div');
      sheet.className = 'sheet';
      card.parentNode.insertBefore(sheet, card);
      sheet.appendChild(card);
      // 8 crop marks, aligned to the TRIM edges, drawn in the slug
      // outside the bleed box so nothing overlaps live artwork.
      for (const m of [
        // [left, top, width, height]
        ['0.375in', '0.06in',  '0.0035in', '0.16in'],   // top-left  vertical
        ['7.375in', '0.06in',  '0.0035in', '0.16in'],   // top-right vertical
        ['0.375in', '5.53in',  '0.0035in', '0.16in'],   // bot-left  vertical
        ['7.375in', '5.53in',  '0.0035in', '0.16in'],   // bot-right vertical
        ['0.06in',  '0.375in', '0.16in',   '0.0035in'], // top-left  horizontal
        ['7.53in',  '0.375in', '0.16in',   '0.0035in'], // top-right horizontal
        ['0.06in',  '5.375in', '0.16in',   '0.0035in'], // bot-left  horizontal
        ['7.53in',  '5.375in', '0.16in',   '0.0035in'], // bot-right horizontal
      ]) {
        const d = document.createElement('div');
        d.className = 'cropmark';
        d.style.cssText = `position:absolute;background:#000;left:${m[0]};top:${m[1]};width:${m[2]};height:${m[3]};`;
        sheet.appendChild(d);
      }
    }
  });

  await page.addStyleTag({ content: `
    @page { size: ${MARKS_W} ${MARKS_H}; margin: 0; }
    .sheet {
      position: relative;
      width: ${MARKS_W}; height: ${MARKS_H};
      background: #fff;
      overflow: visible;
    }
    .sheet > .card { position: absolute; left: 0.25in; top: 0.25in; }
    @media print {
      body { background: #fff; display: block; padding: 0; }
      .sheet { page-break-after: always; break-after: page; }
      .sheet:last-of-type { page-break-after: auto; break-after: auto; }
      .card { page-break-after: auto; break-after: auto; }
    }
  `});

  await page.pdf({
    path: path.join(OUT, 'f2bf-fall-2026-card-CROPMARKS.pdf'),
    width: MARKS_W, height: MARKS_H, printBackground: true, preferCSSPageSize: true,
  });
  console.log('[ok] CROPMARKS.pdf');
  await ctx.close();
}

/* ── 3. 300 DPI proofs with trim + safe guides ── */
{
  const { ctx, page } = await open({ proof: true });
  for (const [sel, out] of [['#card-front', 'proof-front.png'], ['#card-back', 'proof-back.png']]) {
    await page.locator(sel).screenshot({ path: path.join(OUT, out), type: 'png' });
    console.log('[ok]', out);
  }
  await ctx.close();
}

await browser.close();
