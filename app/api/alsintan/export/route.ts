import { NextResponse } from "next/server";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/server";
import { kondisiLabel } from "@/lib/kondisi-alsintan";

interface ExportRow {
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
  master_jenis_alsintan: { nama_jenis: string } | null;
  master_sumber_dana: { nama_sumber: string } | null;
  penerima: {
    nama_kelompok: string;
    master_desa: { nama_desa: string; master_kecamatan: { nama_kecamatan: string } | null } | null;
  } | null;
}

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("alsintan")
    .select(
      `id_unit, merk, tipe, no_rangka, no_mesin, tahun_pengadaan, no_bast, tanggal_bast, nilai_aset, kondisi,
       master_jenis_alsintan(nama_jenis),
       master_sumber_dana(nama_sumber),
       penerima(nama_kelompok, master_desa(nama_desa, master_kecamatan(nama_kecamatan)))`
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as ExportRow[];

  const csvRows = rows.map((r) => ({
    "ID Unit": r.id_unit,
    Jenis: r.master_jenis_alsintan?.nama_jenis ?? "",
    Merk: r.merk ?? "",
    Tipe: r.tipe ?? "",
    "No. Rangka": r.no_rangka ?? "",
    "No. Mesin": r.no_mesin ?? "",
    "Tahun Pengadaan": r.tahun_pengadaan,
    "Sumber Dana": r.master_sumber_dana?.nama_sumber ?? "",
    "No. BAST": r.no_bast ?? "",
    "Tanggal BAST": r.tanggal_bast ?? "",
    "Nilai Aset": r.nilai_aset ?? "",
    Kondisi: kondisiLabel(r.kondisi),
    Penerima: r.penerima?.nama_kelompok ?? "",
    Desa: r.penerima?.master_desa?.nama_desa ?? "",
    Kecamatan: r.penerima?.master_desa?.master_kecamatan?.nama_kecamatan ?? "",
  }));

  const csv = Papa.unparse(csvRows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="alsintan-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
