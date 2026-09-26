// Parser for KGM "ANADOLU OTOYOLU (ÇAMLICA-AKINCI KESİMİ)" tariff PDF
// (data/kgm-pdfs/5-AnadoluOtoyoluCamlica-Akinci.pdf) → data/tolls/O-4.json sections.
//
// Layout: one lower-triangular matrix. Each station row (label at the left) has a
// km line followed by 6 class lines ("1".."6"). A row's cells sit under the column
// headers of the stations west of it, plus one extra cell under its own column
// (the diagonal = farthest-distance fare, not exported). Prices are symmetric, so
// every cell is written for both directions.
//
// Some rows and columns differ (half-interchanges):
//   row "GEBZE ORG. SAN. BÖLGELERİ" and row "GEBZE" share the GEBZE column,
//   row "BATI HEREKE" uses the "DOĞU HEREKE" column as its diagonal,
//   row "BATI İZMİT" and row "KANDIRA" share the KANDIRA column.
// All cells are located by x/y position, never by fixed line numbers.
import { readItems, trNumber, findValidFrom, assert } from "../lib.mjs";

const SECTION_ID = "o4-camlica-akinci";

// Column headers, left → right (multi-line headers joined with a space).
const COLUMNS = [
  ["ANADOLU (ÇAMLICA)", "o4-camlica"],
  ["SAMANDIRA", "o4-samandira"],
  ["SULTANBEYLİ", "o4-sultanbeyli"],
  ["MECİDİYE", "o4-mecidiye"],
  ["KURTKÖY", "o4-kurtkoy"],
  ["ORHANLI", "o4-orhanli"],
  ["Ş.PINAR", "o4-sekerpinar"],
  ["GEBZE", "o4-gebze"],
  ["MUALLİMKÖY", "o4-muallimkoy"],
  ["LİMAN", "o4-liman"],
  ["DİL İSKELESİ", "o4-dil-iskelesi"],
  ["DOĞU HEREKE", "o4-dogu-hereke"],
  ["KÖRFEZ", "o4-korfez"],
  ["KANDIRA", "o4-kandira"],
  ["KARTEPE", "o4-kartepe"],
  ["DOĞU İZMİT", "o4-dogu-izmit"],
  ["SAPANCA", "o4-sapanca"],
  ["ADAPAZARI", "o4-adapazari"],
  ["BEKİRPAŞA", "o4-bekirpasa"],
  ["AKYAZI", "o4-akyazi"],
  ["TOPAĞAÇ", "o4-topagac"],
  ["HENDEK", "o4-hendek"],
  ["DÜZCE (GÖLYAKA)", "o4-duzce"],
  ["DÜZCE ORGANİZE SAN.", "o4-duzce-osb"],
  ["KAYNAŞLI", "o4-kaynasli"],
  ["ABANT", "o4-abant"],
  ["BOLU BATI", "o4-bolu-bati"],
  ["ÇAYDURT", "o4-caydurt"],
  ["YENİÇAĞA", "o4-yenicaga"],
  ["DÖRTDİVAN", "o4-dortdivan"],
  ["GEREDE", "o4-gerede"],
  ["PELİTÇİK (ÇAMLIDERE)", "o4-pelitcik"],
  ["ÇELTİKÇİ (KIZILCAHAMAM)", "o4-celtikci"],
  ["AKINCI", "o4-akinci"],
];

