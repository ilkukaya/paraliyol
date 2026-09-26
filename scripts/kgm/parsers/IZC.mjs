// İzmir-Çeşme Otoyolu (KGM) — 6-Izmir-Cesme.pdf
//
// This file also exports `readGrid` / `buildPrices`, the position-based table reader
// shared by the IZA, MAC and ADO parsers (the parser contract allows only one file per
// highway, so the shared code lives here).
import { readItems, trNumber, findValidFrom, assert } from "../lib.mjs";

const norm = (s) => s.replace(/\s+/g, " ").trim();
const cx = (i) => i.x + i.w / 2;
const PRICE_RE = /^\d[\d.]*,\d\d$/;

/**
 * Reads a KGM "İSTASYON | SINIF | <exit columns>" tariff table by x/y position.
 *
 * opts.labels      { "<PDF label, words joined by single spaces>": "<station id>" } — explicit table.
 * opts.order       station ids in the expected road order (header columns must match it).
 * opts.labelPlace  "above"  → a row's station label sits at/just above its class-1 row (İzmir tables)
 *                  "inside" → the label sits between its class-1 and class-6 rows (MAC / ADO tables)
 * opts.ignore      left-side / header texts that are not station labels (e.g. "GİRİŞ GİŞELERİ").
 *
 * Returns { items, rows: [id], cols: [id], cell(rowId, colId) → [c1..c6] | undefined }.
 */
export async function readGrid(pdfPath, opts) {
  const items = await readItems(pdfPath);
  const pages = new Set(items.map((i) => i.page));
  assert(pages.size === 1, `${pdfPath}: expected a 1-page PDF, got ${pages.size}`);
  const ignore = new Set(["İSTASYON", "SINIF", ...(opts.ignore ?? [])]);
  const toId = (label, where) => {
    const id = opts.labels[label];
    assert(id, `${pdfPath}: unknown ${where} label "${label}"`);
    return id;
  };

  const sinifs = items.filter((i) => i.str === "SINIF");
  assert(sinifs.length === 1, `${pdfPath}: expected one "SINIF" header, got ${sinifs.length}`);
  const sinif = sinifs[0];
  const sinifRight = sinif.x + sinif.w;

  // --- class rows: "1".."6" centred under SINIF
  const classRows = items
    .filter((i) => /^[1-6]$/.test(i.str) && Math.abs(cx(i) - cx(sinif)) < 8 && i.y < sinif.y)
    .sort((a, b) => b.y - a.y);
  const n = opts.order.length;
  assert(classRows.length === 6 * n, `${pdfPath}: expected ${6 * n} class rows, got ${classRows.length}`);
  classRows.forEach((r, k) =>
    assert(Number(r.str) === (k % 6) + 1, `${pdfPath}: class rows out of sequence at y=${r.y.toFixed(1)} ("${r.str}")`),
  );
  const blocks = [];
  for (let b = 0; b < n; b++) blocks.push(classRows.slice(b * 6, b * 6 + 6));
  const topY = classRows[0].y;
  const bottomY = classRows[classRows.length - 1].y;

  // --- header columns: items right of SINIF between the first class row and the SINIF line
  const headerItems = items.filter(
    (i) => i.x > sinifRight && i.y > topY + 3 && i.y <= sinif.y + 10 && !ignore.has(norm(i.str)),
  );
  const groups = [];
  for (const it of headerItems.sort((a, b) => cx(a) - cx(b))) {
    const g = groups.find((g) => Math.abs(g.cx - cx(it)) < 15);
    if (g) g.items.push(it);
    else groups.push({ cx: cx(it), items: [it] });
  }
  const cols = groups.map((g) => ({
    cx: g.cx,
    id: toId(norm(g.items.sort((a, b) => b.y - a.y || a.x - b.x).map((i) => i.str).join(" ")), "column"),
  }));
  assert(
    JSON.stringify(cols.map((c) => c.id)) === JSON.stringify(opts.order),
    `${pdfPath}: column order ${cols.map((c) => c.id)} != expected ${opts.order}`,
  );
  const minSpacing = Math.min(...cols.slice(1).map((c, k) => c.cx - cols[k].cx));

  // --- row labels: items left of SINIF, inside the table's y range
  const labelItems = items.filter(
    (i) =>
      i.x + i.w < sinif.x &&
      i.y >= bottomY - 3 &&
      i.y <= topY + 20 &&
      !ignore.has(norm(i.str)),
  );
  const blockLabels = blocks.map(() => []);
  for (const it of labelItems) {
    const hits = blocks
      .map((bl, k) => ({ bl, k }))
      .filter(({ bl }) =>
        opts.labelPlace === "above"
          ? it.y >= bl[0].y - 3 && it.y <= bl[0].y + 20
          : it.y >= bl[5].y - 3 && it.y <= bl[0].y + 3,
      );
    assert(hits.length === 1, `${pdfPath}: row label "${it.str}" (y=${it.y.toFixed(1)}) matches ${hits.length} row blocks`);
    blockLabels[hits[0].k].push(it);
  }
  const rows = blockLabels.map((ls, k) => {
    assert(ls.length > 0, `${pdfPath}: row block ${k + 1} has no station label`);
    return toId(norm(ls.sort((a, b) => b.y - a.y || a.x - b.x).map((i) => i.str).join(" ")), "row");
  });
  assert(new Set(rows).size === n, `${pdfPath}: duplicate row stations ${rows}`);

  // --- cells
  const used = new Set();
  const cells = new Map(); // "row|col" -> [c1..c6]
  blocks.forEach((bl, k) => {
    for (const cr of bl) {
      const cls = Number(cr.str);
      const line = items.filter((i) => Math.abs(i.y - cr.y) < 2 && i.x > sinifRight && i.str !== "₺");
      for (const it of line) {
        const v = trNumber(it.str);
        assert(PRICE_RE.test(it.str.replace(/[\s₺]/g, "")) && Number.isFinite(v), `${pdfPath}: non-price cell "${it.str}" in row ${rows[k]} class ${cls}`);
        const dists = cols.map((c) => Math.abs(c.cx - cx(it)));
        const j = dists.indexOf(Math.min(...dists));
        assert(dists[j] < 0.45 * minSpacing, `${pdfPath}: cell "${it.str}" (x=${cx(it).toFixed(1)}) not under any column`);
        const key = `${rows[k]}|${cols[j].id}`;
        const arr = cells.get(key) ?? [];
        assert(arr[cls - 1] === undefined, `${pdfPath}: two values for ${key} class ${cls}`);
        arr[cls - 1] = v;
        cells.set(key, arr);
        used.add(it);
      }
    }
  });
  for (const [key, arr] of cells)
    assert(arr.length === 6 && arr.every((v) => Number.isFinite(v)), `${pdfPath}: incomplete classes for ${key}`);

  // Every price-looking number in the table area must have been consumed.
  const stray = items.filter(
    (i) => !used.has(i) && PRICE_RE.test(i.str.replace(/[\s₺]/g, "")) && i.y >= bottomY - 3 && i.y <= sinif.y + 10,
  );
  assert(stray.length === 0, `${pdfPath}: unassigned numbers ${stray.map((i) => i.str)}`);

  return { items, rows, cols: cols.map((c) => c.id), cell: (r, c) => cells.get(`${r}|${c}`), cellCount: cells.size };
}

