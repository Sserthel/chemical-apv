import type { SdsSearchResult } from "./sds-search-types";

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "ukendt";
  }
}

function looksLikePdf(link: string, title: string): boolean {
  const lower = `${link} ${title}`.toLowerCase();
  return lower.includes(".pdf") || lower.includes("filetype:pdf");
}

/** Eksempel-resultater til demo uden Google API – kan ikke auto-hentes */
export function getMockSdsSearchResults(
  query: string,
  searchQuery: string
): SdsSearchResult[] {
  const q = encodeURIComponent(query.trim());

  const base = [
    {
      title: `[Eksempel] ${query} – sikkerhedsdatablad PDF`,
      link: `https://www.google.com/search?q=${encodeURIComponent(`${query} sikkerhedsdatablad filetype:pdf`)}`,
      snippet: `Åbn Google-søgning, find korrekt SDS hos leverandør, download PDF og upload den manuelt nedenfor. Dette er ikke et direkte PDF-link.`,
      isPdf: false,
    },
    {
      title: `[Eksempel] ${query} – SDS PDF (engelsk)`,
      link: `https://www.google.com/search?q=${encodeURIComponent(`${query} safety data sheet filetype:pdf`)}`,
      snippet: `Søg efter engelsk SDS. Download PDF fra producenten og upload manuelt.`,
      isPdf: false,
    },
    {
      title: `[Eksempel] Leverandørportal – ${query}`,
      link: `https://www.google.com/search?q=${encodeURIComponent(`${query} SDS leverandør`)}`,
      snippet: `Mange SDS ligger bag leverandørers sider. Download PDF lokalt – automatisk hentning virker ofte ikke.`,
      isPdf: false,
    },
  ];

  return base.map((item, i) => ({
    id: `mock-${searchQuery}-${i}`,
    title: item.title,
    link: item.link,
    snippet: item.snippet,
    domain: domainFromUrl(item.link),
    isPdf: item.isPdf,
    searchQuery,
    isMock: true,
    autoFetchSupported: false,
  }));
}
