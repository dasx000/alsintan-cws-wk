import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { KONDISI_BADGE_STYLES, kondisiLabel } from "@/lib/kondisi-alsintan";
import DeleteAlsintanButton from "@/components/DeleteAlsintanButton";
import RiwayatMutasi from "@/components/riwayat/RiwayatMutasi";
import RiwayatPemanfaatan from "@/components/riwayat/RiwayatPemanfaatan";
import RiwayatServis from "@/components/riwayat/RiwayatServis";
import RiwayatMonev from "@/components/riwayat/RiwayatMonev";

interface AlsintanDetail {
  id: string;
  id_unit: string;
  merk: string | null;
  tipe: string | null;
  no_rangka: string | null;
  no_mesin: string | null;
  tahun_pengadaan: number;
  no_bast: string | null;
  tanggal_bast: string | null;
  nilai_aset: number | null;
  kondisi: string;
  catatan: string | null;
  foto_url: string | null;
  latitude: number | null;
  longitude: number | null;
  master_jenis_alsintan: { nama_jenis: string } | null;
  master_sumber_dana: { nama_sumber: string } | null;
  penerima: {
    nama_kelompok: string;
    nama_ketua: string | null;
    master_desa: { nama_desa: string; master_kecamatan: { nama_kecamatan: string } | null } | null;
  } | null;
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value ?? "-"}</dd>
    </div>
  );
}

