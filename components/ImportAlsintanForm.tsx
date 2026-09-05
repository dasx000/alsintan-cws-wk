"use client";

import { useActionState } from "react";
import { UploadCloud } from "lucide-react";
import { importAlsintanExcel, type ImportActionState } from "@/lib/actions/alsintan-import";

const initialState: ImportActionState = { error: null };

export default function ImportAlsintanForm() {
  const [state, formAction, isPending] = useActionState(importAlsintanExcel, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">File Excel (.xlsx)</label>
        <input
          name="file"
          type="file"
          accept=".xlsx"
          required
          className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        <UploadCloud size={16} />
        {isPending ? "Memproses..." : "Impor Data"}
      </button>

      {state.success && (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          Berhasil! {state.insertedCount} unit alsintan ditambahkan.
        </p>
      )}

      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <p>{state.error}</p>
          {state.rowErrors && state.rowErrors.length > 0 && (
            <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto border-t border-red-200 pt-2 text-xs">
              {state.rowErrors.map((e, i) => (
                <li key={i}>
                  Baris {e.row}: {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
