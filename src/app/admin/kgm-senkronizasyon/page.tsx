"use client";

import { useState, useCallback, useRef } from "react";
import type { VehicleClass, FixedToll } from "@/types";
import {
  type TextItem,
  type ParsedPdfResult,
  type ParsedBridgeToll,
  type ParsedHighwayPricing,
  type SyncResult,
  reconstructTable,
  parsePdf,
  generateSyncResult,
  mergeWithExistingData,
  findMappingForFile,
  PDF_MAPPINGS,
} from "@/lib/kgm-pdf-parser";

const VEHICLE_CLASSES: VehicleClass[] = ["1", "2", "3", "4", "5", "moto"];
const VC_LABELS: Record<VehicleClass, string> = {
  "1": "1. Sinif",
  "2": "2. Sinif",
  "3": "3. Sinif",
  "4": "4. Sinif",
  "5": "5. Sinif",
  moto: "Moto",
};

interface FileParseResult {
  fileName: string;
  status: "pending" | "parsing" | "success" | "error";
  result?: ParsedPdfResult;
  error?: string;
  rawRows?: string[][];
}

export default function KgmSenkronizasyonPage() {
  const [files, setFiles] = useState<FileParseResult[]>([]);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRaw, setShowRaw] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (!selectedFiles) return;

      const newFiles: FileParseResult[] = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        if (file.name.toLowerCase().endsWith(".pdf")) {
          newFiles.push({
            fileName: file.name,
            status: "pending",
          });
        }
      }
      setFiles(newFiles);
      setSyncResult(null);
    },
    []
  );

  const extractTextFromPdf = async (
    file: File
  ): Promise<TextItem[][]> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = await import("pdfjs-dist");

    // Set worker source
    if (typeof window !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    }

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const allPages: TextItem[][] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const items: TextItem[] = textContent.items
        .filter((item) => "str" in item && "transform" in item)
        .map((item: Record<string, unknown>) => ({
          str: item.str as string,
          x: (item.transform as number[])[4],
          y: (item.transform as number[])[5],
          width: item.width as number,
          height: item.height as number,
        }));
      allPages.push(items);
    }

    return allPages;
  };

  const handleParseAll = useCallback(async () => {
    const fileInput = fileInputRef.current;
    if (!fileInput?.files || files.length === 0) return;

    setIsProcessing(true);
    const updatedFiles: FileParseResult[] = [...files];

    for (let i = 0; i < fileInput.files.length; i++) {
      const file = fileInput.files[i];
      if (!file.name.toLowerCase().endsWith(".pdf")) continue;

      const fileIndex = updatedFiles.findIndex(
        (f) => f.fileName === file.name
      );
      if (fileIndex === -1) continue;

      updatedFiles[fileIndex] = { ...updatedFiles[fileIndex], status: "parsing" };
      setFiles([...updatedFiles]);

      try {
        const pages = await extractTextFromPdf(file);
        // Combine all pages' text items and reconstruct table
        const allItems = pages.flat();
        const rows = reconstructTable(allItems);

        const result = parsePdf(rows, file.name);

        updatedFiles[fileIndex] = {
          ...updatedFiles[fileIndex],
          status: result ? "success" : "error",
          result: result || undefined,
          error: result ? undefined : "Parse edilemedi",
          rawRows: rows,
        };
      } catch (err) {
        updatedFiles[fileIndex] = {
          ...updatedFiles[fileIndex],
          status: "error",
          error: err instanceof Error ? err.message : "Bilinmeyen hata",
        };
      }

      setFiles([...updatedFiles]);
    }

    // Generate sync result from successful parses
    const successResults = updatedFiles
      .filter((f) => f.status === "success" && f.result)
      .map((f) => f.result!);

    if (successResults.length > 0) {
      const result = generateSyncResult(successResults);
      setSyncResult(result);
    }

    setIsProcessing(false);
  }, [files]);

  const handleDownloadJson = useCallback(
    async (type: "pricing" | "fixed-tolls" | "all") => {
      if (!syncResult) return;

      const existingPricing = (await import("../../../../data/otoyol-pricing.json"))
        .default;
      const existingFixed = (await import("../../../../data/fixed-tolls.json"))
        .default as unknown as FixedToll[];

      const { mergedPricing, mergedFixedTolls } = mergeWithExistingData(
        syncResult,
        existingPricing as Record<string, Record<string, Record<VehicleClass, number>>>,
        existingFixed
      );

      if (type === "pricing" || type === "all") {
        downloadJson(mergedPricing, "otoyol-pricing.json");
      }
      if (type === "fixed-tolls" || type === "all") {
        downloadJson(mergedFixedTolls, "fixed-tolls.json");
      }
    },
    [syncResult]
  );

  const downloadJson = (data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        KGM Veri Senkronizasyonu
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        KGM web sitesinden indirdiginiz PDF dosyalarini yukleyerek otoyol ve
        kopru ucretlerini otomatik olarak guncelleyebilirsiniz.
      </p>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-1">PDF Nereden Indirilir?</h3>
        <p className="text-sm text-blue-800">
          <a
            href="https://www.kgm.gov.tr/Sayfalar/KGM/SiteTr/Otoyollar/UcretlerYeni.aspx"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium"
          >
            KGM Otoyol ve Kopru Gecis Ucretleri
          </a>
          {" "}sayfasindan tum PDF&apos;leri indirip asagiya yukleyin.
        </p>
      </div>

      {/* Expected PDFs list */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">
          Beklenen PDF Dosyalari ({PDF_MAPPINGS.length} adet)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
          {PDF_MAPPINGS.map((m) => {
            const uploaded = files.find(
              (f) => f.fileName.toLowerCase() === m.fileName.toLowerCase()
            );
            return (
              <div key={m.fileName} className="flex items-center gap-2 py-1">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    uploaded?.status === "success"
                      ? "bg-green-500"
                      : uploaded?.status === "error"
                      ? "bg-red-500"
                      : uploaded?.status === "parsing"
                      ? "bg-yellow-500"
                      : uploaded
                      ? "bg-gray-400"
                      : "bg-gray-200"
                  }`}
                />
                <span className="text-gray-600 truncate">{m.fileName}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 mb-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
          id="pdf-upload"
        />
        <label
          htmlFor="pdf-upload"
          className="cursor-pointer block"
        >
          <div className="text-4xl mb-2">&#128196;</div>
          <p className="text-gray-700 font-medium">
            PDF dosyalarini secmek icin tiklayin
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Birden fazla PDF secebilirsiniz
          </p>
        </label>
      </div>

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">
              Secilen Dosyalar ({files.length})
            </h3>
            <button
              onClick={handleParseAll}
              disabled={isProcessing}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium"
            >
              {isProcessing ? "Isleniyor..." : "PDF'leri Parse Et"}
            </button>
          </div>

          <div className="space-y-2">
            {files.map((file) => {
              const mapping = findMappingForFile(file.fileName);
              return (
                <div
                  key={file.fileName}
                  className="bg-white border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={file.status} />
                      <span className="text-sm font-medium text-gray-900">
                        {file.fileName}
                      </span>
                      {mapping && (
                        <span className="text-xs text-gray-500">
                          ({mapping.name})
                        </span>
                      )}
                      {!mapping && (
                        <span className="text-xs text-orange-600">
                          (Eslestirme bulunamadi)
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {file.rawRows && (
                        <button
                          onClick={() =>
                            setShowRaw(
                              showRaw === file.fileName ? null : file.fileName
                            )
                          }
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          {showRaw === file.fileName ? "Ham Veri Gizle" : "Ham Veri"}
                        </button>
                      )}
                    </div>
                  </div>

                  {file.error && (
                    <p className="text-sm text-red-600 mt-1">{file.error}</p>
                  )}

                  {/* Raw data view */}
                  {showRaw === file.fileName && file.rawRows && (
                    <div className="mt-2 bg-gray-50 rounded p-2 max-h-60 overflow-auto">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {file.rawRows
                          .map(
                            (row, i) =>
                              `[${i}] ${row.map((c) => `"${c}"`).join(" | ")}`
                          )
                          .join("\n")}
                      </pre>
                    </div>
                  )}

                  {/* Parse result summary */}
                  {file.result && <ParseResultSummary result={file.result} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sync Results */}
      {syncResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-green-900 mb-3">
            Senkronizasyon Sonucu
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <StatCard
              label="Basarili"
              value={successCount}
              color="green"
            />
            <StatCard label="Hata" value={errorCount} color="red" />
            <StatCard
              label="Otoyol Guncelleme"
              value={Object.keys(syncResult.otoyolPricing).length}
              color="blue"
            />
            <StatCard
              label="Kopru/Tunel Guncelleme"
              value={syncResult.fixedTollUpdates.length}
              color="purple"
            />
          </div>

          {/* Fixed toll updates preview */}
          {syncResult.fixedTollUpdates.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-green-900 mb-2">
                Kopru/Tunel Fiyat Guncellemeleri
              </h4>
              <div className="bg-white rounded-lg p-3 space-y-2">
                {syncResult.fixedTollUpdates.map((update) => (
                  <div key={update.id} className="text-sm">
                    <span className="font-medium">{update.id}:</span>
                    <span className="ml-2 text-gray-600">
                      {VEHICLE_CLASSES.map(
                        (vc) => `${VC_LABELS[vc]}: ${update.prices[vc]} TL`
                      ).join(" | ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Highway pricing preview */}
          {Object.keys(syncResult.otoyolPricing).length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-green-900 mb-2">
                Otoyol Ucret Guncellemeleri
              </h4>
              <div className="bg-white rounded-lg p-3 space-y-2">
                {Object.entries(syncResult.otoyolPricing).map(
                  ([code, pricing]) => (
                    <div key={code} className="text-sm">
                      <span className="font-medium">{code}:</span>
                      <span className="ml-2 text-gray-600">
                        {Object.keys(pricing).length} guzergah
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Download buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleDownloadJson("pricing")}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
            >
              otoyol-pricing.json Indir
            </button>
            <button
              onClick={() => handleDownloadJson("fixed-tolls")}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
            >
              fixed-tolls.json Indir
            </button>
            <button
              onClick={() => handleDownloadJson("all")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              Tum JSON&apos;lari Indir
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Kullanim Adimlari</h3>
        <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
          <li>
            KGM web sitesinden guncel PDF&apos;leri indirin
          </li>
          <li>Yukaridaki alandan PDF dosyalarini secin</li>
          <li>&quot;PDF&apos;leri Parse Et&quot; butonuna tiklayin</li>
          <li>Sonuclari kontrol edin</li>
          <li>JSON dosyalarini indirin</li>
          <li>
            Indirilen JSON&apos;lari <code className="bg-gray-200 px-1 rounded">data/</code> klasorune kopyalayin
          </li>
          <li>Degisiklikleri commit edip deploy edin</li>
        </ol>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: FileParseResult["status"] }) {
  const config = {
    pending: { bg: "bg-gray-100", text: "text-gray-700", label: "Bekliyor" },
    parsing: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      label: "Isleniyor",
    },
    success: { bg: "bg-green-100", text: "text-green-700", label: "Basarili" },
    error: { bg: "bg-red-100", text: "text-red-700", label: "Hata" },
  }[status];

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    green: "text-green-900",
    red: "text-red-900",
    blue: "text-blue-900",
    purple: "text-purple-900",
  };
  return (
    <div className="bg-white rounded-lg p-3 text-center">
      <div className={`text-2xl font-bold ${colorMap[color] || "text-gray-900"}`}>
        {value}
      </div>
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  );
}

function ParseResultSummary({ result }: { result: ParsedPdfResult }) {
  if (result.type === "bridge" || result.type === "tunnel") {
    const bridge = result as ParsedBridgeToll;
    return (
      <div className="mt-2 text-sm">
        <span className="text-gray-500">
          {result.type === "bridge" ? "Kopru" : "Tunel"} |{" "}
        </span>
        <span className="text-gray-700">
          {VEHICLE_CLASSES.filter((vc) => bridge.prices[vc] > 0)
            .map((vc) => `${VC_LABELS[vc]}: ${bridge.prices[vc]} TL`)
            .join(" | ")}
        </span>
      </div>
    );
  }

  const highway = result as ParsedHighwayPricing;
  return (
    <div className="mt-2 text-sm">
      <span className="text-gray-500">Otoyol | </span>
      <span className="text-gray-700">
        {highway.stations.length} istasyon, {highway.matrix.length} guzergah
      </span>
      {highway.stations.length > 0 && (
        <div className="text-xs text-gray-500 mt-1">
          Istasyonlar: {highway.stations.join(", ")}
        </div>
      )}
    </div>
  );
}