// Row labels, top → bottom: [pdf label, station id, diagonal column label].
const ROWS = [
  ["ANADOLU (ÇAMLICA)", "o4-camlica", "ANADOLU (ÇAMLICA)"],
  ["SAMANDIRA", "o4-samandira", "SAMANDIRA"],
  ["SULTANBEYLİ", "o4-sultanbeyli", "SULTANBEYLİ"],
  ["MECİDİYE", "o4-mecidiye", "MECİDİYE"],
  ["KURTKÖY", "o4-kurtkoy", "KURTKÖY"],
  ["ORHANLI", "o4-orhanli", "ORHANLI"],
  ["Ş.PINAR", "o4-sekerpinar", "Ş.PINAR"],
  ["GEBZE ORG. SAN. BÖLGELERİ", "o4-gebze-osb", "GEBZE"],
  ["GEBZE", "o4-gebze", "GEBZE"],
  ["MUALLİMKÖY", "o4-muallimkoy", "MUALLİMKÖY"],
  ["LİMAN", "o4-liman", "LİMAN"],
  ["DİL İSKELESİ", "o4-dil-iskelesi", "DİL İSKELESİ"],
  ["BATI HEREKE", "o4-bati-hereke", "DOĞU HEREKE"],
  ["KÖRFEZ", "o4-korfez", "KÖRFEZ"],
  ["BATI İZMİT", "o4-bati-izmit", "KANDIRA"],
  ["KANDIRA", "o4-kandira", "KANDIRA"],
  ["KARTEPE", "o4-kartepe", "KARTEPE"],
  ["DOĞU İZMİT", "o4-dogu-izmit", "DOĞU İZMİT"],
  ["SAPANCA", "o4-sapanca", "SAPANCA"],
  ["ADAPAZARI", "o4-adapazari", "ADAPAZARI"],
  ["BEKİRPAŞA", "o4-bekirpasa", "BEKİRPAŞA"],
  ["AKYAZI", "o4-akyazi", "AKYAZI"],
  ["TOPAĞAÇ", "o4-topagac", "TOPAĞAÇ"],
  ["HENDEK", "o4-hendek", "HENDEK"],
  ["DÜZCE (GÖLYAKA)", "o4-duzce", "DÜZCE (GÖLYAKA)"],
  ["DÜZCE ORGANİZE SAN.", "o4-duzce-osb", "DÜZCE ORGANİZE SAN."],
  ["KAYNAŞLI", "o4-kaynasli", "KAYNAŞLI"],
  ["ABANT", "o4-abant", "ABANT"],
  ["BOLU BATI", "o4-bolu-bati", "BOLU BATI"],
  ["ÇAYDURT", "o4-caydurt", "ÇAYDURT"],
  ["YENİÇAĞA", "o4-yenicaga", "YENİÇAĞA"],
  ["DÖRTDİVAN", "o4-dortdivan", "DÖRTDİVAN"],
  ["GEREDE", "o4-gerede", "GEREDE"],
  ["PELİTÇİK (ÇAMLIDERE)", "o4-pelitcik", "PELİTÇİK (ÇAMLIDERE)"],
  ["ÇELTİKÇİ (KIZILCAHAMAM)", "o4-celtikci", "ÇELTİKÇİ (KIZILCAHAMAM)"],
  ["AKINCI", "o4-akinci", "AKINCI"],
];

// Station order of the section (road order), must match data/tolls/O-4.json.
const STATION_ORDER = [
  "o4-camlica", "o4-samandira", "o4-sultanbeyli", "o4-mecidiye", "o4-kurtkoy", "o4-orhanli",
  "o4-sekerpinar", "o4-gebze-osb", "o4-gebze", "o4-muallimkoy", "o4-liman", "o4-dil-iskelesi",
  "o4-bati-hereke", "o4-dogu-hereke", "o4-korfez", "o4-bati-izmit", "o4-kandira", "o4-kartepe",
  "o4-dogu-izmit", "o4-sapanca", "o4-adapazari", "o4-bekirpasa", "o4-akyazi", "o4-topagac",
  "o4-hendek", "o4-duzce", "o4-duzce-osb", "o4-kaynasli", "o4-abant", "o4-bolu-bati",
  "o4-caydurt", "o4-yenicaga", "o4-dortdivan", "o4-gerede", "o4-pelitcik", "o4-celtikci",
  "o4-akinci",
];

const LINE_TOL = 1.5; // same text line if |dy| <= this
const HEADER_BAND = 6; // header labels lie within this many pt of "İSTASYON"
const HEADER_MERGE_TOL = 7; // header fragments with x-centres this close form one label
const CELL_TOL = 8; // a cell must be this close to its column centre (columns are ~20pt apart)
const EXPECTED_PAIRS = 581;

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

