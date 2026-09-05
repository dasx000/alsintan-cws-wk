-- Fitur Riwayat Servis & Pemanfaatan dihapus -- dinilai terlalu kompleks
-- untuk kebutuhan sekarang, mungkin dihidupkan lagi nanti. Modul Mutasi
-- sudah lebih dulu dihapus total di migration 0014 (termasuk tabelnya);
-- migration ini menuntaskan sisanya.
--
-- unit_perlu_perhatian (0007) dibangun dari data pemanfaatan & servis --
-- ikut di-drop karena tanpa kedua tabel itu logikanya sudah tidak relevan.
-- monev TIDAK ikut disentuh -- fitur itu tetap dipakai.

drop view if exists unit_perlu_perhatian;
drop table if exists pemanfaatan;
drop table if exists servis;
