// KGM tariff: 10-CukurovaOtoyoluNigde-Mersin-Adana.pdf → data/tolls/NMA.json
// Çukurova Otoyolları, Niğde – Pozantı – Tarsus (O-21) + Mersin – Tarsus – Adana Batı (O-51).
import { parseTriangular } from "../cukurova.mjs";

// The PDF has no row for NİĞDE GÜNEY (first column, normal for a lower triangle)
// and no row for POZANTI (GÜNEY): Pozantı Güney only has prices towards the south
// (Tekir … Mersin/Adana), none towards Pozantı Kuzey / Niğde.
const NORTH = ["nma-nigde-guney", "nma-nigde-kuzey", "nma-golcuk", "nma-kemerhisar", "nma-eminlik", "nma-pozanti-kuzey"];

export default async function parse(pdfPath) {
  return parseTriangular(pdfPath, {
    sectionId: "nma-nigde-mersin-adana",
    columns: {
      "NİĞDE GÜNEY": "nma-nigde-guney",
      "NİĞDE KUZEY": "nma-nigde-kuzey",
      "GÖLCÜK ALIN": "nma-golcuk",
      "KEMERHİSAR": "nma-kemerhisar",
      "EMİNLİK ALIN": "nma-eminlik",
      "POZANTI (KUZEY)": "nma-pozanti-kuzey",
      "POZANTI (GÜNEY)": "nma-pozanti-guney",
      "TEKİR": "nma-tekir",
      "ÇAMALAN": "nma-camalan",
      "YENİCE": "nma-yenice",
      "ADANA BATI ALIN": "nma-adana-bati",
      "ÇAMTEPE": "nma-camtepe",
      "TARSUS": "nma-tarsus",
      "TARSUS OSB": "nma-tarsus-osb",
      "MERSİN ALIN": "nma-mersin",
    },
    rows: {
      "NİĞDE KUZEY": "nma-nigde-kuzey",
      "GÖLCÜK ALIN": "nma-golcuk",
      "KEMERHİSAR": "nma-kemerhisar",
      "EMİNLİK ALIN": "nma-eminlik",
      "POZANTI (KUZEY)": "nma-pozanti-kuzey",
      "TEKİR": "nma-tekir",
      "ÇAMALAN": "nma-camalan",
      "YENİCE": "nma-yenice",
      "ADANA BATI ALIN": "nma-adana-bati",
      "ÇAMTEPE": "nma-camtepe",
      "TARSUS": "nma-tarsus",
      "TARSUS OSB": "nma-tarsus-osb",
      "MERSİN ALIN": "nma-mersin",
    },
    missingPairs: NORTH.map((id) => ["nma-pozanti-guney", id]),
  });
}
