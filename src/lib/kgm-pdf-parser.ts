/**
 * KGM PDF Parser
 *
 * KGM (Karayollari Genel Mudurlugu) otoyol ve kopru ucret PDF'lerini
 * parse edip yapilandirilmis veri olarak dondurur.
 *
 * PDF Turleri:
 * 1. Kopru/Tunel: Basit tablo - arac sinifi -> ucret
 * 2. Otoyol Matrisi: Giris x Cikis x Arac Sinifi -> Ucret
 */

import type { VehicleClass, FixedToll } from "@/types";

// --- Types ---

export interface ParsedBridgeToll {
  type: "bridge" | "tunnel";
  name: string;
  fileName: string;
  prices: Record<VehicleClass, number>;
}

export interface ParsedHighwayPricing {
  type: "highway";
  name: string;
  fileName: string;
  stations: string[];
  matrix: HighwayPriceEntry[];
}

export interface HighwayPriceEntry {
  from: string;
  to: string;
  prices: Record<VehicleClass, number>;
}

export type ParsedPdfResult = ParsedBridgeToll | ParsedHighwayPricing;

// --- PDF file to highway mapping ---

export interface PdfMapping {
  fileName: string;
  type: "bridge" | "tunnel" | "highway";
  name: string;
  /** For bridges/tunnels: the ID in fixed-tolls.json */
  fixedTollId?: string;
  /** For highways: the otoyol code */
  otoyolCode?: string;
}

export const PDF_MAPPINGS: PdfMapping[] = [
  {
    fileName: "1-15Temmuz-FSM.pdf",
    type: "bridge",
    name: "15 Temmuz Sehitler / FSM Koprusu",
    fixedTollId: "15-temmuz-fsm-koprusu",
  },
  {
    fileName: "2-Osmangazi.pdf",
    type: "bridge",
    name: "Osmangazi Koprusu",
    fixedTollId: "osmangazi-koprusu",
  },
  {
    fileName: "4-1915Canakkale.pdf",
    type: "bridge",
    name: "1915 Canakkale Koprusu",
    fixedTollId: "1915-canakkale-koprusu",
  },
  {
    fileName: "5-AnadoluOtoyoluCamlica-Akinci.pdf",
    type: "highway",
    name: "Anadolu Otoyolu (Camlica-Akinci)",
    otoyolCode: "O-4",
  },
  {
    fileName: "7-Izmir-Aydin.pdf",
    type: "highway",
    name: "Izmir-Aydin Otoyolu",
    otoyolCode: "IZA",
  },
  {
    fileName: "11-AvrupaOtoyoluMahmutbey-Edirne.pdf",
    type: "highway",
    name: "Avrupa Otoyolu (Mahmutbey-Edirne)",
    otoyolCode: "O-3",
  },
  {
    fileName: "12-Gebze-Orhangazi-Izmir.pdf",
    type: "highway",
    name: "Gebze-Orhangazi-Izmir Otoyolu",
    otoyolCode: "O-5",
  },
  {
    fileName: "13-YSSKuzeyCevreYolu.pdf",
    type: "highway",
    name: "YSS Kuzey Cevre Yolu",
    otoyolCode: "KCY",
  },
  {
    fileName: "14-KMOAvrupaKinali-Odayeri.pdf",
    type: "highway",
    name: "KMO Avrupa (Kinali-Odayeri)",
    otoyolCode: "KMO-AV",
  },
  {
    fileName: "15-KMOAnadoluKurtkoy-Akyazi.pdf",
    type: "highway",
    name: "KMO Anadolu (Kurtkoy-Akyazi)",
    otoyolCode: "KMO-AN",
  },
  {
    fileName: "17-Ankara-Nigde.pdf",
    type: "highway",
    name: "Ankara-Nigde Otoyolu",
    otoyolCode: "ANO",
  },
  {
    fileName: "18-Malkara-Canakkale.pdf",
    type: "highway",
    name: "Malkara-Canakkale Otoyolu",
    otoyolCode: "MCO",
  },
  {
    fileName: "19-Aydin-Denizli.pdf",
    type: "highway",
    name: "Aydin-Denizli Otoyolu",
    otoyolCode: "ADO",
  },
];

// --- Utility functions ---

