// KGM tariff: 8-CukurovaOtoyoluAdana-Gaziantep.pdf → data/tolls/TAG.json
// Çukurova Otoyolları, Adana Doğu – Gaziantep Batı (O-52) incl. İskenderun (O-53) branches.
import { parseTriangular } from "../cukurova.mjs";

export default async function parse(pdfPath) {
  return parseTriangular(pdfPath, {
    sectionId: "tag-adana-gaziantep",
    columns: {
      "ADANA DOĞU ALIN": "tag-adana-dogu",
      "CEYHAN": "tag-ceyhan",
      "TOPRAKKALE": "tag-toprakkale",
      "SAKIZGEDİĞİ": "tag-sakizgedigi",
      "OSMANİYE": "tag-osmaniye",
      "OSMANİYE ORG.SAN.": "tag-osmaniye-osb",
      "ERZİN": "tag-erzin",
      "YUMURTALIK SERBEST BÖLGE": "tag-yumurtalik-sb",
      "DÖRTYOL": "tag-dortyol",
      "PAYAS": "tag-payas",
      "İSKENDERUN OSB": "tag-iskenderun-osb",
      "İSKENDERUN": "tag-iskenderun",
      "DÜZİÇİ": "tag-duzici",
      "BAHÇE": "tag-bahce",
      "KÖMÜRLER (NURDAĞI)": "tag-komurler",
      "NARLI": "tag-narli",
      "GAZİANTEP BATI ALIN": "tag-gaziantep-bati",
    },
    rows: {
      "ADANA DOĞU ALIN": "tag-adana-dogu",
      "CEYHAN": "tag-ceyhan",
      "TOPRAKKALE": "tag-toprakkale",
      "SAKIZGEDİĞİ": "tag-sakizgedigi",
      "OSMANİYE": "tag-osmaniye",
      "OSMANİYE ORG.SAN.": "tag-osmaniye-osb",
      "ERZİN": "tag-erzin",
      "YUMURTALIK SERBEST B.": "tag-yumurtalik-sb",
      "DÖRTYOL": "tag-dortyol",
      "PAYAS": "tag-payas",
      "İSKENDERUN OSB": "tag-iskenderun-osb",
      "İSKENDERUN": "tag-iskenderun",
      "DÜZİÇİ": "tag-duzici",
      "BAHÇE": "tag-bahce",
      "KÖMÜRLER (NURDAĞI)": "tag-komurler",
      "NARLI": "tag-narli",
      "GAZİANTEP BATI ALIN": "tag-gaziantep-bati",
    },
  });
}
