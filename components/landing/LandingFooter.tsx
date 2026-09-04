import Link from "next/link";
import { Code2 } from "lucide-react";

export default function LandingFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-sm text-gray-500 sm:flex-row">
        <p>© {new Date().getFullYear()} AlsinTrack — Kabupaten Way Kanan</p>
        <Link
          href="https://github.com/dasx000"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 transition-colors hover:text-green-600"
        >
          <Code2 size={16} />
          Dibuat oleh dasx000
        </Link>
      </div>
    </footer>
  );
}
