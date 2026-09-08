-- Kolom Kelompok Penerima sekarang boleh kosong saat impor Excel (data
-- pengadaan tanpa info penerima tetap harus bisa dicatat -- lihat perubahan
-- REQUIRED_COLUMNS di lib/actions/alsintan-import.ts).
--
-- Konsekuensinya: count(distinct (penerima, desa, ...)) di fungsi statistik
-- landing page SEBELUM ini salah hitung kalau penerima NULL -- Postgres
-- tetap menganggap (NULL, desa A) beda dari (NULL, desa B) karena field
-- desa-nya beda, padahal tidak ada satupun kelompok tani nyata di situ.
-- Akibatnya "jumlah kelompok" diam-diam berubah jadi "jumlah desa unik",
-- menyesatkan (persis kasus 397 unit impor tanpa penerima yang sempat
-- tercatat "74 kelompok tani" padahal semua penerimanya NULL).
--
-- Perbaikan: pakai FILTER (where penerima is not null) supaya baris tanpa
-- penerima tidak ikut dihitung sama sekali -- kalau semua data penerimanya
-- kosong, angkanya jadi 0, bukan angka semu dari kombinasi desa/kecamatan.

create or replace function public.get_landing_stats()
returns table (total_alsintan bigint, total_kelompok bigint)
language sql
security definer
set search_path = public
as $$
  select
    count(*)::bigint as total_alsintan,
    count(distinct (penerima, desa, kecamatan)) filter (where penerima is not null)::bigint as total_kelompok
  from alsintan;
$$;

create or replace function public.get_landing_kecamatan_stats()
returns table (nama_kecamatan text, jumlah bigint, jumlah_kelompok bigint)
language sql
security definer
set search_path = public
as $$
  select
    mk.nama_kecamatan,
    coalesce(count(a.id), 0)::bigint as jumlah,
    coalesce(count(distinct (a.penerima, a.desa)) filter (where a.penerima is not null), 0)::bigint as jumlah_kelompok
  from master_kecamatan mk
  left join alsintan a on a.kecamatan = mk.nama_kecamatan
  group by mk.nama_kecamatan
  order by mk.nama_kecamatan;
$$;

create or replace function public.get_landing_kecamatan_detail()
returns table (
  nama_kecamatan text,
  nama_jenis text,
  kategori kategori_alsintan,
  jumlah_unit bigint,
  jumlah_kelompok bigint,
  jumlah_desa bigint
)
language sql
security definer
set search_path = public
as $$
  select
    a.kecamatan as nama_kecamatan,
    mj.nama_jenis,
    mj.kategori,
    count(a.id)::bigint as jumlah_unit,
    count(distinct (a.penerima, a.desa)) filter (where a.penerima is not null)::bigint as jumlah_kelompok,
    count(distinct a.desa)::bigint as jumlah_desa
  from alsintan a
  join master_jenis_alsintan mj on mj.id = a.id_jenis
  where a.kecamatan is not null
  group by a.kecamatan, mj.nama_jenis, mj.kategori
  order by a.kecamatan, jumlah_unit desc;
$$;
