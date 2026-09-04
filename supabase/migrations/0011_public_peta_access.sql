-- Keputusan produk: halaman /peta dibuka jadi publik, tanpa perlu login,
-- termasuk koordinat presisi tiap unit, nama kelompok penerima, dan nama
-- desa (lihat diskusi -- pengguna secara eksplisit memilih opsi ini setelah
-- diberi tahu risikonya). Kebalikan dari batas privasi yang sebelumnya
-- dipakai untuk landing page (get_landing_kecamatan_stats, cuma agregat).
--
-- Policy baru ini ADDITIVE -- cuma menambah akses SELECT untuk role `anon`
-- di tabel yang dibaca /peta, tidak mengubah/menghapus policy authenticated
-- yang sudah ada. Tabel riwayat (mutasi, pemanfaatan, servis, monev) dan
-- profiles TETAP tidak dibuka ke anon -- di luar kebutuhan /peta.
create policy master_kecamatan_select_anon on master_kecamatan for select to anon using (true);
create policy master_desa_select_anon on master_desa for select to anon using (true);
create policy master_jenis_select_anon on master_jenis_alsintan for select to anon using (true);
create policy master_sumber_dana_select_anon on master_sumber_dana for select to anon using (true);
create policy penerima_select_anon on penerima for select to anon using (true);
create policy alsintan_select_anon on alsintan for select to anon using (true);
