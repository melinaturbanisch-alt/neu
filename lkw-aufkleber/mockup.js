// Mockup: neutraler LKW (Seite + Front), Aufkleber + Kennzeichenhalter maßstäblich in mm
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const b64 = f => fs.readFileSync(f).toString('base64');
const D = path.join(__dirname, 'druckvorlagen'), K = path.join(__dirname, '..', 'kennzeichenhalter', 'druckvorlagen');
const st = {
  emblem: b64(path.join(D, '1_emblem_schwarz_150x50.png')),
  logoD: b64(path.join(D, '4_logo-freigestellt_dunkel_200x32.6.png')),
  scheibe: b64(path.join(D, '5_scheibe_100x30.png')),
  halter: b64(path.join(K, 'E1_520x110_trucks_english_vorschau.png')),
};
const img = (k, x, y, w, h) => `<image href="data:image/png;base64,${st[k]}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
const PAINT = '#f2f3f4', SHADE = '#d9dcdf', DARKG = '#2a2d31', TYRE = '#1c1c1c', RIM = '#9aa0a6';

// ---------- Seitenansicht (Fahrtrichtung links), Boden y=3900 ----------
const wheel = cx => `<circle cx="${cx}" cy="3380" r="520" fill="${TYRE}"/><circle cx="${cx}" cy="3380" r="300" fill="${RIM}"/><circle cx="${cx}" cy="3380" r="90" fill="#6d7378"/>`;
const side = `
<rect x="-200" y="3900" width="7600" height="200" fill="#c9c7c1"/>
<!-- Fahrgestell -->
<rect x="500" y="3150" width="5900" height="260" fill="${DARKG}"/>
<rect x="4300" y="2950" width="1900" height="220" fill="#3a3d42"/>
<rect x="5100" y="2860" width="900" height="110" rx="20" fill="#55595e"/>
<!-- Tank -->
<rect x="2750" y="3060" width="1250" height="520" rx="160" fill="#c8ccd0" stroke="#9aa0a6" stroke-width="12"/>
<!-- Kabine -->
<path d="M420 3300 L380 1500 Q380 820 700 760 L2950 700 Q3050 700 3050 800 L3050 3300 Z" fill="${PAINT}" stroke="#b9bdc1" stroke-width="14"/>
<path d="M2950 700 L3050 700 L3050 3300 L2950 3300 Z" fill="${SHADE}"/>
<!-- Dachspoiler -->
<path d="M800 760 Q1600 250 2950 300 L2950 700 Z" fill="${PAINT}" stroke="#b9bdc1" stroke-width="14"/>
<!-- Tür + Fenster -->
<path d="M620 1080 L1880 1080 L1880 3060 L640 3060 Z" fill="none" stroke="#b5b9bd" stroke-width="14"/>
<path d="M700 1160 L1800 1160 L1800 1900 L680 1900 Z" fill="#3c4b5a"/>
<path d="M700 1160 L1100 1160 L680 1650 Z" fill="#5f7385" opacity=".6"/>
<rect x="1580" y="2050" width="180" height="40" rx="18" fill="#9aa0a6"/>
<!-- Spiegel -->
<rect x="250" y="1150" width="90" height="520" rx="30" fill="${DARKG}"/>
<!-- Stufen -->
<rect x="700" y="3100" width="1100" height="70" fill="${DARKG}"/><rect x="700" y="3330" width="1100" height="70" fill="${DARKG}"/>
<!-- Stoßfänger -->
<rect x="330" y="2900" width="300" height="520" rx="40" fill="#cfd3d6" stroke="#9aa0a6" stroke-width="10"/>
${wheel(1250)}${wheel(4700)}${wheel(5850)}
<!-- Aufkleber: Emblem unten an der Tür, Logo an der Kabinenseite hinter der Tür -->
${img('emblem', 1180, 2600, 150, 50)}
${img('logoD', 2150, 1250, 600, 600 * 32.6 / 200)}
`;
// Hinweis: Logo hinten an der Kabine ist größer (600 mm) gezeigt? -> nein, echte Größe:
const sideReal = side.replace(`${img('logoD', 2150, 1250, 600, 600 * 32.6 / 200)}`, `${img('logoD', 2300, 1300, 200, 32.6)}`);

// ---------- Frontansicht, Breite 2500 ----------
const front = `
<rect x="-300" y="3900" width="3100" height="200" fill="#c9c7c1"/>
<rect x="150" y="3300" width="420" height="600" rx="60" fill="${TYRE}"/><rect x="1930" y="3300" width="420" height="600" rx="60" fill="${TYRE}"/>
<path d="M120 3350 L120 900 Q120 650 400 620 L2100 620 Q2380 650 2380 900 L2380 3350 Z" fill="${PAINT}" stroke="#b9bdc1" stroke-width="14"/>
<path d="M330 620 Q1250 180 2170 620 Z" fill="${PAINT}" stroke="#b9bdc1" stroke-width="14"/>
<!-- Scheibe -->
<path d="M260 760 L2240 760 L2200 1720 L300 1720 Z" fill="#3c4b5a"/>
<path d="M260 760 L900 760 L420 1720 L300 1720 Z" fill="#5f7385" opacity=".5"/>
<rect x="1240" y="760" width="20" height="960" fill="#2f3b47" opacity=".0"/>
<!-- Kühlergrill -->
${[0,1,2,3,4,5].map(i => `<rect x="520" y="${1900 + i * 130}" width="1460" height="70" rx="30" fill="#c3c7cb"/>`).join('')}
<!-- Scheinwerfer -->
<rect x="200" y="2750" width="420" height="200" rx="60" fill="#e7edf2" stroke="#9aa0a6" stroke-width="10"/>
<rect x="1880" y="2750" width="420" height="200" rx="60" fill="#e7edf2" stroke="#9aa0a6" stroke-width="10"/>
<!-- Stoßfänger -->
<rect x="100" y="3000" width="2300" height="420" rx="40" fill="#cfd3d6" stroke="#9aa0a6" stroke-width="10"/>
<!-- Spiegel -->
<rect x="-120" y="900" width="110" height="560" rx="30" fill="${DARKG}"/><rect x="2510" y="900" width="110" height="560" rx="30" fill="${DARKG}"/>
<!-- Kennzeichenhalter E1 (536 x 148) -->
${img('halter', 1250 - 268, 3080, 536, 148)}
<!-- Scheibenaufkleber unten rechts (Beifahrerseite) -->
${img('scheibe', 2010, 1660 - 30 - 20, 100, 30)}
`;

const svg = (vb, body, w) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${w}">${body}</svg>`;
const zoom = (vb, body, w, label) => `<figure style="margin:0"><div style="border:3px solid #FED13A;border-radius:8px;overflow:hidden;background:#fff;line-height:0">${svg(vb, body, w)}</div><figcaption>${label}</figcaption></figure>`;

