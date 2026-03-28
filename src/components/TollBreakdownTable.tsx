import type { TollOnRoute, VehicleClass } from "@/types";
import { formatCurrency, getTollTypeLabel, getTollTypeIcon } from "@/lib/format";

interface TollBreakdownTableProps {
  tolls: TollOnRoute[];
  vehicleClass: VehicleClass;
  totalPrice: number;
}

export default function TollBreakdownTable({
  tolls,
  vehicleClass,
  totalPrice,
}: TollBreakdownTableProps) {
  if (tolls.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <p className="text-green-800 font-medium">
          Bu rota üzerinde ücretli geçiş noktası bulunmamaktadır.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                #
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                Geçiş Noktası
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                Tür
              </th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700">
                Ücret
              </th>
            </tr>
          </thead>
          <tbody>
            {tolls.map((toll, index) => (
              <tr
                key={toll.id}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="px-4 py-3 text-sm text-gray-500">
                  {index + 1}
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900">{toll.name}</span>
                  {toll.km && (
                    <span className="text-gray-400 text-sm ml-2">
                      ({toll.km} km)
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <span className="mr-1">{getTollTypeIcon(toll.type)}</span>
                  {getTollTypeLabel(toll.type)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  {formatCurrency(toll.prices[vehicleClass])}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-green-50">
              <td
                colSpan={3}
                className="px-4 py-4 text-base font-bold text-green-800"
              >
                Toplam Ücret
              </td>
              <td className="px-4 py-4 text-right text-lg font-bold text-green-800">
                {formatCurrency(totalPrice)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
