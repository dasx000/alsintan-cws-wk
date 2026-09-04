-- Perataan struktur penerima: kolom alsintan.id_penerima_saat_ini (FK ke
-- tabel penerima) diganti 3 kolom teks bebas -- penerima, desa, kecamatan --
-- diisi lewat dropdown master wilayah di form tapi disimpan sebagai
-- snapshot teks, bukan relasi ternormalisasi lagi.
--
-- Konsekuensi (sudah didiskusikan & dikonfirmasi user):
--  - Tabel penerima dihapus total. jenis_kelompok, nama_ketua, kontak, dan
--    luas_garapan_ha ikut hilang -- isinya cuma data test/contoh, bukan
--    data produksi asli.
--  - Fitur Riwayat Mutasi (pindah unit antar kelompok penerima) dihapus
--    total, tabel mutasi ikut di-drop.
--  - RLS wilayah penyuluh disederhanakan: dibandingkan lewat NAMA kecamatan
--    langsung di kolom alsintan.kecamatan, bukan lewat rantai
--    penerima->desa->kecamatan lagi.
--
-- Urutan di bawah PENTING: policy & view lama yang masih mereferensikan
-- id_penerima_saat_ini harus di-drop/diganti DULU sebelum kolomnya sendiri
-- di-drop (Postgres menolak drop column yang masih ada dependennya).

alter table alsintan add column penerima text;
alter table alsintan add column desa text;
alter table alsintan add column kecamatan text;

-- Backfill data yang sudah ada (snapshot dari relasi lama sebelum dihapus).
update alsintan a
set penerima = p.nama_kelompok,
    desa = md.nama_desa,
    kecamatan = mk.nama_kecamatan
from penerima p
join master_desa md on md.id_desa = p.id_desa
join master_kecamatan mk on mk.id_kecamatan = md.id_kecamatan
where a.id_penerima_saat_ini = p.id;

drop table mutasi;

-- Policy lama mereferensikan id_penerima_saat_ini & kecamatan_of_penerima()
-- langsung -- drop dulu supaya kolomnya bisa di-drop di bawah.
drop policy alsintan_insert on alsintan;
drop policy alsintan_update on alsintan;

-- View lama juga mereferensikan id_penerima_saat_ini (lewat join penerima) --
-- ganti definisinya sebelum kolom dihapus supaya dependensinya lepas.
create or replace view stat_alsintan_per_kecamatan
with (security_invoker = true) as
select mk.id_kecamatan, mk.nama_kecamatan, count(a.id) as jumlah
from master_kecamatan mk
left join alsintan a on a.kecamatan = mk.nama_kecamatan
group by mk.id_kecamatan, mk.nama_kecamatan
order by mk.nama_kecamatan;

alter table alsintan drop column id_penerima_saat_ini;

drop table penerima;

drop function if exists kecamatan_of_penerima(uuid);

-- current_kecamatan_wilayah() & kecamatan_of_alsintan() sekarang kerja
-- langsung dengan NAMA kecamatan (bukan kode) supaya bisa dibandingkan
-- langsung dengan kolom alsintan.kecamatan yang teks bebas.
create or replace function current_kecamatan_wilayah() returns text
language sql stable security definer set search_path = public as $$
  select mk.nama_kecamatan
  from profiles p
  join master_kecamatan mk on mk.id_kecamatan = p.id_kecamatan_wilayah
  where p.id = auth.uid();
$$;

create or replace function kecamatan_of_alsintan(alsintan_id uuid) returns text
language sql stable security definer set search_path = public as $$
  select kecamatan from alsintan where id = alsintan_id;
$$;

-- RLS alsintan insert/update baru: bandingkan langsung ke kolom kecamatan
-- baris sendiri, tidak perlu lagi kecamatan_of_penerima().
create policy alsintan_insert on alsintan for insert to authenticated with check (
  app_current_role() = 'admin'
  or (
    app_current_role() = 'penyuluh'
    and (
      current_kecamatan_wilayah() is null
      or kecamatan is null
      or current_kecamatan_wilayah() = kecamatan
    )
  )
);

create policy alsintan_update on alsintan for update to authenticated using (
  app_current_role() = 'admin'
  or (
    app_current_role() = 'penyuluh'
    and (
      current_kecamatan_wilayah() is null
      or kecamatan is null
      or current_kecamatan_wilayah() = kecamatan
    )
  )
) with check (
  app_current_role() = 'admin' or app_current_role() = 'penyuluh'
);

-- Fungsi landing (belum dipakai di kode) disamakan biar tidak nyangkut
-- referensi ke tabel yang sudah dihapus.
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
  left join alsintan a on a.kecamatan = mk.nama_kecamatan
  group by mk.nama_kecamatan
  order by mk.nama_kecamatan;
$$;
