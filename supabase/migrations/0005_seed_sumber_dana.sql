-- Nilai awal sumber dana. Tidak ada halaman CRUD khusus untuk ini (tidak
-- diminta di fitur), diperlakukan seperti master_kecamatan/master_desa:
-- data tetap, tambah baris baru lewat migration/SQL Editor kalau perlu.

insert into master_sumber_dana (nama_sumber) values
  ('APBN'),
  ('APBD Provinsi'),
  ('APBD Kabupaten'),
  ('Bantuan Lainnya');
