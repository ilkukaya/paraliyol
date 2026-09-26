import { BOOKING_AID } from "./site";

export interface AffiliateLink {
  id: string;
  title: string;
  text: string;
  cta: string;
  href: string;
  sponsored: boolean;
}

const fill = (tpl: string, city: string) => tpl.replace(/\{city\}/g, encodeURIComponent(city));

/**
 * Travel links shown on route pages. Every partner is configured through an
 * environment variable holding the tracking URL (with {city} placeholder),
 * so affiliate ids never live in the code. Unconfigured partners are hidden,
 * except the hotel search which is useful even without an affiliate id.
 */
export function travelLinks(city: string): AffiliateLink[] {
  const links: AffiliateLink[] = [];
  const hotel = new URL("https://www.booking.com/searchresults.tr.html");
  hotel.searchParams.set("ss", city);
  if (BOOKING_AID) hotel.searchParams.set("aid", BOOKING_AID);
  links.push({
    id: "hotel",
    title: `${city} otelleri`,
    text: "Varış noktanızda konaklama fiyatlarını karşılaştırın.",
    cta: "Otel ara",
    href: hotel.toString(),
    sponsored: !!BOOKING_AID,
  });
  const car = process.env.NEXT_PUBLIC_CAR_RENTAL_URL;
  if (car) {
    links.push({
      id: "car",
      title: "Araç kiralama",
      text: `${city} ve çevresinde kiralık araç fiyatlarını görün.`,
      cta: "Araç bul",
      href: fill(car, city),
      sponsored: true,
    });
  }
  const insurance = process.env.NEXT_PUBLIC_INSURANCE_URL;
  if (insurance) {
    links.push({
      id: "insurance",
      title: "Trafik sigortası ve kasko",
      text: "Uzun yola çıkmadan poliçe tekliflerini karşılaştırın.",
      cta: "Teklif al",
      href: fill(insurance, city),
      sponsored: true,
    });
  }
  return links;
}
