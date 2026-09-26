# Paralıyol — yayın ve gelir rehberi

Bu belge sitenin şu anki durumunu ve **sizin yapmanız gereken** (hesap açma, onay gibi
benim yapamadığım) adımları sırayla anlatır. Hepsi ücretsizdir; yalnızca alan adı
(isteğe bağlı) yıllık küçük bir ücret gerektirir.

## Otomatik çalışanlar (sizden işlem gerekmez)

- **Fiyatlar:** GitHub her gün KGM'nin resmi tarife PDF'lerini indirir, doğrular ve değişiklik
  varsa siteyi günceller. Netlify yeni sürümü kendiliğinden yayınlar.
- **Yol mesafeleri:** Konum/gişe verisi değişince gerçek yol mesafeleri OpenStreetMap ile yeniden ölçülür.
- **Kalite kontrolü:** Her değişiklikte testler ve derleme çalışır; hata varsa yayına çıkmaz.

## 1. Google Search Console (1. gün, 10 dk) — en önemli adım

1. https://search.google.com/search-console → "Mülk ekle" → **URL öneki** → `https://paraliyol.netlify.app`
2. Doğrulama yöntemi olarak **HTML etiketi**ni seçin, `content="..."` içindeki kodu kopyalayın.
3. Netlify → paraliyol → Site configuration → Environment variables →
   `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` = kopyaladığınız kod → Deploys → "Trigger deploy".
4. Search Console'da "Doğrula"ya basın, sonra **Site haritaları** → `sitemap.xml` ekleyin.

Aynısını **Bing Webmaster Tools** (`NEXT_PUBLIC_BING_VERIFICATION`, ChatGPT ve Copilot aramaları Bing'i
kullanır) ve **Yandex Webmaster** (`NEXT_PUBLIC_YANDEX_VERIFICATION`) için de yapın.

## 2. Google Analytics 4 (1. gün, 5 dk)

https://analytics.google.com → yeni mülk → Web veri akışı → ölçüm kimliğini (`G-...`)
`NEXT_PUBLIC_GA_ID` olarak ekleyin. Çerez onayı (KVKK) sitede hazırdır.

## 3. Google AdSense (sitede 2–4 hafta içerik ve trafik oluştuktan sonra)

1. https://adsense.google.com → site: `paraliyol.netlify.app` (alan adı alırsanız onu yazın).
2. Yayıncı kimliğinizi (`ca-pub-...`) `NEXT_PUBLIC_ADSENSE_CLIENT` olarak ekleyin ve yeniden deploy edin.
   `ads.txt` ve AdSense kodu otomatik eklenir.
3. Onaydan sonra AdSense'te üç "görüntülü reklam birimi" oluşturup kimliklerini
   `NEXT_PUBLIC_ADSENSE_SLOT_TOP`, `NEXT_PUBLIC_ADSENSE_SLOT_INLINE`, `NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM`
   olarak ekleyin. Ya da AdSense'te yalnızca "Otomatik reklamlar"ı açın.

Not: AdSense bazen `*.netlify.app` alt alan adlarını onaylamakta zorlanır; kendi alan adınız
(ör. `paraliyol.com`, yıllık ~10 $) onay şansını ve güveni artırır. Alan adı alırsanız Netlify →
Domain management'tan bağlayın ve `NEXT_PUBLIC_SITE_URL` değişkenini yeni adresle güncelleyin.

## 4. İş ortaklığı (affiliate) gelirleri

Rota sayfalarının yan panelinde "Yolculuğunuzu planlayın" kutusu hazırdır:

| Ortaklık | Nereden başvurulur | Netlify değişkeni |
|---|---|---|
| Booking.com oteller | Booking.com Affiliate Partner Programme | `NEXT_PUBLIC_BOOKING_AID` |
| Araç kiralama | ör. DiscoverCars, Localrent veya Türk ajans ağları (Gelirortak, Admitad) | `NEXT_PUBLIC_CAR_RENTAL_URL` (bağlantıda şehir yerine `{city}` yazın) |
| Sigorta / kasko karşılaştırma | Türk sigorta karşılaştırma sitelerinin ortaklık programları | `NEXT_PUBLIC_INSURANCE_URL` |

Tanımlanmayan ortaklık görünmez; tanımladığınız anda sayfada belirir ve "sponsorlu" olarak işaretlenir.

## 5. İlk ay büyüme listesi

- Search Console'da "URL denetimi" ile ana sayfayı ve 5–10 popüler rotayı dizine eklenmeye gönderin.
- Rota sayfalarını WhatsApp / sosyal medyada paylaşın (sayfalarda hazır paylaşım düğmesi ve önizleme görseli var).
- Bayram ve tatil öncesi (trafik zirvesi) "İstanbul–İzmir", "İstanbul–Ankara" gibi sayfaları öne çıkarın.
- İletişim formuna gelen hatalı ücret bildirimlerini Netlify → Forms bölümünden takip edin.
- Rakip araçlarda olmayan şeyler zaten sitede: gişe gişe döküm, otoyolsuz alternatif, gidiş-dönüş,
  yakıt dahil toplam maliyet, kişi başı paylaşım.

## Bilinen sınırlar

- Gişe koordinatları (harita işaretleri) yaklaşık konumlardır; ücret hesabını etkilemez.
- Feribot ücretleri KGM tarifesinde yoktur; işletmeci/basın bilgisi olarak işaretlenmiştir.
