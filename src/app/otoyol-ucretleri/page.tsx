import type { Metadata } from "next";
import Link from "next/link";
import { getOtoyolPricing, getPopularRoutes, getLocations, getLocationById } from "@/lib/data-loader";
import { formatCurrency } from "@/lib/format";
import { generatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = generatePageMetadata(
  "Otoyol Ücretleri 2026",
  "Türkiye'deki tüm otoyol geçiş ücretleri. KGM otoyol gişe ücretleri, araç sınıflarına göre güncel fiyat listesi.",
  "/otoyol-ucretleri"
);

export default function OtoyolUcretleriPage() {
  const pricing = getOtoyolPricing();
  const popularRoutes = getPopularRoutes();
  const locations = getLocations();

  const otoyolNames: Record<string, string> = {
    "O-4": "İstanbul - Ankara Otoyolu",
    "O-5": "Gebze - İzmir Otoyolu",
    "O-3": "Edirne - İstanbul (TEM) Otoyolu",
    "O-21": "Ankara - Konya Otoyolu",
    "O-31": "Konya - Antalya Otoyolu",
    "O-51": "Mersin - Adana Otoyolu",
    "O-52": "Adana - Gaziantep Otoyolu",
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Otoyol Ücretleri 2026
      </h1>
      <p className="text-gray-600 mb-8">
        Türkiye&apos;deki tüm KGM otoyol geçiş ücretleri. Araç sınıfınıza göre güncel fiyatları görün.
      </p>

      {/* Popular Route Links */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Popüler Otoyol Rotaları</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {popularRoutes
            .filter((r) => r.tolls.some((t) => t.type === "gise"))
            .map((route) => {
              const from = getLocationById(route.from);
              const to = getLocationById(route.to);
              return (
                <Link
                  key={route.slug}
                  href={`/${route.slug}`}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-green-300 transition-colors"
                >
                  <span className="text-green-700 font-medium">
                    {from?.name} → {to?.name}
                  </span>
                  <span className="font-bold">{formatCurrency(route.totalPrices["1"])}</span>
                </Link>
              );
            })}
        </div>
      </div>

      {/* Pricing Tables per Otoyol */}
      {Object.entries(pricing).map(([otoyol, routes]) => (
        <div key={otoyol} className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {otoyol} - {otoyolNames[otoyol] || otoyol}
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2 font-semibold text-gray-700">Güzergah</th>
                    <th className="text-right px-3 py-2 font-semibold text-gray-700">Otomobil</th>
                    <th className="text-right px-3 py-2 font-semibold text-gray-700">Minibüs</th>
                    <th className="text-right px-3 py-2 font-semibold text-gray-700 hidden md:table-cell">Kamyon</th>
                    <th className="text-right px-3 py-2 font-semibold text-gray-700 hidden md:table-cell">Moto</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(routes).map(([key, prices]) => {
                    const [from, to] = key.split("__");
                    const fromPlaza = from.replace(/^o\d+-/, "").replace(/-/g, " ");
                    const toPlaza = to.replace(/^o\d+-/, "").replace(/-/g, " ");
                    return (
                      <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-800 capitalize">
                          {fromPlaza} → {toPlaza}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">{formatCurrency(prices["1"])}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(prices["2"])}</td>
                        <td className="px-3 py-2 text-right hidden md:table-cell">{formatCurrency(prices["3"])}</td>
                        <td className="px-3 py-2 text-right hidden md:table-cell">{formatCurrency(prices["moto"])}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      <section className="bg-white rounded-xl border border-gray-200 p-6 mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">KGM Otoyol Ücretleri Hakkında</h2>
        <div className="text-gray-600 text-sm space-y-2">
          <p>
            Karayolları Genel Müdürlüğü (KGM) tarafından işletilen otoyollarda geçiş ücretleri
            HGS (Hızlı Geçiş Sistemi) ile tahsil edilmektedir. Ücretler araç sınıfına ve mesafeye
            göre belirlenmektedir.
          </p>
          <p>
            Otoyol ücretleri genellikle yılda 1-2 kez güncellenmektedir. 2026 yılı başında
            %25,49 oranında artış uygulanmıştır.
          </p>
        </div>
      </section>
    </div>
  );
}
