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
    const { data, error } = await db.from("gjestebok").select("id, navn, tekst, created_at, gjestebok_media(sti, type), gjestebok_kommentar(id, navn, tekst, created_at, gjestebok_kommentar_media(sti, type))").order("created_at", { ascending: false }).limit(200);
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

  const husketNavn = {
    hent() { try { return localStorage.getItem("fred50_navn") || ""; } catch { return ""; } },
    lagre(n) { try { localStorage.setItem("fred50_navn", n); } catch {} },
  };

  // --- Gjestebok med bilder og video ---
  const MAKS_BYTES = 50 * 1024 * 1024;

  // Kobler en filvelger til en forhåndsvisningsliste. Returnerer de valgte filene.
  function lagVelger(input, liste, feil) {
    let filer = [];
    function vis() {
      liste.replaceChildren(...filer.map((fil, i) => {
        const li = document.createElement("li");
        const el = document.createElement(fil.type.startsWith("video") ? "video" : "img");
        el.src = URL.createObjectURL(fil);
        if (el.tagName === "VIDEO") { el.muted = true; el.playsInline = true; }
        const fjern = document.createElement("button");
        fjern.type = "button"; fjern.textContent = "×"; fjern.setAttribute("aria-label", "Fjern");
        fjern.addEventListener("click", () => { filer.splice(i, 1); vis(); });
        li.append(el, fjern);
        return li;
      }));
    }
    input.addEventListener("change", () => {
      let forStor = false;
      for (const fil of input.files) {
        if (!/^(image|video)\//.test(fil.type)) continue;
        if (fil.type.startsWith("video") && fil.size > MAKS_BYTES) { forStor = true; continue; }
        filer.push(fil);
      }
      input.value = "";
      vis();
      if (forStor) feil("Videoen er for stor (over 50 MB). Prøv et kortere klipp.");
    });
    return {
      get filer() { return filer; },
      tøm() { filer = []; vis(); },
    };
  }

  // Gjør bilder mindre før opplasting, så det går raskt på mobilnett.
  async function krympBilde(fil) {
    if (!fil.type.startsWith("image") || fil.type === "image/gif") return fil;
    try {
      const bmp = await createImageBitmap(fil, { imageOrientation: "from-image" });
      const skala = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
      const c = document.createElement("canvas");
      c.width = Math.round(bmp.width * skala); c.height = Math.round(bmp.height * skala);
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
      const blob = await new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.85));
      return blob && blob.size < fil.size ? new File([blob], "bilde.jpg", { type: "image/jpeg" }) : fil;
    } catch {
      return fil;
    }
  }

  function filendelse(fil) {
    const fraNavn = (fil.name.match(/\.([a-z0-9]{1,5})$/i) || [])[1];
    return (fraNavn || fil.type.split("/")[1] || "bin").toLowerCase();
  }

  // Laster opp filene og knytter dem til en hilsen eller en kommentar.
  async function lastOpp(tabell, kobling, filer, status) {
    const [felt, id] = Object.entries(kobling)[0];
    for (let i = 0; i < filer.length; i++) {
      status(`Laster opp ${i + 1} av ${filer.length} …`);
      const fil = await krympBilde(filer[i]);
      const sti = `${felt}-${id}/${crypto.randomUUID()}.${filendelse(fil)}`;
      const opp = await db.storage.from("gjestebok").upload(sti, fil, { contentType: fil.type });
      if (opp.error) throw opp.error;
      const { error } = await db.from(tabell).insert({
        ...kobling, sti, type: fil.type.startsWith("video") ? "video" : "bilde",
      });
      if (error) throw error;
    }
  }

  function lagMedia(media, navn) {
    const boks = document.createElement("div");
    boks.className = "hilsen-media";
    media.forEach((m) => {
      const url = db.storage.from("gjestebok").getPublicUrl(m.sti).data.publicUrl;
      if (m.type === "video") {
        const v = document.createElement("video");
        v.src = url; v.controls = true; v.playsInline = true; v.preload = "metadata";
        boks.append(v);
      } else {
        const a = document.createElement("a");
        a.href = url; a.target = "_blank"; a.rel = "noopener";
        const img = document.createElement("img");
        img.src = url; img.alt = "Bilde fra " + navn; img.loading = "lazy";
        a.append(img);
        boks.append(a);
      }
    });
    return boks;
  }

  $("gjestebok-skjema").navn.value = husketNavn.hent();
  const hilsenVelger = lagVelger($("media-input"), $("valgte"), (t) => visStatus("gjestebok-status", t, false));

  $("gjestebok-skjema").addEventListener("submit", async (e) => {
    e.preventDefault();
    const skjema = e.target;
    const knapp = skjema.querySelector("button[type=submit]");
    const fd = new FormData(skjema);
    const rad = { navn: tekst(fd, "navn"), tekst: tekst(fd, "tekst") };
    knapp.disabled = true;
    try {
      if (!db) {
        await lagre("gjestebok", rad);
      } else {
        const { data, error } = await db.from("gjestebok").insert(rad).select("id").single();
        if (error) throw error;
        if (hilsenVelger.filer.length) {
          await lastOpp("gjestebok_media", { hilsen_id: data.id }, hilsenVelger.filer, (t) => visStatus("gjestebok-status", t, true));
        }
      }
      husketNavn.lagre(rad.navn);
      visStatus("gjestebok-status", "Takk for hilsenen!", true);
      skjema.reset();
      hilsenVelger.tøm();
      await visHilsener();
    } catch (err) {
      console.error(err);
      visStatus("gjestebok-status", "Noe gikk galt. Prøv igjen litt senere.", false);
    } finally {
      knapp.disabled = false;
    }
  });

  // --- Kommentarer på innlegg ---
  let velgerNr = 0;

  function lagKommentarer(r) {
    const boks = document.createElement("div");
    boks.className = "kommentarer";
    const kommentarer = (r.gjestebok_kommentar || []).slice().sort((a, b) => a.created_at.localeCompare(b.created_at));
    if (kommentarer.length) {
      const ul = document.createElement("ul");
      kommentarer.forEach((k) => {
        const li = document.createElement("li");
        const b = document.createElement("b");
        b.textContent = k.navn + " ";
        li.append(b, document.createTextNode(k.tekst));
        const media = k.gjestebok_kommentar_media || [];
        if (media.length) li.append(lagMedia(media, k.navn));
        ul.append(li);
      });
      boks.append(ul);
    }

    const knapp = document.createElement("button");
    knapp.type = "button"; knapp.className = "svar-knapp";
    knapp.textContent = kommentarer.length ? "💬 Kommenter" : "💬 Svar";

    const id = "kommentar-media-" + ++velgerNr;
    const skjema = document.createElement("form");
    skjema.className = "kommentar-skjema"; skjema.hidden = true;
    skjema.innerHTML =
      '<input name="navn" placeholder="Navn" required maxlength="100" autocomplete="name">' +
      '<input name="tekst" placeholder="Skriv en kommentar …" required maxlength="1000">' +
      `<label class="kamera" for="${id}" title="Legg ved bilde eller video" aria-label="Legg ved bilde eller video">📷</label>` +
      `<input id="${id}" type="file" accept="image/*,video/*" multiple hidden>` +
      '<button type="submit">Send</button>' +
      '<ul class="valgte"></ul><p class="status"></p>';
    const status = skjema.querySelector(".status");
    const velger = lagVelger(skjema.querySelector("input[type=file]"), skjema.querySelector(".valgte"),
      (t) => { status.textContent = t; status.className = "status feil"; });
    skjema.navn.value = husketNavn.hent();

    knapp.addEventListener("click", () => {
      knapp.hidden = true; skjema.hidden = false;
      (skjema.navn.value ? skjema.tekst : skjema.navn).focus();
    });
    skjema.addEventListener("submit", async (e) => {
      e.preventDefault();
      const send = skjema.querySelector("button[type=submit]");
      const navn = skjema.navn.value.trim(), tekst = skjema.tekst.value.trim();
      if (!navn || !tekst) return;
      send.disabled = true;
      try {
        const { data, error } = await db.from("gjestebok_kommentar").insert({ hilsen_id: r.id, navn, tekst }).select("id").single();
        if (error) throw error;
        if (velger.filer.length) {
          await lastOpp("gjestebok_kommentar_media", { kommentar_id: data.id }, velger.filer,
            (t) => { status.textContent = t; status.className = "status ok"; });
        }
        husketNavn.lagre(navn);
        await visHilsener();
      } catch (err) {
        console.error(err);
        status.textContent = "Noe gikk galt. Prøv igjen."; status.className = "status feil";
        send.disabled = false;
      }
    });

    boks.append(knapp, skjema);
    return boks;
  }

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
        li.append(p);
        const media = r.gjestebok_media || [];
        if (media.length) li.append(lagMedia(media, r.navn));
        li.append(s);
        if (db && r.id) li.append(lagKommentarer(r));
        return li;
      }));
    } catch (err) {
      console.error(err);
    }
  }
  visHilsener();
})();
