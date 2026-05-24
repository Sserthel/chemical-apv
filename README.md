# Kemisk APV

Simpel mobilvenlig webapp til kemisk arbejdspladsvurdering (APV) og sikkerhedsdatablade (SDS).

## Teknologi

- Next.js (App Router)
- TypeScript
- Tailwind CSS

## Kom i gang

```bash
npm install
npm run dev
```

Åbn [http://localhost:3000](http://localhost:3000) i browseren.

## Funktioner (MVP)

- **Forside** – hurtig adgang til søgning og seneste kemikalier
- **Søg kemikalier** – søg på navn, H-kode, CAS eller lokation
- **Kemikaliekort** – produktnavn, H-sætninger, værnemidler, risiko
- **Kemisk APV** – visning af mock APV-data
- **SDS** – link til sikkerhedsdatablad (eksterne mock-URL'er)
- **Admin** – oversigt over mock data

Data:
- Mock-kemikalier i `lib/mock-data.ts`
- Uploadede SDS-PDF'er parses i browseren (`pdfjs-dist`) og gemmes i **localStorage**

### Upload af SDS (Admin)

1. Gå til **Administration**
2. Vælg en PDF (sikkerhedsdatablad)
3. Appen udtrækker tekst og opretter kemikaliekort + APV-kladde
4. Uploadede produkter vises i søgning og på forsiden

Manglende felter vises som: *Mangler oplysninger – udfyld manuelt*.

### Kemisk risikovurdering (Admin)

1. Vælg kemikalie og udfyld arbejdsopgave-formularen på **Administration**
2. Klik **Generer kemisk risikovurdering** – udfylder fast dansk skabelon (uden AI)
3. Rediger tekst, gem, markér **Klar til gennemgang** eller **Publiceret**
4. Medarbejdere ser kun **publicerede** vurderinger på kemikaliekortet

Regelmotor: `lib/rules-engine.ts` · Generator: `generateChemicalRiskAssessment()` i `lib/generate-risk-assessment.ts`

### Online SDS-søgning (Admin)

1. Søg efter kemikalie/produktnavn (`POST /api/search-sds`)
2. Vælg selv korrekt resultat (ingen auto-valg)
3. Verificér med tjekliste + disclaimer
4. Hent PDF (`POST /api/fetch-sds-pdf`) → udtræk med `extractSdsData`
5. Ret data → gem kemikaliekort → arbejdsopgave → risikovurdering

Uden API-nøgler returneres mock-resultater. Til rigtig søgning, kopier `.env.example` til `.env.local`:

```
GOOGLE_SEARCH_API_KEY=din-nøgle
GOOGLE_SEARCH_ENGINE_ID=din-cx-id
```
