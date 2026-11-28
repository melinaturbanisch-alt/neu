// Rendert alle SVGs in druckvorlagen/ zu PNG (Vorschau) und PDF (Druck, 1:1 in mm).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'druckvorlagen');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ deviceScaleFactor: 2 });
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.svg'))) {
    const svg = fs.readFileSync(path.join(dir, f), 'utf8');
    const [, w, h] = svg.match(/width="([\d.]+)mm" height="([\d.]+)mm"/);
    const pxW = Math.round(w * 2.4), pxH = Math.round(h * 2.4); // 2,4 px/mm
    const html = `<html><body style="margin:0;background:transparent">${svg.replace(/width="[\d.]+mm" height="[\d.]+mm"/, `width="${pxW}" height="${pxH}"`)}</body></html>`;
    await p.setViewportSize({ width: pxW, height: pxH });
    await p.setContent(html);
    const base = path.join(dir, f.replace('.svg', ''));
    await p.screenshot({ path: base + '.png', omitBackground: true, clip: { x: 0, y: 0, width: pxW, height: pxH } });
    if (!f.includes('vorschau')) {
      await p.setContent(`<html><body style="margin:0">${svg}</body></html>`);
      await p.pdf({ path: base + '.pdf', width: w + 'mm', height: h + 'mm', printBackground: true, pageRanges: '1' });
    }
    console.log(f);
  }
  await b.close();
})();
