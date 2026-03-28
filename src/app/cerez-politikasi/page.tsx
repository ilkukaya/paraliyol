import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = generatePageMetadata(
  "Çerez Politikası",
  "Paralıyol çerez politikası. Çerez kullanımı hakkında bilgi.",
  "/cerez-politikasi"
);

export default function CerezPolitikasiPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Çerez Politikası
      </h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 space-y-4 text-gray-600 text-sm">
        <p>Son güncelleme: 15 Ocak 2026</p>

        <h2 className="text-lg font-bold text-gray-900 mt-4">Çerez Nedir?</h2>
        <p>
          Çerezler, web sitelerinin tarayıcınıza depoladığı küçük metin
          dosyalarıdır. Siteyi ziyaret ettiğinizde deneyiminizi iyileştirmek
          ve bazı işlevleri sağlamak için kullanılır.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-4">
          Kullandığımız Çerez Türleri
        </h2>

        <h3 className="font-semibold text-gray-800 mt-2">Zorunlu Çerezler</h3>
        <p>
          Sitenin düzgün çalışması için gerekli çerezlerdir. Çerez tercih
          ayarlarınızı saklamak için kullanılır.
        </p>

        <h3 className="font-semibold text-gray-800 mt-2">Analitik Çerezler</h3>
        <p>
          Ziyaretçi istatistiklerini anonim olarak toplamak için kullanılır.
          Bu bilgiler siteyi iyileştirmemize yardımcı olur.
        </p>

        <h3 className="font-semibold text-gray-800 mt-2">Reklam Çerezleri</h3>
        <p>
          Reklam ağları (Google AdSense, Ezoic) tarafından ilgi alanlarınıza
          uygun reklamlar göstermek için kullanılır.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-4">
          Çerezleri Yönetme
        </h2>
        <p>
          Tarayıcı ayarlarından çerezleri devre dışı bırakabilir veya
          silebilirsiniz. Ancak bu durumda sitenin bazı özellikleri düzgün
          çalışmayabilir.
        </p>
      </div>
    </div>
  );
}
