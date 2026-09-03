-- Skema awal: Database & Peta Sebaran Alsintan Bantuan Pemerintah
-- Jalankan lewat `supabase db push`, atau paste manual di SQL Editor Supabase
-- (project Supabase khusus aplikasi ini, terpisah dari project testing CRUD).

create extension if not exists pgcrypto;

-- ============ ENUM ============

create type kondisi_alsintan as enum ('baik', 'rusak_ringan', 'rusak_berat', 'hilang');
create type role_pengguna as enum ('admin', 'penyuluh', 'viewer');
create type status_servis as enum ('proses', 'selesai');
create type jenis_kelompok_penerima as enum ('poktan', 'gapoktan', 'upja', 'brigade');

-- ============ MASTER DATA WILAYAH ============
-- ID pakai kode resmi Kemendagri/BPS (TEXT, bukan SERIAL) supaya presisi
-- dan bisa disandingkan langsung dengan data dinas/BPS.

create table master_kecamatan (
  id_kecamatan text primary key,
  nama_kecamatan text not null unique
);

create table master_desa (
  id_desa text primary key,
  id_kecamatan text not null references master_kecamatan (id_kecamatan) on delete restrict,
  nama_desa text not null
);

create index idx_master_desa_kecamatan on master_desa (id_kecamatan);

-- ============ MASTER DATA LAIN ============

create table master_jenis_alsintan (
  id uuid primary key default gen_random_uuid(),
  nama_jenis text not null unique,
  kode_ikon text not null,
  created_at timestamptz not null default now()
);

create table master_sumber_dana (
  id uuid primary key default gen_random_uuid(),
  nama_sumber text not null unique
);

-- ============ PENERIMA (KELOMPOK TANI) ============

create table penerima (
  id uuid primary key default gen_random_uuid(),
  nama_kelompok text not null,
  jenis_kelompok jenis_kelompok_penerima not null,
  nama_ketua text,
  kontak text,
  id_desa text not null references master_desa (id_desa) on delete restrict,
  luas_garapan_ha numeric,
  created_at timestamptz not null default now()
);

create index idx_penerima_desa on penerima (id_desa);

-- ============ ALSINTAN (UNIT) ============

