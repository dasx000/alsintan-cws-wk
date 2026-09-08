import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { getAlsintanFilterScope } from "@/lib/alsintan-permissions";
import { kondisiLabel } from "@/lib/kondisi-alsintan";
import { friendlyDbError } from "@/lib/friendly-db-error";

interface ExportRow {
  id_unit: string;
  tahun_pengadaan: number | null;
  no_bast: string | null;
  tanggal_bast: string | null;
  kondisi: string;
  penerima: string | null;
  desa: string | null;
  kecamatan: string | null;
  luas_lahan_ha: number | null;
  catatan: string | null;
  master_jenis_alsintan: { nama_jenis: string; kategori: string } | null;
  master_sumber_dana: { nama_sumber: string } | null;
}

const KONDISI_FILL: Record<string, string> = {
  baik: "FFDCFCE7",
  rusak_ringan: "FFFEF9C3",
  rusak_berat: "FFFEE2E2",
  hilang: "FFE5E7EB",
};

const KATEGORI_LABEL: Record<string, string> = {
  pra_panen: "Prapanen",
  pasca_panen: "Pascapanen",
};

const KATEGORI_FONT_COLOR: Record<string, string> = {
  pra_panen: "FF15803D",
  pasca_panen: "FFB45309",
};

const COLUMNS = [
  { header: "No.", key: "no", width: 8 },
  { header: "Jenis", key: "jenis", width: 22 },
  { header: "Kategori", key: "kategori", width: 14 },
  { header: "Kondisi", key: "kondisi", width: 14 },
  { header: "Tahun Pengadaan", key: "tahun", width: 16 },
  { header: "Sumber Dana", key: "sumber_dana", width: 16 },
  { header: "No. BAST", key: "no_bast", width: 18 },
  { header: "Tanggal BAST", key: "tanggal_bast", width: 16 },
  { header: "Kecamatan", key: "kecamatan", width: 18 },
  { header: "Desa", key: "desa", width: 18 },
  { header: "Kelompok Penerima", key: "penerima", width: 24 },
  { header: "Luas Lahan (Ha)", key: "luas_lahan_ha", width: 16 },
  { header: "Catatan", key: "catatan", width: 30 },
];

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { profile } = await getCurrentProfile();
  const scope = getAlsintanFilterScope(profile);

  const params = request.nextUrl.searchParams;
  const jenis = params.get("jenis");
  const kategori = params.get("kategori");
  const kondisi = params.get("kondisi");
  const kecamatan = params.get("kecamatan");
  const desa = params.get("desa");
  const tahun = params.get("tahun");
  const q = params.get("q");

  // Sama seperti daftar Alsintan: kolom kategori butuh inner join supaya bisa
  // difilter di PostgREST.
  let selectStr =
    "id_unit, tahun_pengadaan, no_bast, tanggal_bast, kondisi, penerima, desa, kecamatan, luas_lahan_ha, catatan, master_jenis_alsintan(nama_jenis, kategori), master_sumber_dana(nama_sumber)";
  if (kategori) selectStr = selectStr.replace("master_jenis_alsintan(", "master_jenis_alsintan!inner(");

  let query = supabase.from("alsintan").select(selectStr);

  // Kunci wilayah -- SAMA seperti halaman daftar (lihat app/(app)/alsintan/page.tsx):
  // koordinator/penyuluh hanya boleh ekspor data di wilayahnya sendiri, diterapkan
  // di server supaya tidak bisa dilewati dengan memanggil endpoint ini langsung.
  if (scope.lockedKecamatan) {
    query = query.in("kecamatan", scope.lockedKecamatan.length > 0 ? scope.lockedKecamatan : ["__none__"]);
  }
  if (scope.lockedDesa) {
    query = query.in("desa", scope.lockedDesa.length > 0 ? scope.lockedDesa : ["__none__"]);
  }
  if (jenis) query = query.eq("id_jenis", jenis);
  if (kondisi) query = query.eq("kondisi", kondisi);
  if (kecamatan) query = query.eq("kecamatan", kecamatan);
  if (desa) query = query.eq("desa", desa);
  if (tahun) query = query.eq("tahun_pengadaan", Number(tahun));
  if (kategori) query = query.eq("master_jenis_alsintan.kategori", kategori);
  if (q) {
    const safeQ = q.trim().replace(/[,()"\\]/g, " ").trim();
    if (safeQ) {
      const pattern = `%${safeQ}%`;
      query = query.or(
        `id_unit.ilike.${pattern},penerima.ilike.${pattern},desa.ilike.${pattern},kecamatan.ilike.${pattern}`
      );
    }
  }
  query = query
    .order("kecamatan", { ascending: true, nullsFirst: false })
    .order("desa", { ascending: true, nullsFirst: false })
    .order("penerima", { ascending: true, nullsFirst: false })
    .order("nama_jenis", { ascending: true, referencedTable: "master_jenis_alsintan" });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: friendlyDbError(error, "Gagal mengambil data untuk ekspor.") }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as ExportRow[];

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AlsinTrack";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Data Alsintan", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = COLUMNS;

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF16A34A" } };
  headerRow.alignment = { vertical: "middle" };

  rows.forEach((r, index) => {
    const kategori = r.master_jenis_alsintan?.kategori ?? null;
    const row = sheet.addRow({
      no: index + 1,
      jenis: r.master_jenis_alsintan?.nama_jenis ?? "-",
      kategori: kategori ? (KATEGORI_LABEL[kategori] ?? kategori) : "-",
      kondisi: kondisiLabel(r.kondisi),
      tahun: r.tahun_pengadaan ?? "",
      sumber_dana: r.master_sumber_dana?.nama_sumber ?? "",
      no_bast: r.no_bast ?? "",
      tanggal_bast: r.tanggal_bast ?? "",
      kecamatan: r.kecamatan ?? "",
      desa: r.desa ?? "",
      penerima: r.penerima ?? "",
      luas_lahan_ha: r.luas_lahan_ha ?? "",
      catatan: r.catatan ?? "",
    });

    // Zebra stripe -- baris genap dikasih fill abu-abu muda supaya lebih
    // gampang dibaca menyamping di tabel yang panjang. Diterapkan DULU
    // sebelum fill kondisi/kategori di bawah, supaya warna kondisi tetap
    // menang di sel itu (bukan ketiban abu-abu).
    if (index % 2 === 1) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
      });
    }

    const kondisiFill = KONDISI_FILL[r.kondisi];
    if (kondisiFill) {
      row.getCell("kondisi").fill = { type: "pattern", pattern: "solid", fgColor: { argb: kondisiFill } };
    }
    const kategoriColor = kategori ? KATEGORI_FONT_COLOR[kategori] : undefined;
    if (kategoriColor) {
      row.getCell("kategori").font = { color: { argb: kategoriColor }, bold: true };
    }
  });

  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUMNS.length } };

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="alsintan-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
