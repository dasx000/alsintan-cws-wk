import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Eye, MapPin, MapPinned, Pencil, Plus, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { KONDISI_BADGE_STYLES, kondisiLabel } from "@/lib/kondisi-alsintan";
import { KATEGORI_RING_COLORS } from "@/lib/marker-icon";
import { canCreateAlsintan, canManageAlsintanRow, getAlsintanFilterScope } from "@/lib/alsintan-permissions";
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
  latitude: number | null;
  longitude: number | null;
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
    desa?: string;
    tahun?: string;
    q?: string;
  }>;
}) {
  const { page: pageParam, size: sizeParam, jenis, kategori, kondisi, kecamatan, desa, tahun, q } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const pageSize = PAGE_SIZE_OPTIONS.includes(Number(sizeParam)) ? Number(sizeParam) : DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  const { profile } = await getCurrentProfile();
  const scope = getAlsintanFilterScope(profile);

  // Filter kategori butuh inner join ke master_jenis_alsintan supaya bisa
  // difilter (default embedded select adalah left join, nggak bisa dipakai
  // sebagai kondisi filter di PostgREST).
  let selectStr =
    "id, id_unit, tahun_pengadaan, kondisi, penerima, desa, kecamatan, latitude, longitude, master_jenis_alsintan(nama_jenis, kategori)";
  if (kategori) selectStr = selectStr.replace("master_jenis_alsintan(", "master_jenis_alsintan!inner(");

  let listQuery = supabase.from("alsintan").select(selectStr, { count: "exact" });
  // Kunci wilayah -- koordinator dikunci ke kecamatan yang dia koordinasikan,
  // penyuluh biasa dikunci ke desa yang dia pegang (lihat getAlsintanFilterScope).
  // Diterapkan SELALU di server, tidak cuma lewat opsi dropdown yang dibatasi,
  // supaya tidak bisa dilewati dengan mengubah parameter URL manual.
  if (scope.lockedKecamatan) {
    listQuery = listQuery.in("kecamatan", scope.lockedKecamatan.length > 0 ? scope.lockedKecamatan : ["__none__"]);
  }
  if (scope.lockedDesa) {
    listQuery = listQuery.in("desa", scope.lockedDesa.length > 0 ? scope.lockedDesa : ["__none__"]);
  }
  if (jenis) listQuery = listQuery.eq("id_jenis", jenis);
  if (kondisi) listQuery = listQuery.eq("kondisi", kondisi);
  if (kecamatan) listQuery = listQuery.eq("kecamatan", kecamatan);
  if (desa) listQuery = listQuery.eq("desa", desa);
  if (tahun) listQuery = listQuery.eq("tahun_pengadaan", Number(tahun));
  if (kategori) listQuery = listQuery.eq("master_jenis_alsintan.kategori", kategori);
  if (q) {
    // Karakter koma/kurung/kutip punya arti khusus di sintaks filter or()
    // PostgREST -- dibuang saja dari kata kunci pencarian supaya query-nya
    // selalu valid (istilah pencarian di sini -- ID unit, nama, desa,
    // kecamatan -- memang tidak pernah memakai karakter itu).
    const safeQ = q.trim().replace(/[,()"\\]/g, " ").trim();
    if (safeQ) {
      const pattern = `%${safeQ}%`;
      listQuery = listQuery.or(
        `id_unit.ilike.${pattern},penerima.ilike.${pattern},desa.ilike.${pattern},kecamatan.ilike.${pattern}`
      );
    }
  }
  listQuery = listQuery
    .order("kecamatan", { ascending: true, nullsFirst: false })
    .order("desa", { ascending: true, nullsFirst: false })
    .order("penerima", { ascending: true, nullsFirst: false })
    .order("nama_jenis", { ascending: true, referencedTable: "master_jenis_alsintan" })
    .range(from, to);

  const [{ data: rawList, count }, { data: jenisList }, { data: kecamatanList }, { data: desaList }, { data: tahunRows }] =
    await Promise.all([
      listQuery,
      supabase.from("master_jenis_alsintan").select("id, nama_jenis").order("nama_jenis"),
      supabase.from("master_kecamatan").select("id_kecamatan, nama_kecamatan").order("nama_kecamatan"),
      supabase.from("master_desa").select("id_desa, nama_desa, master_kecamatan(nama_kecamatan)").order("nama_desa"),
      supabase.from("alsintan").select("tahun_pengadaan"),
    ]);

  const canCreate = canCreateAlsintan(profile);

  const alsintanList = (rawList ?? []) as unknown as AlsintanRow[];
  const totalPages = count ? Math.ceil(count / pageSize) : 1;
  const rangeStart = count && count > 0 ? from + 1 : 0;
  const rangeEnd = count ? Math.min(to + 1, count) : 0;

  const tahunOptions = Array.from(new Set((tahunRows ?? []).map((r) => r.tahun_pengadaan).filter((t) => t != null)))
    .sort((a, b) => b - a)
    .map((t) => ({ value: String(t), label: String(t) }));

  // Opsi dropdown kecamatan/desa dibatasi ke wilayah yang dikunci (kalau ada)
  // supaya secara UI pun penyuluh/koordinator tidak bisa memilih wilayah lain.
  const desaRows = (desaList ?? []) as unknown as {
    id_desa: string;
    nama_desa: string;
    master_kecamatan: { nama_kecamatan: string } | null;
  }[];
  const kecamatanOptions = (kecamatanList ?? [])
    .filter((k) => !scope.lockedKecamatan || scope.lockedKecamatan.includes(k.nama_kecamatan))
    .map((k) => ({ value: k.nama_kecamatan, label: k.nama_kecamatan }));
  const desaOptions = desaRows
    .filter((d) => {
      if (scope.lockedDesa) return scope.lockedDesa.includes(d.nama_desa);
      if (scope.lockedKecamatan) return !!d.master_kecamatan && scope.lockedKecamatan.includes(d.master_kecamatan.nama_kecamatan);
      return true;
    })
    .map((d) => ({ value: d.nama_desa, label: d.nama_desa, kecamatan: d.master_kecamatan?.nama_kecamatan ?? "" }));

  const activeFilters = { jenis, kategori, kondisi, kecamatan, desa, tahun, q };
  function buildPageHref(targetPage: number) {
    const params = new URLSearchParams();
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set("page", String(targetPage));
    params.set("size", String(pageSize));
    return `/alsintan?${params.toString()}`;
  }

  const exportParams = new URLSearchParams();
  Object.entries(activeFilters).forEach(([key, value]) => {
    if (value) exportParams.set(key, value);
  });
  const exportHref = `/api/alsintan/export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Alsintan</h1>
          <p className="text-sm text-gray-500">{count ?? 0} unit terdata</p>
        </div>
        <div className="flex gap-2">
          <a
            href={exportHref}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download size={16} />
            Ekspor Excel
          </a>
          {canCreate && (
            <Link
              href="/alsintan/impor"
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Upload size={16} />
              Impor Excel
            </Link>
          )}
          {canCreate && (
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
        kecamatanOptions={kecamatanOptions}
        desaOptions={desaOptions}
        tahunOptions={tahunOptions}
      />

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">No.</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Jenis</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Kategori</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Kecamatan</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Desa</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Tahun</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Penerima</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Kondisi</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Koordinat</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {alsintanList.map((a, index) => {
              const kategoriInfo = KATEGORI_INFO[a.master_jenis_alsintan?.kategori ?? ""];
              const ringColor = KATEGORI_RING_COLORS[a.master_jenis_alsintan?.kategori ?? ""] ?? "#9ca3af";
              const canManageRow = canManageAlsintanRow(profile, { kecamatan: a.kecamatan, desa: a.desa });
              return (
                <tr key={a.id} className="group hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">
                    <Link href={`/alsintan/${a.id}`} className="hover:underline">
                      {rangeStart + index}
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
                  <td className="px-4 py-3 text-gray-700">
                    {a.latitude != null && a.longitude != null ? (
                      <a
                        href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Buka di Google Maps"
                        className="inline-flex items-center gap-1 text-green-700 hover:underline"
                      >
                        <MapPinned size={12} className="text-green-600" />
                        {a.latitude.toFixed(5)}, {a.longitude.toFixed(5)}
                      </a>
                    ) : (
                      "-"
                    )}
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
                      {canManageRow && (
                        <Link
                          href={`/alsintan/${a.id}/edit`}
                          title="Edit"
                          className="inline-flex items-center justify-center rounded-md p-1.5 text-green-600 hover:bg-green-50"
                        >
                          <Pencil size={15} />
                        </Link>
                      )}
                      {canManageRow && (
                        <DeleteAlsintanButton id={a.id} idUnit={a.id_unit} compact redirectTo={null} />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {alsintanList.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
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
