// SANISA – Sprachumschaltung
// Deutsch steht direkt im HTML. Weitere Sprachen liegen als Wörterbuch in lang/<code>.json
// (deutscher Text → Übersetzung). Neue Sprache: JSON-Datei anlegen und unten in LANGS eintragen.
(function () {
  const LANGS = {
    de: { name: "Deutsch", flag: '<svg viewBox="0 0 5 3"><rect width="5" height="1" fill="#000"/><rect y="1" width="5" height="1" fill="#D00"/><rect y="2" width="5" height="1" fill="#FFCE00"/></svg>' },
    en: { name: "English", flag: '<svg viewBox="0 0 60 30"><clipPath id="uk-t"><path d="M30,15h30v15zv15h-30zh-30v-15zv-15h30z"/></clipPath><path d="M0,0v30h60v-30z" fill="#012169"/><path d="M0,0 60,30M60,0 0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 60,30M60,0 0,30" clip-path="url(#uk-t)" stroke="#C8102E" stroke-width="4"/><path d="M30,0v30M0,15h60" stroke="#fff" stroke-width="10"/><path d="M30,0v30M0,15h60" stroke="#C8102E" stroke-width="6"/></svg>' },
  };
  const RTL = ["ar"];
  const STORE = "sanisa-lang";
  const ATTRS = ["placeholder", "aria-label", "alt", "title"];
  const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "svg", "SVG"]);

  let dict = null;
  let cur = "de";
  const origText = new WeakMap();
  const origAttr = new WeakMap();

  const tr = (s) => {
    if (!dict || !s) return s;
    const t = s.trim().replace(/\s+/g, " ");
    const v = dict[t];
    return v == null ? s : s.replace(s.trim(), v);
  };

  function applyNode(root) {
    if (!root) return;
    if (root.nodeType === 3) {
      if (!origText.has(root)) origText.set(root, root.nodeValue);
      const o = origText.get(root);
      const n = cur === "de" ? o : tr(o);
      if (root.nodeValue !== n) root.nodeValue = n;
      return;
    }
    if (root.nodeType !== 1 || SKIP.has(root.tagName) || root.closest("[data-no-i18n]")) return;
    let a = origAttr.get(root);
    for (const name of ATTRS) {
      if (!root.hasAttribute(name)) continue;
      if (!a) { a = {}; origAttr.set(root, a); }
      if (!(name in a)) a[name] = root.getAttribute(name);
      root.setAttribute(name, cur === "de" ? a[name] : tr(a[name]));
    }
    for (const c of root.childNodes) applyNode(c);
  }

  // Neu eingefügte Inhalte (Fahrzeuge, Team, Formular-Meldungen) automatisch übersetzen
  new MutationObserver((list) => {
    if (cur === "de") return;
    for (const m of list) m.addedNodes.forEach(applyNode);
  }).observe(document.documentElement, { childList: true, subtree: true });

  const titleOrig = document.title;

  async function setLang(code) {
    if (!LANGS[code]) code = "de";
    if (code === "de") dict = null;
    else {
      try { dict = await (await fetch(`lang/${code}.json`, { cache: "no-cache" })).json(); }
      catch { dict = null; code = "de"; }
    }
    cur = code;
    document.documentElement.lang = code;
    document.documentElement.dir = RTL.includes(code) ? "rtl" : "ltr";
    document.title = code === "de" ? titleOrig : tr(titleOrig);
    applyNode(document.body);
    try { localStorage.setItem(STORE, code); } catch {}
    document.querySelectorAll(".lang-code").forEach((el) => (el.innerHTML = LANGS[code].flag));
    document.querySelectorAll(".lang-btn").forEach((el) => el.setAttribute("title", LANGS[code].name));
    document.querySelectorAll(".lang-menu button").forEach((b) => b.setAttribute("aria-current", b.dataset.lang === code));
  }

  function initialLang() {
    const q = new URLSearchParams(location.search).get("lang");
    if (q && LANGS[q]) return q;
    try { const s = localStorage.getItem(STORE); if (s && LANGS[s]) return s; } catch {}
    const nav = (navigator.languages || [navigator.language || "de"]).map((l) => l.slice(0, 2).toLowerCase());
    if (nav[0] === "de") return "de";
    return nav.find((l) => LANGS[l]) || "en"; // ausländische Besucher: Englisch statt Deutsch
  }

  // Umschalter in der Kopfzeile
  function buildSwitch() {
    document.querySelectorAll(".lang").forEach((box) => {
      const btn = box.querySelector(".lang-btn");
      const menu = box.querySelector(".lang-menu");
      menu.innerHTML = Object.entries(LANGS).map(([c, l]) =>
        `<li><button type="button" data-lang="${c}" data-no-i18n><span class="lang-flag" aria-hidden="true">${l.flag}</span> ${l.name}</button></li>`).join("");
      btn.addEventListener("click", (e) => { e.stopPropagation(); const open = menu.hidden; menu.hidden = !open; btn.setAttribute("aria-expanded", open); });
      menu.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-lang]");
        if (!b) return;
        menu.hidden = true; btn.setAttribute("aria-expanded", "false");
        setLang(b.dataset.lang);
      });
      document.addEventListener("click", () => { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); });
    });
  }

  window.SanisaI18n = { setLang, t: (s) => (cur === "de" ? s : tr(s)), get lang() { return cur; } };
  buildSwitch();
  const start = initialLang();
  if (start !== "de") setLang(start);
  else document.querySelectorAll(".lang-code").forEach((el) => (el.innerHTML = LANGS.de.flag));
})();
