import type { VehicleClass } from "@/types";
import { formatCurrency, formatDistance, getVehicleClassShortLabel } from "@/lib/format";

interface CostSummaryCardProps {
  fromName: string;
  toName: string;
  totalPrice: number;
  totalDistanceKm: number;
  vehicleClass: VehicleClass;
  tollCount: number;
}

export default function CostSummaryCard({
  fromName,
  toName,
  totalPrice,
  totalDistanceKm,
  vehicleClass,
  tollCount,
}: CostSummaryCardProps) {
  return (
    <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">
            {fromName} → {toName}
          </h1>
          <div className="flex flex-wrap gap-3 mt-2 text-green-100 text-sm">
            <span>{getVehicleClassShortLabel(vehicleClass)}</span>
            <span>•</span>
            <span>{formatDistance(totalDistanceKm)}</span>
            <span>•</span>
            <span>{tollCount} geçiş noktası</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-green-100 text-sm">Toplam Ücret</div>
          <div className="text-3xl md:text-4xl font-bold">
            {formatCurrency(totalPrice)}
          </div>
        </div>
      </div>
    </div>
  );
}
