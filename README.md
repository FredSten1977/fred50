# Fredrik 50 år

Invitasjonsside for 50-årsdagen: info om festen, nedtelling, bilder, video,
musikk, svar på invitasjonen (RSVP) og gjestebok.

Siden er helt statisk (HTML, CSS og JavaScript) og trenger ingen bygging.
Svar og gjestebok lagres i [Supabase](https://supabase.com) (gratis).

## Endre innholdet

Nesten alt står i **`config.js`**: dato, sted, program, tekster, bilder,
video og musikk. Endre teksten, lagre, og siden oppdateres.

- **Bilder:** legg filene i `bilder/` og før dem opp i `bilder` i `config.js`.
  Gjør dem gjerne mindre enn ca. 500 KB hver (f.eks. med squoosh.app).
- **Video:** lim inn en YouTube- eller Vimeo-lenke i `video`. Last videoen opp
  som «Ikke oppført» (unlisted) på YouTube hvis den ikke skal være offentlig.
- **Musikk:** legg en mp3 i `musikk/` og skriv f.eks. `"musikk/sang.mp3"`.
  Nettlesere lar ikke sider spille av lyd automatisk, så gjestene får en
  «Spill musikk»-knapp nede til høyre. Bruk musikk du har lov til å dele.

Uten Supabase-nøkler kjører siden i *demomodus*: alt virker, men innlegg
lagres bare i nettleseren til den som skriver.

## 1. Sette opp Supabase (database)

1. Logg inn på [supabase.com](https://supabase.com) og trykk **New project**.
   Kall det `fred50`, velg region **West EU (Ireland)** og et sterkt
   databasepassord (lagre det et trygt sted).
2. Når prosjektet er klart: gå til **SQL Editor → New query**, lim inn hele
   innholdet i [`supabase/schema.sql`](supabase/schema.sql) og trykk **Run**.
3. Gå til **Project Settings → API**. Kopier **Project URL** og
   **anon / publishable key** inn i `supabaseUrl` og `supabaseKey` i
   `config.js`. Disse nøklene er laget for å ligge åpent i nettsider; databasen
   er låst slik at gjester bare kan sende svar og lese/skrive i gjesteboka.
   Bruk **aldri** `service_role`-nøkkelen her.

**Se hvem som kommer:** i Supabase, åpne **Table Editor → rsvp**. For en rask
opptelling, kjør `select * from rsvp_oversikt;` i SQL Editor.
**Fjerne en upassende hilsen:** Table Editor → gjestebok → slett raden.

## 2. Publisere siden

### Netlify (anbefalt)

1. Logg inn på [netlify.com](https://netlify.com) med GitHub-kontoen din.
2. **Add new site → Import an existing project → GitHub** og velg `fred50`.
3. La byggefeltene stå tomme (filen `netlify.toml` tar seg av resten) og
   trykk **Deploy**.
4. Under **Site configuration → Change site name** kan du velge f.eks.
   `fredrik50.netlify.app`. Hver gang endringer kommer inn i GitHub,
   oppdateres siden automatisk.

### Alternativ: GitHub Pages

Repo → **Settings → Pages** → *Deploy from a branch*, velg hovedgrenen og
mappen `/ (root)`. Siden havner på `https://fredsten1977.github.io/fred50/`.

## Teste lokalt

Åpne `index.html` i nettleseren, eller kjør `python3 -m http.server` i mappen
og gå til <http://localhost:8000>.
