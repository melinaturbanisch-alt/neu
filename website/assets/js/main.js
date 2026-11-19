// Sanisa – gemeinsames Script für Startseite und Ankaufs-Landingpage

const SPRITE = "assets/img/icons.svg";

const ICONS = {
  Baumaschine: "i-bagger",
  Bagger: "i-bagger",
  Minibagger: "i-minibagger",
  Radlader: "i-radlader",
  LKW: "i-lkw",
  Transporter: "i-transporter",
  "Anhänger": "i-anhaenger",
  Stapler: "i-stapler",
  Sattelzug: "i-sattelzug",
  Dumper: "i-dumper",
  Industrie: "i-industrie",
};

const fmt = new Intl.NumberFormat("de-DE");
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const header = $(".site-header");
if (header) {
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 10);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* Kasten "Sie erreichen uns" erscheint erst, wenn man nach unten scrollt */
const hoursBox = $(".hours-box");
if (hoursBox) {
  const showBox = () => { if (window.scrollY > 40) { hoursBox.classList.add("show"); window.removeEventListener("scroll", showBox); } };
  window.addEventListener("scroll", showBox, { passive: true });
  showBox();
}

/* Blickfang: Foto-Slideshow (wechselt alle 7 Sekunden) */
const stage = $(".stage");
if (stage) {
  const slides = $$(".slide", stage);
  const dots = $$(".dots button", stage);
  let cur = 0;
  let timer;
  const go = (n) => {
    slides[cur].classList.remove("on");
    if (dots[cur]) dots[cur].classList.remove("on");
    cur = (n + slides.length) % slides.length;
    void slides[cur].offsetWidth; // Zoom-Animation neu starten
    slides[cur].classList.add("on");
    if (dots[cur]) dots[cur].classList.add("on");
  };
  const start = () => {
    clearInterval(timer);
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) timer = setInterval(() => go(cur + 1), 7000);
  };
  dots.forEach((d, i) => d.addEventListener("click", () => { go(i); start(); }));

  // Video hat Vorrang: läuft es, wird die Diashow ausgeblendet. Ohne Video bleibt die Diashow.
  const video = $(".stage-video", stage);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Ohne Video (oder wenn es nicht abspielt) übernimmt die Diashow
  const fallback = () => {
    if (stage.classList.contains("no-video")) return;
    stage.classList.add("no-video");
    if (video) video.remove();
    slides[0].classList.add("on");
    if (dots[0]) dots[0].classList.add("on");
    start();
  };
  // Handy (hochkant): eigenes Hochformat-Video
  const portrait = matchMedia("(max-width: 700px) and (orientation: portrait)").matches;
  if (video && portrait) {
    video.querySelectorAll("source").forEach((s) => s.remove());
    video.poster = "assets/video/hero-m-start.jpg";
    video.src = "assets/video/hero-m.mp4";
  }
  if (video && !reduced) {
    video.addEventListener("error", fallback, true);
    const p = video.play();
    if (p && p.catch) p.catch(() => { /* Autoplay blockiert: Startbild des Videos bleibt stehen */ });
  } else if (video && reduced) {
    // Animationen reduziert: Video nicht abspielen, sein Endbild zeigen
    video.poster = portrait ? "assets/video/hero-m-poster.jpg" : "assets/video/hero-poster.jpg";
  } else {
    fallback();
  }
}

/* Mobile Navigation */
const toggle = $(".nav-toggle");
const nav = $("#main-nav");
if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
  $$("a", nav).forEach((a) => a.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }));
}

/* Einblenden beim Scrollen */
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  $$(".reveal").forEach((el) => io.observe(el));
} else {
  $$(".reveal").forEach((el) => el.classList.add("in"));
}

/* Fahrzeugbestand (Startseite: Auswahl, fahrzeuge.html: mit Filtern)
   Daten aus data/fahrzeuge.json – später automatisch aus mobile.de */
