import { chemicals } from "./mock-data";
import {
  chemicalToSdsData,
  generateChemicalRiskAssessment,
} from "./generate-risk-assessment";
import { EMPTY_WORK_TASK, type ChemicalRiskAssessment } from "./risk-assessment-types";

function enrichSdsForDemo(
  sds: ReturnType<typeof chemicalToSdsData>,
  chemicalId: string
): ReturnType<typeof chemicalToSdsData> {
  if (chemicalId === "chem-001") {
    return {
      ...sds,
      signalWord: "Fare",
      ppe: {
        ...sds.ppe,
        handProtection: "Nitrilhandsker",
        eyeProtection: "Sikkerhedsbriller",
        ventilation: "God ventilation",
      },
      firstAid: {
        inhalation: "Flyt personen til frisk luft. Søg læge ved ubehag.",
        skin: "Skyl med vand. Fjern forurenet tøj.",
        eyes: "Skyl straks med vand i mindst 15 minutter. Søg læge.",
        ingestion: "Skyl munden. Søg læge – drik ikke mælk.",
      },
      spillResponse:
        "Afspær området. Absorber med inert materiale. Ventiler. Kontakt ansvarlig.",
    };
  }
  if (chemicalId === "chem-002") {
    return {
      ...sds,
      signalWord: "Fare",
      ppe: {
        ...sds.ppe,
        handProtection: "Syrebestandige handsker",
        eyeProtection: "Ansigtsskærm og beskyttelsesbriller",
        skinProtection: "Kemikaliebestandigt forklæde",
      },
      firstAid: {
        inhalation: "Flyt til frisk luft. Søg læge ved hoste eller åndenød.",
        skin: "Skyl straks med rigeligt vand i mindst 15 min. Fjern forurenet tøj.",
        eyes: "Skyl straks med vand i mindst 15 min. Kontakt øjenlæge.",
        ingestion: "Skyl munden. Drik IKKE vand. Søg akut læge.",
      },
      spillResponse:
        "Afspær området. Neutraliser forsigtigt. Opsug med inert materiale. Kontakt ansvarlig.",
    };
  }
  return sds;
}

/** Publicerede demo-APV'er til medarbejdervisning (kun når localStorage er tom). */
export function getMockPublishedRiskAssessments(): ChemicalRiskAssessment[] {
  const seeds: Array<{
    chemicalId: string;
    workTask: Partial<typeof EMPTY_WORK_TASK>;
  }> = [
    {
      chemicalId: "chem-001",
      workTask: {
        arbejdsopgave: "Affedtning af metaldele med acetone",
        afdeling: "Værksted – rengøring",
        vaernemidler: "Nitrilhandsker, beskyttelsesbriller",
        ventilation: "Naturlig ventilation – hold dør åben",
        affaldSpild: "Absorber spild. Ventiler området. Kontakt leder.",
        risikoHudkontakt: "middel",
        risikoIndaanding: "lav",
        risikoOejnkontakt: "middel",
      },
    },
    {
      chemicalId: "chem-002",
      workTask: {
        arbejdsopgave: "Rengøring af overflader med saltsyre 10%",
        afdeling: "Laboratorium",
        vaernemidler: "Syrebestandige handsker, ansigtsskærm, forklæde",
        ventilation: "Driftsklar punktudsugning",
        punktudsugning: "ja",
        affaldSpild: "Afspær. Neutraliser. Opsug. Kontakt arbejdsmiljøansvarlig.",
        risikoHudkontakt: "høj",
        risikoIndaanding: "middel",
        risikoOejnkontakt: "høj",
      },
    },
  ];

  const now = "2025-11-01T08:00:00.000Z";

  return seeds.map(({ chemicalId, workTask }) => {
    const chemical = chemicals.find((c) => c.id === chemicalId);
    if (!chemical) {
      throw new Error(`Mock chemical ${chemicalId} missing`);
    }

    const sds = enrichSdsForDemo(chemicalToSdsData(chemical), chemicalId);
    const assessment = generateChemicalRiskAssessment(
      sds,
      { ...EMPTY_WORK_TASK, ...workTask },
      chemicalId
    );

    return {
      ...assessment,
      id: `ra-mock-${chemicalId}`,
      status: "publiceret" as const,
      productName: chemical.productName,
      createdAt: now,
      updatedAt: now,
    };
  });
}

export function ensureMockRiskAssessmentsSeeded(): void {
  if (typeof window === "undefined") return;
  const key = "kemisk-apv-risk-assessments";
  const seededKey = "kemisk-apv-mock-ra-seeded";
  try {
    const raw = localStorage.getItem(key);
    const existing = raw ? (JSON.parse(raw) as ChemicalRiskAssessment[]) : [];
    if (Array.isArray(existing) && existing.length > 0) return;
    if (localStorage.getItem(seededKey)) return;

    const mocks = getMockPublishedRiskAssessments();
    localStorage.setItem(key, JSON.stringify(mocks));
    localStorage.setItem(seededKey, "1");
  } catch {
    // ignore storage errors
  }
}
