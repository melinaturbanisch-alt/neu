// Sanisa – Startseite
// Fahrzeuge kommen aus data/fahrzeuge.json. Später liefert der
// Mitarbeiter-Bereich dieselben Daten über eine API.

const MOBILE_DE_URL = "#"; // TODO: Link zum Sanisa-Händlerprofil auf mobile.de

const ICONS = {
  Bagger: "i-bagger",
  Minibagger: "i-minibagger",
  Radlader: "i-radlader",
  LKW: "i-lkw",
  Transporter: "i-transporter",
  "Anhänger": "i-anhaenger",
  Stapler: "i-stapler",
};

const fmt = new Intl.NumberFormat("de-DE");
let vehicles = [];

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function card(v) {
  const icon = ICONS[v.kategorie] || "i-lkw";
  const media = v.bild
    ? `<img src="${esc(v.bild)}" alt="${esc(v.hersteller + " " + v.modell)}" loading="lazy">`
    : `<svg aria-hidden="true"><use href="#${icon}"/></svg>`;
  const specs = [
    v.baujahr && `Bj. ${v.baujahr}`,
    v.betriebsstunden && `${fmt.format(v.betriebsstunden)} Bh`,
    v.kilometer && `${fmt.format(v.kilometer)} km`,
    v.zustand,
  ].filter(Boolean);
  return `
    <article class="vehicle">
      <div class="vehicle-media">${media}<span class="vehicle-tag">${esc(v.kategorie)}</span></div>
      <div class="vehicle-body">
        <h3>${esc(v.modell)}</h3>
        <ul class="specs">${specs.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
        <div class="vehicle-foot">
          <div class="price">${v.preis ? fmt.format(v.preis) + " €" : "Auf Anfrage"}<small>${esc(v.mwst || "")}</small></div>
          <a class="vehicle-link" href="#kontakt">Anfragen</a>
        </div>
      </div>
    </article>`;
}

function render(filter = "alle") {
  const grid = document.getElementById("vehicle-grid");
  const list = filter === "alle" ? vehicles : vehicles.filter((v) => v.kategorie === filter);
  grid.innerHTML = list.length
    ? list.map(card).join("")
    : `<p class="empty">Aktuell kein Fahrzeug in dieser Kategorie. Rufen Sie uns an, wir finden etwas für Sie.</p>`;
}

function setFilter(f) {
  document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("is-active", c.dataset.filter === f));
  render(f);
}

async function loadVehicles() {
  try {
    const res = await fetch("data/fahrzeuge.json", { cache: "no-store" });
    vehicles = await res.json();
  } catch {
    vehicles = [];
  }
  render();
}

document.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => setFilter(c.dataset.filter)));
document.querySelectorAll(".cat").forEach((c) =>
  c.addEventListener("click", () => {
    setFilter(c.dataset.filter);
    document.getElementById("fahrzeuge").scrollIntoView();
  })
);

// Mobile Navigation
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("main-nav");
toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});
nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
  nav.classList.remove("open");
  toggle.setAttribute("aria-expanded", "false");
}));

// Ankaufsformular: wird noch nicht versendet, das kommt mit dem Backend
document.getElementById("ankauf-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  const msg = document.getElementById("form-msg");
  if (!form.checkValidity()) {
    msg.className = "form-msg err";
    msg.textContent = "Bitte Art, Name, Telefon und die Datenschutz-Zustimmung ausfüllen.";
    return;
  }
  msg.className = "form-msg ok";
  msg.textContent = "Danke! (Vorschau: Die Anfrage wird noch nicht wirklich versendet.)";
  form.reset();
});

const ml = document.getElementById("mobile-link");
if (MOBILE_DE_URL === "#") ml.removeAttribute("target");
ml.href = MOBILE_DE_URL;
document.getElementById("year").textContent = new Date().getFullYear();

loadVehicles();