export default async function parse(pdfPath) {
  const all = await readItems(pdfPath);
  assert(all.length > 0, "O-4: PDF has no text");
  assert(new Set(all.map((i) => i.page)).size === 1, "O-4: expected a single-page PDF");
  assert(all.some((i) => /ANADOLU OTOYOLU/.test(i.str) && /AKINCI/.test(i.str)), "O-4: title 'ANADOLU OTOYOLU (ÇAMLICA-AKINCI…)' not found");

  // ---- validFrom
  const validFrom = findValidFrom(all.filter((i) => /itibaren|geçerli/i.test(i.str)));
  assert(/^20\d{2}-\d{2}-\d{2}$/.test(validFrom), `O-4: bad validFrom ${validFrom}`);

  // ---- header
  const ist = all.filter((i) => i.str === "İSTASYON");
  assert(ist.length === 1, `O-4: expected one "İSTASYON" header, got ${ist.length}`);
  const sinif = all.filter((i) => i.str === "ARAÇ SINIFI");
  assert(sinif.length === 1, `O-4: expected one "ARAÇ SINIFI" header, got ${sinif.length}`);
  const headerY = ist[0].y;
  const classX = cx(sinif[0]);
  const dataLeft = sinif[0].x + sinif[0].w; // everything right of this is a cell / column header

  const headerItems = all.filter((i) => Math.abs(i.y - headerY) <= HEADER_BAND && i.x > dataLeft);
  const clusters = [];
  for (const it of [...headerItems].sort((a, b) => cx(a) - cx(b))) {
    const c = clusters.find((k) => Math.abs(k.x - cx(it)) <= HEADER_MERGE_TOL);
    if (c) c.items.push(it);
    else clusters.push({ x: cx(it), items: [it] });
  }
  clusters.sort((a, b) => a.x - b.x);
  const colLabels = clusters.map((c) => norm(c.items.sort((a, b) => b.y - a.y).map((i) => i.str).join(" ")));
  assert(
    colLabels.length === COLUMNS.length && colLabels.every((l, k) => l === COLUMNS[k][0]),
    `O-4: column headers changed:\n  got      ${JSON.stringify(colLabels)}\n  expected ${JSON.stringify(COLUMNS.map((c) => c[0]))}`,
  );
  // column centre = centre of the widest fragment's line (use the mean of fragment centres)
  const colX = clusters.map((c) => c.items.reduce((s, i) => s + cx(i), 0) / c.items.length);
  const colIndex = (x, what) => {
    let best = 0;
    for (let k = 1; k < colX.length; k++) if (Math.abs(colX[k] - x) < Math.abs(colX[best] - x)) best = k;
    assert(Math.abs(colX[best] - x) <= CELL_TOL, `O-4: ${what} at x=${x.toFixed(1)} is not under any column`);
    return best;
  };

  // ---- body: between header and the footer notes
  const footer = all.filter((i) => /^Not:/.test(i.str) && i.y < headerY);
  assert(footer.length === 1, `O-4: expected one "Not:" footer line, got ${footer.length}`);
  const footerY = footer[0].y;
  const body = all.filter((i) => i.y < headerY - HEADER_BAND && i.y > footerY + LINE_TOL);
  const lines = groupLines(body);

  // Split lines into station blocks: a label line (text left of the class column,
  // not a class digit) starts a block, class lines ("1".."6" under ARAÇ SINIFI) follow.
  const blocks = [];
  for (const line of lines) {
    const left = line.items.filter((i) => cx(i) < classX - 8);
    const classTag = line.items.filter((i) => /^[1-6]$/.test(i.str) && Math.abs(cx(i) - classX) <= 8);
    const cells = line.items.filter((i) => i.x > dataLeft - 12 && !classTag.includes(i));
    if (left.length) {
      assert(classTag.length === 0, `O-4: line y=${line.y.toFixed(1)} has both a label and a class tag`);
      blocks.push({ label: norm(left.map((i) => i.str).join(" ")), y: line.y, kmCells: cells, classes: {} });
    } else {
      assert(classTag.length === 1, `O-4: unexpected line at y=${line.y.toFixed(1)}: ${line.items.map((i) => i.str).join(" | ")}`);
      assert(blocks.length > 0, "O-4: class line before first station label");
      const cls = Number(classTag[0].str);
      const b = blocks[blocks.length - 1];
      assert(!(cls in b.classes), `O-4: duplicate class ${cls} line in row ${b.label}`);
      b.classes[cls] = cells;
    }
  }
  assert(
    blocks.length === ROWS.length && blocks.every((b, k) => b.label === ROWS[k][0]),
    `O-4: row labels changed:\n  got      ${JSON.stringify(blocks.map((b) => b.label))}\n  expected ${JSON.stringify(ROWS.map((r) => r[0]))}`,
  );

  // ---- cells
  const colIdOf = COLUMNS.map((c) => c[1]);
  const prices = {};
  let pairs = 0;
  const put = (a, b, p) => {
    prices[a] ??= {};
    assert(!(b in prices[a]), `O-4: price ${a}→${b} defined twice`);
    prices[a][b] = p;
  };
  blocks.forEach((b, k) => {
    const [label, id, diagLabel] = ROWS[k];
    const diag = COLUMNS.findIndex((c) => c[0] === diagLabel);
    assert(diag >= 0, `O-4: no column ${diagLabel}`);

    // km line: exactly one "x km" cell under each column west of the diagonal
    const kmCols = b.kmCells.map((i) => {
      assert(/^[\d.,]+ km$/.test(i.str), `O-4: row ${label}: unexpected text on km line "${i.str}"`);
      return colIndex(cx(i), `row ${label} km cell "${i.str}"`);
    });
    assert(
      kmCols.length === diag && kmCols.every((c, n) => c === n),
      `O-4: row ${label}: km cells under columns ${kmCols} (expected 0..${diag - 1})`,
    );

    // 6 class lines, each with one number per column 0..diag
    const perClass = [];
    for (let cls = 1; cls <= 6; cls++) {
      const cells = b.classes[cls];
      assert(cells, `O-4: row ${label}: class ${cls} line missing`);
      const byCol = new Map();
      for (const i of cells) {
        const v = trNumber(i.str);
        assert(Number.isFinite(v), `O-4: row ${label} class ${cls}: non-numeric cell "${i.str}"`);
        const c = colIndex(cx(i), `row ${label} class ${cls} cell "${i.str}"`);
        assert(!byCol.has(c), `O-4: row ${label} class ${cls}: two cells under column ${COLUMNS[c][0]}`);
        byCol.set(c, v);
      }
      assert(
        byCol.size === diag + 1 && [...byCol.keys()].every((c) => c <= diag),
        `O-4: row ${label} class ${cls}: ${byCol.size} cells, expected ${diag + 1} (columns 0..${diag})`,
      );
      perClass.push(byCol);
    }
    for (let c = 0; c < diag; c++) {
      const p = perClass.map((m) => m.get(c));
      const other = colIdOf[c];
      put(id, other, p);
      put(other, id, p);
      pairs++;
    }
    // sanity: diagonal (farthest fare) is the maximum of the row for every class
    perClass.forEach((m, n) => {
      const d = m.get(diag);
      for (const [c, v] of m) assert(v <= d, `O-4: row ${label} class ${n + 1}: cell ${COLUMNS[c][0]}=${v} exceeds diagonal ${d}`);
    });
  });
  assert(pairs === EXPECTED_PAIRS, `O-4: ${pairs} station pairs, expected ${EXPECTED_PAIRS}`);

  // class sanity: c1<=c2<=...<=c5 and motorcycle (c6) <= c1
  for (const [a, o] of Object.entries(prices))
    for (const [b, p] of Object.entries(o)) {
      for (let n = 1; n < 5; n++) assert(p[n] >= p[n - 1], `O-4: ${a}→${b} class ${n + 1} < class ${n}: ${p}`);
      assert(p[5] <= p[0], `O-4: ${a}→${b} motorcycle > class 1: ${p}`);
    }

  // stable key order (road order)
  assert(new Set(STATION_ORDER).size === STATION_ORDER.length, "O-4: duplicate id in STATION_ORDER");
  const ordered = {};
  for (const a of STATION_ORDER) {
    if (!prices[a]) continue;
    ordered[a] = {};
    for (const b of STATION_ORDER) if (prices[a][b]) ordered[a][b] = prices[a][b];
  }
  const known = new Set(STATION_ORDER);
  for (const [a, o] of Object.entries(prices)) {
    assert(known.has(a), `O-4: unknown station ${a}`);
    for (const b of Object.keys(o)) assert(known.has(b), `O-4: unknown station ${b}`);
  }

  return {
    validFrom,
    sections: [{ id: SECTION_ID, stations: [...STATION_ORDER], prices: ordered }],
  };
}
