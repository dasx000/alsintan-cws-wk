-- Data awal jenis alsintan. Jenis lain (pompa air, rice transplanter,
-- combine harvester, dryer, dll) ditambahkan lewat menu CRUD jenis alsintan
-- di aplikasi (admin), bukan di-hardcode di sini.

insert into master_jenis_alsintan (nama_jenis, kode_ikon) values
  ('Traktor Roda 2', 'traktor_r2'),
  ('Traktor Roda 4', 'traktor_r4');
