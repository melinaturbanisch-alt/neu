// Melvona Marketing — shared interactions

/* Cookie-Consent — muss vor jedem Marketing/Ads-Tag (z. B. Google Ads Conversion)
   geladen sein. Andere Skripte pruefen vor dem Laden window.melvonaHatEinwilligung('marketing')
   oder hoeren auf das Event 'melvonaEinwilligungAktualisiert'. */
(function () {
  const SPEICHER_KEY = 'melvona_cookie_einwilligung';
  const JETZT_VERSION = 1;

  function geladeneEinwilligung() {
    try {
      const roh = localStorage.getItem(SPEICHER_KEY);
      if (!roh) return null;
      const daten = JSON.parse(roh);
      if (daten.version !== JETZT_VERSION) return null;
      return daten;
    } catch (fehler) {
      return null;
    }
  }

  function speichereEinwilligung(kategorien) {
    const daten = { version: JETZT_VERSION, zeitpunkt: new Date().toISOString(), kategorien };
    try { localStorage.setItem(SPEICHER_KEY, JSON.stringify(daten)); } catch (fehler) {}
    window.melvonaEinwilligung = daten;
    document.dispatchEvent(new CustomEvent('melvonaEinwilligungAktualisiert', { detail: daten }));
  }

  window.melvonaHatEinwilligung = function (kategorie) {
    const daten = window.melvonaEinwilligung || geladeneEinwilligung();
    return !!(daten && daten.kategorien && daten.kategorien[kategorie]);
  };

  function baueBanner() {
    const vorherigerOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const overlay = document.createElement('div');
    overlay.className = 'cookie-overlay';
    overlay.innerHTML = `
      <div class="cookie-banner" role="dialog" aria-modal="true" aria-label="Cookie-Einstellungen">
        <p class="cookie-banner-text">
          Wir verwenden technisch notwendige Speicher, damit diese Website funktioniert. Mit Ihrer
          Einwilligung nutzen wir zusätzlich Google Ads Conversion-Tracking, um zu messen, ob unsere
          Anzeigen zu Anfragen führen. Die Einwilligung können Sie jederzeit über „Cookie-Einstellungen“
          widerrufen. Mehr dazu in unserer <a href="datenschutz.html">Datenschutzerklärung</a>.
        </p>
        <div class="cookie-banner-actions">
          <button type="button" class="btn btn-ghost cookie-btn-ablehnen">Nur notwendige</button>
          <button type="button" class="btn btn-primary cookie-btn-akzeptieren">Alle akzeptieren</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('sichtbar'));

    overlay.querySelector('.cookie-btn-akzeptieren').addEventListener('click', () => {
      speichereEinwilligung({ notwendig: true, analyse: true, marketing: true });
      entferneBanner();
    });
    overlay.querySelector('.cookie-btn-ablehnen').addEventListener('click', () => {
      speichereEinwilligung({ notwendig: true, analyse: false, marketing: false });
      entferneBanner();
    });

    function entferneBanner() {
      overlay.classList.remove('sichtbar');
      document.body.style.overflow = vorherigerOverflow;
      setTimeout(() => overlay.remove(), 300);
    }
  }

  function fuegeEinstellungenLinkEin() {
    /* normale Seiten: .footer-bottom — Anzeigen-Zielseiten: .lp-footer .wrap */
    const zeile = document.querySelector('.footer-bottom') || document.querySelector('.lp-footer .wrap');
    if (!zeile || zeile.querySelector('.cookie-einstellungen-link')) return;
    const link = document.createElement('a');
    link.href = '#';
    link.className = 'cookie-einstellungen-link';
    link.textContent = 'Cookie-Einstellungen';
    link.addEventListener('click', (ev) => {
      ev.preventDefault();
      if (!document.querySelector('.cookie-banner')) baueBanner();
    });
    const bottomSpan = zeile.querySelector(':scope > span:last-child');
    if (bottomSpan) {
      bottomSpan.append(' · ');
      bottomSpan.appendChild(link);
    }
  }

  function istRechtsseite() {
    /* Datenschutzerklaerung und Impressum muessen frei lesbar bleiben,
       auch ohne vorherige Cookie-Entscheidung — der erzwingende Banner
       (inkl. Scroll-Sperre) darf hier nicht laufen. */
    const pfad = location.pathname.toLowerCase();
    return pfad.includes('datenschutz') || pfad.includes('impressum');
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.melvonaEinwilligung = geladeneEinwilligung();
    fuegeEinstellungenLinkEin();
    if (!window.melvonaEinwilligung && !istRechtsseite()) baueBanner();
  });
})();

document.addEventListener('DOMContentLoaded', () => {

  /* Sticky header background on scroll (nicht auf den Anzeigen-Zielseiten vorhanden) */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 40) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Mobile nav toggle */
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* Reveal-on-scroll */
  const revealEls = document.querySelectorAll('.reveal, .facet-divider');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  /* Portfolio filter (only present on portfolio.html) */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const caseCards = document.querySelectorAll('[data-category]');
  if (filterBtns.length) {
    /* Gefilterte Karten wurden nie beobachtet, solange sie ausgeblendet waren —
       deshalb hier direkt sichtbar schalten statt aufs Scrollen zu warten. */
    const showNow = (el) => {
      el.classList.add('in-view');
      el.querySelectorAll('.reveal').forEach(child => child.classList.add('in-view'));
    };
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        const cat = btn.dataset.filter;
        caseCards.forEach(card => {
          const show = cat === 'all' || card.dataset.category === cat;
          card.hidden = !show;
          /* auch den umgebenden Abschnitt ausblenden, sonst bleibt dessen
             Innenabstand als leere Fläche stehen */
          const section = card.closest('section');
          if (section) section.hidden = !show;
          if (show) showNow(card);
        });
      });
    });
  }

  /* Anfrageformular — echter Versand über /api/anfrage */
  if (typeof window.bindeAnfrageFormular === 'function') {
    window.bindeAnfrageFormular(
      document.querySelector('.form'),
      document.querySelector('.form-status')
    );
  }

});
