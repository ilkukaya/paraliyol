"use client";

import { useState, useRef, useEffect } from "react";
import type { Location } from "@/types";

interface LocationAutocompleteProps {
  locations: Location[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  label: string;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g");
}

export default function LocationAutocomplete({
  locations,
  value,
  onChange,
  placeholder,
  label,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLocation = locations.find((l) => l.id === value);

  useEffect(() => {
    if (selectedLocation && !query) {
      setQuery(selectedLocation.name);
    }
  }, [selectedLocation, query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = query.length > 0
    ? locations.filter((l) => {
        const normalizedQuery = normalizeText(query);
        const normalizedName = normalizeText(l.name);
        const normalizedIl = normalizeText(l.il);
        return (
          normalizedName.includes(normalizedQuery) ||
          normalizedIl.includes(normalizedQuery)
        );
      })
    : locations.filter((l) => l.popular);

  const handleSelect = (location: Location) => {
    onChange(location.id);
    setQuery(location.name);
    setIsOpen(false);
    setHighlightIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
    setHighlightIndex(-1);
    if (!e.target.value) {
      onChange("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(filtered[highlightIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 text-base"
        autoComplete="off"
      />
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
          {filtered.slice(0, 10).map((location, index) => (
            <li
              key={location.id}
              onClick={() => handleSelect(location)}
              className={`px-4 py-3 cursor-pointer text-sm ${
                index === highlightIndex
                  ? "bg-green-50 text-green-800"
                  : "hover:bg-gray-50 text-gray-800"
              }`}
            >
              <span className="font-medium">{location.name}</span>
              <span className="text-gray-400 ml-2">{location.il}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
