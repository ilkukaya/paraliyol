// İzmir-Aydın Otoyolu (KGM) — 7-Izmir-Aydin.pdf
import { findValidFrom } from "../lib.mjs";
import { readGrid, buildPrices } from "./IZC.mjs";

const LABELS = {
  IŞIKKENT: "iza-isikkent",
  "TAHTALIÇAY (HAVALİMANI)": "iza-tahtalicay",
  TORBALI: "iza-torbali",
  BELEVİ: "iza-belevi",
  GERMENCİK: "iza-germencik",
  "AYDIN BATI": "iza-aydin-bati",
};
const ORDER = ["iza-isikkent", "iza-tahtalicay", "iza-torbali", "iza-belevi", "iza-germencik", "iza-aydin-bati"];

export default async function parse(pdfPath) {
  const grid = await readGrid(pdfPath, { labels: LABELS, order: ORDER, labelPlace: "above" });
  return {
    validFrom: findValidFrom(grid.items),
    sections: [{ id: "iza-main", stations: ORDER, prices: buildPrices(pdfPath, grid, ORDER, "triangle") }],
  };
}
