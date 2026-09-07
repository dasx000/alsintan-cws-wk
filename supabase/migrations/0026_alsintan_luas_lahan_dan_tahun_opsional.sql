-- Import ulang data dari "Laporan Alsintan 2026" bawa 2 hal yang belum
-- tertampung skema lama:
--  - Luas Lahan (Ha) yang dilayani tiap unit -- data baru, kolom baru.
--  - Sebagian unit tidak diketahui tahun penerimaannya -- tahun_pengadaan
--    dibuat boleh kosong (sebelumnya NOT NULL), daripada menebak tahunnya.

alter table alsintan add column luas_lahan_ha numeric;
alter table alsintan alter column tahun_pengadaan drop not null;
