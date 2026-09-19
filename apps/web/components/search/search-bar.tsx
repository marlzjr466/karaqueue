"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchBar({
  onSearch,
  placeholder = "Search karaoke songs…",
  debounceMs = 400
}: {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => onSearch(value.trim()), debounceMs);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-11 pr-11"
        aria-label="Search karaoke songs"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
