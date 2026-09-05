-- Fungsi publik keempat untuk landing page: jumlah alsintan per kategori
-- (pra_panen / pasca_panen -- cuma 2 nilai di enum kategori_alsintan, lihat
-- 0012_jenis_alsintan_kategori.sql, tidak ada kategori "lainnya" di skema
-- ini). Sama seperti fungsi landing lain, SECURITY DEFINER + cuma agregat.
create or replace function public.get_landing_kategori_stats()
returns table (kategori kategori_alsintan, jumlah bigint)
language sql
security definer
set search_path = public
as $$
  select mj.kategori, count(a.id)::bigint as jumlah
  from master_jenis_alsintan mj
  left join alsintan a on a.id_jenis = mj.id
  group by mj.kategori;
$$;

grant execute on function public.get_landing_kategori_stats() to anon;
