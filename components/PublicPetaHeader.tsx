import Link from "next/link";
import { Tractor } from "lucide-react";

// Header sederhana untuk halaman publik di luar AppShell (peta sebaran
// sekarang bisa diakses tanpa login -- lihat migration 0011).
export default function PublicPetaHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-green-600 text-white">
            <Tractor size={19} />
          </span>
          <span className="font-semibold tracking-tight text-gray-900">AlsinTrack</span>
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-green-600 px-5 py-2 text-sm font-medium text-green-600 transition-all hover:bg-green-600 hover:text-white"
        >
          Masuk
        </Link>
      </div>
    </header>
  );
}
