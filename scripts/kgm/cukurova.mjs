// Shared position-based parser for the KGM "Çukurova Otoyolları" tariff layout
// (8-Adana-Gaziantep, 9-Gaziantep-Şanlıurfa, 10-Niğde-Mersin-Adana).
//
// Layout: one lower-triangular matrix. Column headers across the top (centered,
// possibly 2–3 text lines), one block per row station: a label line
// ("CEYHAN | 8,000 km | ...") followed by six class lines ("1 | 36,00 | 102,00").
// The cell in the row station's own column is the U-dönüşü (diagonal) fee and is
// dropped. The table is not directional: a cell is the fee for both directions.
//
// Every number is mapped to a column by its x-center and to a row by its y
// position; explicit label→id tables (no guessing). Anything unexpected throws.
import { readItems, trNumber, findValidFrom, assert } from "./lib.mjs";

const norm = (s) => s.replace(/\s+/g, " ").trim();
const cx = (i) => i.x + i.w / 2;

/**
 * cfg = {
 *   sectionId,
 *   columns: { "<joined header label>": "<id>" }   (every header must be listed)
 *   rows:    { "<row label>": "<id>" }             (every row label must be listed)
 *   missingPairs: [["idA","idB"], ...]             pairs that legitimately have no cell
 * }
 */
export async function parseTriangular(pdfPath, cfg) {
  const items = await readItems(pdfPath);
  const validFrom = findValidFrom(items);

  const istasyon = items.filter((i) => i.str === "İSTASYON");
  const sinif = items.filter((i) => i.str === "SINIF");
  assert(istasyon.length === 1 && sinif.length === 1, "expected exactly one İSTASYON/SINIF header");
  const page = istasyon[0].page;
  const pageItems = items.filter((i) => i.page === page);
  const headY = istasyon[0].y;
  const sinifX = cx(sinif[0]);

  // ---- column headers: items within ±10 of the İSTASYON line, right of SINIF
  const headerItems = pageItems.filter(
    (i) => Math.abs(i.y - headY) <= 10 && cx(i) > sinifX + 12 && i.str !== "İSTASYON" && i.str !== "SINIF",
  );
  const clusters = [];
  for (const it of headerItems.sort((a, b) => cx(a) - cx(b))) {
    const c = clusters.find((k) => Math.abs(k.x - cx(it)) < 10);
    if (c) c.items.push(it);
    else clusters.push({ x: cx(it), items: [it] });
  }
  const columns = clusters.map((c) => {
    const label = norm(c.items.sort((a, b) => b.y - a.y).map((i) => i.str).join(" "));
    const id = cfg.columns[label];
    assert(id, `unknown column header "${label}"`);
    return { id, label, x: c.x };
  });
  assert(columns.length === Object.keys(cfg.columns).length, `expected ${Object.keys(cfg.columns).length} columns, got ${columns.length}`);
  assert(new Set(columns.map((c) => c.id)).size === columns.length, "duplicate column ids");
  for (let k = 1; k < columns.length; k++) assert(columns[k].x - columns[k - 1].x > 25, "columns too close together");
  const colGap = Math.min(...columns.slice(1).map((c, k) => c.x - columns[k].x));
  const colOf = (it) => {
    const x = cx(it);
    const best = columns.reduce((a, c) => (Math.abs(c.x - x) < Math.abs(a.x - x) ? c : a));
    assert(Math.abs(best.x - x) < colGap / 3, `cell "${it.str}" at x=${x.toFixed(1)} does not sit under any column`);
    return best.id;
  };

  // ---- body lines (below the header band)
  const body = pageItems.filter((i) => i.y < headY - 10);
  const groups = [];
  for (const it of body.sort((a, b) => b.y - a.y)) {
    const g = groups.find((l) => Math.abs(l.y - it.y) < 1.5);
    if (g) g.items.push(it);
    else groups.push({ y: it.y, items: [it] });
  }
  const sorted = groups.map((g) => g.items.sort((a, b) => a.x - b.x));

  const rows = []; // { id, classes: {1: [{col,value}]}}
  let cur = null;
  for (const line of sorted) {
    const first = line[0];
    if (/^Not\b/i.test(first.str) || /itibaren/.test(first.str)) break; // footer
    if (/^[1-6]$/.test(first.str) && Math.abs(cx(first) - sinifX) < 8) {
      assert(cur, `class line before any station label (y=${first.y})`);
      const cls = Number(first.str);
      assert(!cur.classes[cls], `duplicate class ${cls} for ${cur.id}`);
      cur.classes[cls] = line.slice(1).map((it) => {
        const v = trNumber(it.str);
        assert(Number.isFinite(v), `non-numeric cell "${it.str}" in ${cur.id} class ${cls}`);
        return { col: colOf(it), value: v };
      });
      continue;
    }
    assert(cx(first) < sinifX, `unexpected text "${first.str}" at y=${first.y}`);
    const label = norm(first.str);
    const id = cfg.rows[label];
    assert(id, `unknown row label "${label}"`);
    for (const it of line.slice(1)) assert(/km$/.test(it.str), `unexpected cell "${it.str}" on label line of ${label}`);
    cur = { id, label, classes: {} };
    rows.push(cur);
  }
  assert(rows.length === Object.keys(cfg.rows).length, `expected ${Object.keys(cfg.rows).length} rows, got ${rows.length}`);

  // ---- assemble symmetric prices
  const order = columns.map((c) => c.id);
  const pair = new Map();
  for (const r of rows) {
    const cols0 = r.classes[1]?.map((c) => c.col);
    for (let cls = 1; cls <= 6; cls++) {
      const cells = r.classes[cls];
      assert(cells, `${r.id}: class ${cls} missing`);
      assert(JSON.stringify(cells.map((c) => c.col)) === JSON.stringify(cols0), `${r.id}: class ${cls} columns differ from class 1`);
      assert(new Set(cells.map((c) => c.col)).size === cells.length, `${r.id}: two cells in one column`);
    }
    assert(cols0.includes(r.id), `${r.id}: no diagonal (U-dönüşü) cell`);
    for (const col of cols0) {
      if (col === r.id) continue;
      const key = [r.id, col].sort().join("|");
      assert(!pair.has(key), `pair ${key} appears twice`);
      pair.set(key, [1, 2, 3, 4, 5, 6].map((cls) => r.classes[cls].find((c) => c.col === col).value));
    }
  }
  const missing = new Set((cfg.missingPairs ?? []).map((p) => [...p].sort().join("|")));
  const prices = {};
  for (const a of order) {
    prices[a] = {};
    for (const b of order) {
      if (a === b) continue;
      const key = [a, b].sort().join("|");
      if (missing.has(key)) {
        assert(!pair.has(key), `pair ${key} was expected to be missing but has a price`);
        continue;
      }
      assert(pair.has(key), `no price for ${a} ↔ ${b}`);
      prices[a][b] = [...pair.get(key)];
    }
  }
  assert(pair.size + missing.size === (order.length * (order.length - 1)) / 2, "pair count mismatch");
  return { validFrom, sections: [{ id: cfg.sectionId, stations: order, prices }] };
}
