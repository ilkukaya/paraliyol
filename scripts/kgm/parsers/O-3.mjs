// Parser for KGM "AVRUPA OTOYOLU (MAHMUTBEY-EDİRNE KESİMİ)" tariff PDF
// (data/kgm-pdfs/11-AvrupaOtoyoluMahmutbey-Edirne.pdf) → data/tolls/O-3.json sections.
//
// Layout: one lower-triangular matrix on a single page. Column headers (one line,
// next to "İSTASYON" / "SINIF") name the 18 stations. Each station row has a label
// line (label + "x km" cells under the columns west of it) followed by 6 class
// lines ("1".."6" under SINIF). A row's cells sit under the columns west of it plus
// one extra cell under its own column (diagonal = U-dönüşü / farthest fare, not
// exported). Prices are symmetric, so every cell is written for both directions.
//
// Quirk: the header says "KÜÇÜKKILIÇLI", the row label says "KÜÇÜKILIÇLI" (typo in
// the PDF); both are mapped explicitly below. KINALI↔KÜÇÜKKILIÇLI is 0 km / 0 TL.
// A hidden helper cell ("1,2549") sits above the header; it is ignored because only
// items between the header line and the "Not:" footer are read.
// All cells are located by x/y position, never by fixed line numbers.
import { readItems, trNumber, findValidFrom, assert } from "../lib.mjs";

const TAG = "O-3";
const SECTION_ID = "o3-mahmutbey-edirne";
const SECTION_NAME = "Mahmutbey - Edirne";

// Column headers, left → right.
const COLUMNS = [
  ["MAHMUTBEY", "o3-mahmutbey"],
  ["ISPARTAKULE", "o3-ispartakule"],
  ["AVCILAR", "o3-avcilar"],
  ["ESENYURT", "o3-esenyurt"],
  ["HADIMKÖY", "o3-hadimkoy"],
  ["ÇATALCA", "o3-catalca"],
  ["K.BURGAZ", "o3-kumburgaz"],
  ["SELİMPAŞA", "o3-selimpasa"],
  ["SİLİVRİ", "o3-silivri"],
  ["KINALI", "o3-kinali"],
  ["KÜÇÜKKILIÇLI", "o3-kucukkilicli"],
  ["ÇERKEZKÖY", "o3-cerkezkoy"],
  ["ÇORLU", "o3-corlu"],
  ["SARAY", "o3-saray"],
  ["LÜLEBURGAZ", "o3-luleburgaz"],
  ["BABAESKİ", "o3-babaeski"],
  ["HAVSA", "o3-havsa"],
  ["EDİRNE", "o3-edirne"],
];

// Row labels, top → bottom: [pdf label, station id, diagonal column label].
const ROWS = [
  ["MAHMUTBEY", "o3-mahmutbey", "MAHMUTBEY"],
  ["ISPARTAKULE", "o3-ispartakule", "ISPARTAKULE"],
  ["AVCILAR", "o3-avcilar", "AVCILAR"],
  ["ESENYURT", "o3-esenyurt", "ESENYURT"],
  ["HADIMKÖY", "o3-hadimkoy", "HADIMKÖY"],
  ["ÇATALCA", "o3-catalca", "ÇATALCA"],
  ["K.BURGAZ", "o3-kumburgaz", "K.BURGAZ"],
  ["SELİMPAŞA", "o3-selimpasa", "SELİMPAŞA"],
  ["SİLİVRİ", "o3-silivri", "SİLİVRİ"],
  ["KINALI", "o3-kinali", "KINALI"],
  ["KÜÇÜKILIÇLI", "o3-kucukkilicli", "KÜÇÜKKILIÇLI"],
  ["ÇERKEZKÖY", "o3-cerkezkoy", "ÇERKEZKÖY"],
  ["ÇORLU", "o3-corlu", "ÇORLU"],
  ["SARAY", "o3-saray", "SARAY"],
  ["LÜLEBURGAZ", "o3-luleburgaz", "LÜLEBURGAZ"],
  ["BABAESKİ", "o3-babaeski", "BABAESKİ"],
  ["HAVSA", "o3-havsa", "HAVSA"],
  ["EDİRNE", "o3-edirne", "EDİRNE"],
];

// Road order (Mahmutbey → Edirne), must match data/tolls/O-3.json.
const STATION_ORDER = [
  "o3-mahmutbey", "o3-ispartakule", "o3-avcilar", "o3-esenyurt", "o3-hadimkoy", "o3-catalca",
  "o3-kumburgaz", "o3-selimpasa", "o3-silivri", "o3-kinali", "o3-kucukkilicli", "o3-cerkezkoy",
  "o3-corlu", "o3-saray", "o3-luleburgaz", "o3-babaeski", "o3-havsa", "o3-edirne",
];

