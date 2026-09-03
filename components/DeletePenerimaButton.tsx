"use client";

import { useState, useTransition } from "react";
import { deletePenerima } from "@/lib/actions/penerima";

export default function DeletePenerimaButton({ id, nama }: { id: string; nama: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(`Hapus penerima "${nama}"?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deletePenerima(id);
      if (result.error) setError(result.error);
    });
  }

  return (
    <span>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Hapus
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </span>
  );
}
