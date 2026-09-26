"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
const SLOTS: Record<string, string | undefined> = {
  top: process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP,
  inline: process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE,
  bottom: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM,
};

/**
 * Renders a responsive AdSense unit once a publisher id and slot id are
 * configured in the environment; renders nothing otherwise (no empty boxes).
 */
export default function AdSlot({ position, className = "" }: { position: "top" | "inline" | "bottom"; className?: string }) {
  const slot = SLOTS[position];
  const pushed = useRef(false);
  useEffect(() => {
    if (!CLIENT || !slot || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [slot]);
  if (!CLIENT || !slot) return null;
  return (
    <aside aria-label="Reklam" className={`my-8 ${className}`}>
      <p className="muted mb-1 text-center text-[11px] uppercase tracking-widest">Reklam</p>
      <ins
        className="adsbygoogle block min-h-[100px]"
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
