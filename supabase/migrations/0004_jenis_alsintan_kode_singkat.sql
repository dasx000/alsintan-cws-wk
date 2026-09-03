-- Kode singkat (2-4 huruf) untuk segmen {JENIS} di id_unit alsintan
-- (format ALS-{KECAMATAN}-{JENIS}-{TAHUN}-{URUT}), terpisah dari kode_ikon
-- yang dipakai untuk pemetaan SVG di peta sebaran.

alter table master_jenis_alsintan add column kode_singkat text;

update master_jenis_alsintan set kode_singkat = 'TR2' where nama_jenis = 'Traktor Roda 2';
update master_jenis_alsintan set kode_singkat = 'TR4' where nama_jenis = 'Traktor Roda 4';

-- Fallback untuk jenis lain yang mungkin sudah ditambahkan manual lewat CRUD
-- saat testing (belum ke-cover 2 UPDATE eksplisit di atas): pakai 3 huruf
-- pertama nama_jenis + 2 digit id acak supaya tetap unik. Cek & rapikan lagi
-- lewat halaman /jenis-alsintan kalau hasilnya kurang pas.
update master_jenis_alsintan
set kode_singkat = upper(left(regexp_replace(nama_jenis, '[^a-zA-Z]', '', 'g'), 3))
  || lpad((floor(random() * 100))::int::text, 2, '0')
where kode_singkat is null;

alter table master_jenis_alsintan alter column kode_singkat set not null;
alter table master_jenis_alsintan add constraint master_jenis_alsintan_kode_singkat_key unique (kode_singkat);
