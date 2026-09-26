// Official KGM tariff PDFs. `file` is the file name KGM uses on its site.
export const KGM_PAGE = "https://www.kgm.gov.tr/Sayfalar/KGM/SiteTr/Otoyollar/UcretlerYeni.aspx";
export const KGM_DOC_BASE =
  "https://www.kgm.gov.tr/SiteCollectionDocuments/KGMdocuments/Otoyollar/OtoyolKopruUcret";

export const HIGHWAY_SOURCES = [
  { code: "O-4", file: "5-AnadoluOtoyoluCamlica-Akinci.pdf" },
  { code: "IZC", file: "6-Izmir-Cesme.pdf" },
  { code: "IZA", file: "7-Izmir-Aydin.pdf" },
  { code: "TAG", file: "8-CukurovaOtoyoluAdana-Gaziantep.pdf" },
  { code: "GSO", file: "9-CukurovaOtoyoluGaziantep-Sanliurfa.pdf" },
  { code: "NMA", file: "10-CukurovaOtoyoluNigde-Mersin-Adana.pdf" },
  { code: "O-3", file: "11-AvrupaOtoyoluMahmutbey-Edirne.pdf" },
  { code: "O-5", file: "12-Gebze-Orhangazi-Izmir.pdf" },
  { code: "KCY", file: "13-YSSKuzeyCevreYolu.pdf" },
  { code: "KMO-AV", file: "14-KMOAvrupaKinali-Odayeri.pdf" },
  { code: "KMO-AN", file: "15-KMOAnadoluKurtkoy-Akyazi.pdf" },
  { code: "MAC", file: "16-Menemen-Aliaga-Candarli.pdf" },
  { code: "ANO", file: "17-Ankara-Nigde.pdf" },
  { code: "MCO", file: "18-Malkara-Canakkale.pdf" },
  { code: "ADO", file: "19-Aydin-Denizli.pdf" },
];

// keys are the bridge ids passed to parsers/bridges.mjs
export const BRIDGE_SOURCES = {
  "15-temmuz-fsm": "1-15Temmuz-FSM.pdf",
  "osmangazi-koprusu": "2-Osmangazi.pdf",
  "yavuz-sultan-selim-koprusu": "3-YSSKoprusu.pdf",
  "1915-canakkale-koprusu": "4-1915Canakkale.pdf",
};