let vehicles = [];
const MWST = 0.19;
let priceMode = "netto";
try { priceMode = localStorage.getItem("sanisa-preis") || "netto"; } catch {}
const LABEL = { LKW: "LKW", Baumaschine: "Baumaschine", Industrie: "Industrieanlage" };
const vTitle = (v) => v.titel || [v.hersteller, v.modell].filter(Boolean).join(" ");
const brutto = (n) => Math.round(n * (1 + MWST));
const priceOf = (v) => (v.preis_netto ? (priceMode === "brutto" ? brutto(v.preis_netto) : v.preis_netto) : null);
const year = (ez) => (ez ? +String(ez).slice(0, 4) : null);
const ezText = (ez) => { if (!ez) return ""; const [y, m] = String(ez).split("-"); return m ? `${m}/${y}` : y; };

function card(v) {
  const icon = ICONS[v.kategorie] || "i-lkw";
  const title = vTitle(v);
  const media = v.bild
    ? `<img src="${esc(v.bild)}" alt="${esc(title)}" loading="lazy">`
    : `<svg aria-hidden="true"><use href="${SPRITE}#${icon}"/></svg>`;
  const specs = [
    v.ez && `<span title="Erstzulassung"><svg><use href="${SPRITE}#i-calendar"/></svg>EZ <b>${esc(ezText(v.ez))}</b></span>`,
    v.km != null && `<span title="Kilometerstand"><svg><use href="${SPRITE}#i-gauge"/></svg><b>${fmt.format(v.km)}</b> <i>km</i></span>`,
    v.stunden != null && `<span title="Betriebsstunden"><svg><use href="${SPRITE}#i-gauge"/></svg><b>${fmt.format(v.stunden)}</b> <i>Bh</i></span>`,
    v.ps && `<span title="Leistung"><svg><use href="${SPRITE}#i-truck"/></svg><b>${v.ps}</b> <i>PS</i></span>`,
  ].filter(Boolean).join("");
  const p = v.preis_netto;
  const price = p
    ? `<span class="price"><b>${fmt.format(priceOf(v))} €</b><small>${priceMode === "brutto" ? `${fmt.format(p)} € netto` : `${fmt.format(brutto(p))} € brutto`}</small></span>`
    : `<span class="price"><b>Preis auf Anfrage</b></span>`;
  const link = $("#kontakt") ? "#kontakt" : "kontakt.html";
  return `
    <article class="vehicle">
      <div class="vehicle-media">${media}<span class="tag">${esc(v.typ || LABEL[v.kategorie] || v.kategorie)}</span>${v.beispiel ? `<span class="demo">Beispiel</span>` : ""}</div>
      <div class="vehicle-body">
        <h4>${esc(title)}</h4>
        <div class="loc"><svg><use href="${SPRITE}#i-pin"/></svg>Butzbach</div>
        ${specs ? `<div class="specs">${specs}</div>` : ""}
        <div class="vehicle-foot">
          ${price}
          <a class="more-link" href="${link}">Anfragen »</a>
        </div>
      </div>
    </article>`;
}

/* Filter
   Auswahl-Filter (Hersteller, Schadstoffklasse, Achsen, Kraftstoff, Getriebe) bauen sich
   automatisch aus dem aktuellen Bestand auf: Es erscheinen nur Werte, die es gerade gibt. */
const FACETS = {
  hersteller: { label: (x) => x },
  euronorm:   { label: (x) => x },
  achsen:     { label: (x) => `${x} Achsen`, sort: (a, b) => a - b },
  kraftstoff: { label: (x) => x },
  getriebe:   { label: (x) => x },
};
const F = { kategorie: "alle", typ: [], facets: {}, preisVon: "", preisBis: "", km: "", stunden: "", ezVon: "", psVon: "", gewVon: "", gewBis: "", q: "", sort: "neu" };
Object.keys(FACETS).forEach((k) => (F.facets[k] = []));

