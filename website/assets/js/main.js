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
  if (video && !reduced) {
    video.addEventListener("error", fallback, true);
    const p = video.play();
    if (p && p.catch) p.catch(() => { /* Autoplay blockiert: Startbild des Videos bleibt stehen */ });
  } else if (video && reduced) {
    // Animationen reduziert: Video nicht abspielen, sein Endbild zeigen
    video.poster = "assets/video/hero-poster.jpg";
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

/* Fahrzeugbestand (nur auf der Startseite) */
let vehicles = [];

function card(v) {
  const icon = ICONS[v.kategorie] || "i-lkw";
  const title = v.titel || [v.hersteller, v.modell].filter(Boolean).join(" ");
  const media = v.bild
    ? `<img src="${esc(v.bild)}" alt="${esc(title)}" loading="lazy">`
    : `<svg aria-hidden="true"><use href="${SPRITE}#${icon}"/></svg>`;
  const label = { LKW: "LKW", Baumaschine: "Baumaschine", Industrie: "Industrieanlage" }[v.kategorie] || v.kategorie;
  const specs = [
    v.km && `<span><svg><use href="${SPRITE}#i-gauge"/></svg>${esc(v.km)}</span>`,
    v.ez && `<span><svg><use href="${SPRITE}#i-calendar"/></svg>${esc(v.ez)}</span>`,
    v.leistung && `<span><svg><use href="${SPRITE}#i-truck"/></svg>${esc(v.leistung)}</span>`,
  ].filter(Boolean).join("");
  return `
    <article class="vehicle">
      <div class="vehicle-media">${media}<span class="tag">${esc(label)}</span></div>
      <div class="vehicle-body">
        <h4>${esc(title)}</h4>
        <div class="loc"><svg><use href="${SPRITE}#i-pin"/></svg>Butzbach</div>
        ${v.text ? `<p>${esc(v.text)}</p>` : ""}
        ${specs ? `<div class="specs">${specs}</div>` : ""}
        <div class="vehicle-foot">
          <span class="price">${v.preis ? fmt.format(v.preis) + " €" : "Preis auf Anfrage"}</span>
          <a class="more-link" href="${$("#kontakt") ? "#kontakt" : "kontakt.html"}">Anfragen »</a>
        </div>
      </div>
    </article>`;
}

let curFilter = "alle";
function render(filter = curFilter) {
  curFilter = filter;
  const grid = $("#vehicle-grid");
  if (!grid) return;
  const q = ($("#vehicle-search")?.value || "").trim().toLowerCase();
  const title = (v) => (v.titel || [v.hersteller, v.modell].filter(Boolean).join(" ")) + " " + (v.text || "");
  let list = filter === "alle" ? vehicles : vehicles.filter((v) => v.kategorie === filter);
  if (q) list = list.filter((v) => title(v).toLowerCase().includes(q));
  const limit = +grid.dataset.limit || 0; // Startseite: höchstens 8, Fahrzeugseite: alle
  if (limit) list = list.slice(0, limit);
  const cnt = $("#vehicle-count"); if (cnt) cnt.textContent = list.length;
  $$("[data-cnt]").forEach((el) => {
    const k = el.dataset.cnt;
    el.textContent = k === "alle" ? vehicles.length : vehicles.filter((v) => v.kategorie === k).length;
  });
  grid.innerHTML = list.length
    ? list.map(card).join("")
    : `<p class="empty">Aktuell nichts gefunden. Rufen Sie uns an, wir finden etwas für Sie.</p>`;
}

if ($("#vehicle-grid")) {
  $$(".chip").forEach((c) => c.addEventListener("click", () => {
    $$(".chip").forEach((x) => x.classList.toggle("is-active", x === c));
    render(c.dataset.filter);
  }));
  $("#vehicle-search")?.addEventListener("input", () => render());
  fetch("data/fahrzeuge.json", { cache: "no-store" })
    .then((r) => r.json())
    .then((d) => { vehicles = d; render(); })
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
