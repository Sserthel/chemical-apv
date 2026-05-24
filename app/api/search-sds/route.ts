import { NextResponse } from "next/server";
import { buildSearchQueries, searchSdsWithGoogle } from "@/lib/sds-search-google";
import { getMockSdsSearchResults } from "@/lib/sds-search-mock";
import {
  SDS_ONLINE_DISCLAIMER,
  type SdsSearchResponse,
} from "@/lib/sds-search-types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { query?: string };
    const query = body.query?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Angiv mindst 2 tegn til søgning." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    const queries = buildSearchQueries(query);

    let results;
    let mode: "google" | "mock" = "mock";

    if (apiKey && engineId) {
      results = await searchSdsWithGoogle(query, apiKey, engineId);
      mode = "google";
      if (results.length === 0) {
        results = getMockSdsSearchResults(query, queries[0]);
        mode = "mock";
      }
    } else {
      const allMock = queries.flatMap((q) =>
        getMockSdsSearchResults(query, q)
      );
      const seen = new Set<string>();
      results = allMock.filter((r) => {
        if (seen.has(r.link)) return false;
        seen.add(r.link);
        return true;
      });
    }

    const response: SdsSearchResponse = {
      results,
      mode,
      disclaimer: SDS_ONLINE_DISCLAIMER,
      queries,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Søgning fejlede. Prøv igen senere." },
      { status: 500 }
    );
  }
}
