-- Fitur Monev (kunjungan monitoring & evaluasi per unit alsintan) tidak
-- dipakai -- dibuang total. Tabel kosong (0 baris) di production, jadi tidak
-- ada data yang hilang.
--
-- Drop table otomatis ikut menghapus index (idx_monev_alsintan) dan semua
-- policy RLS-nya (monev_select/insert/update/delete) -- tidak perlu di-drop
-- manual. Fungsi kecamatan_of_alsintan()/desa_of_alsintan()/can_manage_wilayah()
-- TIDAK ikut dihapus karena masih dipakai policy alsintan & servis.

drop table if exists monev;
