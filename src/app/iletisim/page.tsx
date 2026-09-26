import type { Metadata } from "next";
import ProsePage from "@/components/ProsePage";
import ContactForm from "@/components/ContactForm";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Paralıyol ile iletişime geçin: hatalı ücret bildirimi, öneri, reklam ve iş birliği talepleri.",
  alternates: { canonical: "/iletisim" },
};

export default function ContactPage() {
  return (
    <ProsePage title="İletişim" path="/iletisim" lead="Hatalı bir ücret mi fark ettiniz, bir öneriniz mi var? Formu doldurun, en kısa sürede dönelim.">
      {CONTACT_EMAIL && (
        <p>
          E-posta: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      )}
      <ContactForm />
    </ProsePage>
  );
}
