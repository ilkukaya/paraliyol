"use client";

import { useEffect, useState } from "react";

interface Stats {
  tollPlazas: number;
  fixedTolls: number;
  locations: number;
  popularRoutes: number;
  lastUpdate: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    // Load stats from data files
    Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()).catch(() => null),
    ]).then(([data]) => {
      if (data) setStats(data);
    });

    // Fallback stats from localStorage or defaults
    setStats({
      tollPlazas: 27,
      fixedTolls: 8,
      locations: 37,
      popularRoutes: 10,
      lastUpdate: "2026-01-15",
    });
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-700">
            {stats?.tollPlazas || "-"}
          </div>
          <div className="text-sm text-gray-600">Otoyol Gişesi</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-700">
            {stats?.fixedTolls || "-"}
          </div>
          <div className="text-sm text-gray-600">Köprü/Tünel/Feribot</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-purple-700">
            {stats?.locations || "-"}
          </div>
          <div className="text-sm text-gray-600">Konum</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-orange-700">
            {stats?.popularRoutes || "-"}
          </div>
          <div className="text-sm text-gray-600">Popüler Rota</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-3">Son Güncelleme</h3>
        <p className="text-gray-600">
          Fiyatlar son olarak <strong>{stats?.lastUpdate}</strong> tarihinde
          güncellenmiştir.
        </p>
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          <strong>Not:</strong> Fiyat güncellemelerini &quot;Fiyat Yönetimi&quot; sayfasından
          yapabilirsiniz. Değişiklikler kaydedildikten sonra site otomatik olarak
          yeniden derlenir.
        </div>
      </div>
    </div>
  );
}
