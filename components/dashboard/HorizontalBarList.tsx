"use client";

import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";

export interface HorizontalBarDatum {
  name: string;
  jumlah: number;
}

// Isi pastel + garis tepi solid, sama konvensi seperti TopKecamatanChart di
// landing page -- di-cycle (modulo) supaya tetap jalan berapa pun jumlah
// barisnya (jenis alsintan / kecamatan bisa terus bertambah).
const PALETTE = [
  { fill: "#dcfce7", stroke: "#16a34a" },
  { fill: "#dbeafe", stroke: "#2563eb" },
  { fill: "#fef3c7", stroke: "#d97706" },
  { fill: "#f3e8ff", stroke: "#9333ea" },
  { fill: "#ffe4e6", stroke: "#e11d48" },
  { fill: "#cffafe", stroke: "#0891b2" },
  { fill: "#fce7f3", stroke: "#db2777" },
  { fill: "#e0e7ff", stroke: "#4f46e5" },
];

const LAINNYA_COLOR = { fill: "#f3f4f6", stroke: "#6b7280" };

export default function HorizontalBarList({
  icon,
  title,
  data,
  emptyLabel = "Belum ada data.",
  maxItems,
}: {
  icon: ReactNode;
  title: string;
  data: HorizontalBarDatum[];
  emptyLabel?: string;
  // Kalau diisi, cuma tampilkan top-N (urut terbanyak), sisanya digabung
  // jadi satu baris "Lainnya" -- supaya daftar yang jenisnya banyak (mis.
  // Unit per Jenis) tidak jadi terlalu panjang/berantakan.
  maxItems?: number;
}) {
  const sorted = [...data].sort((a, b) => b.jumlah - a.jumlah);
  const limited =
    maxItems && sorted.length > maxItems
      ? [
          ...sorted.slice(0, maxItems),
          { name: "Lainnya", jumlah: sorted.slice(maxItems).reduce((sum, d) => sum + d.jumlah, 0) },
        ]
      : sorted;
  const chartData = limited.map((d, i) =>
    d.name === "Lainnya" && maxItems && sorted.length > maxItems
      ? { ...d, ...LAINNYA_COLOR }
      : { ...d, ...PALETTE[i % PALETTE.length] }
  );
  const hasData = chartData.some((d) => d.jumlah > 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-2 text-gray-700">
        {icon}
        <h2 className="text-sm font-medium">{title}</h2>
      </div>

      {hasData ? (
        <div className="mt-4" style={{ height: Math.max(chartData.length * 32, 120) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 28, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={116}
                tick={{ fontSize: 11, fill: "#374151", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Bar dataKey="jumlah" radius={6} barSize={15}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} stroke={entry.stroke} strokeWidth={1.5} />
                ))}
                <LabelList dataKey="jumlah" position="right" style={{ fontWeight: 700, fill: "#111827", fontSize: 11 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-6 text-center text-sm text-gray-400">{emptyLabel}</p>
      )}
    </div>
  );
}
