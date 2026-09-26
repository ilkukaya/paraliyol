"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { Location } from "@/lib/engine/types";

const fold = (s: string) =>
  s
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşüâî]/g, (c) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i" })[c] ?? c);

interface Props {
  label: string;
  placeholder: string;
  locations: Location[];
  value: string;
  onChange: (id: string) => void;
  exclude?: string;
  icon: React.ReactNode;
}

export default function LocationCombobox({ label, placeholder, locations, value, onChange, exclude, icon }: Props) {
  const id = useId();
  const listId = `${id}-list`;
  const selected = locations.find((l) => l.id === value);
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const text = query ?? selected?.name ?? "";

  const options = useMemo(() => {
    const pool = locations.filter((l) => l.id !== exclude);
    const q = fold((query ?? "").trim());
    if (!q) return pool.filter((l) => l.popular).slice(0, 12);
    const scored = pool
      .map((l) => {
        const n = fold(l.name);
        const il = fold(l.il);
        const score = n.startsWith(q) ? 0 : n.split(/[\s(]+/).some((w) => w.startsWith(q)) ? 1 : n.includes(q) ? 2 : il.startsWith(q) ? 3 : 9;
        return { l, score };
      })
      .filter((x) => x.score < 9)
      .sort((a, b) => a.score - b.score || Number(b.l.type === "il") - Number(a.l.type === "il") || a.l.name.localeCompare(b.l.name, "tr"));
    return scored.slice(0, 10).map((x) => x.l);
  }, [locations, query, exclude]);

  const pick = (loc: Location) => {
    onChange(loc.id);
    setQuery(null);
    setOpen(false);
  };

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)]">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sign-600 dark:text-sign-300">{icon}</span>
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && options[active] ? `${listId}-${options[active].id}` : undefined}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="next"
          value={text}
          placeholder={placeholder}
          onFocus={(e) => {
            setOpen(true);
            e.currentTarget.select();
          }}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
            if (!e.target.value) onChange("");
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(a + 1, options.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && open && options[active]) {
              e.preventDefault();
              pick(options[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className="h-14 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] pl-11 pr-4 text-[1.05rem] font-semibold outline-none transition placeholder:font-normal placeholder:text-[var(--fg-muted)] focus:border-sign-500 focus:ring-4 focus:ring-sign-500/15"
        />
      </div>
      {open && options.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-xl"
        >
          {!query && <li className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">Popüler</li>}
          {options.map((loc, i) => (
            <li
              key={loc.id}
              id={`${listId}-${loc.id}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(loc)}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 ${i === active ? "bg-sign-50 dark:bg-sign-900" : ""}`}
            >
              <span className="font-semibold">{loc.name}</span>
              <span className="text-xs text-[var(--fg-muted)]">{loc.type === "ilce" ? loc.il : "il merkezi"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
