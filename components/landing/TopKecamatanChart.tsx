"use client";

import { Info, MapPin } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";

export interface KecamatanDatum {
  nama_kecamatan: string;
  jumlah: number;
  jumlah_kelompok: number;
}

// Isi pastel + garis tepi warna solid senada -- bukan blok warna pekat --
// supaya batang terasa ringan/lembut tapi tetap gampang dibedakan per rank.
const RANK_COLORS = [
  { fill: "#dcfce7", stroke: "#16a34a" }, // green-100 / green-600
  { fill: "#dbeafe", stroke: "#2563eb" }, // blue-100 / blue-600
  { fill: "#fef3c7", stroke: "#d97706" }, // amber-100 / amber-600
  { fill: "#f3e8ff", stroke: "#9333ea" }, // purple-100 / purple-600
  { fill: "#ffe4e6", stroke: "#e11d48" }, // rose-100 / rose-600
];

export default function TopKecamatanChart({ data }: { data: KecamatanDatum[] }) {
  const total = data.reduce((sum, d) => sum + d.jumlah, 0);
  const top5 = [...data]
    .filter((d) => d.jumlah > 0)
    .sort((a, b) => b.jumlah - a.jumlah)
    .slice(0, 5)
    .map((d, i) => ({
      name: d.nama_kecamatan,
      jumlah: d.jumlah,
      persen: total > 0 ? Math.round((d.jumlah / total) * 1000) / 10 : 0,
      ...RANK_COLORS[i],
    }));
  const hasData = top5.length > 0;

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
          <MapPin size={20} />
        </span>
        <div>
          <p className="font-semibold text-gray-900">Top 5 Kecamatan Penerima Terbanyak</p>
          <p className="text-sm text-gray-500">Kecamatan dengan jumlah alsintan tersalurkan tertinggi</p>
        </div>
      </div>

      {hasData ? (
        <>
          <div className="mt-8" style={{ height: top5.length * 56 + 40 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top5} layout="vertical" margin={{ top: 0, right: 30, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 13, fill: "#374151", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Bar dataKey="jumlah" radius={10} barSize={30}>
                  {top5.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} stroke={entry.stroke} strokeWidth={1.5} />
                  ))}
                  <LabelList
                    dataKey="jumlah"
                    position="right"
                    style={{ fontWeight: 700, fill: "#111827", fontSize: 13 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-center sm:grid-cols-5">
            {top5.map((d) => (
              <div key={d.name}>
                <p className="text-lg font-bold" style={{ color: d.stroke }}>
                  {d.jumlah} <span className="text-xs font-medium text-gray-400">unit</span>
                </p>
                <p className="text-xs text-gray-600">{d.name}</p>
                <p className="text-[11px] text-gray-400">{d.persen}% dari total</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
            <Info size={16} className="mt-0.5 shrink-0" />
            <p>
              Menampilkan 5 dari 15 kecamatan di Kabupaten Way Kanan dengan jumlah alsintan tersalurkan tertinggi.
            </p>
          </div>
        </>
      ) : (
        <p className="mt-8 text-center text-sm text-gray-400">Belum ada data alsintan tercatat.</p>
      )}
    </div>
  );
}
