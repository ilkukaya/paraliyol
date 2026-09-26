import locationsJson from "../../../data/locations.json";
import type { Location } from "./types";

const LOCATIONS = locationsJson as Location[];

const SUFFIX = "-otoyol-ucreti";
const byId = new Map(LOCATIONS.map((l) => [l.id, l]));

/**
 * Which İstanbul side a plain "istanbul-x" URL means: Thrace and the
 * Dardanelles are reached from the European side, everything else from Anatolia.
 */
export function preferredIstanbulSide(other: Location): "istanbul-avrupa" | "istanbul-anadolu" {
  const thrace = other.lng < 28.9 && other.lat >= 40.5;
  const dardanelles = other.lng < 26.9 && other.lat >= 40.0;
  return thrace || dardanelles ? "istanbul-avrupa" : "istanbul-anadolu";
}

function part(loc: Location, other: Location) {
  if ((loc.id === "istanbul-avrupa" || loc.id === "istanbul-anadolu") && other.il !== "İstanbul") {
    return preferredIstanbulSide(other) === loc.id ? "istanbul" : loc.id;
  }
  return loc.id;
}

export function routeSlug(fromId: string, toId: string): string {
  const from = byId.get(fromId)!;
  const to = byId.get(toId)!;
  return `${part(from, to)}-${part(to, from)}${SUFFIX}`;
}

let index: Map<string, [string, string]> | null = null;
export function parseRouteSlug(slug: string): { from: Location; to: Location } | null {
  if (!index) {
    index = new Map();
    for (const a of LOCATIONS) for (const b of LOCATIONS) if (a.id !== b.id) index.set(routeSlug(a.id, b.id), [a.id, b.id]);
  }
  const hit = index.get(slug);
  return hit ? { from: byId.get(hit[0])!, to: byId.get(hit[1])! } : null;
}
