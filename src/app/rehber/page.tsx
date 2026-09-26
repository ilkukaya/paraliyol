import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { GUIDES } from "@/content/guides";

export const metadata: Metadata = {
  title: "Rehber – HGS, İhlalli Geçiş, Araç Sınıfları ve Yol Masrafı",
  description: "Otoyol ve köprü kullanımı hakkında bilmeniz gerekenler: HGS nasıl alınır, ihlalli geçiş cezası, araç sınıfları, yol masrafı hesaplama ve 2026 zamları.",
  alternates: { canonical: "/rehber" },
};

export default function GuideIndex() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-10 pt-6">
      <Breadcrumbs items={[{ name: "Rehber", href: "/rehber" }]} />
      <h1 className="font-display text-3xl font-extrabold sm:text-5xl">Yolculuk rehberi</h1>
      <p className="muted mt-3 text-lg leading-8">Otoyol, köprü ve geçiş ücretleriyle ilgili en çok sorulan konular.</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {GUIDES.map((g) => (
          <li key={g.slug}>
            <Link href={`/rehber/${g.slug}`} className="card flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:border-sign-300">
              <span className="text-lg font-bold leading-snug">{g.title}</span>
              <span className="muted mt-2 text-sm leading-6">{g.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