function matches(v, skip) {
  if (skip !== "kategorie" && F.kategorie !== "alle" && v.kategorie !== F.kategorie) return false;
  if (skip !== "typ" && F.typ.length && !F.typ.includes(v.typ)) return false;
  for (const k of Object.keys(FACETS)) if (skip !== k && F.facets[k].length && !F.facets[k].includes(String(v[k]))) return false;
  const pr = priceOf(v);
  if (F.preisVon && (!pr || pr < +F.preisVon)) return false;
  if (F.preisBis && (!pr || pr > +F.preisBis)) return false;
  if (F.km && (v.km == null || v.km > +F.km)) return false;
  if (F.stunden && (v.stunden == null || v.stunden > +F.stunden)) return false;
  if (F.ezVon && (!year(v.ez) || year(v.ez) < +F.ezVon)) return false;
  if (F.psVon && (!v.ps || v.ps < +F.psVon)) return false;
  if (F.gewVon && (!v.gewicht || v.gewicht < +F.gewVon)) return false;
  if (F.gewBis && (!v.gewicht || v.gewicht > +F.gewBis)) return false;
  if (F.q && !(vTitle(v) + " " + (v.typ || "") + " " + (v.text || "")).toLowerCase().includes(F.q)) return false;
  return true;
}

const SORT = {
  neu: (a, b) => String(b.datum || "").localeCompare(String(a.datum || "")),
  preis_auf: (a, b) => (a.preis_netto || 1e12) - (b.preis_netto || 1e12),
  preis_ab: (a, b) => (b.preis_netto || 0) - (a.preis_netto || 0),
  km_auf: (a, b) => (a.km ?? 1e12) - (b.km ?? 1e12),
  ez_neu: (a, b) => String(b.ez || "").localeCompare(String(a.ez || "")),
};

function checkList(box, values, selected, counts, label, name) {
  const open = box.classList.contains("is-open");
  box.innerHTML = values.map((x, i) => `<label class="fcheck${i >= 6 && !open ? " is-more" : ""}"><input type="checkbox" data-facet="${name}" value="${esc(x)}" ${selected.includes(String(x)) ? "checked" : ""}><span>${esc(label(x))}</span><em>${counts(x)}</em></label>`).join("")
    + (values.length > 6 ? `<button type="button" class="fmore">${open ? "Weniger anzeigen" : `Alle ${values.length} anzeigen`}</button>` : "");
}

function fillOptions() {
  const ez = $("#f-ez");
  if (ez && ez.options.length <= 1) {
    const now = new Date().getFullYear();
    for (let y = now; y >= now - 25; y--) ez.add(new Option(`ab ${y}`, y));
  }
  const inCat = vehicles.filter((v) => F.kategorie === "alle" || v.kategorie === F.kategorie);
  // Aufbau / Art
  const typBox = $("#f-typ");
  if (typBox) {
    const pool = vehicles.filter((v) => matches(v, "typ"));
    const types = [...new Set(inCat.map((v) => v.typ).filter(Boolean))].sort();
    F.typ = F.typ.filter((t) => types.includes(t));
    checkList(typBox, types, F.typ, (t) => pool.filter((v) => v.typ === t).length, (x) => x, "typ");
  }
  // automatische Auswahl-Filter
  for (const [k, cfg] of Object.entries(FACETS)) {
    const box = $(`[data-facet-box="${k}"]`); if (!box) continue;
    const pool = vehicles.filter((v) => matches(v, k));
    const vals = [...new Set(inCat.map((v) => v[k]).filter((x) => x != null && x !== ""))].map(String).sort(cfg.sort || ((a, b) => a.localeCompare(b, "de")));
    F.facets[k] = F.facets[k].filter((x) => vals.includes(x));
    box.closest(".fgroup").hidden = vals.length < 1;
    checkList(box, vals, F.facets[k], (x) => pool.filter((v) => String(v[k]) === x).length, cfg.label, k);
  }
  // Bereichs-Filter nur zeigen, wenn es dazu Daten gibt
  $$("[data-need]").forEach((g) => { g.hidden = !inCat.some((v) => v[g.dataset.need] != null && v[g.dataset.need] !== ""); });
  $$("[data-cnt]").forEach((el) => {
    const k = el.dataset.cnt;
    el.textContent = vehicles.filter((v) => (k === "alle" || v.kategorie === k) && matches(v, "kategorie")).length;
  });
}

