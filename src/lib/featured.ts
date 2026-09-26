import { computeTrip, getLocation } from "./engine";
import { routeSlug } from "./engine/slugs";

const FEATURED: [string, string][] = [
  ["istanbul-anadolu", "ankara"],
  ["istanbul-anadolu", "izmir"],
  ["istanbul-anadolu", "bursa"],
  ["istanbul-avrupa", "edirne"],
  ["istanbul-avrupa", "canakkale"],
  ["ankara", "izmir"],
  ["ankara", "adana"],
  ["ankara", "kapadokya"],
  ["istanbul-anadolu", "antalya"],
  ["izmir", "cesme"],
  ["izmir", "kusadasi"],
  ["adana", "gaziantep"],
  ["mersin", "adana"],
  ["gaziantep", "sanliurfa"],
  ["bursa", "izmir"],
  ["istanbul-anadolu", "bolu"],
];

export function featuredRoutes() {
  return FEATURED.flatMap(([a, b]) => {
    const from = getLocation(a);
    const to = getLocation(b);
    const trip = from && to ? computeTrip(a, b) : null;
    if (!from || !to || !trip) return [];
    const f = trip.byClass["1"].fastest;
    return [{ href: `/${routeSlug(a, b)}`, from: from.name, to: to.name, total: f.total, km: f.km, minutes: f.minutes }];
  });
}
