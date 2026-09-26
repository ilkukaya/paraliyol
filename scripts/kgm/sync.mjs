#!/usr/bin/env node
/**
 * KGM tariff sync. See scripts/kgm/README.md.
 *   node scripts/kgm/sync.mjs            parse PDFs already in data/kgm-pdfs
 *   node scripts/kgm/sync.mjs --download download fresh PDFs from kgm.gov.tr first
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { KGM_PAGE, KGM_DOC_BASE, HIGHWAY_SOURCES, BRIDGE_SOURCES } from "./sources.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PDF_DIR = join(ROOT, "data", "kgm-pdfs");
const TOLL_DIR = join(ROOT, "data", "tolls");
const UA = "Mozilla/5.0 (compatible; ParaliyolTariffSync/1.0; +https://paraliyol.netlify.app)";

async function download() {
  mkdirSync(PDF_DIR, { recursive: true });
  const files = [...HIGHWAY_SOURCES.map((s) => s.file), ...Object.values(BRIDGE_SOURCES)];
  // Prefer links found on the official tariff page, fall back to the known folder layout.
  const found = new Map();
  try {
    const html = await (await fetch(KGM_PAGE, { headers: { "User-Agent": UA } })).text();
    for (const m of html.matchAll(/href="([^"]+?\.pdf)"/gi)) {
      const href = new URL(m[1].replace(/&amp;/g, "&"), KGM_PAGE).toString();
      const name = decodeURIComponent(href.split("/").pop());
      if (files.includes(name) && !found.has(name)) found.set(name, href);
    }
  } catch (e) {
    console.warn("! could not read KGM page:", e.message);
  }
  const year = new Date().getFullYear();
  for (const file of files) {
    const candidates = [
      found.get(file),
      `${KGM_DOC_BASE}/${year}Gecis_Ucret/${file}`,
      `${KGM_DOC_BASE}/${year - 1}Gecis_Ucret/${file}`,
    ].filter(Boolean);
    let ok = false;
    for (const url of candidates) {
      try {
        const res = await fetch(url, { headers: { "User-Agent": UA } });
        const buf = Buffer.from(await res.arrayBuffer());
        if (res.ok && buf.subarray(0, 4).toString() === "%PDF") {
          writeFileSync(join(PDF_DIR, file), buf);
          console.log(`↓ ${file} (${url})`);
          ok = true;
          break;
        }
      } catch {
        /* try next candidate */
      }
    }
    if (!ok) throw new Error(`download failed: ${file}`);
  }
}

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const writeJson = (p, v) => writeFileSync(p, JSON.stringify(v, null, 1) + "\n");

async function syncHighways() {
  const summary = [];
  for (const { code, file } of HIGHWAY_SOURCES) {
    const parserPath = join(ROOT, "scripts", "kgm", "parsers", `${code}.mjs`);
    const jsonPath = join(TOLL_DIR, `${code}.json`);
    if (!existsSync(parserPath) || !existsSync(jsonPath)) {
      throw new Error(`${code}: missing parser or data/tolls/${code}.json`);
    }
    const { default: parse } = await import(pathToFileURL(parserPath).href);
    const parsed = await parse(join(PDF_DIR, file));
    const data = readJson(jsonPath);
    const ids = new Set(data.stations.map((s) => s.id));
    const sectionIds = new Set(data.sections.map((s) => s.id));
    for (const sec of parsed.sections) {
      if (!sectionIds.has(sec.id)) throw new Error(`${code}: unknown section ${sec.id}`);
      for (const st of sec.stations) if (!ids.has(st)) throw new Error(`${code}: unknown station ${st}`);
      for (const [a, row] of Object.entries(sec.prices)) {
        for (const [b, p] of Object.entries(row)) {
          if (!ids.has(a) || !ids.has(b)) throw new Error(`${code}: price for unknown ${a}/${b}`);
          if (p.length !== 6 || p.some((v) => typeof v !== "number" || !(v >= 0))) {
            throw new Error(`${code}: bad price row ${a}->${b}: ${p}`);
          }
        }
      }
    }
    const merged = parsed.sections.map((sec) => {
      const old = data.sections.find((s) => s.id === sec.id);
      return { ...old, ...sec, name: sec.name ?? old?.name ?? sec.id };
    });
    const changed = JSON.stringify(data.sections) !== JSON.stringify(merged) || data.validFrom !== parsed.validFrom;
    data.sections = merged;
    if (parsed.freeFlow) data.freeFlow = parsed.freeFlow;
    data.validFrom = parsed.validFrom;
    writeJson(jsonPath, data);
    summary.push(`${code.padEnd(7)} ${parsed.validFrom} ${changed ? "UPDATED" : "unchanged"}`);
  }
  return summary;
}

async function syncBridges() {
  const { default: parse } = await import(pathToFileURL(join(ROOT, "scripts", "kgm", "parsers", "bridges.mjs")).href);
  const paths = Object.fromEntries(Object.entries(BRIDGE_SOURCES).map(([k, f]) => [k, join(PDF_DIR, f)]));
  const parsed = await parse(paths);
  const jsonPath = join(TOLL_DIR, "bridges.json");
  const bridges = readJson(jsonPath);
  let changed = false;
  for (const [id, prices] of Object.entries(parsed.bridges)) {
    const b = bridges.find((x) => x.id === id);
    if (!b) throw new Error(`bridges: unknown id ${id}`);
    if (JSON.stringify(b.prices) !== JSON.stringify(prices)) changed = true;
    b.prices = prices;
    b.validFrom = parsed.validFrom?.[id] ?? parsed.validFrom;
  }
  writeJson(jsonPath, bridges);
  return [`bridges ${changed ? "UPDATED" : "unchanged"}`];
}

if (process.argv.includes("--download")) await download();
const lines = [...(await syncHighways()), ...(await syncBridges())];
console.log(lines.join("\n"));
