// Shared helpers for KGM tariff PDF parsers.
import { readFileSync } from "fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

/** Returns every non-empty text item: { page, x, y, w, str }. */
export async function readItems(pdfPath) {
  const doc = await getDocument({ data: new Uint8Array(readFileSync(pdfPath)), verbosity: 0 }).promise;
  const items = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    for (const it of tc.items) {
      const str = (it.str ?? "").trim();
      if (!str) continue;
      items.push({ page: p, x: it.transform[4], y: it.transform[5], w: it.width, str });
    }
  }
  return items;
}

/** "1.310,00" / "1.310,00 ₺" / "59,00" → number. Returns NaN when not a number. */
export function trNumber(str) {
  const s = String(str).replace(/[\s₺TL]/g, "");
  if (!/^\d{1,3}(\.\d{3})*(,\d+)?$|^\d+(,\d+)?$/.test(s)) return NaN;
  return Number(s.replace(/\./g, "").replace(",", "."));
}

/** Finds "dd/mm/yyyy" or "dd.mm.yyyy" near "itibaren"/"geçerli" and returns ISO date. */
export function findValidFrom(items) {
  const text = items.map((i) => i.str).join(" ");
  const dates = [];
  for (const m of text.matchAll(/(\d{2})[./](\d{2})[./](20\d{2})([^.]{0,60})/g)) {
    // prefer dates followed by "itibaren"/"geçerli"/"itibarı"; ignore historical notes
    const near = /itibar|geçerli|gecerli/i.test(m[4]);
    dates.push({ iso: `${m[3]}-${m[2]}-${m[1]}`, near });
  }
  const pool = dates.some((d) => d.near) ? dates.filter((d) => d.near) : dates;
  if (!pool.length) throw new Error("validFrom date not found in PDF");
  return pool.map((d) => d.iso).sort().at(-1);
}

export function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}
