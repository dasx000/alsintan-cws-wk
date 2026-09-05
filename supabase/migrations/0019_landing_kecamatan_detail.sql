-- Data pendukung fitur "Jelajah Kecamatan" di landing page (seksi Sebaran):
-- panel cari + pilih kecamatan, lalu tampilkan rincian per jenis alsintan
-- untuk kecamatan terpilih. Teknik ATM dari fitur "Pilih Kabupaten/Kota" di
-- SIMANTAN Kaltim, tapi discope ulang ke level kecamatan (bukan kabupaten)
-- karena aplikasi ini kabupaten-level (Way Kanan), bukan provinsi.
--
-- Semua angka di sini agregat (jumlah unit/kelompok/desa) -- TIDAK PERNAH
-- koordinat presisi atau nama kelompok tani individual, konsisten dengan
-- fungsi landing publik lain.

-- get_landing_kecamatan_stats (0010, direvisi 0014) perlu kolom tambahan
-- jumlah_kelompok untuk kartu ringkasan di panel kiri -- ganti tipe return
-- table perlu drop dulu (create or replace tidak bisa nambah kolom).
drop function if exists public.get_landing_kecamatan_stats();

-- PENTING soal jumlah_kelompok: nama kelompok tani (penerima) BUKAN kunci
-- unik sendirian -- nama generik seperti "Sido Makmur" ternyata muncul di
-- lebih dari satu desa dalam kecamatan yang sama (data asli TA 2025:
-- "Sido Makmur" ada di desa Karang Agung, Negara Harja, DAN Pakuan Baru,
-- kecamatan Pakuan Ratu -- tiga kelompok berbeda, bukan satu). Sebaliknya,
-- dalam satu desa yang sama, nama kelompok yang identik pasti memang
-- kelompok yang sama. Jadi kunci unik kelompok tani yang benar adalah
-- kombinasi (penerima, desa), BUKAN penerima saja.
create or replace function public.get_landing_kecamatan_stats()
returns table (nama_kecamatan text, jumlah bigint, jumlah_kelompok bigint)
language sql
security definer
set search_path = public
as $$
  select
    mk.nama_kecamatan,
    coalesce(count(a.id), 0)::bigint as jumlah,
    coalesce(count(distinct (a.penerima, a.desa)), 0)::bigint as jumlah_kelompok
  from master_kecamatan mk
  left join alsintan a on a.kecamatan = mk.nama_kecamatan
  group by mk.nama_kecamatan
  order by mk.nama_kecamatan;
$$;

grant execute on function public.get_landing_kecamatan_stats() to anon;

-- Rincian per jenis alsintan untuk tiap kecamatan (dipakai panel kanan saat
-- satu kecamatan dipilih). jumlah_kelompok pakai kunci (penerima, desa) yang
-- sama seperti di atas, dengan alasan yang sama.
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
    count(distinct (a.penerima, a.desa))::bigint as jumlah_kelompok,
    count(distinct a.desa)::bigint as jumlah_desa
  from alsintan a
  join master_jenis_alsintan mj on mj.id = a.id_jenis
  where a.kecamatan is not null
  group by a.kecamatan, mj.nama_jenis, mj.kategori
  order by a.kecamatan, jumlah_unit desc;
$$;

grant execute on function public.get_landing_kecamatan_detail() to anon;
