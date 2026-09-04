import Image from "next/image";
import { ChevronDown } from "lucide-react";

// Foto sawah asli Way Kanan (bukan foto stok) sebagai background hero --
// modifikasi dari pola SIMANTAN yang pakai foto sawah generik, ini dokumentasi
// sendiri supaya lebih otentik ke konteks kabupaten ini.
export default function LandingHero({ totalAlsintan }: { totalAlsintan: number }) {
  return (
    <section id="beranda" className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-20">
        <Image
          src="/images/hero-sawah.jpg"
          alt="Sawah di Kabupaten Way Kanan"
          fill
          priority
          className="object-cover blur-[2px] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-green-950/85 via-green-900/70 to-green-950/90" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-24 text-center text-white">
        <p className="animate-fade-in-up mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-green-200">
          CWS Kabupaten Way Kanan
        </p>

        <h1
          className="animate-fade-in-up text-4xl font-bold leading-tight tracking-tight drop-shadow-sm sm:text-6xl"
          style={{ animationDelay: "100ms" }}
        >
          Monitoring <span className="text-yellow-400">Alsintan</span>
          <br className="hidden sm:block" /> Bantuan Pemerintah
        </h1>

        <p
          className="animate-fade-in-up mx-auto mt-6 max-w-2xl text-base text-green-100 sm:text-lg"
          style={{ animationDelay: "220ms" }}
        >
          Database unit, riwayat pemanfaatan &amp; servis, serta peta sebaran alat mesin pertanian se-Kabupaten Way
          Kanan.
        </p>

        <div
          className="animate-fade-in-up mt-10 rounded-2xl border border-white/15 bg-white/10 px-12 py-6 backdrop-blur-md"
          style={{ animationDelay: "340ms" }}
        >
          <p className="text-4xl font-bold tracking-tight sm:text-5xl">{totalAlsintan.toLocaleString("id-ID")}+</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-green-100">Alsintan Disalurkan</p>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-6 flex justify-center">
        <ChevronDown size={22} className="animate-bounce-slow text-white/60" />
      </div>
    </section>
  );
}
