// Parser for KGM "MALKARA-ÇANAKKALE (1915 ÇANAKKALE KÖPRÜSÜ DAHİL) OTOYOLU" tariff PDF
// (data/kgm-pdfs/18-Malkara-Canakkale.pdf) → data/tolls/MCO.json sections.
//
// Layout: one full 5×5 directional matrix (row = GİRİŞ, column = ÇIKIŞ), 6 class
// lines per row. Row labels are vertically centred inside their 6-line block and
// may share a text line with a class line, so a block is formed from the class
// tags "1".."6" and its label from the text left of SINIF within the block's y span.
// Header labels are 1–2 lines, centred; cells are centred under the headers.
//
// 1915 Çanakkale Köprüsü: "1915 ÇANAKKALE KÖPRÜSÜ G-5" is a toll plaza of this closed
// system (Lapseki side). G-4 ↔ G-5 is exactly the bridge tariff. Because the bridge
// fee is listed separately in data/tolls/bridges.json, it is REMOVED here from every
// cell involving G-5 (bridge fee := cell G-4→G-5, asserted equal to G-5→G-4), so
// G-4↔G-5 becomes 0 and bridge + net reproduces the PDF exactly.
// Diagonals (U-dönüşü = farthest fare) are not exported.
import { readItems, trNumber, findValidFrom, assert } from "../lib.mjs";

const TAG = "MCO";
const SECTION_ID = "mco-malkara-canakkale";
const SECTION_NAME = "Malkara - 1915 Çanakkale Köprüsü";

// [joined label (header and row use the same text), station id]
const STATIONS = [
  ["MALKARA G-1", "mco-malkara"],
  ["KAVAKKÖY G-2", "mco-kavakkoy"],
  ["GELİBOLU KUZEY G-3", "mco-gelibolu-kuzey"],
  ["GELİBOLU GÜNEY G-4", "mco-gelibolu-guney"],
  ["1915 ÇANAKKALE KÖPRÜSÜ G-5", "mco-1915-koprusu"],
];
const BRIDGE_FROM = "mco-gelibolu-guney"; // last plaza before the bridge
const BRIDGE_TO = "mco-1915-koprusu"; // plaza behind the bridge

const LINE_TOL = 1.5;
const HEADER_BAND = 4; // gap between the header block and the first class line
const HEADER_MERGE_TOL = 8;
// columns are ~73pt apart; numbers were centred in the January edition and right-aligned
// (≈20pt right of the header centre) in July 2026, so accept anything within half a column.
const CELL_TOL = 30;

