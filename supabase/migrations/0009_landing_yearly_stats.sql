-- Fungsi publik kedua untuk landing page: jumlah alsintan tersalurkan per
-- tahun pengadaan, 5 tahun kalender terakhir (dari tahun berjalan mundur 4
-- tahun) -- selalu 5 baris, tahun tanpa data tetap tampil dengan jumlah 0
-- (pakai generate_series + left join, bukan cuma group by yang otomatis
-- melompati tahun kosong). Sama seperti get_landing_stats() (lihat 0008),
-- SECURITY DEFINER + hanya kembalikan angka agregat, tidak pernah baris
-- data alsintan mentah.
create or replace function public.get_landing_yearly_stats()
returns table (tahun integer, jumlah bigint)
language sql
security definer
set search_path = public
as $$
  select
    y.tahun,
    coalesce(a.jumlah, 0)::bigint as jumlah
  from generate_series(
    extract(year from current_date)::int - 4,
    extract(year from current_date)::int
  ) as y(tahun)
  left join (
    select tahun_pengadaan as tahun, count(*)::bigint as jumlah
    from alsintan
    where tahun_pengadaan is not null
    group by tahun_pengadaan
  ) a on a.tahun = y.tahun
  order by y.tahun;
$$;

grant execute on function public.get_landing_yearly_stats() to anon;
