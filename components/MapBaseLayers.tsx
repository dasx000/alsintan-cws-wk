"use client";

import type { ReactNode } from "react";
import { LayersControl, LayerGroup, TileLayer } from "react-leaflet";

// Pilihan layer dasar peta: "Jalan" (OpenStreetMap, ada label sampai tingkat
// kampung/desa) sebagai default, "Satelit" (citra Esri World Imagery, gratis
// tanpa API key -- jangan pakai Google Maps yang butuh billing), dan
// "Satelit + Label" yang menumpuk citra satelit dengan layer referensi nama
// tempat dari Esri supaya tetap ada penanda lokasi di atas citra.
//
// `children` opsional untuk menambahkan LayersControl.Overlay (mis. layer
// kepadatan per kecamatan di halaman peta sebaran) supaya tetap satu kontrol
// layer saja, bukan dua kotak terpisah.
export default function MapBaseLayers({ children }: { children?: ReactNode }) {
  return (
    <LayersControl position="topright">
      <LayersControl.BaseLayer checked name="Jalan">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
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
