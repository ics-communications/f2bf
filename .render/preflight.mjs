/**
 * Print preflight for the 7x5 card.
 *  - reports every content box in inches
 *  - flags anything crossing the 0.25in safe area (inside trim)
 *  - flags overlapping content boxes
 * Run after any edit to print/f2bf-fall-2026-card.html.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BLEED = 0.125, TRIM_W = 7, TRIM_H = 5;
const SAFE = BLEED + 0.25;                       // 0.375in from the bleed edge
const SAFE_R = BLEED + TRIM_W - 0.25;            // 6.875in
const SAFE_B = BLEED + TRIM_H - 0.25;            // 4.875in

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1200, height: 900 } })).newPage();
await page.goto('file://' + path.join(root, 'print/f2bf-fall-2026-card.html'), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

const SELECTORS = {
  front: ['.mast', '.lead__title', '.lead__foot', '.qr', '.roster', '.course', '.band', '.band__call', '.band__mark'],
  back:  ['.bk__mast', '.bk__head', '.connect', '.band--back', '.band__call', '.band__note'],
};

let problems = 0;
for (const [side, sels] of Object.entries(SELECTORS)) {
  const cardSel = side === 'front' ? '#card-front' : '#card-back';
  console.log(`\n──── ${side.toUpperCase()} ────`);
  const boxes = await page.evaluate(({ cardSel, sels }) => {
    const card = document.querySelector(cardSel).getBoundingClientRect();
    const PPI = 96;
    const out = [];
    for (const sel of sels) {
      if (document.querySelectorAll(`${cardSel} ${sel}`).length === 0) {
        out.push({ sel, missing: true });
        continue;
      }
      document.querySelectorAll(`${cardSel} ${sel}`).forEach((el, i) => {
        const r = el.getBoundingClientRect();
        out.push({
          sel: sel + (document.querySelectorAll(`${cardSel} ${sel}`).length > 1 ? `[${i}]` : ''),
          l: (r.left - card.left) / PPI, t: (r.top - card.top) / PPI,
          r: (r.right - card.left) / PPI, b: (r.bottom - card.top) / PPI,
        });
      });
    }
    return out;
  }, { cardSel, sels });

  for (const x of boxes) {
    if (x.missing) {                       // a check that matches nothing is not a passing check
      problems++;
      console.log(`  MISSING ${x.sel} — selector matched no element; update preflight or the markup`);
      continue;
    }
    // Bands and the photo bleed by design; their CONTENT must still sit inside safe.
    const bleedy = x.sel === '.band' || x.sel === '.band--back' || x.sel.includes('photo');
    const viol = [];
    if (!bleedy) {
      if (x.l < SAFE - 0.001)  viol.push(`left ${x.l.toFixed(3)} < ${SAFE}`);
      if (x.t < SAFE - 0.001)  viol.push(`top ${x.t.toFixed(3)} < ${SAFE}`);
      if (x.r > SAFE_R + 0.001) viol.push(`right ${x.r.toFixed(3)} > ${SAFE_R}`);
      if (x.b > SAFE_B + 0.001) viol.push(`bottom ${x.b.toFixed(3)} > ${SAFE_B}`);
    }
    if (viol.length) problems++;
    console.log(
      `  ${viol.length ? 'UNSAFE' : '  ok  '} ${x.sel.padEnd(16)} ` +
      `x ${x.l.toFixed(3)}–${x.r.toFixed(3)}  y ${x.t.toFixed(3)}–${x.b.toFixed(3)}` +
      (viol.length ? `   << ${viol.join('; ')}` : '')
    );
  }

  // overlap check between sibling blocks (ignore .course, which nests in .roster)
  const blocks = boxes.filter(b => !b.missing && !b.sel.startsWith('.course') && !b.sel.includes('band') && !b.sel.includes('photo'));
  for (let i = 0; i < blocks.length; i++)
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i], b = blocks[j];
      const ox = Math.min(a.r, b.r) - Math.max(a.l, b.l);
      const oy = Math.min(a.b, b.b) - Math.max(a.t, b.t);
      if (ox > 0.002 && oy > 0.002) {
        problems++;
        console.log(`  OVERLAP ${a.sel} × ${b.sel}  (${ox.toFixed(3)}in × ${oy.toFixed(3)}in)`);
      }
    }
}

await browser.close();
console.log(problems === 0 ? '\nPreflight clean.' : `\n${problems} problem(s).`);
process.exit(problems === 0 ? 0 : 1);
