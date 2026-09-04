"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Tractor } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email atau password salah.");
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-green-700 p-10 text-white lg:flex">
        <div className="flex items-center gap-2">
          <Tractor size={22} />
          <span className="font-semibold">AlsinTrack</span>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Monitoring Alsintan Bantuan Pemerintah</h2>
          <p className="mt-2 max-w-md text-green-100">
            Database unit, riwayat pemanfaatan &amp; servis, serta peta sebaran alat mesin pertanian se-Kabupaten
            Way Kanan.
          </p>
        </div>
        <p className="text-xs text-green-200">AlsinTrack</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <Tractor size={20} className="text-green-600" />
            <span className="font-semibold text-gray-900">AlsinTrack</span>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="mb-1 text-lg font-semibold text-gray-900">Masuk</h1>
            <p className="mb-6 text-sm text-gray-500">Masuk untuk mengelola data alsintan.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? "Memproses..." : "Masuk"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
