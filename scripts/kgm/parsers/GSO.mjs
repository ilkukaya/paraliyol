// KGM tariff: 9-CukurovaOtoyoluGaziantep-Sanliurfa.pdf → data/tolls/GSO.json
// Çukurova Otoyolları, Gaziantep Doğu – Şanlıurfa (O-52).
import { parseTriangular } from "../cukurova.mjs";

export default async function parse(pdfPath) {
  return parseTriangular(pdfPath, {
    sectionId: "gso-gaziantep-sanliurfa",
    columns: {
      "GAZİANTEP DOĞU": "gso-gaziantep-dogu",
      "NİZİP": "gso-nizip",
      "BİRECİK": "gso-birecik",
      "SURUÇ": "gso-suruc",
      "ŞANLIURFA": "gso-sanliurfa",
    },
    rows: {
      "GAZİANTEP DOĞU": "gso-gaziantep-dogu",
      "NİZİP": "gso-nizip",
      "BİRECİK": "gso-birecik",
      "SURUÇ": "gso-suruc",
      "ŞANLIURFA": "gso-sanliurfa",
    },
  });
}
