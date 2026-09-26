import type { Metadata } from "next";
import Link from "next/link";
import { getLocations } from "@/lib/engine";
import { routeSlug } from "@/lib/engine/slugs";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Tüm Rotalar – Şehirler Arası Otoyol Ücretleri",
  description: "Türkiye'nin 81 ili ve popüler ilçeleri arasındaki tüm rotaların otoyol, köprü ve tünel geçiş ücretleri. Başlangıç şehrinizi seçin.",
  alternates: { canonical: "/rotalar" },
};

export default function RoutesIndex() {
  const locs = getLocations();
  const popular = locs.filter((l) => l.popular);
  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-6">
      <Breadcrumbs items={[{ name: "Rotalar", href: "/rotalar" }]} />
      <h1 className="font-display text-3xl font-extrabold sm:text-5xl">Şehirler arası rotalar</h1>
      <p className="muted mt-3 max-w-3xl text-lg leading-8">
        {locs.length} il ve ilçe arasındaki her rota için geçiş ücretini hesaplayabilirsiniz. Aşağıda en çok aranan başlangıç
        noktalarından popüler varış noktalarına giden rotaları bulabilirsiniz.
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {popular.map((from) => (
          <section key={from.id} className="card p-5">
            <h2 className="text-lg font-bold">{from.name} çıkışlı</h2>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {popular
                .filter((to) => to.id !== from.id && to.il !== from.il)
                .map((to) => (
                  <li key={to.id}>
                    <Link
                      href={`/${routeSlug(from.id, to.id)}`}
                      className="inline-block rounded-lg bg-[var(--surface-2)] px-2.5 py-1.5 text-sm hover:bg-sign-50 hover:text-sign-800 dark:hover:bg-sign-900 dark:hover:text-sign-100"
                    >
                      {to.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
