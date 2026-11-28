// PNG (transparent), PDF (1:1), JPG (300 dpi) + Übersicht auf verschiedenen Lackfarben
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'druckvorlagen');
const PX = 300 / 25.4;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg')).sort();
  const pngs = {};
  for (const f of files) {
    const svg = fs.readFileSync(path.join(dir, f), 'utf8');
    const [, w, h] = svg.match(/width="([\d.]+)mm" height="([\d.]+)mm"/).map(Number);
    const pw = Math.round(w * PX), ph = Math.round(h * PX);
    await p.setViewportSize({ width: pw, height: ph });
    const sized = svg.replace(/width="[\d.]+mm" height="[\d.]+mm"/, `width="${pw}" height="${ph}"`);
    const base = path.join(dir, f.replace('.svg', ''));
    await p.setContent(`<html><body style="margin:0;background:transparent">${sized}</body></html>`);
    await p.screenshot({ path: base + '.png', omitBackground: true });
    const bg = f.includes('dunkel') ? '#fff' : f.includes('hell') ? '#141414' : '#fff';
    await p.setContent(`<html><body style="margin:0;background:${bg}">${sized}</body></html>`);
    await p.screenshot({ path: path.join(__dirname, 'jpg', 'SANISA_lkw-aufkleber_' + f.replace('.svg', '.jpg')), type: 'jpeg', quality: 95 });
    await p.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    await p.pdf({ path: base + '.pdf', width: w + 'mm', height: h + 'mm', printBackground: true, pageRanges: '1' });
    pngs[f.replace('.svg', '')] = { w, b64: fs.readFileSync(base + '.png').toString('base64') };
  }
  // Übersicht: Aufkleber maßstäblich (3 px/mm) auf Lackfarben
  const S = 3.2, paints = [['Weiß', '#eceff1'], ['Rot', '#b3201f'], ['Blau', '#1d3f7a'], ['Schwarz', '#1b1b1b']];
  const show = { 'Weiß': ['1_emblem_schwarz_150x50', '4_logo-freigestellt_dunkel_200x32.6', '5_scheibe_100x30'],
                 'Rot': ['1_emblem_schwarz_150x50', '3_logo-freigestellt_hell_200x32.6'],
                 'Blau': ['1_emblem_schwarz_150x50', '3_logo-freigestellt_hell_200x32.6'],
                 'Schwarz': ['2_emblem_weiss_150x50', '3_logo-freigestellt_hell_200x32.6'] };
  const im = k => `<img style="width:${pngs[k].w * S}px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.35))" src="data:image/png;base64,${pngs[k].b64}">`;
  const html = `<html><body style="margin:0;padding:36px;background:#e9e8e4;font-family:Inter,sans-serif;width:1500px">
  <h1 style="margin:0 0 4px;font-size:28px">SANISA – kleine LKW-Aufkleber</h1>
  <p style="margin:0 0 24px;color:#555">Maßstabsgetreu zueinander · Lackfarben nur zur Ansicht</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
  ${paints.map(([n, c]) => `<div style="background:linear-gradient(160deg,${c},${c} 60%,rgba(0,0,0,.25));background-color:${c};border-radius:10px;padding:34px;display:flex;flex-wrap:wrap;gap:34px;align-items:center;min-height:240px;position:relative">
     <span style="position:absolute;top:10px;left:14px;font-size:13px;color:${n === 'Weiß' ? '#333' : '#ddd'}">LKW ${n}</span>${show[n].map(im).join('')}</div>`).join('')}
  </div>
  <div style="margin-top:26px;display:grid;grid-template-columns:repeat(5,auto);gap:10px 24px;font-size:15px;justify-content:start">
   <b>1</b><span>Emblem schwarz</span><span>150 × 50 mm</span><span>passt auf jede Lackfarbe</span><span>★ Empfehlung</span>
   <b>2</b><span>Emblem weiß</span><span>150 × 50 mm</span><span>für dunkle LKW</span><span></span>
   <b>3</b><span>Logo freigestellt, hell</span><span>200 × 33 mm</span><span>ohne Hintergrund, für dunkle Lacke</span><span></span>
   <b>4</b><span>Logo freigestellt, dunkel</span><span>200 × 33 mm</span><span>ohne Hintergrund, für helle Lacke</span><span></span>
   <b>5</b><span>Frontscheibe</span><span>100 × 30 mm</span><span>Ecke der Scheibe, innen oder außen</span><span></span>
  </div></body></html>`;
  await p.setViewportSize({ width: 1572, height: 800 }); await p.setContent(html);
  await p.screenshot({ path: path.join(__dirname, 'uebersicht_lkw-aufkleber.png'), fullPage: true });
  await b.close();
})();