const norm = (s) => s.replace(/\s+/g, " ").trim();
const cx = (i) => i.x + i.w / 2;

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
  assert(all.some((i) => /MALKARA-ÇANAKKALE/.test(i.str)), `${TAG}: title not found`);
  const validFrom = strictValidFrom(all);

  const sinif = all.filter((i) => i.str === "SINIF");
  assert(sinif.length === 1, `${TAG}: expected one "SINIF" header, got ${sinif.length}`);
  const headerY = sinif[0].y;
  const classX = cx(sinif[0]);
  const dataLeft = sinif[0].x + sinif[0].w;
  const cikis = all.find((i) => i.str === "ÇIKIŞ GİŞELERİ");
  assert(cikis, `${TAG}: "ÇIKIŞ GİŞELERİ" not found`);

  const notes = all.find((i) => /^AÇIKLAMALAR/.test(i.str));
  assert(notes, `${TAG}: "AÇIKLAMALAR:" not found`);
  const tags = all
    .filter((i) => /^[1-6]$/.test(i.str) && Math.abs(cx(i) - classX) <= 6 && i.y < headerY && i.y > notes.y)
    .sort((a, b) => b.y - a.y);
  assert(tags.length === STATIONS.length * 6, `${TAG}: ${tags.length} class lines, expected ${STATIONS.length * 6}`);
  const firstTagY = tags[0].y;

  // header: fragments between "ÇIKIŞ GİŞELERİ" and the first class line
  const frags = all.filter((i) => i.x > dataLeft && i.y < cikis.y - LINE_TOL && i.y > firstTagY + HEADER_BAND);
  const clusters = [];
  for (const it of [...frags].sort((a, b) => cx(a) - cx(b))) {
    const c = clusters.find((k) => Math.abs(k.x - cx(it)) <= HEADER_MERGE_TOL);
    if (c) c.items.push(it);
    else clusters.push({ x: cx(it), items: [it] });
  }
  clusters.sort((a, b) => a.x - b.x);
  const colLabels = clusters.map((c) => norm(c.items.sort((a, b) => b.y - a.y).map((i) => i.str).join(" ")));
  assert(
    colLabels.length === STATIONS.length && colLabels.every((l, k) => l === STATIONS[k][0]),
    `${TAG}: column headers changed:\n  got      ${JSON.stringify(colLabels)}\n  expected ${JSON.stringify(STATIONS.map((s) => s[0]))}`,
  );
  const colX = clusters.map((c) => c.items.reduce((s, i) => s + cx(i), 0) / c.items.length);
  const colIndex = (i, what) => {
    const x = cx(i);
    let best = 0;
    for (let k = 1; k < colX.length; k++) if (Math.abs(colX[k] - x) < Math.abs(colX[best] - x)) best = k;
    assert(Math.abs(colX[best] - x) <= CELL_TOL, `${TAG}: ${what} at x=${x.toFixed(1)} is not under any column`);
    return best;
  };

  // body: from the first class line down to "AÇIKLAMALAR:"
  const body = all.filter((i) => i.y <= firstTagY + HEADER_BAND && i.y > notes.y + LINE_TOL && i.str !== "GİRİŞ GİŞELERİ");
  const labelsLeft = body.filter((i) => i.x + i.w < classX - 8);
  const cellsAll = body.filter((i) => i.x > dataLeft - 12 && !tags.includes(i));
  const used = new Set();

  const M = {};
  for (let r = 0; r < STATIONS.length; r++) {
    const block = tags.slice(r * 6, r * 6 + 6);
    block.forEach((t, n) => assert(t.str === String(n + 1), `${TAG}: block ${r}: class tags out of order`));
    const yTop = block[0].y + 4;
    const yBot = block[5].y - 4;
    const label = norm(
      labelsLeft.filter((i) => i.y <= yTop && i.y >= yBot).sort((a, b) => b.y - a.y).map((i) => i.str).join(" "),
    );
    assert(label === STATIONS[r][0], `${TAG}: row ${r + 1} label "${label}", expected "${STATIONS[r][0]}"`);
    const id = STATIONS[r][1];
    M[id] = {};
    block.forEach((t, n) => {
      const cells = cellsAll.filter((i) => Math.abs(i.y - t.y) <= 2.5);
      assert(cells.length === STATIONS.length, `${TAG}: ${label} class ${n + 1}: ${cells.length} cells, expected ${STATIONS.length}`);
      const seen = new Set();
      for (const i of cells) {
        assert(!used.has(i), `${TAG}: cell "${i.str}" matched twice`);
        used.add(i);
        const v = trNumber(i.str);
        assert(Number.isFinite(v), `${TAG}: ${label} class ${n + 1}: non-numeric cell "${i.str}"`);
        const c = colIndex(i, `${label} class ${n + 1} cell "${i.str}"`);
        assert(!seen.has(c), `${TAG}: ${label} class ${n + 1}: two cells under ${STATIONS[c][0]}`);
        seen.add(c);
        (M[id][STATIONS[c][1]] ??= [])[n] = v;
      }
    });
  }
  assert(used.size === cellsAll.length, `${TAG}: ${cellsAll.length - used.size} unassigned cells in the table body`);

  const ids = STATIONS.map((s) => s[1]);
  // diagonal = farthest fare into that column
  for (const b of ids)
    for (let n = 0; n < 6; n++) {
      const far = Math.max(...ids.filter((a) => a !== b).map((a) => M[a][b][n]));
      assert(M[b][b][n] === far, `${TAG}: ${b} class ${n + 1}: diagonal ${M[b][b][n]} != farthest fare ${far}`);
    }

  // remove the 1915 bridge fee from every cell involving the bridge plaza
  const bridge = M[BRIDGE_FROM][BRIDGE_TO];
  assert(JSON.stringify(bridge) === JSON.stringify(M[BRIDGE_TO][BRIDGE_FROM]), `${TAG}: bridge fee differs by direction`);
  const prices = {};
  for (const a of ids) {
    prices[a] = {};
    for (const b of ids) {
      if (a === b) continue;
      const raw = M[a][b];
      const v = a === BRIDGE_TO || b === BRIDGE_TO ? raw.map((x, n) => x - bridge[n]) : raw;
      assert(v.every((x) => Number.isFinite(x) && x >= 0), `${TAG}: negative/invalid net price ${a}→${b}: ${v}`);
      prices[a][b] = v;
    }
  }
  return { validFrom, sections: [{ id: SECTION_ID, name: SECTION_NAME, stations: ids, prices }] };
}
