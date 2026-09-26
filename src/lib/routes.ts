import { computeTrip, getHighway, getLocations, getCrossings } from "./engine";
import { routeSlug } from "./engine/slugs";
import { VEHICLE_CLASSES, type Location, type VehicleClass } from "./engine/types";
import type { TripViewData } from "@/components/TripView";

export function tripViewData(from: Location, to: Location): TripViewData | null {
  const trip = computeTrip(from.id, to.id);
  const back = computeTrip(to.id, from.id);
  if (!trip || !back) return null;
  const returnTotal = {} as Record<VehicleClass, number>;
  for (const vc of VEHICLE_CLASSES) returnTotal[vc] = back.byClass[vc].fastest.total;
  return {
    fromName: from.name,
    toName: to.name,
    byClass: trip.byClass,
    returnTotal,
    reverseHref: `/${routeSlug(to.id, from.id)}`,
  };
}

/** Tariff dates of every toll used on the route (for "geçerlilik" notes). */
export function tariffDates(data: TripViewData): string[] {
  const dates = new Set<string>();
  for (const t of data.byClass["1"].fastest.tolls) {
    if (t.kind === "highway") {
      const hw = getHighway(t.ref);
      if (hw) dates.add(hw.validFrom);
    } else {
      const c = getCrossings().find((x) => x.id === t.ref) as { validFrom?: string } | undefined;
      if (c?.validFrom) dates.add(c.validFrom);
    }
  }
  return [...dates].sort();
}

/** Popular pairs (both directions) that are pre-rendered and listed in the sitemap. */
export function popularPairs(): [Location, Location][] {
  const popular = getLocations().filter((l) => l.popular);
  const pairs: [Location, Location][] = [];
  for (const a of popular) for (const b of popular) if (a.id !== b.id) pairs.push([a, b]);
  return pairs;
}

/** Popular destinations from a location, used for internal links. */
export function relatedFrom(loc: Location, exclude: string, limit = 8): Location[] {
  return getLocations()
    .filter((l) => l.popular && l.id !== loc.id && l.id !== exclude && l.il !== loc.il)
    .sort((a, b) => dist(loc, a) - dist(loc, b))
    .slice(0, limit);
}

const dist = (a: Location, b: Location) => Math.hypot(a.lat - b.lat, (a.lng - b.lng) * 0.77);
