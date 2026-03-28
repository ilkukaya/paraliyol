"use client";

import { useState, useEffect } from "react";
import type { SiteSettings } from "@/types";

export default function AyarlarPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    import("../../../../data/site-settings.json").then((data) => {
      setSettings(data.default as SiteSettings);
    });
  }, []);

  if (!settings) return <p>Yükleniyor...</p>;

  const handleSave = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "site-settings.json";
    a.click();
    URL.revokeObjectURL(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Site Ayarları</h2>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
        >
          {saved ? "Kaydedildi!" : "JSON İndir"}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Site Adı
          </label>
          <input
            type="text"
            value={settings.siteName}
            onChange={(e) =>
              setSettings({ ...settings, siteName: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Site Açıklaması
          </label>
          <textarea
            value={settings.siteDescription}
            onChange={(e) =>
              setSettings({ ...settings, siteDescription: e.target.value })
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duyuru Metni
          </label>
          <input
            type="text"
            value={settings.announcement}
            onChange={(e) =>
              setSettings({ ...settings, announcement: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-1">
            Ana sayfada gösterilir. Boş bırakılırsa gösterilmez.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Son Fiyat Güncelleme Tarihi
          </label>
          <input
            type="date"
            value={settings.lastPriceUpdate}
            onChange={(e) =>
              setSettings({ ...settings, lastPriceUpdate: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Google Analytics ID
          </label>
          <input
            type="text"
            value={settings.googleAnalyticsId}
            onChange={(e) =>
              setSettings({ ...settings, googleAnalyticsId: e.target.value })
            }
            placeholder="G-XXXXXXXXXX"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">
            Reklamlar
          </label>
          <button
            onClick={() =>
              setSettings({ ...settings, adsEnabled: !settings.adsEnabled })
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.adsEnabled ? "bg-green-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.adsEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm text-gray-500">
            {settings.adsEnabled ? "Açık" : "Kapalı"}
          </span>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SEO Başlık Son Eki
          </label>
          <input
            type="text"
            value={settings.seoDefaults.titleSuffix}
            onChange={(e) =>
              setSettings({
                ...settings,
                seoDefaults: {
                  ...settings.seoDefaults,
                  titleSuffix: e.target.value,
                },
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
