-- Fungsi publik kelima untuk landing page: jumlah alsintan per jenis
-- (Traktor Roda 2, Pompa Air, dst). Dikembalikan semua jenis + jumlahnya,
-- pembagian "top 5 + Lainnya" dilakukan di frontend (JenisChart.tsx) supaya
-- logikanya gampang diubah tanpa migration baru. Sama seperti fungsi
-- landing lain, SECURITY DEFINER + cuma agregat per jenis, bukan baris unit.
create or replace function public.get_landing_jenis_stats()
returns table (nama_jenis text, jumlah bigint)
language sql
security definer
set search_path = public
as $$
  select mj.nama_jenis, count(a.id)::bigint as jumlah
  from master_jenis_alsintan mj
  left join alsintan a on a.id_jenis = mj.id
  group by mj.nama_jenis
  order by count(a.id) desc;
$$;

grant execute on function public.get_landing_jenis_stats() to anon;
