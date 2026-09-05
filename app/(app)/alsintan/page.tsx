import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Eye, MapPin, Pencil, Plus, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { KONDISI_BADGE_STYLES, kondisiLabel } from "@/lib/kondisi-alsintan";
import { KATEGORI_RING_COLORS } from "@/lib/marker-icon";
import PageSizeSelect from "@/components/PageSizeSelect";
import DeleteAlsintanButton from "@/components/DeleteAlsintanButton";
import AlsintanFilter from "@/components/AlsintanFilter";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 10;

// Cast manual karena project belum menjalankan `supabase gen types typescript`.
interface AlsintanRow {
  id: string;
  id_unit: string;
  tahun_pengadaan: number;
  kondisi: string;
  master_jenis_alsintan: { nama_jenis: string; kategori: string } | null;
  penerima: string | null;
  desa: string | null;
  kecamatan: string | null;
}

const KATEGORI_INFO: Record<string, { label: string; badge: string }> = {
  pra_panen: { label: "Prapanen", badge: "bg-green-100 text-green-700" },
  pasca_panen: { label: "Pascapanen", badge: "bg-amber-100 text-amber-700" },
};

export default async function AlsintanPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    size?: string;
    jenis?: string;
    kategori?: string;
    kondisi?: string;
    kecamatan?: string;
    tahun?: string;
  }>;
}) {
  const { page: pageParam, size: sizeParam, jenis, kategori, kondisi, kecamatan, tahun } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const pageSize = PAGE_SIZE_OPTIONS.includes(Number(sizeParam)) ? Number(sizeParam) : DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();

  // Filter kategori butuh inner join ke master_jenis_alsintan supaya bisa
  // difilter (default embedded select adalah left join, nggak bisa dipakai
  // sebagai kondisi filter di PostgREST).
  let selectStr =
    "id, id_unit, tahun_pengadaan, kondisi, penerima, desa, kecamatan, master_jenis_alsintan(nama_jenis, kategori)";
  if (kategori) selectStr = selectStr.replace("master_jenis_alsintan(", "master_jenis_alsintan!inner(");

  let listQuery = supabase.from("alsintan").select(selectStr, { count: "exact" });
  if (jenis) listQuery = listQuery.eq("id_jenis", jenis);
  if (kondisi) listQuery = listQuery.eq("kondisi", kondisi);
  if (kecamatan) listQuery = listQuery.eq("kecamatan", kecamatan);
  if (tahun) listQuery = listQuery.eq("tahun_pengadaan", Number(tahun));
  if (kategori) listQuery = listQuery.eq("master_jenis_alsintan.kategori", kategori);
  listQuery = listQuery.order("created_at", { ascending: false }).range(from, to);

  const [{ profile }, { data: rawList, count }, { data: jenisList }, { data: kecamatanList }, { data: tahunRows }] =
    await Promise.all([
      getCurrentProfile(),
      listQuery,
      supabase.from("master_jenis_alsintan").select("id, nama_jenis").order("nama_jenis"),
      supabase.from("master_kecamatan").select("id_kecamatan, nama_kecamatan").order("nama_kecamatan"),
      supabase.from("alsintan").select("tahun_pengadaan"),
    ]);

  const canWrite = profile?.role === "admin" || profile?.role === "penyuluh";
  const canDelete = profile?.role === "admin";

  const alsintanList = (rawList ?? []) as unknown as AlsintanRow[];
  const totalPages = count ? Math.ceil(count / pageSize) : 1;
  const rangeStart = count && count > 0 ? from + 1 : 0;
  const rangeEnd = count ? Math.min(to + 1, count) : 0;

  const tahunOptions = Array.from(new Set((tahunRows ?? []).map((r) => r.tahun_pengadaan)))
    .sort((a, b) => b - a)
    .map((t) => ({ value: String(t), label: String(t) }));

  const activeFilters = { jenis, kategori, kondisi, kecamatan, tahun };
  function buildPageHref(targetPage: number) {
    const params = new URLSearchParams();
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set("page", String(targetPage));
    params.set("size", String(pageSize));
    return `/alsintan?${params.toString()}`;
  }

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
            Ekspor Excel
          </a>
          {canWrite && (
            <Link
              href="/alsintan/impor"
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Upload size={16} />
              Impor Excel
            </Link>
          )}
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

      <AlsintanFilter
        jenisOptions={(jenisList ?? []).map((j) => ({ value: j.id, label: j.nama_jenis }))}
        kecamatanOptions={(kecamatanList ?? []).map((k) => ({ value: k.nama_kecamatan, label: k.nama_kecamatan }))}
        tahunOptions={tahunOptions}
      />

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">ID Unit</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Jenis</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Kategori</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Kecamatan</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Desa</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Tahun</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Penerima</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Kondisi</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {alsintanList.map((a) => {
              const kategoriInfo = KATEGORI_INFO[a.master_jenis_alsintan?.kategori ?? ""];
              const ringColor = KATEGORI_RING_COLORS[a.master_jenis_alsintan?.kategori ?? ""] ?? "#9ca3af";
              return (
                <tr key={a.id} className="group hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-900">
                    <Link href={`/alsintan/${a.id}`} className="hover:underline">
                      {a.id_unit}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: ringColor }}
                      />
                      {a.master_jenis_alsintan?.nama_jenis ?? "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {kategoriInfo ? (
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${kategoriInfo.badge}`}
                      >
                        {kategoriInfo.label}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {a.kecamatan ? (
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <MapPin size={12} className="text-gray-400" />
                        {a.kecamatan}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{a.desa ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-700">{a.tahun_pengadaan}</td>
                  <td className="px-4 py-3 text-gray-700">{a.penerima ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                        KONDISI_BADGE_STYLES[a.kondisi] ?? "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {kondisiLabel(a.kondisi)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/alsintan/${a.id}`}
                        title="Lihat detail"
                        className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      >
                        <Eye size={15} />
                      </Link>
                      {canWrite && (
                        <Link
                          href={`/alsintan/${a.id}/edit`}
                          title="Edit"
                          className="inline-flex items-center justify-center rounded-md p-1.5 text-green-600 hover:bg-green-50"
                        >
                          <Pencil size={15} />
                        </Link>
                      )}
                      {canDelete && (
                        <DeleteAlsintanButton id={a.id} idUnit={a.id_unit} compact redirectTo={null} />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {alsintanList.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  Belum ada data alsintan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-gray-500">
          {count && count > 0 ? `Menampilkan ${rangeStart}–${rangeEnd} dari ${count} data` : "Tidak ada data"}
        </p>

        <div className="flex items-center gap-3">
          <PageSizeSelect basePath="/alsintan" />

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Link
                href={buildPageHref(Math.max(1, page - 1))}
                className={`flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 ${
                  page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-gray-50"
                }`}
              >
                <ChevronLeft size={15} />
                Sebelumnya
              </Link>
              <span className="text-gray-600">
                Halaman {page} dari {totalPages}
              </span>
              <Link
                href={buildPageHref(Math.min(totalPages, page + 1))}
                className={`flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 ${
                  page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-gray-50"
                }`}
              >
                Berikutnya
                <ChevronRight size={15} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