function activeCount() {
  let n = (F.kategorie !== "alle") + F.typ.length + (F.q ? 1 : 0);
  Object.values(F.facets).forEach((a) => (n += a.length));
  ["preisVon", "preisBis", "km", "stunden", "ezVon", "psVon", "gewVon", "gewBis"].forEach((k) => (n += F[k] ? 1 : 0));
  return n;
}

function render() {
  const grid = $("#vehicle-grid");
  if (!grid) return;
  const limit = +grid.dataset.limit || 0; // Startseite: höchstens 8
  let list = limit ? [...vehicles].sort(SORT.neu).slice(0, limit) : vehicles.filter((v) => matches(v)).sort(SORT[F.sort] || SORT.neu);
  if (!limit) fillOptions();
  const cnt = $("#vehicle-count"); if (cnt) cnt.textContent = list.length;
  const cb = $("#vehicle-count-btn"); if (cb) cb.textContent = list.length + " ";
  const active = activeCount();
  $$(".js-fcount").forEach((el) => { el.textContent = active || ""; el.hidden = !active; });
  grid.innerHTML = list.length
    ? list.map(card).join("")
    : `<p class="empty">Keine Fahrzeuge mit diesen Filtern. Ändern Sie die Auswahl oder rufen Sie uns an, wir finden etwas für Sie.</p>`;
}

function setPriceMode(m) {
  priceMode = m;
  try { localStorage.setItem("sanisa-preis", m); } catch {}
  $$("[data-pmode]").forEach((b) => b.classList.toggle("is-active", b.dataset.pmode === m));
  $$(".js-pmode-label").forEach((el) => (el.textContent = m === "brutto" ? "brutto" : "netto"));
  render();
}

if ($("#vehicle-grid")) {
  const form = $("#vfilter");
  if (form) {
    const read = () => {
      F.kategorie = (form.querySelector("[name=kategorie]:checked") || {}).value || "alle";
      F.typ = $$('#f-typ input:checked').map((i) => i.value);
      Object.keys(FACETS).forEach((k) => (F.facets[k] = $$(`input[data-facet="${k}"]:checked`, form).map((i) => i.value)));
      ["preisVon", "preisBis", "km", "stunden", "ezVon", "psVon", "gewVon", "gewBis"].forEach((k) => (F[k] = form[k] ? form[k].value : ""));
      F.q = ($("#vehicle-search")?.value || "").trim().toLowerCase();
      render();
    };
    form.addEventListener("input", read);
    form.addEventListener("change", read);
    form.addEventListener("click", (e) => {
      const b = e.target.closest(".fmore"); if (!b) return;
      b.parentElement.classList.toggle("is-open"); render();
    });
    form.addEventListener("reset", () => setTimeout(() => { $$("input[type=checkbox]", form).forEach((i) => (i.checked = false)); read(); }, 0));
    $("#vehicle-search")?.addEventListener("input", read);
    $("#vehicle-sort")?.addEventListener("change", (e) => { F.sort = e.target.value; render(); });
    $$("[data-pmode]").forEach((b) => b.addEventListener("click", () => setPriceMode(b.dataset.pmode)));
    $$(".js-filter-open").forEach((b) => b.addEventListener("click", () => document.body.classList.add("filter-open")));
    $$(".js-filter-close").forEach((b) => b.addEventListener("click", () => document.body.classList.remove("filter-open")));
    setPriceMode(priceMode);
  }
  fetch("data/fahrzeuge.json", { cache: "no-store" })
    .then((r) => r.json())
    .then((d) => { vehicles = d.filter((v) => v.status !== "verkauft"); render(); })
    .catch(() => render());
}

