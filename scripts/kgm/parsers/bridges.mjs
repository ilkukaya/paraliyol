// Parser for the four KGM bridge tariff PDFs → data/tolls/bridges.json prices.
//
//   1-15Temmuz-FSM.pdf     one shared tariff for 15 Temmuz Şehitler + Fatih Sultan Mehmet
//                          (emitted twice: "15-temmuz-sehitler-koprusu", "fatih-sultan-mehmet-koprusu")
//   2-Osmangazi.pdf        "osmangazi-koprusu"
//   3-YSSKoprusu.pdf       "yavuz-sultan-selim-koprusu"
//   4-1915Canakkale.pdf    "1915-canakkale-koprusu"
//
// Each PDF has class tags "1".."6" in the ARAÇ SINIF(I) column and one price per class.
// The FSM PDF's text layer also contains a HIDDEN column "Mevcut Tarife (₺)"
// (8,75 / 11,25 / … — not drawn on the rendered page) and a hidden "1,25" helper cell;
// only the column under the visible header "KÖPRÜ GEÇİŞ ÜCRETİ (₺)" is read.
// Prices are matched to class tags by position (nearest y, x right of the tag).
//
// export default async function parse(pdfPaths)
//   pdfPaths: { "<key>": absolutePath } — keys as in scripts/kgm/sources.mjs
//   ("15-temmuz-fsm", "osmangazi-koprusu", "yavuz-sultan-selim-koprusu",
//   "1915-canakkale-koprusu"); the FSM PDF may also be passed under
//   "15-temmuz-sehitler-koprusu" or "fatih-sultan-mehmet-koprusu".
// returns { validFrom: { "<bridgeId>": "YYYY-MM-DD" }, bridges: { "<bridgeId>": [c1..c6] } }
import { readItems, trNumber, findValidFrom, assert } from "../lib.mjs";

const TAG = "bridges";
const ROW_TOL = 3; // price and class tag baselines differ by up to ~1.7pt in 4-1915Canakkale.pdf
const COL_TOL = 15;

const SPECS = [
  {
    keys: ["15-temmuz-fsm", "15-temmuz-sehitler-koprusu", "fatih-sultan-mehmet-koprusu"],
    title: /15 TEMMUZ ŞEHİTLER KÖPRÜSÜ VE FATİH SULTAN MEHMET KÖPRÜSÜ/,
    classHeader: (i) => i.str === "ARAÇ" || i.str === "SINIF",
    priceHeader: "KÖPRÜ GEÇİŞ ÜCRETİ (₺)", // price column chosen by this header's x
    ids: ["15-temmuz-sehitler-koprusu", "fatih-sultan-mehmet-koprusu"],
  },
  {
    keys: ["osmangazi-koprusu"],
    title: /OSMANGAZİ KÖPRÜSÜ GEÇİŞ ÜCRETLERİ TARİFESİ/,
    classHeader: (i) => i.str === "ARAÇ SINIFI",
    ids: ["osmangazi-koprusu"],
  },
  {
    keys: ["yavuz-sultan-selim-koprusu"],
    title: /YAVUZ SULTAN SELİM KÖPRÜSÜ GEÇİŞ ÜCRETLERİ TARİFESİ/,
    classHeader: (i) => i.str === "ARAÇ SINIFI",
    ids: ["yavuz-sultan-selim-koprusu"],
  },
  {
    keys: ["1915-canakkale-koprusu"],
    title: /1915 ÇANAKKALE KÖPRÜSÜ GEÇİŞ ÜCRETLERİ TARİFESİ/,
    classHeader: (i) => i.str === "ARAÇ SINIFI",
    ids: ["1915-canakkale-koprusu"],
  },
];

const cx = (i) => i.x + i.w / 2;