/** Parse Turkish number format: "1.590,00" -> 1590.00, "45,00" -> 45.00 */
export function parseTurkishNumber(str: string): number {
  if (!str || str === "-" || str === "–") return 0;
  // Remove spaces and currency symbols
  let cleaned = str.replace(/[\s₺TL]/g, "").trim();
  // Remove dots (thousand separators)
  cleaned = cleaned.replace(/\./g, "");
  // Replace comma with dot (decimal separator)
  cleaned = cleaned.replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/** Normalize station name for ID generation */
export function normalizeStationName(name: string): string {
  return name
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/Ğ/g, "g")
    .replace(/Ü/g, "u")
    .replace(/Ş/g, "s")
    .replace(/İ/g, "i")
    .replace(/Ö/g, "o")
    .replace(/Ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// --- Text item with position (from pdfjs-dist) ---

export interface TextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Reconstruct a table from positioned text items.
 * Groups items by approximate y-position (rows), then sorts by x-position (columns).
 */
export function reconstructTable(
  items: TextItem[],
  rowTolerance = 3
): string[][] {
  if (items.length === 0) return [];

  // Sort by y (descending - PDF coords are bottom-up) then x
  const sorted = [...items].sort((a, b) => {
    if (Math.abs(a.y - b.y) > rowTolerance) return b.y - a.y;
    return a.x - b.x;
  });

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentY = sorted[0].y;

  for (const item of sorted) {
    if (Math.abs(item.y - currentY) > rowTolerance) {
      if (currentRow.length > 0) rows.push(currentRow);
      currentRow = [];
      currentY = item.y;
    }
    const text = item.str.trim();
    if (text) currentRow.push(text);
  }
  if (currentRow.length > 0) rows.push(currentRow);

  return rows;
}

// --- Bridge/Tunnel Parser ---

export function parseBridgePdf(
  rows: string[][],
  mapping: PdfMapping
): ParsedBridgeToll {
  const prices: Record<string, number> = {
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
    moto: 0,
  };

  // Bridge PDFs typically have rows like:
  // ["ARAÇ SINIFI", "ÜCRET TARİFESİ (TL)"]
  // ["1", "995,00 ₺"]
  // ["2", "1.590,00 ₺"]
  // etc.
  // Or sometimes: ["1", "995,00"]

  for (const row of rows) {
    if (row.length < 2) continue;

    const firstCell = row[0].trim();
    // Check if first cell is a vehicle class number
    if (/^[1-5]$/.test(firstCell)) {
      // Find the price - it's usually the last numeric-looking cell
      for (let i = row.length - 1; i >= 1; i--) {
        const val = parseTurkishNumber(row[i]);
        if (val > 0) {
          prices[firstCell] = val;
          break;
        }
      }
    }

    // Check for motorcycle (class 6 in KGM = our "moto")
    if (firstCell === "6" || /motosiklet/i.test(firstCell)) {
      for (let i = row.length - 1; i >= 1; i--) {
        const val = parseTurkishNumber(row[i]);
        if (val > 0) {
          prices["moto"] = val;
          break;
        }
      }
    }
  }

  return {
    type: mapping.type as "bridge" | "tunnel",
    name: mapping.name,
    fileName: mapping.fileName,
    prices: prices as Record<VehicleClass, number>,
  };
}

// --- Highway Matrix Parser ---

/**
 * Parse a highway toll matrix PDF.
 *
 * KGM highway PDFs have this structure:
 * - Header rows with station names as column headers
 * - Data rows: Station name | Vehicle class | Price1 | Price2 | ...
 * - Vehicle classes cycle 1-5 + 6(moto) for each origin station
 *
 * The exact format varies between PDFs but generally:
 * Row format: [StationName, Class, Price1, Price2, ...]
 * or: [StationName, Class, -, Price2, Price3, ...]  (dash for same-station)
 */
export function parseHighwayPdf(
  rows: string[][],
  mapping: PdfMapping
): ParsedHighwayPricing {
  const stations: string[] = [];
  const matrix: HighwayPriceEntry[] = [];

  // Step 1: Find the header row with station names
  // Usually the row containing "İSTASYON" or "SINIF" or has many station-like names
  let headerRowIndex = -1;
  let stationNames: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const joined = row.join(" ").toUpperCase();

    // Look for header indicators
    if (
      joined.includes("İSTASYON") ||
      joined.includes("ISTASYON") ||
      joined.includes("SINIF")
    ) {
      // Extract station names from this row and possibly next rows
      // Station names are typically after "SINIF" or "İSTASYON"
      const stationCells = row.filter(
        (cell) =>
          !/(İSTASYON|ISTASYON|SINIF|ARAÇ|ARAC|GİRİŞ|GIRIS|ÇIKIŞ|CIKIS)/i.test(
            cell
          ) && !/^\d+$/.test(cell.trim())
      );
      if (stationCells.length >= 2) {
        stationNames = stationCells.map((s) => s.trim());
        headerRowIndex = i;
        break;
      }
    }
  }

  // If we couldn't find a standard header, try heuristic: find a row with many text cells
  if (headerRowIndex === -1) {
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i];
      const textCells = row.filter(
        (cell) =>
          cell.trim().length > 1 &&
          !/^[\d.,\s₺TL-]+$/.test(cell.trim()) &&
          !/^(Giriş|Çıkış|Sınıf)/i.test(cell.trim())
      );
      if (textCells.length >= 3) {
        stationNames = textCells.map((s) => s.trim());
        headerRowIndex = i;
        break;
      }
    }
  }

  if (stationNames.length === 0) {
    // Fallback: try to extract station names from data rows
    // Each group of 6 rows (classes 1-5 + moto) starts with a station name
    for (const row of rows) {
      if (row.length >= 2) {
        const firstCell = row[0].trim();
        const secondCell = row[1]?.trim();
        if (
          secondCell === "1" &&
          firstCell.length > 1 &&
          !/^[\d.,₺]+$/.test(firstCell)
        ) {
          stationNames.push(firstCell);
        }
      }
    }
  }

  stations.push(...stationNames);

  // Step 2: Parse the price data rows
  // Format: StationName | VehicleClass | Price1 | Price2 | ...
  // Or: the station name appears only on the first row of the group

  let currentStation = "";
  const dataStartIndex = headerRowIndex + 1;

  for (let i = dataStartIndex; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2) continue;

    let vehicleClass = "";
    let priceStartIndex = 0;

    // Detect if the row starts with a station name
    const firstCell = row[0].trim();
    const secondCell = row.length > 1 ? row[1].trim() : "";

    if (/^[1-6]$/.test(firstCell)) {
      // First cell is vehicle class, station name is from previous group
      vehicleClass = firstCell;
      priceStartIndex = 1;
    } else if (/^[1-6]$/.test(secondCell)) {
      // First cell is station name, second is vehicle class
      if (
        firstCell.length > 1 &&
        !/^[\d.,₺TL\s-]+$/.test(firstCell) &&
        !/^(ARAÇ|ARAC)/i.test(firstCell)
      ) {
        currentStation = firstCell;
      }
      vehicleClass = secondCell;
      priceStartIndex = 2;
    } else {
      // Could be a header or separator row
      continue;
    }

    if (!currentStation || !vehicleClass) continue;

    // Map vehicle class: KGM uses 1-5 + 6 (motosiklet)
    const vc: VehicleClass | null =
      vehicleClass === "6" ? "moto" : /^[1-5]$/.test(vehicleClass) ? (vehicleClass as VehicleClass) : null;
    if (!vc) continue;

    // Extract prices for each destination station
    const pricesInRow = row.slice(priceStartIndex);

    for (let j = 0; j < pricesInRow.length && j < stationNames.length; j++) {
      const destStation = stationNames[j];
      if (!destStation || destStation === currentStation) continue;

      const price = parseTurkishNumber(pricesInRow[j]);
      if (price <= 0) continue;

      // Find or create the entry for this from-to pair
      const fromId = normalizeStationName(currentStation);
      const toId = normalizeStationName(destStation);
      const entryKey = `${fromId}__${toId}`;

      let entry = matrix.find(
        (e) =>
          normalizeStationName(e.from) + "__" + normalizeStationName(e.to) ===
          entryKey
      );
      if (!entry) {
        entry = {
          from: currentStation,
          to: destStation,
          prices: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, moto: 0 },
        };
        matrix.push(entry);
      }

      entry.prices[vc] = price;
    }
  }

  return {
    type: "highway",
    name: mapping.name,
    fileName: mapping.fileName,
    stations,
    matrix,
  };
}

