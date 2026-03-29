#!/usr/bin/env node

/**
 * KGM PDF Parser CLI Script
 *
 * Reads PDF files from data/kgm-pdfs/ directory,
 * parses toll data, and updates JSON files in data/.
 *
 * Usage: node scripts/parse-kgm-pdfs.mjs
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join, basename } from "path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

// --- Inline parser logic (adapted from src/lib/kgm-pdf-parser.ts) ---

const PDF_MAPPINGS = [
  { fileName: "1-15Temmuz-FSM.pdf", type: "bridge", name: "15 Temmuz / FSM Koprusu", fixedTollId: "15-temmuz-fsm-koprusu" },
  { fileName: "2-Osmangazi.pdf", type: "bridge", name: "Osmangazi Koprusu", fixedTollId: "osmangazi-koprusu" },
  { fileName: "4-1915Canakkale.pdf", type: "bridge", name: "1915 Canakkale Koprusu", fixedTollId: "1915-canakkale-koprusu" },
  { fileName: "5-AnadoluOtoyoluCamlica-Akinci.pdf", type: "highway", name: "Anadolu Otoyolu (Camlica-Akinci)", otoyolCode: "O-4" },
  { fileName: "7-Izmir-Aydin.pdf", type: "highway", name: "Izmir-Aydin Otoyolu", otoyolCode: "IZA" },
  { fileName: "11-AvrupaOtoyoluMahmutbey-Edirne.pdf", type: "highway", name: "Avrupa Otoyolu (Mahmutbey-Edirne)", otoyolCode: "O-3" },
  { fileName: "12-Gebze-Orhangazi-Izmir.pdf", type: "highway", name: "Gebze-Orhangazi-Izmir Otoyolu", otoyolCode: "O-5" },
  { fileName: "13-YSSKuzeyCevreYolu.pdf", type: "highway", name: "YSS Kuzey Cevre Yolu", otoyolCode: "KCY" },
  { fileName: "14-KMOAvrupaKinali-Odayeri.pdf", type: "highway", name: "KMO Avrupa (Kinali-Odayeri)", otoyolCode: "KMO-AV" },
  { fileName: "15-KMOAnadoluKurtkoy-Akyazi.pdf", type: "highway", name: "KMO Anadolu (Kurtkoy-Akyazi)", otoyolCode: "KMO-AN" },
  { fileName: "17-Ankara-Nigde.pdf", type: "highway", name: "Ankara-Nigde Otoyolu", otoyolCode: "ANO" },
  { fileName: "18-Malkara-Canakkale.pdf", type: "highway", name: "Malkara-Canakkale Otoyolu", otoyolCode: "MCO" },
  { fileName: "19-Aydin-Denizli.pdf", type: "highway", name: "Aydin-Denizli Otoyolu", otoyolCode: "ADO" },
];

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

function parseBridgePdf(rows, mapping) {
  const prices = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, moto: 0 };
  for (const row of rows) {
    if (row.length < 2) continue;
    const firstCell = row[0].trim();
    if (/^[1-5]$/.test(firstCell)) {
      for (let i = row.length - 1; i >= 1; i--) {
        const val = parseTurkishNumber(row[i]);
        if (val > 0) { prices[firstCell] = val; break; }
      }
    }
    if (firstCell === "6" || /motosiklet/i.test(firstCell)) {
      for (let i = row.length - 1; i >= 1; i--) {
        const val = parseTurkishNumber(row[i]);
        if (val > 0) { prices["moto"] = val; break; }
      }
    }
  }
  return { type: mapping.type, name: mapping.name, fileName: mapping.fileName, prices };
}

function parseHighwayPdf(rows, mapping) {
  const stations = [];
  const matrix = [];
  let headerRowIndex = -1;
  let stationNames = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const joined = row.join(" ").toUpperCase();
    if (joined.includes("İSTASYON") || joined.includes("ISTASYON") || joined.includes("SINIF")) {
      const stationCells = row.filter(cell =>
        !/(İSTASYON|ISTASYON|SINIF|ARAÇ|ARAC|GİRİŞ|GIRIS|ÇIKIŞ|CIKIS)/i.test(cell) &&
        !/^\d+$/.test(cell.trim())
      );
      if (stationCells.length >= 2) {
        stationNames = stationCells.map(s => s.trim());
        headerRowIndex = i;
        break;
      }
    }
  }

  if (headerRowIndex === -1) {
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i];
      const textCells = row.filter(cell =>
        cell.trim().length > 1 && !/^[\d.,\s₺TL-]+$/.test(cell.trim()) &&
        !/^(Giriş|Çıkış|Sınıf)/i.test(cell.trim())
      );
      if (textCells.length >= 3) {
        stationNames = textCells.map(s => s.trim());
        headerRowIndex = i;
        break;
      }
    }
  }

  if (stationNames.length === 0) {
    for (const row of rows) {
      if (row.length >= 2) {
        const first = row[0].trim();
        const second = row[1]?.trim();
        if (second === "1" && first.length > 1 && !/^[\d.,₺]+$/.test(first)) {
          stationNames.push(first);
        }
      }
    }
  }

  stations.push(...stationNames);

  let currentStation = "";
  const dataStart = headerRowIndex + 1;

  for (let i = dataStart; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2) continue;

    let vehicleClass = "";
    let priceStart = 0;
    const first = row[0].trim();
    const second = row.length > 1 ? row[1].trim() : "";

    if (/^[1-6]$/.test(first)) {
      vehicleClass = first;
      priceStart = 1;
    } else if (/^[1-6]$/.test(second)) {
      if (first.length > 1 && !/^[\d.,₺TL\s-]+$/.test(first) && !/^(ARAÇ|ARAC)/i.test(first)) {
        currentStation = first;
      }
      vehicleClass = second;
      priceStart = 2;
    } else continue;

    if (!currentStation || !vehicleClass) continue;

    const vc = vehicleClass === "6" ? "moto" : (/^[1-5]$/.test(vehicleClass) ? vehicleClass : null);
    if (!vc) continue;

    const pricesInRow = row.slice(priceStart);
    for (let j = 0; j < pricesInRow.length && j < stationNames.length; j++) {
      const dest = stationNames[j];
      if (!dest || dest === currentStation) continue;
      const price = parseTurkishNumber(pricesInRow[j]);
      if (price <= 0) continue;

      const fromId = normalizeStationName(currentStation);
      const toId = normalizeStationName(dest);
      const key = `${fromId}__${toId}`;
      let entry = matrix.find(e => normalizeStationName(e.from) + "__" + normalizeStationName(e.to) === key);
      if (!entry) {
        entry = { from: currentStation, to: dest, prices: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, moto: 0 } };
        matrix.push(entry);
      }
      entry.prices[vc] = price;
    }
  }

  return { type: "highway", name: mapping.name, fileName: mapping.fileName, stations, matrix };
}

// --- Main ---

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

async function main() {
  const rootDir = join(import.meta.dirname, "..");
  const pdfDir = join(rootDir, "data", "kgm-pdfs");
  const dataDir = join(rootDir, "data");

  if (!existsSync(pdfDir)) {
    console.error("data/kgm-pdfs/ klasoru bulunamadi. Olusturun ve PDF'leri koyun.");
    process.exit(1);
  }

  const pdfFiles = readdirSync(pdfDir).filter(f => f.toLowerCase().endsWith(".pdf"));

  if (pdfFiles.length === 0) {
    console.error("data/kgm-pdfs/ klasorunde PDF bulunamadi.");
    console.log("KGM sitesinden PDF'leri indirip bu klasore koyun:");
    console.log("https://www.kgm.gov.tr/Sayfalar/KGM/SiteTr/Otoyollar/UcretlerYeni.aspx");
    process.exit(1);
  }

  console.log(`${pdfFiles.length} PDF dosyasi bulundu.\n`);

  const results = [];
  const errors = [];

  for (const fileName of pdfFiles) {
    const filePath = join(pdfDir, fileName);
    const mapping = findMapping(fileName);

    if (!mapping) {
      console.log(`  [UYARI] ${fileName}: Eslestirme bulunamadi, atlanıyor.`);
      errors.push(`${fileName}: Eslestirme bulunamadi`);
      continue;
    }

    try {
      console.log(`  Isleniyor: ${fileName} (${mapping.name})...`);
      const items = await extractTextItems(filePath);
      const rows = reconstructTable(items);

      let result;
      if (mapping.type === "bridge" || mapping.type === "tunnel") {
        result = parseBridgePdf(rows, mapping);
      } else {
        result = parseHighwayPdf(rows, mapping);
      }

      results.push(result);
      if (result.type === "bridge" || result.type === "tunnel") {
        const hasData = Object.values(result.prices).some(v => v > 0);
        console.log(`    -> ${hasData ? "OK" : "UYARI: Fiyat bulunamadi"}`);
      } else {
        console.log(`    -> ${result.stations.length} istasyon, ${result.matrix.length} guzergah`);
      }
    } catch (err) {
      console.log(`  [HATA] ${fileName}: ${err.message}`);
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

  // Merge pricing
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
        const key = `${prefix}-${fromId}__${prefix}-${toId}`;
        pricingMap[key] = entry.prices;
      }
      if (Object.keys(pricingMap).length > 0) {
        mergedPricing[code] = pricingMap;
      }
    }
  }

  // Merge fixed tolls
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
  console.log(`\nGuncellenen dosyalar:`);
  console.log(`  data/otoyol-pricing.json`);
  console.log(`  data/fixed-tolls.json`);

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
