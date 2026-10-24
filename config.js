// Alt du vil endre på siden ligger her. Endre teksten mellom anførselstegnene.
window.FEST = {
  navn: "Fredrik",
  alder: 50,

  // Dato og klokkeslett for festen (format: ÅÅÅÅ-MM-DDTTT:MM, norsk tid)
  dato: "2027-03-13T19:00",
  datoTekst: "Lørdag 13. mars 2027",   // PLASSHOLDER
  tidTekst: "Kl. 19.00 til sent",       // PLASSHOLDER
  sted: "Stedet kommer",                // PLASSHOLDER
  adresse: "Adresse kommer",            // PLASSHOLDER
  kartLenke: "",                        // f.eks. lenke fra Google Maps
  antrekk: "Pent, men komfortabelt",    // PLASSHOLDER
  svarFrist: "1. februar 2027",         // PLASSHOLDER

  velkomst:
    "Et halvt århundre skal feires! Bli med på en kveld med god mat, " +
    "gode venner, musikk og minner. Det blir ikke det samme uten deg.",

  program: [
    { tid: "19.00", tekst: "Velkomstdrink" },
    { tid: "20.00", tekst: "Middag og taler" },
    { tid: "22.00", tekst: "Musikk og dans" },
  ],

  // Portrett øverst på forsiden. Tom tekst skjuler det.
  portrett: "bilder/portrett.jpg",

  // Bilder: legg filer i mappen bilder/ og skriv filnavnene her.
  // Tom liste viser plassholdere.
  bilder: [
    { fil: "bilder/ungdom.jpg", tekst: "Ungdomstiden" },
    { fil: "bilder/brygga.jpg", tekst: "Sommer på brygga" },
    { fil: "bilder/i-squared.jpg", tekst: "På scenen med I-Squared" },
    { fil: "bilder/venner.jpg", tekst: "Med gode venner" },
    { fil: "bilder/portrett.jpg", tekst: "Fredrik i dag" },
  ],

  // Video: lim inn en YouTube- eller Vimeo-lenke. Tom tekst skjuler videoen.
  video: "",

  // Musikk: legg en mp3 i mappen musikk/ og skriv stien her.
  // Tom tekst skjuler musikkknappen.
  musikk: "",

  // Supabase (database for svar og gjestebok). Tomme verdier = demomodus
  // der innlegg bare lagres i nettleseren din.
  supabaseUrl: "",
  supabaseKey: "",
};
