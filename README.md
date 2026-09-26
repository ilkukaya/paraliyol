# Paralıyol

Türkiye'deki otoyol, köprü ve tünel geçiş ücretlerini **KGM'nin resmi tarifeleriyle** hesaplayan site.
Next.js 16 (App Router) + Tailwind CSS 4, Netlify'da yayınlanır.

## Nasıl çalışır?

| Parça | Yer |
|---|---|
| Resmi tarifeler (otoyol matrisleri, köprüler) | `data/tolls/*.json` — KGM PDF'lerinden üretilir |
| PDF ayrıştırıcıları ve senkronizasyon | `scripts/kgm/` (`npm run sync-tolls`, `npm run check-tolls`) |
| İl / ilçe listesi | `scripts/data/locations.src.tsv` → `npm run build-locations` → `data/locations.json` |
| Gerçek yol mesafeleri (OSM/OSRM) | `data/road-edges.json` — `scripts/osrm/build-road-edges.ts` |
| Rota motoru (Dijkstra, köprü kısıtları, ücret hesabı) | `src/lib/engine/` |
| Motor testleri | `tests/engine.test.ts` (`npm test`) |

### Otomatik işler (GitHub Actions)

- **KGM ücret senkronizasyonu** (`sync-tolls.yml`) — her gün resmi PDF'leri indirir; tarife değiştiyse
  verileri günceller, testleri ve derlemeyi çalıştırır, commit eder. Netlify siteyi otomatik yayınlar.
- **Yol ağı ölçümü** (`road-edges.yml`) — konum veya gişe verisi değişince yol bağlantılarının gerçek
  mesafe/sürelerini OSRM ile ölçer.
- **CI** (`ci.yml`) — her push'ta lint, test ve derleme.

## Ortam değişkenleri (Netlify → Site configuration → Environment variables)

| Değişken | Açıklama |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Özel alan adı alındığında, ör. `https://paraliyol.com` |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 ölçüm kimliği (`G-XXXX`) |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | AdSense yayıncı kimliği (`ca-pub-XXXX`); `ads.txt` otomatik oluşur |
| `NEXT_PUBLIC_ADSENSE_SLOT_TOP` / `_INLINE` / `_BOTTOM` | AdSense reklam birimi kimlikleri (isteğe bağlı) |
| `NEXT_PUBLIC_BOOKING_AID` | Booking.com iş ortaklığı kimliği |
| `NEXT_PUBLIC_CAR_RENTAL_URL` | Araç kiralama ortaklık bağlantısı, `{city}` yer tutuculu |
| `NEXT_PUBLIC_INSURANCE_URL` | Sigorta karşılaştırma ortaklık bağlantısı, `{city}` yer tutuculu |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console doğrulama kodu |
| `NEXT_PUBLIC_BING_VERIFICATION` / `NEXT_PUBLIC_YANDEX_VERIFICATION` | Bing / Yandex doğrulama kodları |
| `NEXT_PUBLIC_CONTACT_EMAIL` | İletişim sayfasında gösterilecek e-posta |

Değişken eklendikten sonra Netlify'da yeniden deploy gerekir.

## Geliştirme

```bash
npm ci
npm run dev        # http://localhost:3000
npm test           # rota motoru testleri
npm run build
```
