"use client";

import { LayersControl, MapContainer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import Link from "next/link";
import { getMarkerIconHtml } from "@/lib/marker-icon";
import { kondisiLabel } from "@/lib/kondisi-alsintan";
import MapBaseLayers from "@/components/MapBaseLayers";
import KecamatanChoropleth from "@/components/KecamatanChoropleth";

export interface PetaMarkerData {
  id: string;
  id_unit: string;
  kondisi: string;
  kategori: string;
  nama_jenis: string;
  latitude: number;
  longitude: number;
  nama_kelompok: string | null;
  nama_desa: string | null;
  nama_kecamatan: string | null;
}

const WAY_KANAN_CENTER: [number, number] = [-4.45, 104.35];

function markerIconFor(kategori: string, kondisi: string) {
  return L.divIcon({
    html: getMarkerIconHtml(kategori, kondisi),
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
}

function countByKecamatan(markers: PetaMarkerData[]) {
  const counts = new Map<string, number>();
  for (const m of markers) {
    if (!m.nama_kecamatan) continue;
    counts.set(m.nama_kecamatan, (counts.get(m.nama_kecamatan) ?? 0) + 1);
  }
  return counts;
}

export default function PetaSebaran({ markers }: { markers: PetaMarkerData[] }) {
  return (
    <MapContainer center={WAY_KANAN_CENTER} zoom={10} style={{ height: "70vh", width: "100%" }}>
      <MapBaseLayers>
        <LayersControl.Overlay checked name="Jumlah per Kecamatan">
          <KecamatanChoropleth counts={countByKecamatan(markers)} />
        </LayersControl.Overlay>
      </MapBaseLayers>
      <MarkerClusterGroup chunkedLoading>
        {markers.map((m) => (
          <Marker key={m.id} position={[m.latitude, m.longitude]} icon={markerIconFor(m.kategori, m.kondisi)}>
            <Popup>
              <div className="text-sm">
                <p className="font-mono font-semibold">{m.id_unit}</p>
                <p>{m.nama_jenis}</p>
                <p>Kondisi: {kondisiLabel(m.kondisi)}</p>
                {m.nama_kelompok && <p>Penerima: {m.nama_kelompok}</p>}
                {m.nama_desa && (
                  <p>
                    {m.nama_desa}, {m.nama_kecamatan}
                  </p>
                )}
                <Link href={`/alsintan/${m.id}`} className="text-green-600 hover:underline">
                  Lihat detail →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
