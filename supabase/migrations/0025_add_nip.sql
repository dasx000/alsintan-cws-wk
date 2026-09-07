-- Nomor Induk Pegawai -- identitas kepegawaian, diisi admin lewat halaman
-- Kelola Pengguna. Nullable (belum tentu semua penyuluh punya NIP saat
-- akunnya dibuat), unique kalau diisi (NIP asli tidak boleh dobel --
-- Postgres mengizinkan banyak NULL berdampingan dengan unique constraint,
-- jadi tidak bentrok sama akun yang belum diisi).
alter table profiles add column nip text unique;
