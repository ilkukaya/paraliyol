export type LatLng = [number, number];

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/**
 * Coarse outline of the Sea of Marmara including the Bosphorus, the Gulf of
 * İzmit, the Gulf of Gemlik and the Dardanelles. A straight free-road edge
 * that crosses this outline would require a bridge, tunnel or ferry, so such
 * edges are not added to the road graph. [lat, lng]
 */
const MARMARA: LatLng[] = [
  [40.41, 26.66], // Gelibolu
  [40.6, 27.1], // Şarköy
  [40.96, 27.52], // Tekirdağ
  [41.06, 28.24], // Silivri
  [41.01, 28.58], // Büyükçekmece
  [40.96, 28.82], // Yeşilköy
  [41.01, 28.98], // Sarayburnu
  [41.045, 29.012], // Beşiktaş
  [41.08, 29.045], // Bebek
  [41.17, 29.058], // Sarıyer
  [41.24, 29.11], // Rumeli Feneri
  [41.225, 29.155], // Anadolu Feneri
  [41.13, 29.095], // Beykoz
  [41.025, 29.018], // Üsküdar
  [40.985, 29.02], // Kadıköy
  [40.95, 29.1], // Bostancı
  [40.87, 29.23], // Pendik
  [40.81, 29.3], // Tuzla
  [40.765, 29.38], // Darıca
  [40.775, 29.53], // Dilovası
  [40.79, 29.62], // Hereke
  [40.765, 29.9], // İzmit (bay tip)
  [40.72, 29.82], // Gölcük
  [40.69, 29.61], // Karamürsel
  [40.668, 29.27], // Yalova
  [40.52, 28.83], // Armutlu
  [40.55, 29.02], // Gemlik gulf mouth (north)
  [40.44, 29.13], // Gemlik
  [40.38, 28.9], // Mudanya
  [40.4, 28.35], // Karacabey coast
  [40.37, 27.97], // Bandırma
  [40.4, 27.79], // Erdek
  [40.43, 27.3], // Biga coast
  [40.36, 26.69], // Lapseki
  [40.16, 26.42], // Çanakkale
  [40.0, 26.2], // Kumkale
  [40.05, 26.18], // Seddülbahir
  [40.18, 26.35], // Eceabat
];

const WATER: LatLng[][] = [MARMARA];

function orient(a: LatLng, b: LatLng, c: LatLng) {
  return (b[1] - a[1]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[1] - a[1]);
}

function segmentsIntersect(p1: LatLng, p2: LatLng, q1: LatLng, q2: LatLng) {
  const d1 = orient(q1, q2, p1);
  const d2 = orient(q1, q2, p2);
  const d3 = orient(p1, p2, q1);
  const d4 = orient(p1, p2, q2);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

/** True when the straight segment a-b crosses a modelled body of water. */
export function crossesWater(a: LatLng, b: LatLng): boolean {
  for (const poly of WATER) {
    for (let i = 0; i < poly.length; i++) {
      const q1 = poly[i];
      const q2 = poly[(i + 1) % poly.length];
      if (segmentsIntersect(a, b, q1, q2)) return true;
    }
  }
  return false;
}
