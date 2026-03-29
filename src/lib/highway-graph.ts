/**
 * Highway Network Graph Engine
 *
 * Builds a weighted graph from Turkey's toll highway network and uses
 * Dijkstra's algorithm to find optimal routes between any two points.
 *
 * Graph structure:
 * - Nodes: toll plaza stations + city locations
 * - Edges within highway: consecutive stations (weight = haversine km)
 * - Edges at junctions: free transfers between highways (weight = small penalty)
 * - Edges at crossings: bridge/tunnel connections (weight = crossing distance)
 * - Edges from cities: nearest highway stations (weight = haversine km)
 */

import type { VehicleClass, TollOnRoute, Location, OtoyolPricing, FixedToll } from "@/types";
import highwayNetworkData from "../../data/highway-network.json";

// --- Types ---

interface NetworkStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface NetworkHighway {
  name: string;
  stations: NetworkStation[];
}

interface NetworkJunction {
  stations: string[];
  name: string;
}

interface NetworkCrossing {
  from: string;
  to: string;
  fixedTollId: string;
  name: string;
}

interface HighwayNetwork {
  highways: Record<string, NetworkHighway>;
  junctions: NetworkJunction[];
  crossings: NetworkCrossing[];
}

interface GraphEdge {
  to: string;
  weight: number; // km
  type: "highway" | "junction" | "crossing" | "city-access";
  highway?: string;         // which highway this edge is on
  crossingId?: string;      // fixed toll ID for bridge/tunnel
}

export interface GraphPath {
  nodes: string[];
  edges: GraphEdge[];
  totalDistanceKm: number;
}

export interface RouteTollSegment {
  highway: string;
  highwayName: string;
  entryStation: string;
  exitStation: string;
  entryName: string;
  exitName: string;
}

export interface RouteResult {
  path: GraphPath;
  segments: RouteTollSegment[];
  crossingIds: string[];
  tolls: TollOnRoute[];
  totalPrices: Record<VehicleClass, number>;
  waypoints: [number, number][];
  totalDistanceKm: number;
}

// --- Haversine distance ---

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// --- Graph class ---

class HighwayGraph {
  private adjacency = new Map<string, GraphEdge[]>();
  private nodeCoords = new Map<string, { lat: number; lng: number; name: string }>();
  private stationToHighway = new Map<string, string>();
  private network: HighwayNetwork;

  constructor(network: HighwayNetwork) {
    this.network = network;
    this.buildGraph();
  }

  private addEdge(from: string, to: string, edge: Omit<GraphEdge, "to">) {
    if (!this.adjacency.has(from)) this.adjacency.set(from, []);
    this.adjacency.get(from)!.push({ ...edge, to });
  }

  private buildGraph() {
    // 1. Add all highway stations as nodes and create edges between consecutive stations
    for (const [hwCode, highway] of Object.entries(this.network.highways)) {
      const stations = highway.stations;
      for (let i = 0; i < stations.length; i++) {
        const s = stations[i];
        this.nodeCoords.set(s.id, { lat: s.lat, lng: s.lng, name: s.name });
        this.stationToHighway.set(s.id, hwCode);

        if (i > 0) {
          const prev = stations[i - 1];
          const dist = haversineKm(prev.lat, prev.lng, s.lat, s.lng);
          // Bidirectional edges between consecutive stations
          this.addEdge(prev.id, s.id, { weight: dist, type: "highway", highway: hwCode });
          this.addEdge(s.id, prev.id, { weight: dist, type: "highway", highway: hwCode });
        }
      }
    }

    // 2. Add junction edges (free transfers, small penalty for highway change)
    for (const junction of this.network.junctions) {
      const stationIds = junction.stations;
      for (let i = 0; i < stationIds.length; i++) {
        for (let j = i + 1; j < stationIds.length; j++) {
          const a = stationIds[i];
          const b = stationIds[j];
          const coordA = this.nodeCoords.get(a);
          const coordB = this.nodeCoords.get(b);
          // Use actual distance or a small penalty (5km) for junction transfer
          const dist = coordA && coordB
            ? Math.max(haversineKm(coordA.lat, coordA.lng, coordB.lat, coordB.lng), 2)
            : 5;
          this.addEdge(a, b, { weight: dist, type: "junction" });
          this.addEdge(b, a, { weight: dist, type: "junction" });
        }
      }
    }

    // 3. Add crossing edges (bridge/tunnel with distance)
    for (const crossing of this.network.crossings) {
      const coordA = this.nodeCoords.get(crossing.from);
      const coordB = this.nodeCoords.get(crossing.to);
      const dist = coordA && coordB
        ? haversineKm(coordA.lat, coordA.lng, coordB.lat, coordB.lng)
        : 10;
      this.addEdge(crossing.from, crossing.to, {
        weight: dist,
        type: "crossing",
        crossingId: crossing.fixedTollId,
      });
      this.addEdge(crossing.to, crossing.from, {
        weight: dist,
        type: "crossing",
        crossingId: crossing.fixedTollId,
      });
    }
  }