/* Team (Daten aus data/team.json, später über den Mitarbeiter-Bereich pflegbar) */
function member(m) {
  const photo = m.bild
    ? `<div class="member-photo"><img src="${esc(m.bild)}" alt="${esc(m.name)}" loading="lazy"></div>`
    : `<div class="member-photo ph"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="38" r="15"/><path d="M20 100c2-20 14-31 30-31s28 11 30 31z"/></svg></div>`;
  const tel = m.telefon ? `<a href="tel:${esc(m.telefon.replace(/[^+\d]/g, ""))}"><svg><use href="${SPRITE}#i-phone"/></svg>${esc(m.telefon)}</a>` : "";
  const mail = m.email ? `<a href="mailto:${esc(m.email)}"><svg><use href="${SPRITE}#i-mail"/></svg>${esc(m.email)}</a>` : "";
  return `
    <article class="member">
      ${photo}
      <h4>${esc(m.name)}</h4>
      <p class="role">${esc(m.rolle)}</p>
      ${tel || mail ? `<div class="contact">${tel}${mail}</div>` : ""}
    </article>`;
}
const teamGrid = $("#team-grid");
if (teamGrid) {
  fetch("data/team.json", { cache: "no-store" })
    .then((r) => r.json())
    .then((list) => {
      const groups = [...new Set(list.map((m) => m.gruppe || ""))];
      teamGrid.innerHTML = groups.map((g) => `
        <section class="team-block">
          ${g ? `<h3 class="team-group"><span>${esc(g)}</span></h3>` : ""}
          <div class="team-grid">${list.filter((m) => (m.gruppe || "") === g).map(member).join("")}</div>
        </section>`).join("");
    })
    .catch(() => {});
}

/* Foto-Upload: Ziehen & Ablegen, Vorschaubilder, einzeln entfernen (max. 10) */
$$(".upload").forEach((up) => {
  const zone = $(".dropzone", up), input = $("input[type=file]", up), thumbs = $(".thumbs", up);
  let files = [];
  const sync = () => {
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    input.files = dt.files;
    thumbs.innerHTML = "";
    files.forEach((f, i) => {
      const t = document.createElement("div");
      t.className = "thumb";
      t.innerHTML = `<img alt=""><button type="button" aria-label="Foto entfernen">×</button>`;
      $("img", t).src = URL.createObjectURL(f);
      $("button", t).addEventListener("click", () => { files.splice(i, 1); sync(); });
      thumbs.appendChild(t);
    });
  };
  const add = (list) => { files = files.concat([...list].filter((f) => f.type.startsWith("image/"))).slice(0, 10); sync(); };
  input.addEventListener("change", () => add(input.files));
  ["dragenter", "dragover"].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add("drag"); }));
  ["dragleave", "drop"].forEach((ev) => zone.addEventListener(ev, () => zone.classList.remove("drag")));
  zone.addEventListener("drop", (e) => { e.preventDefault(); add(e.dataTransfer.files); });
});

/* Mehrstufiges Ankaufsformular */
$$(".js-quote").forEach((form) => {
  const steps = $$(".fstep", form);
  const card = form.closest(".quote-card");
  const num = card && $(".js-stepnum", card);
  const bar = card && $(".js-progress", card);
  const msg = $(".form-msg", form);
  let i = 0;

  const show = (n) => {
    i = n;
    steps.forEach((s, k) => s.classList.toggle("is-active", k === i));
    if (num) num.textContent = i + 1;
    if (bar) bar.style.width = `${((i + 1) / steps.length) * 100}%`;
    msg.textContent = "";
  };

  const valid = () => {
    const fields = $$("input, select, textarea", steps[i]);
    const bad = fields.find((f) => !f.checkValidity());
    if (bad) {
      msg.className = "form-msg err";
      msg.textContent = bad.type === "radio" ? "Bitte wählen Sie eine Maschinenart."
        : bad.type === "checkbox" ? "Bitte stimmen Sie der Datenverarbeitung zu."
        : "Bitte füllen Sie die Pflichtfelder aus.";
      if (bad.type !== "radio") bad.focus();
      return false;
    }
    return true;
  };

  $$(".js-next", form).forEach((b) => b.addEventListener("click", () => valid() && show(i + 1)));
  $$(".js-prev", form).forEach((b) => b.addEventListener("click", () => show(i - 1)));
  // Bei Auswahl der Maschinenart direkt weiter
  $$('input[name="art"]', form).forEach((r) => r.addEventListener("change", () => setTimeout(() => show(1), 180)));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!valid()) return;
    // TODO: an Backend / E-Mail senden, sobald der Server steht
    msg.className = "form-msg ok";
    msg.textContent = "Vielen Dank! Wir melden uns schnellstmöglich. (Vorschau, die Anfrage wird noch nicht versendet.)";
    form.reset();
    $$(".thumbs", form).forEach((t) => (t.innerHTML = ""));
    setTimeout(() => show(0), 3500);
  });

  show(0);
});

