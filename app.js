(function () {
  const F = window.FEST;
  const $ = (id) => document.getElementById(id);
  const sett = (id, tekst) => { $(id).textContent = tekst; };

  // --- Innhold fra config.js ---
  sett("navn", F.navn);
  sett("alder", F.alder);
  sett("hero-dato", F.datoTekst + " · " + F.sted);
  sett("velkomst", F.velkomst);
  sett("info-dato", F.datoTekst);
  sett("info-tid", F.tidTekst);
  sett("info-sted", F.sted);
  sett("info-adresse", F.adresse);
  sett("info-antrekk", F.antrekk);
  sett("svarfrist", F.svarFrist);
  document.title = F.navn + " " + F.alder + " år";
  if (F.bakgrunn) {
    $("hero").style.setProperty("--bakgrunn", "url('" + F.bakgrunn + "')");
    $("hero").classList.add("med-bilde");
  }
  if (F.fotoKreditt) { sett("kreditt", F.fotoKreditt); $("kreditt").hidden = false; }
  if (F.portrett) { $("portrett").src = F.portrett; $("portrett").hidden = false; }
  if (F.kartLenke) { $("info-kart").href = F.kartLenke; $("info-kart").hidden = false; }

  const program = $("program");
  F.program.forEach((p) => {
    const li = document.createElement("li");
    const b = document.createElement("b");
    b.textContent = p.tid;
    li.append(b, document.createTextNode(p.tekst));
    program.append(li);
  });

  // --- Nedtelling ---
  const maal = new Date(F.dato);
  function oppdaterNedtelling() {
    const ms = maal - new Date();
    const boks = $("nedtelling");
    if (ms <= 0) { boks.textContent = "Festen er i gang! 🥂"; return; }
    const deler = [
      [Math.floor(ms / 864e5), "dager"],
      [Math.floor(ms / 36e5) % 24, "timer"],
      [Math.floor(ms / 6e4) % 60, "min"],
      [Math.floor(ms / 1e3) % 60, "sek"],
    ];
    boks.innerHTML = deler.map(([n, t]) => `<div><b>${n}</b><span>${t}</span></div>`).join("");
  }
  oppdaterNedtelling();
  setInterval(oppdaterNedtelling, 1000);

  // --- Bilder ---
  const galleri = $("galleri");
  const bilder = F.bilder.length ? F.bilder : Array.from({ length: 6 }, (_, i) => ({ tekst: "Bilde " + (i + 1) + " kommer" }));
  bilder.map((b) => typeof b === "string" ? { fil: b } : b).forEach((b) => {
    const fig = document.createElement("figure");
    if (b.fil) {
      const img = document.createElement("img");
      img.src = b.fil; img.alt = b.tekst || ""; img.loading = "lazy";
      fig.append(img);
    } else {
      const plass = document.createElement("div");
      plass.className = "plass"; plass.textContent = "📷";
      fig.append(plass);
    }
    if (b.tekst) {
      const cap = document.createElement("figcaption");
      cap.textContent = b.tekst;
      fig.append(cap);
    }
    galleri.append(fig);
  });

  // --- Video (YouTube / Vimeo) ---
  function embedUrl(url) {
    let m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
    if (m) return "https://www.youtube-nocookie.com/embed/" + m[1];
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return "https://player.vimeo.com/video/" + m[1];
    return null;
  }
  const videoUrl = F.video && embedUrl(F.video);
  if (videoUrl) {
    const iframe = document.createElement("iframe");
    iframe.src = videoUrl;
    iframe.title = "Video";
    iframe.allow = "autoplay; fullscreen; picture-in-picture";
    iframe.allowFullscreen = true;
    $("video").append(iframe);
    $("video").hidden = false;
  }

  // --- Musikk (nettlesere tillater ikke autoavspilling, så gjesten trykker selv) ---
  if (F.musikk) {
    const lyd = $("musikk"), knapp = $("musikk-knapp");
    lyd.src = F.musikk;
    knapp.hidden = false;
    knapp.addEventListener("click", () => {
      if (lyd.paused) { lyd.play(); knapp.textContent = "❚❚ Pause musikk"; knapp.setAttribute("aria-pressed", "true"); }
      else { lyd.pause(); knapp.textContent = "♪ Spill musikk"; knapp.setAttribute("aria-pressed", "false"); }
    });
  }

  // --- Lagring: Supabase, eller nettleseren i demomodus ---
  const db = F.supabaseUrl && F.supabaseKey && window.supabase
    ? window.supabase.createClient(F.supabaseUrl, F.supabaseKey)
    : null;
  if (!db) $("demo-varsel").hidden = false;

  const lokal = {
    hent(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } },
    legg(k, rad) { try { localStorage.setItem(k, JSON.stringify([rad, ...lokal.hent(k)])); } catch {} },
  };

  async function lagre(tabell, rad) {
    if (!db) { lokal.legg("fred50_" + tabell, { ...rad, created_at: new Date().toISOString() }); return; }
    const { error } = await db.from(tabell).insert(rad);
    if (error) throw error;
  }

  async function hentGjester() {
    if (!db) return lokal.hent("fred50_rsvp").filter((r) => r.kommer).reverse();
    const { data, error } = await db.rpc("gjesteliste");
    if (error) throw error;
    return data;
  }

  async function visGjester() {
    try {
      const gjester = await hentGjester();
      $("gjesteliste").replaceChildren(...gjester.map((g) => {
        const li = document.createElement("li");
        li.textContent = g.navn;
        return li;
      }));
      $("gjester-tom").hidden = gjester.length > 0;
    } catch (err) {
      console.error(err);
    }
  }
  visGjester();

  async function hentHilsener() {
    if (!db) return lokal.hent("fred50_gjestebok");
    const { data, error } = await db.from("gjestebok").select("navn, tekst, created_at").order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return data;
  }

  function visStatus(id, tekst, ok) {
    const el = $(id);
    el.textContent = tekst;
    el.className = "status " + (ok ? "ok" : "feil");
  }

  function koblesTil(skjemaId, statusId, tilRad, tabell, okTekst, etter) {
    const skjema = $(skjemaId);
    skjema.addEventListener("submit", async (e) => {
      e.preventDefault();
      const knapp = skjema.querySelector("button");
      knapp.disabled = true;
      try {
        const rad = tilRad(new FormData(skjema));
        await lagre(tabell, rad);
        visStatus(statusId, okTekst(rad), true);
        skjema.reset();
        if (etter) await etter();
      } catch (err) {
        console.error(err);
        visStatus(statusId, "Noe gikk galt. Prøv igjen litt senere.", false);
      } finally {
        knapp.disabled = false;
      }
    });
  }

  const tekst = (fd, k) => (fd.get(k) || "").toString().trim();

  koblesTil("rsvp-skjema", "rsvp-status", (fd) => ({
    navn: tekst(fd, "navn"),
    epost: tekst(fd, "epost") || null,
    kommer: fd.get("kommer") === "ja",
    antall: fd.get("kommer") === "ja" ? Math.max(1, parseInt(fd.get("antall"), 10) || 1) : 0,
    allergier: tekst(fd, "allergier") || null,
    melding: tekst(fd, "melding") || null,
  }), "rsvp", (r) => r.kommer ? `Takk, ${r.navn}! Gleder meg til å se deg. 🎉` : `Takk for beskjed, ${r.navn}. Du blir savnet!`, visGjester);

  koblesTil("gjestebok-skjema", "gjestebok-status", (fd) => ({
    navn: tekst(fd, "navn"),
    tekst: tekst(fd, "tekst"),
  }), "gjestebok", () => "Takk for hilsenen!", visHilsener);

  async function visHilsener() {
    const liste = $("hilsener");
    try {
      const rader = await hentHilsener();
      liste.replaceChildren(...rader.map((r) => {
        const li = document.createElement("li");
        const p = document.createElement("p");
        p.textContent = r.tekst;
        const s = document.createElement("small");
        s.textContent = "– " + r.navn + ", " + new Date(r.created_at).toLocaleDateString("no-NO", { day: "numeric", month: "long", year: "numeric" });
        li.append(p, s);
        return li;
      }));
    } catch (err) {
      console.error(err);
    }
  }
  visHilsener();
})();
