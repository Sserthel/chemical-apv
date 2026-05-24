export interface SdsSearchResult {
  id: string;
  title: string;
  link: string;
  snippet: string;
  domain: string;
  isPdf: boolean;
  searchQuery: string;
  /** Mock-eksempler kan ikke hentes (404) */
  isMock?: boolean;
  /** Mange leverandørsider blokerer server-hentning – manuel upload anbefales */
  autoFetchSupported?: boolean;
}

export interface SdsSearchResponse {
  results: SdsSearchResult[];
  mode: "google" | "mock";
  disclaimer: string;
  queries: string[];
}

export type ValidationAnswer = "ja" | "nej" | "ukendt" | "";

export interface SdsOnlineValidation {
  leverandoerKorrekt: ValidationAnswer;
  produktnavnKorrekt: ValidationAnswer;
  koncentrationKorrekt: ValidationAnswer;
  sprogKorrekt: ValidationAnswer;
  versionNyNok: ValidationAnswer;
  godkendtTilBrug: ValidationAnswer;
  bekraeftet: boolean;
}

export const SDS_ONLINE_DISCLAIMER =
  "Online SDS-resultater skal verificeres mod korrekt leverandør, produktnavn, koncentration, land/sprog og versionsdato før brug.";

export const EMPTY_SDS_VALIDATION: SdsOnlineValidation = {
  leverandoerKorrekt: "",
  produktnavnKorrekt: "",
  koncentrationKorrekt: "",
  sprogKorrekt: "",
  versionNyNok: "",
  godkendtTilBrug: "",
  bekraeftet: false,
};