export default async function AlsintanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { profile },
    { data: raw },
    { data: mutasiRaw },
    { data: pemanfaatanRaw },
    { data: servisRaw },
    { data: monevRaw },
    { data: penerimaRaw },
  ] = await Promise.all([
    getCurrentProfile(),
    supabase
      .from("alsintan")
      .select(
        `id, id_unit, merk, tipe, no_rangka, no_mesin, tahun_pengadaan, no_bast, tanggal_bast,
         nilai_aset, kondisi, catatan, foto_url, latitude, longitude,
         master_jenis_alsintan(nama_jenis),
         master_sumber_dana(nama_sumber),
         penerima(nama_kelompok, nama_ketua, master_desa(nama_desa, master_kecamatan(nama_kecamatan)))`
      )
      .eq("id", id)
      .single(),
    supabase
      .from("mutasi")
      .select(
        "id, tanggal, no_surat, keterangan, penerima_lama:penerima!id_penerima_lama(nama_kelompok), penerima_baru:penerima!id_penerima_baru(nama_kelompok)"
      )
      .eq("id_alsintan", id)
      .order("tanggal", { ascending: false }),
    supabase
      .from("pemanfaatan")
      .select("id, tanggal, luas_layanan_ha, komoditas, operator")
      .eq("id_alsintan", id)
      .order("tanggal", { ascending: false }),
    supabase
      .from("servis")
      .select("id, tanggal, kerusakan, biaya, sparepart, status")
      .eq("id_alsintan", id)
      .order("tanggal", { ascending: false }),
    supabase
      .from("monev")
      .select("id, tanggal_kunjungan, kondisi_terverifikasi, catatan, foto_url, petugas")
      .eq("id_alsintan", id)
      .order("tanggal_kunjungan", { ascending: false }),
    supabase
      .from("penerima")
      .select("id, nama_kelompok, master_desa(nama_desa, master_kecamatan(nama_kecamatan))")
      .order("nama_kelompok"),
  ]);

  if (!raw) notFound();
  const alsintan = raw as unknown as AlsintanDetail;
  const canWrite = profile?.role === "admin" || profile?.role === "penyuluh";
  const canDelete = profile?.role === "admin";

  interface PenerimaJoinRow {
    id: string;
    nama_kelompok: string;
    master_desa: { nama_desa: string; master_kecamatan: { nama_kecamatan: string } | null } | null;
  }

  interface MutasiJoinRow {
    id: string;
    tanggal: string;
    no_surat: string | null;
    keterangan: string | null;
    penerima_lama: { nama_kelompok: string } | null;
    penerima_baru: { nama_kelompok: string } | null;
  }
  const mutasiEntries = (mutasiRaw ?? []) as unknown as MutasiJoinRow[];
  const penerimaOptions = ((penerimaRaw ?? []) as unknown as PenerimaJoinRow[]).map((p) => ({
    id: p.id,
    label: `${p.nama_kelompok} (${p.master_desa?.nama_desa ?? "-"}, ${p.master_desa?.master_kecamatan?.nama_kecamatan ?? "-"})`,
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/alsintan" className="mb-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
        <ArrowLeft size={14} /> Kembali ke daftar
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-mono text-xl font-semibold text-gray-900">{alsintan.id_unit}</h1>
          <p className="text-sm text-gray-500">{alsintan.master_jenis_alsintan?.nama_jenis}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            KONDISI_BADGE_STYLES[alsintan.kondisi] ?? "bg-gray-100 text-gray-800"
          }`}
        >
          {kondisiLabel(alsintan.kondisi)}
        </span>
      </div>

      {alsintan.foto_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={alsintan.foto_url}
          alt={`Foto ${alsintan.id_unit}`}
          className="mb-6 h-48 w-48 rounded-lg border border-gray-200 object-cover"
        />
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <Field label="Merk" value={alsintan.merk} />
        <Field label="Tipe" value={alsintan.tipe} />
        <Field label="Tahun Pengadaan" value={alsintan.tahun_pengadaan} />
        <Field label="No. Rangka" value={alsintan.no_rangka} />
        <Field label="No. Mesin" value={alsintan.no_mesin} />
        <Field label="Sumber Dana" value={alsintan.master_sumber_dana?.nama_sumber} />
        <Field label="No. BAST" value={alsintan.no_bast} />
        <Field label="Tanggal BAST" value={alsintan.tanggal_bast} />
        <Field
          label="Nilai Aset"
          value={alsintan.nilai_aset != null ? `Rp ${alsintan.nilai_aset.toLocaleString("id-ID")}` : null}
        />
      </div>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-medium text-gray-700">Penerima Saat Ini</h2>
        {alsintan.penerima ? (
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Kelompok" value={alsintan.penerima.nama_kelompok} />
            <Field label="Ketua" value={alsintan.penerima.nama_ketua} />
            <Field label="Desa" value={alsintan.penerima.master_desa?.nama_desa} />
            <Field label="Kecamatan" value={alsintan.penerima.master_desa?.master_kecamatan?.nama_kecamatan} />
          </dl>
        ) : (
          <p className="text-sm text-gray-500">Belum ada penerima.</p>
        )}
      </div>

      {alsintan.latitude != null && alsintan.longitude != null && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-1 text-sm font-medium text-gray-700">Lokasi</h2>
          <p className="text-sm text-gray-900">
            {alsintan.latitude.toFixed(6)}, {alsintan.longitude.toFixed(6)}{" "}
            <a
              href={`https://www.openstreetmap.org/?mlat=${alsintan.latitude}&mlon=${alsintan.longitude}#map=17/${alsintan.latitude}/${alsintan.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Lihat di peta →
            </a>
          </p>
        </div>
      )}

      {alsintan.catatan && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-1 text-sm font-medium text-gray-700">Catatan</h2>
          <p className="text-sm text-gray-900">{alsintan.catatan}</p>
        </div>
      )}

      {canWrite && (
        <div className="mb-6 flex gap-2">
          <Link
            href={`/alsintan/${id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Pencil size={15} /> Edit
          </Link>
          {canDelete && <DeleteAlsintanButton id={id} idUnit={alsintan.id_unit} />}
        </div>
      )}

      <div className="space-y-6">
        <RiwayatMutasi
          idAlsintan={id}
          entries={mutasiEntries}
          penerimaOptions={penerimaOptions}
          canWrite={canWrite}
          canDelete={canDelete}
        />
        <RiwayatPemanfaatan
          idAlsintan={id}
          entries={pemanfaatanRaw ?? []}
          canWrite={canWrite}
          canDelete={canDelete}
        />
        <RiwayatServis idAlsintan={id} entries={servisRaw ?? []} canWrite={canWrite} canDelete={canDelete} />
        <RiwayatMonev idAlsintan={id} entries={monevRaw ?? []} canWrite={canWrite} canDelete={canDelete} />
      </div>
    </div>
  );
}
