-- Tambah angka "total kelompok tani" di panel statistik hero landing page,
-- di samping total unit alsintan. Kunci unik kelompok tani = (penerima,
-- desa, kecamatan) -- alasan sama seperti di migration 0019 (nama generik
-- seperti "Sido Makmur" bisa muncul di lebih dari satu desa). Beda dengan
-- 0019 yang sudah otomatis terpisah per kecamatan (join ke master_kecamatan),
-- fungsi ini menghitung GLOBAL lintas kecamatan, jadi kecamatan wajib ikut
-- masuk kunci -- kalau tidak, nama desa yang kebetulan sama di 2 kecamatan
-- berbeda bisa salah dianggap kelompok yang sama (belum ketemu kasusnya di
-- data TA 2025 ini, tapi tidak ada ruginya jaga-jaga).
--
-- Ganti tipe return table (nambah kolom) perlu drop dulu, create or replace
-- tidak bisa mengubah struktur kolom return.
drop function if exists public.get_landing_stats();

create or replace function public.get_landing_stats()
returns table (total_alsintan bigint, total_kelompok bigint)
language sql
security definer
set search_path = public
as $$
  select
    count(*)::bigint as total_alsintan,
    count(distinct (penerima, desa, kecamatan))::bigint as total_kelompok
  from alsintan;
$$;

grant execute on function public.get_landing_stats() to anon;
