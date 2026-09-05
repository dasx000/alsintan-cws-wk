"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import PetaSebaranLoader from "@/components/PetaSebaranLoader";
import MarkerLegend from "@/components/MarkerLegend";
import KepadatanLegend from "@/components/KepadatanLegend";
import { KONDISI_OPTIONS } from "@/lib/kondisi-alsintan";
import type { PetaMarkerData } from "@/components/PetaSebaran";

const selectClass =
  "rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500";

function uniqueSorted(values: (string | null)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => !!v))).sort((a, b) => a.localeCompare(b, "id"));
}

// Filter untuk peta di landing page -- ATM dari filter SIMANTAN Kaltim, tapi
// murni client-side (filter array marker yang sudah di-fetch, tidak lewat
// query-param + navigasi seperti PetaFilter.tsx di /peta) supaya klik filter
// tidak memicu reload halaman / lompat scroll dari seksi Sebaran. Default
// tersembunyi di balik tombol "Filter", sama seperti pola SIMANTAN.
export default function LandingPetaFilter({ markers }: { markers: PetaMarkerData[] }) {
  const [open, setOpen] = useState(false);
  const [jenis, setJenis] = useState("");
  const [kondisi, setKondisi] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [tahun, setTahun] = useState("");
  const [sumberDana, setSumberDana] = useState("");

  const jenisOptions = useMemo(() => uniqueSorted(markers.map((m) => m.nama_jenis)), [markers]);
  const kecamatanOptions = useMemo(() => uniqueSorted(markers.map((m) => m.nama_kecamatan)), [markers]);
  const sumberDanaOptions = useMemo(() => uniqueSorted(markers.map((m) => m.nama_sumber_dana)), [markers]);
  const tahunOptions = useMemo(
    () => Array.from(new Set(markers.map((m) => m.tahun_pengadaan))).sort((a, b) => b - a),
    [markers]
  );

  const filtered = markers.filter((m) => {
    if (jenis && m.nama_jenis !== jenis) return false;
    if (kondisi && m.kondisi !== kondisi) return false;
    if (kecamatan && m.nama_kecamatan !== kecamatan) return false;
    if (tahun && String(m.tahun_pengadaan) !== tahun) return false;
    if (sumberDana && m.nama_sumber_dana !== sumberDana) return false;
    return true;
  });

  const activeCount = [jenis, kondisi, kecamatan, tahun, sumberDana].filter(Boolean).length;

  return (
    <div className="mt-10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
      >
        <SlidersHorizontal size={15} className="text-green-600" />
        Filter
        {activeCount > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-green-600 text-[11px] font-semibold text-white">
            {activeCount}
          </span>
        )}
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {open && (
        <div className="mt-3 flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <select value={jenis} onChange={(e) => setJenis(e.target.value)} className={selectClass}>
            <option value="">Semua Jenis</option>
            {jenisOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          <select value={kondisi} onChange={(e) => setKondisi(e.target.value)} className={selectClass}>
            <option value="">Semua Kondisi</option>
            {KONDISI_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select value={kecamatan} onChange={(e) => setKecamatan(e.target.value)} className={selectClass}>
            <option value="">Semua Kecamatan</option>
            {kecamatanOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          <select value={tahun} onChange={(e) => setTahun(e.target.value)} className={selectClass}>
            <option value="">Semua Tahun</option>
            {tahunOptions.map((v) => (
              <option key={v} value={String(v)}>
                {v}
              </option>
            ))}
          </select>

          <select value={sumberDana} onChange={(e) => setSumberDana(e.target.value)} className={selectClass}>
            <option value="">Semua Sumber Dana</option>
            {sumberDanaOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setJenis("");
                setKondisi("");
                setKecamatan("");
                setTahun("");
                setSumberDana("");
              }}
              className="text-sm font-medium text-gray-500 hover:text-red-600"
            >
              Reset
            </button>
          )}
        </div>
      )}

      <p className="mt-3 text-sm text-gray-500">{filtered.length} unit ditampilkan</p>

      <div className="mt-2 overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
        <PetaSebaranLoader markers={filtered} />
        <MarkerLegend />
        <KepadatanLegend />
      </div>
    </div>
  );
}
