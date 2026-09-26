#!/usr/bin/env node
// Builds data/locations.json from scripts/data/locations.src.tsv
import { readFileSync, writeFileSync } from "fs";

const tr = { ç: "c", ğ: "g", ı: "i", i: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };
export function slugify(s) {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıiöşüâîû]/g, (c) => tr[c] ?? c)
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const rows = readFileSync(new URL("./data/locations.src.tsv", import.meta.url), "utf8")
  .split("\n")
  .filter((l) => l.trim() && !l.startsWith("#"));

const out = rows.map((line) => {
  const [name, il, lat, lng, popular, type, slug] = line.split("\t");
  return {
    id: slug?.trim() || slugify(name),
    name,
    il,
    lat: Number(lat),
    lng: Number(lng),
    popular: popular === "1",
    type,
  };
});

const ids = new Set();
for (const l of out) {
  if (ids.has(l.id)) throw new Error("duplicate id " + l.id);
  ids.add(l.id);
}
out.sort((a, b) => a.name.localeCompare(b.name, "tr"));
writeFileSync(new URL("../data/locations.json", import.meta.url), JSON.stringify(out, null, 1) + "\n");
console.log(`${out.length} locations written`);
