import ExcelJS from "exceljs";
import { KONDISI_OPTIONS } from "@/lib/kondisi-alsintan";

export interface TemplateMasterData {
  jenisList: { nama_jenis: string; kategori: string }[];
  kecamatanList: { nama_kecamatan: string }[];
  sumberDanaList: { nama_sumber: string }[];
}

const DATA_HEADERS = [
  "Jenis Alsintan",
  "Kondisi",
  "Tahun Pengadaan",
  "Sumber Dana",
  "No. BAST",
  "Tanggal BAST",
  "Kecamatan",
  "Desa",
  "Kelompok Penerima",
  "Jumlah Unit",
  "Luas Lahan (Ha)",
  "Catatan",
];

const CONTOH_ROW = [
  "Hand Sprayer",
  "Baik",
  2025,
  "APBN",
  "",
  "",
  "",
  "",
  "Kelompok Tani Contoh",
  1,
  "",
  "",
];

// Template dibangun dari data master TERKINI (bukan file statis) supaya
// pilihan Jenis/Kecamatan/Sumber Dana di sheet Referensi selalu sinkron
// dengan yang ada di database saat file diunduh.
export async function buildAlsintanImportTemplate(data: TemplateMasterData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  const sheet = workbook.addWorksheet("Data Alsintan");
  sheet.addRow(DATA_HEADERS);
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFDCFCE7" },
  };
  sheet.columns = DATA_HEADERS.map((h) => ({
    width: Math.max(h.length + 4, 16),
  }));

  const contohRow = sheet.addRow(CONTOH_ROW);
  contohRow.font = { italic: true, color: { argb: "FF9CA3AF" } };
  sheet.addRow([
    "^ CONTOH -- hapus baris ini sebelum upload. Kecamatan wajib diisi (lihat sheet Referensi).",
  ]);

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
  ref.addRow(["Sumber Dana (opsional)"]).font = { bold: true };
  data.sumberDanaList.forEach((s) => ref.addRow([s.nama_sumber]));

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
