// Alt du vil endre på siden ligger her. Endre teksten mellom anførselstegnene.
window.FEST = {
  navn: "Fredrik",
  alder: 50,

  // Dato og klokkeslett for festen (format: ÅÅÅÅ-MM-DDTTT:MM, norsk tid)
  dato: "2027-04-24T16:00",
  datoTekst: "Lørdag 24. april 2027",
  tidTekst: "Fra kl. 16.00",
  sted: "Liwligs lokaler i Vika",
  adresse: "Vika, Oslo",
  kartLenke: "https://www.google.com/maps/search/?api=1&query=Liwlig+Vika+Oslo",
  antrekk: "CAYA – kom som du er",
  svarFrist: "15. januar 2027",

  velkomst:
    "Et halvt århundre skal feires! Bli med på en kveld med god mat, " +
    "gode venner, musikk og minner. Det blir ikke det samme uten deg.",

  // PLASSHOLDER: tidene i programmet er gjetninger
  program: [
    { tid: "16.00", tekst: "Velkomstdrink" },
    { tid: "18.00", tekst: "Middag og taler" },
    { tid: "22.00", tekst: "Musikk og dans" },
  ],

  // Bakgrunnsbilde bak teksten øverst på forsiden. Tom tekst gir mørk bakgrunn.
  bakgrunn: "bilder/bakgrunn.jpg",
  fotoKreditt: "Foto: Emo Jørgensen",

  // Rundt portrett på forsiden. Tom tekst skjuler det.
  portrett: "",

  // Bilder: legg filer i mappen bilder/ og skriv filnavnene her.
  // Vil du ha bildetekst, skriv { fil: "bilder/x.jpg", tekst: "..." }.
  // Tom liste viser plassholdere.
  bilder: [
    "bilder/ungdom.jpg",
    "bilder/skate.jpg",
    "bilder/skate3.jpg",
    "bilder/skate2.jpg",
    "bilder/skate5.jpg",
    "bilder/pinto.jpg",
    "bilder/mald.jpg",
    "bilder/six2.jpg",
    "bilder/six.jpg",
    "bilder/brygga.jpg",
    "bilder/la2.jpg",
    "bilder/la.jpg",
    "bilder/nyc.jpg",
    "bilder/nyc2.jpg",
    "bilder/nyc3.jpg",
    "bilder/sykkel.jpg",
    "bilder/iceman.jpg",
    "bilder/ghost.jpg",
    "bilder/putin.jpg",
    "bilder/venner.jpg",
    "bilder/i-squared.jpg",
    "bilder/portrett.jpg",
  ],

  // Video: lim inn en YouTube- eller Vimeo-lenke. Tom tekst skjuler videoen.
  video: "",

  // Musikk: legg en mp3 i mappen musikk/ og skriv stien her.
  // Tom tekst skjuler musikkknappen.
  musikk: "",

  // Supabase (database for svar og gjestebok). Tomme verdier = demomodus
  // der innlegg bare lagres i nettleseren din.
  supabaseUrl: "https://nrgsmolzahazhrmeutfi.supabase.co",
  supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZ3Ntb2x6YWhhemhybWV1dGZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4MzAyNTcsImV4cCI6MjEwODQwNjI1N30.rtPmspS1jaDw-EPl5UXFcLsa0Rn_Q0sMhyBwXAOU8gs",
};
