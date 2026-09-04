"use client";

import { useActionState, useRef, useState, type ChangeEvent } from "react";
import dynamic from "next/dynamic";
import type { AlsintanActionState } from "@/lib/actions/alsintan";
import { KONDISI_OPTIONS } from "@/lib/kondisi-alsintan";
import { compressImage } from "@/lib/compress-image";

const PetaLokasiPicker = dynamic(() => import("@/components/PetaLokasiPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[260px] items-center justify-center rounded-md border border-gray-300 text-sm text-gray-400">
      Memuat peta...
    </div>
  ),
});

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

export interface AlsintanInitialData {
  id_jenis: string;
  tahun_pengadaan: number;
  id_sumber_dana: string | null;
  no_bast: string | null;
  tanggal_bast: string | null;
  kondisi: string;
  penerima: string | null;
  desa: string | null;
  kecamatan: string | null;
  catatan: string | null;
  foto_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500";

export default function FormAlsintan({
  jenisList,
  sumberDanaList,
  kecamatanList,
  desaList,
  initialData,
  action,
  submitLabel,
}: {
  jenisList: JenisOption[];
  sumberDanaList: SumberDanaOption[];
  kecamatanList: KecamatanOption[];
  desaList: DesaOption[];
  initialData?: AlsintanInitialData;
  action: (prevState: AlsintanActionState, formData: FormData) => Promise<AlsintanActionState>;
  submitLabel: string;
}) {
  const initialKecamatan = initialData
    ? kecamatanList.find((k) => k.nama_kecamatan === initialData.kecamatan)
    : undefined;

  const [selectedKecamatan, setSelectedKecamatan] = useState(
    initialKecamatan?.id_kecamatan ?? kecamatanList[0]?.id_kecamatan ?? ""
  );

  const initialDesa = initialData
    ? desaList.find((d) => d.nama_desa === initialData.desa && d.id_kecamatan === initialKecamatan?.id_kecamatan)
    : undefined;

  const [selectedDesa, setSelectedDesa] = useState(initialDesa?.id_desa ?? "");

  const [state, formAction, isPending] = useActionState(action, { error: null });

  const filteredDesa = desaList.filter((d) => d.id_kecamatan === selectedKecamatan);
  const desaValue = filteredDesa.some((d) => d.id_desa === selectedDesa) ? selectedDesa : "";

  const kecamatanNama = kecamatanList.find((k) => k.id_kecamatan === selectedKecamatan)?.nama_kecamatan ?? "";
  const desaNama = filteredDesa.find((d) => d.id_desa === desaValue)?.nama_desa ?? "";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.foto_url ?? null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressError, setCompressError] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(initialData?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(initialData?.longitude ?? null);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressError(null);
    setIsCompressing(true);
    try {
      const compressed = await compressImage(file);

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(compressed);
      if (fileInputRef.current) fileInputRef.current.files = dataTransfer.files;

      setPreviewUrl(URL.createObjectURL(compressed));
    } catch (err) {
      setCompressError(err instanceof Error ? err.message : "Gagal memproses foto.");
    } finally {
      setIsCompressing(false);
    }
  }

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

      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="mb-3 text-sm font-medium text-gray-700">Penerima</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Kecamatan</label>
            <select
              value={selectedKecamatan}
              onChange={(e) => {
                setSelectedKecamatan(e.target.value);
                setSelectedDesa("");
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
            <select value={desaValue} onChange={(e) => setSelectedDesa(e.target.value)} className={inputClass}>
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
            <input name="penerima" defaultValue={initialData?.penerima ?? ""} required className={inputClass} />
          </div>
        </div>
        <input type="hidden" name="kecamatan" value={kecamatanNama} />
        <input type="hidden" name="desa" value={desaNama} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Foto Unit</label>
        <input
          ref={fileInputRef}
          name="foto"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
        />
        {isCompressing && <p className="mt-1 text-xs text-gray-500">Mengompres foto...</p>}
        {compressError && <p className="mt-1 text-xs text-red-600">{compressError}</p>}
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Pratinjau foto unit"
            className="mt-2 h-32 w-32 rounded-md border border-gray-200 object-cover"
          />
        )}
        <p className="mt-1 text-xs text-gray-500">
          Foto otomatis dikompres (maks ~500KB, lebar ~1000px) sebelum diupload.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Lokasi</label>
        <PetaLokasiPicker
          latitude={latitude}
          longitude={longitude}
          onChange={(lat, lng) => {
            setLatitude(lat);
            setLongitude(lng);
          }}
        />
        <input type="hidden" name="latitude" value={latitude ?? ""} />
        <input type="hidden" name="longitude" value={longitude ?? ""} />
        <p className="mt-1 text-xs text-gray-500">
          {latitude != null && longitude != null
            ? `Koordinat: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            : "Klik di peta untuk menandai lokasi unit."}
        </p>
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
        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : submitLabel}
      </button>
    </form>
  );
}