  /**
   * City-to-highway access rules. Prevents impossible connections across
   * bodies of water (Bosphorus, Sea of Marmara, İzmit Bay).
   * Key: location ID, Value: allowed highway codes (null = use haversine for all)
   */
  private static CITY_HIGHWAY_ACCESS: Record<string, string[]> = {
    // Istanbul European side → only European highways (Bosphorus crossed via bridge in graph)
    "istanbul-avrupa": ["O-3", "KMO-AV", "MCO"],
    // Istanbul Asian side → only Asian highways
    "istanbul-anadolu": ["O-4", "KMO-AN"],
    // Bursa is south of Marmara → only O-5
    "bursa": ["O-5"],
    "orhangazi": ["O-5"],
    // Yalova → O-5 or ferry
    "yalova": ["O-5"],
    // Gebze/Kocaeli → O-4, KMO-AN, O-5 (via Osmangazi)
    "gebze": ["O-4", "KMO-AN"],
    "kocaeli": ["O-4", "KMO-AN"],
    // Edirne → O-3, MCO
    "edirne": ["O-3", "MCO"],
    // Tekirdağ → O-3
    "tekirdag": ["O-3", "MCO"],
    // Balıkesir → O-5
    "balikesir": ["O-5"],
    "balikesir-kuzey": ["O-5"],
    // Çanakkale → MCO
    "canakkale": ["MCO"],
    // Hadımköy is on O-3 (European side)
    "hadimkoy": ["O-3", "KMO-AV", "MCO"],
    // Sakarya → O-4, KMO-AN
    "sakarya": ["O-4", "KMO-AN"],
    // Manisa → O-5
    "manisa": ["O-5"],
    // Bandırma → southern Marmara
    "bandirma": ["O-5"],
  };

  /** Add a temporary city node connected to nearest highway stations */
  addCityNode(location: Location): string[] {
    const cityNodeId = `city:${location.id}`;
    if (this.adjacency.has(cityNodeId)) {
      return this.adjacency.get(cityNodeId)!.map(e => e.to);
    }

    this.nodeCoords.set(cityNodeId, { lat: location.lat, lng: location.lng, name: location.name });

    const allowedHighways = HighwayGraph.CITY_HIGHWAY_ACCESS[location.id];

    // Find nearest stations (within 100km, best per highway)
    const candidates: { stationId: string; dist: number; highway: string }[] = [];
    for (const [hwCode, highway] of Object.entries(this.network.highways)) {
      // Skip highways not allowed for this city
      if (allowedHighways && !allowedHighways.includes(hwCode)) continue;

      let bestInHw: { stationId: string; dist: number } | null = null;
      for (const station of highway.stations) {
        const dist = haversineKm(location.lat, location.lng, station.lat, station.lng);
        if (dist < 100 && (!bestInHw || dist < bestInHw.dist)) {
          bestInHw = { stationId: station.id, dist };
        }
      }
      if (bestInHw) {
        candidates.push({ ...bestInHw, highway: hwCode });
      }
    }

    // Sort by distance, take up to 8 nearest (across different highways)
    candidates.sort((a, b) => a.dist - b.dist);
    const connected = candidates.slice(0, 8);

    for (const c of connected) {
      this.addEdge(cityNodeId, c.stationId, { weight: c.dist, type: "city-access" });
      this.addEdge(c.stationId, cityNodeId, { weight: c.dist, type: "city-access" });
    }

    return connected.map(c => c.stationId);
  }

