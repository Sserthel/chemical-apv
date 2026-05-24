import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pkgRoot = path.join(
  root,
  "node_modules",
  "@ghs-hazard-pictograms",
  "assets",
  "assets"
);
const outDir = path.join(root, "public", "symbols", "ghs");

const sources = {
  "ghs01.svg": "physical_hazards_pictograms/ghs01_explosive/GHS-pictogram-explos.svg",
  "ghs02.svg": "physical_hazards_pictograms/ghs02_flammable/GHS-pictogram-flamme.svg",
  "ghs03.svg": "physical_hazards_pictograms/ghs03_oxidizing/GHS-pictogram-rondflam.svg",
  "ghs04.svg": "physical_hazards_pictograms/ghs04_compressedgas/GHS-pictogram-bottle.svg",
  "ghs05.svg": "physical_hazards_pictograms/ghs05_corrosive/GHS-pictogram-acid.svg",
  "ghs06.svg": "health_hazards_pictograms/ghs06_toxic/GHS-pictogram-skull.svg",
  "ghs07.svg":
    "health_hazards_pictograms/ghs07_healthhazard_hazardoustoozonelayer/GHS-pictogram-exclam.svg",
  "ghs08.svg": "health_hazards_pictograms/ghs08_serioushealthhazard/GHS-pictogram-silhouette.svg",
  "ghs09.svg":
    "environmental_hazards_pictograms/ghs09_hazardoustotheenvironment/GHS-pictogram-pollu.svg",
};

if (!fs.existsSync(pkgRoot)) {
  console.warn(
    "Springer copy-ghs-symbols over: @ghs-hazard-pictograms/assets ikke installeret.\n" +
      "Bruger eksisterende filer i public/symbols/ghs/ – se README.md for manuel UNECE-download."
  );
  process.exit(0);
}

fs.mkdirSync(outDir, { recursive: true });

for (const [dest, rel] of Object.entries(sources)) {
  const src = path.join(pkgRoot, rel);
  if (!fs.existsSync(src)) {
    console.error(`Mangler kildefil: ${rel}`);
    process.exit(1);
  }
  fs.copyFileSync(src, path.join(outDir, dest));
  console.log(`Kopieret ${dest}`);
}

console.log("Færdig – officielle GHS/CLP-piktogrammer i public/symbols/ghs/");
