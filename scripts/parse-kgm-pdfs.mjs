#!/usr/bin/env node

/**
 * KGM PDF Parser CLI Script
 *
 * Reads PDF files from data/kgm-pdfs/ directory,
 * parses toll data, and updates JSON files in data/.
 *
 * Usage: npm run sync-tolls
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

// --- PDF Mappings ---

const PDF_MAPPINGS = [
  { fileName: "1-15Temmuz-FSM.pdf", type: "bridge", name: "15 Temmuz / FSM Koprusu", fixedTollId: "15-temmuz-fsm-koprusu" },
  { fileName: "2-Osmangazi.pdf", type: "bridge", name: "Osmangazi Koprusu", fixedTollId: "osmangazi-koprusu" },
  { fileName: "3-YSSKoprusu.pdf", type: "bridge", name: "Yavuz Sultan Selim Koprusu", fixedTollId: "yavuz-sultan-selim-koprusu" },
  { fileName: "4-1915Canakkale.pdf", type: "bridge", name: "1915 Canakkale Koprusu", fixedTollId: "1915-canakkale-koprusu" },
  { fileName: "5-AnadoluOtoyoluCamlica-Akinci.pdf", type: "highway", name: "Anadolu Otoyolu", otoyolCode: "O-4" },
  { fileName: "6-Izmir-Cesme.pdf", type: "highway", name: "Izmir-Cesme Otoyolu", otoyolCode: "IZC" },
  { fileName: "7-Izmir-Aydin.pdf", type: "highway", name: "Izmir-Aydin Otoyolu", otoyolCode: "IZA" },
  { fileName: "8-CukurovaOtoyoluAdana-Gaziantep.pdf", type: "highway", name: "Cukurova (Adana-Gaziantep)", otoyolCode: "O-52" },
  { fileName: "9-CukurovaOtoyoluGaziantep-Sanliurfa.pdf", type: "highway", name: "Cukurova (Gaziantep-Sanliurfa)", otoyolCode: "GSO" },
  { fileName: "10-CukurovaOtoyoluNigde-Mersin-Adana.pdf", type: "highway", name: "Cukurova (Nigde-Mersin-Adana)", otoyolCode: "O-51" },
  { fileName: "11-AvrupaOtoyoluMahmutbey-Edirne.pdf", type: "highway", name: "Avrupa Otoyolu (Mahmutbey-Edirne)", otoyolCode: "O-3" },
  { fileName: "12-Gebze-Orhangazi-Izmir.pdf", type: "highway", name: "Gebze-Orhangazi-Izmir Otoyolu", otoyolCode: "O-5" },
  { fileName: "13-YSSKuzeyCevreYolu.pdf", type: "highway", name: "YSS Kuzey Cevre Yolu", otoyolCode: "KCY" },
  { fileName: "14-KMOAvrupaKinali-Odayeri.pdf", type: "highway", name: "KMO Avrupa (Kinali-Odayeri)", otoyolCode: "KMO-AV" },
  { fileName: "15-KMOAnadoluKurtkoy-Akyazi.pdf", type: "highway", name: "KMO Anadolu (Kurtkoy-Akyazi)", otoyolCode: "KMO-AN" },
  { fileName: "16-Menemen-Aliaga-Candarli.pdf", type: "highway", name: "Menemen-Aliaga-Candarli", otoyolCode: "MAC" },
  { fileName: "17-Ankara-Nigde.pdf", type: "highway", name: "Ankara-Nigde Otoyolu", otoyolCode: "ANO" },
  { fileName: "18-Malkara-Canakkale.pdf", type: "highway", name: "Malkara-Canakkale Otoyolu", otoyolCode: "MCO" },
  { fileName: "19-Aydin-Denizli.pdf", type: "highway", name: "Aydin-Denizli Otoyolu", otoyolCode: "ADO" },
];

// --- Utility functions ---

function parseTurkishNumber(str) {
  if (!str || str === "-" || str === "–") return 0;
  let cleaned = str.replace(/[\s₺TL]/g, "").trim();
  cleaned = cleaned.replace(/\./g, "");
  cleaned = cleaned.replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function normalizeStationName(name) {
  return name
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/Ğ/g, "g").replace(/Ü/g, "u").replace(/Ş/g, "s")
    .replace(/İ/g, "i").replace(/Ö/g, "o").replace(/Ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function isVehicleClass(str) {
  return /^[1-6]$/.test(str.trim());
}

function isPriceValue(str) {
  return /^\d[\d.,]*\s*(₺|TL)?$/.test(str.trim());
}

function isStationRow(cells) {
  if (cells.length === 0) return false;
  const first = cells[0].trim();
  if (first.length <= 1) return false;
  if (isVehicleClass(first)) return false;
  if (/^[\d.,]+\s*km$/.test(first)) return false;
  if (/^[\d.,₺TL\s]+$/.test(first)) return false;
  if (/^(İSTASYON|ISTASYON|SINIF|ARAÇ|ARAC|Not:|Ücretlere)/i.test(first)) return false;
  return /[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(first);
}

function reconstructTable(items, rowTolerance = 3) {
  if (items.length === 0) return [];
  const sorted = [...items].sort((a, b) => {
    if (Math.abs(a.y - b.y) > rowTolerance) return b.y - a.y;
    return a.x - b.x;
  });
  const rows = [];
  let currentRow = [];
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

function findMapping(fileName) {
  return PDF_MAPPINGS.find(m => m.fileName.toLowerCase() === fileName.toLowerCase());
}

// --- Bridge parser ---

function parseBridgePdf(rows, mapping) {
  const prices = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, moto: 0 };

  for (const row of rows) {
    if (row.length < 2) continue;
    let classNum = "";
    let classIdx = -1;
    for (let i = 0; i < row.length; i++) {
      if (isVehicleClass(row[i])) { classNum = row[i].trim(); classIdx = i; break; }
    }
    if (!classNum || classIdx === -1) continue;

    let maxPrice = 0;
    for (let i = classIdx + 1; i < row.length; i++) {
      const val = parseTurkishNumber(row[i]);
      if (val > maxPrice) maxPrice = val;
    }
    if (maxPrice > 0) {
      prices[classNum === "6" ? "moto" : classNum] = maxPrice;
    }
  }

  return { type: mapping.type, name: mapping.name, fileName: mapping.fileName, prices };
}

// --- Highway parser (two-pass approach) ---

function parseHighwayPdf(rows, mapping) {
  // Pass 1: Find all class rows
  const classRowIndices = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.length >= 2 && isVehicleClass(row[0])) {
      classRowIndices.push(i);
    }
    if (row.length >= 3 && row.some(c => isVehicleClass(c)) && isStationRow(row)) {
      classRowIndices.push(i);
    }
  }

  // Pass 2: Group consecutive class rows into station blocks
  function findStationName(firstClassIdx) {
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
        return nameParts.join(" ").trim();
      }
    }
    // Check inline station name
    const firstRow = rows[firstClassIdx];
    if (firstRow.length >= 3 && isStationRow(firstRow)) {
      return firstRow.filter(c => !isVehicleClass(c) && !isPriceValue(c) && !/^\d[\d.,]*\s*km$/i.test(c)).join(" ").trim();
    }
    return "";
  }

  function processBlock(indices) {
    const firstClassIdx = indices[0];
    const stationName = findStationName(firstClassIdx);
    if (!stationName) return null;

    const classRows = new Map();
    for (const rowIdx of indices) {
      const row = rows[rowIdx];
      let classNum = "", priceStart = 0;
      for (let j = 0; j < row.length; j++) {
        if (isVehicleClass(row[j])) { classNum = row[j].trim(); priceStart = j + 1; break; }
      }
      if (classNum) {
        classRows.set(classNum, row.slice(priceStart).map(parseTurkishNumber).filter(v => v > 0));
      }
    }
    return classRows.size > 0 ? { name: stationName, classRows } : null;
  }

  const stationBlocks = [];
  let blockStart = 0;
  for (let ci = 0; ci <= classRowIndices.length; ci++) {
    const isEnd = ci === classRowIndices.length;
    const isGap = !isEnd && ci > 0 && classRowIndices[ci] - classRowIndices[ci - 1] > 1;

    if ((isEnd || isGap) && ci > blockStart) {
      const block = processBlock(classRowIndices.slice(blockStart, ci));
      if (block) stationBlocks.push(block);
      blockStart = ci;
    }
    if (isGap) blockStart = ci;
  }
  // Handle remaining
  if (blockStart < classRowIndices.length) {
    const block = processBlock(classRowIndices.slice(blockStart));
    if (block) stationBlocks.push(block);
  }

  // Detect full matrix
  let exitStationNames = [];
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const joined = rows[i].join(" ").toUpperCase();
    if (joined.includes("İSTASYON") || joined.includes("SINIF")) {
      for (let j = i + 1; j <= i + 2 && j < rows.length; j++) {
        const tc = rows[j].filter(c => c.trim().length > 1 && /[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(c) && !/^\d/.test(c.trim()) && !/(İSTASYON|SINIF|ARAÇ|ÇIKIŞ)/i.test(c));
        if (tc.length >= 3) { exitStationNames = tc.map(s => s.trim()); break; }
      }
      break;
    }
  }

  const isFullMatrix = exitStationNames.length >= 3 && stationBlocks.length > 0 && (() => {
    const fb = stationBlocks[0];
    const fp = fb.classRows.get("1") || fb.classRows.values().next().value;
    return fp && Math.abs(fp.length - exitStationNames.length) <= 2;
  })();

  // For full matrix, re-group by class "1" starts
  let finalBlocks = stationBlocks;
  if (isFullMatrix) {
    finalBlocks = [];
    const classOneIndices = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.length >= 2) {
        if (row[0].trim() === "1" && row.length >= 3) classOneIndices.push(i);
        else if (row.length >= 3 && row[1]?.trim() === "1" && isStationRow(row)) classOneIndices.push(i);
      }
    }
    for (let gi = 0; gi < classOneIndices.length; gi++) {
      const startIdx = classOneIndices[gi];
      const endIdx = gi + 1 < classOneIndices.length ? classOneIndices[gi + 1] : rows.length;
      const block = { name: "", classRows: new Map() };
      for (let ri = startIdx; ri < endIdx; ri++) {
        const row = rows[ri];
        if (!row || row.length === 0) continue;
        let classNum = "", priceStart = 0;
        for (let j = 0; j < row.length; j++) {
          if (isVehicleClass(row[j])) { classNum = row[j].trim(); priceStart = j + 1; break; }
        }
        if (classNum) {
          const prices = row.slice(priceStart).map(parseTurkishNumber).filter(v => v > 0);
          if (prices.length > 0) block.classRows.set(classNum, prices);
          for (let j = 0; j < row.indexOf(classNum); j++) {
            const cell = row[j].trim();
            if (cell.length > 1 && /[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(cell) && !isPriceValue(cell) && !/^\(G\d/.test(cell)) {
              block.name = block.name ? block.name + " " + cell : cell;
            }
          }
        } else {
          const tp = row.filter(c => c.trim().length > 1 && /[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(c) && !isPriceValue(c) && !/^\d[\d.,]*\s*km$/i.test(c) && !/^(Not:|Ücretlere)/i.test(c));
          if (tp.length > 0 && !block.name) block.name = tp.join(" ").trim();
        }
      }
      if (!block.name) {
        for (let lb = startIdx - 1; lb >= Math.max(0, startIdx - 2); lb--) {
          const c = rows[lb];
          if (!c) continue;
          const p = c.filter(x => x.trim().length > 1 && /[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(x) && !/^\d/.test(x.trim()) && !/(İSTASYON|SINIF|ARAÇ|ÇIKIŞ)/i.test(x));
          if (p.length > 0) { block.name = p.join(" ").trim(); break; }
        }
      }
      if (block.name && block.classRows.size > 0) finalBlocks.push(block);
    }
  }

  const stations = isFullMatrix ? exitStationNames : finalBlocks.map(b => b.name);
  const matrix = [];

  function addEntry(from, to, vc, price) {
    const fid = normalizeStationName(from), tid = normalizeStationName(to);
    if (fid === tid) return;
    const key = `${fid}__${tid}`;
    let entry = matrix.find(e => normalizeStationName(e.from) + "__" + normalizeStationName(e.to) === key);
    if (!entry) { entry = { from, to, prices: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, moto: 0 } }; matrix.push(entry); }
    entry.prices[vc] = price;
  }

  if (isFullMatrix) {
    for (const block of finalBlocks) {
      for (const [cs, pv] of block.classRows) {
        const vc = cs === "6" ? "moto" : (/^[1-5]$/.test(cs) ? cs : null);
        if (!vc) continue;
        for (let ci = 0; ci < Math.min(pv.length, exitStationNames.length); ci++) {
          if (pv[ci] > 0) addEntry(block.name, exitStationNames[ci], vc, pv[ci]);
        }
      }
    }
  } else {
    for (let si = 0; si < finalBlocks.length; si++) {
      const block = finalBlocks[si];
      for (const [cs, pv] of block.classRows) {
        const vc = cs === "6" ? "moto" : (/^[1-5]$/.test(cs) ? cs : null);
        if (!vc) continue;
        for (let di = 0; di < Math.min(pv.length, si); di++) {
          if (pv[di] > 0) addEntry(block.name, stations[di], vc, pv[di]);
        }
      }
    }
  }

  return { type: "highway", name: mapping.name, fileName: mapping.fileName, stations, matrix };
}

// --- PDF extraction ---

async function extractTextItems(pdfPath) {
  const data = new Uint8Array(readFileSync(pdfPath));
  const pdf = await getDocument({ data, useSystemFonts: true }).promise;
  const allItems = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    for (const item of textContent.items) {
      if ("str" in item) {
        allItems.push({
          str: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width,
          height: item.height,
        });
      }
    }
  }
  return allItems;
}

// --- Main ---

async function main() {
  const rootDir = join(import.meta.dirname, "..");
  const pdfDir = join(rootDir, "data", "kgm-pdfs");
  const dataDir = join(rootDir, "data");

  if (!existsSync(pdfDir)) {
    console.error("data/kgm-pdfs/ klasoru bulunamadi.");
    process.exit(1);
  }

  const pdfFiles = readdirSync(pdfDir).filter(f => f.toLowerCase().endsWith(".pdf"));
  if (pdfFiles.length === 0) {
    console.error("data/kgm-pdfs/ klasorunde PDF bulunamadi.");
    process.exit(1);
  }

  console.log(`${pdfFiles.length} PDF dosyasi bulundu.\n`);

  const results = [];
  const errors = [];

  for (const fileName of pdfFiles.sort()) {
    const filePath = join(pdfDir, fileName);
    const mapping = findMapping(fileName);

    if (!mapping) {
      console.log(`  [UYARI] ${fileName}: Eslestirme bulunamadi, atlanıyor.`);
      errors.push(`${fileName}: Eslestirme bulunamadi`);
      continue;
    }

    try {
      process.stdout.write(`  ${fileName} (${mapping.name})... `);
      const items = await extractTextItems(filePath);
      const rows = reconstructTable(items);

      let result;
      if (mapping.type === "bridge" || mapping.type === "tunnel") {
        result = parseBridgePdf(rows, mapping);
        const hasData = Object.values(result.prices).some(v => v > 0);
        console.log(hasData ?
          `OK [${Object.entries(result.prices).map(([k,v]) => `${k}:${v}`).join(", ")}]` :
          "UYARI: Fiyat bulunamadi");
      } else {
        result = parseHighwayPdf(rows, mapping);
        console.log(`OK [${result.stations.length} istasyon, ${result.matrix.length} guzergah]`);
      }

      results.push(result);
    } catch (err) {
      console.log(`HATA: ${err.message}`);
      errors.push(`${fileName}: ${err.message}`);
    }
  }

  if (results.length === 0) {
    console.error("\nHicbir PDF basariyla parse edilemedi.");
    process.exit(1);
  }

  // Load existing data
  const existingPricing = JSON.parse(readFileSync(join(dataDir, "otoyol-pricing.json"), "utf-8"));
  const existingFixed = JSON.parse(readFileSync(join(dataDir, "fixed-tolls.json"), "utf-8"));

  // Build new pricing
  const mergedPricing = { ...existingPricing };
  for (const result of results) {
    if (result.type === "highway") {
      const mapping = findMapping(result.fileName);
      const code = mapping?.otoyolCode || result.name;
      const pricingMap = {};
      for (const entry of result.matrix) {
        const fromId = normalizeStationName(entry.from);
        const toId = normalizeStationName(entry.to);
        const prefix = code.toLowerCase().replace(/[^a-z0-9]/g, "");
        pricingMap[`${prefix}-${fromId}__${prefix}-${toId}`] = entry.prices;
      }
      if (Object.keys(pricingMap).length > 0) {
        mergedPricing[code] = pricingMap;
      }
    }
  }

  // Update fixed tolls
  const mergedFixed = existingFixed.map(toll => {
    for (const result of results) {
      if (result.type === "bridge" || result.type === "tunnel") {
        const mapping = findMapping(result.fileName);
        if (mapping?.fixedTollId === toll.id) {
          return { ...toll, prices: result.prices };
        }
      }
    }
    return toll;
  });

  // Write output
  writeFileSync(join(dataDir, "otoyol-pricing.json"), JSON.stringify(mergedPricing, null, 2) + "\n");
  writeFileSync(join(dataDir, "fixed-tolls.json"), JSON.stringify(mergedFixed, null, 2) + "\n");

  console.log("\n--- Sonuc ---");
  console.log(`Basarili: ${results.length}`);
  console.log(`Hata: ${errors.length}`);
  console.log(`\nGuncellenen: data/otoyol-pricing.json, data/fixed-tolls.json`);
  if (errors.length > 0) {
    console.log(`\nHatalar:`);
    errors.forEach(e => console.log(`  - ${e}`));
  }
  console.log("\nTamamlandi!");
}

main().catch(err => {
  console.error("Beklenmeyen hata:", err);
  process.exit(1);
});
