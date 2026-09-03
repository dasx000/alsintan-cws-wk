"use client";

import { useActionState, useState } from "react";
import type { AlsintanActionState } from "@/lib/actions/alsintan";
import { KONDISI_OPTIONS } from "@/lib/kondisi-alsintan";

interface JenisOption {
  id: string;
  nama_jenis: string;
}

interface SumberDanaOption {
  id: string;
  nama_sumber: string;
}

interface KecamatanOption {
  id_kecamatan: string;
  nama_kecamatan: string;
}

interface DesaOption {
  id_desa: string;
  id_kecamatan: string;
  nama_desa: string;
}

interface PenerimaOption {
  id: string;
  nama_kelompok: string;
  id_desa: string;
}

export interface AlsintanInitialData {
  id_jenis: string;
  merk: string | null;
  tipe: string | null;
  no_rangka: string | null;
  no_mesin: string | null;
  tahun_pengadaan: number;
  id_sumber_dana: string | null;
  no_bast: string | null;
  tanggal_bast: string | null;
  nilai_aset: number | null;
  kondisi: string;
  id_penerima_saat_ini: string;
  catatan: string | null;
}

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export default function FormAlsintan({
  jenisList,
  sumberDanaList,
  kecamatanList,
  desaList,
  penerimaList,
  initialData,
  action,
  submitLabel,
}: {
  jenisList: JenisOption[];
  sumberDanaList: SumberDanaOption[];
  kecamatanList: KecamatanOption[];
  desaList: DesaOption[];
  penerimaList: PenerimaOption[];
  initialData?: AlsintanInitialData;
  action: (prevState: AlsintanActionState, formData: FormData) => Promise<AlsintanActionState>;
  submitLabel: string;
}) {
  const initialPenerima = initialData
    ? penerimaList.find((p) => p.id === initialData.id_penerima_saat_ini)
    : undefined;
  const initialDesaOf = initialPenerima ? desaList.find((d) => d.id_desa === initialPenerima.id_desa) : undefined;

  const [selectedKecamatan, setSelectedKecamatan] = useState(
    initialDesaOf?.id_kecamatan ?? kecamatanList[0]?.id_kecamatan ?? ""
  );
  const [selectedDesa, setSelectedDesa] = useState(initialPenerima?.id_desa ?? "");
  const [selectedPenerima, setSelectedPenerima] = useState(initialData?.id_penerima_saat_ini ?? "");

  const [state, formAction, isPending] = useActionState(action, { error: null });

  const filteredDesa = desaList.filter((d) => d.id_kecamatan === selectedKecamatan);
  const desaValue = filteredDesa.some((d) => d.id_desa === selectedDesa) ? selectedDesa : "";

  const filteredPenerima = penerimaList.filter((p) => p.id_desa === desaValue);
  const penerimaValue = filteredPenerima.some((p) => p.id === selectedPenerima) ? selectedPenerima : "";

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Jenis Alsintan</label>
          <select name="id_jenis" defaultValue={initialData?.id_jenis} required className={inputClass}>
            <option value="" disabled>
              Pilih jenis
            </option>
            {jenisList.map((j) => (
              <option key={j.id} value={j.id}>
                {j.nama_jenis}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Kondisi</label>
          <select name="kondisi" defaultValue={initialData?.kondisi ?? "baik"} required className={inputClass}>
            {KONDISI_OPTIONS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Merk</label>
          <input name="merk" defaultValue={initialData?.merk ?? ""} className={inputClass} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tipe</label>
          <input name="tipe" defaultValue={initialData?.tipe ?? ""} className={inputClass} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">No. Rangka</label>
          <input name="no_rangka" defaultValue={initialData?.no_rangka ?? ""} className={inputClass} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">No. Mesin</label>
          <input name="no_mesin" defaultValue={initialData?.no_mesin ?? ""} className={inputClass} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tahun Pengadaan</label>
          <input
            name="tahun_pengadaan"
            type="number"
            defaultValue={initialData?.tahun_pengadaan ?? new Date().getFullYear()}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Sumber Dana</label>
          <select name="id_sumber_dana" defaultValue={initialData?.id_sumber_dana ?? ""} className={inputClass}>
            <option value="">- Tidak diisi -</option>
            {sumberDanaList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama_sumber}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">No. BAST</label>
          <input name="no_bast" defaultValue={initialData?.no_bast ?? ""} className={inputClass} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tanggal BAST</label>
          <input
            name="tanggal_bast"
            type="date"
            defaultValue={initialData?.tanggal_bast ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Nilai Aset (Rp)</label>
          <input
            name="nilai_aset"
            type="number"
            min={0}
            defaultValue={initialData?.nilai_aset ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="mb-3 text-sm font-medium text-gray-700">Penerima Saat Ini</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Kecamatan</label>
            <select
              value={selectedKecamatan}
              onChange={(e) => {
                setSelectedKecamatan(e.target.value);
                setSelectedDesa("");
                setSelectedPenerima("");
              }}
              className={inputClass}
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
              value={desaValue}
              onChange={(e) => {
                setSelectedDesa(e.target.value);
                setSelectedPenerima("");
              }}
              className={inputClass}
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
            <label className="mb-1 block text-sm font-medium text-gray-700">Kelompok Penerima</label>
            <select
              name="id_penerima_saat_ini"
              value={penerimaValue}
              onChange={(e) => setSelectedPenerima(e.target.value)}
              required
              className={inputClass}
            >
              <option value="" disabled>
                {filteredDesa.length === 0
                  ? "Pilih desa dulu"
                  : filteredPenerima.length === 0
                    ? "Belum ada penerima di desa ini"
                    : "Pilih kelompok"}
              </option>
              {filteredPenerima.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama_kelompok}
                </option>
              ))}
            </select>
          </div>
        </div>
        {filteredPenerima.length === 0 && desaValue && (
          <p className="mt-2 text-xs text-amber-700">
            Belum ada data penerima di desa ini. Tambahkan dulu lewat halaman Penerima.
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Catatan</label>
        <textarea
          name="catatan"
          defaultValue={initialData?.catatan ?? ""}
          rows={3}
          className={inputClass}
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : submitLabel}
      </button>
    </form>
  );
}
