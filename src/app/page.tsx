import RouteSearchForm from "@/components/RouteSearchForm";
import PopularRoutes from "@/components/PopularRoutes";
import AdPlaceholder from "@/components/AdPlaceholder";
import { getLocations, getPopularRoutes, getSiteSettings } from "@/lib/data-loader";

export default function HomePage() {
  const locations = getLocations();
  const popularRoutes = getPopularRoutes();
  const settings = getSiteSettings();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          Türkiye Otoyol Ücret Hesaplama
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Otoyol, köprü, tünel ve feribot geçiş ücretlerini tek seferde
          hesaplayın.
        </p>
        {settings.announcement && (
          <div className="mt-4 inline-block bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-800">
            {settings.announcement}
          </div>
        )}
      </div>

      {/* Search Form */}
      <RouteSearchForm locations={locations} />

      {/* Popular Routes */}
      <div className="mt-12">
        <PopularRoutes routes={popularRoutes} locations={locations} />
      </div>

      {/* Ad */}
      <AdPlaceholder slot="home-mid" className="mt-8" />

      {/* SEO Content */}
      <section className="mt-12 bg-white rounded-2xl p-6 md:p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          2026 Türkiye Otoyol ve Geçiş Ücretleri
        </h2>
        <div className="prose prose-gray max-w-none text-gray-600 space-y-3">
          <p>
            Türkiye&apos;de otoyol kullanımı HGS (Hızlı Geçiş Sistemi) ile
            ücretlendirilmektedir. Karayolları Genel Müdürlüğü (KGM) tarafından
            işletilen devlet otoyollarının yanı sıra, özel sektör tarafından
            işletilen köprü, tünel ve feribot geçişleri de bulunmaktadır.
          </p>
          <p>
            Paralıyol ile herhangi bir noktadan diğerine giderken ödemeniz
            gereken tüm geçiş ücretlerini — otoyol gişeleri, köprüler, tüneller
            ve arabalı feribotlar dahil — tek seferde hesaplayabilirsiniz.
          </p>
          <h3 className="text-lg font-semibold text-gray-900 mt-4">
            Araç Sınıfları
          </h3>
          <ul className="list-disc pl-5">
            <li>
              <strong>1. Sınıf:</strong> Otomobil, arazi taşıtı, minivan
            </li>
            <li>
              <strong>2. Sınıf:</strong> Minibüs, hafif ticari araç
            </li>
            <li>
              <strong>3. Sınıf:</strong> Otobüs, kamyon (2 dingil)
            </li>
            <li>
              <strong>4. Sınıf:</strong> Ağır kamyon (3 dingil)
            </li>
            <li>
              <strong>5. Sınıf:</strong> Çok ağır kamyon (4+ dingil)
            </li>
            <li>
              <strong>Motosiklet:</strong> Tüm motosikletler
            </li>
          </ul>
          <p className="text-sm text-gray-500 mt-4">
            Son güncelleme: {settings.lastPriceUpdate}. Ücretler bilgi
            amaçlıdır, güncel fiyatlar için ilgili kurum sitelerini kontrol
            ediniz.
          </p>
        </div>
      </section>
    </div>
  );
}
