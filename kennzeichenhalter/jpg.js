// Designs als JPG für Bestellportale: Werbeleiste allein + ganzer Rahmen (300 dpi)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const PX = 300 / 25.4;
const jobs = [ // [svg, name, W, H, leiste{x,y,w,h}]
  ['C1_520x110_group_nur-logo', 'C1', 536, 148, [8, 118, 520, 30]],
  ['E1_520x110_trucks_english', 'E1_trucks', 536, 148, [8, 118, 520, 30]],
  ['E2_520x110_trucks_english_yellow', 'E2_trucks_gelb', 536, 148, [8, 118, 520, 30]],
  ['E3_340x200_trucks_english', 'E3_trucks_340x200', 356, 248, [8, 208, 340, 40]],
];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  for (const [f, n, W, H, [lx, ly, lw, lh]] of jobs) {
    const svg = fs.readFileSync(path.join(__dirname, 'druckvorlagen', f + '.svg'), 'utf8');
    const w = Math.round(W * PX), h = Math.round(H * PX);
    await p.setViewportSize({ width: w, height: h });
    await p.setContent(`<html><body style="margin:0;background:#fff">${svg.replace(/width="[\d.]+mm" height="[\d.]+mm"/, `width="${w}" height="${h}"`)}</body></html>`);
    const out = s => path.join(__dirname, 'jpg', `SANISA_kennzeichenhalter_${n}_${s}.jpg`);
    await p.screenshot({ path: out(`rahmen_${W}x${H}mm`), type: 'jpeg', quality: 95 });
    await p.screenshot({ path: out(`werbeleiste_${lw}x${lh}mm`), type: 'jpeg', quality: 95, clip: { x: lx * PX, y: ly * PX, width: lw * PX, height: lh * PX } });
  }
  await b.close();
})();
