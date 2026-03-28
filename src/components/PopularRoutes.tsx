import Link from "next/link";
import type { PopularRoute, Location } from "@/types";
import { formatCurrency } from "@/lib/format";

interface PopularRoutesProps {
  routes: PopularRoute[];
  locations: Location[];
}

export default function PopularRoutes({
  routes,
  locations,
}: PopularRoutesProps) {
  const getLocationName = (id: string) => {
    const loc = locations.find((l) => l.id === id);
    return loc?.name || id;
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Popüler Rotalar
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {routes.map((route) => (
          <Link
            key={route.slug}
            href={`/${route.slug}`}
            className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-green-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-green-600 group-hover:text-green-700 font-medium truncate">
                {getLocationName(route.from)}
              </span>
              <svg
                className="w-4 h-4 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
              <span className="text-green-600 group-hover:text-green-700 font-medium truncate">
                {getLocationName(route.to)}
              </span>
            </div>
            <span className="ml-3 text-gray-900 font-bold whitespace-nowrap">
              {formatCurrency(route.totalPrices["1"])}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
