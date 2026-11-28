// C1 als JPG für Bestellportale: Werbeleiste allein + ganzer Rahmen (300 dpi)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const svg = fs.readFileSync(path.join(__dirname, 'druckvorlagen/C1_520x110_group_nur-logo.svg'), 'utf8');
const PX = 300 / 25.4; // px pro mm
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const W = 536, H = 148;
  await p.setViewportSize({ width: Math.round(W * PX), height: Math.round(H * PX) });
  await p.setContent(`<html><body style="margin:0;background:#fff">${svg.replace(/width="[\d.]+mm" height="[\d.]+mm"/, `width="${Math.round(W*PX)}" height="${Math.round(H*PX)}"`)}</body></html>`);
  await p.screenshot({ path: path.join(__dirname, 'jpg/SANISA_kennzeichenhalter_C1_rahmen_536x148mm.jpg'), type: 'jpeg', quality: 95 });
  // nur Werbeleiste: 520 x 30 mm (unter dem Kennzeichen)
  await p.screenshot({ path: path.join(__dirname, 'jpg/SANISA_kennzeichenhalter_C1_werbeleiste_520x30mm.jpg'), type: 'jpeg', quality: 95,
    clip: { x: 8 * PX, y: 118 * PX, width: 520 * PX, height: 30 * PX } });
  await b.close();
})();
