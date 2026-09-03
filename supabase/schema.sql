-- Jalankan di Supabase Dashboard > SQL Editor > New query > Run

create table if not exists alat (
  id uuid primary key default gen_random_uuid(),
  nama_alat text not null,
  kategori text not null,
  jumlah integer not null default 0,
  kondisi text not null default 'baik' check (kondisi in ('baik', 'rusak ringan', 'rusak berat')),
  created_at timestamptz not null default now()
);

-- RLS diaktifkan tapi dibuat permisif (akses publik) khusus untuk project testing ini.
-- Aplikasi final nanti wajib pakai RLS + auth yang benar sebelum ada data sungguhan.
alter table alat enable row level security;

create policy "public_select_alat" on alat for select using (true);
create policy "public_insert_alat" on alat for insert with check (true);
create policy "public_update_alat" on alat for update using (true) with check (true);
create policy "public_delete_alat" on alat for delete using (true);
