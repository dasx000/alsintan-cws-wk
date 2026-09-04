"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { KONDISI_OPTIONS } from "@/lib/kondisi-alsintan";

interface Option {
  value: string;
  label: string;
}

const selectClass =
  "rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500";

export default function PetaFilter({
  jenisOptions,
  kecamatanOptions,
  sumberDanaOptions,
  tahunOptions,
}: {
  jenisOptions: Option[];
  kecamatanOptions: Option[];
  sumberDanaOptions: Option[];
  tahunOptions: Option[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/peta?${params.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap gap-3">
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

      <select
        value={searchParams.get("sumber_dana") ?? ""}
        onChange={(e) => updateParam("sumber_dana", e.target.value)}
        className={selectClass}
      >
        <option value="">Semua Sumber Dana</option>
        {sumberDanaOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
