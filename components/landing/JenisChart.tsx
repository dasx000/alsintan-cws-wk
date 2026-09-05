"use client";

import { Wrench } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";

export interface JenisDatum {
  nama_jenis: string;
  jumlah: number;
}

// 5 warna beda hue (bukan gradasi satu warna) + abu-abu netral khusus untuk
// "Lainnya" -- konvensi umum supaya bucket gabungan terasa beda dari 5
// kategori bernama, bukan sekadar warna ke-6 yang acak.
const PALETTE = ["#16a34a", "#2563eb", "#f59e0b", "#9333ea", "#e11d48"];
const LAINNYA_COLOR = "#6b7280";

interface ChartBar {
  name: string;
  jumlah: number;
  fill: string;
}

function buildTop5PlusLainnya(data: JenisDatum[]): ChartBar[] {
  const withData = [...data].filter((d) => d.jumlah > 0).sort((a, b) => b.jumlah - a.jumlah);
  const top5 = withData.slice(0, 5);
  const rest = withData.slice(5);
  const restTotal = rest.reduce((sum, d) => sum + d.jumlah, 0);

  const bars: ChartBar[] = top5.map((d, i) => ({ name: d.nama_jenis, jumlah: d.jumlah, fill: PALETTE[i] }));
  if (restTotal > 0) {
    bars.push({ name: "Lainnya", jumlah: restTotal, fill: LAINNYA_COLOR });
  }
  return bars;
}

export default function JenisChart({ data }: { data: JenisDatum[] }) {
  const bars = buildTop5PlusLainnya(data);
  const hasData = bars.length > 0;

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
          <Wrench size={20} />
        </span>
        <div>
          <p className="font-semibold text-gray-900">Jenis Alsintan Terbanyak</p>
          <p className="text-sm text-gray-500">Top 5 jenis alat mesin pertanian yang paling banyak tersalurkan</p>
        </div>
      </div>

      {hasData ? (
        <div className="mt-8 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars} margin={{ top: 24, right: 16, left: 0, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="name"
                angle={-20}
                textAnchor="end"
                interval={0}
                height={70}
                tick={{ fontSize: 11, fill: "#374151" }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={false}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={40} />
              <Bar dataKey="jumlah" radius={[10, 10, 0, 0]} maxBarSize={60}>
                {bars.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
                <LabelList dataKey="jumlah" position="top" style={{ fontWeight: 700, fill: "#111827", fontSize: 12 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-8 text-center text-sm text-gray-400">Belum ada data alsintan tercatat.</p>
      )}
    </div>
  );
}
