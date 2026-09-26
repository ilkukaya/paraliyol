// Records the date of the last successful tariff sync in data/site-settings.json.
import { readFileSync, writeFileSync } from "fs";
const p = new URL("../data/site-settings.json", import.meta.url);
const s = JSON.parse(readFileSync(p, "utf8"));
s.lastDataCheck = new Date().toISOString().slice(0, 10);
writeFileSync(p, JSON.stringify(s, null, 2) + "\n");
