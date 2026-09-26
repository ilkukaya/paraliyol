// KGM tariff: 15-KMOAnadoluKurtkoy-Akyazi.pdf → data/tolls/KMO-AN.json
// "KUZEY MARMARA ANADOLU OTOYOLU (KURTKÖY-AKYAZI)" — full 14x14 directional matrix
// (row = giriş, column = çıkış; diagonal = U-turn fare → uTurn). NOT symmetric in the PDF;
// kept directional as printed. Sevindikli↔İlimtepe is 0,00 in the PDF. Plus SGS table (→ freeFlow).
import { parseFullMatrix, parseFreeFlow, tariffValidFrom } from "../fullmatrix.mjs";

const COLUMNS = [
  ["KURNAKÖY 2", "kmo-an-kurnakoy-2"],
  ["İSTANBULPARK", "kmo-an-istanbulpark"],
  ["BALÇIK", "kmo-an-balcik"],
  ["MERMERCİLER", "kmo-an-mermerciler"],
  ["SEVİNDİKLİ", "kmo-an-sevindikli"],
  ["İLİMTEPE", "kmo-an-ilimtepe"],
  ["İZMİT KUZEY", "kmo-an-izmit-kuzey"],
  ["İZMİT DOĞU", "kmo-an-izmit-dogu"],
  ["AKMEŞE", "kmo-an-akmese"],
  ["ADAPAZARI-1", "kmo-an-adapazari-1"],
  ["ADAPAZARI-2", "kmo-an-adapazari-2"],
  ["KARASU", "kmo-an-karasu"],
  ["KMO AKYAZI", "kmo-an-kmo-akyazi"],
  ["TEM AKYAZI", "kmo-an-tem-akyazi"],
];
// Row labels: the PDF misspells the Mermerciler row as "MERMECİLER".
const ROWS = COLUMNS.map(([l, id]) => [id === "kmo-an-mermerciler" ? ["MERMECİLER", "MERMERCİLER"] : l, id]);

const SGS_LABELS = {
  "MERMERCİLER": "Mermerciler",
  "DEMİRCİLER": "Demirciler",
  "D100": "D100",
  "İZMİT OSB": "İzmit OSB",
};

export default async function parse(pdfPath) {
  const m = await parseFullMatrix(pdfPath, {
    columns: COLUMNS,
    rows: ROWS,
    ignoreLeft: /^GİRİŞ GİŞELERİ$/,
  });
  const headerY = m.items.find((i) => i.str === "YÖN" && i.y < m.matrixBottomY)?.y;
  const freeFlow = parseFreeFlow(m.items, {
    belowY: m.matrixBottomY,
    headerY,
    directionRe: /^[AB] \((Kuzey-Güney|Güney-Kuzey)\)$/,
    labels: SGS_LABELS,
    expected: 8,
  });
  return {
    validFrom: tariffValidFrom(m.items),
    sections: [
      {
        id: "kmo-an-main",
        name: "Kurnaköy 2 - TEM Akyazı kapalı sistem",
        stations: m.stations,
        prices: m.prices,
        uTurn: m.uTurn,
      },
    ],
    freeFlow,
  };
}
