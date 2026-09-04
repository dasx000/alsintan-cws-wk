-- Kolom detail teknis unit (merk, tipe, no rangka/mesin, nilai aset) tidak
-- dibutuhkan lagi -- dibuang dari skema alsintan.

alter table alsintan drop column merk;
alter table alsintan drop column tipe;
alter table alsintan drop column no_rangka;
alter table alsintan drop column no_mesin;
alter table alsintan drop column nilai_aset;
