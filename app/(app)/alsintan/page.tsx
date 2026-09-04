import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { KONDISI_BADGE_STYLES, kondisiLabel } from "@/lib/kondisi-alsintan";

const PAGE_SIZE = 20;

// Cast manual karena project belum menjalankan `supabase gen types typescript`.
interface AlsintanRow {
  id: string;
  id_unit: string;
  tahun_pengadaan: number;
  kondisi: string;
  merk: string | null;
  tipe: string | null;
  master_jenis_alsintan: { nama_jenis: string } | null;
  penerima: { nama_kelompok: string } | null;
}

export default async function AlsintanPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  const [{ profile }, { data: rawList, count }] = await Promise.all([
    getCurrentProfile(),
    supabase
      .from("alsintan")
      .select(
        "id, id_unit, tahun_pengadaan, kondisi, merk, tipe, master_jenis_alsintan(nama_jenis), penerima(nama_kelompok)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to),
  ]);

  const canWrite = profile?.role === "admin" || profile?.role === "penyuluh";

  const alsintanList = (rawList ?? []) as unknown as AlsintanRow[];
  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Alsintan</h1>
          <p className="text-sm text-gray-500">{count ?? 0} unit terdata</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/alsintan/export"
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download size={16} />
            Ekspor CSV
          </a>
          {canWrite && (
            <Link
              href="/alsintan/tambah"
              className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <Plus size={16} />
              Tambah Data
            </Link>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">ID Unit</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Jenis</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Merk/Tipe</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Tahun</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Penerima</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Kondisi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {alsintanList.map((a) => (
              <tr key={a.id} className="cursor-pointer hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-900">
                  <Link href={`/alsintan/${a.id}`} className="hover:underline">
                    {a.id_unit}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-700">{a.master_jenis_alsintan?.nama_jenis ?? "-"}</td>
                <td className="px-4 py-3 text-gray-700">
                  {[a.merk, a.tipe].filter(Boolean).join(" / ") || "-"}
                </td>
                <td className="px-4 py-3 text-gray-700">{a.tahun_pengadaan}</td>
                <td className="px-4 py-3 text-gray-700">{a.penerima?.nama_kelompok ?? "-"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                      KONDISI_BADGE_STYLES[a.kondisi] ?? "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {kondisiLabel(a.kondisi)}
                  </span>
                </td>
              </tr>
            ))}
            {alsintanList.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Belum ada data alsintan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <Link
            href={`/alsintan?page=${Math.max(1, page - 1)}`}
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
            href={`/alsintan?page=${Math.min(totalPages, page + 1)}`}
            className={`rounded-md border border-gray-300 px-3 py-1.5 ${
              page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-gray-50"
            }`}
          >
            Berikutnya
          </Link>
        </div>
      )}
    </div>
  );
}
