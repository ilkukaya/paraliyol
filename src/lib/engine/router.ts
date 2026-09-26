import type { Edge, RoadNetwork } from "./network";
import type { LatLng, RouteLeg, RouteResult, TollItem, VehicleClass } from "./types";

/** Minutes of "cost" per TL when looking for the cheapest reasonable route. */
const ECONOMIC_MIN_PER_TL = 0.6;
/** Small price weight on the fastest route so a much cheaper crossing wins a near tie. */
const FASTEST_MIN_PER_TL = 0.05;

class MinHeap {
  private a: [number, number][] = [];
  get size() {
    return this.a.length;
  }
  push(item: [number, number]) {
    const a = this.a;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p][0] <= a[i][0]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop(): [number, number] {
    const a = this.a;
    const top = a[0];
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}

const classIndex = (vc: VehicleClass) => Number(vc) - 1;

export function findRoute(
  net: RoadNetwork,
  fromKey: string,
  toKey: string,
  vehicleClass: VehicleClass,
  mode: "fastest" | "economic",
): RouteResult | null {
  const src = net.nodeId(fromKey);
  const dst = net.nodeId(toKey);
  if (src === undefined || dst === undefined) return null;

  const ci = classIndex(vehicleClass);
  const edgeCost = (e: Edge): number => {
    if (e.kind === "bridge") {
      const b = net.bridges.get(e.bridge!)!;
      if (b.allowedClasses && !b.allowedClasses.includes(vehicleClass)) return Infinity;
      return e.minutes + (b.prices[ci] ?? 0) * (mode === "economic" ? ECONOMIC_MIN_PER_TL : FASTEST_MIN_PER_TL);
    }
    if (e.kind === "hw" && mode === "economic") {
      // Strait crossings that only exist inside a highway tariff stay usable, at their fee.
      if (!e.bridge) return Infinity;
      return e.minutes + (net.bridges.get(e.bridge)?.prices[ci] ?? 0) * ECONOMIC_MIN_PER_TL;
    }
    return e.minutes;
  };

  const n = net.nodes.length;
  const dist = new Float64Array(n).fill(Infinity);
  const prevNode = new Int32Array(n).fill(-1);
  const prevEdge: (Edge | null)[] = new Array(n).fill(null);
  dist[src] = 0;
  const heap = new MinHeap();
  heap.push([0, src]);
  while (heap.size) {
    const [d, u] = heap.pop();
    if (d > dist[u]) continue;
    if (u === dst) break;
    for (const e of net.adj[u]) {
      const c = edgeCost(e);
      if (!isFinite(c)) continue;
      const nd = d + c;
      if (nd < dist[e.to]) {
        dist[e.to] = nd;
        prevNode[e.to] = u;
        prevEdge[e.to] = e;
        heap.push([nd, e.to]);
      }
    }
  }
  if (!isFinite(dist[dst])) return null;

  const nodes: number[] = [];
  const edges: Edge[] = [];
  for (let v = dst; v !== -1; v = prevNode[v]) {
    nodes.unshift(v);
    if (prevEdge[v]) edges.unshift(prevEdge[v]!);
  }

  return summarize(net, nodes, edges, vehicleClass, mode);
}

function summarize(
  net: RoadNetwork,
  nodes: number[],
  edges: Edge[],
  vehicleClass: VehicleClass,
  mode: "fastest" | "economic",
): RouteResult {
  const ci = classIndex(vehicleClass);
  const tolls: TollItem[] = [];
  const legs: RouteLeg[] = [];
  const highways: string[] = [];
  let km = 0;
  let minutes = 0;

  let i = 0;
  while (i < edges.length) {
    const e = edges[i];
    if (e.kind === "hw") {
      // maximal run on the same tariff section
      let j = i;
      let runKm = 0;
      const crossed: { edge: Edge; at: number }[] = [];
      while (j < edges.length && edges[j].kind === "hw" && edges[j].section === e.section) {
        if (edges[j].bridge) crossed.push({ edge: edges[j], at: j });
        runKm += edges[j].km;
        minutes += edges[j].minutes;
        j++;
      }
      km += runKm;
      const entry = net.nodes[nodes[i]];
      const exit = net.nodes[nodes[j]];
      const hw = net.highways.get(e.code!)!;
      const section = hw.sections.find((s) => s.id === e.section)!;
      let row = section.prices[entry.station!]?.[exit.station!];
      let estimated = false;
      if (!row) {
        row = section.prices[exit.station!]?.[entry.station!];
        estimated = !!row;
      }
      const included = crossed.filter((c) => c.edge.bridgeIncluded).map((c) => net.bridges.get(c.edge.bridge!)?.name);
      tolls.push({
        kind: "highway",
        ref: hw.code,
        name: hw.shortName ?? hw.name,
        detail: included.length ? `${included.join(", ")} ücreti dahil` : section.name,
        entry: entry.name,
        exit: exit.name,
        price: row ? row[ci] : 0,
        pos: entry.pos,
        estimated: estimated || !row,
      });
      for (const c of crossed) {
        if (c.edge.bridgeIncluded) continue;
        const b = net.bridges.get(c.edge.bridge!)!;
        const p1 = net.nodes[nodes[c.at]].pos;
        const p2 = net.nodes[nodes[c.at + 1]].pos;
        tolls.push({ kind: b.type, ref: b.id, name: b.name, price: b.prices[ci] ?? 0, pos: [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2] });
      }
      if (!highways.includes(hw.code)) highways.push(hw.code);
      legs.push({ kind: "highway", ref: hw.code, label: `${entry.name} → ${exit.name}`, km: runKm });
      i = j;
      continue;
    }
    km += e.km;
    minutes += e.minutes;
    if (e.kind === "bridge") {
      const b = net.bridges.get(e.bridge!)!;
      const a = net.nodes[nodes[i]].pos;
      const c = net.nodes[nodes[i + 1]].pos;
      tolls.push({ kind: b.type, ref: b.id, name: b.name, price: b.prices[ci] ?? 0, pos: [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2] });
      legs.push({ kind: "bridge", ref: b.id, label: b.name, km: e.km });
    } else {
      const last = legs[legs.length - 1];
      if (last?.kind === "free") last.km += e.km;
      else legs.push({ kind: "free", label: "Ücretsiz yol", km: e.km });
    }
    i++;
  }

  const path: LatLng[] = nodes.map((v) => net.nodes[v].pos);
  const total = tolls.reduce((s, t) => s + t.price, 0);
  return {
    mode,
    vehicleClass,
    km: Math.round(km),
    minutes: Math.round(minutes),
    tolls,
    total: Math.round(total * 100) / 100,
    path,
    legs: legs.map((l) => ({ ...l, km: Math.round(l.km) })),
    highways,
  };
}
