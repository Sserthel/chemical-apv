import type {
  RuleFlag,
  RuleFlagId,
  SdsDataForAssessment,
  WorkTaskData,
} from "./risk-assessment-types";
import { SUGGESTION_PREFIX } from "./sds-suggestions";

function hasHCode(codes: string[], patterns: RegExp[]): boolean {
  return codes.some((c) => patterns.some((p) => p.test(c.toUpperCase())));
}

const CMR_CODES = [/^H340/, /^H341/, /^H350/, /^H351/, /^H360/, /^H361/, /^H362/];
const FLAMMABLE_CODES = [/^H22[24568]/, /^H228/];
const H314 = [/^H314/];
const H290 = [/^H290/];
const SUBSTITUTION_CODES = [/^H340/, /^H350/, /^H360/];
const FIRE_PREVENTION_CODES = [/^H225/, /^H226/];

export function evaluateRules(
  sds: SdsDataForAssessment,
  work: WorkTaskData
): RuleFlag[] {
  const flags: RuleFlag[] = [];
  const h = sds.hStatements;

  const add = (
    id: RuleFlagId,
    label: string,
    detail: string,
    isSuggestion = true
  ) => {
    if (!flags.some((f) => f.id === id))
      flags.push({ id, label, detail, isSuggestion });
  };

  if (hasHCode(h, CMR_CODES)) {
    add(
      "cmr_særlig_vurdering",
      "CMR-stof kræver særlig vurdering",
      `H-sætninger i SDS: ${h.filter((x) => CMR_CODES.some((p) => p.test(x))).join(", ") || "se SDS sektion 2"}.`
    );
  }

  if (hasHCode(h, FLAMMABLE_CODES)) {
    add(
      "brandfarligt_antændelseskontrol",
      "Brandfarligt produkt kræver antændelseskontrol",
      `H-sætninger i SDS: ${h.filter((x) => FLAMMABLE_CODES.some((p) => p.test(x))).join(", ")}.`
    );
  }

  if (work.procesType === "åben" && work.punktudsugning === "nej") {
    add(
      "åben_proces_ventilation",
      "Åben proces uden punktudsugning kræver vurdering af ventilation",
      "Arbejdsopgave: åben proces uden punktudsugning. Sammenhold med SDS sektion 8 (ventilation)."
    );
  }

  if (work.sprayAerosol === "ja") {
    add(
      "spray_inhalationsrisiko",
      "Spray/aerosol øger inhalationsrisiko",
      "Arbejdsopgave angiver sprøjtning/aerosol."
    );
  }

  if (work.opvarmning === "ja") {
    add(
      "opvarmning_dampeksponering",
      "Opvarmning øger dampeksponering",
      "Arbejdsopgave angiver opvarmning."
    );
  }

  if (
    work.risikoHudkontakt.trim() ||
    hasHCode(h, [/^H31[0-8]/, /^H315/, /^H317/])
  ) {
    add(
      "hudkontakt_handsker",
      "Hudkontakt kræver egnede handsker",
      work.risikoHudkontakt.trim()
        ? `Arbejdsopgave: ${work.risikoHudkontakt}`
        : "SDS sektion 2/8: H-sætninger om hudkontakt."
    );
  }

  if (hasHCode(h, H314)) {
    add(
      "h314_øjenskyl_ansigtsskærm",
      "H314 kræver øjenskyl og ansigtsskærm",
      "H314 i SDS sektion 2. Se også SDS sektion 4 (øjne) og 8 (øjenbeskyttelse)."
    );
  }

  if (hasHCode(h, SUBSTITUTION_CODES)) {
    add(
      "h350_h340_h360_substitution",
      "H350/H340/H360 kræver substitutionsovervejelse",
      `H-sætninger i SDS: ${h.filter((x) => SUBSTITUTION_CODES.some((p) => p.test(x))).join(", ")}.`
    );
  }

  if (hasHCode(h, FIRE_PREVENTION_CODES)) {
    add(
      "h225_h226_brandforebyggelse",
      "H225/H226 kræver brandforebyggelse",
      `H-sætninger i SDS: ${h.filter((x) => FIRE_PREVENTION_CODES.some((p) => p.test(x))).join(", ")}. Se SDS sektion 5.`
    );
  }

  if (hasHCode(h, H290)) {
    add(
      "h290_materialekompatibilitet",
      "H290 kræver vurdering af materialekompatibilitet",
      "H290 i SDS. Se SDS sektion 10 (uforenelige materialer)."
    );
  }

  if (sds.missingFields.length > 0) {
    add(
      "manglende_sds_data",
      "Manglende SDS-data skal markeres tydeligt",
      `Ikke udtrukket fra SDS: ${sds.missingFields.join("; ")}.`,
      false
    );
  }

  return flags;
}

export function formatRuleAsSuggestion(flag: RuleFlag): string {
  return `${SUGGESTION_PREFIX}: ${flag.label}. ${flag.detail}`;
}
