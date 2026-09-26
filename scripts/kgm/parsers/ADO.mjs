// Aydın-Denizli Otoyolu — 19-Aydin-Denizli.pdf
import { findValidFrom } from "../lib.mjs";
import { readGrid, buildPrices } from "./IZC.mjs";

const LABELS = {
  "AYDIN ALIN": "ado-aydin-alin",
  KÖŞK: "ado-kosk",
  "YENİ PAZAR": "ado-yenipazar",
  NAZİLLİ: "ado-nazilli",
  KUYUCAK: "ado-kuyucak",
  BUHARKENT: "ado-buharkent",
  SARAYKÖY: "ado-saraykoy",
  "KUMKISIK-A": "ado-kumkisik-a",
  "KUMKISIK-B": "ado-kumkisik-b",
  PAMUKKALE: "ado-pamukkale",
  KOCABAŞ: "ado-kocabas",
};
const ORDER = [
  "ado-aydin-alin", "ado-kosk", "ado-yenipazar", "ado-nazilli", "ado-kuyucak", "ado-buharkent",
  "ado-saraykoy", "ado-kumkisik-a", "ado-kumkisik-b", "ado-pamukkale", "ado-kocabas",
];

export default async function parse(pdfPath) {
  const grid = await readGrid(pdfPath, {
    labels: LABELS,
    order: ORDER,
    labelPlace: "inside",
    ignore: ["GİRİŞ GİŞELERİ", "ÇIKIŞ GİŞELERİ"],
  });
  return {
    validFrom: findValidFrom(grid.items),
    sections: [{ id: "ado-main", stations: ORDER, prices: buildPrices(pdfPath, grid, ORDER, "full") }],
  };
}
