// Cari titik label yang DIJAMIN berada di dalam sebuah polygon/multipolygon
// GeoJSON -- bukan sekadar titik tengah bounding box (getBounds().getCenter()
// bawaan Leaflet), yang gampang jatuh di luar bentuk untuk kecamatan yang
// cekung/berkelok (mis. Pakuan Ratu, Way Tuba, Negeri Besar -- labelnya
// kelihatan nyasar ke kecamatan tetangga kalau pakai bbox center).
//
// Strategi: hitung centroid geometris (area-weighted) dari ring TERBESAR,
// cek apakah titik itu benar-benar di dalam polygon (lewat hole-nya kalau
// ada) -- kalau tidak, cari segmen horizontal terpanjang yang masih di
// dalam bentuk pada garis lintang centroid itu, dan pakai titik tengahnya.
// Bukan algoritma "pole of inaccessibility" penuh, tapi cukup buat bentuk
// administratif yang tidak terlalu fraktal.

import type { Polygon, MultiPolygon, Position } from "geojson";

// Position GeoJSON boleh punya elemen ke-3 opsional (altitude) -- di sini
// cuma [lng, lat] (index 0-1) yang pernah dibaca.
type Ring = Position[];
type PolygonCoords = Ring[]; // [exterior, ...holes]

function ringArea(ring: Ring): number {
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum / 2);
}

function ringCentroid(ring: Ring): [number, number] {
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    const cross = x1 * y2 - x2 * y1;
    area += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  area /= 2;
  if (area === 0) {
    const n = ring.length || 1;
    return [ring.reduce((s, p) => s + p[0], 0) / n, ring.reduce((s, p) => s + p[1], 0) / n];
  }
  return [cx / (6 * area), cy / (6 * area)];
}

function pointInRing(pt: [number, number], ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect = yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygon(pt: [number, number], polygon: PolygonCoords): boolean {
  if (!pointInRing(pt, polygon[0])) return false;
  for (let h = 1; h < polygon.length; h++) {
    if (pointInRing(pt, polygon[h])) return false;
  }
  return true;
}

// Segmen horizontal terpanjang yang masih di dalam exterior ring (holes
// diabaikan di sini -- kecamatan/desa di kabupaten ini tidak punya enclave)
// pada garis lintang y, dipakai sebagai fallback kalau centroid geometris
// jatuh di luar bentuk (umum untuk polygon cekung).
function widestScanlineMidpoint(y: number, exterior: Ring): [number, number] | null {
  const xs: number[] = [];
  for (let i = 0, j = exterior.length - 1; i < exterior.length; j = i++) {
    const [xi, yi] = exterior[i];
    const [xj, yj] = exterior[j];
    if (yi === yj) continue;
    if (yi > y !== yj > y) {
      xs.push(xi + ((y - yi) / (yj - yi)) * (xj - xi));
    }
  }
  xs.sort((a, b) => a - b);

  let best: [number, number] | null = null;
  let bestLen = -Infinity;
  for (let i = 0; i + 1 < xs.length; i += 2) {
    const len = xs[i + 1] - xs[i];
    if (len > bestLen) {
      bestLen = len;
      best = [(xs[i] + xs[i + 1]) / 2, y];
    }
  }
  return best;
}

export function getPolygonLabelPoint(geometry: Polygon | MultiPolygon): { lat: number; lng: number } {
  const polygons: PolygonCoords[] = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;

  // Pilih part terbesar (buat MultiPolygon yang punya pulau/enclave kecil,
  // label ditaruh di bagian utama, bukan di fragmen kecil).
  let mainPolygon = polygons[0];
  let mainArea = ringArea(polygons[0][0]);
  for (const p of polygons.slice(1)) {
    const a = ringArea(p[0]);
    if (a > mainArea) {
      mainArea = a;
      mainPolygon = p;
    }
  }

  const exterior = mainPolygon[0];
  const centroid = ringCentroid(exterior);

  const point: [number, number] = pointInPolygon(centroid, mainPolygon)
    ? centroid
    : (widestScanlineMidpoint(centroid[1], exterior) ?? centroid);

  return { lat: point[1], lng: point[0] };
}

// Titik ACAK yang dijamin di dalam polygon/multipolygon -- beda dari
// getPolygonLabelPoint (yang deterministik, buat penempatan label). Dipakai
// buat auto-isi koordinat form saat user baru pilih desa, biar marker-nya
// tidak nempel di 1 titik yang sama terus (rejection sampling di bounding
// box, part terbesar dulu buat MultiPolygon supaya tidak jatuh di
// pulau/enclave kecil).
export function getRandomPointInPolygon(geometry: Polygon | MultiPolygon): { lat: number; lng: number } {
  const polygons: PolygonCoords[] = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;

  let mainPolygon = polygons[0];
  let mainArea = ringArea(polygons[0][0]);
  for (const p of polygons.slice(1)) {
    const a = ringArea(p[0]);
    if (a > mainArea) {
      mainArea = a;
      mainPolygon = p;
    }
  }

  const exterior = mainPolygon[0];
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const [x, y] of exterior) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  for (let tries = 0; tries < 300; tries++) {
    const x = minX + Math.random() * (maxX - minX);
    const y = minY + Math.random() * (maxY - minY);
    if (pointInPolygon([x, y], mainPolygon)) return { lat: y, lng: x };
  }

  const avgX = exterior.reduce((s, p) => s + p[0], 0) / exterior.length;
  const avgY = exterior.reduce((s, p) => s + p[1], 0) / exterior.length;
  return { lat: avgY, lng: avgX };
}
