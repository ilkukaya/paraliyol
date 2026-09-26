# KGM tariff sync pipeline

`npm run sync-tolls` (= `node scripts/kgm/sync.mjs`)

1. (optional, `--download`) downloads every tariff PDF listed in `sources.mjs`
   from kgm.gov.tr into `data/kgm-pdfs/`.
2. runs each parser in `parsers/` against its PDF.
3. merges the parsed prices into `data/tolls/<CODE>.json` / `data/tolls/bridges.json`
   — prices, sections and `validFrom` are replaced; station coordinates,
   `roads`, `connections`, names are kept from the existing JSON.
4. fails loudly (non-zero exit) if a PDF layout changed and a parser can no
   longer map every number to a known station, so bad data never ships.

## Parser contract

`parsers/<CODE>.mjs`:

```js
// pdfPath: absolute path of the PDF
export default async function parse(pdfPath) {
  return {
    validFrom: "2026-07-01",          // read from the PDF text ("01/07/2026 ... itibaren")
    sections: [
      {
        id: "o5-gebze-bursa",           // must equal the section id in data/tolls/O-5.json
        stations: ["o5-..."],           // station ids (must exist in data/tolls/O-5.json)
        prices: { "<entryId>": { "<exitId>": [c1, c2, c3, c4, c5, c6] } }
      }
    ]
  };
}
```

`parsers/bridges.mjs` returns `{ validFrom, bridges: { "<bridgeId>": [c1..c6] } }`.

Parsers use `pdfjs-dist/legacy/build/pdf.mjs` and `lib.mjs` helpers; they map PDF
labels to station ids with an explicit table inside the parser, never by guessing.