function strictValidFrom(all, name) {
  const dated = all.filter(
    (i) => /\d{2}[./]\d{2}[./]20\d{2}/.test(i.str) && /geçerli|itibar/i.test(i.str) && !/tarihinden/i.test(i.str),
  );
  assert(dated.length > 0, `${TAG} ${name}: validity date text not found`);
  const dates = new Set(dated.map((i) => findValidFrom([i])));
  assert(dates.size === 1, `${TAG} ${name}: conflicting validity dates ${[...dates]}`);
  return [...dates][0];
}

async function parseOne(pdfPath, spec, name) {
  const all = await readItems(pdfPath);
  assert(all.length > 0, `${TAG} ${name}: PDF has no text`);
  assert(new Set(all.map((i) => i.page)).size === 1, `${TAG} ${name}: expected a single-page PDF`);
  assert(all.some((i) => spec.title.test(i.str)), `${TAG} ${name}: title not found`);
  const validFrom = strictValidFrom(all, name);

  const ch = all.filter(spec.classHeader);
  assert(ch.length >= 1, `${TAG} ${name}: class column header not found`);
  const classX = ch.reduce((s, i) => s + cx(i), 0) / ch.length;
  const headerY = Math.min(...ch.map((i) => i.y));
  // class tags: the one vertical run of single digits 1..6 below the header, left of the prices
  const digits = all.filter((i) => /^[1-6]$/.test(i.str) && i.y < headerY);
  const runs = [];
  for (const d of digits) {
    const r = runs.find((k) => Math.abs(k.x - cx(d)) <= 3);
    if (r) r.items.push(d);
    else runs.push({ x: cx(d), items: [d] });
  }
  const full = runs.filter((r) => r.items.length === 6);
  assert(full.length === 1, `${TAG} ${name}: expected one column of class tags, found ${full.length}`);
  assert(Math.abs(full[0].x - classX) <= 60, `${TAG} ${name}: class tags far from the class header`);
  const tags = full[0].items.sort((a, b) => b.y - a.y);
  assert(
    tags.length === 6 && tags.every((t, n) => t.str === String(n + 1)),
    `${TAG} ${name}: class tags ${tags.map((t) => t.str)} (expected 1..6 top → bottom)`,
  );

  let priceX = null;
  if (spec.priceHeader) {
    const h = all.filter((i) => i.str === spec.priceHeader);
    assert(h.length === 1, `${TAG} ${name}: price header "${spec.priceHeader}" not found`);
    priceX = cx(h[0]);
  }
  const prices = tags.map((t, n) => {
    let cand = all.filter(
      (i) => i !== t && Math.abs(i.y - t.y) <= ROW_TOL && i.x > t.x + t.w && Number.isFinite(trNumber(i.str)),
    );
    if (priceX !== null) cand = cand.filter((i) => Math.abs(cx(i) - priceX) <= COL_TOL);
    assert(cand.length === 1, `${TAG} ${name}: class ${n + 1}: ${cand.length} price cells (${cand.map((i) => i.str)})`);
    const v = trNumber(cand[0].str);
    assert(v > 0, `${TAG} ${name}: class ${n + 1}: bad price ${cand[0].str}`);
    return v;
  });
  // sanity: classes 1..5 non-decreasing, motorcycle cheapest
  for (let n = 1; n < 5; n++) assert(prices[n] >= prices[n - 1], `${TAG} ${name}: class ${n + 1} < class ${n}: ${prices}`);
  assert(prices[5] <= prices[0], `${TAG} ${name}: motorcycle > class 1: ${prices}`);
  return { validFrom, prices };
}

export default async function parse(pdfPaths) {
  assert(pdfPaths && typeof pdfPaths === "object", `${TAG}: pdfPaths must be an object`);
  const bridges = {};
  const validFrom = {};
  for (const spec of SPECS) {
    const key = spec.keys.find((k) => pdfPaths[k]);
    assert(key, `${TAG}: no PDF path given for ${spec.ids.join(" / ")} (keys ${spec.keys.join(", ")})`);
    const r = await parseOne(pdfPaths[key], spec, key);
    for (const id of spec.ids) {
      bridges[id] = [...r.prices];
      validFrom[id] = r.validFrom;
    }
  }
  return { validFrom, bridges };
}
