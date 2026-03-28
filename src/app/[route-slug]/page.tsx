import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { VehicleClass } from "@/types";
import {
  getPopularRoutes,
  getLocations,
  getLocationById,
} from "@/lib/data-loader";
import { getTotalPrice } from "@/lib/toll-calculator";
import { generateRouteMetadata, generateFAQSchema, generateBreadcrumbSchema } from "@/lib/seo";
import { formatCurrency } from "@/lib/format";
import CostSummaryCard from "@/components/CostSummaryCard";
import TollBreakdownTable from "@/components/TollBreakdownTable";
import RouteSearchForm from "@/components/RouteSearchForm";
import AdPlaceholder from "@/components/AdPlaceholder";
import RouteMapWrapper from "@/components/RouteMapWrapper";

type PageParams = Promise<{ "route-slug": string }>;

export async function generateStaticParams() {
  const routes = getPopularRoutes();
  return routes.map((route) => ({
    "route-slug": route.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { "route-slug": slug } = await params;
  const routes = getPopularRoutes();
  const route = routes.find((r) => r.slug === slug);
  if (!route) return {};

  const from = getLocationById(route.from);
  const to = getLocationById(route.to);
  if (!from || !to) return {};

  return generateRouteMetadata(
    from.name,
    to.name,
    route.totalPrices["1"],
    slug
  );
}

export default async function RouteSlugPage({
  params,
}: {
  params: PageParams;
}) {
  const { "route-slug": slug } = await params;
  const routes = getPopularRoutes();
  const route = routes.find((r) => r.slug === slug);

  if (!route) notFound();

  const from = getLocationById(route.from);
  const to = getLocationById(route.to);
  if (!from || !to) notFound();

  const locations = getLocations();
  const vehicleClass: VehicleClass = "1";
  const totalPrice = getTotalPrice(route.tolls, vehicleClass);

  const allClassPrices: { class: VehicleClass; label: string; price: number }[] =
    [
      { class: "1", label: "Otomobil", price: getTotalPrice(route.tolls, "1") },
      { class: "2", label: "Minibüs", price: getTotalPrice(route.tolls, "2") },
      { class: "3", label: "Otobüs/Kamyon", price: getTotalPrice(route.tolls, "3") },
      { class: "4", label: "Ağır Kamyon", price: getTotalPrice(route.tolls, "4") },
      { class: "5", label: "Çok Ağır Kamyon", price: getTotalPrice(route.tolls, "5") },
      { class: "moto", label: "Motosiklet", price: getTotalPrice(route.tolls, "moto") },
    ];

  const faqSchema = generateFAQSchema([
    {
      question: `${from.name} - ${to.name} arası otoyol ücreti ne kadar?`,
      answer: `2026 yılı itibarıyla ${from.name} - ${to.name} arası 1. sınıf araç (otomobil) için toplam otoyol geçiş ücreti ${formatCurrency(totalPrice)}'dir.`,
    },
    {
      question: `${from.name} - ${to.name} arası kaç km?`,
      answer: `${from.name} - ${to.name} arası otoyol mesafesi yaklaşık ${route.totalDistanceKm} km'dir.`,
    },
    {
      question: `${from.name} - ${to.name} arası motosiklet ücreti ne kadar?`,
      answer: `${from.name} - ${to.name} arası motosiklet için toplam geçiş ücreti ${formatCurrency(getTotalPrice(route.tolls, "moto"))}'dir.`,
    },
  ]);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Ana Sayfa", url: "/" },
    { name: "Otoyol Ücretleri", url: "/otoyol-ucretleri" },
    { name: `${from.name} - ${to.name}`, url: `/${slug}` },
  ]);

  // Related routes
  const relatedRoutes = routes
    .filter(
      (r) =>
        r.slug !== slug &&
        (r.from === route.from || r.to === route.to || r.from === route.to || r.to === route.from)
    )
    .slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <CostSummaryCard
        fromName={from.name}
        toName={to.name}
        totalPrice={totalPrice}
        totalDistanceKm={route.totalDistanceKm}
        vehicleClass={vehicleClass}
        tollCount={route.tolls.length}
      />

      <RouteMapWrapper
        waypoints={route.waypoints as [number, number][]}
        tolls={route.tolls}
      />

      <TollBreakdownTable
        tolls={route.tolls}
        vehicleClass={vehicleClass}
        totalPrice={totalPrice}
      />

      {/* All Vehicle Classes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          {from.name} - {to.name} Tüm Araç Sınıfları Ücretleri
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">
                  Araç Sınıfı
                </th>
                <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700">
                  Toplam Ücret
                </th>
              </tr>
            </thead>
            <tbody>
              {allClassPrices.map((item) => (
                <tr key={item.class} className="border-b border-gray-100">
                  <td className="py-2 px-3 text-sm text-gray-800">
                    {item.label}
                  </td>
                  <td className="py-2 px-3 text-right font-semibold text-gray-900">
                    {formatCurrency(item.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AdPlaceholder slot="route-bottom" />

      {/* Related Routes */}
      {relatedRoutes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            İlgili Rotalar
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {relatedRoutes.map((r) => {
              const rFrom = getLocationById(r.from);
              const rTo = getLocationById(r.to);
              return (
                <a
                  key={r.slug}
                  href={`/${r.slug}`}
                  className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 hover:border-green-300 transition-colors"
                >
                  <span className="text-green-700 font-medium">
                    {rFrom?.name} → {rTo?.name}
                  </span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(r.totalPrices["1"])}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* SEO Content */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-3">
          {from.name} - {to.name} Otoyol Ücreti 2026
        </h2>
        <div className="text-gray-600 space-y-2 text-sm">
          <p>
            {from.name}&apos;dan {to.name}&apos;a otoyol ile giderken toplam{" "}
            {formatCurrency(totalPrice)} (1. sınıf araç) geçiş ücreti
            ödemektedir. Toplam rota mesafesi yaklaşık{" "}
            {route.totalDistanceKm} km olup, rota üzerinde{" "}
            {route.tolls.length} adet ücretli geçiş noktası bulunmaktadır.
          </p>
          <p>
            Ücretler HGS (Hızlı Geçiş Sistemi) ile otomatik olarak
            tahsil edilmektedir. Fiyatlar 2026 yılı güncel tarifelerine göre
            hesaplanmıştır.
          </p>
        </div>
      </section>

      {/* New Search */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">
          Farklı Rota Hesapla
        </h2>
        <RouteSearchForm locations={locations} />
      </div>
    </div>
  );
}
