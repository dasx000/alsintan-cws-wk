"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteAlsintan } from "@/lib/actions/alsintan";
import { useConfirmDialog } from "@/components/ConfirmDialog";

export default function DeleteAlsintanButton({
  id,
  idUnit,
  compact = false,
  redirectTo = "/alsintan",
}: {
  id: string;
  idUnit: string;
  compact?: boolean;
  redirectTo?: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { confirm, alert, dialog } = useConfirmDialog();

  async function handleClick() {
    const ok = await confirm(`Hapus unit "${idUnit}"? Riwayat terkait juga akan terhapus.`, {
      title: "Hapus unit alsintan",
      confirmLabel: "Hapus",
      danger: true,
    });
    if (!ok) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteAlsintan(id);
      if (result.error) {
        if (compact) {
          await alert(result.error, { title: "Gagal menghapus" });
        } else {
          setError(result.error);
        }
        return;
      }
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  }

  if (compact) {
    return (
      <>
        <button
          onClick={handleClick}
          disabled={isPending}
          title="Hapus"
          className="inline-flex items-center justify-center rounded-md p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 size={15} />
        </button>
        {dialog}
      </>
    );
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
      {dialog}
    </div>
  );
}
