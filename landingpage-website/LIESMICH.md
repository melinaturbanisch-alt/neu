# Landingpage „Website erstellen lassen“ (/website) + Google-Ads-Tracking

## Dateien → in den Website-Projektordner (Vercel: melvona-marketing)
| Datei hier | Ziel im Projekt | Was |
|---|---|---|
| `website.html` | `website.html` (neu) | Landingpage, Ads-Ziel-URL `https://www.melvona.de/website` |
| `css/lp-website.css` | `css/lp-website.css` (neu) | Zusatz-Styles |
| `js/ads-tracking.js` | `js/ads-tracking.js` (neu) | Google-Ads-Conversion-Tracking, lädt nur mit Einwilligung |
| `js/script.js` | `js/script.js` (ersetzen) | Banner-Text nennt jetzt Google Ads; läuft auch auf Landingpages ohne Navi |
| `danke.html` | `danke.html` (ersetzen) | lädt Banner + Tracking → zählt die Anfrage-Conversion |
| `datenschutz.html` | `datenschutz.html` (ersetzen) | neue Abschnitte 5 (Banner) + 6 (Google Ads), Rest unverändert |

## werbung.html (bestehende Landingpage) — 1 Änderung
Ganz unten diesen Block

```html
<script src="js/anfrage.js"></script>
<script>
  window.bindeAnfrageFormular(
    document.querySelector('.form'),
    document.querySelector('.form-status')
  );
</script>
```
ersetzen durch
```html
<script src="js/anfrage.js"></script>
<script src="js/script.js"></script>
<script src="js/ads-tracking.js"></script>
```

## vercel.json — noindex für die neue Seite (wie bei /werbung)
Bei `headers` ergänzen:
```json
{ "source": "/website", "headers": [{ "key": "X-Robots-Tag", "value": "noindex" }] }
```

## Google Ads: Werte in `js/ads-tracking.js` eintragen
Google Ads → Ziele → Conversions → **+ Neue Conversion-Aktion** → **Website** → `melvona.de` →
**Conversion-Aktion manuell hinzufügen**, zweimal:

1. **Anfrage über Formular** — Kategorie „Lead-Formular senden“, Wert: keinen, Zählung: **Eine**
2. **Klick auf Telefonnummer** — Kategorie „Kontakt“, Wert: keinen, Zählung: **Eine**

Danach bei jeder Aktion → „Tag einrichten“ → **„Selbst einrichten“** → im Ereignis-Snippet steht
`'send_to': 'AW-123456789/AbCdEfGhIjK'` → vorne = `id`, hinten = Label.
Die drei Werte oben in `js/ads-tracking.js` eintragen. Solange dort `XXX` steht, macht das Skript nichts.

## Bilder in `images/`
- `website-melvona-desktop.jpg` – melvona.de am Laptop (Querformat, ca. 1600×1000)
- `website-melvona-handy.jpg` – melvona.de auf dem Handy (Hochformat 9:16, ca. 900×1600)

## Datenschutzerklärung
Fertig in `datenschutz.html` (Abschnitte 5 + 6 neu, Nummern danach verschoben). Entwurf, keine Rechtsberatung — kurz gegenlesen lassen.

Kampagnen-Vorlage: siehe `google-ads-kampagne.md`.
