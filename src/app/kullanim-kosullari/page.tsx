import type { Metadata } from "next";
import ProsePage from "@/components/ProsePage";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description: "Paralıyol kullanım koşulları ve sorumluluk reddi.",
  alternates: { canonical: "/kullanim-kosullari" },
};

export default function TermsPage() {
  return (
    <ProsePage title="Kullanım koşulları" path="/kullanim-kosullari" updated="26 Eylül 2026">
      <p>Paralıyol&apos;u kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız.</p>
      <h2>Bilgilendirme amaçlıdır</h2>
      <p>
        Sitedeki ücret, mesafe ve süre bilgileri resmi tarifeler ve yol ağı modeli kullanılarak hesaplanır, ancak yalnızca
        bilgilendirme amaçlıdır. Tahsil edilen gerçek tutar kullanılan gişelere, geçiş saatine, tarifedeki değişikliklere ve
        işletmecinin uygulamalarına göre farklılık gösterebilir. Paralıyol, hesaplamalara dayanılarak verilen kararlardan doğabilecek
        zararlardan sorumlu tutulamaz.
      </p>
      <h2>Üçüncü taraf bağlantıları</h2>
      <p>Sitede otel, araç kiralama ve benzeri hizmetlere bağlantılar bulunabilir. Bu hizmetler ilgili şirketlerin kendi koşullarına tabidir.</p>
      <h2>Fikri mülkiyet</h2>
      <p>Sitenin tasarımı, yazılımı ve içerikleri Paralıyol&apos;a aittir. Resmi tarife verileri ilgili kamu kurumlarına aittir.</p>
    </ProsePage>
  );
}
