"use client";

import { BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";

export interface KategoriDatum {
  kategori: "pra_panen" | "pasca_panen";
  jumlah: number;
}

const LABELS: Record<string, string> = {
  pra_panen: "Prapanen",
  pasca_panen: "Pascapanen",
};

// Dua warna kontras yang tetap enak dipandang (bukan gradasi satu hue) --
// hijau (brand utama) berdampingan dengan amber supaya tidak monoton.
const COLORS: Record<string, string> = {
  pra_panen: "#16a34a", // green-600
  pasca_panen: "#f59e0b", // amber-500
};

export default function KategoriChart({ data }: { data: KategoriDatum[] }) {
  const total = data.reduce((sum, d) => sum + d.jumlah, 0);
  const hasData = total > 0;

  const chartData = data.map((d) => ({
    name: LABELS[d.kategori] ?? d.kategori,
    jumlah: d.jumlah,
    persen: hasData ? Math.round((d.jumlah / total) * 1000) / 10 : 0,
    fill: COLORS[d.kategori] ?? "#9ca3af",
  }));

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <BarChart3 size={20} />
        </span>
        <div>
          <p className="font-semibold text-gray-900">Alsintan Prapanen vs Pascapanen</p>
          <p className="text-sm text-gray-500">Perbandingan jumlah alsintan tersalurkan per kategori</p>
        </div>
      </div>

      {hasData ? (
        <>
          <div className="mt-8 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 24, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 13, fill: "#374151", fontWeight: 600 }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={36} />
                <Bar dataKey="jumlah" radius={[10, 10, 0, 0]} maxBarSize={90}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                  <LabelList dataKey="jumlah" position="top" style={{ fontWeight: 700, fill: "#111827", fontSize: 13 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-center">
            {chartData.map((d) => (
              <div key={d.name}>
                <p className="text-2xl font-bold" style={{ color: d.fill }}>
                  {d.persen}%
                </p>
                <p className="text-xs text-gray-500">
                  {d.name} — {d.jumlah} unit
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-8 text-center text-sm text-gray-400">Belum ada data alsintan tercatat.</p>
      )}
    </div>
  );
}
