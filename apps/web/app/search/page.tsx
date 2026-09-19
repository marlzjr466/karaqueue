"use client";

import { useState } from "react";
import { AppNav } from "@/components/app/app-nav";
import { SearchBar } from "@/components/search/search-bar";
import { SearchResults } from "@/components/search/search-results";

export default function SearchPage() {
  const [query, setQuery] = useState("");

  return (
    <main className="min-h-screen bg-stage-gradient text-white">
      <AppNav active="search" />

      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-bold">Search karaoke songs</h1>
        <p className="mt-1 text-sm text-white/50">
          Find a song, add it to your queue, and keep the night going.
        </p>

        <div className="mt-6 max-w-lg">
          <SearchBar onSearch={setQuery} />
        </div>

        <div className="mt-8">
          <SearchResults query={query} />
        </div>
      </div>
    </main>
  );
}
