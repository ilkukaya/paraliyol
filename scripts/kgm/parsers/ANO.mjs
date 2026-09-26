// KGM tariff: 17-Ankara-Nigde.pdf → data/tolls/ANO.json
// Ankara–Niğde Otoyolu (O-21 north part). Full square matrix, directional:
// row = giriş, column = çıkış. Each station block has six class lines
// ("1 | ₺ | 740,00 | ₺ | 90,00 ..."); the station label sits between class 3 and 4.
// The diagonal (same entry/exit = en uzak mesafe ücreti) is dropped.
import { readItems, trNumber, findValidFrom, assert } from "../lib.mjs";

const STATIONS = {
  "Ankara Alın": "ano-ankara",
  "Karagedik": "ano-karagedik",
  "Ahiboz": "ano-ahiboz",
  "Emirler": "ano-emirler",
  "Kulu-Kırıkkale": "ano-kulu-kirikkale",
  "Acıkuyu": "ano-acikuyu",
  "Evren-Sarıyahşi": "ano-evren-sariyahsi",
  "Ağaçören": "ano-agacoren",
  "Kırşehir": "ano-kirsehir",
  "Ortaköy": "ano-ortakoy",
  "Alayhan": "ano-alayhan",
  "Derinkuyu": "ano-derinkuyu",
  "Çiftlik": "ano-ciftlik",
  "Niğde Alın": "ano-nigde",
};
const N = Object.keys(STATIONS).length;
const cx = (i) => i.x + i.w / 2;
const norm = (s) => s.replace(/\s+/g, " ").trim();

export default async function parse(pdfPath) {
  const items = await readItems(pdfPath);
  const validFrom = findValidFrom(items);

  const head = items.filter((i) => i.str === "Giriş / Çıkış");
  const sinif = items.filter((i) => i.str === "Sınıf");
  assert(head.length === 1 && sinif.length === 1, "expected one 'Giriş / Çıkış' and one 'Sınıf' header");
  const page = head[0].page;
  const headY = head[0].y;
  const sinifX = cx(sinif[0]);
  const pageItems = items.filter((i) => i.page === page);

  // ---- column headers (single line)
  const headers = pageItems
    .filter((i) => Math.abs(i.y - headY) < 2 && cx(i) > sinifX + 8)
    .sort((a, b) => a.x - b.x)
    .map((i) => {
      const id = STATIONS[norm(i.str)];
      assert(id, `unknown column header "${i.str}"`);
      return { id, x: cx(i) };
    });
  assert(headers.length === N, `expected ${N} column headers, got ${headers.length}`);
  assert(new Set(headers.map((h) => h.id)).size === N, "duplicate column headers");
  const gap = Math.min(...headers.slice(1).map((h, k) => h.x - headers[k].x));
  const colOf = (it) => {
    const x = cx(it);
    const best = headers.reduce((a, h) => (Math.abs(h.x - x) < Math.abs(a.x - x) ? h : a));
    assert(Math.abs(best.x - x) < gap / 2, `cell "${it.str}" at x=${x.toFixed(1)} is not under a column`);
    return best.id;
  };

  // ---- body
  const footerY = Math.max(...pageItems.filter((i) => /^AÇIKLAMALAR/.test(i.str)).map((i) => i.y), -Infinity);
  assert(Number.isFinite(footerY), "AÇIKLAMALAR footer not found");
  const body = pageItems.filter((i) => i.y < headY - 2 && i.y > footerY + 2);
  const classLines = []; // { y, cls, cells:[{col,value}] }
  const labels = []; // { y, id }
  const groups = [];
  for (const it of body.sort((a, b) => b.y - a.y)) {
    const g = groups.find((l) => Math.abs(l.y - it.y) < 1.5);
    if (g) g.items.push(it);
    else groups.push({ y: it.y, items: [it] });
  }
  for (const g of groups) {
    const line = g.items.sort((a, b) => a.x - b.x);
    const first = line[0];
    if (/^[1-6]$/.test(first.str) && Math.abs(cx(first) - sinifX) < 6) {
      const cells = [];
      for (const it of line.slice(1)) {
        if (it.str === "₺") continue;
        const v = trNumber(it.str);
        assert(Number.isFinite(v), `non-numeric cell "${it.str}" at y=${g.y.toFixed(1)}`);
        cells.push({ col: colOf(it), value: v });
      }
      assert(cells.length === N, `class line at y=${g.y.toFixed(1)} has ${cells.length} cells, expected ${N}`);
      assert(new Set(cells.map((c) => c.col)).size === N, `class line at y=${g.y.toFixed(1)} has two cells in one column`);
      classLines.push({ y: g.y, cls: Number(first.str), cells });
    } else {
      assert(line.length === 1 && cx(first) < sinifX, `unexpected text "${line.map((i) => i.str).join(" | ")}" at y=${g.y.toFixed(1)}`);
      const id = STATIONS[norm(first.str)];
      assert(id, `unknown row label "${first.str}"`);
      labels.push({ y: g.y, id });
    }
  }
  assert(labels.length === N, `expected ${N} row labels, got ${labels.length}`);
  assert(classLines.length === 6 * N, `expected ${6 * N} class lines, got ${classLines.length}`);

  const order = headers.map((h) => h.id);
  const prices = {};
  for (let r = 0; r < N; r++) {
    const block = classLines.slice(6 * r, 6 * r + 6);
    block.forEach((l, k) => assert(l.cls === k + 1, `block ${r}: class lines out of order`));
    const lab = labels.filter((l) => l.y < block[2].y && l.y > block[3].y);
    assert(lab.length === 1, `block ${r}: expected one station label between class 3 and 4`);
    const from = lab[0].id;
    assert(!prices[from], `row ${from} appears twice`);
    prices[from] = {};
    for (const to of order) {
      if (to === from) continue;
      prices[from][to] = block.map((l) => l.cells.find((c) => c.col === to).value);
    }
  }
  const sortedPrices = Object.fromEntries(order.map((id) => [id, prices[id]]));
  assert(Object.keys(prices).length === N, "missing rows");
  return { validFrom, sections: [{ id: "ano-ankara-nigde", stations: order, prices: sortedPrices }] };
}
