"use client";

import { useState } from "react";

export default function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState("sending");
    const body = new URLSearchParams(new FormData(e.currentTarget) as unknown as Record<string, string>).toString();
    try {
      const res = await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      setState(res.ok ? "ok" : "error");
    } catch {
      setState("error");
    }
  };

  if (state === "ok") {
    return <p className="card p-5 font-semibold text-sign-700 dark:text-sign-200">Mesajınız alındı, teşekkür ederiz. En kısa sürede dönüş yapacağız.</p>;
  }

  const field = "mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-base outline-none focus:border-sign-500";
  return (
    <form name="iletisim" onSubmit={submit} className="card grid gap-4 p-5 not-prose">
      <input type="hidden" name="form-name" value="iletisim" />
      <p hidden>
        <label>
          Bu alanı boş bırakın: <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </p>
      <label className="text-sm font-semibold">
        Adınız
        <input name="ad" required autoComplete="name" className={field} />
      </label>
      <label className="text-sm font-semibold">
        E-posta adresiniz
        <input name="eposta" type="email" required autoComplete="email" className={field} />
      </label>
      <label className="text-sm font-semibold">
        Konu
        <select name="konu" className={field}>
          <option>Hatalı ücret bildirimi</option>
          <option>Öneri</option>
          <option>Reklam ve iş birliği</option>
          <option>Genel</option>
        </select>
      </label>
      <label className="text-sm font-semibold">
        Mesajınız
        <textarea name="mesaj" required rows={5} className={field} />
      </label>
      <p className="muted text-xs">Gönderdiğiniz bilgiler yalnızca size yanıt vermek için kullanılır. Ayrıntılar için Gizlilik ve KVKK sayfamıza bakın.</p>
      <button disabled={state === "sending"} className="h-12 rounded-xl bg-sign-600 font-bold text-white hover:bg-sign-700 disabled:opacity-60">
        {state === "sending" ? "Gönderiliyor…" : "Gönder"}
      </button>
      {state === "error" && <p className="text-sm font-semibold text-red-600">Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.</p>}
    </form>
  );
}
