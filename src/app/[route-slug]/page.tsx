import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { parseRouteSlug, routeSlug } from "@/lib/engine/slugs";
import { getLocations } from "@/lib/engine";
import { popularPairs, relatedFrom, tariffDates, tripViewData } from "@/lib/routes";
import { ablative, dative, duration, km, tl, trDate } from "@/lib/format";
import { travelLinks } from "@/lib/affiliates";
import { absoluteUrl } from "@/lib/site";
import TripView from "@/components/TripView";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";
import TravelLinks from "@/components/TravelLinks";
import RouteSearchForm from "@/components/RouteSearchForm";

type Props = { params: Promise<{ "route-slug": string }> };

export const dynamicParams = true;

export function generateStaticParams() {
  return popularPairs().map(([a, b]) => ({ "route-slug": routeSlug(a.id, b.id) }));
}

function resolve(slug: string) {
  const pair = parseRouteSlug(slug);
  if (!pair) return null;
  const data = tripViewData(pair.from, pair.to);
  return data ? { ...pair, data } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { "route-slug": slug } = await params;
  const r = resolve(slug);
  if (!r) return {};
  const f = r.data.byClass["1"].fastest;
  const title = `${r.from.name} ${r.to.name} Otoyol Ücreti 2026: ${tl(f.total)}`;
  const description =
    f.tolls.length > 0
      ? `${ablative(r.from.name)} ${dative(r.to.name)} otomobille toplam geçiş ücreti ${tl(f.total)} (≈${km(f.km)}, ${duration(f.minutes)}). Gişe gişe döküm, köprü ücretleri, tüm araç sınıfları ve yakıt maliyeti.`
      : `${ablative(r.from.name)} ${dative(r.to.name)} en hızlı rotada ücretli otoyol, köprü veya tünel yok. Mesafe ≈${km(f.km)}, süre ${duration(f.minutes)}. Yakıt maliyetini hesaplayın.`;
  const canonical = `/${routeSlug(r.from.id, r.to.id)}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "article" },
  };
}

export default async function RoutePage({ params }: Props) {
  const { "route-slug": slug } = await params;
  const r = resolve(slug);
  if (!r) notFound();
  const canonical = routeSlug(r.from.id, r.to.id);
  if (canonical !== slug) permanentRedirect(`/${canonical}`);

  const { from, to, data } = r;
  const f = data.byClass["1"].fastest;
  const eco = data.byClass["1"].economic;
  const dates = tariffDates(data);
  const hasTolls = f.tolls.length > 0;

  const faq = [
    {
      q: `${from.name} ${to.name} arası otoyol ücreti ne kadar?`,
      a: hasTolls
        ? `${ablative(from.name)} ${dative(to.name)} otomobil (1. sınıf) ile en hızlı rotada ödenecek toplam geçiş ücreti ${tl(f.total)}'dir. Bu tutara ${f.tolls.map((t) => `${t.name} (${tl(t.price)})`).join(", ")} dahildir.`
        : `${ablative(from.name)} ${dative(to.name)} en hızlı rotada ücretli otoyol, köprü veya tünel bulunmuyor; geçiş ücreti ödemeniz gerekmez.`,
    },
    {
      q: `${from.name} ${to.name} arası kaç km ve kaç saat?`,
      a: `Karayolu ile yaklaşık ${km(f.km)} olan yolculuk, normal trafik koşullarında yaklaşık ${duration(f.minutes)} sürer. Mesafe ve süre, seçilen güzergâha göre değişebilir.`,
    },
    {
      q: `${from.name} ${to.name} motosiklet ve minibüs geçiş ücreti ne kadar?`,
      a: `Motosiklet (6. sınıf) için toplam ${tl(data.byClass["6"].fastest.total)}, minibüs ve hafif ticari araçlar (2. sınıf) için ${tl(data.byClass["2"].fastest.total)}, 3 akslı otobüs ve kamyonlar için ${tl(data.byClass["3"].fastest.total)} ödenir.`,
    },
    ...(eco
      ? [
          {
            q: `${from.name} ${to.name} arası otoyola girmeden gidilebilir mi?`,
            a: `Evet. Ücretli otoyolları kullanmayan alternatif rotada geçiş ücreti ${tl(eco.total)} olur; yolculuk yaklaşık ${duration(eco.minutes)} sürer (en hızlı rotaya göre ${duration(Math.max(0, eco.minutes - f.minutes))} daha uzun). Böylece ${tl(f.total - eco.total)} tasarruf edebilirsiniz.`,
          },
        ]
      : []),
    ...(hasTolls
      ? [
          {
            q: "Geçiş ücretleri nasıl ödenir?",
            a: "Türkiye'deki otoyol, köprü ve tünellerde ücretler HGS etiketi ile otomatik tahsil edilir; gişelerde nakit alınmaz. HGS'si olmayan veya bakiyesi yetersiz araçların geçişi ihlalli sayılır ve ücretin 15 gün içinde ödenmesi gerekir.",
          },
        ]
      : []),
  ];

  const related = relatedFrom(from, to.id, 6);
  const relatedTo = relatedFrom(to, from.id, 6);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-6">
      <Breadcrumbs items={[{ name: "Rotalar", href: "/rotalar" }, { name: `${from.name} – ${to.name}`, href: `/${canonical}` }]} />

      <header className="road-sign mb-6 px-6 py-7 sm:px-9 sm:py-9">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sign-100">Otoyol ve köprü ücreti · 2026</p>
        <h1 className="font-display mt-2 text-3xl font-extrabold leading-tight sm:text-5xl">
          {from.name} <span className="text-lane-400">→</span> {to.name}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-sign-50 sm:text-lg">
          {hasTolls ? (
            <>
              {ablative(from.name)} {dative(to.name)} otomobille toplam geçiş ücreti <strong className="text-white">{tl(f.total)}</strong>.
              Yaklaşık {km(f.km)} ve {duration(f.minutes)} sürüyor.
            </>
          ) : (
            <>
              Bu rotada ücretli geçiş yok. Yaklaşık {km(f.km)} ve {duration(f.minutes)} sürüyor.
            </>
          )}
        </p>
      </header>

      <TripView data={data} />

      <AdSlot position="inline" />

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <article className="prose-tr min-w-0">
          <h2>{from.name} {to.name} güzergâhı hakkında</h2>
          {hasTolls ? (
            <p>
              En hızlı rotada {f.tolls.length} ücretli geçiş bulunuyor:{" "}
              {f.tolls.map((t, i) => (
                <span key={i}>
                  {i > 0 ? ", " : ""}
                  {t.kind === "highway" ? (
                    <Link href={`/otoyol-ucretleri/${t.ref.toLowerCase()}`}>{t.name}</Link>
                  ) : (
                    <Link href={`/kopru-ucretleri#${t.ref}`}>{t.name}</Link>
                  )}{" "}
                  ({tl(t.price)})
                </span>
              ))}
              . Hesaplama, otomobil için Karayolları Genel Müdürlüğü&apos;nün yayımladığı resmi tarifeler kullanılarak yapılır;
              diğer araç sınıflarının ücretlerini yukarıdaki seçiciden görebilirsiniz.
            </p>
          ) : (
            <p>
              {ablative(from.name)} {dative(to.name)} en hızlı güzergâh ücretli otoyol, köprü veya tünel içermiyor. Yol masrafınız yalnızca
              yakıttan oluşur; yakıt fiyatınızı girerek toplam maliyeti hesaplayabilirsiniz.
            </p>
          )}
          {eco && (
            <p>
              Otoyolları kullanmak istemezseniz ücretsiz yollardan giden alternatif rotada geçiş ücreti {tl(eco.total)} olur ve yolculuk
              yaklaşık {duration(eco.minutes - f.minutes)} uzar.
            </p>
          )}
          <p className="text-sm">
            Tarife tarihi: {dates.length ? dates.map(trDate).join(", ") : "—"}. Ücretler KDV dahildir ve bilgilendirme amaçlıdır;
            kesin tutar geçiş anında HGS&apos;den tahsil edilen tutardır. Nasıl hesapladığımızı{" "}
            <Link href="/veri-kaynaklari">veri kaynakları</Link> sayfasında anlatıyoruz.
          </p>
          <Faq items={faq} />
        </article>

        <aside className="space-y-6">
          <TravelLinks links={travelLinks(to.il === to.name ? to.name : to.name.replace(/\s*\(.*\)/, ""))} />
          <section className="card p-5">
            <h2 className="text-lg font-bold">{ablative(from.name)} diğer rotalar</h2>
            <ul className="mt-3 space-y-1">
              {related.map((l) => (
                <li key={l.id}>
                  <Link className="flex justify-between rounded-lg px-2 py-2 hover:bg-[var(--surface-2)]" href={`/${routeSlug(from.id, l.id)}`}>
                    <span>{from.name} → {l.name}</span>
                    <span aria-hidden className="muted">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section className="card p-5">
            <h2 className="text-lg font-bold">{dative(to.name)} gelen rotalar</h2>
            <ul className="mt-3 space-y-1">
              {relatedTo.map((l) => (
                <li key={l.id}>
                  <Link className="flex justify-between rounded-lg px-2 py-2 hover:bg-[var(--surface-2)]" href={`/${routeSlug(l.id, to.id)}`}>
                    <span>{l.name} → {to.name}</span>
                    <span aria-hidden className="muted">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <section className="mt-14" aria-labelledby="yeni">
        <h2 id="yeni" className="mb-4 text-2xl font-bold">Başka bir rota hesaplayın</h2>
        <RouteSearchForm locations={getLocations()} initialFrom={from.id} />
      </section>

      <link rel="alternate" href={absoluteUrl(`/${canonical}`)} hrefLang="tr-TR" />
    </div>
  );
}
