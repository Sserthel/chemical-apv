# ISO 7010 påbudssymboler (PPE)

Filerna i denne mappe er **ISO 7010 mandatory action signs** (blå cirkel, hvidt piktogram):

| Fil | ISO | Betydning |
|-----|-----|-----------|
| iso-m003-ear-protection.svg | M003 | Høreværn påbudt |
| iso-m004-eye-protection.svg | M004 | Øjenbeskyttelse påbudt |
| iso-m008-safety-footwear.svg | M008 | Sikkerhedsfodtøj påbudt |
| iso-m009-protective-gloves.svg | M009 | Beskyttelseshandsker påbudt |
| iso-m010-protective-clothing.svg | M010 | Beskyttelsesbeklædning påbudt |
| iso-m013-face-shield.svg | M013 | Ansigtsskærm påbudt |
| iso-m014-head-protection.svg | M014 | Hovedværn påbudt |
| iso-m016-mask.svg | M016 | Maske påbudt |
| iso-m017-respiratory-protection.svg | M017 | Åndedrætsværn påbudt |

## Hent officielle filer

```bash
npm run copy-iso7010-ppe
```

Scriptet henter SVG fra [Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:ISO_7010_mandatory_signs) (afledt af ISO 7010).

## Manuel download

1. Gå til https://www.iso.org/obp/ui/#iso:grs:7010 (ISO Online Browsing Platform)
2. Søg efter M004, M009 osv.
3. Eksportér eller download officiel vektorgrafik
4. Gem med filnavnene ovenfor i `public/symbols/ppe/`

Hvis en fil mangler, viser appen: **ISO 7010-symbol mangler – tilføj officiel fil**

PPE-symboler er **påbud/instruktion** – ikke GHS-fareklassificering.
