"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";

type Choice = "all" | "necessary";
const KEY = "paraliyol-consent";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

function applyConsent(choice: Choice) {
  const granted = choice === "all" ? "granted" : "denied";
  window.gtag?.("consent", "update", {
    ad_storage: granted,
    ad_user_data: granted,
    ad_personalization: granted,
    analytics_storage: granted,
  });
}

/** Google Consent Mode v2 defaults: everything denied until the visitor chooses. */
export const consentDefaultsScript = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});try{if(localStorage.getItem('${KEY}')==='all'){gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'})}}catch(e){}`;

export default function Consent({ gaId, adsenseClient }: { gaId: string; adsenseClient: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        if (!localStorage.getItem(KEY)) setOpen(true);
      } catch {
        setOpen(true);
      }
    });
    const reopen = () => setOpen(true);
    window.addEventListener("paraliyol:consent", reopen);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("paraliyol:consent", reopen);
    };
  }, []);

  const choose = (choice: Choice) => {
    try {
      localStorage.setItem(KEY, choice);
    } catch {}
    applyConsent(choice);
    setOpen(false);
  };

  return (
    <>
      {gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`gtag('js', new Date()); gtag('config', '${gaId}', { anonymize_ip: true });`}
          </Script>
        </>
      )}
      {adsenseClient && (
        <Script
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      )}
      {open && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Çerez tercihleri"
          className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
        >
          <p className="text-sm leading-6">
            Sitenin çalışması için zorunlu çerezleri kullanıyoruz. İzin verirseniz ziyaret istatistikleri ve reklamların
            kişiselleştirilmesi için de çerez kullanılır. Ayrıntılar:{" "}
            <Link href="/cerez-politikasi" className="font-semibold text-sign-600 underline underline-offset-2 dark:text-sign-300">
              Çerez politikası
            </Link>
          </p>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={() => choose("necessary")}
              className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold hover:bg-[var(--surface-2)]"
            >
              Yalnızca zorunlu
            </button>
            <button
              onClick={() => choose("all")}
              className="h-11 rounded-xl bg-sign-600 px-5 text-sm font-semibold text-white hover:bg-sign-700"
            >
              Tümünü kabul et
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function ConsentSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("paraliyol:consent"))}
      className="font-semibold text-sign-600 underline underline-offset-2 dark:text-sign-300"
    >
      Çerez tercihlerini değiştir
    </button>
  );
}
