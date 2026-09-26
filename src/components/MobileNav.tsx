"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV } from "./nav";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Menüyü aç"
        aria-expanded={open}
        className="grid h-11 w-11 place-items-center rounded-full hover:bg-[var(--surface)]"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menü">
          <button className="absolute inset-0 bg-black/40" aria-label="Menüyü kapat" onClick={() => setOpen(false)} />
          <nav className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-[var(--surface)] p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[var(--border)]" />
            <ul className="grid gap-1">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3.5 text-lg font-semibold ${
                      pathname === item.href ? "bg-sign-50 text-sign-700 dark:bg-sign-900 dark:text-sign-100" : "hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    {item.label}
                    <span aria-hidden className="text-[var(--fg-muted)]">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
