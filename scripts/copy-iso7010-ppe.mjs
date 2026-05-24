import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "symbols", "ppe");

/** Wikimedia Commons: officielle ISO 7010-gebotssymboler */
const SOURCES = {
  "iso-m003-ear-protection.svg": "ISO 7010 M003.svg",
  "iso-m004-eye-protection.svg": "ISO 7010 M004.svg",
  "iso-m008-safety-footwear.svg": "ISO 7010 M008.svg",
  "iso-m009-protective-gloves.svg": "ISO 7010 M009.svg",
  "iso-m010-protective-clothing.svg": "ISO 7010 M010.svg",
  "iso-m013-face-shield.svg": "ISO 7010 M013.svg",
  "iso-m014-head-protection.svg": "ISO 7010 M014.svg",
  "iso-m016-mask.svg": "ISO 7010 M016.svg",
  "iso-m017-respiratory-protection.svg": "ISO 7010 M017.svg",
};

const UA = "Kemisk-APV/1.0 (ISO7010 setup; local dev)";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function downloadFile(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  for (const [dest, commons] of Object.entries(SOURCES)) {
    const destPath = path.join(outDir, dest);
    try {
      const title = encodeURIComponent(`File:${commons}`);
      const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${title}&prop=imageinfo&iiprop=url&format=json`;
      const json = await fetchJson(api);
      const page = Object.values(json.query.pages)[0];
      const url = page.imageinfo?.[0]?.url;
      if (!url) throw new Error(`Ingen URL for ${commons}`);
      await downloadFile(url, destPath);
      console.log(`OK ${dest} <- ${commons}`);
    } catch (err) {
      console.warn(`SKIP ${dest}: ${err instanceof Error ? err.message : err}`);
    }
    await sleep(3500);
  }

  const files = fs.readdirSync(outDir);
  console.log(`\nFærdig: ${files.length} filer i public/symbols/ppe/`);
}

main();
