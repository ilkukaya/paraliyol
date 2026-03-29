import { Suspense } from "react";
import type { Metadata } from "next";
import type { VehicleClass } from "@/types";
import { getLocations, getLocationById } from "@/lib/data-loader";
import { calculateRoute, getTotalPrice } from "@/lib/toll-calculator";
import { generatePageMetadata } from "@/lib/seo";
import { formatCurrency } from "@/lib/format";
import CostSummaryCard from "@/components/CostSummaryCard";
import TollBreakdownTable from "@/components/TollBreakdownTable";
import RouteSearchForm from "@/components/RouteSearchForm";
import AdPlaceholder from "@/components/AdPlaceholder";
import RouteMapWrapper from "@/components/RouteMapWrapper";

type SearchParams = Promise<{ from?: string; to?: string; class?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const from = getLocationById(params.from || "");
  const to = getLocationById(params.to || "");
  if (from && to) {
    return generatePageMetadata(
      `${from.name} - ${to.name} Otoyol Ücreti`,
      `${from.name} - ${to.name} arası otoyol, köprü, tünel ve feribot geçiş ücretleri.`,
      "/sonuc"
    );
  }
  return generatePageMetadata(
    "Rota Hesaplama Sonucu",
    "Otoyol geçiş ücreti hesaplama sonucu.",
    "/sonuc"
  );
}

function ResultContent({
  fromId,
  toId,
  vehicleClass,
}: {
  fromId: string;
  toId: string;
  vehicleClass: VehicleClass;
}) {
  const locations = getLocations();
  const from = getLocationById(fromId);
  const to = getLocationById(toId);

  if (!from || !to) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 font-medium">
            Geçersiz konum seçimi. Lütfen tekrar deneyin.
          </p>
        </div>
        <div className="mt-8">
          <RouteSearchForm locations={locations} />
        </div>
      </div>
    );
  }

  const route = calculateRoute(fromId, toId);
  const tolls = route?.tolls || [];
  const totalPrice = route ? getTotalPrice(tolls, vehicleClass) : 0;
  const totalDistanceKm = route?.totalDistanceKm || 0;
  const waypoints = route?.waypoints || [
    [from.lat, from.lng],
    [to.lat, to.lng],
  ];

  // All vehicle class prices for comparison
  const allClassPrices: { class: VehicleClass; label: string; price: number }[] =
    [
      { class: "1", label: "Otomobil", price: getTotalPrice(tolls, "1") },
      { class: "2", label: "Minibüs", price: getTotalPrice(tolls, "2") },
      { class: "3", label: "Otobüs/Kamyon", price: getTotalPrice(tolls, "3") },
      { class: "4", label: "Ağır Kamyon", price: getTotalPrice(tolls, "4") },
      { class: "5", label: "Çok Ağır Kamyon", price: getTotalPrice(tolls, "5") },
      { class: "moto", label: "Motosiklet", price: getTotalPrice(tolls, "moto") },
    ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <CostSummaryCard
        fromName={from.name}
        toName={to.name}
        totalPrice={totalPrice}
        totalDistanceKm={totalDistanceKm}
        vehicleClass={vehicleClass}
        tollCount={tolls.length}
      />

      <RouteMapWrapper waypoints={waypoints as [number, number][]} tolls={tolls} />

      <TollBreakdownTable
        tolls={tolls}
        vehicleClass={vehicleClass}
        totalPrice={totalPrice}
      />

      {/* Vehicle Class Comparison */}
      {tolls.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Tüm Araç Sınıfları Karşılaştırması
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {allClassPrices.map((item) => (
              <div
                key={item.class}
                className={`rounded-lg p-3 text-center ${
                  item.class === vehicleClass
                    ? "bg-green-50 border-2 border-green-300"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <div className="text-sm text-gray-600">{item.label}</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(item.price)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AdPlaceholder slot="result-bottom" />

      {/* New Search */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">
          Yeni Rota Hesapla
        </h2>
        <RouteSearchForm
          locations={locations}
          initialFrom={fromId}
          initialTo={toId}
          initialClass={vehicleClass}
        />
      </div>
    </div>
  );
}

export default async function SonucPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const fromId = params.from || "";
  const toId = params.to || "";
  const vehicleClass = (params.class || "1") as VehicleClass;

  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-500">Hesaplanıyor...</p>
        </div>
      }
    >
      <ResultContent
        fromId={fromId}
        toId={toId}
        vehicleClass={vehicleClass}
      />
    </Suspense>
  );
}