/**
 * Builds the directional price map (diagonal excluded).
 * mode "triangle": row i holds columns 0..i (last = U dönüşü); price is the same both directions.
 * mode "full":     every row holds every column; row = giriş, column = çıkış.
 */
export function buildPrices(pdfPath, grid, order, mode) {
  const n = order.length;
  if (mode === "triangle") {
    assert(JSON.stringify(grid.rows) === JSON.stringify(order), `${pdfPath}: row order ${grid.rows} != ${order}`);
    assert(grid.cellCount === (n * (n + 1)) / 2, `${pdfPath}: expected ${(n * (n + 1)) / 2} cells, got ${grid.cellCount}`);
    order.forEach((r, i) =>
      order.forEach((c, j) => assert((grid.cell(r, c) !== undefined) === (j <= i), `${pdfPath}: unexpected cell presence ${r}→${c}`)),
    );
  } else {
    assert(grid.cellCount === n * n, `${pdfPath}: expected ${n * n} cells, got ${grid.cellCount}`);
  }
  const prices = {};
  order.forEach((a, i) => {
    prices[a] = {};
    order.forEach((b, j) => {
      if (i === j) return;
      const v = mode === "triangle" ? (i > j ? grid.cell(a, b) : grid.cell(b, a)) : grid.cell(a, b);
      assert(v, `${pdfPath}: missing price ${a}→${b}`);
      prices[a][b] = [...v];
    });
  });
  return prices;
}

const LABELS = {
  "SEFERİHİSAR (GÜZELBAHÇE)": "izc-seferihisar",
  URLA: "izc-urla",
  KARABURUN: "izc-karaburun",
  ZEYTİNLER: "izc-zeytinler",
  ALAÇATI: "izc-alacati",
  ÇEŞME: "izc-cesme",
};
const ORDER = ["izc-seferihisar", "izc-urla", "izc-karaburun", "izc-zeytinler", "izc-alacati", "izc-cesme"];

export default async function parse(pdfPath) {
  const grid = await readGrid(pdfPath, { labels: LABELS, order: ORDER, labelPlace: "above" });
  return {
    validFrom: findValidFrom(grid.items),
    sections: [{ id: "izc-main", stations: ORDER, prices: buildPrices(pdfPath, grid, ORDER, "triangle") }],
  };
}
