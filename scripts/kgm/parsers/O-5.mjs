// Parser for KGM "GEBZE - ORHANGAZİ - İZMİR (İZMİT KÖRFEZ GEÇİŞİ VE BAĞLANTI YOLLARI
// DAHİL) OTOYOLU" tariff PDF (data/kgm-pdfs/12-Gebze-Orhangazi-Izmir.pdf)
// → data/tolls/O-5.json sections.
//
// Layout: ONE page holding TWO independent square tables side by side whose text
// rows interleave (same y). They are separated by x position:
//   left  table "GEBZE - BURSA ARASI (1. ve 2. KESİM)"   → section o5-gebze-bursa
//   right table "BURSA - İZMİR ARASI (3. ve 4. KESİM)"   → section o5-bursa-izmir
// Each table: header row (multi-line, centred labels) right of "İstasyon"/"Sınıf";
// station blocks = label line + 6 class lines. Numbers are RIGHT-aligned, so a cell
// is mapped to the column whose right border (midpoint to the next header centre)
// is nearest to the cell's right edge.
//
// Osmangazi bridge handling (left table): the pseudo-stations
//   row    "Osmangazi Köprüsü (İzmir Yönü)"   (entry at the bridge, İstanbul→İzmir)
//   column "Osmangazi Köprüsü (İzmir Yönü)"   (= bridge fee only; other rows are crossed out)
//   column "Osmangazi Köprüsü (İstanbul Yönü)" (exit at the bridge, İzmir→İstanbul = bridge + road)
// are merged into ONE station "o5-osmangazi" and the bridge fee (which lives in
// data/tolls/bridges.json) is removed:
//   o5-osmangazi → X = row "İzmir Yönü", column X
//   X → o5-osmangazi = row X, column "İstanbul Yönü" − bridge fee
// where bridge fee = row "İzmir Yönü" × column "İzmir Yönü". The parser asserts that
// both directions then agree exactly (they do in the 01.01.2026 PDF).
// Diagonals (U-dönüşü = farthest fare) are not exported.
import { readItems, trNumber, findValidFrom, assert } from "../lib.mjs";

const TAG = "O-5";
const OSM_IZMIR = "Osmangazi Köprüsü (İzmir Yönü)";
const OSM_IST = "Osmangazi Köprüsü (İstanbul Yönü)";

const TABLES = [
  {
    key: "left",
    title: "GEBZE - BURSA ARASI (1. ve 2. KESİM)",
    sectionId: "o5-gebze-bursa",
    sectionName: "Gebze - Bursa (1. ve 2. kesim)",
    // [joined header label, column key]
    columns: [
      [OSM_IZMIR, OSM_IZMIR],
      [OSM_IST, OSM_IST],
      ["Altınova", "o5-altinova"],
      ["Kılıç", "o5-kilic"],
      ["Orhangazi", "o5-orhangazi"],
      ["Gemlik", "o5-gemlik"],
      ["Bursa Serbest Bölge", "o5-bursa-serbest-bolge"],
      ["Bursa Kuzey", "o5-bursa-kuzey"],
    ],
    // [row label, row key, diagonal column key, column keys that must be empty]
    rows: [
      [OSM_IZMIR, OSM_IZMIR, OSM_IST, []],
      ["Altınova", "o5-altinova", "o5-altinova", [OSM_IZMIR]],
      ["Kılıç", "o5-kilic", "o5-kilic", [OSM_IZMIR]],
      ["Orhangazi", "o5-orhangazi", "o5-orhangazi", [OSM_IZMIR]],
      ["Gemlik", "o5-gemlik", "o5-gemlik", [OSM_IZMIR]],
      ["Bursa Serbest Bölge", "o5-bursa-serbest-bolge", "o5-bursa-serbest-bolge", [OSM_IZMIR]],
      ["Bursa Kuzey", "o5-bursa-kuzey", "o5-bursa-kuzey", [OSM_IZMIR]],
    ],
    stations: [
      "o5-osmangazi", "o5-altinova", "o5-kilic", "o5-orhangazi", "o5-gemlik",
      "o5-bursa-serbest-bolge", "o5-bursa-kuzey",
    ],
  },
  {
    key: "right",
    title: "BURSA - İZMİR ARASI (3. ve 4. KESİM)",
    sectionId: "o5-bursa-izmir",
    sectionName: "Bursa - İzmir (3. ve 4. kesim)",
    columns: [
      ["Bursa Batı", "o5-bursa-bati"],
      ["Teknosab", "o5-teknosab"],
      ["Karacabey - Mustafakemal- paşa - 1", "o5-karacabey-mkp-1"],
      ["Karacabey - Mustafakemal- paşa - 2", "o5-karacabey-mkp-2"],
      ["Susurluk", "o5-susurluk"],
      ["Balıkesir Kuzey", "o5-balikesir-kuzey"],
      ["Balıkesir Batı", "o5-balikesir-bati"],
      ["Savaştepe", "o5-savastepe"],
      ["Soma", "o5-soma"],
      ["Kırkağaç", "o5-kirkagac"],
      ["Akhisar", "o5-akhisar"],
      ["Saruhanlı", "o5-saruhanli"],
      ["Turgutlu", "o5-turgutlu"],
      ["İzmir", "o5-izmir"],
    ],
    rows: [
      ["Bursa Batı", "o5-bursa-bati"],
      ["Teknosab", "o5-teknosab"],
      ["Karacabey - Mustafakemalpaşa - 1", "o5-karacabey-mkp-1"],
      ["Karacabey - Mustafakemalpaşa - 2", "o5-karacabey-mkp-2"],
      ["Susurluk", "o5-susurluk"],
      ["Balıkesir Kuzey", "o5-balikesir-kuzey"],
      ["Balıkesir Batı", "o5-balikesir-bati"],
      ["Savaştepe", "o5-savastepe"],
      ["Soma", "o5-soma"],
      ["Kırkağaç", "o5-kirkagac"],
      ["Akhisar", "o5-akhisar"],
      ["Saruhanlı", "o5-saruhanli"],
      ["Turgutlu", "o5-turgutlu"],
      ["İzmir", "o5-izmir"],
    ].map(([l, id]) => [l, id, id, []]),
    stations: [
      "o5-bursa-bati", "o5-teknosab", "o5-karacabey-mkp-1", "o5-karacabey-mkp-2", "o5-susurluk",
      "o5-balikesir-kuzey", "o5-balikesir-bati", "o5-savastepe", "o5-soma", "o5-kirkagac",
      "o5-akhisar", "o5-saruhanli", "o5-turgutlu", "o5-izmir",
    ],
  },
];