  /** Dijkstra shortest path */
  findPath(fromId: string, toId: string): GraphPath | null {
    if (!this.adjacency.has(fromId) || !this.adjacency.has(toId)) return null;

    const dist = new Map<string, number>();
    const prev = new Map<string, { node: string; edge: GraphEdge } | null>();
    const visited = new Set<string>();

    // Simple priority queue using sorted array (sufficient for our graph size ~200 nodes)
    const queue: { node: string; dist: number }[] = [];

    dist.set(fromId, 0);
    prev.set(fromId, null);
    queue.push({ node: fromId, dist: 0 });

    while (queue.length > 0) {
      // Find min
      let minIdx = 0;
      for (let i = 1; i < queue.length; i++) {
        if (queue[i].dist < queue[minIdx].dist) minIdx = i;
      }
      const { node: current, dist: currentDist } = queue.splice(minIdx, 1)[0];

      if (visited.has(current)) continue;
      visited.add(current);

      if (current === toId) break;

      const edges = this.adjacency.get(current) || [];
      for (const edge of edges) {
        if (visited.has(edge.to)) continue;
        const newDist = currentDist + edge.weight;
        if (!dist.has(edge.to) || newDist < dist.get(edge.to)!) {
          dist.set(edge.to, newDist);
          prev.set(edge.to, { node: current, edge });
          queue.push({ node: edge.to, dist: newDist });
        }
      }
    }

    if (!prev.has(toId)) return null;

    // Reconstruct path
    const nodes: string[] = [];
    const edges: GraphEdge[] = [];
    let current: string | undefined = toId;

    while (current) {
      nodes.unshift(current);
      const p = prev.get(current);
      if (p) {
        edges.unshift(p.edge);
        current = p.node;
      } else {
        break;
      }
    }

    return {
      nodes,
      edges,
      totalDistanceKm: Math.round(dist.get(toId) || 0),
    };
  }

  /** Get coordinates for a node */
  getNodeCoords(nodeId: string): { lat: number; lng: number; name: string } | undefined {
    return this.nodeCoords.get(nodeId);
  }

  /** Get which highway a station belongs to */
  getStationHighway(stationId: string): string | undefined {
    return this.stationToHighway.get(stationId);
  }

  /** Get highway display name */
  getHighwayName(hwCode: string): string {
    return this.network.highways[hwCode]?.name || hwCode;
  }
}

// --- Singleton graph instance ---

let graphInstance: HighwayGraph | null = null;

export function getHighwayGraph(): HighwayGraph {
  if (!graphInstance) {
    graphInstance = new HighwayGraph(highwayNetworkData as HighwayNetwork);
  }
  return graphInstance;
}

// --- Route calculation ---

/**
 * Extract toll segments from a graph path.
 * Groups consecutive highway edges into segments (entry→exit per highway).
 * Identifies bridge/tunnel crossings.
 */
function extractSegments(
  path: GraphPath,
  graph: HighwayGraph
): { segments: RouteTollSegment[]; crossingIds: string[] } {
  const segments: RouteTollSegment[] = [];
  const crossingIds: string[] = [];

  let currentHighway: string | null = null;
  let entryStation: string | null = null;
  let entryName: string | null = null;

  for (let i = 0; i < path.edges.length; i++) {
    const edge = path.edges[i];
    const fromNode = path.nodes[i];
    const toNode = path.nodes[i + 1];

    if (edge.type === "crossing") {
      // Flush current highway segment (always flush on crossing, even without toll)
      if (currentHighway && entryStation) {
        const exitCoords = graph.getNodeCoords(fromNode);
        segments.push({
          highway: currentHighway,
          highwayName: graph.getHighwayName(currentHighway),
          entryStation,
          exitStation: fromNode,
          entryName: entryName || entryStation,
          exitName: exitCoords?.name || fromNode,
        });
        currentHighway = null;
        entryStation = null;
      }
      if (edge.crossingId) crossingIds.push(edge.crossingId);
    } else if (edge.type === "highway" && edge.highway) {
      if (currentHighway !== edge.highway) {
        // Flush previous segment
        if (currentHighway && entryStation) {
          const exitCoords = graph.getNodeCoords(fromNode);
          segments.push({
            highway: currentHighway,
            highwayName: graph.getHighwayName(currentHighway),
            entryStation,
            exitStation: fromNode,
            entryName: entryName || entryStation,
            exitName: exitCoords?.name || fromNode,
          });
        }
        // Start new segment
        currentHighway = edge.highway;
        entryStation = fromNode;
        const entryCoords = graph.getNodeCoords(fromNode);
        entryName = entryCoords?.name || fromNode;
      }
    } else if (edge.type === "junction" || edge.type === "city-access") {
      // Flush current highway segment on junction/city-access
      if (currentHighway && entryStation) {
        const exitCoords = graph.getNodeCoords(fromNode);
        segments.push({
          highway: currentHighway,
          highwayName: graph.getHighwayName(currentHighway),
          entryStation,
          exitStation: fromNode,
          entryName: entryName || entryStation,
          exitName: exitCoords?.name || fromNode,
        });
        currentHighway = null;
        entryStation = null;
      }
    }
  }

  // Flush final segment
  if (currentHighway && entryStation) {
    const lastNode = path.nodes[path.nodes.length - 1];
    const exitCoords = graph.getNodeCoords(lastNode);
    // Find the last highway node (not a city node)
    let exitNode = lastNode;
    for (let i = path.edges.length - 1; i >= 0; i--) {
      if (path.edges[i].type === "highway" && path.edges[i].highway === currentHighway) {
        exitNode = path.nodes[i + 1];
        break;
      }
    }
    const exitCoords2 = graph.getNodeCoords(exitNode);
    segments.push({
      highway: currentHighway,
      highwayName: graph.getHighwayName(currentHighway),
      entryStation,
      exitStation: exitNode,
      entryName: entryName || entryStation,
      exitName: exitCoords2?.name || exitCoords?.name || exitNode,
    });
  }

  return { segments, crossingIds };
}

