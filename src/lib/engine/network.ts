import { crossesWater, haversineKm, type LatLng } from "./geo";
import type { BridgeData, HighwayData, Location } from "./types";

export type EdgeKind = "hw" | "free" | "bridge";

export interface Edge {
  to: number;
  km: number;
  minutes: number;
  kind: EdgeKind;
  /** highway code (hw) */
  code?: string;
  /** tariff section id (hw) */
  section?: string;
  /** bridge id (bridge edges, or hw edges that cross a bridge) */
  bridge?: string;
  /** hw edge whose bridge fee is already part of the highway tariff */
  bridgeIncluded?: boolean;
}

export interface Node {
  key: string;
  name: string;
  pos: LatLng;
  /** station id for toll plaza nodes */
  station?: string;
  code?: string;
}

// Road-length factors (straight line → road) and average speeds (km/h).
const HW_FACTOR = 1.08;
const HW_SPEED = 110;
/** Straight line → road length; routes through several nodes already zigzag, so long hops need less. */
const freeFactor = (km: number) => (km < 60 ? 1.3 : km < 150 ? 1.2 : 1.14);
/** Short free-road hops run through towns and junctions, long ones are divided highways. */
const freeSpeed = (km: number) => (km < 60 ? 56 : km < 140 ? 70 : 80);
const LINK_FACTOR = 1.3;
const LINK_SPEED = 55;

const LOC_NEIGHBOURS = 12;
const LOC_MAX_KM = 320;
const ACCESS_MAX_KM = 32;
const ACCESS_PER_LOC = 8;
const JUNCTION_MAX_KM = 12;
const BRIDGE_LINK_KM = 22;

export class RoadNetwork {
  nodes: Node[] = [];
  adj: Edge[][] = [];
  private index = new Map<string, number>();
  highways = new Map<string, HighwayData>();
  bridges = new Map<string, BridgeData>();
  stationSections = new Map<string, string[]>();

  /** Measured road length/duration per node pair ("keyA|keyB", sorted), from scripts/osrm. */
  private measured: Record<string, [number, number]>;

  constructor(
    highways: HighwayData[],
    bridges: BridgeData[],
    locations: Location[],
    measured: Record<string, [number, number]> = {},
  ) {
    this.measured = measured;
    for (const hw of highways) this.addHighway(hw);
    for (const loc of locations) this.addNode(`loc:${loc.id}`, loc.name, [loc.lat, loc.lng]);
    this.linkLocations(locations);
    this.linkAccess(locations);
    this.linkJunctions();
    for (const b of bridges) {
      this.bridges.set(b.id, b);
      if (b.routable !== false) this.addBridge(b);
    }
  }

  nodeId(key: string) {
    return this.index.get(key);
  }

  private addNode(key: string, name: string, pos: LatLng, extra: Partial<Node> = {}) {
    const existing = this.index.get(key);
    if (existing !== undefined) return existing;
    const id = this.nodes.length;
    this.nodes.push({ key, name, pos, ...extra });
    this.adj.push([]);
    this.index.set(key, id);
    return id;
  }

  static pairKey(a: string, b: string) {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }

  /** Replaces the estimated length and duration with measured road values when available. */
  private measure(a: number, b: number, e: Omit<Edge, "to">): Omit<Edge, "to"> {
    const m = this.measured[RoadNetwork.pairKey(this.nodes[a].key, this.nodes[b].key)];
    return m ? { ...e, km: m[0], minutes: m[1] } : e;
  }

  private addEdge(a: number, b: number, e: Omit<Edge, "to">) {
    if (e.kind !== "bridge") e = this.measure(a, b, e);
    this.adj[a].push({ ...e, to: b });
    this.adj[b].push({ ...e, to: a });
  }

