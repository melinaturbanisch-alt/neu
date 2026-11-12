# Landingpage „Website erstellen lassen“ (/website) + Google-Ads-Tracking

## Dateien → in den Website-Projektordner (Vercel: melvona-marketing)
| Datei hier | Ziel im Projekt | Was |
|---|---|---|
| `website.html` | `website.html` (neu) | Landingpage, Ads-Ziel-URL `https://www.melvona.de/website` |
| `css/lp-website.css` | `css/lp-website.css` (neu) | Zusatz-Styles |
| `js/ads-tracking.js` | `js/ads-tracking.js` (neu) | Google-Ads-Conversion-Tracking, lädt nur mit Einwilligung |
| `js/script.js` | `js/script.js` (ersetzen) | Banner-Text nennt jetzt Google Ads; läuft auch auf Landingpages ohne Navi |
| `danke.html` | `danke.html` (ersetzen) | lädt Banner + Tracking → zählt die Anfrage-Conversion |

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

## Datenschutzerklärung — Abschnitt 5 ersetzen (ENTWURF, bitte prüfen lassen)
Abschnitt „5. Cookies und Analyse-Tools“ sagt aktuell „keine Marketing-Cookies“ — das stimmt mit Google Ads nicht mehr.
Vorschlag (vor Veröffentlichung z. B. mit einem Datenschutz-Generator oder Anwalt abgleichen):

> **5. Cookies, Einwilligung und Google Ads Conversion-Tracking**
> Beim ersten Besuch fragen wir über ein Banner Ihre Einwilligung ab. Ihre Auswahl speichern wir im lokalen Speicher Ihres Browsers (technisch notwendig, Art. 6 Abs. 1 lit. f DSGVO). Sie können sie jederzeit über den Link „Cookie-Einstellungen“ im Seitenfuß ändern oder widerrufen.
>
> Nur wenn Sie einwilligen, nutzen wir Google Ads Conversion-Tracking der Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland. Dabei werden Cookies gesetzt, mit denen Google erkennt, ob Sie über eine unserer Anzeigen auf unsere Website gekommen sind und danach eine Anfrage gesendet oder auf unsere Telefonnummer getippt haben. Wir erhalten nur zusammengefasste Statistiken, keine Daten, mit denen wir Sie persönlich identifizieren können. Dabei können Daten an Google LLC in den USA übermittelt werden; Google ist nach dem EU-US Data Privacy Framework zertifiziert. Rechtsgrundlage ist Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG). Mehr: https://policies.google.com/privacy
