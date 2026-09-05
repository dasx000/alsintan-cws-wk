"use client";

import { useRouter, useSearchParams } from "next/navigation";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Client component kecil -- ganti "size" di query param lalu reset ke
// halaman 1 (ganti ukuran halaman sambil tetap di halaman lama gampang
// nunjuk ke rentang data yang salah).
export default function PageSizeSelect({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("size", value);
    params.set("page", "1");
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <label className="flex items-center gap-2 text-sm text-gray-600">
      Tampilkan
      <select
        value={searchParams.get("size") ?? "10"}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
      >
        {PAGE_SIZE_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      data
    </label>
  );
}
