import type { Chemical, ChemicalApv } from "./types";

export const chemicals: Chemical[] = [
  {
    id: "chem-001",
    productName: "Acetone",
    casNumber: "67-64-1",
    location: "Værksted – rengøring",
    hStatements: ["H225", "H319", "H336"],
    protectiveEquipment: [
      "Beskyttelsesbriller",
      "Nitrilhandsker",
      "God ventilation",
    ],
    risk: "middel",
    riskDescription: "Brandfarlig væske. Kan irritere øjne og give sløvhed ved indånding.",
    sdsUrl: "https://example.com/sds/acetone.pdf",
  },
  {
    id: "chem-002",
    productName: "Saltsyre 10%",
    casNumber: "7647-01-0",
    location: "Laboratorium",
    hStatements: ["H290", "H314", "H335"],
    protectiveEquipment: [
      "Ansigtsskærm",
      "Syrebestandige handsker",
      "Kemikaliebestandigt forklæde",
    ],
    risk: "høj",
    riskDescription: "Ætsende. Alvorlig øjenskade og hudforbrænding ved kontakt.",
    sdsUrl: "https://example.com/sds/saltsyre.pdf",
  },
  {
    id: "chem-003",
    productName: "Desinfektionssprit 70%",
    location: "Kantine / førstehjælp",
    hStatements: ["H225", "H319"],
    protectiveEquipment: ["Beskyttelsesbriller", "Ventileret område"],
    risk: "lav",
    riskDescription: "Brandfarlig ved høj koncentration. Let irriterende for øjne.",
    sdsUrl: "https://example.com/sds/sprit70.pdf",
  },
  {
    id: "chem-004",
    productName: "Sæbeopløsning pH-neutral",
    location: "Rengøring",
    hStatements: ["H319"],
    protectiveEquipment: ["Beskyttelsesbriller ved sprøjt"],
    risk: "lav",
    riskDescription: "Lav risiko ved normal brug. Kan irritere øjne ved direkte kontakt.",
    sdsUrl: "https://example.com/sds/saebe.pdf",
  },
  {
    id: "chem-005",
    productName: "Epoxyhærder B-komponent",
    casNumber: "100-51-6",
    location: "Produktion",
    hStatements: ["H315", "H317", "H319", "H332"],
    protectiveEquipment: [
      "Kemikaliebestandige handsker",
      "Beskyttelsesbriller",
      "Åndedrætsværn ved støv/damp",
    ],
    risk: "middel",
    riskDescription: "Sensibiliserende. Hud- og øjenirritation. Kan give allergi ved gentagen eksponering.",
    sdsUrl: "https://example.com/sds/epoxy-hardener.pdf",
  },
];

export const apvRecords: ChemicalApv[] = [
  {
    chemicalId: "chem-001",
    workplace: "Værksted – rengøring",
    assessedBy: "Arbejdsmiljørepræsentant",
    assessedDate: "2025-11-15",
    summary:
      "Acetone bruges til affedtning af metaldele. Eksponering er kortvarig og lokal.",
    sections: [
      {
        title: "Anvendelse",
        items: [
          "Affedtning af små metaldele",
          "Maks. 2 liter pr. uge",
          "Kun i ventileret zone",
        ],
      },
      {
        title: "Eksponering",
        items: [
          "Hudkontakt: mulig ved hældning",
          "Indånding: lav ved punktudsug",
          "Ingen større mængder opbevares ved arbejdsplads",
        ],
      },
    ],
    measures: [
      "Brug altid nitrilhandsker og briller",
      "Hold beholder lukket",
      "Affald i lukket metalbeholder",
      "Gennemgå APV ved ændret arbejdsgang",
    ],
  },
  {
    chemicalId: "chem-002",
    workplace: "Laboratorium",
    assessedBy: "Laboratorieleder",
    assessedDate: "2025-09-01",
    summary:
      "Saltsyre bruges til pH-justering. Høj risiko kræver skriftlig instruktion og træning.",
    sections: [
      {
        title: "Anvendelse",
        items: [
          "pH-justering af prøver",
          "Kun uddannet personale",
          "Tilføj altid syre til vand – aldrig omvendt",
        ],
      },
      {
        title: "Eksponering",
        items: [
          "Sprøjtfare ved omrøring",
          "Ætsning ved spild",
          "Nødbruser og øjenskyl inden for 10 m",
        ],
      },
    ],
    measures: [
      "Obligatorisk ansigtsskærm og syrehandsker",
      "Spildbakke under arbejde",
      "Træning årligt",
      "SDS tilgængelig ved arbejdsplads",
    ],
  },
  {
    chemicalId: "chem-003",
    workplace: "Kantine / førstehjælp",
    assessedBy: "Sikkerhedskoordinator",
    assessedDate: "2026-01-10",
    summary: "Desinfektion til overflader. Lav risiko ved korrekt opbevaring.",
    sections: [
      {
        title: "Anvendelse",
        items: ["Overfladedesinfektion", "Ikke til huddesinfektion på større flader"],
      },
      {
        title: "Eksponering",
        items: ["Kortvarig kontakt", "Brandfare ved åben flamme"],
      },
    ],
    measures: [
      "Opbevar væk fra varmekilder",
      "Brug briller ved sprøjtning",
    ],
  },
  {
    chemicalId: "chem-004",
    workplace: "Rengøring",
    assessedBy: "Facilitetsleder",
    assessedDate: "2025-06-20",
    summary: "Daglig rengøring. Standard værnemidler ved behov.",
    sections: [
      {
        title: "Anvendelse",
        items: ["Gulv- og overfladerengøring", "Fortyndes efter anvisning"],
      },
      {
        title: "Eksponering",
        items: ["Hudkontakt ved gentagen brug uden handsker"],
      },
    ],
    measures: ["Handsker ved langvarig kontakt", "Skyl ved øjenkontakt"],
  },
  {
    chemicalId: "chem-005",
    workplace: "Produktion",
    assessedBy: "Produktionschef",
    assessedDate: "2025-12-05",
    summary:
      "Epoxyhærder bruges ved limning. Allergirisiko ved gentagen eksponering.",
    sections: [
      {
        title: "Anvendelse",
        items: [
          "Blanding med epoxyresin",
          "Maks. 4 timer/dag i blandezonen",
        ],
      },
      {
        title: "Eksponering",
        items: [
          "Hudkontakt ved håndtering",
          "Damp ved opvarmning",
          "Sensibilisering over tid",
        ],
      },
    ],
    measures: [
      "Engangshandsker skiftes ved hver pause",
      "Hudcreme og vask efter arbejde",
      "Helbredsundersøgelse ved mistanke om allergi",
      "Erstatningsprodukt vurderes årligt",
    ],
  },
];

export function getChemicalById(id: string): Chemical | undefined {
  return chemicals.find((c) => c.id === id);
}

export function getApvByChemicalId(id: string): ChemicalApv | undefined {
  return apvRecords.find((a) => a.chemicalId === id);
}

export function searchChemicals(query: string): Chemical[] {
  const q = query.trim().toLowerCase();
  if (!q) return chemicals;
  return chemicals.filter(
    (c) =>
      c.productName.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      c.hStatements.some((h) => h.toLowerCase().includes(q)) ||
      (c.casNumber?.toLowerCase().includes(q) ?? false)
  );
}
