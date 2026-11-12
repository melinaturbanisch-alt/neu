# Landingpage „Website erstellen lassen“ (/website)

Für die Google-Ads-Kampagne „Mit professioneller Website ins neue Jahr“.

## Einbau ins Website-Projekt (Vercel: melvona-marketing)
1. `website.html` in den Projektordner neben `werbung.html` legen.
2. `css/lp-website.css` nach `css/` kopieren (nutzt `style.css` + `lp.css`, die schon da sind).
3. In `vercel.json` bei `headers` ergänzen (wie bei /werbung):
   `{ "source": "/website", "headers": [{ "key": "X-Robots-Tag", "value": "noindex" }] }`
4. Bilder in `images/` ablegen:
   - `website-melvona-desktop.jpg` – Foto/Screenshot von melvona.de am Laptop (Querformat, ca. 1600×1000)
   - `website-melvona-handy.jpg` – melvona.de auf dem Handy (Hochformat 9:16, ca. 900×1600)
   - `portrait.jpg`, `cards-wohnmobil-closeup.jpg`, `logo-icon.png` sind schon vorhanden.
5. Deployen. Ads-Ziel-URL: `https://www.melvona.de/website`

Formular schickt mit `quelle=website-landingpage` an `/api/anfrage` und leitet auf `danke.html` weiter
(dort später das Google-Ads-Conversion-Tag, erst nach dem Consent-Banner).
