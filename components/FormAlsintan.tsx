"use client";

import { useActionState, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Camera, ClipboardList, Copy, MapPin, StickyNote, Users } from "lucide-react";
import type { AlsintanActionState } from "@/lib/actions/alsintan";
import { KONDISI_OPTIONS } from "@/lib/kondisi-alsintan";
import { KATEGORI_OPTIONS } from "@/lib/jenis-alsintan-kategori";
import { parseCoordinateInput } from "@/lib/parse-coordinate";
import { compressImage } from "@/lib/compress-image";

function FieldLabel({ children, required = true }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="mb-1 block text-sm font-medium text-gray-700">
      {children}
      {required && <span className="text-red-600"> *</span>}
    </label>
  );
}

function SectionCard({
  icon,
  title,
  className = "",
  children,
}: {
  icon: ReactNode;
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-4 ${className}`}>
      <div className="mb-3 flex items-center gap-2 text-gray-800">
        {icon}
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

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
  kategori: string;
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
  luas_lahan_ha: number | null;
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

  const initialJenis = initialData ? jenisList.find((j) => j.id === initialData.id_jenis) : undefined;
  const [selectedKategori, setSelectedKategori] = useState(initialJenis?.kategori ?? KATEGORI_OPTIONS[0].value);
  const [selectedJenis, setSelectedJenis] = useState(initialJenis?.id ?? "");

  const filteredJenis = jenisList.filter((j) => j.kategori === selectedKategori);
  const jenisValue = filteredJenis.some((j) => j.id === selectedJenis) ? selectedJenis : "";

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
  const [coordText, setCoordText] = useState(
    initialData?.latitude != null && initialData?.longitude != null
      ? `${initialData.latitude.toFixed(6)}, ${initialData.longitude.toFixed(6)}`
      : ""
  );
  const [coordError, setCoordError] = useState<string | null>(null);

  // Input teks "lintang, bujur" dua arah dengan peta: ketik di sini update
  // posisi marker, klik/geser marker di peta update balik teks ini (lihat
  // handleMapPick). Formatnya dibikin longgar lewat parseCoordinateInput --
  // titik ATAU koma sbg desimal, koma/titik-koma/spasi sbg pemisah, boleh
  // ada huruf mata angin (N/S/E/W) atau notasi derajat-menit-detik, karena
  // hasil copy-paste dari app peta di tiap HP formatnya beda-beda.
  function handleCoordTextChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setCoordText(value);

    if (!value.trim()) {
      setCoordError(null);
      return;
    }
    const parsed = parseCoordinateInput(value);
    if (!parsed) {
      setCoordError("Format tidak dikenali. Boleh titik/koma, spasi/koma, huruf N/S/E/W, atau derajat-menit-detik.");
      return;
    }
    setCoordError(null);
    setLatitude(parsed.lat);
    setLongitude(parsed.lng);
  }

  // Begitu user selesai (blur) -- misalnya setelah paste format aneh dari
  // app peta HP -- tulis ulang ke format bersih, supaya langsung kelihatan
  // konfirmasi kalau inputnya berhasil kebaca benar. Tidak dilakukan di
  // handleCoordTextChange supaya tidak mengganggu saat masih mengetik.
  function handleCoordBlur() {
    if (!coordText.trim()) return;
    const parsed = parseCoordinateInput(coordText);
    if (parsed) setCoordText(`${parsed.lat.toFixed(6)}, ${parsed.lng.toFixed(6)}`);
  }

  function handleMapPick(lat: number, lng: number) {
    setLatitude(lat);
    setLongitude(lng);
    setCoordText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    setCoordError(null);
  }

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
      <SectionCard icon={<ClipboardList size={16} />} title="Informasi Unit">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>Kategori</FieldLabel>
          <select
            value={selectedKategori}
            onChange={(e) => {
              setSelectedKategori(e.target.value);
              setSelectedJenis("");
            }}
            required
            className={inputClass}
          >
            {KATEGORI_OPTIONS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel>Jenis Alsintan</FieldLabel>
          <select
            name="id_jenis"
            value={jenisValue}
            onChange={(e) => setSelectedJenis(e.target.value)}
            required
            className={inputClass}
          >
            <option value="" disabled>
              Pilih jenis
            </option>
            {filteredJenis.map((j) => (
              <option key={j.id} value={j.id}>
                {j.nama_jenis}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel>Kondisi</FieldLabel>
          <select name="kondisi" defaultValue={initialData?.kondisi ?? "baik"} required className={inputClass}>
            {KONDISI_OPTIONS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel>Tahun Pengadaan</FieldLabel>
          <input
            name="tahun_pengadaan"
            type="number"
            defaultValue={initialData?.tahun_pengadaan ?? new Date().getFullYear()}
            required
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel>Sumber Dana</FieldLabel>
          <select name="id_sumber_dana" defaultValue={initialData?.id_sumber_dana ?? ""} required className={inputClass}>
            <option value="" disabled>
              Pilih sumber dana
            </option>
            {sumberDanaList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama_sumber}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel required={false}>No. BAST</FieldLabel>
          <input name="no_bast" defaultValue={initialData?.no_bast ?? ""} className={inputClass} />
        </div>

        <div>
          <FieldLabel required={false}>Tanggal BAST</FieldLabel>
          <input
            name="tanggal_bast"
            type="date"
            defaultValue={initialData?.tanggal_bast ?? ""}
            className={inputClass}
          />
        </div>

      </div>
      </SectionCard>

      <SectionCard icon={<Users size={16} />} title="Penerima" className="bg-gray-50">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <FieldLabel>Kecamatan</FieldLabel>
            <select
              value={selectedKecamatan}
              onChange={(e) => {
                setSelectedKecamatan(e.target.value);
                setSelectedDesa("");
              }}
              required
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
            <FieldLabel>Desa</FieldLabel>
            <select
              value={desaValue}
              onChange={(e) => setSelectedDesa(e.target.value)}
              required
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
            <FieldLabel>Kelompok Penerima</FieldLabel>
            <input name="penerima" defaultValue={initialData?.penerima ?? ""} required className={inputClass} />
          </div>

          <div>
            <FieldLabel required={false}>Luas Lahan (Ha)</FieldLabel>
            <input
              name="luas_lahan_ha"
              type="number"
              step="0.01"
              min={0}
              defaultValue={initialData?.luas_lahan_ha ?? ""}
              placeholder="- opsional -"
              className={inputClass}
            />
          </div>
        </div>
        <input type="hidden" name="kecamatan" value={kecamatanNama} />
        <input type="hidden" name="desa" value={desaNama} />
      </SectionCard>

      {!initialData && (
        <SectionCard icon={<Copy size={16} />} title="Jumlah Unit Sekaligus" className="border-green-200 bg-green-50">
          <FieldLabel>Jumlah unit</FieldLabel>
          <input
            name="jumlah_unit"
            type="number"
            min={1}
            max={100}
            defaultValue={1}
            required
            className={`${inputClass} max-w-[140px] bg-white`}
          />
          <p className="mt-1 text-xs text-gray-600">
            Kalau 1 kelompok dapat beberapa unit identik sekaligus (mis. 5 Hand Sprayer), isi jumlahnya di sini --
            sistem otomatis membuat baris terpisah per unit dengan ID unit berurutan, memakai data yang sama di form
            ini untuk semuanya.
          </p>
        </SectionCard>
      )}

      <SectionCard icon={<Camera size={16} />} title="Foto Unit">
        <FieldLabel required={false}>Foto</FieldLabel>
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
      </SectionCard>

      <SectionCard icon={<MapPin size={16} />} title="Lokasi">
        <FieldLabel>Koordinat (lintang, bujur)</FieldLabel>
        <input
          type="text"
          value={coordText}
          onChange={handleCoordTextChange}
          onBlur={handleCoordBlur}
          placeholder="-4.337557, 104.587753"
          required
          className={`${inputClass} font-mono`}
        />
        {coordError && <p className="mt-1 text-xs text-red-600">{coordError}</p>}

        <div className="mt-3">
          <PetaLokasiPicker
            latitude={latitude}
            longitude={longitude}
            kecamatanNama={kecamatanNama}
            desaNama={desaNama}
            onChange={handleMapPick}
          />
        </div>
        <input type="hidden" name="latitude" value={latitude ?? ""} />
        <input type="hidden" name="longitude" value={longitude ?? ""} />
        <p className="mt-1 text-xs text-gray-500">
          Ketik/tempel koordinat langsung (bebas format -- titik atau koma, dengan/tanpa huruf N/S/E/W, boleh juga
          derajat-menit-detik), atau klik/geser marker di peta -- keduanya saling mengikuti.
        </p>
      </SectionCard>

      <SectionCard icon={<StickyNote size={16} />} title="Catatan">
        <textarea
          name="catatan"
          defaultValue={initialData?.catatan ?? ""}
          rows={3}
          className={inputClass}
        />
      </SectionCard>

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
