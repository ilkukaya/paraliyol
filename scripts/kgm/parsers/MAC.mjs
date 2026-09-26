// Menemen-Aliağa-Çandarlı Otoyolu — 16-Menemen-Aliaga-Candarli.pdf
import { findValidFrom } from "../lib.mjs";
import { readGrid, buildPrices } from "./IZC.mjs";

const LABELS = {
  MENEMEN: "mac-menemen",
  ESKİFOÇA: "mac-eskifoca",
  YENİFOÇA: "mac-yenifoca",
  "ALİAĞA PETKİM": "mac-aliaga-petkim",
  "ALİAĞA OSB": "mac-aliaga-osb",
  YENİŞAKRAN: "mac-yenisakran",
  ÇANDARLI: "mac-candarli",
};
const ORDER = [
  "mac-menemen", "mac-eskifoca", "mac-yenifoca", "mac-aliaga-petkim",
  "mac-aliaga-osb", "mac-yenisakran", "mac-candarli",
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
    sections: [{ id: "mac-main", stations: ORDER, prices: buildPrices(pdfPath, grid, ORDER, "full") }],
  };
}
