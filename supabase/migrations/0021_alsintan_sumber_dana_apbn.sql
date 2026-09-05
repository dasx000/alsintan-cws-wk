-- Isi sumber dana untuk 270 unit hasil import TA 2025 (migration 0017) --
-- program bantuan alsintan kabupaten ini didanai APBN, kolom id_sumber_dana
-- sebelumnya sengaja dikosongkan saat import karena datanya belum ada saat
-- itu di sumber (Excel).
update alsintan
set id_sumber_dana = (select id from master_sumber_dana where nama_sumber = 'APBN')
where id_sumber_dana is null;
