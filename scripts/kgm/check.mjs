#!/usr/bin/env node
// Verifies every parser reproduces data/tolls/*.json from the PDFs in data/kgm-pdfs (no writes).
import { existsSync, readFileSync } from "fs";
import { isDeepStrictEqual } from "util";
import { HIGHWAY_SOURCES } from "./sources.mjs";
let bad = 0;
for (const { code, file } of HIGHWAY_SOURCES) {
  const parser = `./parsers/${code}.mjs`;
  if (!existsSync(new URL(parser, import.meta.url))) { console.log(`${code}: no parser`); bad++; continue; }
  if (!existsSync(`data/tolls/${code}.json`)) { console.log(`${code}: no json`); bad++; continue; }
  const { default: parse } = await import(parser);
  const got = await parse(`data/kgm-pdfs/${file}`);
  const want = JSON.parse(readFileSync(`data/tolls/${code}.json`, "utf8"));
  const strip = (secs) => secs.map(({ id, stations, prices }) => ({ id, stations, prices }));
  const ok = got.validFrom === want.validFrom && isDeepStrictEqual(strip(got.sections), strip(want.sections));
  console.log(`${code}: ${ok ? "ok" : "MISMATCH"} (${got.validFrom})`);
  if (!ok) bad++;
}
process.exit(bad ? 1 : 0);
