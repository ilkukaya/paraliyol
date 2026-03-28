import type {
  VehicleClass,
  TollOnRoute,
  RouteCalculationResult,
  Location,
  PopularRoute,
} from "@/types";
import {
  getPopularRoutes,
  getLocationById,
} from "./data-loader";

export function findPopularRoute(
  fromId: string,
  toId: string
): PopularRoute | undefined {
  const routes = getPopularRoutes();
  return routes.find(
    (r) =>
      (r.from === fromId && r.to === toId) ||
      (r.from === toId && r.to === fromId)
  );
}

export function calculateRouteFromPopular(
  route: PopularRoute,
  vehicleClass: VehicleClass
): RouteCalculationResult | null {
  const fromLocation = getLocationById(route.from);
  const toLocation = getLocationById(route.to);

  if (!fromLocation || !toLocation) return null;

  return {
    from: fromLocation,
    to: toLocation,
    totalDistanceKm: route.totalDistanceKm,
    tolls: route.tolls,
    totalPrices: route.totalPrices,
    waypoints: route.waypoints,
  };
}

export function getTotalPrice(
  tolls: TollOnRoute[],
  vehicleClass: VehicleClass
): number {
  return tolls.reduce((sum, toll) => sum + (toll.prices[vehicleClass] || 0), 0);
}

export function calculateRoute(
  fromId: string,
  toId: string
): RouteCalculationResult | null {
  // First try to find a pre-computed popular route
  const popularRoute = findPopularRoute(fromId, toId);
  if (popularRoute) {
    return calculateRouteFromPopular(popularRoute, "1");
  }

  // For non-popular routes, return null (will be handled by OSRM in v2)
  const fromLocation = getLocationById(fromId);
  const toLocation = getLocationById(toId);

  if (!fromLocation || !toLocation) return null;

  return {
    from: fromLocation,
    to: toLocation,
    totalDistanceKm: 0,
    tolls: [],
    totalPrices: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, moto: 0 },
    waypoints: [
      [fromLocation.lat, fromLocation.lng],
      [toLocation.lat, toLocation.lng],
    ],
  };
}

export function getRouteDisplayName(from: Location, to: Location): string {
  return `${from.name} → ${to.name}`;
}
