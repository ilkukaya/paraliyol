import Link from "next/link";
import { getCrossings } from "@/lib/engine";
import { tl } from "@/lib/format";

export interface Guide {
  slug: string;
  title: string;
  description: string;
  published: string;
  updated: string;
  body: () => React.ReactNode;
}

const bridge = (id: string) => getCrossings().find((c) => c.id === id);

export const GUIDES: Guide[] = [
  {
    slug: "hgs-nedir-nasil-alinir",
    title: "HGS nedir, nasıl alınır ve bakiye nasıl yüklenir?",
    description: "Hızlı Geçiş Sistemi (HGS) etiketi nereden alınır, hangi belgeler gerekir, bakiye nasıl yüklenir ve sorgulanır? Otoyol ve köprülerde ödeme rehberi.",
    published: "2026-09-26",
    updated: "2026-09-26",
    body: () => (
      <>
        <p>
          <strong>HGS (Hızlı Geçiş Sistemi)</strong>, Türkiye&apos;deki otoyol, köprü ve tünellerde geçiş ücretinin araç durmadan,
          ön camdaki etiket aracılığıyla otomatik olarak ödenmesini sağlayan sistemdir. Sistem PTT tarafından yürütülür. Eskiden
          kullanılan OGS sistemi 2022 yılında kaldırıldığından, bugün ücretli yolları kullanmak için aracınızda HGS etiketi bulunması
          gerekir.
        </p>
        <h2>HGS etiketi nereden alınır?</h2>
        <ul>
          <li>PTT şubeleri,</li>
          <li>HGS hizmeti veren bankaların şubeleri ve mobil uygulamaları,</li>
          <li>anlaşmalı akaryakıt istasyonları ve bazı otoyol hizmet noktaları.</li>
        </ul>
        <p>Etiket alırken araç ruhsatı ve ruhsat sahibinin kimlik bilgileri istenir. Etiket, aracın plakasıyla eşleştirilir.</p>
        <h2>HGS bakiyesi nasıl yüklenir?</h2>
        <p>
          Bakiye; PTT şubeleri ve PTT&apos;nin dijital kanalları, banka uygulamaları ve anlaşmalı ödeme noktaları üzerinden yüklenebilir.
          Bazı bankalar, bakiye azaldığında kartınızdan otomatik yükleme talimatı vermenize izin verir; uzun yola çıkmadan önce bu
          talimatı tanımlamak ihlalli geçiş riskini ortadan kaldırır.
        </p>
        <h2>Yolculuk öncesi ne kadar bakiye gerekir?</h2>
        <p>
          Gideceğiniz rotanın toplam geçiş ücretini <Link href="/">Paralıyol hesaplayıcısıyla</Link> öğrenip bakiyenizi en az bu tutar
          kadar tutmanız yeterlidir. Gidiş-dönüş için hesaplayıcıdaki &quot;Gidiş-dönüş&quot; seçeneğini kullanabilirsiniz.
        </p>
        <h2>Bakiyem yetmezse ne olur?</h2>
        <p>
          Bakiyesi yetersiz veya etiketi olmayan araçların geçişi <Link href="/rehber/ihlalli-gecis-cezasi">ihlalli geçiş</Link> olarak
          kaydedilir. Ücreti yasal süre içinde öderseniz ceza uygulanmaz.
        </p>
      </>
    ),
  },
  {
    slug: "ihlalli-gecis-cezasi",
    title: "İhlalli geçiş cezası nedir, nasıl sorgulanır ve ödenir?",
    description: "Otoyol ve köprüden HGS'siz veya yetersiz bakiyeyle geçince ne olur? İhlalli geçiş için 15 günlük ödeme süresi, ceza tutarı ve sorgulama yolları.",
    published: "2026-09-26",
    updated: "2026-09-26",
    body: () => (
      <>
        <p>
          HGS etiketi olmayan, etiketi okunamayan ya da bakiyesi yetersiz olan bir aracın ücretli otoyol, köprü veya tünelden geçişi
          <strong> ihlalli geçiş</strong> olarak kaydedilir. Bu durum hemen ceza anlamına gelmez: geçiş ücretini süresi içinde öderseniz
          yalnızca normal ücreti ödemiş olursunuz.
        </p>
        <h2>Ödeme süresi ve ceza</h2>
        <p>
          6001 sayılı Karayolları Genel Müdürlüğünün Hizmetleri Hakkında Kanun&apos;a göre ihlalli geçiş yapan araç sahibinin, geçiş
          tarihinden itibaren <strong>15 gün içinde</strong> geçiş ücretini cezasız olarak ödemesi gerekir. Bu süre içinde ödenmeyen
          ücretler için geçiş ücretinin <strong>4 katı</strong> tutarında idari para cezası uygulanır.
        </p>
        <h2>İhlalli geçiş nasıl sorgulanır?</h2>
        <ul>
          <li>Karayolları Genel Müdürlüğü&apos;nün internet sitesindeki ihlalli geçiş sorgulama ekranı,</li>
          <li>e-Devlet üzerindeki ilgili hizmetler,</li>
          <li>PTT ve HGS hizmeti veren bankaların kanalları üzerinden plaka ile sorgulama yapılabilir.</li>
        </ul>
        <h2>Nasıl önlenir?</h2>
        <p>
          Yola çıkmadan rotanızın toplam ücretini <Link href="/">hesaplayın</Link>, HGS bakiyenizi kontrol edin ve mümkünse otomatik
          yükleme talimatı tanımlayın. Kiralık araç kullanıyorsanız ihlalli geçişlerin kiralama şirketi üzerinden size nasıl
          yansıtılacağını sözleşmeden kontrol edin.
        </p>
        <p className="text-sm">Bu içerik genel bilgilendirme amaçlıdır; güncel ceza ve süreler için KGM duyurularını esas alın.</p>
      </>
    ),
  },
  {
    slug: "arac-siniflari",
    title: "Otoyol araç sınıfları: Aracım hangi sınıfa giriyor?",
    description: "KGM araç sınıflandırması: 1. sınıf otomobil, 2. sınıf minibüs ve kamyonet, 3-5. sınıf ağır vasıtalar ve 6. sınıf motosiklet. Aks aralığı ve aks sayısına göre sınıflar.",
    published: "2026-09-26",
    updated: "2026-09-26",
    body: () => (
      <>
        <p>
          Otoyol, köprü ve tünel ücretleri aracın <strong>aks sayısına</strong> ve iki akslı araçlarda <strong>aks aralığına</strong> göre
          belirlenen sınıfa göre değişir. KGM tarifelerinde kullanılan sınıflar şunlardır:
        </p>
        <div className="card my-6 overflow-x-auto p-0">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="bg-[var(--surface-2)] text-left">
              <tr>
                <th className="px-4 py-3">Sınıf</th>
                <th className="px-4 py-3">Tanım</th>
                <th className="px-4 py-3">Örnek</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["1. sınıf", "Aks aralığı 3,20 m'den kısa iki akslı araçlar", "Otomobil, SUV, çoğu hafif ticari"],
                ["2. sınıf", "Aks aralığı 3,20 m ve üzeri iki akslı araçlar", "Minibüs, kamyonet, uzun şasili panelvan"],
                ["3. sınıf", "Üç akslı araçlar", "Otobüs, 3 akslı kamyon"],
                ["4. sınıf", "Dört ve beş akslı araçlar", "Tır, çekici + dorse"],
                ["5. sınıf", "Altı ve daha fazla akslı araçlar", "Ağır nakliye araçları"],
                ["6. sınıf", "Motosikletler", "Tüm motosikletler"],
              ].map(([a, b, c]) => (
                <tr key={a} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 font-semibold">{a}</td>
                  <td className="px-4 py-3">{b}</td>
                  <td className="px-4 py-3">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2>Köprü kısıtlamaları</h2>
        <p>
          İstanbul&apos;daki 15 Temmuz Şehitler Köprüsü&apos;nü yalnızca 1. sınıf araçlar, Fatih Sultan Mehmet Köprüsü&apos;nü 1. sınıf
          araçlar ve kamyon-otobüs dışındaki 2. sınıf araçlar kullanabilir. Diğer ağır araçlar Yavuz Sultan Selim Köprüsü&apos;nü
          kullanmak zorundadır. Avrasya Tüneli&apos;nden yalnızca otomobil, minibüs ve motosikletler geçebilir. Paralıyol rota
          hesaplarken bu kısıtlamaları otomatik olarak uygular.
        </p>
      </>
    ),
  },
  {
    slug: "yol-masrafi-hesaplama",
    title: "Yol masrafı nasıl hesaplanır? Yakıt + otoyol ücreti",
    description: "Uzun yol masrafını hesaplamanın en kolay yolu: yakıt tüketimi, yakıt fiyatı, otoyol ve köprü ücretleri. Örnek hesaplama ve tasarruf ipuçları.",
    published: "2026-09-26",
    updated: "2026-09-26",
    body: () => (
      <>
        <p>Bir yolculuğun toplam maliyeti iki ana kalemden oluşur: <strong>yakıt</strong> ve <strong>geçiş ücretleri</strong>.</p>
        <h2>Formül</h2>
        <p>
          <strong>Yakıt maliyeti</strong> = mesafe (km) × tüketim (L/100 km) ÷ 100 × yakıt fiyatı (TL/L)
          <br />
          <strong>Toplam masraf</strong> = yakıt maliyeti + otoyol, köprü ve tünel ücretleri
        </p>
        <h2>Örnek</h2>
        <p>
          450 km&apos;lik bir yolculukta 100 km&apos;de 7 litre yakan bir otomobil yaklaşık 31,5 litre yakıt tüketir. Litre fiyatı 50 TL ise
          yakıt maliyeti 1.575 TL olur. Rotadaki geçiş ücretleri de eklendiğinde toplam masraf bulunur.
        </p>
        <p>
          Paralıyol&apos;da bir rota hesapladığınızda sağ taraftaki <em>Toplam yol masrafı</em> kutusuna yakıt fiyatınızı girmeniz
          yeterli; mesafe, geçiş ücretleri ve kişi başı maliyet otomatik hesaplanır.
        </p>
        <h2>Tasarruf ipuçları</h2>
        <ul>
          <li>Hesaplayıcıdaki <em>Otoyolsuz rota</em> seçeneğiyle köprü ve otoyol ücretinden ne kadar tasarruf edeceğinizi ve kaç dakika kaybedeceğinizi karşılaştırın.</li>
          <li>Avrasya Tüneli&apos;nde gece saatlerinde %50 indirimli tarife uygulanır.</li>
          <li>Sabit hız ve doğru lastik basıncı yakıt tüketimini belirgin şekilde azaltır.</li>
        </ul>
      </>
    ),
  },
  {
    slug: "otoyol-kopru-zammi-2026",
    title: "2026 otoyol ve köprü zamları: Ocak ve Temmuz tarifeleri",
    description: "2026'da otoyol ve köprü geçiş ücretlerine yapılan zamlar: KGM otoyollarında Ocak artışı, 1 Temmuz 2026'da Osmangazi, 1915 Çanakkale, Yavuz Sultan Selim ve Avrasya Tüneli ücretleri.",
    published: "2026-09-26",
    updated: "2026-09-26",
    body: () => {
      const osm = bridge("osmangazi-koprusu");
      return (
        <>
          <p>
            Türkiye&apos;de geçiş ücretleri genellikle yılda iki kez güncellenir. KGM&apos;nin işlettiği otoyol ve köprülerde yeni tarife yılbaşında,
            kamu-özel iş birliği (yap-işlet-devret) modeliyle işletilen köprü, otoyol ve tünellerde ise ayrıca yıl ortasında
            güncelleme yapılabilir.
          </p>
          <h2>Ocak 2026</h2>
          <p>
            KGM&apos;ye ait köprü ve otoyollarda geçiş ücretleri 1 Ocak 2026&apos;dan itibaren yeniden değerleme oranı olan %25,49 oranında
            artırıldı.
          </p>
          <h2>1 Temmuz 2026</h2>
          <p>
            KGM, yap-işlet-devret kapsamındaki yolların tarifelerini 1 Temmuz 2026&apos;dan geçerli olmak üzere güncelledi. Basına yansıyan
            açıklamalara göre otomobiller için Osmangazi ve 1915 Çanakkale köprülerinde ücret 995 TL&apos;den 1.170 TL&apos;ye, Yavuz Sultan
            Selim Köprüsü&apos;nde 95 TL&apos;den 110 TL&apos;ye, Avrasya Tüneli gündüz tarifesi 280 TL&apos;den 330 TL&apos;ye yükseldi. 15 Temmuz
            Şehitler ve Fatih Sultan Mehmet köprülerinde değişiklik yapılmadı.
          </p>
          <h2>Paralıyol bu değişiklikleri nasıl takip ediyor?</h2>
          <p>
            Hesaplamalarımız KGM&apos;nin yayımladığı resmi tarife dosyalarından yapılır. Sistemimiz bu dosyaları her gün otomatik olarak
            kontrol eder; KGM yeni bir tarife yayımladığında fiyatlar kendiliğinden güncellenir. Her sayfada, kullanılan tarifenin
            geçerlilik tarihini görebilirsiniz.{osm ? ` Sitemizde şu anda Osmangazi Köprüsü otomobil ücreti ${tl(osm.prices[0])} olarak kayıtlıdır.` : ""}
          </p>
          <p className="text-sm">
            Kaynaklar: <a href="https://www.kgm.gov.tr/Sayfalar/KGM/SiteTr/Otoyollar/UcretlerYeni.aspx" rel="nofollow noopener" target="_blank">KGM geçiş ücretleri</a>,{" "}
            <a href="https://www.avrasyatuneli.com/haberler-ve-duyurular/detay/1-temmuz-2026-itibariyla-gecerli-avrasya-tuneli-gecis-ucretleri-tarifesi" rel="nofollow noopener" target="_blank">Avrasya Tüneli duyurusu</a>.
          </p>
        </>
      );
    },
  },
];
