-- Fungsi publik ketiga untuk landing page: jumlah alsintan tersalurkan per
-- kecamatan (semua 15 kecamatan Way Kanan, termasuk yang belum ada unit --
-- jumlah 0). Dipakai untuk choropleth "Sebaran" di landing page, cuma angka
-- agregat per kecamatan, TIDAK PERNAH koordinat presisi tiap unit -- itu
-- tetap hanya untuk pengguna yang sudah login (lihat /peta).
create or replace function public.get_landing_kecamatan_stats()
returns table (nama_kecamatan text, jumlah bigint)
language sql
security definer
set search_path = public
as $$
  select
    mk.nama_kecamatan,
    coalesce(count(a.id), 0)::bigint as jumlah
  from master_kecamatan mk
  left join master_desa md on md.id_kecamatan = mk.id_kecamatan
  left join penerima p on p.id_desa = md.id_desa
  left join alsintan a on a.id_penerima_saat_ini = p.id
  group by mk.nama_kecamatan
  order by mk.nama_kecamatan;
$$;

grant execute on function public.get_landing_kecamatan_stats() to anon;
