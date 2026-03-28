"use client";

import { useState, useEffect } from "react";
import type { FixedToll, VehicleClass } from "@/types";

const VEHICLE_CLASSES: VehicleClass[] = ["1", "2", "3", "4", "5", "moto"];
const VC_LABELS: Record<VehicleClass, string> = {
  "1": "Otomobil",
  "2": "Minibüs",
  "3": "Kamyon",
  "4": "Ağır Kamyon",
  "5": "Çok Ağır",
  moto: "Moto",
};

export default function FiyatlarPage() {
  const [fixedTolls, setFixedTolls] = useState<FixedToll[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [bulkPercent, setBulkPercent] = useState("");

  useEffect(() => {
    import("../../../../data/fixed-tolls.json").then((data) => {
      setFixedTolls(data.default as FixedToll[]);
    });
  }, []);

  const handlePriceChange = (
    tollId: string,
    vc: VehicleClass,
    value: string
  ) => {
    setFixedTolls((prev) =>
      prev.map((t) =>
        t.id === tollId
          ? { ...t, prices: { ...t.prices, [vc]: parseFloat(value) || 0 } }
          : t
      )
    );
  };

  const handleBulkUpdate = () => {
    const pct = parseFloat(bulkPercent);
    if (isNaN(pct)) return;
    setFixedTolls((prev) =>
      prev.map((t) => ({
        ...t,
        prices: Object.fromEntries(
          Object.entries(t.prices).map(([k, v]) => [
            k,
            Math.round((v as number) * (1 + pct / 100)),
          ])
        ) as Record<VehicleClass, number>,
      }))
    );
    setBulkPercent("");
  };

  const handleSave = () => {
    // Download as JSON for now
    const blob = new Blob([JSON.stringify(fixedTolls, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fixed-tolls.json";
    a.click();
    URL.revokeObjectURL(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Fiyat Yönetimi</h2>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
        >
          {saved ? "Kaydedildi!" : "JSON İndir"}
        </button>
      </div>

      {/* Bulk Update */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">
          Toplu Fiyat Güncelleme
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={bulkPercent}
            onChange={(e) => setBulkPercent(e.target.value)}
            placeholder="Artış %"
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            onClick={handleBulkUpdate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
          >
            Tüm Fiyatlara Uygula
          </button>
        </div>
      </div>

      {/* Fixed Tolls */}
      <h3 className="font-bold text-gray-900 mb-3">
        Köprü / Tünel / Feribot Ücretleri
      </h3>
      <div className="space-y-4">
        {fixedTolls.map((toll) => (
          <div
            key={toll.id}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{toll.name}</h4>
                <p className="text-sm text-gray-500">
                  {toll.type} | {toll.operator}
                </p>
              </div>
              <button
                onClick={() =>
                  setEditingId(editingId === toll.id ? null : toll.id)
                }
                className="text-sm text-green-700 hover:text-green-800"
              >
                {editingId === toll.id ? "Kapat" : "Düzenle"}
              </button>
            </div>
            {editingId === toll.id ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {VEHICLE_CLASSES.map((vc) => (
                  <div key={vc}>
                    <label className="block text-xs text-gray-500 mb-1">
                      {VC_LABELS[vc]}
                    </label>
                    <input
                      type="number"
                      value={toll.prices[vc]}
                      onChange={(e) =>
                        handlePriceChange(toll.id, vc, e.target.value)
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 text-sm">
                {VEHICLE_CLASSES.map((vc) => (
                  <span key={vc} className="text-gray-600">
                    <span className="text-gray-400">{VC_LABELS[vc]}:</span>{" "}
                    <span className="font-medium">
                      {toll.prices[vc]} TL
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
