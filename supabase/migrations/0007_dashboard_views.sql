-- View agregasi untuk dashboard statistik. security_invoker=true supaya
-- view menghormati RLS pemanggilnya (bukan RLS pemilik view) -- meski di
-- kasus ini semua authenticated sudah boleh baca tabel alsintan/penerima,
-- ini praktik yang benar untuk Postgres 15+.

create view stat_alsintan_per_jenis
with (security_invoker = true) as
select mj.id as id_jenis, mj.nama_jenis, count(a.id) as jumlah
from master_jenis_alsintan mj
left join alsintan a on a.id_jenis = mj.id
group by mj.id, mj.nama_jenis
order by mj.nama_jenis;

create view stat_alsintan_per_kondisi
with (security_invoker = true) as
select kondisi, count(*) as jumlah
from alsintan
group by kondisi;

create view stat_alsintan_per_kecamatan
with (security_invoker = true) as
select mk.id_kecamatan, mk.nama_kecamatan, count(a.id) as jumlah
from master_kecamatan mk
left join master_desa md on md.id_kecamatan = mk.id_kecamatan
left join penerima p on p.id_desa = md.id_desa
left join alsintan a on a.id_penerima_saat_ini = p.id
group by mk.id_kecamatan, mk.nama_kecamatan
order by mk.nama_kecamatan;

-- Unit "perlu perhatian": belum ada laporan pemanfaatan lewat dari 3 bulan,
-- atau kondisi rusak berat tapi belum pernah ada catatan servis sama sekali.
create view unit_perlu_perhatian
with (security_invoker = true) as
select
  a.id,
  a.id_unit,
  a.kondisi,
  mj.nama_jenis,
  pm_terakhir.tanggal as tanggal_pemanfaatan_terakhir,
  (pm_terakhir.tanggal is null or pm_terakhir.tanggal < (current_date - interval '3 months')) as tanpa_pemanfaatan_3bulan,
  (a.kondisi = 'rusak_berat' and sv_ada.id_alsintan is null) as rusak_berat_tanpa_servis
from alsintan a
join master_jenis_alsintan mj on mj.id = a.id_jenis
left join lateral (
  select max(tanggal) as tanggal from pemanfaatan where id_alsintan = a.id
) pm_terakhir on true
left join lateral (
  select id_alsintan from servis where id_alsintan = a.id limit 1
) sv_ada on true
where
  (pm_terakhir.tanggal is null or pm_terakhir.tanggal < (current_date - interval '3 months'))
  or (a.kondisi = 'rusak_berat' and sv_ada.id_alsintan is null);

grant select on stat_alsintan_per_jenis to authenticated;
grant select on stat_alsintan_per_kondisi to authenticated;
grant select on stat_alsintan_per_kecamatan to authenticated;
grant select on unit_perlu_perhatian to authenticated;
