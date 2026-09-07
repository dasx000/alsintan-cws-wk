"use client";

import type { ReactNode } from "react";
import { LayersControl, LayerGroup, TileLayer } from "react-leaflet";

// Pilihan layer dasar peta: "Jalan" (tile Esri Light Gray Canvas tanpa label
// nama tempat) sebagai default, "Satelit" (citra Esri World Imagery, gratis
// tanpa API key -- jangan pakai Google Maps yang butuh billing), dan
// "Satelit + Label" yang menumpuk citra satelit dengan layer referensi nama
// tempat dari Esri supaya tetap ada penanda lokasi di atas citra.
//
// Layer "Jalan" sengaja tanpa label nama kampung/desa bawaan (beda dari tile
// OSM standar) karena label semacam itu bersumber dari data OSM yang sering
// meleset untuk desa-desa kecil di Way Kanan (contoh: node "Kasui Pasar" di
// OSM ternyata ada di wilayah kecamatan lain menurut batas resmi BIG).
// Nama desa yang akurat ditampilkan lewat DesaHighlight di
// PetaLokasiPicker.tsx, yang sumbernya data batas desa resmi kita sendiri.
// Sempat dicoba tile CARTO Voyager tanpa label, tapi ternyata sekarang
// mewajibkan API key di tier gratisnya -- jadi dipakai layanan tile Esri
// yang sama dengan layer Satelit, sudah terbukti gratis tanpa key.
//
// `children` opsional untuk menambahkan LayersControl.Overlay (mis. layer
// kepadatan per kecamatan di halaman peta sebaran) supaya tetap satu kontrol
// layer saja, bukan dua kotak terpisah.
export default function MapBaseLayers({ children }: { children?: ReactNode }) {
  return (
    <LayersControl position="topright">
      <LayersControl.BaseLayer checked name="Jalan">
        <TileLayer
          attribution="Tiles &copy; Esri"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
          maxNativeZoom={16}
        />
      </LayersControl.BaseLayer>

      <LayersControl.BaseLayer name="Satelit">
        <TileLayer
          attribution="Tiles &copy; Esri"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
          maxNativeZoom={17}
        />
      </LayersControl.BaseLayer>

      <LayersControl.BaseLayer name="Satelit + Label">
        <LayerGroup>
          <TileLayer
            attribution="Tiles &copy; Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
            maxNativeZoom={17}
          />
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
            maxNativeZoom={17}
          />
        </LayerGroup>
      </LayersControl.BaseLayer>

      {children}
    </LayersControl>
  );
}
