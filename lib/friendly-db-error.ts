// Terjemahan pesan error Postgres/Supabase mentah (penuh istilah teknis
// seperti nama constraint SQL) ke pesan yang bisa dipahami user biasa --
// pesan ini tampil langsung di UI, bukan cuma log developer.

interface DbErrorLike {
  code?: string;
  message?: string;
}

// Label ramah untuk tiap unique constraint yang ada di skema (lihat
// `create table` / `add constraint ... unique` di supabase/migrations/).
const UNIQUE_CONSTRAINT_LABELS: Record<string, string> = {
  master_kecamatan_nama_kecamatan_key: "Nama kecamatan",
  master_jenis_alsintan_nama_jenis_key: "Nama jenis alsintan",
  master_jenis_alsintan_kode_singkat_key: "Kode singkat jenis alsintan",
  master_sumber_dana_nama_sumber_key: "Nama sumber dana",
  alsintan_id_unit_key: "ID unit alsintan",
};

export function friendlyDbError(error: DbErrorLike, fallback = "Terjadi kesalahan, coba lagi."): string {
  const code = error.code;
  const message = error.message ?? "";

  if (code === "23505") {
    const constraint = message.match(/unique constraint "([^"]+)"/)?.[1];
    const label = constraint ? UNIQUE_CONSTRAINT_LABELS[constraint] : undefined;
    return label ? `${label} ini sudah dipakai -- coba nama/kode lain.` : "Data ini sudah ada sebelumnya.";
  }
  if (code === "23503") {
    return "Data ini masih terhubung dengan data lain, jadi tidak bisa diproses.";
  }
  if (code === "23502") {
    return "Ada kolom wajib yang belum terisi.";
  }
  if (code === "23514") {
    return "Nilai yang dimasukkan tidak sesuai ketentuan yang berlaku.";
  }
  if (code === "42501") {
    return "Anda tidak punya izin untuk melakukan aksi ini.";
  }
  return fallback;
}