const LINE_TOL = 1.5;
const HEADER_BAND = 7; // multi-line header fragments lie within this of the "İstasyon" line
const HEADER_MERGE_TOL = 4; // fragments of one header label share (almost) the same centre
const EDGE_TOL = 5; // cell right edge must be this close to its column's right border
const IGNORE = /^(GİRİŞ GİŞELERİ|ÇIKIŞ GİŞELERİ)$/;

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

/** Parses one table inside [xMin, xMax) → Map rowKey → Map colKey → [c1..c6]. */
function parseTable(all, t, ist, xMin, xMax, yBottom) {
  const inX = (i) => i.x >= xMin && i.x < xMax;
  const sinif = all.filter((i) => i.str === "Sınıf" && inX(i) && Math.abs(i.y - ist.y) <= LINE_TOL);
  assert(sinif.length === 1, `${TAG} ${t.key}: expected one "Sınıf" header, got ${sinif.length}`);
  const classX = cx(sinif[0]);
  const dataLeft = sinif[0].x + sinif[0].w;

  // header labels: merge fragments by centre, join top → bottom
  const frags = all.filter((i) => inX(i) && i.x > dataLeft && Math.abs(i.y - ist.y) <= HEADER_BAND);
  const clusters = [];
  for (const it of [...frags].sort((a, b) => cx(a) - cx(b))) {
    const c = clusters.find((k) => Math.abs(k.x - cx(it)) <= HEADER_MERGE_TOL);
    if (c) c.items.push(it);
    else clusters.push({ x: cx(it), items: [it] });
  }
  clusters.sort((a, b) => a.x - b.x);
  const labels = clusters.map((c) => norm(c.items.sort((a, b) => b.y - a.y).map((i) => i.str).join(" ")));
  assert(
    labels.length === t.columns.length && labels.every((l, k) => l === t.columns[k][0]),
    `${TAG} ${t.key}: column headers changed:\n  got      ${JSON.stringify(labels)}\n  expected ${JSON.stringify(t.columns.map((c) => c[0]))}`,
  );
  const centres = clusters.map((c) => c.items.reduce((s, i) => s + cx(i), 0) / c.items.length);
  const borders = centres.map((c, k) =>
    k < centres.length - 1 ? (c + centres[k + 1]) / 2 : c + (c - centres[k - 1]) / 2,
  );
  const colOf = (item, what) => {
    const r = item.x + item.w;
    let best = 0;
    for (let k = 1; k < borders.length; k++) if (Math.abs(borders[k] - r) < Math.abs(borders[best] - r)) best = k;
    assert(Math.abs(borders[best] - r) <= EDGE_TOL, `${TAG} ${t.key}: ${what} (right edge ${r.toFixed(1)}) is not under any column`);
    return best;
  };

  // body
  const body = all.filter((i) => inX(i) && i.y < ist.y - HEADER_BAND && i.y > yBottom && !IGNORE.test(i.str));
  const blocks = [];
  for (const line of groupLines(body)) {
    const left = line.items.filter((i) => i.x + i.w < classX - 4);
    const classTag = line.items.filter((i) => /^[1-6]$/.test(i.str) && Math.abs(cx(i) - classX) <= 6);
    const cells = line.items.filter((i) => !left.includes(i) && !classTag.includes(i));
    if (left.length) {
      assert(classTag.length === 0 && cells.length === 0, `${TAG} ${t.key}: label line y=${line.y.toFixed(1)} also has cells`);
      blocks.push({ label: norm(left.map((i) => i.str).join(" ")), classes: {} });
    } else {
      assert(classTag.length === 1, `${TAG} ${t.key}: unexpected line y=${line.y.toFixed(1)}: ${line.items.map((i) => i.str).join(" | ")}`);
      assert(blocks.length > 0, `${TAG} ${t.key}: class line before first station label`);
      const cls = Number(classTag[0].str);
      const b = blocks[blocks.length - 1];
      assert(!(cls in b.classes), `${TAG} ${t.key}: duplicate class ${cls} in row ${b.label}`);
      b.classes[cls] = cells;
    }
  }
  assert(
    blocks.length === t.rows.length && blocks.every((b, k) => b.label === t.rows[k][0]),
    `${TAG} ${t.key}: row labels changed:\n  got      ${JSON.stringify(blocks.map((b) => b.label))}\n  expected ${JSON.stringify(t.rows.map((r) => r[0]))}`,
  );

  const colKeys = t.columns.map((c) => c[1]);
  const M = new Map();
  let cellCount = 0;
  blocks.forEach((b, k) => {
    const [label, rowKey, , empty] = t.rows[k];
    const expectCols = colKeys.filter((c) => !empty.includes(c));
    const row = new Map(expectCols.map((c) => [c, []]));
    for (let cls = 1; cls <= 6; cls++) {
      const cells = b.classes[cls];
      assert(cells, `${TAG} ${t.key}: row ${label}: class ${cls} line missing`);
      const seen = new Set();
      for (const i of cells) {
        const v = trNumber(i.str);
        assert(Number.isFinite(v), `${TAG} ${t.key}: row ${label} class ${cls}: non-numeric cell "${i.str}"`);
        const col = colKeys[colOf(i, `row ${label} class ${cls} cell "${i.str}"`)];
        assert(row.has(col), `${TAG} ${t.key}: row ${label} class ${cls}: unexpected cell under ${col}`);
        assert(!seen.has(col), `${TAG} ${t.key}: row ${label} class ${cls}: two cells under ${col}`);
        seen.add(col);
        row.get(col)[cls - 1] = v;
        cellCount++;
      }
      assert(seen.size === expectCols.length, `${TAG} ${t.key}: row ${label} class ${cls}: ${seen.size} cells, expected ${expectCols.length}`);
    }
    M.set(rowKey, row);
  });
  // diagonal (U-dönüşü) must equal the farthest fare into that column
  t.rows.forEach(([label, rowKey, diagKey]) => {
    for (let n = 0; n < 6; n++) {
      const d = M.get(rowKey).get(diagKey)[n];
      const others = [...M.entries()].filter(([r]) => r !== rowKey && M.get(r).has(diagKey)).map(([, row]) => row.get(diagKey)[n]);
      if (diagKey === OSM_IST) continue; // checked separately (includes the bridge fee)
      assert(others.length > 0 && d === Math.max(...others), `${TAG} ${t.key}: ${label} class ${n + 1}: diagonal ${d} != farthest fare ${Math.max(...others)}`);
    }
  });
  return { M, cellCount };
}