$$(".js-year").forEach((el) => (el.textContent = new Date().getFullYear()));

/* Google-Bewertungen */
(function () {
  const list = document.getElementById("g-list");
  if (!list) return;
  fetch("data/bewertungen.json").then((r) => r.json()).then((d) => {
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const fmt = (n) => String(n).replace(".", ",");
    const sec = document.getElementById("bewertungen");
    const G = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.8-2.1 5.1-4.4 6.7v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.2z"/><path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.6-3.9-12.3-9.1H4.4v5.7C8 41.1 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.7 28.2c-.4-1.3-.7-2.7-.7-4.2s.3-2.9.7-4.2v-5.7H4.4C2.9 17.1 2 20.4 2 24s.9 6.9 2.4 9.9l7.3-5.7z"/><path fill="#EA4335" d="M24 10.7c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.2 29.9 2 24 2 15.4 2 8 6.9 4.4 14.1l7.3 5.7c1.7-5.2 6.6-9.1 12.3-9.1z"/></svg>';
    const src = (q) => q === "Google" ? `<span class="src">${G}Google</span>` : `<span class="src src-mde">mobile.de</span>`;
    const logo = (q) => q === "Google" ? `<span class="g-src">${G}Google</span>` : `<span class="g-src g-src-mde">mobile.de</span>`;
    document.getElementById("g-rows").innerHTML = (d.noten || []).map((n) => `
      <a class="g-row" href="${esc(n.link || "#")}" target="_blank" rel="noopener">
        ${logo(n.quelle)}
        <b>${fmt(n.note)}</b>
        <span class="stars" style="--r:${n.note}">★★★★★</span>
        ${n.anzahl ? `<small>${n.anzahl} Bewertungen</small>` : ""}
      </a>`).join("");
    if (d.link) sec.querySelector(".js-g-link").href = d.link;
    if (d.schreiben) sec.querySelector(".js-g-write").href = d.schreiben;
    list.innerHTML = (d.eintraege || []).slice(0, 3).map((e, i) => `
      <figure class="g-review${i === 0 ? " is-big" : ""}">
        <span class="q" aria-hidden="true">“</span>
        <span class="stars" style="--r:${e.sterne}">★★★★★</span>
        <blockquote>${esc(e.text)}</blockquote>
        <figcaption><span class="buy"><svg><use href="assets/img/icons.svg#i-check"/></svg><span>${esc(e.kauf || "Kunde")}</span>${e.datum ? `<span class="sep"> · </span><span>${esc(e.datum)}</span>` : ""}</span>${src(e.quelle)}</figcaption>
      </figure>`).join("");
  }).catch(() => {});
})();

/* Kontaktformular (Versand folgt mit dem Mail-Dienst) */
$$(".js-contact").forEach((form) => {
  const msg = $(".form-msg", form);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const bad = $$("input, textarea", form).find((f) => !f.checkValidity());
    if (bad) {
      msg.className = "form-msg err";
      msg.textContent = bad.type === "checkbox" ? "Bitte stimmen Sie der Datenverarbeitung zu." : "Bitte füllen Sie die Pflichtfelder aus.";
      bad.focus();
      return;
    }
    msg.className = "form-msg ok";
    msg.textContent = "Vielen Dank! Ihre Nachricht ist bei uns angekommen. (Vorschau: wird noch nicht versendet.)";
    form.reset();
  });
});
