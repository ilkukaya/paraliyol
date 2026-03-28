import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = generatePageMetadata(
  "Hakkımızda",
  "Paralıyol hakkında bilgi. Türkiye otoyol, köprü, tünel ve feribot geçiş ücreti hesaplama platformu.",
  "/hakkimizda"
);

export default function HakkimizdaPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Hakkımızda</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 space-y-4 text-gray-600">
        <p>
          <strong className="text-gray-900">Paralıyol</strong>, Türkiye&apos;deki
          tüm otoyol, köprü, tünel ve arabalı feribot geçiş ücretlerini tek bir
          platformda sunan ücretsiz bir hizmettir.
        </p>
        <p>
          Amacımız, sürücülerin bir noktadan diğerine giderken ödeyecekleri
          toplam geçiş ücretini kolay ve hızlı bir şekilde hesaplayabilmesini
          sağlamaktır.
        </p>
        <h2 className="text-xl font-bold text-gray-900 mt-6">Ne Sunuyoruz?</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>A noktasından B noktasına tüm geçiş ücretlerinin detaylı dökümü</li>
          <li>Tüm araç sınıfları için güncel fiyatlar</li>
          <li>KGM otoyolları, özel köprüler, tüneller ve feribotlar dahil kapsamlı veri</li>
          <li>Harita üzerinde rota görselleştirme</li>
        </ul>
        <h2 className="text-xl font-bold text-gray-900 mt-6">Veri Kaynakları</h2>
        <p>
          Ücret bilgileri Karayolları Genel Müdürlüğü (KGM), özel otoyol
          işletmeleri, İDO ve GESTAŞ gibi resmi kaynaklardan derlenmektedir.
          Fiyatlar bilgi amaçlıdır ve güncel ücretler için ilgili kurum
          sitelerinin kontrol edilmesi önerilir.
        </p>
        <h2 className="text-xl font-bold text-gray-900 mt-6">İletişim</h2>
        <p>
          Soru, öneri veya düzeltme talepleriniz için bizimle iletişime
          geçebilirsiniz.
        </p>
      </div>
    </div>
  );
}
