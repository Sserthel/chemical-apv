import type { SdsSearchResult } from "./sds-search-types";

interface GoogleSearchItem {
  title?: string;
  link?: string;
  snippet?: string;
  mime?: string;
  fileFormat?: string;
}

interface GoogleSearchResponse {
  items?: GoogleSearchItem[];
}

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "ukendt";
  }
}

function isPdfResult(item: GoogleSearchItem): boolean {
  const link = (item.link ?? "").toLowerCase();
  const mime = (item.mime ?? item.fileFormat ?? "").toLowerCase();
  return link.endsWith(".pdf") || mime.includes("pdf");
}

export function buildSearchQueries(term: string): string[] {
  const t = term.trim();
  return [
    `${t} sikkerhedsdatablad PDF`,
    `${t} SDS PDF`,
    `${t} safety data sheet PDF`,
  ];
}

export async function searchSdsWithGoogle(
  query: string,
  apiKey: string,
  engineId: string
): Promise<SdsSearchResult[]> {
  const queries = buildSearchQueries(query);
  const seen = new Set<string>();
  const results: SdsSearchResult[] = [];

  for (const searchQuery of queries) {
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("cx", engineId);
    url.searchParams.set("q", searchQuery);
    url.searchParams.set("num", "8");

    const res = await fetch(url.toString(), { next: { revalidate: 0 } });
    if (!res.ok) continue;

    const data = (await res.json()) as GoogleSearchResponse;
    for (const item of data.items ?? []) {
      if (!item.link || !item.title) continue;
      if (seen.has(item.link)) continue;
      seen.add(item.link);

      const isPdf = isPdfResult(item);
      results.push({
        id: `g-${item.link.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32)}`,
        title: item.title,
        link: item.link,
        snippet: item.snippet ?? "",
        domain: domainFromUrl(item.link),
        isPdf,
        searchQuery,
        isMock: false,
        autoFetchSupported: isPdf,
      });
    }
  }

  return results;
}
