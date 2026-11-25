// SANISA – Website-Inhalte aus dem Mitarbeiter-Bereich
// Vorschau-Version: Änderungen liegen im Browser (Texte: localStorage, Bilder/Video: IndexedDB)
// und werden nur mit ?vorschau=1 angezeigt. Später liefert der Server diese Inhalte für alle Besucher.
window.SanisaSite = (function () {
  const KEY = "sanisa-demo-site";
  // Was im Mitarbeiter-Bereich änderbar ist: Feld -> Stelle auf der Startseite
  const FIELDS = {
    kicker:   { label: "Zeile über der Überschrift", sel: ".stage-text .kicker" },
    h1a:      { label: "Überschrift, Zeile 1", sel: ".stage-text h1 span:nth-child(1)" },
    h1b:      { label: "Überschrift, Zeile 2", sel: ".stage-text h1 span:nth-child(2)" },
    facts:    { label: "Leistungen unter der Überschrift", sel: ".stage-text .facts .strong" },
    zeiten:   { label: "Öffnungszeiten (Box „Sie erreichen uns“)", sel: ".hb-time" },
    fzIntro:  { label: "Text unter „Neueste Fahrzeuge“", sel: "#fahrzeuge .intro", html: true },
  };
  const MEDIA = {
    heroVideo: { label: "Startvideo", accept: "video/mp4,video/webm,video/quicktime", sel: ".stage-video" },
    heroPoster:{ label: "Startbild (wird gezeigt, bis das Video lädt)", accept: "image/*", sel: ".stage-video", attr: "poster" },
    aboutImg:  { label: "Über uns: Bild", accept: "image/*", sel: "#ueber-uns .about-media img" },
  };

  const texts = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } },
    set(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); return true; } catch { return false; } },
  };

  function db() {
    return new Promise((res, rej) => {
      const r = indexedDB.open("sanisa-demo", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("media");
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  const media = {
    async get(k) { const d = await db(); return new Promise((res) => { const q = d.transaction("media").objectStore("media").get(k); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); }); },
    async set(k, blob) { const d = await db(); return new Promise((res, rej) => { const t = d.transaction("media", "readwrite"); t.objectStore("media").put(blob, k); t.oncomplete = () => res(true); t.onerror = () => rej(t.error); }); },
    async del(k) { const d = await db(); return new Promise((res) => { const t = d.transaction("media", "readwrite"); t.objectStore("media").delete(k); t.oncomplete = () => res(true); }); },
    async clear() { const d = await db(); return new Promise((res) => { const t = d.transaction("media", "readwrite"); t.objectStore("media").clear(); t.oncomplete = () => res(true); }); },
  };

  // Auf der Startseite anwenden (nur in der Vorschau)
  async function apply() {
    const t = texts.get();
    for (const [k, f] of Object.entries(FIELDS)) {
      if (t[k] == null || t[k] === "") continue;
      const el = document.querySelector(f.sel);
      if (el) { if (f.html) el.innerHTML = t[k].replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c])).replace(/\n/g, "<br>"); else el.textContent = t[k]; }
    }
    try {
      const v = await media.get("heroVideo"), p = await media.get("heroPoster"), a = await media.get("aboutImg");
      const video = document.querySelector(".stage-video");
      if (video && p) video.poster = URL.createObjectURL(p);
      if (video && v) { video.querySelectorAll("source").forEach((s) => s.remove()); video.src = URL.createObjectURL(v); video.load(); video.play().catch(() => {}); }
      const img = document.querySelector(MEDIA.aboutImg.sel);
      if (img && a) img.src = URL.createObjectURL(a);
    } catch {}
    const bar = document.createElement("div");
    bar.className = "preview-bar";
    bar.innerHTML = '<b>Vorschau</b> mit Ihren Änderungen aus dem Mitarbeiter-Bereich. Besucher sehen noch die normale Seite. <a href="admin.html#website">Zurück zum Bearbeiten</a>';
    document.body.appendChild(bar);
  }
  if (/[?&]vorschau=1\b/.test(location.search) && document.querySelector(".stage")) apply();

  return { FIELDS, MEDIA, texts, media };
})();
