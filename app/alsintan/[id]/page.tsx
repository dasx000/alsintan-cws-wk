import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KONDISI_BADGE_STYLES, kondisiLabel } from "@/lib/kondisi-alsintan";
import DeleteAlsintanButton from "@/components/DeleteAlsintanButton";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  const canWrite = profile?.role === "admin" || profile?.role === "penyuluh";
  const canDelete = profile?.role === "admin";

  const { data: raw } = await supabase
    .from("alsintan")
    .select(
      `id, id_unit, merk, tipe, no_rangka, no_mesin, tahun_pengadaan, no_bast, tanggal_bast,
       nilai_aset, kondisi, catatan,
       master_jenis_alsintan(nama_jenis),
       master_sumber_dana(nama_sumber),
       penerima(nama_kelompok, nama_ketua, master_desa(nama_desa, master_kecamatan(nama_kecamatan)))`
    )
    .eq("id", id)
    .single();

  if (!raw) notFound();
  const alsintan = raw as unknown as AlsintanDetail;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/alsintan" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
        ← Kembali ke daftar
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

      <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-gray-200 p-4 sm:grid-cols-3">
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

      <div className="mb-6 rounded-lg border border-gray-200 p-4">
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

      {alsintan.catatan && (
        <div className="mb-6 rounded-lg border border-gray-200 p-4">
          <h2 className="mb-1 text-sm font-medium text-gray-700">Catatan</h2>
          <p className="text-sm text-gray-900">{alsintan.catatan}</p>
        </div>
      )}

      {canWrite && (
        <div className="flex gap-2">
          <Link
            href={`/alsintan/${id}/edit`}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </Link>
          {canDelete && <DeleteAlsintanButton id={id} idUnit={alsintan.id_unit} />}
        </div>
      )}
    </main>
  );
}
