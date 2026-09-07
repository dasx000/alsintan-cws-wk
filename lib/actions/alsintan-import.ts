"use server";

import { revalidatePath } from "next/cache";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { getKecamatanDesaForProfile } from "@/lib/wilayah";
import { friendlyDbError } from "@/lib/friendly-db-error";
import { KONDISI_OPTIONS } from "@/lib/kondisi-alsintan";
import { generateIdUnitBatch } from "@/lib/generate-id-unit";

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportActionState {
  error: string | null;
  success?: boolean;
  insertedCount?: number;
  rowErrors?: ImportRowError[];
}

const MAX_ROWS = 1000;
const MAX_JUMLAH_UNIT = 100;

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function cellText(row: ExcelJS.Row, colIndex: Record<string, number>, col: string): string {
  const idx = colIndex[col];
  if (!idx) return "";
  const value = row.getCell(idx).value;
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((t) => t.text).join("").trim();
    }
    if ("text" in value) return String(value.text ?? "").trim();
    if ("result" in value) return String(value.result ?? "").trim();
    return "";
  }
  return String(value).trim();
}

const REQUIRED_COLUMNS = ["Jenis Alsintan", "Kondisi", "Tahun Pengadaan", "Kecamatan", "Kelompok Penerima"];

// Impor massal lewat Excel -- pakai template dari /api/alsintan/template.
// Validasi dilakukan atomik: kalau ADA baris bermasalah, tidak ada satupun
// yang disimpan (biar user tidak bingung menyortir data yang sudah
// setengah masuk vs yang belum lewat re-upload).
export async function importAlsintanExcel(
  _prevState: ImportActionState,
  formData: FormData
): Promise<ImportActionState> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { error: "Pilih file Excel (.xlsx) terlebih dahulu." };
  }

  const supabase = await createClient();

  const [{ kecamatanList }, { data: jenisList }, { data: sumberDanaList }] = await Promise.all([
    getKecamatanDesaForProfile(),
    supabase.from("master_jenis_alsintan").select("id, nama_jenis, kategori"),
    supabase.from("master_sumber_dana").select("id, nama_sumber"),
  ]);

  const jenisMap = new Map((jenisList ?? []).map((j) => [normalize(j.nama_jenis), j]));
  const kecamatanMap = new Map(kecamatanList.map((k) => [normalize(k.nama_kecamatan), k]));
  const sumberDanaMap = new Map((sumberDanaList ?? []).map((s) => [normalize(s.nama_sumber), s]));
  const kondisiMap = new Map(KONDISI_OPTIONS.map((k) => [normalize(k.label), k.value]));

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  try {
    // Cast lewat tipe parameter method itu sendiri -- ada ketidakcocokan
    // generic Buffer<ArrayBuffer> vs Buffer<ArrayBufferLike> antara
    // @types/node dan definisi tipe exceljs, padahal runtime-nya sama persis.
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  } catch {
    return { error: "File tidak bisa dibaca. Pastikan formatnya .xlsx dan tidak rusak." };
  }

  const sheet = workbook.getWorksheet("Data Alsintan") ?? workbook.worksheets[0];
  if (!sheet) return { error: "Sheet data tidak ditemukan di file ini." };

  const colIndex: Record<string, number> = {};
  sheet.getRow(1).eachCell((cell, colNumber) => {
    const text = String(cell.value ?? "").trim();
    if (text) colIndex[text] = colNumber;
  });

  const missingCols = REQUIRED_COLUMNS.filter((c) => !colIndex[c]);
  if (missingCols.length > 0) {
    return { error: `Kolom wajib tidak ditemukan: ${missingCols.join(", ")}. Gunakan template yang disediakan.` };
  }

  const lastRow = sheet.lastRow?.number ?? 1;
  if (lastRow - 1 > MAX_ROWS) {
    return { error: `Maksimal ${MAX_ROWS} baris data per impor.` };
  }

  interface ParsedRow {
    idJenis: string;
    kodeKategori: string;
    kondisi: string;
    tahunPengadaan: number;
    idSumberDana: string | null;
    noBast: string | null;
    tanggalBast: string | null;
    idKecamatan: string;
    namaKecamatan: string;
    desa: string | null;
    penerima: string;
    catatan: string | null;
    jumlahUnit: number;
  }

  const parsedRows: ParsedRow[] = [];
  const rowErrors: ImportRowError[] = [];

  for (let r = 2; r <= lastRow; r++) {
    const row = sheet.getRow(r);

    const jenisText = cellText(row, colIndex, "Jenis Alsintan");
    if (!jenisText || jenisText.startsWith("^")) continue;

    const kondisiText = cellText(row, colIndex, "Kondisi");
    const tahunText = cellText(row, colIndex, "Tahun Pengadaan");
    const kecamatanText = cellText(row, colIndex, "Kecamatan");
    const penerimaText = cellText(row, colIndex, "Kelompok Penerima");
    const sumberDanaText = cellText(row, colIndex, "Sumber Dana");
    const noBastText = cellText(row, colIndex, "No. BAST");
    const tanggalBastText = cellText(row, colIndex, "Tanggal BAST");
    const desaText = cellText(row, colIndex, "Desa");
    const catatanText = cellText(row, colIndex, "Catatan");
    const jumlahUnitText = cellText(row, colIndex, "Jumlah Unit");

    const jenis = jenisMap.get(normalize(jenisText));
    if (!jenis) {
      rowErrors.push({ row: r, message: `Jenis Alsintan "${jenisText}" tidak dikenali.` });
      continue;
    }

    const kondisi = kondisiMap.get(normalize(kondisiText));
    if (!kondisi) {
      rowErrors.push({
        row: r,
        message: `Kondisi "${kondisiText}" tidak dikenali (pakai: Baik/Rusak Ringan/Rusak Berat/Hilang).`,
      });
      continue;
    }

    const tahun = Number(tahunText);
    if (!tahunText || Number.isNaN(tahun)) {
      rowErrors.push({ row: r, message: `Tahun Pengadaan "${tahunText}" tidak valid.` });
      continue;
    }

    const kecamatan = kecamatanMap.get(normalize(kecamatanText));
    if (!kecamatan) {
      rowErrors.push({ row: r, message: `Kecamatan "${kecamatanText}" tidak dikenali atau bukan wilayah Anda.` });
      continue;
    }

    if (!penerimaText) {
      rowErrors.push({ row: r, message: "Kelompok Penerima wajib diisi." });
      continue;
    }

    let idSumberDana: string | null = null;
    if (sumberDanaText) {
      const sd = sumberDanaMap.get(normalize(sumberDanaText));
      if (!sd) {
        rowErrors.push({ row: r, message: `Sumber Dana "${sumberDanaText}" tidak dikenali.` });
        continue;
      }
      idSumberDana = sd.id;
    }

    let jumlahUnit = 1;
    if (jumlahUnitText) {
      const n = Number(jumlahUnitText);
      if (!Number.isInteger(n) || n < 1 || n > MAX_JUMLAH_UNIT) {
        rowErrors.push({ row: r, message: `Jumlah Unit "${jumlahUnitText}" tidak valid (1-${MAX_JUMLAH_UNIT}).` });
        continue;
      }
      jumlahUnit = n;
    }

    parsedRows.push({
      idJenis: jenis.id,
      kodeKategori: jenis.kategori === "pasca_panen" ? "PS" : "PP",
      kondisi,
      tahunPengadaan: tahun,
      idSumberDana,
      noBast: noBastText || null,
      tanggalBast: tanggalBastText || null,
      idKecamatan: kecamatan.id_kecamatan,
      namaKecamatan: kecamatan.nama_kecamatan,
      desa: desaText || null,
      penerima: penerimaText,
      catatan: catatanText || null,
      jumlahUnit,
    });
  }

  if (parsedRows.length === 0 && rowErrors.length === 0) {
    return { error: "Tidak ada baris data yang terbaca. Pastikan data diisi mulai baris ke-2." };
  }

  if (rowErrors.length > 0) {
    return {
      error: `Ditemukan ${rowErrors.length} baris bermasalah. Perbaiki lalu unggah ulang.`,
      rowErrors,
    };
  }

  // Generate id_unit per grup (kecamatan+kategori+tahun) dalam SATU query per
  // grup, bukan per baris -- lihat catatan yang sama di generateIdUnitBatch.
  const groups = new Map<string, { idKecamatan: string; kodeKategori: string; tahun: number; count: number }>();
  for (const row of parsedRows) {
    const key = `${row.idKecamatan}|${row.kodeKategori}|${row.tahunPengadaan}`;
    const g = groups.get(key);
    if (g) g.count += row.jumlahUnit;
    else
      groups.set(key, {
        idKecamatan: row.idKecamatan,
        kodeKategori: row.kodeKategori,
        tahun: row.tahunPengadaan,
        count: row.jumlahUnit,
      });
  }

  const idUnitByGroup = new Map<string, string[]>();
  for (const [key, g] of groups) {
    try {
      const ids = await generateIdUnitBatch(supabase, g.idKecamatan, g.kodeKategori, g.tahun, g.count);
      idUnitByGroup.set(key, ids);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Gagal membuat ID unit." };
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const insertRows: Record<string, unknown>[] = [];
  for (const row of parsedRows) {
    const key = `${row.idKecamatan}|${row.kodeKategori}|${row.tahunPengadaan}`;
    const ids = idUnitByGroup.get(key)!;
    for (let i = 0; i < row.jumlahUnit; i++) {
      insertRows.push({
        id_jenis: row.idJenis,
        kondisi: row.kondisi,
        tahun_pengadaan: row.tahunPengadaan,
        id_sumber_dana: row.idSumberDana,
        no_bast: row.noBast,
        tanggal_bast: row.tanggalBast,
        kecamatan: row.namaKecamatan,
        desa: row.desa,
        penerima: row.penerima,
        catatan: row.catatan,
        id_unit: ids.shift(),
        dibuat_oleh: user?.id,
      });
    }
  }

  const CHUNK = 500;
  let insertedCount = 0;
  for (let i = 0; i < insertRows.length; i += CHUNK) {
    const chunk = insertRows.slice(i, i + CHUNK);
    const { error } = await supabase.from("alsintan").insert(chunk);
    if (error) {
      return {
        error: `${friendlyDbError(error, "Gagal menyimpan data")} (${insertedCount} baris sudah tersimpan sebelum error ini, sisanya batal.)`,
      };
    }
    insertedCount += chunk.length;
  }

  revalidatePath("/alsintan");
  return { error: null, success: true, insertedCount };
}
