# Officielle GHS/CLP-piktogrammer

Filerna `ghs01.svg`–`ghs09.svg` er officielle GHS/CLP-farepiktogrammer:

- Rød diamantformet ramme (RGB 255,0,0)
- Hvid baggrund
- Sort symbol

## Kilde

Piktogrammerne følger **UNECE Globally Harmonized System (GHS)** og er kopieret fra vektorgrafik baseret på UNECE’s officielle EPS/GIF-filer via pakken `@ghs-hazard-pictograms/assets` (Wikimedia/UNECE-afledte SVG’er).

**UNECE reference:** https://unece.org/transport/dangerous-goods/ghs-pictograms

| Fil | GHS | Betydning |
|-----|-----|-----------|
| ghs01.svg | GHS01 | Eksplosiv |
| ghs02.svg | GHS02 | Brandfarlig |
| ghs03.svg | GHS03 | Oxiderende |
| ghs04.svg | GHS04 | Gas under tryk |
| ghs05.svg | GHS05 | Ætsende |
| ghs06.svg | GHS06 | Akut toksisk |
| ghs07.svg | GHS07 | Irriterende / sundhedsfare |
| ghs08.svg | GHS08 | Alvorlig sundhedsskade |
| ghs09.svg | GHS09 | Miljøfare |

## Opdater filer

```bash
npm install
npm run copy-ghs-symbols
```

## Manuel download fra UNECE (hvis automatisk kopiering fejler)

UNECE tilbyder **GIF** og **label (TIF)** – ikke SVG. For manuel erstatning:

1. Åbn https://unece.org/transport/dangerous-goods/ghs-pictograms  
   (alternativt https://unece.org/labels-ghs)
2. Find det ønskede piktogram (rød ramme = GHS/CLP, ikke transport-labels).
3. Højreklik på **gif** under billedet → *Gem link som…*
4. Konverter GIF til SVG med officiel rød/hvid/sort (fx Inkscape *Trace Bitmap*), eller brug GIF direkte og omdøb filtypen kun hvis I accepterer raster.
5. Gem som `public/symbols/ghs/ghs01.svg` … `ghs09.svg` i rækkefølgen ovenfor.

**Rækkefølge på UNECE-siden (GHS med rød kant, venstre mod højre):**

1. Eksplosiv → ghs01  
2. Brandfarlig → ghs02  
3. Oxiderende → ghs03  
4. Gas under tryk → ghs04  
5. Ætsende → ghs05  
6. Akut toksisk → ghs06  
7. Sundhedsfare (udråbstegn) → ghs07  
8. Alvorlig sundhedsskade (silhuet) → ghs08  
9. Miljøfare → ghs09  

PPE-ikoner ligger i `public/symbols/` (projektets egne arbejdsmiljøsymboler).
