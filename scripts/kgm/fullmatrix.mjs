// Shared parser for KGM "full square matrix" tariff PDFs (KCY, KMO-AV, KMO-AN):
//   - one header line with every exit station (ÇIKIŞ GİŞELERİ), left → right,
//   - per entry station (GİRİŞ GİŞELERİ) a block of 6 class lines "1".."6",
//   - every cell filled, the diagonal holds the U-turn (farthest distance) fare,
//   - optionally a "Serbest Geçiş Sistemi" (SGS) table below: one line per gantry+direction.
// Every number is mapped to a column by x (nearest header centre) and to a class line
// by y (nearest class label), so changed values still parse; anything unexpected throws.
import { readItems, trNumber, assert } from "./lib.mjs";

const norm = (s) => s.replace(/\s+/g, " ").trim();

/** Date of "Ücretler dd/mm/yyyy saat ... itibaren geçerlidir" (ignores other dates such as 01.01.2022 notes). */
export function tariffValidFrom(items) {
  const dates = new Set();
  for (const it of items) {
    const m = it.str.match(/(\d{2})[./](\d{2})[./](20\d{2})\s*saat/i);
    if (m && /itibaren/i.test(it.str)) dates.add(`${m[3]}-${m[2]}-${m[1]}`);
  }
  assert(dates.size === 1, `validFrom: expected exactly one tariff date, found [${[...dates]}]`);
  return [...dates][0];
}

/**
 * opts: {
 *   columns: [[pdfHeaderLabel, id], ...]   left → right, exact header text
 *   rows:    [[pdfRowLabel | [labels...], id], ...] top → bottom
 *   ignoreLeft: RegExp  — other left-column texts inside the matrix to ignore
 *   bottomY: number     — optional; nothing of the matrix lies below this y (default: auto)
 * }
 * returns { stations, prices, uTurn, items, matrixBottomY }
 */
export async function parseFullMatrix(pdfPath, opts) {
  const items = await readItems(pdfPath);
  assert(new Set(items.map((i) => i.page)).size === 1, "expected a single-page PDF");
  const { columns, rows } = opts;
  assert(columns.length === rows.length, "columns/rows tables differ in length");

  // --- header
  const header = columns.map(([label, id]) => {
    const hits = items.filter((i) => norm(i.str) === label);
    assert(hits.length >= 1, `header "${label}" not found`);
    // the header is the top-most occurrence (row labels repeat some names further down)
    const h = hits.sort((a, b) => b.y - a.y)[0];
    return { label, id, x: h.x, y: h.y, c: h.x + h.w / 2 };
  });
  const hy = header[0].y;
  for (const h of header) assert(Math.abs(h.y - hy) < 2, `header "${h.label}" not on the header line`);
  for (let i = 1; i < header.length; i++) assert(header[i].x > header[i - 1].x, `header order changed at "${header[i].label}"`);
  const leftLimit = header[0].x - 3;

  // --- class lines
  const classItems = items
    .filter((i) => /^[1-6]$/.test(i.str) && i.x < leftLimit && i.y < hy - 2)
    .sort((a, b) => b.y - a.y);
  // keep only the matrix's class labels: consecutive runs of 1..6
  const classes = [];
  for (const c of classItems) {
    const expected = (classes.length % 6) + 1;
    if (+c.str === expected) classes.push(c);
    else break;
    if (classes.length === rows.length * 6) break;
  }
  assert(classes.length === rows.length * 6, `expected ${rows.length * 6} class lines, found ${classes.length}`);
  const top = classes[0].y + 4;
  const bottom = opts.bottomY ?? classes[classes.length - 1].y - 4;

  // --- row labels
  const groups = [];
  for (let g = 0; g < rows.length; g++) groups.push(classes.slice(g * 6, g * 6 + 6));
  const leftTexts = items.filter(
    (i) => i.x < leftLimit && i.y < top && i.y > bottom && !/^[1-6]$/.test(i.str) && !(opts.ignoreLeft && opts.ignoreLeft.test(norm(i.str)))
  );
  const rowOf = new Map(); // group index → row id
  for (const t of leftTexts) {
    const label = norm(t.str);
    const r = rows.findIndex(([l]) => (Array.isArray(l) ? l : [l]).includes(label));
    assert(r >= 0, `unknown row label "${label}" at y=${t.y.toFixed(1)}`);
    const g = groups.findIndex((gr) => t.y <= gr[0].y + 2 && t.y >= gr[5].y - 2);
    assert(g >= 0, `row label "${label}" not inside a 6-class block`);
    assert(g === r, `row "${label}" found at block ${g}, expected ${r} (row order changed)`);
    assert(!rowOf.has(g), `two row labels for block ${g}`);
    rowOf.set(g, rows[r][1]);
  }
  assert(rowOf.size === rows.length, `found ${rowOf.size} row labels, expected ${rows.length}`);

  // --- cells
  const cell = rows.map(() => header.map(() => [null, null, null, null, null, null]));
  const nums = items.filter((i) => i.y < top && i.y > bottom && i.x >= leftLimit && !Number.isNaN(trNumber(i.str)));
  for (const n of nums) {
    const cx = n.x + n.w / 2;
    let col = 0;
    for (let j = 1; j < header.length; j++) if (Math.abs(header[j].c - cx) < Math.abs(header[col].c - cx)) col = j;
    let ci = 0;
    for (let k = 1; k < classes.length; k++) if (Math.abs(classes[k].y - n.y) < Math.abs(classes[ci].y - n.y)) ci = k;
    assert(Math.abs(header[col].c - cx) < 12, `number ${n.str} at x=${n.x.toFixed(1)} is not under a column`);
    assert(Math.abs(classes[ci].y - n.y) < 3.5, `number ${n.str} at y=${n.y.toFixed(1)} is not on a class line`);
    const r = Math.floor(ci / 6), k = ci % 6;
    assert(cell[r][col][k] === null, `two numbers in cell ${rows[r][1]}→${header[col].id} class ${k + 1}`);
    cell[r][col][k] = trNumber(n.str);
  }
  // non-number texts inside the matrix body are not allowed
  const stray = items.filter((i) => i.y < top && i.y > bottom && i.x >= leftLimit && Number.isNaN(trNumber(i.str)));
  assert(stray.length === 0, `unexpected text in matrix: ${stray.map((s) => s.str).join(", ")}`);

  const prices = {}, uTurn = {};
  rows.forEach(([, from], r) => {
    prices[from] = {};
    header.forEach((h, c) => {
      const v = cell[r][c];
      assert(v.every((x) => typeof x === "number" && x >= 0), `missing value in ${from}→${h.id}: ${v}`);
      if (h.id === from) uTurn[from] = v;
      else prices[from][h.id] = v;
    });
  });
  assert(Object.keys(uTurn).length === rows.length, "row/column id tables do not form a square with a diagonal");
  return { stations: rows.map(([, id]) => id), prices, uTurn, items, matrixBottomY: bottom };
}

