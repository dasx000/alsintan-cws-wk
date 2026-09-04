import { NextResponse } from "next/server";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/server";
import { kondisiLabel } from "@/lib/kondisi-alsintan";

interface ExportRow {
  id_unit: string;
  tahun_pengadaan: number;
  no_bast: string | null;
  tanggal_bast: string | null;
  kondisi: string;
  penerima: string | null;
  desa: string | null;
  kecamatan: string | null;
  master_jenis_alsintan: { nama_jenis: string } | null;
  master_sumber_dana: { nama_sumber: string } | null;
}

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("alsintan")
    .select(
      `id_unit, tahun_pengadaan, no_bast, tanggal_bast, kondisi, penerima, desa, kecamatan,
       master_jenis_alsintan(nama_jenis),
       master_sumber_dana(nama_sumber)`
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as ExportRow[];

  const csvRows = rows.map((r) => ({
    "ID Unit": r.id_unit,
    Jenis: r.master_jenis_alsintan?.nama_jenis ?? "",
    "Tahun Pengadaan": r.tahun_pengadaan,
    "Sumber Dana": r.master_sumber_dana?.nama_sumber ?? "",
    "No. BAST": r.no_bast ?? "",
    "Tanggal BAST": r.tanggal_bast ?? "",
    Kondisi: kondisiLabel(r.kondisi),
    Penerima: r.penerima ?? "",
    Desa: r.desa ?? "",
    Kecamatan: r.kecamatan ?? "",
  }));

  const csv = Papa.unparse(csvRows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="alsintan-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
