"use client";

import { useEffect, useRef, useState } from "react";
import { GeoJSON, LayerGroup } from "react-leaflet";
import type { Feature, FeatureCollection } from "geojson";
import type { Layer, Path, PathOptions, StyleFunction } from "leaflet";

// Batas kecamatan Way Kanan, sumber: Badan Informasi Geospasial (BIG), edisi
// 2022, disederhanakan (mapshaper -simplify dp 8% keep-shapes) dari ~47rb ke
// ~4.2rb titik supaya ringan diambil di browser. Nama field WADMKC harus
// persis sama dengan nama_kecamatan di database (lihat master_kecamatan).
const GEOJSON_URL = "/geo/way-kanan-kecamatan.geojson";

const NO_DATA_COLOR = "#e5e7eb";

// Gradasi biru -> kuning -> merah, mengikuti konvensi "Kepadatan Distribusi:
// Rendah -> Tinggi" di SIMANTAN Kaltim (lihat plan.md poin 3a). Diekspor
// supaya legenda di halaman peta pakai stop warna yang sama persis.
export const DENSITY_COLOR_STOPS: [number, number, number][] = [
  [37, 99, 235], // blue-600, rendah
  [250, 204, 21], // yellow-400, sedang
  [220, 38, 38], // red-600, tinggi
];

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

export function densityColor(t: number) {
  const [c1, c2] = t < 0.5 ? [DENSITY_COLOR_STOPS[0], DENSITY_COLOR_STOPS[1]] : [DENSITY_COLOR_STOPS[1], DENSITY_COLOR_STOPS[2]];
  const localT = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  const [r, g, b] = c1.map((start, i) => lerp(start, c2[i], localT));
  return `rgb(${r}, ${g}, ${b})`;
}

// `counts` dipetakan dari nama_kecamatan -> jumlah unit. Diterima langsung
// (bukan diturunkan dari marker) supaya komponen ini bisa dipakai ulang baik
// oleh /peta (data lengkap, authenticated) maupun landing page publik (cuma
// angka agregat per kecamatan, lihat get_landing_kecamatan_stats).
export default function KecamatanChoropleth({ counts }: { counts: Map<string, number> }) {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const layersRef = useRef<Map<string, Path>>(new Map());

  useEffect(() => {
    let cancelled = false;
    fetch(GEOJSON_URL)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setGeoData(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const maxCount = Math.max(1, ...Array.from(counts.values()));
  const totalCount = Array.from(counts.values()).reduce((a, b) => a + b, 0);

  function baseStyleFor(nama: string | undefined, jumlah: number): PathOptions {
    return {
      color: "#14532d", // green-900 (hijau tua, lebih gelap dari green-800 sebelumnya)
      weight: 1.5,
      fillColor: jumlah > 0 ? densityColor(jumlah / maxCount) : NO_DATA_COLOR,
      fillOpacity: 0.55,
    };
  }

  function selectedStyleFor(jumlah: number): PathOptions {
    return {
      color: "#facc15", // amber-400 -- kontras jelas dari batas hijau tua & isi biru/kuning/merah
      weight: 3.5,
      fillColor: jumlah > 0 ? densityColor(jumlah / maxCount) : NO_DATA_COLOR,
      fillOpacity: 0.75,
    };
  }

  const style: StyleFunction = (feature) => {
    const nama = feature?.properties?.WADMKC as string | undefined;
    const jumlah = nama ? (counts.get(nama) ?? 0) : 0;
    return nama && nama === selected ? selectedStyleFor(jumlah) : baseStyleFor(nama, jumlah);
  };

  function onEachFeature(feature: Feature, layer: Layer) {
    const nama = (feature.properties?.WADMKC as string | undefined) ?? "-";
    const jumlah = counts.get(nama) ?? 0;
    const persen = totalCount > 0 ? Math.round((jumlah / totalCount) * 1000) / 10 : 0;

    layersRef.current.set(nama, layer as Path);

    layer.bindTooltip(`${nama}: ${jumlah} unit`, { sticky: true });
    layer.bindPopup(
      `<div style="min-width:150px">
        <p style="font-weight:700;font-size:14px;margin:0 0 4px;color:#111827">${nama}</p>
        <p style="margin:0;line-height:1.1">
          <span style="font-size:22px;font-weight:800;color:#166534">${jumlah}</span>
          <span style="font-size:12px;font-weight:500;color:#6b7280"> unit</span>
        </p>
        <p style="font-size:12px;color:#6b7280;margin:4px 0 0">${persen}% dari total kabupaten</p>
      </div>`
    );

    layer.on({
      mouseover: (e) => {
        const l = e.target as Path;
        l.bringToFront();
        if (nama !== selected) l.setStyle({ weight: 2.5 });
      },
      mouseout: (e) => {
        const l = e.target as Path;
        if (nama !== selected) l.setStyle(baseStyleFor(nama, jumlah));
      },
      click: () => setSelected((prev) => (prev === nama ? null : nama)),
    });
  }

  // Sinkronkan style saat kecamatan yang dipilih berubah, tanpa remount
  // seluruh layer GeoJSON (biar tooltip/popup yang sedang terbuka tidak reset).
  useEffect(() => {
    layersRef.current.forEach((layer, nama) => {
      const jumlah = counts.get(nama) ?? 0;
      layer.setStyle(nama === selected ? selectedStyleFor(jumlah) : baseStyleFor(nama, jumlah));
      if (nama === selected) layer.bringToFront();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // LayerGroup harus SELALU dirender (bukan `null` saat geoData masih
  // fetching) -- kalau tidak, LayersControl.Overlay yang membungkusnya di
  // PetaSebaran.tsx kehilangan child layer yang stabil saat mount pertama,
  // dan prop `checked` gagal membuat overlay ini aktif secara default.
  return (
    <LayerGroup>
      {geoData && (
        <GeoJSON
          key={JSON.stringify(Array.from(counts.entries()))}
          data={geoData}
          style={style}
          onEachFeature={onEachFeature}
        />
      )}
    </LayerGroup>
  );
}
