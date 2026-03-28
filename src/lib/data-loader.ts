import type {
  TollPlaza,
  FixedToll,
  OtoyolPricing,
  Location,
  PopularRoute,
  SiteSettings,
} from "@/types";

import tollPlazasData from "../../data/toll-plazas.json";
import fixedTollsData from "../../data/fixed-tolls.json";
import otoyolPricingData from "../../data/otoyol-pricing.json";
import locationsData from "../../data/locations.json";
import popularRoutesData from "../../data/popular-routes.json";
import siteSettingsData from "../../data/site-settings.json";

export function getTollPlazas(): TollPlaza[] {
  return tollPlazasData as TollPlaza[];
}

export function getFixedTolls(): FixedToll[] {
  return fixedTollsData as FixedToll[];
}

export function getActiveFixedTolls(): FixedToll[] {
  return getFixedTolls().filter((t) => t.active);
}

export function getOtoyolPricing(): OtoyolPricing {
  return otoyolPricingData as unknown as OtoyolPricing;
}

export function getLocations(): Location[] {
  return locationsData as Location[];
}

export function getPopularLocations(): Location[] {
  return getLocations().filter((l) => l.popular);
}

export function getPopularRoutes(): PopularRoute[] {
  return popularRoutesData as unknown as PopularRoute[];
}

export function getSiteSettings(): SiteSettings {
  return siteSettingsData as SiteSettings;
}

export function getLocationById(id: string): Location | undefined {
  return getLocations().find((l) => l.id === id);
}

export function getFixedTollById(id: string): FixedToll | undefined {
  return getFixedTolls().find((t) => t.id === id);
}

export function getPopularRouteBySlug(
  slug: string
): PopularRoute | undefined {
  return getPopularRoutes().find((r) => r.slug === slug);
}

export function getFixedTollsByType(type: string): FixedToll[] {
  return getActiveFixedTolls().filter((t) => t.type === type);
}
