import { getHighwayGraph, calculateGraphRoute } from '../src/lib/highway-graph';
import { getOtoyolPricing, getActiveFixedTolls } from '../src/lib/data-loader';

const pricing = getOtoyolPricing();
const fixedTolls = getActiveFixedTolls();
const graph = getHighwayGraph();

function debugRoute(fromObj: any, toObj: any, label: string) {
  console.log(`\n=== ${label} ===`);
  graph.addCityNode(fromObj);
  graph.addCityNode(toObj);

  const path = graph.findPath(`city:${fromObj.id}`, `city:${toObj.id}`);
  if (!path) {
    console.log('No route found');
    return;
  }

  console.log('Distance:', path.totalDistanceKm, 'km');
  for (let i = 0; i < path.edges.length; i++) {
    const edge = path.edges[i];
    const from = graph.getNodeCoords(path.nodes[i]);
    const to = graph.getNodeCoords(path.nodes[i + 1]);
    const extra = edge.highway ? `/${edge.highway}` : '';
    const cross = edge.crossingId ? `/CROSSING:${edge.crossingId}` : '';
    console.log(`  ${from?.name || path.nodes[i]} --[${edge.type}${extra}${cross} ${Math.round(edge.weight)}km]--> ${to?.name || path.nodes[i + 1]}`);
  }

  const result = calculateGraphRoute(fromObj, toObj, pricing, fixedTolls);
  if (result) {
    console.log('Segments:', result.segments.length);
    for (const seg of result.segments) {
      console.log(`  ${seg.highwayName}: ${seg.entryName} → ${seg.exitName}`);
    }
    console.log('Tolls:');
    for (const toll of result.tolls) {
      console.log(`  ${toll.name} - Class 1: ${toll.prices['1']} TL`);
    }
    console.log(`TOTAL (Class 1): ${result.totalPrices['1']} TL`);
  }
}

// Test routes
debugRoute(
  { id: 'istanbul-anadolu', name: 'İstanbul (Anadolu)', il: 'İstanbul', lat: 40.9828, lng: 29.0876 },
  { id: 'bursa', name: 'Bursa', il: 'Bursa', lat: 40.1885, lng: 29.0610 },
  'İstanbul (Anadolu) → Bursa'
);

debugRoute(
  { id: 'istanbul-avrupa', name: 'İstanbul (Avrupa)', il: 'İstanbul', lat: 41.0082, lng: 28.9784 },
  { id: 'ankara', name: 'Ankara', il: 'Ankara', lat: 39.9334, lng: 32.8597 },
  'İstanbul (Avrupa) → Ankara'
);

debugRoute(
  { id: 'edirne', name: 'Edirne', il: 'Edirne', lat: 41.6818, lng: 26.5623 },
  { id: 'izmir', name: 'İzmir', il: 'İzmir', lat: 38.4237, lng: 27.1428 },
  'Edirne → İzmir'
);

debugRoute(
  { id: 'ankara', name: 'Ankara', il: 'Ankara', lat: 39.9334, lng: 32.8597 },
  { id: 'antalya', name: 'Antalya', il: 'Antalya', lat: 36.8969, lng: 30.7133 },
  'Ankara → Antalya'
);

debugRoute(
  { id: 'adana', name: 'Adana', il: 'Adana', lat: 36.9914, lng: 35.3308 },
  { id: 'gaziantep', name: 'Gaziantep', il: 'Gaziantep', lat: 37.0662, lng: 37.3833 },
  'Adana → Gaziantep'
);

// THE KEY TEST: Hadımköy gişe giriş → Balıkesir Kuzey gişe çıkış
// This requires cross-highway routing: O-3 → bridge → O-5
debugRoute(
  { id: 'hadimkoy', name: 'Hadımköy', il: 'İstanbul', lat: 41.10, lng: 28.63 },
  { id: 'balikesir-kuzey', name: 'Balıkesir Kuzey', il: 'Balıkesir', lat: 39.95, lng: 28.50 },
  'HADIMKÖY → BALIKESİR KUZEY (senin test casen)'
);
