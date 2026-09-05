"use client";

import { LayersControl, MapContainer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Calendar, Landmark, MapPin, Tractor, Users, Wheat } from "lucide-react";
import { getMarkerIconHtml } from "@/lib/marker-icon";
import { KONDISI_BADGE_STYLES, kondisiLabel } from "@/lib/kondisi-alsintan";
import MapBaseLayers from "@/components/MapBaseLayers";
import KecamatanChoropleth from "@/components/KecamatanChoropleth";

export interface PetaMarkerData {
  id: string;
  id_unit: string;
  kondisi: string;
  kategori: string;
  nama_jenis: string;
  tahun_pengadaan: number;
  latitude: number;
  longitude: number;
  nama_kelompok: string | null;
  nama_desa: string | null;
  nama_kecamatan: string | null;
  nama_sumber_dana: string | null;
}

const WAY_KANAN_CENTER: [number, number] = [-4.45, 104.35];

function markerIconFor(kategori: string, kondisi: string) {
  return L.divIcon({
    html: getMarkerIconHtml(kategori, kondisi),
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
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
      {markers.map((m) => {
        const isPascaPanen = m.kategori === "pasca_panen";
        const KategoriIcon = isPascaPanen ? Wheat : Tractor;
        return (
          <Marker key={m.id} position={[m.latitude, m.longitude]} icon={markerIconFor(m.kategori, m.kondisi)}>
            <Popup minWidth={220} maxWidth={260}>
              <div className="-m-1 min-w-[190px]">
                <div className="flex items-center gap-2.5 border-b border-gray-100 pb-2.5">
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                      isPascaPanen ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                    }`}
                  >
                    <KategoriIcon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{m.nama_jenis}</p>
                  </div>
                </div>

                <span
                  className={`mt-2.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    KONDISI_BADGE_STYLES[m.kondisi] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {kondisiLabel(m.kondisi)}
                </span>

                <div className="mt-2.5 space-y-1.5 text-xs text-gray-600">
                  {m.nama_kelompok && (
                    <div className="flex items-start gap-2">
                      <Users size={13} className="mt-0.5 shrink-0 text-gray-400" />
                      <span>{m.nama_kelompok}</span>
                    </div>
                  )}
                  {m.nama_desa && (
                    <div className="flex items-start gap-2">
                      <MapPin size={13} className="mt-0.5 shrink-0 text-gray-400" />
                      <span>
                        {m.nama_desa}, {m.nama_kecamatan}
                      </span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <Calendar size={13} className="mt-0.5 shrink-0 text-gray-400" />
                    <span>Tahun pengadaan {m.tahun_pengadaan}</span>
                  </div>
                  {m.nama_sumber_dana && (
                    <div className="flex items-start gap-2">
                      <Landmark size={13} className="mt-0.5 shrink-0 text-gray-400" />
                      <span>Sumber dana {m.nama_sumber_dana}</span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