const html = `<html><body style="margin:0;padding:36px;background:#e9e8e4;font-family:Inter,sans-serif;width:1700px">
<style>figcaption{font-size:15px;font-weight:600;margin-top:8px}</style>
<h1 style="margin:0 0 4px;font-size:28px">SANISA – Aufkleber & Kennzeichenhalter am LKW</h1>
<p style="margin:0 0 22px;color:#555">Alles in echter Größe auf einem neutralen Zugmaschinen-Modell (ca. 2,5 m breit, 3,9 m hoch). Gelb umrandet = Nahansicht.</p>
<div style="display:flex;gap:30px;align-items:flex-end">
  <figure style="margin:0">${svg('-300 0 7700 4100', sideReal, 1000)}<figcaption>Seitenansicht</figcaption></figure>
  <figure style="margin:0">${svg('-400 0 3300 4100', front, 560)}<figcaption>Frontansicht</figcaption></figure>
</div>
<div style="display:flex;gap:24px;margin-top:28px;align-items:flex-start">
  ${zoom('1030 2480 450 293', sideReal, 400, '① Emblem 150×50 unten an der Tür')}
  ${zoom('2170 1200 460 299', sideReal, 400, '② Logo 200×33 an der Kabinenseite')}
  ${zoom('1860 1500 340 221', front, 400, '③ Frontscheibe 100×30, Ecke Beifahrerseite')}
  ${zoom('900 2960 700 455', front, 400, '④ Kennzeichenhalter E1')}
</div></body></html>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ deviceScaleFactor: 2 });
  await p.setViewportSize({ width: 1772, height: 900 }); await p.setContent(html);
  await p.screenshot({ path: path.join(__dirname, 'mockup_lkw.png'), fullPage: true });
  await b.close();
})();
