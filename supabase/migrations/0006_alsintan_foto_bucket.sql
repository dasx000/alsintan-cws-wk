-- Bucket Storage untuk foto alsintan. Public=true supaya foto bisa
-- ditampilkan langsung lewat public URL tanpa perlu signed URL (foto alat,
-- bukan data sensitif -- konsisten dengan prinsip kesederhanaan project ini).
insert into storage.buckets (id, name, public)
values ('alsintan-foto', 'alsintan-foto', true)
on conflict (id) do nothing;

-- Siapa saja boleh baca (perlu untuk public URL, request publik tidak
-- membawa token sehingga dievaluasi sebagai role anon).
create policy alsintan_foto_public_read on storage.objects
  for select using (bucket_id = 'alsintan-foto');

-- Upload/ubah/hapus foto: harus login. Kontrol lebih detail (siapa boleh
-- ubah data alsintan mana) sudah ditangani RLS tabel alsintan itu sendiri.
create policy alsintan_foto_authenticated_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'alsintan-foto');

create policy alsintan_foto_authenticated_update on storage.objects
  for update to authenticated using (bucket_id = 'alsintan-foto') with check (bucket_id = 'alsintan-foto');

create policy alsintan_foto_authenticated_delete on storage.objects
  for delete to authenticated using (bucket_id = 'alsintan-foto');