/**
 * Look up toll price for a highway segment (entry→exit).
 * Tries both directions since pricing data may store in either order.
 */
function lookupHighwayToll(
  highway: string,
  entryStation: string,
  exitStation: string,
  pricing: OtoyolPricing
): Record<VehicleClass, number> | null {
  const hwPricing = pricing[highway];
  if (!hwPricing) return null;

  // Direct lookup
  const key1 = `${entryStation}__${exitStation}`;
  if (hwPricing[key1]) return hwPricing[key1];

  // Reverse lookup
  const key2 = `${exitStation}__${entryStation}`;
  if (hwPricing[key2]) return hwPricing[key2];

  return null;
}

/**
 * Calculate full route with tolls between two locations.
 */
export function calculateGraphRoute(
  from: Location,
  to: Location,
  pricing: OtoyolPricing,
  fixedTolls: FixedToll[]
): RouteResult | null {
  const graph = getHighwayGraph();

  // Add city nodes
  graph.addCityNode(from);
  graph.addCityNode(to);

  const fromNodeId = `city:${from.id}`;
  const toNodeId = `city:${to.id}`;

  const path = graph.findPath(fromNodeId, toNodeId);
  if (!path) return null;

  const { segments, crossingIds } = extractSegments(path, graph);

  // Calculate tolls by building an ordered list of toll events from the path
  const tolls: TollOnRoute[] = [];
  const totalPrices: Record<VehicleClass, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, moto: 0 };

  // Build ordered toll events: iterate edges, track when highway segments start/end
  type TollEvent = { kind: "segment"; segment: RouteTollSegment } | { kind: "crossing"; crossingId: string };
  const events: TollEvent[] = [];
  let segmentActive = false;
  let currentSegIdx = 0;

  for (const edge of path.edges) {
    if (edge.type === "highway") {
      if (!segmentActive) segmentActive = true;
    } else {
      // Non-highway edge: flush active segment
      if (segmentActive && currentSegIdx < segments.length) {
        events.push({ kind: "segment", segment: segments[currentSegIdx] });
        currentSegIdx++;
        segmentActive = false;
      }
      if (edge.type === "crossing" && edge.crossingId) {
        events.push({ kind: "crossing", crossingId: edge.crossingId });
      }
    }
  }
  // Flush last segment
  if (segmentActive && currentSegIdx < segments.length) {
    events.push({ kind: "segment", segment: segments[currentSegIdx] });
  }

  // Process toll events
  function addPrices(prices: Record<VehicleClass, number>) {
    for (const vc of ["1", "2", "3", "4", "5", "moto"] as VehicleClass[]) {
      totalPrices[vc] += prices[vc] || 0;
    }
  }

  for (const event of events) {
    if (event.kind === "crossing") {
      const fixedToll = fixedTolls.find(t => t.id === event.crossingId);
      if (fixedToll) {
        tolls.push({
          id: fixedToll.id,
          name: fixedToll.name,
          type: fixedToll.type,
          prices: fixedToll.prices,
        });
        addPrices(fixedToll.prices);
      }
    } else {
      const seg = event.segment;
      const prices = lookupHighwayToll(seg.highway, seg.entryStation, seg.exitStation, pricing);
      if (prices) {
        tolls.push({
          id: `${seg.entryStation}__${seg.exitStation}`,
          name: `${seg.highwayName} (${seg.entryName} → ${seg.exitName})`,
          type: "gise",
          prices,
        });
        addPrices(prices);
      }
    }
  }

  // Build waypoints from path nodes (skip city nodes for cleaner display)
  const waypoints: [number, number][] = [];
  for (const nodeId of path.nodes) {
    const coords = graph.getNodeCoords(nodeId);
    if (coords) {
      waypoints.push([coords.lat, coords.lng]);
    }
  }

  return {
    path,
    segments,
    crossingIds,
    tolls,
    totalPrices,
    waypoints,
    totalDistanceKm: path.totalDistanceKm,
  };
}