/**
 * SGS table: lines anchored on direction cells. opts: {
 *   directionRe: RegExp matching direction cells,
 *   labels: { pdfLabel(joined, normalised): displayName },
 *   expected: number of lines,
 *   belowY: only look below this y
 * } → [{ name, direction, prices:[6] }] in PDF order (top → bottom)
 */
export function parseFreeFlow(items, opts) {
  const region = items.filter((i) => i.y < opts.belowY);
  const dirs = region.filter((i) => opts.directionRe.test(norm(i.str))).sort((a, b) => b.y - a.y);
  assert(dirs.length === opts.expected, `SGS: expected ${opts.expected} lines, found ${dirs.length}`);
  const used = new Set();
  const out = dirs.map((d) => {
    const vals = region
      .filter((i) => i.x > d.x + 5 && Math.abs(i.y - d.y) <= 1.5 && !Number.isNaN(trNumber(i.str)))
      .sort((a, b) => a.x - b.x);
    assert(vals.length === 6, `SGS line at y=${d.y.toFixed(1)}: ${vals.length} values`);
    vals.forEach((v) => used.add(v));
    // label: texts left of the direction cell, within ±4.5pt (two-line labels sit ~3pt above/below)
    const lab = region
      .filter((i) => i.x < d.x - 2 && Math.abs(i.y - d.y) <= 4.5)
      .sort((a, b) => b.y - a.y)
      .map((i) => norm(i.str))
      .join(" ");
    const name = opts.labels[norm(lab)];
    assert(name, `SGS: unknown label "${lab}" at y=${d.y.toFixed(1)}`);
    return { name, direction: norm(d.str), prices: vals.map((v) => trNumber(v.str)) };
  });
  const extra = region.filter(
    (i) => !used.has(i) && !Number.isNaN(trNumber(i.str)) && !(opts.headerY && Math.abs(i.y - opts.headerY) < 1.5)
  );
  assert(extra.length === 0, `SGS: unassigned numbers ${extra.map((e) => e.str).join(", ")}`);
  return out;
}
