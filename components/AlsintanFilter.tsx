"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { KONDISI_OPTIONS } from "@/lib/kondisi-alsintan";

interface Option {
  value: string;
  label: string;
}

const KATEGORI_OPTIONS = [
  { value: "pra_panen", label: "Prapanen" },
  { value: "pasca_panen", label: "Pascapanen" },
];

const FILTER_KEYS = ["jenis", "kategori", "kondisi", "kecamatan", "tahun", "q"];

const selectClass =
  "rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500";

export default function AlsintanFilter({
  jenisOptions,
  kecamatanOptions,
  tahunOptions,
}: {
  jenisOptions: Option[];
  kecamatanOptions: Option[];
  tahunOptions: Option[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchText, setSearchText] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeCount = FILTER_KEYS.filter((k) => searchParams.get(k)).length;

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`/alsintan?${params.toString()}`);
  }

  // Debounce supaya tidak nge-query server tiap ketikan satu huruf --
  // tunggu jeda 400ms setelah user berhenti mengetik baru update URL.
  function handleSearchChange(value: string) {
    setSearchText(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParam("q", value.trim()), 400);
  }

  function resetFilters() {
    const params = new URLSearchParams(searchParams.toString());
    FILTER_KEYS.forEach((k) => params.delete(k));
    params.set("page", "1");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearchText("");
    router.push(`/alsintan?${params.toString()}`);
  }

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-3">
      <select
        value={searchParams.get("jenis") ?? ""}
        onChange={(e) => updateParam("jenis", e.target.value)}
        className={selectClass}
      >
        <option value="">Semua Jenis</option>
        {jenisOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("kategori") ?? ""}
        onChange={(e) => updateParam("kategori", e.target.value)}
        className={selectClass}
      >
        <option value="">Semua Kategori</option>
        {KATEGORI_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("kondisi") ?? ""}
        onChange={(e) => updateParam("kondisi", e.target.value)}
        className={selectClass}
      >
        <option value="">Semua Kondisi</option>
        {KONDISI_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("kecamatan") ?? ""}
        onChange={(e) => updateParam("kecamatan", e.target.value)}
        className={selectClass}
      >
        <option value="">Semua Kecamatan</option>
        {kecamatanOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("tahun") ?? ""}
        onChange={(e) => updateParam("tahun", e.target.value)}
        className={selectClass}
      >
        <option value="">Semua Tahun</option>
        {tahunOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={resetFilters}
          className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
        >
          Reset filter
        </button>
      )}
      </div>

      <div className="relative mt-3 max-w-sm">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchText}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Cari ID unit, penerima, desa, atau kecamatan..."
          className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>
    </div>
  );
}
