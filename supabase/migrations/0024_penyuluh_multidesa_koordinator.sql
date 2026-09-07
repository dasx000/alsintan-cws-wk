-- Model role final: cuma 2 role -- 'admin' (akses penuh se-kabupaten) dan
-- 'penyuluh'. Tidak ada role 'bpp' terpisah lagi (dibatalkan, belum pernah
-- dijalankan sebelumnya jadi aman diganti total di sini).
--
-- 'penyuluh' sekarang bisa pegang SATU ATAU LEBIH desa (tabel relasi
-- profile_desa, many-to-many -- bukan 1 kolom seperti draft sebelumnya),
-- ditambah 1 atribut boolean baru: koordinator.
--   - penyuluh biasa (koordinator = false): akses tulis alsintan+monev
--     cuma untuk desa-desa yang dia pegang lewat profile_desa.
--   - penyuluh koordinator = true: akses tulis untuk SEMUA desa di
--     kecamatan tempat desa-desa yang dia pegang berada (diturunkan
--     otomatis dari profile_desa+master_desa, BUKAN field kecamatan
--     terpisah yang dipilih manual -- supaya tidak ada data ganda yang
--     bisa tidak sinkron. Desa seorang koordinator dengan sendirinya ada
--     di kecamatan yang dia koordinasi).
-- Jadi satu akun bisa merangkap penyuluh lapangan + koordinator BPP tanpa
-- perlu akun/role kedua.
--
-- 'viewer' didekomisikan: Postgres tidak bisa drop value enum tanpa
-- membuat ulang tipenya (berisiko tinggi), jadi nilainya dibiarkan ada di
-- definisi tipe tapi TIDAK dipakai lagi di mana pun (dihapus dari pilihan
-- role di UI, tidak ada policy yang memberi hak apapun untuknya). Akun
-- yang kebetulan masih berrole 'viewer' dipindah ke 'penyuluh' di bawah.
--
-- PERUBAHAN KEAMANAN: wilayah kosong (belum pegang desa apapun) = TIDAK
-- ada akses tulis sama sekali (cuma bisa lihat), bukan "tidak dibatasi".
-- Ini supaya akun baru yang baru mendaftar (role default sekarang
-- 'penyuluh', karena 'viewer' sudah tidak dipakai) tidak otomatis dapat
-- akses admin ke sembarang desa sebelum di-assign admin lewat halaman
-- Kelola Pengguna.
--
-- id_kecamatan_wilayah (skema penyuluh-tingkat-kecamatan versi sangat
-- awal, migration 0001/0014) dihapus total -- digantikan sepenuhnya oleh
-- profile_desa + koordinator.

-- ============ TABEL RELASI PENYULUH <-> DESA (many-to-many) ============
create table profile_desa (
  profile_id uuid not null references profiles (id) on delete cascade,
  id_desa text not null references master_desa (id_desa) on delete cascade,
  primary key (profile_id, id_desa)
);
create index idx_profile_desa_desa on profile_desa (id_desa);

alter table profile_desa enable row level security;
create policy profile_desa_select on profile_desa for select to authenticated using (
  profile_id = auth.uid() or app_current_role() = 'admin'
);
create policy profile_desa_write on profile_desa for all to authenticated
  using (app_current_role() = 'admin') with check (app_current_role() = 'admin');

-- ============ ATRIBUT KOORDINATOR ============
alter table profiles add column koordinator boolean not null default false;

-- ============ PINDAHKAN AKUN 'viewer' YANG MASIH ADA ============
update profiles set role = 'penyuluh' where role = 'viewer';
alter table profiles alter column role set default 'penyuluh';

-- ============ BERSIHKAN SKEMA WILAYAH LAMA (kecamatan tunggal) ============
-- Drop policy dulu sebelum drop function/column yang direferensikan --
-- Postgres menolak drop yang masih ada dependennya.
drop policy if exists alsintan_insert on alsintan;
drop policy if exists alsintan_update on alsintan;
drop policy if exists monev_insert on monev;
drop policy if exists monev_update on monev;

drop function if exists current_kecamatan_wilayah();

alter table profiles drop column id_kecamatan_wilayah;

-- ============ FUNGSI HELPER WILAYAH BARU ============
-- Desa tempat sebuah unit alsintan (yang SUDAH ADA) berada -- dipakai RLS
-- monev, analog kecamatan_of_alsintan() yang sudah ada.
create function desa_of_alsintan(alsintan_id uuid) returns text
language sql stable security definer set search_path = public as $$
  select desa from alsintan where id = alsintan_id;
$$;

-- Inti aturan akses: admin selalu boleh; penyuluh boleh kalau desa/
-- kecamatan barisnya cocok dengan wilayah yang dia pegang (kecamatan
-- penuh kalau koordinator, desa spesifik kalau bukan).
create function can_manage_wilayah(p_kecamatan text, p_desa text) returns boolean
language sql stable security definer set search_path = public as $$
  select
    app_current_role() = 'admin'
    or exists (
      select 1
      from profiles p
      join profile_desa pd on pd.profile_id = p.id
      join master_desa md on md.id_desa = pd.id_desa
      join master_kecamatan mk on mk.id_kecamatan = md.id_kecamatan
      where p.id = auth.uid()
        and p.role = 'penyuluh'
        and (
          (p.koordinator and mk.nama_kecamatan = p_kecamatan)
          or (not p.koordinator and md.nama_desa = p_desa)
        )
    );
$$;

-- ============ RLS: ALSINTAN ============
drop policy if exists alsintan_delete on alsintan;

create policy alsintan_insert on alsintan for insert to authenticated with check (
  can_manage_wilayah(kecamatan, desa)
);

create policy alsintan_update on alsintan for update to authenticated using (
  can_manage_wilayah(kecamatan, desa)
) with check (
  can_manage_wilayah(kecamatan, desa)
);

create policy alsintan_delete on alsintan for delete to authenticated using (
  can_manage_wilayah(kecamatan, desa)
);

-- ============ RLS: MONEV ============
-- monev_delete SEBELUMNYA TIDAK ADA SAMA SEKALI di skema manapun (bug
-- lama -- artinya deleteMonev() di lib/actions/riwayat.ts diam-diam tidak
-- menghapus apapun untuk siapapun, RLS default deny kalau tidak ada
-- policy yang cocok). Ditambahkan sekalian di sini.
drop policy if exists monev_delete on monev;

create policy monev_insert on monev for insert to authenticated with check (
  can_manage_wilayah(kecamatan_of_alsintan(id_alsintan), desa_of_alsintan(id_alsintan))
);

create policy monev_update on monev for update to authenticated using (
  can_manage_wilayah(kecamatan_of_alsintan(id_alsintan), desa_of_alsintan(id_alsintan))
) with check (
  can_manage_wilayah(kecamatan_of_alsintan(id_alsintan), desa_of_alsintan(id_alsintan))
);

create policy monev_delete on monev for delete to authenticated using (
  can_manage_wilayah(kecamatan_of_alsintan(id_alsintan), desa_of_alsintan(id_alsintan))
);