  private addHighway(hw: HighwayData) {
    this.highways.set(hw.code, hw);
    for (const s of hw.stations) {
      this.addNode(`st:${s.id}`, s.name, [s.lat, s.lng], { station: s.id, code: hw.code });
    }
    for (const sec of hw.sections) {
      for (const st of sec.stations) {
        const list = this.stationSections.get(st) ?? [];
        list.push(sec.id);
        this.stationSections.set(st, list);
      }
    }
    for (const [a, b] of hw.roads) {
      const ia = this.index.get(`st:${a}`);
      const ib = this.index.get(`st:${b}`);
      if (ia === undefined || ib === undefined) {
        throw new Error(`${hw.code}: road references unknown station ${a} / ${b}`);
      }
      const km = haversineKm(this.nodes[ia].pos, this.nodes[ib].pos) * HW_FACTOR;
      const secA = this.stationSections.get(a) ?? [];
      const secB = this.stationSections.get(b) ?? [];
      const section = secA.find((s) => secB.includes(s));
      const be = hw.bridgeEdges?.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a));
      const bridge = be ? { bridge: be.bridge, bridgeIncluded: !!be.included } : {};
      if (section) {
        this.addEdge(ia, ib, { km, minutes: (km / HW_SPEED) * 60, kind: "hw", code: hw.code, section, ...bridge });
      } else {
        // Physical continuation between two tariff sections (no toll of its own).
        this.addEdge(ia, ib, { km, minutes: (km / HW_SPEED) * 60, kind: "free" });
      }
    }
  }

  private freeEdge(a: number, b: number, factor?: number, speed?: number) {
    const pa = this.nodes[a].pos;
    const pb = this.nodes[b].pos;
    if (crossesWater(pa, pb)) return;
    if (this.adj[a].some((e) => e.to === b)) return;
    const straight = haversineKm(pa, pb);
    const km = straight * (factor ?? freeFactor(straight));
    this.addEdge(a, b, { km, minutes: (km / (speed ?? freeSpeed(km))) * 60, kind: "free" });
  }

  private linkLocations(locations: Location[]) {
    for (const a of locations) {
      const ia = this.index.get(`loc:${a.id}`)!;
      const near = locations
        .filter((b) => b.id !== a.id)
        .map((b) => ({ b, d: haversineKm([a.lat, a.lng], [b.lat, b.lng]) }))
        .filter((x) => x.d <= LOC_MAX_KM)
        .sort((x, y) => x.d - y.d);
      let added = 0;
      for (const { b } of near) {
        if (added >= LOC_NEIGHBOURS) break;
        const ib = this.index.get(`loc:${b.id}`)!;
        if (crossesWater(this.nodes[ia].pos, this.nodes[ib].pos)) continue;
        this.freeEdge(ia, ib);
        added++;
      }
    }
  }

  private stationNodes() {
    return this.nodes.map((n, i) => ({ n, i })).filter((x) => x.n.station);
  }

  private linkAccess(locations: Location[]) {
    const stations = this.stationNodes();
    for (const loc of locations) {
      const il = this.index.get(`loc:${loc.id}`)!;
      const near = stations
        .map((s) => ({ ...s, d: haversineKm([loc.lat, loc.lng], s.n.pos) }))
        .filter((s) => s.d <= ACCESS_MAX_KM)
        .sort((a, b) => a.d - b.d)
        .slice(0, ACCESS_PER_LOC);
      for (const s of near) this.freeEdge(il, s.i, LINK_FACTOR, LINK_SPEED);
    }
  }

  private linkJunctions() {
    const stations = this.stationNodes();
    for (let x = 0; x < stations.length; x++) {
      for (let y = x + 1; y < stations.length; y++) {
        const a = stations[x];
        const b = stations[y];
        if (a.n.code === b.n.code) continue;
        const d = haversineKm(a.n.pos, b.n.pos);
        if (d <= JUNCTION_MAX_KM) this.freeEdge(a.i, b.i, LINK_FACTOR, LINK_SPEED);
      }
    }
  }

  private addBridge(b: BridgeData) {
    if (b.ends.length < 2) return;
    const ends = b.ends.map((e, k) =>
      this.addNode(`br:${b.id}:${k}`, e.label ?? b.name, [e.lat, e.lng]),
    );
    const km = haversineKm(this.nodes[ends[0]].pos, this.nodes[ends[1]].pos) * 1.1;
    this.addEdge(ends[0], ends[1], { km, minutes: (km / 80) * 60, kind: "bridge", bridge: b.id });
    ends.forEach((e, k) => {
      const pos = this.nodes[e].pos;
      const other = this.nodes[ends[1 - k]].pos;
      for (let i = 0; i < this.nodes.length; i++) {
        const n = this.nodes[i];
        if (i === e || n.key.startsWith("br:")) continue;
        const d = haversineKm(pos, n.pos);
        if (d > BRIDGE_LINK_KM) continue;
        // Bridge ends sit on the shoreline where the coarse water outline is
        // unreliable, so instead of a water test only nodes nearer to this end
        // than to the opposite end (i.e. on this side of the strait) are linked.
        if (d >= haversineKm(other, n.pos)) continue;
        if (this.adj[e].some((x) => x.to === i)) continue;
        const km = d * LINK_FACTOR;
        this.addEdge(e, i, { km, minutes: (km / LINK_SPEED) * 60, kind: "free" });
      }
    });
  }
}
