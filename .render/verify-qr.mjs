/**
 * Independently decode the QR out of the rendered proof.
 * Generation (qrcode) and decoding (jsQR) are separate libraries, so a pass
 * here means the printed code really resolves — not that one library agrees
 * with itself. Also tests a downscaled copy, standing in for a phone camera
 * that grabs the code at lower effective resolution.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CODES = [
  { sel: '.qr__code',      side: 'front', expect: 'https://f2bf.icscanada.edu/courses' },
  { sel: '.connect__code', side: 'back',  expect: 'https://f2bf.icscanada.edu/churches/' },
];

function decode(png) {
  const r = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  return r ? r.data : null;
}

const browser = await chromium.launch();
let pass = 0, fail = 0;

for (const code of CODES) {
  console.log(`\n${code.side}: ${code.sel}  ->  expecting ${code.expect}`);
  for (const dpi of [300, 150, 96, 72]) {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: dpi / 96 });
    const page = await ctx.newPage();
    await page.goto('file://' + path.join(root, 'print/f2bf-fall-2026-card.html'), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const n = await page.locator(code.sel).count();
    if (n !== 1) { fail++; console.log(`  FAIL  @${dpi} DPI  selector matched ${n} elements`); await ctx.close(); continue; }
    const png = PNG.sync.read(await page.locator(code.sel).screenshot({ type: 'png' }));
    const got = decode(png);
    const ok = got === code.expect;
    ok ? pass++ : fail++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  @${dpi} DPI  ${png.width}x${png.height}px  ->  ${got ?? '(no code found)'}`);
    await ctx.close();
  }
}

await browser.close();
console.log(fail === 0 ? `\nAll ${pass} decodes matched their target URL.` : `\n${fail} decode(s) FAILED.`);
process.exit(fail === 0 ? 0 : 1);
