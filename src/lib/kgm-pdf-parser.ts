/**
 * KGM PDF Parser
 *
 * KGM (Karayollari Genel Mudurlugu) otoyol ve kopru ucret PDF'lerini
 * parse edip yapilandirilmis veri olarak dondurur.
 *
 * PDF Turleri:
 * 1. Kopru: Basit tablo - arac sinifi (1-6) -> ucret
 * 2. Otoyol Matrisi: Alt ucgen matris - her istasyon onceki istasyonlara fiyat listeler
 *    Son deger "max ucret" (giris bilgisi yoksa alinan ucret) olarak atlanir.
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
  fixedTollId?: string;
  otoyolCode?: string;
}

export const PDF_MAPPINGS: PdfMapping[] = [
  { fileName: "1-15Temmuz-FSM.pdf", type: "bridge", name: "15 Temmuz / FSM Koprusu", fixedTollId: "15-temmuz-fsm-koprusu" },
  { fileName: "2-Osmangazi.pdf", type: "bridge", name: "Osmangazi Koprusu", fixedTollId: "osmangazi-koprusu" },
  { fileName: "3-YSSKoprusu.pdf", type: "bridge", name: "Yavuz Sultan Selim Koprusu", fixedTollId: "yavuz-sultan-selim-koprusu" },
  { fileName: "4-1915Canakkale.pdf", type: "bridge", name: "1915 Canakkale Koprusu", fixedTollId: "1915-canakkale-koprusu" },
  { fileName: "5-AnadoluOtoyoluCamlica-Akinci.pdf", type: "highway", name: "Anadolu Otoyolu (Camlica-Akinci)", otoyolCode: "O-4" },
  { fileName: "6-Izmir-Cesme.pdf", type: "highway", name: "Izmir-Cesme Otoyolu", otoyolCode: "IZC" },
  { fileName: "7-Izmir-Aydin.pdf", type: "highway", name: "Izmir-Aydin Otoyolu", otoyolCode: "IZA" },
  { fileName: "8-CukurovaOtoyoluAdana-Gaziantep.pdf", type: "highway", name: "Cukurova Otoyolu (Adana-Gaziantep)", otoyolCode: "O-52" },
  { fileName: "9-CukurovaOtoyoluGaziantep-Sanliurfa.pdf", type: "highway", name: "Cukurova Otoyolu (Gaziantep-Sanliurfa)", otoyolCode: "GSO" },
  { fileName: "10-CukurovaOtoyoluNigde-Mersin-Adana.pdf", type: "highway", name: "Cukurova Otoyolu (Nigde-Mersin-Adana)", otoyolCode: "O-51" },
  { fileName: "11-AvrupaOtoyoluMahmutbey-Edirne.pdf", type: "highway", name: "Avrupa Otoyolu (Mahmutbey-Edirne)", otoyolCode: "O-3" },
  { fileName: "12-Gebze-Orhangazi-Izmir.pdf", type: "highway", name: "Gebze-Orhangazi-Izmir Otoyolu", otoyolCode: "O-5" },
  { fileName: "13-YSSKuzeyCevreYolu.pdf", type: "highway", name: "YSS Kuzey Cevre Yolu", otoyolCode: "KCY" },
  { fileName: "14-KMOAvrupaKinali-Odayeri.pdf", type: "highway", name: "KMO Avrupa (Kinali-Odayeri)", otoyolCode: "KMO-AV" },
  { fileName: "15-KMOAnadoluKurtkoy-Akyazi.pdf", type: "highway", name: "KMO Anadolu (Kurtkoy-Akyazi)", otoyolCode: "KMO-AN" },
  { fileName: "16-Menemen-Aliaga-Candarli.pdf", type: "highway", name: "Menemen-Aliaga-Candarli Otoyolu", otoyolCode: "MAC" },
  { fileName: "17-Ankara-Nigde.pdf", type: "highway", name: "Ankara-Nigde Otoyolu", otoyolCode: "ANO" },
  { fileName: "18-Malkara-Canakkale.pdf", type: "highway", name: "Malkara-Canakkale Otoyolu", otoyolCode: "MCO" },
  { fileName: "19-Aydin-Denizli.pdf", type: "highway", name: "Aydin-Denizli Otoyolu", otoyolCode: "ADO" },
];

// --- Utility functions ---

/** Parse Turkish number format: "1.590,00" -> 1590, "45,00" -> 45 */
export function parseTurkishNumber(str: string): number {
  if (!str || str === "-" || str === "–") return 0;
  let cleaned = str.replace(/[\s₺TL]/g, "").trim();
  // Remove thousand-separator dots (but keep decimal commas)
  cleaned = cleaned.replace(/\./g, "");
  cleaned = cleaned.replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/** Check if string looks like a price value */
function isPriceValue(str: string): boolean {
  return /^\d[\d.,]*\s*(₺|TL)?$/.test(str.trim());
}

/** Check if a string is a vehicle class (1-6) */
function isVehicleClass(str: string): boolean {
  return /^[1-6]$/.test(str.trim());
}

/** Check if a row looks like a station name row (with optional km distances) */
function isStationRow(cells: string[]): boolean {
  if (cells.length === 0) return false;
  const first = cells[0].trim();
  // Station name: not a number, not a class, has letters, length > 1
  if (first.length <= 1) return false;
  if (isVehicleClass(first)) return false;
  if (/^[\d.,]+\s*km$/.test(first)) return false;
  if (/^[\d.,₺TL\s]+$/.test(first)) return false;
  if (/^(İSTASYON|ISTASYON|SINIF|ARAÇ|ARAC|Not:|Ücretlere)/i.test(first)) return false;
  // Must contain at least one letter
  return /[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(first);
}

/** Normalize station name for ID generation */
export function normalizeStationName(name: string): string {
  return name
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/Ğ/g, "g").replace(/Ü/g, "u").replace(/Ş/g, "s")
    .replace(/İ/g, "i").replace(/Ö/g, "o").replace(/Ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
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
 * Reconstruct rows from positioned text items.
 * Groups items by approximate y-position, sorts by x within each row.
 * Filters out empty strings.
 */
export function reconstructTable(
  items: TextItem[],
  rowTolerance = 3
): string[][] {
  if (items.length === 0) return [];

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

/**
 * Bridge PDFs have simple structure:
 *   ARAÇ SINIFI | ÜCRET
 *   1           | 995,00 ₺
 *   2           | 1.590,00 ₺
 *   ...
 *   6           | 695,00 ₺   (motosiklet)
 *
 * Some PDFs (like FSM) have extra columns. We take the LARGEST
 * numeric value per class row as the toll price.
 */
export function parseBridgePdf(
  rows: string[][],
  mapping: PdfMapping
): ParsedBridgeToll {
  const prices: Record<string, number> = {
    "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, moto: 0,
  };

  for (const row of rows) {
    if (row.length < 2) continue;

    // Find class number in the row
    let classNum = "";
    let classIdx = -1;
    for (let i = 0; i < row.length; i++) {
      if (isVehicleClass(row[i])) {
        classNum = row[i].trim();
        classIdx = i;
        break;
      }
    }
    if (!classNum || classIdx === -1) continue;

    // Find the largest price value in the row (after the class number)
    let maxPrice = 0;
    for (let i = classIdx + 1; i < row.length; i++) {
      const val = parseTurkishNumber(row[i]);
      if (val > maxPrice) maxPrice = val;
    }

    if (maxPrice > 0) {
      const key = classNum === "6" ? "moto" : classNum;
      prices[key] = maxPrice;
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
 * Two formats exist:
 *
 * A) LOWER-TRIANGULAR (most KGM PDFs): Each station lists prices only to previous stations.
 *    Station at position N has N prices + 1 max fare.
 *
 * B) FULL MATRIX (YSS, KMO PDFs): Each station lists prices to ALL exit stations.
 *    Has a column header row with all exit station names.
 *    Station names appear inline with class rows (usually on class 3).
 *
 * Uses two-pass approach to avoid title/header rows being mistaken for stations:
 *
 * Pass 1: Find all class rows (rows starting with vehicle class 1-6)
 * Pass 2: Group consecutive class rows into blocks, look backward for station name
 *
 * Station at position N has N prices to previous stations + 1 max fare (last value).
 */
export function parseHighwayPdf(
  rows: string[][],
  mapping: PdfMapping
): ParsedHighwayPricing {
  // Pass 1: Mark all class rows
  const classRowIndices: number[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.length >= 2 && isVehicleClass(row[0])) {
      classRowIndices.push(i);
    }
    // Also handle station+class on same line: e.g. ["(GÜZELBAHÇE)", "1", "53,00"]
    if (row.length >= 3 && row.some(c => isVehicleClass(c)) && isStationRow(row)) {
      classRowIndices.push(i);
    }
  }

  // Pass 2: Group consecutive class rows into station blocks
  // A gap between class row indices indicates a new station block
  const stationBlocks: Array<{
    name: string;
    classRows: Map<string, number[]>;
  }> = [];

  let blockStart = 0;
  for (let ci = 0; ci <= classRowIndices.length; ci++) {
    const isEnd = ci === classRowIndices.length;
    const isGap = !isEnd && ci > 0 && classRowIndices[ci] - classRowIndices[ci - 1] > 1;

    if ((isEnd || isGap) && ci > blockStart) {
      // Process block from blockStart to ci-1
      const blockIndices = classRowIndices.slice(blockStart, ci);
      const firstClassIdx = blockIndices[0];

      // Find station name by looking backward from first class row
      let stationName = "";
      for (let lookback = firstClassIdx - 1; lookback >= Math.max(0, firstClassIdx - 3); lookback--) {
        const candidate = rows[lookback];
        if (!candidate || candidate.length === 0) continue;
        // Skip if it's also a class row
        if (candidate.length >= 2 && isVehicleClass(candidate[0])) continue;
        // Filter out km distances and get station name
        const nameParts = candidate.filter(c =>
          !/^\d[\d.,]*\s*km$/i.test(c.trim()) &&
          !/^(İSTASYON|ISTASYON|SINIF|ARAÇ|ARAC)/i.test(c.trim()) &&
          c.trim().length > 0
        );
        if (nameParts.length > 0 && /[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(nameParts[0])) {
          stationName = nameParts.join(" ").trim();
          break;
        }
      }

      // Also check if first class row has station name inline
      const firstRow = rows[firstClassIdx];
      if (!stationName && firstRow.length >= 3 && isStationRow(firstRow)) {
        const parts = firstRow.filter(c =>
          !isVehicleClass(c) && !isPriceValue(c) && !/^\d[\d.,]*\s*km$/i.test(c)
        );
        stationName = parts.join(" ").trim();
      }

      if (stationName) {
        const block = { name: stationName, classRows: new Map<string, number[]>() };

        for (const rowIdx of blockIndices) {
          const row = rows[rowIdx];
          // Find the class number and prices
          let classNum = "";
          let priceStart = 0;
          for (let j = 0; j < row.length; j++) {
            if (isVehicleClass(row[j])) {
              classNum = row[j].trim();
              priceStart = j + 1;
              break;
            }
          }
          if (classNum) {
            const prices = row.slice(priceStart).map(parseTurkishNumber).filter(v => v > 0);
            block.classRows.set(classNum, prices);
          }
        }

        if (block.classRows.size > 0) {
          stationBlocks.push(block);
        }
      }

      blockStart = ci;
    }

    if (isGap) {
      blockStart = ci;
    }
  }

  // Handle last block
  if (blockStart < classRowIndices.length) {
    const blockIndices = classRowIndices.slice(blockStart);
    const firstClassIdx = blockIndices[0];
    let stationName = "";
    for (let lookback = firstClassIdx - 1; lookback >= Math.max(0, firstClassIdx - 3); lookback--) {
      const candidate = rows[lookback];
      if (!candidate || candidate.length === 0) continue;
      if (candidate.length >= 2 && isVehicleClass(candidate[0])) continue;
      const nameParts = candidate.filter(c =>
        !/^\d[\d.,]*\s*km$/i.test(c.trim()) &&
        !/^(İSTASYON|ISTASYON|SINIF|ARAÇ|ARAC)/i.test(c.trim()) &&
        c.trim().length > 0
      );
      if (nameParts.length > 0 && /[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(nameParts[0])) {
        stationName = nameParts.join(" ").trim();
        break;
      }
    }
    const firstRow = rows[firstClassIdx];
    if (!stationName && firstRow.length >= 3 && isStationRow(firstRow)) {
      const parts = firstRow.filter(c =>
        !isVehicleClass(c) && !isPriceValue(c) && !/^\d[\d.,]*\s*km$/i.test(c)
      );
      stationName = parts.join(" ").trim();
    }
    if (stationName) {
      const block = { name: stationName, classRows: new Map<string, number[]>() };
      for (const rowIdx of blockIndices) {
        const row = rows[rowIdx];
        let classNum = "";
        let priceStart = 0;
        for (let j = 0; j < row.length; j++) {
          if (isVehicleClass(row[j])) { classNum = row[j].trim(); priceStart = j + 1; break; }
        }
        if (classNum) {
          const prices = row.slice(priceStart).map(parseTurkishNumber).filter(v => v > 0);
          block.classRows.set(classNum, prices);
        }
      }
      if (block.classRows.size > 0) stationBlocks.push(block);
    }
  }

  // Step 3: Detect full-matrix format
  // Full matrix PDFs have column headers with exit station names
  let exitStationNames: string[] = [];
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    const joined = row.join(" ").toUpperCase();
    if (joined.includes("İSTASYON") || joined.includes("SINIF")) {
      for (let j = i + 1; j <= i + 2 && j < rows.length; j++) {
        const headerRow = rows[j];
        const textCells = headerRow.filter(c =>
          c.trim().length > 1 && /[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(c) &&
          !/^\d/.test(c.trim()) && !/(İSTASYON|SINIF|ARAÇ|ÇIKIŞ)/i.test(c)
        );
        if (textCells.length >= 3) { exitStationNames = textCells.map(s => s.trim()); break; }
      }
      break;
    }
  }

  // Full matrix: first block has ~exitStationNames.length prices per class
  const isFullMatrix = exitStationNames.length >= 3 && stationBlocks.length > 0 && (() => {
    const fb = stationBlocks[0];
    const fp = fb.classRows.get("1") || fb.classRows.values().next().value;
    return fp && Math.abs(fp.length - exitStationNames.length) <= 2;
  })();

  // Step 4: For full matrix, re-build station blocks by grouping class "1" occurrences
  let finalBlocks = stationBlocks;
  if (isFullMatrix) {
    // Re-scan rows: group by class "1" starts
    finalBlocks = [];
    const classOneIndices: number[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.length >= 2) {
        // Check if class 1 row: first cell is "1" or second cell is "1" (with station name)
        if (row[0].trim() === "1" && row.length >= 3) classOneIndices.push(i);
        else if (row.length >= 3 && row[1]?.trim() === "1" && isStationRow(row)) classOneIndices.push(i);
      }
    }

    for (let gi = 0; gi < classOneIndices.length; gi++) {
      const startIdx = classOneIndices[gi];
      const endIdx = gi + 1 < classOneIndices.length ? classOneIndices[gi + 1] : rows.length;

      // Collect class data and station name from this range
      const block = { name: "", classRows: new Map<string, number[]>() };

      for (let ri = startIdx; ri < endIdx; ri++) {
        const row = rows[ri];
        if (row.length === 0) continue;

        // Find class number in this row
        let classNum = "";
        let priceStart = 0;
        for (let j = 0; j < row.length; j++) {
          if (isVehicleClass(row[j])) { classNum = row[j].trim(); priceStart = j + 1; break; }
        }

        if (classNum) {
          const prices = row.slice(priceStart).map(parseTurkishNumber).filter(v => v > 0);
          if (prices.length > 0) block.classRows.set(classNum, prices);

          // Check for inline station name (text before class number)
          for (let j = 0; j < row.indexOf(classNum); j++) {
            const cell = row[j].trim();
            if (cell.length > 1 && /[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(cell) &&
                !isPriceValue(cell) && !/^\(G\d/.test(cell)) {
              if (!block.name) block.name = cell;
              else block.name += " " + cell;
            }
          }
        } else {
          // Non-class row: could be station name
          const textParts = row.filter(c =>
            c.trim().length > 1 && /[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(c) &&
            !isPriceValue(c) && !/^\d[\d.,]*\s*km$/i.test(c) &&
            !/^(Not:|Ücretlere)/i.test(c)
          );
          if (textParts.length > 0 && !block.name) {
            block.name = textParts.join(" ").trim();
          }
        }
      }

      // Also look backward from startIdx for station name
      if (!block.name) {
        for (let lb = startIdx - 1; lb >= Math.max(0, startIdx - 2); lb--) {
          const candidate = rows[lb];
          if (!candidate) continue;
          const parts = candidate.filter(c =>
            c.trim().length > 1 && /[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(c) &&
            !/^\d/.test(c.trim()) && !/(İSTASYON|SINIF|ARAÇ|ÇIKIŞ)/i.test(c)
          );
          if (parts.length > 0) { block.name = parts.join(" ").trim(); break; }
        }
      }

      if (block.name && block.classRows.size > 0) finalBlocks.push(block);
    }
  }

  // Step 5: Build station list and price matrix
  const stations = isFullMatrix ? exitStationNames : finalBlocks.map(b => b.name);
  const matrix: HighwayPriceEntry[] = [];

  function addEntry(from: string, to: string, vc: VehicleClass, price: number) {
    const fromId = normalizeStationName(from);
    const toId = normalizeStationName(to);
    if (fromId === toId) return; // skip self
    const key = `${fromId}__${toId}`;
    let entry = matrix.find(e => normalizeStationName(e.from) + "__" + normalizeStationName(e.to) === key);
    if (!entry) {
      entry = { from, to, prices: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, moto: 0 } };
      matrix.push(entry);
    }
    entry.prices[vc] = price;
  }

  if (isFullMatrix) {
    for (const block of finalBlocks) {
      for (const [classStr, priceValues] of block.classRows) {
        const vc: VehicleClass | null = classStr === "6" ? "moto" : /^[1-5]$/.test(classStr) ? (classStr as VehicleClass) : null;
        if (!vc) continue;
        for (let colIdx = 0; colIdx < Math.min(priceValues.length, exitStationNames.length); colIdx++) {
          if (priceValues[colIdx] > 0) addEntry(block.name, exitStationNames[colIdx], vc, priceValues[colIdx]);
        }
      }
    }
  } else {
    for (let stIdx = 0; stIdx < finalBlocks.length; stIdx++) {
      const block = finalBlocks[stIdx];
      for (const [classStr, priceValues] of block.classRows) {
        const vc: VehicleClass | null = classStr === "6" ? "moto" : /^[1-5]$/.test(classStr) ? (classStr as VehicleClass) : null;
        if (!vc) continue;
        const pricesToPrev = priceValues.slice(0, stIdx);
        for (let destIdx = 0; destIdx < pricesToPrev.length; destIdx++) {
          if (pricesToPrev[destIdx] > 0) addEntry(block.name, stations[destIdx], vc, pricesToPrev[destIdx]);
        }
      }
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
    // Auto-detect type
    const allText = rows.flat().join(" ").toUpperCase();
    const isBridge = (allText.includes("KÖPRÜ") || allText.includes("KOPRU")) &&
      rows.some(r => r.length <= 4 && r.some(c => isVehicleClass(c)));
    const defaultMapping: PdfMapping = {
      fileName,
      type: isBridge ? "bridge" : "highway",
      name: fileName.replace(/\.pdf$/i, "").replace(/^\d+-/, ""),
    };
    if (isBridge) return parseBridgePdf(rows, defaultMapping);
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
  fixedTollUpdates: Array<{ id: string; prices: Record<VehicleClass, number> }>;
  tollPlazaUpdates: Array<{ otoyolCode: string; stations: string[] }>;
  parsedFiles: ParsedPdfResult[];
  errors: string[];
}

export function generateSyncResult(parsedResults: ParsedPdfResult[]): SyncResult {
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
        result.fixedTollUpdates.push({ id: mapping.fixedTollId, prices: bridge.prices });
      }
    } else {
      const highway = parsed as ParsedHighwayPricing;
      const mapping = findMappingForFile(highway.fileName);
      const code = mapping?.otoyolCode || highway.name;

      const pricingMap: Record<string, Record<VehicleClass, number>> = {};
      for (const entry of highway.matrix) {
        const fromId = normalizeStationName(entry.from);
        const toId = normalizeStationName(entry.to);
        const prefix = code.toLowerCase().replace(/[^a-z0-9]/g, "");
        pricingMap[`${prefix}-${fromId}__${prefix}-${toId}`] = entry.prices;
      }

      result.otoyolPricing[code] = pricingMap;
      result.tollPlazaUpdates.push({ otoyolCode: code, stations: highway.stations });
    }
  }

  return result;
}

export function mergeWithExistingData(
  syncResult: SyncResult,
  existingPricing: Record<string, Record<string, Record<VehicleClass, number>>>,
  existingFixedTolls: FixedToll[]
): {
  mergedPricing: Record<string, Record<string, Record<VehicleClass, number>>>;
  mergedFixedTolls: FixedToll[];
} {
  const mergedPricing = { ...existingPricing };
  for (const [code, pricing] of Object.entries(syncResult.otoyolPricing)) {
    if (Object.keys(pricing).length > 0) {
      mergedPricing[code] = pricing;
    }
  }

  const mergedFixedTolls = existingFixedTolls.map((toll) => {
    const update = syncResult.fixedTollUpdates.find((u) => u.id === toll.id);
    return update ? { ...toll, prices: update.prices } : toll;
  });

  return { mergedPricing, mergedFixedTolls };
}
