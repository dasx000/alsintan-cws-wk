-- Fungsi publik (dipanggil oleh pengunjung anon, tanpa login) yang HANYA
-- mengembalikan satu angka agregat untuk landing page ("Bantuan Tersalurkan").
-- Pakai SECURITY DEFINER supaya bisa baca tabel alsintan meski RLS-nya
-- membatasi akses ke authenticated saja -- fungsi ini sengaja hanya
-- mengembalikan count, tidak pernah baris data, supaya tidak membuka akses
-- baca tabel alsintan ke publik.
create or replace function public.get_landing_stats()
returns table (total_alsintan bigint)
language sql
security definer
set search_path = public
as $$
  select count(*)::bigint from alsintan;
$$;

grant execute on function public.get_landing_stats() to anon;
