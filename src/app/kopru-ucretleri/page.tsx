import type { Metadata } from "next";
import { getFixedTollsByType } from "@/lib/data-loader";
import { formatCurrency, getVehicleClassShortLabel } from "@/lib/format";
import { generatePageMetadata } from "@/lib/seo";
import type { VehicleClass } from "@/types";

export const metadata: Metadata = generatePageMetadata(
  "Köprü Geçiş Ücretleri 2026",
  "Osmangazi Köprüsü, Yavuz Sultan Selim Köprüsü, 1915 Çanakkale Köprüsü geçiş ücretleri. Tüm araç sınıfları için güncel fiyatlar.",
  "/kopru-ucretleri"
);

const vehicleClasses: VehicleClass[] = ["1", "2", "3", "4", "5", "moto"];

export default function KopruUcretleriPage() {
  const bridges = getFixedTollsByType("bridge");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Köprü Geçiş Ücretleri 2026
      </h1>
      <p className="text-gray-600 mb-8">
        Türkiye&apos;deki tüm köprü geçiş ücretleri. Araç sınıfınıza göre güncel fiyatları görün.
      </p>

      <div className="space-y-6">
        {bridges.map((bridge) => (
          <div
            key={bridge.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
              <h2 className="text-xl font-bold">{bridge.name}</h2>
              <p className="text-blue-100 text-sm mt-1">
                {bridge.operator} | {bridge.description}
              </p>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 font-semibold text-gray-700">
                        Araç Sınıfı
                      </th>
                      <th className="text-right py-2 px-3 font-semibold text-gray-700">
                        Ücret
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicleClasses.map((vc) => (
                      <tr key={vc} className="border-b border-gray-100">
                        <td className="py-2 px-3 text-gray-800">
                          {getVehicleClassShortLabel(vc)}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold">
                          {formatCurrency(bridge.prices[vc])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {bridge.nightDiscount?.enabled && (
                <div className="mt-3 bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                  Gece indirimi: %{bridge.nightDiscount.percentage} ({bridge.nightDiscount.startHour}:00 - {bridge.nightDiscount.endHour}:00)
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <section className="bg-white rounded-xl border border-gray-200 p-6 mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Köprü Geçiş Ücretleri Hakkında</h2>
        <div className="text-gray-600 text-sm space-y-2">
          <p>
            Türkiye&apos;de İstanbul Boğazı ve diğer geçiş noktalarındaki köprüler
            HGS ile ücretlendirilmektedir. 15 Temmuz Şehitler Köprüsü ve
            Fatih Sultan Mehmet Köprüsü 2014 yılından itibaren ücretsizdir.
          </p>
        </div>
      </section>
    </div>
  );
}
