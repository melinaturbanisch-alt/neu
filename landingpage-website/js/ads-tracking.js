/* Melvona Marketing — Google Ads Conversion-Tracking
   Lädt Google erst NACH Einwilligung (Cookie-Banner, Kategorie "marketing").
   Ohne Einwilligung wird nichts an Google gesendet.

   >>> Hier die Werte aus Google Ads eintragen (Ziele → Conversions → Aktion → "Tag einrichten"): */
var MELVONA_ADS = {
  id: 'AW-18454938553',           // Google-Tag-ID, z. B. 'AW-123456789'
  labelAnfrage: 'uNOHCNCoqbcdELmHgOBE',  // Label der Conversion "Anfrage über Formular"
  labelTelefon: 'XXXXXXXXXXXX'    // Label der Conversion "Klick auf Telefonnummer"
};

(function () {
  var cfg = MELVONA_ADS;
  if (!cfg.id || cfg.id.indexOf('X') !== -1) return; // noch nicht eingerichtet → nichts tun

  var SPEICHER_KEY = 'melvona_cookie_einwilligung';
  var geladen = false;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  // Consent Mode v2: Standard = alles abgelehnt
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied'
  });

  function hatEinwilligung() {
    if (typeof window.melvonaHatEinwilligung === 'function') {
      return window.melvonaHatEinwilligung('marketing');
    }
    try {
      var d = JSON.parse(localStorage.getItem(SPEICHER_KEY));
      return !!(d && d.kategorien && d.kategorien.marketing);
    } catch (e) { return false; }
  }

  function istDankeSeite() {
    return location.pathname.toLowerCase().indexOf('danke') !== -1;
  }

  function sendeAnfrageConversion() {
    // nur einmal pro Sitzung zählen (z. B. bei Neuladen der Danke-Seite)
    try {
      if (sessionStorage.getItem('melvona_conv_anfrage')) return;
      sessionStorage.setItem('melvona_conv_anfrage', '1');
    } catch (e) {}
    gtag('event', 'conversion', { send_to: cfg.id + '/' + cfg.labelAnfrage });
  }

  function ladeGoogle() {
    if (geladen) return;
    geladen = true;
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.id);
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', cfg.id);
    if (istDankeSeite()) sendeAnfrageConversion();
  }

  // Klicks auf Telefonnummern als Conversion zählen
  document.addEventListener('click', function (ev) {
    var link = ev.target.closest && ev.target.closest('a[href^="tel:"]');
    if (!link || !geladen) return;
    if (!cfg.labelTelefon || cfg.labelTelefon.indexOf('XXX') !== -1) return; // Label noch nicht eingetragen
    gtag('event', 'conversion', { send_to: cfg.id + '/' + cfg.labelTelefon });
  });

  // Einwilligung später erteilt (Klick im Banner)?
  document.addEventListener('melvonaEinwilligungAktualisiert', function () {
    if (hatEinwilligung()) ladeGoogle();
  });

  if (hatEinwilligung()) ladeGoogle();
})();