create table alsintan (
  id uuid primary key default gen_random_uuid(),
  id_unit text not null unique,
  id_jenis uuid not null references master_jenis_alsintan (id) on delete restrict,
  merk text,
  tipe text,
  no_rangka text,
  no_mesin text,
  tahun_pengadaan integer not null,
  id_sumber_dana uuid references master_sumber_dana (id) on delete set null,
  no_bast text,
  tanggal_bast date,
  nilai_aset numeric,
  kondisi kondisi_alsintan not null default 'baik',
  id_penerima_saat_ini uuid references penerima (id) on delete set null,
  foto_url text,
  latitude double precision,
  longitude double precision,
  catatan text,
  dibuat_oleh uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_alsintan_kondisi on alsintan (kondisi);
create index idx_alsintan_jenis on alsintan (id_jenis);
create index idx_alsintan_tahun on alsintan (tahun_pengadaan);
create index idx_alsintan_penerima on alsintan (id_penerima_saat_ini);

create function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_alsintan_updated_at
  before update on alsintan
  for each row execute function set_updated_at();

-- ============ RIWAYAT ============

create table mutasi (
  id uuid primary key default gen_random_uuid(),
  id_alsintan uuid not null references alsintan (id) on delete cascade,
  id_penerima_lama uuid references penerima (id) on delete restrict,
  id_penerima_baru uuid references penerima (id) on delete restrict,
  tanggal date not null,
  no_surat text,
  keterangan text,
  dibuat_oleh uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_mutasi_alsintan on mutasi (id_alsintan);

create table pemanfaatan (
  id uuid primary key default gen_random_uuid(),
  id_alsintan uuid not null references alsintan (id) on delete cascade,
  tanggal date not null,
  luas_layanan_ha numeric,
  komoditas text,
  operator text,
  dibuat_oleh uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_pemanfaatan_alsintan on pemanfaatan (id_alsintan);

create table servis (
  id uuid primary key default gen_random_uuid(),
  id_alsintan uuid not null references alsintan (id) on delete cascade,
  tanggal date not null,
  kerusakan text,
  biaya numeric,
  sparepart text,
  status status_servis not null default 'proses',
  dibuat_oleh uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_servis_alsintan on servis (id_alsintan);

create table monev (
  id uuid primary key default gen_random_uuid(),
  id_alsintan uuid not null references alsintan (id) on delete cascade,
  tanggal_kunjungan date not null,
  kondisi_terverifikasi kondisi_alsintan,
  catatan text,
  foto_url text,
  petugas text,
  created_at timestamptz not null default now()
);

create index idx_monev_alsintan on monev (id_alsintan);

-- ============ PROFILES (ROLE & AKSES) ============

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nama text,
  role role_pengguna not null default 'viewer',
  id_kecamatan_wilayah text references master_kecamatan (id_kecamatan) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_profiles_kecamatan on profiles (id_kecamatan_wilayah);

-- Auto-buat baris profiles saat user baru mendaftar lewat Supabase Auth,
-- default role 'viewer' (admin naikkan role-nya manual lewat halaman kelola pengguna).
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============ HELPER UNTUK RLS ============
-- security definer supaya bisa baca tabel profiles tanpa terjebak RLS-nya sendiri
-- (recursive policy check) saat dipakai di policy tabel lain.

create function app_current_role() returns role_pengguna
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create function current_kecamatan_wilayah() returns text
language sql stable security definer set search_path = public as $$
  select id_kecamatan_wilayah from profiles where id = auth.uid();
$$;

-- Kecamatan tempat sebuah penerima berada, lewat penerima -> desa -> kecamatan.
-- Dipakai untuk cek wilayah dari kolom id_penerima_saat_ini langsung (aman
-- dipakai di WITH CHECK insert/update alsintan, tidak query balik ke baris
-- alsintan yang sedang ditulis).
create function kecamatan_of_penerima(penerima_id uuid) returns text
language sql stable security definer set search_path = public as $$
  select md.id_kecamatan
  from penerima p
  join master_desa md on md.id_desa = p.id_desa
  where p.id = penerima_id;
$$;

-- Kecamatan tempat sebuah unit alsintan (yang SUDAH ADA di tabel) berada saat
-- ini. Dipakai di tabel riwayat (mutasi/pemanfaatan/servis/monev) yang mengacu
-- ke id_alsintan milik baris lain, bukan baris yang sedang ditulis sendiri.
create function kecamatan_of_alsintan(alsintan_id uuid) returns text
language sql stable security definer set search_path = public as $$
  select kecamatan_of_penerima(a.id_penerima_saat_ini)
  from alsintan a
  where a.id = alsintan_id;
$$;

-- ============ ROW LEVEL SECURITY ============

alter table master_kecamatan enable row level security;
alter table master_desa enable row level security;
alter table master_jenis_alsintan enable row level security;
alter table master_sumber_dana enable row level security;
alter table penerima enable row level security;
alter table alsintan enable row level security;
alter table mutasi enable row level security;
alter table pemanfaatan enable row level security;
alter table servis enable row level security;
alter table monev enable row level security;
alter table profiles enable row level security;

-- Master wilayah: data resmi tetap, semua user login boleh baca, hanya admin
-- yang boleh ubah (dan itu pun seharusnya lewat migration, bukan lewat UI).
create policy master_kecamatan_select on master_kecamatan for select to authenticated using (true);
create policy master_kecamatan_write on master_kecamatan for all to authenticated
  using (app_current_role() = 'admin') with check (app_current_role() = 'admin');

create policy master_desa_select on master_desa for select to authenticated using (true);
create policy master_desa_write on master_desa for all to authenticated
  using (app_current_role() = 'admin') with check (app_current_role() = 'admin');

-- Jenis alsintan: semua baca, hanya admin kelola (sesuai fitur CRUD jenis alsintan).
create policy master_jenis_select on master_jenis_alsintan for select to authenticated using (true);
create policy master_jenis_write on master_jenis_alsintan for all to authenticated
  using (app_current_role() = 'admin') with check (app_current_role() = 'admin');

create policy master_sumber_dana_select on master_sumber_dana for select to authenticated using (true);
create policy master_sumber_dana_write on master_sumber_dana for all to authenticated
  using (app_current_role() = 'admin') with check (app_current_role() = 'admin');

-- Penerima: semua baca. admin+penyuluh boleh tambah/ubah, dibatasi kecamatan
-- kalau id_kecamatan_wilayah penyuluh terisi. Hapus hanya admin.
create policy penerima_select on penerima for select to authenticated using (true);

create policy penerima_insert on penerima for insert to authenticated with check (
  app_current_role() = 'admin'
  or (
    app_current_role() = 'penyuluh'
    and (
      current_kecamatan_wilayah() is null
      or current_kecamatan_wilayah() = (select id_kecamatan from master_desa where id_desa = penerima.id_desa)
    )
  )
);

create policy penerima_update on penerima for update to authenticated using (
  app_current_role() = 'admin'
  or (
    app_current_role() = 'penyuluh'
    and (
      current_kecamatan_wilayah() is null
      or current_kecamatan_wilayah() = (select id_kecamatan from master_desa where id_desa = penerima.id_desa)
    )
  )
) with check (
  app_current_role() = 'admin'
  or (
    app_current_role() = 'penyuluh'
    and (
      current_kecamatan_wilayah() is null
      or current_kecamatan_wilayah() = (select id_kecamatan from master_desa where id_desa = penerima.id_desa)
    )
  )
);

create policy penerima_delete on penerima for delete to authenticated using (app_current_role() = 'admin');

-- Alsintan: semua baca (biar penyuluh lihat gambaran kabupaten). admin+penyuluh
-- boleh tambah/ubah, dibatasi kecamatan penerima saat ini kalau penyuluh
-- terikat wilayah. Unit yang belum ada penerima (id_penerima_saat_ini null)
-- boleh ditambah/diubah penyuluh manapun (belum jelas kecamatannya). Hapus admin saja.
create policy alsintan_select on alsintan for select to authenticated using (true);

create policy alsintan_insert on alsintan for insert to authenticated with check (
  app_current_role() = 'admin'
  or (
    app_current_role() = 'penyuluh'
    and (
      current_kecamatan_wilayah() is null
      or id_penerima_saat_ini is null
      or current_kecamatan_wilayah() = kecamatan_of_penerima(id_penerima_saat_ini)
    )
  )
);

create policy alsintan_update on alsintan for update to authenticated using (
  app_current_role() = 'admin'
  or (
    app_current_role() = 'penyuluh'
    and (
      current_kecamatan_wilayah() is null
      or id_penerima_saat_ini is null
      or current_kecamatan_wilayah() = kecamatan_of_penerima(id_penerima_saat_ini)
    )
  )
) with check (
  app_current_role() = 'admin' or app_current_role() = 'penyuluh'
);

create policy alsintan_delete on alsintan for delete to authenticated using (app_current_role() = 'admin');

-- Riwayat (mutasi/pemanfaatan/servis/monev): semua baca, admin+penyuluh
-- tambah/ubah (dibatasi kecamatan unit terkait kalau penyuluh terikat wilayah),
-- hapus admin saja.
create policy mutasi_select on mutasi for select to authenticated using (true);
create policy mutasi_insert on mutasi for insert to authenticated with check (
  app_current_role() = 'admin'
  or (
    app_current_role() = 'penyuluh'
    and (current_kecamatan_wilayah() is null or current_kecamatan_wilayah() = kecamatan_of_alsintan(id_alsintan))
  )
);
create policy mutasi_update on mutasi for update to authenticated using (
  app_current_role() = 'admin'
  or (
    app_current_role() = 'penyuluh'
    and (current_kecamatan_wilayah() is null or current_kecamatan_wilayah() = kecamatan_of_alsintan(id_alsintan))
  )
) with check (app_current_role() = 'admin' or app_current_role() = 'penyuluh');
create policy mutasi_delete on mutasi for delete to authenticated using (app_current_role() = 'admin');

create policy pemanfaatan_select on pemanfaatan for select to authenticated using (true);
create policy pemanfaatan_insert on pemanfaatan for insert to authenticated with check (
  app_current_role() = 'admin'
  or (
    app_current_role() = 'penyuluh'
    and (current_kecamatan_wilayah() is null or current_kecamatan_wilayah() = kecamatan_of_alsintan(id_alsintan))
  )
);
create policy pemanfaatan_update on pemanfaatan for update to authenticated using (
  app_current_role() = 'admin'
  or (
    app_current_role() = 'penyuluh'
    and (current_kecamatan_wilayah() is null or current_kecamatan_wilayah() = kecamatan_of_alsintan(id_alsintan))
  )
) with check (app_current_role() = 'admin' or app_current_role() = 'penyuluh');
create policy pemanfaatan_delete on pemanfaatan for delete to authenticated using (app_current_role() = 'admin');

create policy servis_select on servis for select to authenticated using (true);
create policy servis_insert on servis for insert to authenticated with check (
  app_current_role() = 'admin'
  or (
    app_current_role() = 'penyuluh'
    and (current_kecamatan_wilayah() is null or current_kecamatan_wilayah() = kecamatan_of_alsintan(id_alsintan))
  )
);
create policy servis_update on servis for update to authenticated using (
  app_current_role() = 'admin'
  or (
    app_current_role() = 'penyuluh'
    and (current_kecamatan_wilayah() is null or current_kecamatan_wilayah() = kecamatan_of_alsintan(id_alsintan))
  )
) with check (app_current_role() = 'admin' or app_current_role() = 'penyuluh');
create policy servis_delete on servis for delete to authenticated using (app_current_role() = 'admin');

create policy monev_select on monev for select to authenticated using (true);
create policy monev_insert on monev for insert to authenticated with check (
  app_current_role() = 'admin'
  or (
    app_current_role() = 'penyuluh'
    and (current_kecamatan_wilayah() is null or current_kecamatan_wilayah() = kecamatan_of_alsintan(id_alsintan))
  )
);
create policy monev_update on monev for update to authenticated using (
  app_current_role() = 'admin'
  or (
    app_current_role() = 'penyuluh'
    and (current_kecamatan_wilayah() is null or current_kecamatan_wilayah() = kecamatan_of_alsintan(id_alsintan))
  )
) with check (app_current_role() = 'admin' or app_current_role() = 'penyuluh');
create policy monev_delete on monev for delete to authenticated using (app_current_role() = 'admin');

-- Profiles: user boleh baca profilnya sendiri, admin boleh baca semua.
-- Hanya admin yang boleh ubah role/wilayah siapapun (termasuk dirinya sendiri).
create policy profiles_select on profiles for select to authenticated using (
  id = auth.uid() or app_current_role() = 'admin'
);
create policy profiles_update on profiles for update to authenticated using (
  app_current_role() = 'admin'
) with check (app_current_role() = 'admin');
