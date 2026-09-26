/**
 * Measures every road edge of the routing graph on OpenStreetMap data (OSRM)
 * and writes data/road-edges.json: { "keyA|keyB": [km, minutes] }.
 *
 * - free roads between locations are measured with exclude=toll
 * - highway links, city access roads and junction links are measured as-is
 *
 * Runs in GitHub Actions (see .github/workflows/road-edges.yml).
 *   npx tsx scripts/osrm/build-road-edges.ts [--base https://router.project-osrm.org]
 */
import { writeFileSync } from "node:fs";
import { RoadNetwork } from "../../src/lib/engine/network";
import { BRIDGES, HIGHWAYS, LOCATIONS } from "../../src/lib/engine/data";

const base = process.argv.includes("--base") ? process.argv[process.argv.indexOf("--base") + 1] : "https://router.project-osrm.org";
const DELAY_MS = 1100; // public demo server: at most ~1 request per second
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const net = new RoadNetwork(HIGHWAYS, BRIDGES, LOCATIONS);
type Job = { a: number; b: number; excludeToll: boolean };
const jobs = new Map<string, Job>();
net.adj.forEach((edges, a) => {
  for (const e of edges) {
    if (e.kind === "bridge") continue;
    const ka = net.nodes[a].key;
    const kb = net.nodes[e.to].key;
    const key = RoadNetwork.pairKey(ka, kb);
    if (jobs.has(key)) continue;
    const bothLocations = ka.startsWith("loc:") && kb.startsWith("loc:");
    jobs.set(key, { a, b: e.to, excludeToll: bothLocations });
  }
});

// group by source node → one table request per source (and toll mode)
const groups = new Map<string, { src: number; dsts: number[]; excludeToll: boolean }>();
for (const j of jobs.values()) {
  const g = `${j.a}:${j.excludeToll}`;
  if (!groups.has(g)) groups.set(g, { src: j.a, dsts: [], excludeToll: j.excludeToll });
  groups.get(g)!.dsts.push(j.b);
}

const coord = (i: number) => `${net.nodes[i].pos[1].toFixed(5)},${net.nodes[i].pos[0].toFixed(5)}`;
const out: Record<string, [number, number]> = {};
let done = 0;
let failed = 0;
console.log(`${jobs.size} edges in ${groups.size} requests`);

for (const g of groups.values()) {
  for (let start = 0; start < g.dsts.length; start += 90) {
    const dsts = g.dsts.slice(start, start + 90);
    const coords = [g.src, ...dsts].map(coord).join(";");
    const url =
      `${base}/table/v1/driving/${coords}?sources=0&destinations=${dsts.map((_, i) => i + 1).join(";")}` +
      `&annotations=distance,duration${g.excludeToll ? "&exclude=toll" : ""}`;
    let json: { code: string; distances?: (number | null)[][]; durations?: (number | null)[][] } | null = null;
    for (let attempt = 0; attempt < 4 && !json; attempt++) {
      try {
        const res = await fetch(url, { headers: { "User-Agent": "paraliyol-road-graph/1.0 (+https://paraliyol.netlify.app)" } });
        if (res.ok) json = await res.json();
        else await sleep(3000 * (attempt + 1));
      } catch {
        await sleep(3000 * (attempt + 1));
      }
    }
    await sleep(DELAY_MS);
    if (!json || json.code !== "Ok") {
      failed += dsts.length;
      continue;
    }
    dsts.forEach((d, i) => {
      const km = json!.distances?.[0]?.[i];
      const sec = json!.durations?.[0]?.[i];
      if (km == null || sec == null || km <= 0) {
        failed++;
        return;
      }
      out[RoadNetwork.pairKey(net.nodes[g.src].key, net.nodes[d].key)] = [Math.round(km / 100) / 10, Math.round(sec / 6) / 10];
      done++;
    });
  }
  if (done % 200 < 90) console.log(`measured ${done}/${jobs.size} (failed ${failed})`);
}

const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => (a < b ? -1 : 1)));
writeFileSync("data/road-edges.json", JSON.stringify(sorted, null, 0).replace(/\],"/g, '],\n"') + "\n");
console.log(`done: ${done} measured, ${failed} failed`);
if (done < jobs.size * 0.8) process.exit(1);
