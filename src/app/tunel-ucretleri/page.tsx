import type { Metadata } from "next";
import { getFixedTollsByType } from "@/lib/data-loader";
import { formatCurrency, getVehicleClassShortLabel } from "@/lib/format";
import { generatePageMetadata } from "@/lib/seo";
import type { VehicleClass } from "@/types";

export const metadata: Metadata = generatePageMetadata(
  "Tünel Geçiş Ücretleri 2026",
  "Avrasya Tüneli ve diğer tünel geçiş ücretleri. Tüm araç sınıfları için güncel fiyatlar.",
  "/tunel-ucretleri"
);

const vehicleClasses: VehicleClass[] = ["1", "2", "3", "4", "5", "moto"];

export default function TunelUcretleriPage() {
  const tunnels = getFixedTollsByType("tunnel");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Tünel Geçiş Ücretleri 2026
      </h1>
      <p className="text-gray-600 mb-8">
        Türkiye&apos;deki tüm tünel geçiş ücretleri. Araç sınıfınıza göre güncel fiyatları görün.
      </p>

      <div className="space-y-6">
        {tunnels.map((tunnel) => (
          <div
            key={tunnel.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-4 text-white">
              <h2 className="text-xl font-bold">{tunnel.name}</h2>
              <p className="text-gray-300 text-sm mt-1">
                {tunnel.operator} | {tunnel.description}
              </p>
            </div>
            <div className="p-4">
              {tunnel.prices["1"] === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-800 font-medium">
                    Bu tünel ücretsizdir. Otoyol gişe ücretine dahildir.
                  </p>
                </div>
              ) : (
                <>
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
                              {formatCurrency(tunnel.prices[vc])}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {tunnel.nightDiscount?.enabled && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                      Gece indirimi: %{tunnel.nightDiscount.percentage} ({tunnel.nightDiscount.startHour}:00 - {tunnel.nightDiscount.endHour}:00)
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
