// KGM tariff: 13-YSSKuzeyCevreYolu.pdf → data/tolls/KCY.json
// "YAVUZ SULTAN SELİM KÖPRÜSÜ VE KUZEY ÇEVRE OTOYOLU" — full 12x12 directional matrix
// (row = giriş, column = çıkış, 6 class lines per row; diagonal = U-turn fare → uTurn),
// plus the "Serbest Geçiş Sistemi Alanı Ücretlendirme Tablosu" (→ freeFlow).
// The matrix INCLUDES the Yavuz Sultan Selim bridge fee ("Köprü Geçiş Ücreti İçermektedir")
// for every European↔Asian pair; see includesBridgeFee.
import { parseFullMatrix, parseFreeFlow, tariffValidFrom } from "../fullmatrix.mjs";
import { assert } from "../lib.mjs";

const STATIONS = [
  ["Fenertepe", "kcy-fenertepe"],
  ["Işıklar", "kcy-isiklar"],
  ["Ağaçlı", "kcy-agacli"],
  ["Odayeri", "kcy-odayeri"],
  ["Uskumruköy", "kcy-uskumrukoy"],
  ["Riva", "kcy-riva"],
  ["Hüseyinli", "kcy-huseyinli"],
  ["Reşadiye", "kcy-resadiye"],
  ["Alemdağ", "kcy-alemdag"],
  ["Paşaköy", "kcy-pasakoy"],
  ["Mecidiye", "kcy-mecidiye"],
  ["Kurnaköy", "kcy-kurnakoy"],
];
const EUROPE = ["kcy-fenertepe", "kcy-isiklar", "kcy-agacli", "kcy-odayeri", "kcy-uskumrukoy"];

const SGS_LABELS = {
  "İstoç": "İstoç",
  "İkitelli": "İkitelli",
  "Başakşehir Güney": "Başakşehir Güney",
  "Başakşehir": "Başakşehir",
  "Fenertepe": "Fenertepe",
  "Çekmeköy": "Çekmeköy",
  "Çamlık": "Çamlık",
  "Sarıgazi": "Sarıgazi",
  "Kömürlük": "Kömürlük",
};

export default async function parse(pdfPath) {
  const m = await parseFullMatrix(pdfPath, {
    columns: STATIONS,
    rows: STATIONS,
    ignoreLeft: /^GİRİŞ GİŞELERİ$/,
  });
  assert(m.items.some((i) => /Köprü Geçiş Ücreti İçermektedir/i.test(i.str)), "KCY: bridge-included note missing — check YSS handling");
  const asia = m.stations.filter((s) => !EUROPE.includes(s));
  const headerY = m.items.find((i) => i.str === "Yön" && i.y < m.matrixBottomY)?.y;
  const freeFlow = parseFreeFlow(m.items, {
    belowY: m.matrixBottomY,
    headerY,
    directionRe: /^(Güney - Kuzey|Kuzey - Güney)$/,
    labels: SGS_LABELS,
    expected: 18,
  });
  return {
    validFrom: tariffValidFrom(m.items),
    sections: [
      {
        id: "kcy-main",
        name: "Yavuz Sultan Selim Köprüsü ve Kuzey Çevre Otoyolu (kapalı sistem, köprü dahil)",
        stations: m.stations,
        includesBridgeFee: {
          bridge: "yavuz-sultan-selim-koprusu",
          between: ["kcy-uskumrukoy", "kcy-riva"],
          note: "Avrupa yakası istasyonu ile Anadolu yakası istasyonu arasındaki tüm ücretler YSS köprü ücretini içerir (PDF: 'Köprü Geçiş Ücreti İçermektedir'). Köprü ücretini ayrıca ekleme.",
          crossingPairsCount: EUROPE.length * asia.length * 2,
        },
        prices: m.prices,
        uTurn: m.uTurn,
      },
    ],
    freeFlow,
  };
}
