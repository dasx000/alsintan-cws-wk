import ExcelJS from "exceljs";
import { KONDISI_OPTIONS } from "@/lib/kondisi-alsintan";

export interface TemplateMasterData {
  jenisList: { nama_jenis: string; kategori: string }[];
  kecamatanList: { nama_kecamatan: string }[];
  sumberDanaList: { nama_sumber: string }[];
}

const DATA_HEADERS = [
  "Jenis Alsintan *",
  "Kondisi *",
  "Tahun Pengadaan *",
  "Sumber Dana",
  "No. BAST",
  "Tanggal BAST",
  "Kecamatan *",
  "Desa *",
  "Kelompok Penerima",
  "Jumlah Unit",
  "Luas Lahan (Ha)",
  "Catatan",
  "Titik Koordinat (lat, lng)",
];

const ERROR_COLUMN_HEADER = "Keterangan Error";

// Baris terakhir di sheet "Data Alsintan" yang masih diberi dropdown --
// beri ruang lebih dari cukup untuk impor besar tanpa membuat file
// terlalu berat dengan validasi di puluhan ribu baris.
const MAX_DATA_ROWS = 500;

function columnLetter(colNumber: number): string {
  let n = colNumber;
  let letters = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

const ERROR_TITLE = "Input Tidak Valid";
const ERROR_MESSAGE =
  "Silakan klik sel ini lalu pilih salah satu opsi dari daftar dropdown. Ketik manual tidak diperbolehkan.";
const KLIK_PANAH = "Klik ikon panah di sel ini, lalu pilih dari daftar.";

function applyListValidation(
  sheet: ExcelJS.Worksheet,
  colNumber: number,
  formula: string,
  promptTitle: string,
  promptMessage: string,
  lastRow: number
) {
  const col = columnLetter(colNumber);
  for (let r = 2; r <= lastRow; r++) {
    sheet.getCell(`${col}${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [formula],
      showInputMessage: true,
      promptTitle,
      prompt: promptMessage,
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: ERROR_TITLE,
      error: ERROR_MESSAGE,
    };
  }
}

interface ReferensiRanges {
  jenisLastRow: number;
  kondisiLastRow: number;
  kecamatanLastRow: number;
  sumberDanaFirstRow: number;
  sumberDanaLastRow: number;
}

// Bangun sheet "Referensi" dari data master TERKINI (bukan file statis)
// supaya pilihan Jenis/Kecamatan/Sumber Dana selalu sinkron dengan
// database saat file diunduh, lalu kembalikan range barisnya untuk dipakai
// sebagai source dropdown di sheet data.
function addReferensiSheet(workbook: ExcelJS.Workbook, data: TemplateMasterData): ReferensiRanges {
  const ref = workbook.addWorksheet("Referensi");
  ref.getColumn(1).width = 28;
  ref.getColumn(2).width = 16;
  ref.getColumn(3).width = 24;
  ref.getColumn(4).width = 28;

  ref.addRow(["Jenis Alsintan", "Kategori", "Kondisi", "Kecamatan"]).font = { bold: true };
  const kategoriLabel = (k: string) => (k === "pasca_panen" ? "Pascapanen" : "Prapanen");
  const maxRows = Math.max(data.jenisList.length, KONDISI_OPTIONS.length, data.kecamatanList.length);
  for (let i = 0; i < maxRows; i++) {
    ref.addRow([
      data.jenisList[i]?.nama_jenis ?? "",
      data.jenisList[i] ? kategoriLabel(data.jenisList[i].kategori) : "",
      KONDISI_OPTIONS[i]?.label ?? "",
      data.kecamatanList[i]?.nama_kecamatan ?? "",
    ]);
  }

  ref.addRow([]);
  const sumberDanaHeaderRow = ref.addRow(["Sumber Dana (opsional)"]);
  sumberDanaHeaderRow.font = { bold: true };
  data.sumberDanaList.forEach((s) => ref.addRow([s.nama_sumber]));

  const sumberDanaFirstRow = sumberDanaHeaderRow.number + 1;

  return {
    jenisLastRow: 1 + data.jenisList.length, // baris 1 = header
    kondisiLastRow: 1 + KONDISI_OPTIONS.length,
    kecamatanLastRow: 1 + data.kecamatanList.length,
    sumberDanaFirstRow,
    sumberDanaLastRow: sumberDanaFirstRow + data.sumberDanaList.length - 1,
  };
}

// Dropdown (Data Validation tipe List) di sheet data, merujuk ke range di
// sheet Referensi -- bukan hardcode -- supaya daftar pilihan otomatis ikut
// berubah kalau data master berubah. Kolom: A=Jenis, B=Kondisi, D=Sumber
// Dana, G=Kecamatan (lihat urutan DATA_HEADERS).
function applyStandardValidations(
  sheet: ExcelJS.Worksheet,
  data: TemplateMasterData,
  ranges: ReferensiRanges,
  lastRow: number
) {
  if (data.jenisList.length > 0) {
    applyListValidation(
      sheet,
      1,
      `Referensi!$A$2:$A$${ranges.jenisLastRow}`,
      "Pilih Jenis Alsintan",
      KLIK_PANAH,
      lastRow
    );
  }

  applyListValidation(
    sheet,
    2,
    `Referensi!$C$2:$C$${ranges.kondisiLastRow}`,
    "Pilih Kondisi",
    KLIK_PANAH,
    lastRow
  );

  if (data.sumberDanaList.length > 0) {
    applyListValidation(
      sheet,
      4,
      `Referensi!$A$${ranges.sumberDanaFirstRow}:$A$${ranges.sumberDanaLastRow}`,
      "Pilih Sumber Dana",
      "Klik ikon panah di sel ini, lalu pilih dari daftar (kolom ini opsional).",
      lastRow
    );
  }

  if (data.kecamatanList.length > 0) {
    applyListValidation(
      sheet,
      7,
      `Referensi!$D$2:$D$${ranges.kecamatanLastRow}`,
      "Pilih Kecamatan",
      KLIK_PANAH,
      lastRow
    );
  }
}

function styleHeaderRow(sheet: ExcelJS.Worksheet, headers: string[]) {
  sheet.addRow(headers);
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFDCFCE7" },
  };
  sheet.columns = headers.map((h) => ({
    width: Math.max(h.length + 4, 16),
  }));
}

export async function buildAlsintanImportTemplate(data: TemplateMasterData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  const sheet = workbook.addWorksheet("Data Alsintan");
  styleHeaderRow(sheet, DATA_HEADERS);

  const ranges = addReferensiSheet(workbook, data);
  applyStandardValidations(sheet, data, ranges, MAX_DATA_ROWS);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export interface ErrorReportRow {
  /** Nilai mentah 12 kolom data, urutannya sama dengan DATA_HEADERS. */
  values: (string | number)[];
  message: string;
}

// Dibuat saat impor gagal -- hanya berisi baris yang bermasalah, plus
// kolom terakhir berisi keterangan errornya (teks merah) supaya user tahu
// persis apa yang harus diperbaiki tanpa perlu menyortir ulang baris yang
// sudah benar. Sheetnya tetap bernama "Data Alsintan" dan lengkap dengan
// dropdown + sheet Referensi, jadi file ini bisa langsung diperbaiki lalu
// diunggah ulang.
export async function buildAlsintanImportErrorReport(
  rows: ErrorReportRow[],
  data: TemplateMasterData
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const headers = [...DATA_HEADERS, ERROR_COLUMN_HEADER];

  const sheet = workbook.addWorksheet("Data Alsintan");
  styleHeaderRow(sheet, headers);
  sheet.getColumn(headers.length).width = 60;

  rows.forEach((r) => {
    const row = sheet.addRow([...r.values, r.message]);
    row.getCell(headers.length).font = { color: { argb: "FFDC2626" }, bold: true };
  });

  const ranges = addReferensiSheet(workbook, data);
  applyStandardValidations(sheet, data, ranges, 1 + rows.length);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
