"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { KONDISI_OPTIONS } from "@/lib/kondisi-alsintan";

interface Option {
  value: string;
  label: string;
}

const KATEGORI_OPTIONS = [
  { value: "pra_panen", label: "Prapanen" },
  { value: "pasca_panen", label: "Pascapanen" },
];

const FILTER_KEYS = ["jenis", "kategori", "kondisi", "kecamatan", "tahun"];

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

  const activeCount = FILTER_KEYS.filter((k) => searchParams.get(k)).length;

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`/alsintan?${params.toString()}`);
  }

  function resetFilters() {
    const params = new URLSearchParams(searchParams.toString());
    FILTER_KEYS.forEach((k) => params.delete(k));
    params.set("page", "1");
    router.push(`/alsintan?${params.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
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
  );
}
