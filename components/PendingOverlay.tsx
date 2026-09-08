"use client";

import { Loader2 } from "lucide-react";

// Overlay spinner sederhana buat nutup jeda "diam" antara modal konfirmasi
// tertutup sampai server action-nya beres -- tanpa ini user ngira web-nya
// hang karena tidak ada tanda proses berjalan.
export default function PendingOverlay({ show, label = "Memproses..." }: { show: boolean; label?: string }) {
  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20"
    >
      <div className="flex items-center gap-2.5 rounded-lg bg-white px-4 py-3 shadow-xl">
        <Loader2 size={18} className="animate-spin text-green-600" />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
    </div>
  );
}
