-- Sederhanakan master_jenis_alsintan: ganti kode_singkat & kode_ikon (makin
-- banyak variannya seiring jenis alat bertambah) jadi satu kolom kategori
-- (cuma 2 nilai: pra_panen/pasca_panen). Ikon peta & kode id_unit sekarang
-- ditentukan dari kategori langsung di kode aplikasi, bukan per-jenis lagi.
--
-- Baris LAMA tidak dihapus -- ada unit alsintan asli yang mereferensikannya
-- lewat FK id_jenis (on delete restrict), jadi kategori diisi lewat
-- pemetaan nama_jenis, bukan hapus-lalu-insert-ulang. Jenis baru dari
-- SIMANTAN Kaltim yang belum ada baru ditambahkan lewat INSERT terpisah di
-- akhir (kategori "Alsintan Lainnya" milik mereka sengaja tidak dipakai).

create type kategori_alsintan as enum ('pra_panen', 'pasca_panen');

alter table master_jenis_alsintan add column kategori kategori_alsintan;

update master_jenis_alsintan set kategori = 'pra_panen' where nama_jenis in (
  'Traktor Roda 2', 'Traktor Roda 4', 'Traktor Crawler', 'Rice Transplanter',
  'Pompa Air', 'Cultivator', 'Hand Sprayer', 'Alat Tanam Jagung', 'Rotavator'
);
update master_jenis_alsintan set kategori = 'pasca_panen' where nama_jenis in (
  'Combine Harvester', 'Corn Sheller', 'Power Thresher', 'Moisture Tester',
  'Power Thresher Multiguna', 'Combine Harvester Besar', 'Combine Harvester Sedang',
  'Combine Harvester Kecil', 'Rice Milling Unit', 'Combine Harvester Multifungsi',
  'Mobile Dryer', 'Color Sorter'
);

-- Fallback untuk jenis lama yang namanya tidak match daftar Kaltim di atas
-- (misal ditambah manual lewat CRUD saat testing) -- default pra_panen,
-- bisa dikoreksi lewat halaman /jenis-alsintan.
update master_jenis_alsintan set kategori = 'pra_panen' where kategori is null;

alter table master_jenis_alsintan alter column kategori set not null;

alter table master_jenis_alsintan drop column kode_singkat;
alter table master_jenis_alsintan drop column kode_ikon;

-- Tambahkan jenis alat dari SIMANTAN Kaltim yang belum ada di tabel.
insert into master_jenis_alsintan (nama_jenis, kategori)
select v.nama_jenis, v.kategori::kategori_alsintan
from (values
  ('Traktor Crawler', 'pra_panen'),
  ('Rice Transplanter', 'pra_panen'),
  ('Pompa Air', 'pra_panen'),
  ('Cultivator', 'pra_panen'),
  ('Hand Sprayer', 'pra_panen'),
  ('Alat Tanam Jagung', 'pra_panen'),
  ('Rotavator', 'pra_panen'),
  ('Combine Harvester', 'pasca_panen'),
  ('Corn Sheller', 'pasca_panen'),
  ('Power Thresher', 'pasca_panen'),
  ('Moisture Tester', 'pasca_panen'),
  ('Power Thresher Multiguna', 'pasca_panen'),
  ('Combine Harvester Besar', 'pasca_panen'),
  ('Combine Harvester Sedang', 'pasca_panen'),
  ('Combine Harvester Kecil', 'pasca_panen'),
  ('Rice Milling Unit', 'pasca_panen'),
  ('Combine Harvester Multifungsi', 'pasca_panen'),
  ('Mobile Dryer', 'pasca_panen'),
  ('Color Sorter', 'pasca_panen')
) as v(nama_jenis, kategori)
where not exists (
  select 1 from master_jenis_alsintan m where m.nama_jenis = v.nama_jenis
);