export default async function parse(pdfPath) {
  const all = await readItems(pdfPath);
  assert(all.length > 0, `${TAG}: PDF has no text`);
  assert(new Set(all.map((i) => i.page)).size === 1, `${TAG}: expected a single-page PDF`);
  for (const t of TABLES) assert(all.some((i) => i.str === t.title), `${TAG}: table title "${t.title}" not found`);
  const validFrom = strictValidFrom(all);

  const ists = all.filter((i) => i.str === "İstasyon").sort((a, b) => a.x - b.x);
  assert(ists.length === 2 && Math.abs(ists[0].y - ists[1].y) <= LINE_TOL, `${TAG}: expected two "İstasyon" headers on one line`);
  const titles = TABLES.map((t) => all.find((i) => i.str === t.title));
  assert(titles[0].x < ists[1].x && titles[1].x > ists[1].x - 20, `${TAG}: table titles not in expected left/right order`);
  // split between the two tables: just left of the right table's row-label column
  const rightLabels = all.filter((i) => i.y < ists[1].y - HEADER_BAND && i.x < ists[1].x && i.x + i.w > ists[1].x - 30 && /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(i.str) && !IGNORE.test(i.str));
  const split = Math.min(ists[1].x, ...rightLabels.map((i) => i.x)) - 2;
  const notes = all.find((i) => i.str === "Notlar:");
  assert(notes, `${TAG}: "Notlar:" footer not found`);

  const left = parseTable(all, TABLES[0], ists[0], 0, split, notes.y + LINE_TOL);
  const right = parseTable(all, TABLES[1], ists[1], split, Infinity, 0);
  assert(left.cellCount === (8 + 6 * 7) * 6, `${TAG}: left table has ${left.cellCount} cells, expected 300`);
  assert(right.cellCount === 14 * 14 * 6, `${TAG}: right table has ${right.cellCount} cells, expected 1176`);

  // ---- left: fold the bridge pseudo-stations into o5-osmangazi (bridge fee removed)
  const L = left.M;
  const bridge = L.get(OSM_IZMIR).get(OSM_IZMIR);
  const t0 = TABLES[0];
  const road = t0.stations.slice(1); // real stations of the left table
  const p1 = {};
  const put = (P, a, b, v) => {
    P[a] ??= {};
    assert(!(b in P[a]), `${TAG}: ${a}→${b} twice`);
    assert(v.length === 6 && v.every((x) => Number.isFinite(x) && x >= 0), `${TAG}: bad price ${a}→${b}: ${v}`);
    P[a][b] = v;
  };
  for (const a of t0.stations) p1[a] = {};
  for (const x of road) {
    const out = L.get(OSM_IZMIR).get(x);
    const back = L.get(x).get(OSM_IST).map((v, n) => v - bridge[n]);
    assert(JSON.stringify(out) === JSON.stringify(back), `${TAG}: bridge decomposition failed for ${x}: Osmangazi→X ${out} vs X→Osmangazi−köprü ${back}`);
    put(p1, "o5-osmangazi", x, out);
    put(p1, x, "o5-osmangazi", back);
  }
  // Osmangazi U-turn (İzmir Yönü → İstanbul Yönü) = bridge + farthest road fare
  const osmU = L.get(OSM_IZMIR).get(OSM_IST);
  for (let n = 0; n < 6; n++) {
    const far = Math.max(...road.map((x) => L.get(OSM_IZMIR).get(x)[n]));
    assert(osmU[n] === bridge[n] + far, `${TAG}: Osmangazi U-dönüşü class ${n + 1}: ${osmU[n]} != ${bridge[n]} + ${far}`);
  }
  for (const a of road) for (const b of road) if (a !== b) put(p1, a, b, L.get(a).get(b));
  const sec1 = { id: t0.sectionId, name: t0.sectionName, stations: [...t0.stations], prices: {} };
  for (const a of t0.stations) {
    sec1.prices[a] = {};
    for (const b of t0.stations) if (a !== b) sec1.prices[a][b] = p1[a][b];
  }

  // ---- right: directional square matrix as published
  const t1 = TABLES[1];
  const sec2 = { id: t1.sectionId, name: t1.sectionName, stations: [...t1.stations], prices: {} };
  for (const a of t1.stations) {
    sec2.prices[a] = {};
    for (const b of t1.stations) if (a !== b) {
      const v = right.M.get(a).get(b);
      assert(v.length === 6 && v.every((x) => Number.isFinite(x) && x >= 0), `${TAG}: bad price ${a}→${b}`);
      sec2.prices[a][b] = v;
    }
  }
  for (const sec of [sec1, sec2])
    for (const [a, o] of Object.entries(sec.prices))
      for (const [b, p] of Object.entries(o)) assert(p[5] <= p[0] && p[0] <= p[1], `${TAG}: ${a}→${b} class order broken: ${p}`);

  return { validFrom, sections: [sec1, sec2] };
}