// --- Auto-detect and parse ---

export function detectPdfType(
  rows: string[][],
  fileName: string
): "bridge" | "tunnel" | "highway" {
  // Check filename mapping first
  const mapping = PDF_MAPPINGS.find(
    (m) => m.fileName.toLowerCase() === fileName.toLowerCase()
  );
  if (mapping) {
    return mapping.type === "tunnel" ? "tunnel" : mapping.type;
  }

  // Check content for bridge/tunnel keywords
  const allText = rows
    .flat()
    .join(" ")
    .toUpperCase();
  if (
    allText.includes("KÖPRÜ") ||
    allText.includes("KOPRU") ||
    allText.includes("BRIDGE")
  ) {
    // If it has a simple class-price structure (few columns), it's a bridge
    const hasSimpleStructure = rows.some(
      (r) => r.length <= 3 && /^[1-6]$/.test(r[0]?.trim())
    );
    if (hasSimpleStructure) return "bridge";
  }
  if (
    allText.includes("TÜNEL") ||
    allText.includes("TUNEL") ||
    allText.includes("TUNNEL")
  ) {
    return "tunnel";
  }

  return "highway";
}

export function findMappingForFile(fileName: string): PdfMapping | undefined {
  return PDF_MAPPINGS.find(
    (m) => m.fileName.toLowerCase() === fileName.toLowerCase()
  );
}

