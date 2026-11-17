// SANISA – Bearbeiten-Modus für den oberen Bereich.
// Aktiv nur mit ?edit in der Adresse. Texte mit der Maus verschieben,
// Größe per Regler ändern, dann "Werte kopieren" und an Claude schicken.
(function () {
  const isLive = /(^|\.)sanisa(-baumaschinen)?\.de$/.test(location.hostname);
  if (!/[?&]edit\b/.test(location.search)) {
    // In der Vorschau (nicht auf der echten Domain) einen Knopf zum Einschalten anbieten
    if (isLive) return;
    const btn = document.createElement("button");
    btn.textContent = "✎ Bearbeiten";
    Object.assign(btn.style, { position: "fixed", left: "16px", bottom: "16px", zIndex: 9999, padding: "10px 16px", border: "0", borderRadius: "6px", background: "#18171d", color: "#facc38", font: "600 14px system-ui, sans-serif", cursor: "pointer", boxShadow: "0 10px 30px rgba(0,0,0,.35)" });
    btn.addEventListener("click", () => { btn.remove(); start(); });
    document.body.appendChild(btn);
    return;
  }
  start();

  function start() {

  const items = [
    { sel: ".stage-text .kicker", name: "Überzeile (SANISA Baumaschinen · Butzbach)" },
    { sel: ".stage-text h1 span:nth-child(1)", name: "Überschrift Zeile 1" },
    { sel: ".stage-text h1 span:nth-child(2)", name: "Überschrift Zeile 2" },
    { sel: ".stage-text .facts .strong", name: "Ankauf · Verkauf · …" },
    { sel: ".stage-text .facts .since", name: "Seit 2016 in Butzbach" },
    { sel: ".stage-text .actions", name: "Buttons" },
    { sel: ".stage-text .hero-contact", name: "Telefon & E-Mail" },
  ];
  const state = {};

  // Video anhalten, damit das Bild beim Einstellen ruhig ist
  const v = document.querySelector(".stage-video");
  if (v) { v.pause(); v.addEventListener("loadedmetadata", () => { v.currentTime = v.duration; }); if (v.duration) v.currentTime = v.duration; }

  const css = document.createElement("style");
  css.textContent = `
    .ed-item { outline: 1px dashed rgba(250,204,56,.9); outline-offset: 4px; cursor: move; touch-action: none; position: relative; }
    .ed-item.ed-active { outline: 2px solid #facc38; }
    .ed-panel { position: fixed; right: 16px; top: 110px; z-index: 9999; width: 300px; background: #18171d; color: #fff;
      font: 400 13px/1.4 system-ui, sans-serif; border-radius: 8px; padding: 14px; box-shadow: 0 20px 50px rgba(0,0,0,.5); }
    .ed-panel h4 { margin: 0 0 8px; font: 700 14px system-ui; }
    .ed-panel p { margin: 0 0 10px; color: #bbb; }
    .ed-panel label { display: block; margin: 8px 0 2px; }
    .ed-panel input[type=range] { width: 100%; }
    .ed-panel button { margin-top: 10px; width: 100%; padding: 9px; border: 0; border-radius: 4px; font: 600 13px system-ui; cursor: pointer; }
    .ed-copy { background: #facc38; color: #18171d; }
    .ed-reset { background: #333; color: #fff; }
    .ed-out { width: 100%; height: 90px; margin-top: 8px; font: 11px monospace; display: none; }
    .ed-sel { color: #facc38; font-weight: 600; }`;
  document.head.appendChild(css);

  const panel = document.createElement("div");
  panel.className = "ed-panel";
  panel.innerHTML = `<h4>Bearbeiten-Modus</h4>
    <p>Text anklicken und mit der Maus verschieben. Größe mit dem Regler einstellen.</p>
    <div>Ausgewählt: <span class="ed-sel">–</span></div>
    <label>Größe <span class="ed-pct">100 %</span></label><input type="range" class="ed-size" min="60" max="160" value="100">
    <button class="ed-copy">Werte kopieren</button>
    <button class="ed-reset">Alles zurücksetzen</button>
    <textarea class="ed-out" readonly></textarea>`;
  document.body.appendChild(panel);
  const selLbl = panel.querySelector(".ed-sel"), size = panel.querySelector(".ed-size"), pct = panel.querySelector(".ed-pct"), out = panel.querySelector(".ed-out");

  let active = null;
  const apply = (el, s) => {
    el.style.transform = `translate(${s.x}px, ${s.y}px)`;
    el.style.fontSize = s.scale === 100 ? "" : `calc(1em * ${s.scale / 100})`;
  };
  const select = (it) => {
    document.querySelectorAll(".ed-active").forEach((e) => e.classList.remove("ed-active"));
    active = it; it.el.classList.add("ed-active");
    selLbl.textContent = it.name; size.value = state[it.name].scale; pct.textContent = size.value + " %";
  };

  items.forEach((it) => {
    const el = document.querySelector(it.sel);
    if (!el) return;
    it.el = el;
    if (getComputedStyle(el).display === "inline") el.style.display = "inline-block";
    el.classList.add("ed-item");
    state[it.name] = { x: 0, y: 0, scale: 100 };
    el.querySelectorAll("a").forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault(); select(it);
      const s = state[it.name], sx = e.clientX - s.x, sy = e.clientY - s.y;
      const move = (ev) => { s.x = Math.round(ev.clientX - sx); s.y = Math.round(ev.clientY - sy); apply(el, s); };
      const up = () => { removeEventListener("pointermove", move); removeEventListener("pointerup", up); };
      addEventListener("pointermove", move); addEventListener("pointerup", up);
    });
  });

  size.addEventListener("input", () => {
    if (!active) return;
    state[active.name].scale = +size.value; pct.textContent = size.value + " %"; apply(active.el, state[active.name]);
  });

  panel.querySelector(".ed-reset").addEventListener("click", () => {
    items.forEach((it) => { if (!it.el) return; state[it.name] = { x: 0, y: 0, scale: 100 }; apply(it.el, state[it.name]); });
    if (active) select(active);
  });

  panel.querySelector(".ed-copy").addEventListener("click", async () => {
    const lines = [`Bildschirm: ${innerWidth}×${innerHeight}`];
    items.forEach((it) => {
      const s = state[it.name];
      if (s && (s.x || s.y || s.scale !== 100)) lines.push(`${it.name}: rechts ${s.x}px, runter ${s.y}px, Größe ${s.scale}%`);
    });
    if (lines.length === 1) lines.push("(nichts verändert)");
    const text = lines.join("\n");
    out.style.display = "block"; out.value = text;
    try { await navigator.clipboard.writeText(text); panel.querySelector(".ed-copy").textContent = "Kopiert! Jetzt an Claude schicken"; }
    catch { out.select(); panel.querySelector(".ed-copy").textContent = "Text unten markieren & kopieren"; }
  });
  }
})();
