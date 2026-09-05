"use client";

import { useMemo, useState } from "react";
import { Compass, Droplets, Search, SprayCan, Sprout, Tractor, Users, Wheat, Wrench, type LucideIcon } from "lucide-react";
import type { KecamatanDatum as KecamatanStatDatum } from "@/components/landing/TopKecamatanChart";

export interface KecamatanDetailRow {
  nama_kecamatan: string;
  nama_jenis: string;
  kategori: "pra_panen" | "pasca_panen";
  jumlah_unit: number;
  jumlah_kelompok: number;
  jumlah_desa: number;
}

const KATEGORI_STYLE: Record<string, { label: string; badge: string; icon: string; iconBg: string }> = {
  pra_panen: { label: "Prapanen", badge: "bg-green-100 text-green-700", icon: "text-green-600", iconBg: "bg-green-100" },
  pasca_panen: { label: "Pascapanen", badge: "bg-amber-100 text-amber-700", icon: "text-amber-600", iconBg: "bg-amber-100" },
};

// Ikon dibedakan per JENIS alat (bukan cuma kategori) supaya baris "Rincian
// per Jenis" tidak terasa seragam -- dicocokkan dari kata kunci nama_jenis,
// jatuh ke ikon kategori generik (Wrench/Wheat) kalau tidak match apa pun.
const JENIS_ICON_RULES: [RegExp, LucideIcon][] = [
  [/traktor/i, Tractor],
  [/pompa/i, Droplets],
  [/sprayer|semprot/i, SprayCan],
  [/transplanter|tanam/i, Sprout],
  [/wheat|panen|thresher|harvester|dryer|sortir|sorter|huller|milling/i, Wheat],
];

function iconForJenis(namaJenis: string, kategori: "pra_panen" | "pasca_panen"): LucideIcon {
  for (const [pattern, icon] of JENIS_ICON_RULES) {
    if (pattern.test(namaJenis)) return icon;
  }
  return kategori === "pasca_panen" ? Wheat : Wrench;
}

export default function KecamatanExplorer({
  stats,
  detail,
}: {
  stats: KecamatanStatDatum[];
  detail: KecamatanDetailRow[];
}) {
  const sorted = useMemo(() => [...stats].sort((a, b) => b.jumlah - a.jumlah), [stats]);
  const maxJumlah = Math.max(1, ...sorted.map((s) => s.jumlah));
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(sorted[0]?.nama_kecamatan ?? null);

  const filtered = sorted.filter((s) => s.nama_kecamatan.toLowerCase().includes(query.trim().toLowerCase()));

  const activeStat = sorted.find((s) => s.nama_kecamatan === selected);
  const activeDetail = detail
    .filter((d) => d.nama_kecamatan === selected)
    .sort((a, b) => b.jumlah_unit - a.jumlah_unit);
  const jenisCount = activeDetail.length;

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
          <Compass size={20} />
        </span>
        <div>
          <p className="font-semibold text-gray-900">Jelajah Kecamatan</p>
          <p className="text-sm text-gray-500">Cari dan pilih kecamatan untuk lihat rincian bantuan alsintan</p>
        </div>
      </div>

      <div className="relative mt-6">
        <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari kecamatan... (contoh: Banjit, Kasui)"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pr-4 pl-10 text-sm text-gray-700 outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-[260px_1fr]">
        {/* Panel kiri: daftar kecamatan */}
        <div className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1 md:border-r md:border-gray-100 md:pr-4">
          {filtered.length === 0 && <p className="py-6 text-center text-sm text-gray-400">Kecamatan tidak ditemukan.</p>}
          {filtered.map((s) => {
            const isActive = s.nama_kecamatan === selected;
            const intensity = s.jumlah / maxJumlah;
            return (
              <button
                key={s.nama_kecamatan}
                onClick={() => setSelected(s.nama_kecamatan)}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  isActive ? "border-green-200 bg-green-50" : "border-transparent hover:bg-gray-50"
                }`}
              >
                <span
                  className="h-8 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: `rgba(22, 163, 74, ${0.15 + intensity * 0.85})` }}
                />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm font-medium ${isActive ? "text-green-800" : "text-gray-700"}`}>
                    {s.nama_kecamatan}
                  </span>
                  <span className="block text-xs text-gray-400">{s.jumlah_kelompok} kelompok tani</span>
                </span>
                <span className={`shrink-0 text-sm font-bold ${isActive ? "text-green-700" : "text-gray-500"}`}>
                  {s.jumlah}
                </span>
              </button>
            );
          })}
        </div>

        {/* Panel kanan: detail kecamatan terpilih */}
        <div className="min-w-0">
          {!activeStat ? (
            <p className="py-10 text-center text-sm text-gray-400">Pilih kecamatan di daftar sebelah kiri.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-gray-900">{activeStat.nama_kecamatan}</h3>
                <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white">
                  {activeStat.jumlah} unit tersalurkan
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-green-50 p-4 text-center">
                  <Sprout size={18} className="mx-auto text-green-600" />
                  <p className="mt-1 text-xl font-bold text-green-800">{jenisCount}</p>
                  <p className="text-xs text-green-700">Jenis Alsintan</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-4 text-center">
                  <Users size={18} className="mx-auto text-blue-600" />
                  <p className="mt-1 text-xl font-bold text-blue-800">{activeStat.jumlah_kelompok}</p>
                  <p className="text-xs text-blue-700">Kelompok Tani</p>
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <Wrench size={15} className="text-gray-500" />
                  Rincian per Jenis
                </p>

                {activeDetail.length === 0 ? (
                  <p className="rounded-lg bg-gray-50 py-6 text-center text-sm text-gray-400">
                    Belum ada alsintan tercatat di kecamatan ini.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activeDetail.map((d) => {
                      const style = KATEGORI_STYLE[d.kategori] ?? KATEGORI_STYLE.pra_panen;
                      const JenisIcon = iconForJenis(d.nama_jenis, d.kategori);
                      return (
                        <div
                          key={d.nama_jenis}
                          className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5"
                        >
                          <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${style.iconBg} ${style.icon}`}>
                            <JenisIcon size={16} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-800">{d.nama_jenis}</p>
                            <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${style.badge}`}>
                              {style.label}
                            </span>
                          </div>
                          <div className="flex shrink-0 gap-4 text-right text-xs">
                            <div>
                              <p className="font-bold text-gray-900">{d.jumlah_unit}</p>
                              <p className="text-gray-400">unit</p>
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{d.jumlah_kelompok}</p>
                              <p className="text-gray-400">kelompok</p>
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{d.jumlah_desa}</p>
                              <p className="text-gray-400">desa</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
