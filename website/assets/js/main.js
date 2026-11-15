// Sanisa – gemeinsames Script für Startseite und Ankaufs-Landingpage

const SPRITE = "assets/img/icons.svg";

const ICONS = {
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

/* Header: transparent über dem Hero, dunkel beim Scrollen */
const header = $(".site-header");
if (header) {
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* Mobile Navigation */
const toggle = $(".nav-toggle");
const nav = $("#main-nav");
if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
    header.classList.toggle("solid", open);
  });
  $$("a", nav).forEach((a) => a.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    header.classList.remove("solid");
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
  const media = v.bild
    ? `<img src="${esc(v.bild)}" alt="${esc(v.hersteller + " " + v.modell)}" loading="lazy">`
    : `<svg aria-hidden="true"><use href="${SPRITE}#${icon}"/></svg>`;
  const specs = [
    v.baujahr && `Bj. ${v.baujahr}`,
    v.betriebsstunden && `${fmt.format(v.betriebsstunden)} Bh`,
    v.kilometer && `${fmt.format(v.kilometer)} km`,
    v.zustand,
  ].filter(Boolean);
  return `
    <article class="vehicle reveal in">
      <div class="vehicle-media">${media}<span class="vehicle-tag">${esc(v.kategorie)}</span></div>
      <div class="vehicle-body">
        <h3>${esc(v.modell)}</h3>
        <ul class="specs">${specs.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
        <div class="vehicle-foot">
          <div class="price">${v.preis ? fmt.format(v.preis) + " €" : "Auf Anfrage"}<small>${esc(v.mwst || "")}</small></div>
          <a class="link-arrow" href="#kontakt">Anfragen</a>
        </div>
      </div>
    </article>`;
}

function render(filter = "alle") {
  const grid = $("#vehicle-grid");
  if (!grid) return;
  const list = filter === "alle" ? vehicles : vehicles.filter((v) => v.kategorie === filter);
  grid.innerHTML = list.length
    ? list.map(card).join("")
    : `<p class="empty">Aktuell nichts in dieser Kategorie. Rufen Sie uns an, wir finden etwas für Sie.</p>`;
}

if ($("#vehicle-grid")) {
  $$(".chip").forEach((c) => c.addEventListener("click", () => {
    $$(".chip").forEach((x) => x.classList.toggle("is-active", x === c));
    render(c.dataset.filter);
  }));
  fetch("data/fahrzeuge.json", { cache: "no-store" })
    .then((r) => r.json())
    .then((d) => { vehicles = d; render(); })
    .catch(() => render());
}

/* Team (Daten aus data/team.json, später über den Mitarbeiter-Bereich pflegbar) */
function member(m) {
  const initials = m.platzhalter ? "?" : m.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
  const photo = m.bild ? `<img src="${esc(m.bild)}" alt="${esc(m.name)}" loading="lazy">` : `<span class="initials">${esc(initials)}</span>`;
  const tel = m.telefon ? `<a href="tel:${esc(m.telefon.replace(/\s/g, ""))}"><svg><use href="${SPRITE}#i-phone"/></svg>${esc(m.telefon)}</a>` : "";
  const mail = m.email ? `<a href="mailto:${esc(m.email)}"><svg><use href="${SPRITE}#i-mail"/></svg>${esc(m.email)}</a>` : "";
  return `
    <article class="member reveal in${m.platzhalter ? " is-ph" : ""}">
      <div class="member-photo">${photo}</div>
      <div class="member-body">
        <p class="role">${esc(m.rolle)}</p>
        <h3>${esc(m.name)}</h3>
        <p class="area">${esc(m.bereich || "")}</p>
        <div class="contact">${tel}${mail}</div>
      </div>
    </article>`;
}
const teamGrid = $("#team-grid");
if (teamGrid) {
  fetch("data/team.json", { cache: "no-store" })
    .then((r) => r.json())
    .then((list) => { teamGrid.innerHTML = list.map(member).join(""); })
    .catch(() => {});
}

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
    setTimeout(() => show(0), 3500);
  });

  show(0);
});

$$(".js-year").forEach((el) => (el.textContent = new Date().getFullYear()));
