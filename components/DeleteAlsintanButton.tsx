"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteAlsintan } from "@/lib/actions/alsintan";

export default function DeleteAlsintanButton({ id, idUnit }: { id: string; idUnit: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(`Hapus unit "${idUnit}"? Riwayat terkait juga akan terhapus.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteAlsintan(id);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/alsintan");
    });
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <Trash2 size={15} />
        {isPending ? "Menghapus..." : "Hapus"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
