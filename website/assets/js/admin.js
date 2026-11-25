// SANISA – Mitarbeiter-Bereich (Vorschau-Version)
// Daten liegen vorerst im Browser (localStorage). Später ersetzt eine Server-Schnittstelle
// die Funktionen load()/save(); die Oberfläche bleibt gleich.
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nf = new Intl.NumberFormat("de-DE");
  const KEY = { v: "sanisa-demo-vehicles", t: "sanisa-demo-team", r: "sanisa-demo-requests" };

  try { if (sessionStorage.getItem("sanisa-demo-login") !== "1") { location.replace("login.html"); return; } } catch {}

  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); return true; }
      catch { toast("Speicher voll – bitte weniger oder kleinere Fotos verwenden."); return false; }
    },
  };

  let vehicles = [], team = [], requests = [];

  const demoRequests = () => [
    { id: "r1", art: "Ankauf", datum: new Date(Date.now() - 36e5 * 3).toISOString(), name: "Beispiel: Thomas K.", telefon: "+49 170 0000000", kontaktweg: "WhatsApp", fahrzeug: "LKW · MAN TGS 26.440 · 2018 · 480.000 km", text: "Zustand: Einsatzbereit mit Mängeln · Standort: 61231 Bad Nauheim · Preisvorstellung: 35.000 €", fotos: 4, status: "neu" },
    { id: "r2", art: "Kontakt", datum: new Date(Date.now() - 864e5).toISOString(), name: "Beispiel: Bau GmbH", telefon: "+49 6031 000000", kontaktweg: "Anruf", fahrzeug: "Fahrzeug kaufen", text: "Wir suchen einen Radlader ca. 10 t, Baujahr ab 2015.", fotos: 0, status: "neu" },
  ];

  async function load() {
    vehicles = store.get(KEY.v);
    team = store.get(KEY.t);
    requests = store.get(KEY.r);
    if (!vehicles) vehicles = (await (await fetch("data/fahrzeuge.json", { cache: "no-store" })).json()).map((v) => ({ status: "aktiv", ...v }));
    if (!team) team = await (await fetch("data/team.json", { cache: "no-store" })).json();
    if (!requests) requests = demoRequests();
  }
  const save = () => store.set(KEY.v, vehicles) && store.set(KEY.t, team) && store.set(KEY.r, requests);

  function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toast.h); toast.h = setTimeout(() => el.classList.remove("show"), 2600); }

  /* Navigation */
  $$(".adm-nav button").forEach((b) => b.addEventListener("click", () => {
    $$(".adm-nav button").forEach((x) => x.classList.toggle("is-active", x === b));
    $$(".adm-view").forEach((v) => v.classList.toggle("is-active", v.id === "view-" + b.dataset.view));
  }));
  $("#logout").addEventListener("click", () => { try { sessionStorage.removeItem("sanisa-demo-login"); } catch {} location.href = "login.html"; });
  $("#reset-demo").addEventListener("click", async () => {
    if (!confirm("Alle Änderungen in der Vorschau verwerfen?")) return;
    Object.values(KEY).forEach((k) => { try { localStorage.removeItem(k); } catch {} });
    try { window.SanisaSite.texts.set({}); await window.SanisaSite.media.clear(); } catch {}
    await load(); renderAll(); toast("Vorschau zurückgesetzt.");
  });
  $$("dialog .js-close").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));

  /* Bilder verkleinern (spart Speicher) */
  function shrink(file, max = 1200) {
    return new Promise((res) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas"); c.width = img.width * s; c.height = img.height * s;
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); res(c.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = () => res(null);
      img.src = url;
    });
  }

  /* ---------- Fahrzeuge ---------- */
  const title = (v) => v.titel || [v.hersteller, v.modell].filter(Boolean).join(" ") || "Ohne Titel";
  const ezTxt = (ez) => { if (!ez) return "–"; const [y, m] = String(ez).split("-"); return m ? `${m}/${y}` : y; };
  const STATUS = { aktiv: "Aktiv", reserviert: "Reserviert", verkauft: "Verkauft" };

  function renderVehicles() {
    const q = $("#v-search").value.trim().toLowerCase(), k = $("#v-filter").value;
    const list = vehicles.filter((v) => (!k || v.kategorie === k) && (!q || (title(v) + " " + (v.typ || "")).toLowerCase().includes(q)));
    $("#v-count").textContent = vehicles.filter((v) => v.status !== "verkauft").length;
    $("#v-rows").innerHTML = list.map((v) => `
      <tr data-id="${esc(v.id)}">
        <td><div class="v-thumb">${(v.bilder && v.bilder[0]) || v.bild ? `<img src="${esc((v.bilder && v.bilder[0]) || v.bild)}" alt="">` : ""}</div></td>
        <td><b>${esc(title(v))}</b><small>${esc(v.typ || "")}</small></td>
        <td>${esc(v.kategorie === "Industrie" ? "Industrieanlage" : v.kategorie)}</td>
        <td>${esc(ezTxt(v.ez))}</td>
        <td>${v.km != null ? nf.format(v.km) + " km" : v.stunden != null ? nf.format(v.stunden) + " Bh" : "–"}</td>
        <td>${v.preis_netto ? nf.format(v.preis_netto) + " €" : "<span class='muted'>auf Anfrage</span>"}</td>
        <td><span class="pill pill-${esc(v.status || "aktiv")}">${STATUS[v.status || "aktiv"]}</span></td>
        <td class="acts"><button class="js-edit">Bearbeiten</button><button class="js-del" title="Löschen">Löschen</button></td>
      </tr>`).join("") || `<tr><td colspan="8" class="empty">Keine Fahrzeuge gefunden.</td></tr>`;
  }
  $("#v-search").addEventListener("input", renderVehicles);
  $("#v-filter").addEventListener("change", renderVehicles);

  let editId = null, photos = [];
  const vForm = $("#v-form");
  function drawThumbs() {
    $("#v-thumbs").innerHTML = photos.map((p, i) => `<div class="thumb"><img src="${p}" alt="">${i === 0 ? '<span class="cover">Titelbild</span>' : ""}<button type="button" data-i="${i}" aria-label="Foto entfernen">×</button></div>`).join("");
  }
  $("#v-thumbs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; photos.splice(+b.dataset.i, 1); drawThumbs(); });
  $("#v-photos").addEventListener("change", async (e) => {
    for (const f of [...e.target.files].slice(0, 15 - photos.length)) { const d = await shrink(f); if (d) photos.push(d); }
    e.target.value = ""; drawThumbs();
  });

  function openVehicle(v) {
    editId = v ? v.id : null;
    $("#v-title").textContent = v ? "Fahrzeug bearbeiten" : "Fahrzeug anlegen";
    vForm.reset();
    const d = v || { kategorie: "LKW", status: "aktiv" };
    ["kategorie", "typ", "hersteller", "modell", "titel", "ez", "ps", "km", "stunden", "getriebe", "preis_netto", "text", "status"].forEach((n) => { if (vForm[n]) vForm[n].value = d[n] ?? ""; });
    photos = v ? (v.bilder ? [...v.bilder] : v.bild ? [v.bild] : []) : [];
    drawThumbs();
    $("#v-dialog").showModal();
  }
  $("#add-vehicle").addEventListener("click", () => openVehicle(null));
  $("#v-rows").addEventListener("click", (e) => {
    const tr = e.target.closest("tr[data-id]"); if (!tr) return;
    const v = vehicles.find((x) => x.id === tr.dataset.id);
    if (e.target.closest(".js-edit")) openVehicle(v);
    if (e.target.closest(".js-del") && confirm(`„${title(v)}“ wirklich löschen?`)) {
      vehicles = vehicles.filter((x) => x !== v); save(); renderVehicles(); toast("Fahrzeug gelöscht.");
    }
  });
  vForm.addEventListener("submit", (e) => {
    if (!vForm.hersteller.value.trim()) { e.preventDefault(); vForm.hersteller.focus(); return; }
    const num = (n) => (vForm[n].value === "" ? null : +vForm[n].value);
    const data = {
      kategorie: vForm.kategorie.value, typ: vForm.typ.value.trim(), hersteller: vForm.hersteller.value.trim(), modell: vForm.modell.value.trim(),
      titel: vForm.titel.value.trim(), ez: vForm.ez.value, ps: num("ps"), km: num("km"), stunden: num("stunden"),
      getriebe: vForm.getriebe.value || null, preis_netto: num("preis_netto"), text: vForm.text.value.trim(), status: vForm.status.value,
      bilder: photos, bild: photos[0] || "", beispiel: false,
    };
    if (editId) Object.assign(vehicles.find((x) => x.id === editId), data);
    else vehicles.unshift({ id: "v" + Date.now(), datum: new Date().toISOString().slice(0, 10), ...data });
    if (save()) toast(editId ? "Änderungen gespeichert." : "Fahrzeug angelegt.");
    renderVehicles();
  });

  /* ---------- Anfragen ---------- */
  function renderRequests() {
    const fresh = requests.filter((r) => r.status === "neu").length;
    $("#req-badge").textContent = fresh || ""; $("#req-badge").hidden = !fresh;
    $("#req-list").innerHTML = requests.map((r) => `
      <article class="req ${r.status === "neu" ? "is-new" : ""}" data-id="${esc(r.id)}">
        <div class="req-top"><span class="pill ${r.art === "Ankauf" ? "pill-ankauf" : "pill-kontakt"}">${esc(r.art)}</span>${r.status === "neu" ? '<span class="pill pill-neu">Neu</span>' : ""}<time>${new Date(r.datum).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}</time></div>
        <h3>${esc(r.fahrzeug)}</h3>
        <p>${esc(r.text)}</p>
        <div class="req-meta"><span><b>${esc(r.name)}</b></span><a href="tel:${esc(r.telefon.replace(/[^+\d]/g, ""))}">${esc(r.telefon)}</a><span>Wunsch: ${esc(r.kontaktweg)}</span>${r.fotos ? `<span>${r.fotos} Fotos</span>` : ""}</div>
        <div class="req-acts">${r.status === "neu" ? '<button class="btn btn-dark js-done">Als erledigt markieren</button>' : '<span class="muted">Erledigt</span>'}</div>
      </article>`).join("") || `<p class="empty">Noch keine Anfragen.</p>`;
  }
  $("#req-list").addEventListener("click", (e) => {
    const a = e.target.closest(".req"); if (!a || !e.target.closest(".js-done")) return;
    requests.find((r) => r.id === a.dataset.id).status = "erledigt"; save(); renderRequests();
  });

  /* ---------- Team ---------- */
  let tEdit = null, tPhoto = "";
  const tForm = $("#t-form");
  function renderTeam() {
    const groups = [...new Set(team.map((m) => m.gruppe || ""))];
    $("#t-groups").innerHTML = groups.map((g) => `<option value="${esc(g)}">`).join("");
    $("#t-list").innerHTML = groups.map((g) => `
      <h3 class="ta-group">${esc(g || "Ohne Bereich")}</h3>
      <div class="ta-grid">${team.map((m, i) => ({ m, i })).filter(({ m }) => (m.gruppe || "") === g).map(({ m, i }) => `
        <div class="ta-card" data-i="${i}">
          <div class="ta-photo">${m.bild ? `<img src="${esc(m.bild)}" alt="">` : `<span>${esc((m.name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2))}</span>`}</div>
          <div class="ta-info"><b>${esc(m.name)}</b><small>${esc(m.rolle || "")}</small></div>
          <div class="ta-acts"><button class="js-up" title="Nach oben">↑</button><button class="js-tedit">Bearbeiten</button><button class="js-tdel" title="Entfernen">×</button></div>
        </div>`).join("")}</div>`).join("");
  }
  function openMember(i) {
    tEdit = i; const m = i == null ? { gruppe: "" } : team[i];
    $("#t-title").textContent = i == null ? "Person hinzufügen" : "Person bearbeiten";
    tForm.reset(); ["name", "rolle", "gruppe", "email", "telefon"].forEach((n) => (tForm[n].value = m[n] || ""));
    tPhoto = m.bild || ""; $("#t-thumb").innerHTML = tPhoto ? `<div class="thumb"><img src="${tPhoto}" alt=""></div>` : "";
    $("#t-dialog").showModal();
  }
  $("#t-photo").addEventListener("change", async (e) => { const f = e.target.files[0]; if (!f) return; tPhoto = await shrink(f, 800); $("#t-thumb").innerHTML = `<div class="thumb"><img src="${tPhoto}" alt=""></div>`; });
  $("#add-member").addEventListener("click", () => openMember(null));
  $("#t-list").addEventListener("click", (e) => {
    const c = e.target.closest(".ta-card"); if (!c) return; const i = +c.dataset.i;
    if (e.target.closest(".js-tedit")) openMember(i);
    if (e.target.closest(".js-tdel") && confirm(`${team[i].name} entfernen?`)) { team.splice(i, 1); save(); renderTeam(); }
    if (e.target.closest(".js-up")) {
      const g = team[i].gruppe; const prev = team.slice(0, i).map((m, j) => ({ m, j })).filter(({ m }) => m.gruppe === g).pop();
      if (prev) { [team[prev.j], team[i]] = [team[i], team[prev.j]]; save(); renderTeam(); }
    }
  });
  tForm.addEventListener("submit", (e) => {
    if (!tForm.name.value.trim()) { e.preventDefault(); tForm.name.focus(); return; }
    const d = { name: tForm.name.value.trim(), rolle: tForm.rolle.value.trim(), gruppe: tForm.gruppe.value.trim(), email: tForm.email.value.trim(), telefon: tForm.telefon.value.trim(), bild: tPhoto };
    if (tEdit == null) team.push(d); else Object.assign(team[tEdit], d);
    if (save()) toast("Team gespeichert."); renderTeam();
  });


  /* ---------- Website (Bilder, Video, Texte) ---------- */
  const S = window.SanisaSite;
  let siteDefaults = {}, origMedia = {};
  async function loadSiteDefaults() {
    const html = await (await fetch("index.html", { cache: "no-store" })).text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    for (const [k, f] of Object.entries(S.FIELDS)) {
      const el = doc.querySelector(f.sel);
      siteDefaults[k] = el ? (f.html ? el.innerHTML.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim() : el.textContent.trim()) : "";
    }
    const v = doc.querySelector(".stage-video");
    origMedia = {
      heroVideo: v && v.querySelector("source") ? v.querySelector("source").getAttribute("src") : "",
      heroPoster: v ? v.getAttribute("poster") : "",
      aboutImg: (doc.querySelector(S.MEDIA.aboutImg.sel) || {}).getAttribute ? doc.querySelector(S.MEDIA.aboutImg.sel).getAttribute("src") : "",
    };
  }
  function renderSiteFields() {
    const t = S.texts.get();
    $("#site-fields").innerHTML = Object.entries(S.FIELDS).map(([k, f]) => {
      const val = esc(t[k] != null && t[k] !== "" ? t[k] : siteDefaults[k] || "");
      const changed = t[k] != null && t[k] !== "" && t[k] !== siteDefaults[k];
      return `<label><span>${esc(f.label)} ${changed ? '<em class="changed">geändert</em>' : ""}</span>${f.html || (siteDefaults[k] || "").length > 70 ? `<textarea name="${k}" rows="3">${val}</textarea>` : `<input name="${k}" value="${val}">`}</label>`;
    }).join("");
  }
  async function renderSiteMedia() {
    const rows = [];
    for (const [k, m] of Object.entries(S.MEDIA)) {
      const blob = await S.media.get(k).catch(() => null);
      const src = blob ? URL.createObjectURL(blob) : origMedia[k];
      const isVideo = k === "heroVideo";
      rows.push(`
        <div class="media-row" data-k="${k}">
          <div class="media-prev">${src ? (isVideo ? `<video src="${esc(src)}" muted playsinline loop autoplay></video>` : `<img src="${esc(src)}" alt="">`) : ""}</div>
          <div class="media-info">
            <b>${esc(m.label)}</b>
            <small>${blob ? `Eigene Datei · ${(blob.size / 1048576).toFixed(1)} MB` : "Original"}</small>
            <div class="media-acts">
              <label class="btn btn-dark media-btn">${isVideo ? "Video" : "Bild"} austauschen<input type="file" accept="${m.accept}" hidden></label>
              ${blob ? '<button type="button" class="js-media-reset">Original</button>' : ""}
            </div>
          </div>
        </div>`);
    }
    $("#site-media").innerHTML = rows.join("") + '<p class="media-tip">Tipp: Videos am besten im Querformat, kurz (5–10 Sekunden) und unter 20 MB. Bilder im Querformat, mindestens 1600 Pixel breit.</p>';
  }
  $("#site-media").addEventListener("change", async (e) => {
    const inp = e.target.closest("input[type=file]"); if (!inp || !inp.files[0]) return;
    const k = inp.closest(".media-row").dataset.k, file = inp.files[0];
    if (k === "heroVideo" && file.size > 80 * 1048576) { toast("Das Video ist zu groß (max. 80 MB)."); return; }
    let blob = file;
    if (k !== "heroVideo") { const d = await shrink(file, 2400); if (d) blob = await (await fetch(d)).blob(); }
    try { await S.media.set(k, blob); toast("Gespeichert. Mit „Vorschau ansehen“ prüfen."); } catch { toast("Speichern nicht möglich (Speicher voll?)."); }
    renderSiteMedia();
  });
  $("#site-media").addEventListener("click", async (e) => {
    if (!e.target.closest(".js-media-reset")) return;
    await S.media.del(e.target.closest(".media-row").dataset.k); toast("Original wiederhergestellt."); renderSiteMedia();
  });
  $("#site-texts").addEventListener("submit", (e) => {
    e.preventDefault();
    const t = {};
    for (const k of Object.keys(S.FIELDS)) { const v = e.target[k].value.trim(); if (v && v !== siteDefaults[k]) t[k] = v; }
    if (S.texts.set(t)) toast("Texte gespeichert. Mit „Vorschau ansehen“ prüfen.");
    renderSiteFields();
  });
  $("#site-reset").addEventListener("click", () => {
    if (!confirm("Alle Text-Änderungen verwerfen?")) return;
    S.texts.set({}); renderSiteFields(); toast("Original-Texte wiederhergestellt.");
  });
  if (location.hash === "#website") $('.adm-nav [data-view="website"]').click();

  function renderAll() { renderVehicles(); renderRequests(); renderTeam(); renderSiteFields(); renderSiteMedia(); }
  Promise.all([load(), loadSiteDefaults()]).then(renderAll);
})();