const LINE_TOL = 1.5; // same text line if |dy| <= this
const CELL_TOL = 10; // a cell centre must be this close to its column centre (columns ~38pt apart)
const EXPECTED_PAIRS = (18 * 17) / 2; // 153 unordered pairs

const norm = (s) => s.replace(/\s+/g, " ").trim();
const cx = (i) => i.x + i.w / 2;

function groupLines(items) {
  const lines = [];
  for (const it of [...items].sort((a, b) => b.y - a.y)) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.y - it.y) <= LINE_TOL) last.items.push(it);
    else lines.push({ y: it.y, items: [it] });
  }
  for (const l of lines) l.items.sort((a, b) => a.x - b.x);
  return lines;
}

function strictValidFrom(all) {
  const dated = all.filter(
    (i) => /\d{2}[./]\d{2}[./]20\d{2}/.test(i.str) && /geçerli|itibar/i.test(i.str) && !/tarihinden/i.test(i.str),
  );
  assert(dated.length > 0, `${TAG}: validity date text not found`);
  const dates = new Set(dated.map((i) => findValidFrom([i])));
  assert(dates.size === 1, `${TAG}: conflicting validity dates ${[...dates]}`);
  return [...dates][0];
}

export default async function parse(pdfPath) {
  const all = await readItems(pdfPath);
  assert(all.length > 0, `${TAG}: PDF has no text`);
  assert(new Set(all.map((i) => i.page)).size === 1, `${TAG}: expected a single-page PDF`);
  assert(all.some((i) => /AVRUPA OTOYOLU/.test(i.str) && /EDİRNE/.test(i.str)), `${TAG}: title not found`);

  const validFrom = strictValidFrom(all);

  // ---- header
  const ist = all.filter((i) => i.str === "İSTASYON");
  assert(ist.length === 1, `${TAG}: expected one "İSTASYON" header, got ${ist.length}`);
  const sinif = all.filter((i) => i.str === "SINIF" && Math.abs(i.y - ist[0].y) <= LINE_TOL);
  assert(sinif.length === 1, `${TAG}: expected one "SINIF" header, got ${sinif.length}`);
  const headerY = ist[0].y;
  const classX = cx(sinif[0]);
  const dataLeft = sinif[0].x + sinif[0].w;
  const headerItems = all
    .filter((i) => Math.abs(i.y - headerY) <= LINE_TOL && i.x > dataLeft)
    .sort((a, b) => a.x - b.x);
  const colLabels = headerItems.map((i) => norm(i.str));
  assert(
    colLabels.length === COLUMNS.length && colLabels.every((l, k) => l === COLUMNS[k][0]),
    `${TAG}: column headers changed:\n  got      ${JSON.stringify(colLabels)}\n  expected ${JSON.stringify(COLUMNS.map((c) => c[0]))}`,
  );
  const colX = headerItems.map(cx);
  const colIndex = (x, what) => {
    let best = 0;
    for (let k = 1; k < colX.length; k++) if (Math.abs(colX[k] - x) < Math.abs(colX[best] - x)) best = k;
    assert(Math.abs(colX[best] - x) <= CELL_TOL, `${TAG}: ${what} at x=${x.toFixed(1)} is not under any column`);
    return best;
  };

  // ---- body
  const footer = all.filter((i) => /^Not:/.test(i.str) && i.y < headerY);
  assert(footer.length === 1, `${TAG}: expected one "Not:" footer line, got ${footer.length}`);
  const footerY = footer[0].y;
  const body = all.filter((i) => i.y < headerY - LINE_TOL && i.y > footerY + LINE_TOL);
  const blocks = [];
  for (const line of groupLines(body)) {
    const left = line.items.filter((i) => cx(i) < classX - 8);
    const classTag = line.items.filter((i) => /^[1-6]$/.test(i.str) && Math.abs(cx(i) - classX) <= 6);
    const cells = line.items.filter((i) => !left.includes(i) && !classTag.includes(i));
    for (const c of cells) assert(c.x > dataLeft - 12, `${TAG}: stray text "${c.str}" at y=${line.y.toFixed(1)}`);
    if (left.length) {
      assert(classTag.length === 0, `${TAG}: line y=${line.y.toFixed(1)} has both a label and a class tag`);
      blocks.push({ label: norm(left.map((i) => i.str).join(" ")), kmCells: cells, classes: {} });
    } else {
      assert(classTag.length === 1, `${TAG}: unexpected line at y=${line.y.toFixed(1)}: ${line.items.map((i) => i.str).join(" | ")}`);
      assert(blocks.length > 0, `${TAG}: class line before first station label`);
      const cls = Number(classTag[0].str);
      const b = blocks[blocks.length - 1];
      assert(!(cls in b.classes), `${TAG}: duplicate class ${cls} line in row ${b.label}`);
      b.classes[cls] = cells;
    }
  }
  assert(
    blocks.length === ROWS.length && blocks.every((b, k) => b.label === ROWS[k][0]),
    `${TAG}: row labels changed:\n  got      ${JSON.stringify(blocks.map((b) => b.label))}\n  expected ${JSON.stringify(ROWS.map((r) => r[0]))}`,
  );

  // ---- cells
  const colIdOf = COLUMNS.map((c) => c[1]);
  const prices = {};
  let pairs = 0;
  const put = (a, b, p) => {
    prices[a] ??= {};
    assert(!(b in prices[a]), `${TAG}: price ${a}→${b} defined twice`);
    prices[a][b] = p;
  };
  const diagOf = {};
  blocks.forEach((b, k) => {
    const [label, id, diagLabel] = ROWS[k];
    const diag = COLUMNS.findIndex((c) => c[0] === diagLabel);
    assert(diag === k, `${TAG}: row ${label}: diagonal column ${diagLabel} is not column ${k}`);
    const kmCols = b.kmCells.map((i) => {
      assert(/^[\d.,]+ km$/.test(i.str), `${TAG}: row ${label}: unexpected text on km line "${i.str}"`);
      return colIndex(cx(i), `row ${label} km cell "${i.str}"`);
    });
    assert(
      kmCols.length === diag && kmCols.every((c, n) => c === n),
      `${TAG}: row ${label}: km cells under columns ${kmCols} (expected 0..${diag - 1})`,
    );
    const perClass = [];
    for (let cls = 1; cls <= 6; cls++) {
      const cells = b.classes[cls];
      assert(cells, `${TAG}: row ${label}: class ${cls} line missing`);
      const byCol = new Map();
      for (const i of cells) {
        const v = trNumber(i.str);
        assert(Number.isFinite(v), `${TAG}: row ${label} class ${cls}: non-numeric cell "${i.str}"`);
        const c = colIndex(cx(i), `row ${label} class ${cls} cell "${i.str}"`);
        assert(!byCol.has(c), `${TAG}: row ${label} class ${cls}: two cells under column ${COLUMNS[c][0]}`);
        byCol.set(c, v);
      }
      assert(
        byCol.size === diag + 1 && [...byCol.keys()].every((c) => c <= diag),
        `${TAG}: row ${label} class ${cls}: ${byCol.size} cells, expected ${diag + 1} (columns 0..${diag})`,
      );
      perClass.push(byCol);
    }
    diagOf[id] = perClass.map((m) => m.get(diag));
    for (let c = 0; c < diag; c++) {
      const p = perClass.map((m) => m.get(c));
      put(id, colIdOf[c], p);
      put(colIdOf[c], id, p);
      pairs++;
    }
  });
  assert(pairs === EXPECTED_PAIRS, `${TAG}: ${pairs} station pairs, expected ${EXPECTED_PAIRS}`);

  // sanity: the diagonal (U-dönüşü) equals the farthest fare of that station, per class
  for (const a of STATION_ORDER) {
    for (let n = 0; n < 6; n++) {
      const max = Math.max(...Object.values(prices[a]).map((p) => p[n]));
      assert(max === diagOf[a][n], `${TAG}: ${a} class ${n + 1}: diagonal ${diagOf[a][n]} != farthest fare ${max}`);
    }
  }
  // sanity: motorcycle never above class 1, class 1 never above class 2
  for (const [a, o] of Object.entries(prices))
    for (const [b, p] of Object.entries(o)) {
      assert(p[5] <= p[0] && p[0] <= p[1], `${TAG}: ${a}→${b} class order broken: ${p}`);
    }

  const known = new Set(STATION_ORDER);
  for (const [a, o] of Object.entries(prices)) {
    assert(known.has(a), `${TAG}: unknown station ${a}`);
    for (const b of Object.keys(o)) assert(known.has(b), `${TAG}: unknown station ${b}`);
  }
  const ordered = {};
  for (const a of STATION_ORDER) {
    ordered[a] = {};
    for (const b of STATION_ORDER) if (b !== a) ordered[a][b] = prices[a][b];
  }
  return {
    validFrom,
    sections: [{ id: SECTION_ID, name: SECTION_NAME, stations: [...STATION_ORDER], prices: ordered }],
  };
}
