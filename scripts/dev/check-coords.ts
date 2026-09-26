// Flags toll stations whose measured road distance to their neighbours is far
// from the straight-line distance: a sign the coordinate is misplaced.
import { HIGHWAYS, ROAD_EDGES } from "../../src/lib/engine/data";
import { haversineKm } from "../../src/lib/engine/geo";
import { RoadNetwork } from "../../src/lib/engine/network";

const rows: string[] = [];
for (const hw of HIGHWAYS) {
  const pos = new Map(hw.stations.map((s) => [s.id, [s.lat, s.lng] as [number, number]]));
  for (const [a, b] of hw.roads) {
    const m = ROAD_EDGES[RoadNetwork.pairKey(`st:${a}`, `st:${b}`)];
    if (!m) continue;
    const straight = haversineKm(pos.get(a)!, pos.get(b)!);
    const ratio = m[0] / Math.max(straight, 0.5);
    if (ratio > 1.8 || (m[0] > 3 && ratio < 0.8)) rows.push(`${hw.code.padEnd(7)} ${a} → ${b}: road ${m[0]} km, straight ${straight.toFixed(1)} km (×${ratio.toFixed(1)})`);
  }
}
console.log(rows.length ? rows.join("\n") : "no suspicious highway edges");
