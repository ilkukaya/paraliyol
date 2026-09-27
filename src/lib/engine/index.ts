import { BRIDGES, HIGHWAYS, LOCATIONS, ROAD_EDGES } from "./data";
import { RoadNetwork } from "./network";
import { findRoute } from "./router";
import { VEHICLE_CLASSES, type Location, type RouteResult, type VehicleClass } from "./types";

/**
 * Measured road lengths are only used once (almost) every edge is measured:
 * mixing measured and estimated durations would bias route choice.
 */
function measuredEdges() {
  const probe = new RoadNetwork(HIGHWAYS, BRIDGES, LOCATIONS);
  const keys = new Set<string>();
  probe.adj.forEach((edges, a) => {
    for (const e of edges) if (e.kind !== "bridge") keys.add(RoadNetwork.pairKey(probe.nodes[a].key, probe.nodes[e.to].key));
  });
  let hit = 0;
  for (const k of keys) if (ROAD_EDGES[k]) hit++;
  return keys.size && hit / keys.size >= 0.95 ? ROAD_EDGES : {};
}

let network: RoadNetwork | null = null;
export function getNetwork() {
  network ??= new RoadNetwork(HIGHWAYS, BRIDGES, LOCATIONS, measuredEdges());
  return network;
}

const locById = new Map(LOCATIONS.map((l) => [l.id, l]));
export const getLocation = (id: string) => locById.get(id);
export const getLocations = () => LOCATIONS;
export const getHighways = () => HIGHWAYS;
export const getHighway = (code: string) => HIGHWAYS.find((h) => h.code === code);
export const getCrossings = () => BRIDGES;

export interface TripOption {
  fastest: RouteResult;
  economic: RouteResult | null;
}

export interface Trip {
  from: Location;
  to: Location;
  byClass: Record<VehicleClass, TripOption>;
}

const tripCache = new Map<string, Trip | null>();

export function computeTrip(fromId: string, toId: string): Trip | null {
  const key = `${fromId}>${toId}`;
  if (tripCache.has(key)) return tripCache.get(key)!;
  const from = locById.get(fromId);
  const to = locById.get(toId);
  if (!from || !to || from.id === to.id) return null;
  const net = getNetwork();
  const byClass = {} as Record<VehicleClass, TripOption>;
  for (const vc of VEHICLE_CLASSES) {
    const fastest = findRoute(net, `loc:${from.id}`, `loc:${to.id}`, vc, "fastest");
    if (!fastest) {
      tripCache.set(key, null);
      return null;
    }
    const economic = findRoute(net, `loc:${from.id}`, `loc:${to.id}`, vc, "economic");
    byClass[vc] = {
      fastest,
      // only worth showing when it actually saves money
      economic: economic && economic.total < fastest.total ? economic : null,
    };
  }
  const trip = { from, to, byClass };
  if (tripCache.size > 5000) tripCache.clear();
  tripCache.set(key, trip);
  return trip;
}
