# data/tolls — normalized KGM toll data

One JSON file per highway (`<CODE>.json`) plus `bridges.json`.
Source of truth: the official KGM tariff PDFs in `data/kgm-pdfs/` (valid from 2026-01-01, VAT included).

## Highway file

```jsonc
{
  "code": "O-5",                          // short code, used as file name
  "name": "Gebze-Orhangazi-İzmir Otoyolu", // official Turkish name
  "shortName": "Gebze-İzmir Otoyolu",
  "operator": "Otoyol Yatırım ve İşletme A.Ş.", // or "KGM"
  "source": "12-Gebze-Orhangazi-Izmir.pdf",
  "validFrom": "2026-01-01",
  "rules": ["Plain-Turkish notes copied/condensed from the PDF (U-dönüşü, giriş bilgisi yoksa en uzak mesafe, etc.)"],
  "stations": [
    {
      "id": "o5-altinova",               // lowercase ascii, prefix = code slug
      "name": "Altınova",                 // display name exactly as a Turkish reader expects
      "pdfName": "Altınova",             // label as it appears in the PDF
      "lat": 40.69, "lng": 29.51,         // real interchange/toll plaza location, 4 decimals
      "coord": "high" | "medium" | "low" // confidence of the coordinate
    }
  ],
  // physical road adjacency between stations of THIS highway (undirected).
  // Must follow the real road: consecutive interchanges, branches as separate chains.
  "roads": [["o5-a", "o5-b"], ["o5-b", "o5-c"]],
  // tariff sections: one closed toll system = one price matrix.
  "sections": [
    {
      "id": "o5-gebze-bursa",
      "name": "Gebze - Bursa (1. ve 2. kesim)",
      "stations": ["o5-..."],             // members of this matrix
      // prices[entry][exit] = [c1, c2, c3, c4, c5, c6]  (TL, integers or 2-dec floats)
      // class 6 = motosiklet. Directional exactly as the PDF (row = giriş, column = çıkış).
      // EXCLUDE the diagonal (U-dönüşü) and EXCLUDE any bridge fee that is listed
      // separately in bridges.json (e.g. Osmangazi) — see the O-5 note below.
      "prices": { "o5-a": { "o5-b": [55, 90, 90, 100, 140, 55] } }
    }
  ],
  // where this highway physically meets OTHER highways / bridges / city roads
  "connections": [
    { "station": "o5-...", "to": "O-4 Gebze / Osmangazi Köprüsü kuzey ucu", "note": "..." }
  ],
  "verification": ["What you cross-checked and how (row/column sums, symmetry, spot checks)."]
}
```

## bridges.json

```jsonc
[
  {
    "id": "osmangazi-koprusu",
    "name": "Osmangazi Köprüsü",
    "type": "bridge",
    "operator": "...",
    "source": "2-Osmangazi.pdf",
    "prices": [995, 1590, 1890, 2505, 3165, 695],   // class 1..6
    "bothDirections": true,                           // is the fee charged in both directions?
    "ends": [ { "lat": .., "lng": .., "label": "Dilovası (kuzey)" }, { "lat": .., "lng": .., "label": "Altınova (güney)" } ],
    "rules": ["..."]
  }
]
```
