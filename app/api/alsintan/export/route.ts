import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { kondisiLabel } from "@/lib/kondisi-alsintan";
import { friendlyDbError } from "@/lib/friendly-db-error";

interface ExportRow {
  id_unit: string;
  tahun_pengadaan: number;
  no_bast: string | null;
  tanggal_bast: string | null;
  kondisi: string;
  penerima: string | null;
  desa: string | null;
  kecamatan: string | null;
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
  { header: "ID Unit", key: "id_unit", width: 20 },
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
  { header: "Catatan", key: "catatan", width: 30 },
];

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("alsintan")
    .select(
      `id_unit, tahun_pengadaan, no_bast, tanggal_bast, kondisi, penerima, desa, kecamatan, catatan,
       master_jenis_alsintan(nama_jenis, kategori),
       master_sumber_dana(nama_sumber)`
    )
    .order("created_at", { ascending: false });

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

  rows.forEach((r) => {
    const kategori = r.master_jenis_alsintan?.kategori ?? null;
    const row = sheet.addRow({
      id_unit: r.id_unit,
      jenis: r.master_jenis_alsintan?.nama_jenis ?? "-",
      kategori: kategori ? (KATEGORI_LABEL[kategori] ?? kategori) : "-",
      kondisi: kondisiLabel(r.kondisi),
      tahun: r.tahun_pengadaan,
      sumber_dana: r.master_sumber_dana?.nama_sumber ?? "",
      no_bast: r.no_bast ?? "",
      tanggal_bast: r.tanggal_bast ?? "",
      kecamatan: r.kecamatan ?? "",
      desa: r.desa ?? "",
      penerima: r.penerima ?? "",
      catatan: r.catatan ?? "",
    });

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
  sheet.getColumn("id_unit").font = { name: "Consolas" };

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="alsintan-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
