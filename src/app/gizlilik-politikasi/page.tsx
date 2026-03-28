import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = generatePageMetadata(
  "Gizlilik Politikası",
  "Paralıyol gizlilik politikası. Kişisel verilerin korunması ve KVKK uyumu.",
  "/gizlilik-politikasi"
);

export default function GizlilikPolitikasiPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Gizlilik Politikası
      </h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 space-y-4 text-gray-600 text-sm">
        <p>Son güncelleme: 15 Ocak 2026</p>

        <h2 className="text-lg font-bold text-gray-900 mt-4">1. Genel Bilgi</h2>
        <p>
          Paralıyol (&quot;biz&quot;, &quot;bizim&quot;) olarak, gizliliğinize önem veriyoruz.
          Bu gizlilik politikası, sitemizi kullanırken toplanan bilgileri ve bu
          bilgilerin nasıl kullanıldığını açıklamaktadır.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-4">
          2. Toplanan Bilgiler
        </h2>
        <p>Sitemiz üyelik gerektirmez. Aşağıdaki bilgiler otomatik olarak toplanabilir:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>IP adresi</li>
          <li>Tarayıcı türü ve sürümü</li>
          <li>Ziyaret edilen sayfalar ve süreleri</li>
          <li>Cihaz bilgileri</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900 mt-4">
          3. Çerezler
        </h2>
        <p>
          Sitemiz, deneyiminizi iyileştirmek ve reklam hizmetleri sunmak için
          çerezler kullanmaktadır. Detaylı bilgi için Çerez Politikamızı
          inceleyebilirsiniz.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-4">
          4. Üçüncü Taraf Hizmetler
        </h2>
        <p>Sitemizde aşağıdaki üçüncü taraf hizmetler kullanılabilir:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Google AdSense / Ezoic (reklam)</li>
          <li>Google Analytics (analitik)</li>
          <li>OpenStreetMap (harita)</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900 mt-4">
          5. KVKK Uyumu
        </h2>
        <p>
          6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında,
          kişisel verileriniz yasal düzenlemelere uygun olarak işlenmektedir.
          Verilerinizle ilgili haklarınızı kullanmak için bizimle iletişime
          geçebilirsiniz.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-4">
          6. Değişiklikler
        </h2>
        <p>
          Bu gizlilik politikası zaman zaman güncellenebilir. Değişiklikler bu
          sayfada yayınlanacaktır.
        </p>
      </div>
    </div>
  );
}
