"use client";

import { useActionState, useState } from "react";
import type { PenerimaActionState } from "@/lib/actions/penerima";

interface Kecamatan {
  id_kecamatan: string;
  nama_kecamatan: string;
}

interface Desa {
  id_desa: string;
  id_kecamatan: string;
  nama_desa: string;
}

interface PenerimaInitialData {
  nama_kelompok: string;
  jenis_kelompok: string;
  nama_ketua: string | null;
  kontak: string | null;
  id_desa: string;
  luas_garapan_ha: number | null;
}

const JENIS_KELOMPOK_OPTIONS = [
  { value: "poktan", label: "Poktan" },
  { value: "gapoktan", label: "Gapoktan" },
  { value: "upja", label: "UPJA" },
  { value: "brigade", label: "Brigade" },
];

export default function FormPenerima({
  kecamatanList,
  desaList,
  initialData,
  action,
  submitLabel,
}: {
  kecamatanList: Kecamatan[];
  desaList: Desa[];
  initialData?: PenerimaInitialData;
  action: (prevState: PenerimaActionState, formData: FormData) => Promise<PenerimaActionState>;
  submitLabel: string;
}) {
  const initialKecamatan =
    (initialData && desaList.find((d) => d.id_desa === initialData.id_desa)?.id_kecamatan) ||
    kecamatanList[0]?.id_kecamatan ||
    "";

  const [selectedKecamatan, setSelectedKecamatan] = useState(initialKecamatan);
  const [selectedDesa, setSelectedDesa] = useState(initialData?.id_desa ?? "");
  const [state, formAction, isPending] = useActionState(action, { error: null });

  const filteredDesa = desaList.filter((d) => d.id_kecamatan === selectedKecamatan);
  const desaValue = filteredDesa.some((d) => d.id_desa === selectedDesa) ? selectedDesa : "";

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Nama Kelompok</label>
        <input
          name="nama_kelompok"
          defaultValue={initialData?.nama_kelompok}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Jenis Kelompok</label>
        <select
          name="jenis_kelompok"
          defaultValue={initialData?.jenis_kelompok ?? JENIS_KELOMPOK_OPTIONS[0].value}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          {JENIS_KELOMPOK_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Nama Ketua</label>
        <input
          name="nama_ketua"
          defaultValue={initialData?.nama_ketua ?? ""}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Kontak</label>
        <input
          name="kontak"
          defaultValue={initialData?.kontak ?? ""}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Kecamatan</label>
        <select
          value={selectedKecamatan}
          onChange={(e) => {
            setSelectedKecamatan(e.target.value);
            setSelectedDesa("");
          }}
          disabled={kecamatanList.length <= 1}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-100"
        >
          {kecamatanList.map((k) => (
            <option key={k.id_kecamatan} value={k.id_kecamatan}>
              {k.nama_kecamatan}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Desa</label>
        <select
          name="id_desa"
          value={desaValue}
          onChange={(e) => setSelectedDesa(e.target.value)}
          required
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          <option value="" disabled>
            Pilih desa
          </option>
          {filteredDesa.map((d) => (
            <option key={d.id_desa} value={d.id_desa}>
              {d.nama_desa}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Luas Garapan (ha)</label>
        <input
          name="luas_garapan_ha"
          type="number"
          step="0.01"
          min={0}
          defaultValue={initialData?.luas_garapan_ha ?? ""}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : submitLabel}
      </button>
    </form>
  );
}
