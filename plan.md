# Ide Fitur Lanjutan — Aplikasi Alsintan

Catatan ide dari diskusi (2026-09-04), belum dieksekusi. Terinspirasi dari [SIMANTAN Kaltim](https://simantan.kaltimprov.go.id/) tapi disesuaikan skala kabupaten & tujuan internal (bukan publik).

## Kandidat fitur

### 1. Grafik tren tahunan di dashboard
Chart jumlah unit alsintan per `tahun_pengadaan`, bisa dipecah per jenis. Data sudah tersedia di tabel `alsintan` (kolom `tahun_pengadaan`), tinggal agregasi + chart.
- **Plus:** murah dikerjakan, tidak perlu skema baru.
- **Minus:** baru terasa gunanya kalau data sudah terkumpul lintas beberapa tahun — kalau input baru mulai tahun ini, grafik cuma satu titik.

### 2. Perbandingan antar-kecamatan
Pilih 2-3 kecamatan, tampilkan jumlah unit/jenis/kondisi berdampingan. Berguna untuk rapat koordinasi penyuluh (lihat kesenjangan bantuan antar wilayah).
- **Plus:** nilai organisasi jelas — bahan laporan/keputusan alokasi bantuan.
- **Minus:** perlu UI pemilihan multi-kecamatan + query agregasi per kecamatan, lebih banyak kerja dari opsi 1.

### 3. Visualisasi kepadatan di peta — dua opsi berbeda, jangan disamakan

Dibedah dari [SIMANTAN Kaltim](https://simantan.kaltimprov.go.id/), yang mereka pakai sebenarnya **choropleth**, bukan heatmap murni. Dua teknik ini beda kebutuhan data, jangan disamakan:

**3a. Choropleth (wilayah kecamatan diwarnai per kepadatan)** — persis yang kelihatan di SIMANTAN:
- Layer dasar: polygon batas kecamatan diwarnai biru→kuning→merah sesuai kepadatan di wilayah itu ("Kepadatan Distribusi: Rendah → Tinggi")
- Di atasnya: marker titik lokasi asli tiap kelompok/brigade (posisi presisi, bukan area)
- Filter di bawah peta: Kategori Bantuan, Jenis Bantuan, Kabupaten/Kota, Tahun Anggaran, Sumber Anggaran + tombol Terapkan
- Confirmed pakai **Leaflet** (attribution "Leaflet | © OpenStreetMap" kelihatan di peta) — sama dengan library yang sudah dipakai di app ini, bukan library baru.
- **WAJIB butuh data polygon batas 15 kecamatan Way Kanan (GeoJSON)** — ini yang belum ada di project. Kode wilayah resmi (`master_kecamatan`, `master_desa`) yang sudah ada cuma ID + nama, bukan bentuk geografis. Perlu dicari terpisah (geoportal BIG / data terbuka Kemendagri) sebelum fitur ini bisa dibuat.
- **Plus:** visual per-kecamatan resmi, cocok untuk bahan perbandingan/laporan formal antar wilayah.
- **Minus:** blocker data boundary belum ada; kerja tambahan cari & impor GeoJSON sebelum mulai coding.

**3b. Heatmap murni (kepadatan titik, tanpa batas wilayah)** — teknik berbeda, alternatif lebih murah:
- Cukup pakai koordinat lat/long unit alsintan yang **sudah ada** di tabel `alsintan` sekarang — digambar sebagai gradasi kerapatan titik, tidak perlu tahu bentuk kecamatan sama sekali.
- Library kecil seperti `leaflet.heat` (~4KB), sejalan dengan prinsip "minim dependency, performa dulu" di prompt awal aplikasi ini.
- **Plus:** tidak ada blocker data, bisa langsung dikerjakan kapan saja dengan data yang sudah ada.
- **Minus:** tidak memberi angka/perbandingan resmi per kecamatan seperti choropleth — cuma gambaran visual kepadatan titik di peta.

Detail jalan/nama tempat yang terlihat rinci di peta SIMANTAN **bukan fitur custom** mereka — itu bawaan tile OpenStreetMap, sudah otomatis kita punya juga (lihat perubahan `maxZoom` di [components/MapBaseLayers.tsx](components/MapBaseLayers.tsx), sudah dikerjakan 2026-09-04).

**Status 3a — SELESAI (2026-09-04):** sempat dicek lewat OpenStreetMap (Overpass API) dan hasilnya kosong (OSM cuma punya batas kabupaten, bukan kecamatan, untuk Way Kanan) — awalnya disimpulkan blocker nyata. Ternyata kesimpulan itu salah/terlalu cepat: sumber yang benar ditemukan setelahnya, yaitu **Badan Informasi Geospasial (BIG)**, instansi resmi pemetaan nasional, lewat layanan REST publik gratis `geoservices.big.go.id/rbi/rest/services/BATASWILAYAH/Administrasi_AR_Kecamatan_10K` (data edisi 2022, cakupan seluruh Indonesia, format ArcGIS REST, bisa export langsung ke GeoJSON). Ke-15 kecamatan Way Kanan berhasil diambil, nama & kode (`WADMKC`, `KDCPUM`) cocok persis dengan `master_kecamatan` yang sudah ada di database.

Data mentahnya terlalu detail untuk web (skala 1:10.000, ~47rb titik, ~1.9MB) — disederhanakan pakai `mapshaper -simplify dp 8% keep-shapes` (topology-aware, supaya tidak ada celah di batas antar kecamatan yang bertetangga) jadi ~4.260 titik, ~82KB. File disimpan di `public/geo/way-kanan-kecamatan.geojson` (bukan dependency baru — mapshaper cuma dipakai sekali lewat `npx`, tidak masuk `package.json`).

**Implementasi:** komponen baru `components/KecamatanChoropleth.tsx` — fetch GeoJSON tadi secara lazy (saat peta di-mount), warnai tiap polygon kecamatan berdasar jumlah unit alsintan di sana (skala warna indigo muda→tua, abu-abu kalau 0 unit), hover nampilkan nama kecamatan + jumlah unit (tooltip sticky). Menggantikan pendekatan lingkaran/bubble sebelumnya (fungsi `computeKecamatanBubbles`/`bubbleRadius` di `PetaSebaran.tsx` sudah dihapus). Tetap sebagai layer overlay "Jumlah per Kecamatan" (toggle di kontrol layer, default nonaktif) lewat `MapBaseLayers.tsx` yang sekarang terima `children` untuk overlay tambahan.

**Pelajaran:** jangan simpulkan "data tidak tersedia" dari satu sumber yang gagal (OSM) — coba juga sumber resmi pemerintah (BIG/BPS/Kemendagri) yang seringkali justru lebih lengkap dan gratis untuk data administratif Indonesia.

## Pertanyaan yang perlu dijawab sebelum eksekusi

- Berapa banyak data alsintan yang sudah diinput sekarang? (Menentukan apakah opsi 1/3 sudah relevan atau masih terlalu dini.)
- Siapa yang paling sering buka dashboard — penyuluh lapangan (butuh info operasional cepat) atau atasan/koordinator (butuh gambaran besar untuk laporan)? Menentukan prioritas fitur statistik vs fitur operasional harian.
- Ada keluhan konkret dari pemakaian sekarang di luar tiga ide di atas — data yang susah dicari, laporan yang masih manual di luar aplikasi, atau langkah kerja penyuluh yang belum terwakili di menu yang ada? (Biasanya sumber ide paling tajam karena datang dari gesekan pemakaian nyata, bukan tebakan dari aplikasi lain.)

## Yang sengaja tidak diadopsi dari SIMANTAN

Data publik terbuka (open data download), WebGIS per wilayah, FAQ publik — karena aplikasi ini internal (penyuluh only), bukan untuk diakses publik.
