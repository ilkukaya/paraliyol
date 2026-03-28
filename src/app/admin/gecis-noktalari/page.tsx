"use client";

import { useState, useEffect } from "react";
import type { TollPlaza } from "@/types";

export default function GecisNoktalariPage() {
  const [plazas, setPlazas] = useState<TollPlaza[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    import("../../../../data/toll-plazas.json").then((data) => {
      setPlazas(data.default as TollPlaza[]);
    });
  }, []);

  const filtered = plazas.filter(
    (p) =>
      p.name.toLowerCase().includes(filter.toLowerCase()) ||
      (p.otoyol && p.otoyol.toLowerCase().includes(filter.toLowerCase()))
  );

  const handleSave = () => {
    const blob = new Blob([JSON.stringify(plazas, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "toll-plazas.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Geçiş Noktaları</h2>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
        >
          JSON İndir
        </button>
      </div>

      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Ara... (gişe adı veya otoyol)"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2 font-semibold text-gray-700">
                  ID
                </th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">
                  Ad
                </th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">
                  Otoyol
                </th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">
                  Tür
                </th>
                <th className="text-right px-3 py-2 font-semibold text-gray-700">
                  Lat
                </th>
                <th className="text-right px-3 py-2 font-semibold text-gray-700">
                  Lng
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((plaza) => (
                <tr
                  key={plaza.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-3 py-2 text-gray-500 font-mono text-xs">
                    {plaza.id}
                  </td>
                  <td className="px-3 py-2 text-gray-900 font-medium">
                    {plaza.name}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {plaza.otoyol || "-"}
                  </td>
                  <td className="px-3 py-2 text-gray-600">{plaza.type}</td>
                  <td className="px-3 py-2 text-right text-gray-500 font-mono text-xs">
                    {plaza.lat}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-500 font-mono text-xs">
                    {plaza.lng}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-4">
        Toplam {filtered.length} geçiş noktası gösteriliyor.
      </p>
    </div>
  );
}
