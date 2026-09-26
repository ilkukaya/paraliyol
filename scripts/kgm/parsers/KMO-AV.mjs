// KGM tariff: 14-KMOAvrupaKinali-Odayeri.pdf → data/tolls/KMO-AV.json
// "KUZEY MARMARA AVRUPA OTOYOLU (KINALI - ODAYERİ)" — full 7x7 directional matrix
// (row = giriş, column = çıkış; diagonal = U-turn fare → uTurn). The matrix is NOT
// symmetric in the PDF; it is kept directional as printed. Plus the SGS table (→ freeFlow).
import { parseFullMatrix, parseFreeFlow, tariffValidFrom } from "../fullmatrix.mjs";

const STATIONS = [
  ["KINALI", "kmo-av-kinali"],
  ["SİLİVRİ", "kmo-av-silivri"],
  ["ÇATALCA", "kmo-av-catalca"],
  ["NAKKAŞ", "kmo-av-nakkas"],
  ["YASSIÖREN", "kmo-av-yassioren"],
  ["TAYAKADIN", "kmo-av-tayakadin"],
  ["FATİH", "kmo-av-fatih"],
];

const SGS_LABELS = {
  "21 (TERMİNAL A)": "21 (Terminal A)",
  "22 (TERMİNAL 2 YANYOL A)": "22 (Terminal 2 Yanyol A)",
  "23 (TERMİNAL 1 YANYOL A)": "23 (Terminal 1 Yanyol A)",
  "24 (KARGO A)": "24 (Kargo A)",
  "72 A (CEBECİ)": "72 A (Cebeci)",
  "73 A (HASDAL A)": "73 A (Hasdal A)",
  "21 (TERMİNAL B)": "21 (Terminal B)",
  "22 (TERMİNAL 2 YANYOL B)": "22 (Terminal 2 Yanyol B)",
  "23 (TERMİNAL 1 YANYOL B)": "23 (Terminal 1 Yanyol B)",
  "24 (KARGO B)": "24 (Kargo B)",
  "72 B (CEBECİ)": "72 B (Cebeci)",
  "73 B (HASDAL B)": "73 B (Hasdal B)",
  "71 A1 (HABİPLER A)": "71 A1 (Habipler A)",
  "71 A2 (HABİPLER YANYOL A )": "71 A2 (Habipler Yanyol A)",
  "71 A2 (HABİPLER YANYOL A)": "71 A2 (Habipler Yanyol A)",
  "71 B2 (HABİPLER YANYOL B)": "71 B2 (Habipler Yanyol B)",
};
const DIRECTION = { "KUZEY-GÜNEY": "Kuzey-Güney", "GÜNEY-KUZEY": "Güney-Kuzey" };

export default async function parse(pdfPath) {
  const m = await parseFullMatrix(pdfPath, {
    columns: STATIONS,
    rows: STATIONS,
    ignoreLeft: /^(GİRİŞ GİŞELERİ|\(G\d+\))$/,
  });
  const headerY = m.items.find((i) => i.str === "Yön" && i.y < m.matrixBottomY)?.y;
  const freeFlow = parseFreeFlow(m.items, {
    belowY: m.matrixBottomY,
    headerY,
    directionRe: /^(KUZEY-GÜNEY|GÜNEY-KUZEY)$/,
    labels: SGS_LABELS,
    expected: 15,
  }).map((f) => ({ ...f, direction: DIRECTION[f.direction] }));
  return {
    validFrom: tariffValidFrom(m.items),
    sections: [
      {
        id: "kmo-av-main",
        name: "Kınalı - Fatih (Odayeri) kapalı sistem",
        stations: m.stations,
        prices: m.prices,
        uTurn: m.uTurn,
      },
    ],
    freeFlow,
  };
}
