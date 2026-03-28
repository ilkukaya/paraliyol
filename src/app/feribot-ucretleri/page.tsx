import type { Metadata } from "next";
import { getFixedTollsByType } from "@/lib/data-loader";
import { formatCurrency, getVehicleClassShortLabel } from "@/lib/format";
import { generatePageMetadata } from "@/lib/seo";
import type { VehicleClass } from "@/types";

export const metadata: Metadata = generatePageMetadata(
  "Feribot Ücretleri 2026",
  "İDO ve GESTAŞ arabalı feribot ücretleri. Eskihisar-Topçular, Çanakkale-Eceabat, Gelibolu-Lapseki feribot fiyatları.",
  "/feribot-ucretleri"
);

const vehicleClasses: VehicleClass[] = ["1", "2", "3", "4", "5", "moto"];

export default function FeribotUcretleriPage() {
  const ferries = getFixedTollsByType("ferry");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Feribot Ücretleri 2026
      </h1>
      <p className="text-gray-600 mb-8">
        Türkiye&apos;deki arabalı feribot ücretleri. İDO ve GESTAŞ hatları için güncel fiyatlar.
      </p>

      <div className="space-y-6">
        {ferries.map((ferry) => (
          <div
            key={ferry.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 p-4 text-white">
              <h2 className="text-xl font-bold">{ferry.name}</h2>
              <p className="text-cyan-100 text-sm mt-1">
                {ferry.operator} | {ferry.description}
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
                          {formatCurrency(ferry.prices[vc])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {ferry.nightDiscount?.enabled && (
                <div className="mt-3 bg-cyan-50 rounded-lg p-3 text-sm text-cyan-800">
                  Gece/akşam indirimi: %{ferry.nightDiscount.percentage} ({ferry.nightDiscount.startHour}:00 - {ferry.nightDiscount.endHour}:00)
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <section className="bg-white rounded-xl border border-gray-200 p-6 mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Arabalı Feribot Bilgileri</h2>
        <div className="text-gray-600 text-sm space-y-2">
          <p>
            Türkiye&apos;de İDO (İstanbul Deniz Otobüsleri) ve GESTAŞ (Geyikli Deniz Taşımacılığı)
            başta olmak üzere birçok arabalı feribot hattı bulunmaktadır.
          </p>
          <p>
            Feribot ücretleri araç boyutuna ve sınıfına göre değişmektedir.
            Bazı hatlarda gece/akşam saatlerinde indirimli tarife uygulanmaktadır.
          </p>
        </div>
      </section>
    </div>
  );
}
