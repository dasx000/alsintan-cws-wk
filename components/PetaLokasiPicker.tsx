"use client";

import { MapContainer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import MapBaseLayers from "@/components/MapBaseLayers";

const markerIcon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Perkiraan titik tengah Kabupaten Way Kanan, dipakai sebagai default kalau
// unit belum punya koordinat.
const WAY_KANAN_CENTER: [number, number] = [-4.45, 104.35];

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function PetaLokasiPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const hasPosition = latitude != null && longitude != null;
  const center: [number, number] = hasPosition ? [latitude, longitude] : WAY_KANAN_CENTER;

  return (
    <div className="overflow-hidden rounded-md border border-gray-300">
      <MapContainer center={center} zoom={hasPosition ? 15 : 10} style={{ height: "260px", width: "100%" }}>
        <MapBaseLayers />
        <ClickHandler onPick={onChange} />
        {hasPosition && (
          <Marker
            position={[latitude, longitude]}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const pos = e.target.getLatLng();
                onChange(pos.lat, pos.lng);
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
