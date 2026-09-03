import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeletePenerimaButton from "@/components/DeletePenerimaButton";

const PAGE_SIZE = 20;

// Cast manual karena project belum menjalankan `supabase gen types typescript`
// (perlu Supabase CLI) -- tanpa tipe database resmi, supabase-js menebak
// relasi FK bersarang sebagai array, padahal id_desa/id_kecamatan itu
// relasi satu-ke-satu.
interface PenerimaRow {
  id: string;
  nama_kelompok: string;
  jenis_kelompok: string;
  nama_ketua: string | null;
  luas_garapan_ha: number | null;
  master_desa: { nama_desa: string; master_kecamatan: { nama_kecamatan: string } | null } | null;
}

export default async function PenerimaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  const canWrite = profile?.role === "admin" || profile?.role === "penyuluh";
  const canDelete = profile?.role === "admin";

  const { data: penerimaListRaw, count } = await supabase
    .from("penerima")
    .select(
      "id, nama_kelompok, jenis_kelompok, nama_ketua, luas_garapan_ha, master_desa(nama_desa, master_kecamatan(nama_kecamatan))",
      { count: "exact" }
    )
    .order("nama_kelompok")
    .range(from, to);

  const penerimaList = (penerimaListRaw ?? []) as unknown as PenerimaRow[];
  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

  return (
    <main className="mx-auto max-w-6xl p-6">
      <Link href="/dashboard" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
        ← Dashboard
      </Link>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Penerima (Kelompok Tani)</h1>
        {canWrite && (
          <Link
            href="/penerima/tambah"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Tambah Data
          </Link>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Nama Kelompok</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Jenis</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Ketua</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Desa</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Kecamatan</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Luas (ha)</th>
              {canWrite && <th className="px-4 py-3 text-right font-medium text-gray-600">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {(penerimaList ?? []).map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{p.nama_kelompok}</td>
                <td className="px-4 py-3 text-gray-700">{p.jenis_kelompok}</td>
                <td className="px-4 py-3 text-gray-700">{p.nama_ketua ?? "-"}</td>
                <td className="px-4 py-3 text-gray-700">{p.master_desa?.nama_desa ?? "-"}</td>
                <td className="px-4 py-3 text-gray-700">
                  {p.master_desa?.master_kecamatan?.nama_kecamatan ?? "-"}
                </td>
                <td className="px-4 py-3 text-gray-700">{p.luas_garapan_ha ?? "-"}</td>
                {canWrite && (
                  <td className="space-x-2 px-4 py-3 text-right">
                    <Link
                      href={`/penerima/${p.id}/edit`}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </Link>
                    {canDelete && <DeletePenerimaButton id={p.id} nama={p.nama_kelompok} />}
                  </td>
                )}
              </tr>
            ))}
            {(penerimaList ?? []).length === 0 && (
              <tr>
                <td colSpan={canWrite ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
                  Belum ada data penerima.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <Link
            href={`/penerima?page=${Math.max(1, page - 1)}`}
            className={`rounded-md border border-gray-300 px-3 py-1.5 ${
              page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-gray-50"
            }`}
          >
            Sebelumnya
          </Link>
          <span className="text-gray-600">
            Halaman {page} dari {totalPages}
          </span>
          <Link
            href={`/penerima?page=${Math.min(totalPages, page + 1)}`}
            className={`rounded-md border border-gray-300 px-3 py-1.5 ${
              page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-gray-50"
            }`}
          >
            Berikutnya
          </Link>
        </div>
      )}
    </main>
  );
}