export function parsePdf(
  rows: string[][],
  fileName: string
): ParsedPdfResult | null {
  const mapping = findMappingForFile(fileName);
  if (!mapping) {
    // Try to create a default mapping based on detection
    const type = detectPdfType(rows, fileName);
    const defaultMapping: PdfMapping = {
      fileName,
      type,
      name: fileName.replace(/\.pdf$/i, "").replace(/^\d+-/, ""),
    };
    if (type === "bridge" || type === "tunnel") {
      return parseBridgePdf(rows, defaultMapping);
    }
    return parseHighwayPdf(rows, defaultMapping);
  }

  if (mapping.type === "bridge" || mapping.type === "tunnel") {
    return parseBridgePdf(rows, mapping);
  }
  return parseHighwayPdf(rows, mapping);
}

// --- Generate JSON output ---

export interface SyncResult {
  otoyolPricing: Record<string, Record<string, Record<VehicleClass, number>>>;
  fixedTollUpdates: Array<{
    id: string;
    prices: Record<VehicleClass, number>;
  }>;
  tollPlazaUpdates: Array<{
    otoyolCode: string;
    stations: string[];
  }>;
  parsedFiles: ParsedPdfResult[];
  errors: string[];
}

export function generateSyncResult(
  parsedResults: ParsedPdfResult[]
): SyncResult {
  const result: SyncResult = {
    otoyolPricing: {},
    fixedTollUpdates: [],
    tollPlazaUpdates: [],
    parsedFiles: parsedResults,
    errors: [],
  };

  for (const parsed of parsedResults) {
    if (parsed.type === "bridge" || parsed.type === "tunnel") {
      const bridge = parsed as ParsedBridgeToll;
      const mapping = findMappingForFile(bridge.fileName);
      if (mapping?.fixedTollId) {
        result.fixedTollUpdates.push({
          id: mapping.fixedTollId,
          prices: bridge.prices,
        });
      }
    } else {
      const highway = parsed as ParsedHighwayPricing;
      const mapping = findMappingForFile(highway.fileName);
      const code = mapping?.otoyolCode || highway.name;

      // Build pricing matrix
      const pricingMap: Record<string, Record<VehicleClass, number>> = {};
      for (const entry of highway.matrix) {
        const fromId = normalizeStationName(entry.from);
        const toId = normalizeStationName(entry.to);
        const key = `${code.toLowerCase().replace(/[^a-z0-9]/g, "")}-${fromId}__${code.toLowerCase().replace(/[^a-z0-9]/g, "")}-${toId}`;
        pricingMap[key] = entry.prices;
      }

      result.otoyolPricing[code] = pricingMap;
      result.tollPlazaUpdates.push({
        otoyolCode: code,
        stations: highway.stations,
      });
    }
  }

  return result;
}

/**
 * Merge sync results into existing data.
 * Only updates entries that have new data; preserves existing data for
 * entries not covered by the parsed PDFs.
 */
export function mergeWithExistingData(
  syncResult: SyncResult,
  existingPricing: Record<string, Record<string, Record<VehicleClass, number>>>,
  existingFixedTolls: FixedToll[]
): {
  mergedPricing: Record<string, Record<string, Record<VehicleClass, number>>>;
  mergedFixedTolls: FixedToll[];
} {
  // Merge otoyol pricing
  const mergedPricing = { ...existingPricing };
  for (const [code, pricing] of Object.entries(syncResult.otoyolPricing)) {
    if (Object.keys(pricing).length > 0) {
      mergedPricing[code] = pricing;
    }
  }

  // Merge fixed toll prices
  const mergedFixedTolls = existingFixedTolls.map((toll) => {
    const update = syncResult.fixedTollUpdates.find((u) => u.id === toll.id);
    if (update) {
      return { ...toll, prices: update.prices };
    }
    return toll;
  });

  return { mergedPricing, mergedFixedTolls };
}
