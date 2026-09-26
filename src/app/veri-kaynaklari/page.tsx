import type { Metadata } from "next";
import Link from "next/link";
import ProsePage from "@/components/ProsePage";
import { getCrossings, getHighways } from "@/lib/engine";
import { trDate } from "@/lib/format";
import { LAST_DATA_CHECK } from "@/lib/site";

export const metadata: Metadata = {
  title: "Veri Kaynakları ve Hesaplama Yöntemi",
  description: "Paralıyol geçiş ücretlerini nereden alıyor ve rotaları nasıl hesaplıyor? Resmi KGM tarifeleri, güncelleme sıklığı ve yöntemin sınırları.",
  alternates: { canonical: "/veri-kaynaklari" },
};

export default function DataSourcesPage() {
  const highways = getHighways();
  const crossings = getCrossings();
  return (
    <ProsePage
      title="Veri kaynakları ve hesaplama yöntemi"
      path="/veri-kaynaklari"
      lead="Ücretleri nereden aldığımızı, rotaları nasıl hesapladığımızı ve hesaplamanın sınırlarını şeffaf şekilde açıklıyoruz."
      updated={trDate(LAST_DATA_CHECK)}
    >
      <h2>Tarife kaynakları</h2>
      <p>
        Otoyol ve köprü ücretleri, Karayolları Genel Müdürlüğü&apos;nün (KGM){" "}
        <a href="https://www.kgm.gov.tr/Sayfalar/KGM/SiteTr/Otoyollar/UcretlerYeni.aspx" rel="nofollow noopener" target="_blank">
          resmi geçiş ücretleri sayfasında
        </a>{" "}
        yayımlanan PDF tarifelerinden alınır. Bu dosyalar her gün otomatik olarak indirilir, tablo hücreleri konumlarına göre
        okunur ve hiçbir hücre eksik ya da fazla olmadığı doğrulanmadan siteye aktarılmaz.
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="py-2">Yol / geçiş</th>
            <th className="py-2">Tarife tarihi</th>
          </tr>
        </thead>
        <tbody>
          {highways.map((h) => (
            <tr key={h.code} className="border-t border-[var(--border)]">
              <td className="py-2">
                <Link href={`/otoyol-ucretleri/${h.code.toLowerCase()}`}>{h.name}</Link>
              </td>
              <td className="py-2">{trDate(h.validFrom)}</td>
            </tr>
          ))}
          {crossings
            .filter((c) => c.prices.some((p) => p > 0))
            .map((c) => (
              <tr key={c.id} className="border-t border-[var(--border)]">
                <td className="py-2">{c.name}{c.verified === false ? " (işletmeci/basın)" : ""}</td>
                <td className="py-2">{(c as { validFrom?: string }).validFrom ? trDate((c as { validFrom?: string }).validFrom!) : "—"}</td>
              </tr>
            ))}
        </tbody>
      </table>
      <p>
        Avrasya Tüneli ücretleri işletmecinin resmi duyurusundan, feribot bilgileri ise işletmeci ve basın duyurularından alınır; bu
        hatlar KGM tarifesinde yer almadığı için ilgili sayfalarda ayrıca belirtilir.
      </p>
      <h2>Rota nasıl hesaplanır?</h2>
      <p>
        Türkiye&apos;nin ücretli otoyol ağı; gişeler, kavşaklar, köprüler ve tünellerle birlikte bir yol ağı olarak modellenir. Ücretsiz
        devlet yolları il ve ilçe merkezleri arasındaki bağlantılarla temsil edilir. Başlangıç ve varış noktanız arasındaki en hızlı
        güzergâh bulunur; güzergâhta girilen ve çıkılan her otoyol gişesi çifti için ilgili tarife hücresi, geçilen her köprü ve
        tünel için de sabit ücret toplanır.
      </p>
      <p>
        &quot;Otoyolsuz rota&quot; seçeneği ücretli otoyolları hiç kullanmayan, köprü ve tünel geçişlerini ise mümkün olduğunca en ucuz
        şekilde yapan alternatif güzergâhı gösterir.
      </p>
      <h2>Sınırlar</h2>
      <ul>
        <li>Mesafe ve süre yaklaşık değerlerdir; gerçek trafik koşullarını içermez.</li>
        <li>İl ve ilçe için merkez noktası esas alınır. Farklı bir gişeden girip çıkarsanız ödeyeceğiniz tutar değişebilir; tüm gişe çiftlerinin ücretini otoyol sayfalarında görebilirsiniz.</li>
        <li>Gece tarifesi, abonelik ve kampanya indirimleri toplamlara yansıtılmaz.</li>
        <li>Gişede HGS&apos;den tahsil edilen tutar esastır. Hatalı bir değer görürseniz lütfen <Link href="/iletisim">bize bildirin</Link>.</li>
      </ul>
    </ProsePage>
  );
}
