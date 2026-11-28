// Übersichtsbild aller Varianten (mit Muster-Kennzeichen)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const d = path.join(__dirname, 'druckvorlagen');
const items = [
  ['A4_520x110_nur-logo', 'NEU A4 · Nur Logo, breit – 520×110 (PKW + LKW-Front)'],
  ['A5_520x110_nur-logo_yellow', 'NEU A5 · Nur Logo, breit, gelbe Leiste – 520×110'],
  ['B4_340x200_nur-logo', 'NEU B4 · Nur Logo, breit – 340×200 (LKW-Heck)'],
  ['A1_520x110_classic', 'A1 · Classic – 520×110 (PKW + LKW-Front)'],
  ['A2_520x110_international', 'A2 · International – 520×110 (PKW + LKW-Front) ★ Empfehlung'],
  ['A3_520x110_yellow', 'A3 · Yellow – 520×110 (PKW + LKW-Front)'],
  ['B2_340x200_international', 'B2 · International – 340×200 (LKW-Heck / Baumaschinen)'],
  ['B3_340x200_yellow', 'B3 · Yellow – 340×200 (LKW-Heck / Baumaschinen)'],
];
const cell = ([f, t], w) => `<figure><img style="width:${w}px" src="data:image/png;base64,${fs.readFileSync(path.join(d, f + '_vorschau.png')).toString('base64')}"><figcaption>${t}</figcaption></figure>`;
const top = items.slice(0,3), rest = items.slice(3);
const html = `<html><body style="margin:0;padding:40px;background:#e9e8e4;font-family:Inter,sans-serif;width:1520px">
<h1 style="margin:0 0 6px;font-size:30px">SANISA – Kennzeichenhalter</h1>
<p style="margin:0 0 28px;color:#555;font-size:16px">Schwarzer Rahmen, Werbeleiste unten · Texte Englisch (Export) · Muster-Kennzeichen nur zur Ansicht</p>
<style>figure{margin:0 0 26px}figcaption{font-size:16px;font-weight:600;margin-top:8px}img{display:block;filter:drop-shadow(0 4px 10px rgba(0,0,0,.25))}</style>
${[top[0],top[1]].map(i => cell(i, 1000)).join('')}<div style="display:flex;gap:40px">${cell(top[2],700)}</div><h2 style="margin:30px 0 16px">Bisherige Varianten (mit Text)</h2>${rest.slice(0,3).map(i => cell(i, 1000)).join('')}<div style="display:flex;gap:40px">${rest.slice(3).map(i => cell(i, 700)).join('')}</div></body></html>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ deviceScaleFactor: 1 });
  await p.setViewportSize({ width: 1600, height: 800 }); await p.setContent(html);
  await p.screenshot({ path: path.join(__dirname, 'uebersicht_kennzeichenhalter.png'), fullPage: true });
  await b.close();
})();
