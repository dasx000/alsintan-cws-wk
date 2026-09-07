// Parser koordinat yang fleksibel untuk hasil copy-paste dari berbagai app
// HP (Google Maps, GPS Status, Maps.me, dsb) yang formatnya beda-beda:
// titik ATAU koma sbg pemisah desimal, spasi/koma/titik-koma sbg pemisah
// lintang-bujur, ada/tidaknya huruf mata angin (N/S/E/W), dan notasi
// derajat-menit-detik (DMS, mis. 4°20'15.2"S).
//
// Bukan parser universal -- format yang sangat tidak lazim (mis. DMS murni
// tanpa simbol derajat/menit/detik sama sekali dan tanpa pemisah apa pun)
// tetap bisa gagal, tapi ini mencakup mayoritas format yang benar-benar
// keluar dari app GPS/peta di HP.

export interface ParsedCoordinate {
  lat: number;
  lng: number;
}

function toDecimalDMS(deg: number, min: number, sec: number, letter: string): number {
  const magnitude = Math.abs(deg) + min / 60 + sec / 3600;
  if (letter === "S" || letter === "W") return -magnitude;
  if (letter === "N" || letter === "E") return magnitude;
  return deg < 0 ? -magnitude : magnitude;
}

function finalize(lat: number, lng: number): ParsedCoordinate | null {
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  // Beberapa app/link menaruh bujur duluan -- kalau lintang di luar
  // jangkauan tapi bujur cocok kalau ditukar, tukar otomatis.
  if ((lat < -90 || lat > 90) && lng >= -90 && lng <= 90) {
    [lat, lng] = [lng, lat];
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
}

// Satu token: "derajat[°] menit['] detik[\"] [huruf]" atau desimal polos
// dengan huruf mata angin opsional di depan/belakang -- mis. "4.337557",
// "S4.337557", "4.337557 S", "4 20'15.2\"S".
function parseSingleToken(token: string): number | null {
  const t = token.trim();
  if (!t) return null;

  const m = t.match(
    /^([NSEWnsew])?\s*(-?\d{1,3}(?:\.\d+)?)\s*(?:(\d{1,2}(?:\.\d+)?)'\s*(?:(\d{1,2}(?:\.\d+)?)")?)?\s*([NSEWnsew])?$/
  );
  if (!m) return null;

  const letter = (m[1] || m[5] || "").toUpperCase();
  const deg = Number(m[2]);
  const min = m[3] ? Number(m[3]) : 0;
  const sec = m[4] ? Number(m[4]) : 0;
  if (Number.isNaN(deg)) return null;

  return toDecimalDMS(deg, min, sec, letter);
}

function axisOf(token: string): "lat" | "lng" | null {
  const letter = token.match(/[NSEWnsew]/)?.[0]?.toUpperCase();
  if (!letter) return null;
  return letter === "N" || letter === "S" ? "lat" : "lng";
}

// Pisahkan teks jadi 2 token angka (lintang & bujur), coba beberapa gaya
// pemisah yang umum dipakai app HP, dari yang paling lazim ke yang jarang.
function splitIntoTwoTokens(text: string): [string, string] | null {
  const byComma = text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (byComma.length === 2) return [byComma[0], byComma[1]];
  if (byComma.length === 4 && byComma.every((p) => /^-?\d+$/.test(p.replace(/[NSEWnsew\s]/g, "")))) {
    // Gaya Indonesia: koma dipakai SEKALIGUS sbg desimal & pemisah, mis.
    // "-4,337557, 104,587753".
    return [`${byComma[0]}.${byComma[1]}`, `${byComma[2]}.${byComma[3]}`];
  }

  const bySemicolon = text
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  if (bySemicolon.length === 2) return [bySemicolon[0], bySemicolon[1]];

  // Tanpa koma/titik-koma -- kalau ada tanda detik ("), potong tepat
  // setelahnya (+ huruf mata angin kalau nempel), format DMS biasanya utuh
  // sampai situ.
  const afterSeconds = text.match(/^(.*?"\s*[NSEWnsew]?)\s+(.+)$/);
  if (afterSeconds) return [afterSeconds[1].trim(), afterSeconds[2].trim()];

  const bySpace = text.split(/\s+/).filter(Boolean);
  if (bySpace.length === 2) return [bySpace[0].replace(",", "."), bySpace[1].replace(",", ".")];
  if (bySpace.length === 4) {
    // Gaya "S 4.337557 E 104.587753" (huruf mata angin terpisah spasi).
    return [`${bySpace[0]}${bySpace[1]}`, `${bySpace[2]}${bySpace[3]}`];
  }

  return null;
}

export function parseCoordinateInput(raw: string): ParsedCoordinate | null {
  if (!raw || !raw.trim()) return null;

  const text = raw
    .trim()
    .replace(/[°º⁰]/g, " ")
    .replace(/[′’]/g, "'")
    .replace(/[″”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();

  const parts = splitIntoTwoTokens(text);
  if (!parts) return null;

  const v0 = parseSingleToken(parts[0]);
  const v1 = parseSingleToken(parts[1]);
  if (v0 == null || v1 == null) return null;

  // Kalau huruf mata angin menandakan urutannya kebalik (bujur duluan),
  // tukar sebelum divalidasi -- kalau tidak ada huruf, pakai urutan apa
  // adanya (lintang lalu bujur, konvensi paling umum).
  if (axisOf(parts[0]) === "lng" && axisOf(parts[1]) === "lat") {
    return finalize(v1, v0);
  }
  return finalize(v0, v1);
}
