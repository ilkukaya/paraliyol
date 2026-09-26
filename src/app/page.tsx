import Link from "next/link";
import RouteSearchForm from "@/components/RouteSearchForm";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import AdSlot from "@/components/AdSlot";
import { getCrossings, getHighways, getLocations } from "@/lib/engine";
import { featuredRoutes } from "@/lib/featured";
import { duration, km, tl, trDate } from "@/lib/format";
import { ANNOUNCEMENT, SITE_NAME, SITE_URL } from "@/lib/site";

export default function HomePage() {
  const routes = featuredRoutes();
  const highways = getHighways();
  const crossings = getCrossings().filter((c) => c.prices[0] > 0 && c.type !== "ferry");
  const latest = [...highways.map((h) => h.validFrom)].sort().at(-1)!;

  return (
    <>
      <section className="relative overflow-hidden bg-sign-700 text-white">
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-[var(--bg)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-4 pt-10 sm:pt-14">
          {ANNOUNCEMENT && (
            <p className="mb-5 inline-flex rounded-full bg-lane-400 px-3 py-1 text-sm font-bold text-sign-950">{ANNOUNCEMENT}</p>
          )}
          <h1 className="font-display max-w-3xl text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            Yola çıkmadan <span className="text-lane-400">geçiş ücretini</span> bilin.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-sign-50">
            Türkiye&apos;deki otoyol, köprü ve tünel ücretlerini resmi tarifelerle hesaplayın: gişe gişe döküm, tüm araç sınıfları,
            gidiş-dönüş ve yakıt maliyeti.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2 text-sm font-semibold">
            <li className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/25">KGM resmi tarifeleri</li>
            <li className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/25">{highways.length} otoyol · {crossings.length} köprü ve tünel</li>
            <li className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/25">Ücretsiz, üyeliksiz</li>
          </ul>
          <div className="mt-8">
            <RouteSearchForm locations={getLocations()} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        <section className="mt-12" aria-labelledby="populer">
          <div className="flex items-end justify-between gap-4">
            <h2 id="populer" className="text-2xl font-bold sm:text-3xl">Popüler rotalar</h2>
            <Link href="/rotalar" className="text-sm font-semibold text-sign-600 hover:underline dark:text-sign-300">Tümü →</Link>
          </div>
          <p className="muted mt-1 text-sm">Otomobil (1. sınıf), en hızlı rota. Tarifeler: {trDate(latest)} itibarıyla.</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {routes.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="card group flex h-full flex-col justify-between p-4 transition hover:-translate-y-0.5 hover:border-sign-300">
                  <span className="font-semibold leading-snug">
                    {r.from} <span className="text-sign-600 dark:text-sign-300">→</span> {r.to}
                  </span>
                  <span className="mt-3 flex items-end justify-between">
                    <span className="num font-display text-2xl font-extrabold">{tl(r.total)}</span>
                    <span className="muted num text-xs">{km(r.km)} · {duration(r.minutes)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <AdSlot position="top" />

        <section className="mt-14" aria-labelledby="kopruler">
          <h2 id="kopruler" className="text-2xl font-bold sm:text-3xl">Köprü ve tünel ücretleri</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {crossings.map((c) => (
              <li key={c.id}>
                <Link href={c.type === "tunnel" ? "/tunel-ucretleri" : `/kopru-ucretleri#${c.id}`} className="card flex items-center justify-between gap-3 p-4 hover:border-sign-300">
                  <span>
                    <span className="block font-semibold">{c.name}</span>
                    <span className="muted text-xs">Otomobil, tek geçiş</span>
                  </span>
                  <span className="num font-display text-xl font-extrabold">{tl(c.prices[0])}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-3" aria-label="Nasıl çalışır">
          {[
            ["1", "Rotanızı seçin", "131 il ve ilçe arasından başlangıç ve varış noktanızı seçin, aracınızın sınıfını işaretleyin."],
            ["2", "En hızlı rotayı hesaplıyoruz", "Otoyol ağındaki giriş-çıkış gişelerini, köprüleri ve tünelleri bulup KGM tarifesinden ücretlendiriyoruz."],
            ["3", "Masrafı planlayın", "Ücretsiz alternatif rotayı, gidiş-dönüş tutarını ve yakıt dahil toplam maliyeti görün."],
          ].map(([n, t, d]) => (
            <div key={n} className="card p-5">
              <span className="font-display grid h-9 w-9 place-items-center rounded-full bg-lane-400 font-extrabold text-sign-950">{n}</span>
              <h3 className="mt-3 text-lg font-bold">{t}</h3>
              <p className="muted mt-1 text-sm leading-6">{d}</p>
            </div>
          ))}
        </section>

        <section className="mt-14" aria-labelledby="otoyollar">
          <h2 id="otoyollar" className="text-2xl font-bold sm:text-3xl">Otoyol tarifeleri</h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {highways.map((h) => (
              <li key={h.code}>
                <Link href={`/otoyol-ucretleri/${h.code.toLowerCase()}`} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-semibold hover:border-sign-400">
                  <span className="rounded bg-sign-600 px-1.5 py-0.5 text-[11px] font-extrabold text-white">{h.code}</span>
                  {h.shortName ?? h.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <Faq
          items={[
            {
              q: "Otoyol ücreti nasıl hesaplanır?",
              a: "Otoyollarda ücret, girdiğiniz ve çıktığınız gişe arasındaki mesafeye ve aracınızın sınıfına göre belirlenir. Köprü ve tünellerde ise her geçiş için sabit ücret ödenir. Paralıyol bu tarifelerin tamamını KGM'nin yayımladığı resmi tablolardan alır.",
            },
            {
              q: "Aracım hangi sınıfa giriyor?",
              a: "Aks aralığı 3,20 metreden kısa iki akslı araçlar (otomobiller) 1. sınıftır. Aks aralığı 3,20 metre ve üzeri iki akslı araçlar (minibüs, kamyonet) 2. sınıf, 3 akslı araçlar 3. sınıf, 4-5 akslı araçlar 4. sınıf, 6 ve üzeri akslılar 5. sınıf, motosikletler ise 6. sınıftır.",
            },
            {
              q: "Geçiş ücretleri ne zaman güncelleniyor?",
              a: "KGM tarifeleri genellikle yılda bir veya iki kez (çoğunlukla 1 Ocak ve 1 Temmuz'da) güncellenir. Paralıyol resmi tarife dosyalarını her gün otomatik olarak kontrol eder ve değişiklikleri siteye yansıtır.",
            },
            {
              q: "Hesaplanan ücret kesin midir?",
              a: "Ücretler resmi tarifelerden hesaplanır, ancak gerçek tutar kullandığınız gişelere, geçiş saatine ve kampanyalara göre değişebilir. Gişede HGS'den tahsil edilen tutar esastır.",
            },
          ]}
        />
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: `${SITE_NAME} – Otoyol ve Köprü Ücreti Hesaplama`,
          url: SITE_URL,
          applicationCategory: "TravelApplication",
          operatingSystem: "Web",
          inLanguage: "tr-TR",
          offers: { "@type": "Offer", price: "0", priceCurrency: "TRY" },
          description: "Türkiye otoyol, köprü ve tünel geçiş ücretlerini resmi tarifelerle hesaplayan ücretsiz araç.",
        }}
      />
    </>
  );
}
