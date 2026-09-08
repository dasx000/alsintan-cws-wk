"use client";

import { useActionState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, Download, UploadCloud, XCircle } from "lucide-react";
import { importAlsintanExcel, type ImportActionState } from "@/lib/actions/alsintan-import";

const initialState: ImportActionState = { error: null };

function downloadErrorFile(base64: string) {
  const byteChars = atob(base64);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "baris-error-impor-alsintan.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ImportAlsintanForm() {
  const [state, formAction, isPending] = useActionState(importAlsintanExcel, initialState);

  useEffect(() => {
    if (state.errorFileBase64) downloadErrorFile(state.errorFileBase64);
  }, [state.errorFileBase64]);

  const hasRowErrors = !!state.rowErrors && state.rowErrors.length > 0;
  const isPartialSuccess = !!state.success && hasRowErrors;
  const isFullSuccess = !!state.success && !hasRowErrors && !state.error;
  const isFailure = !!state.error && !isPartialSuccess;

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

      {isFullSuccess && (
        <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <p>Berhasil! {state.insertedCount} unit alsintan ditambahkan.</p>
        </div>
      )}

      {isPartialSuccess && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <p>
              {state.insertedCount} baris berhasil diimpor, {state.rowErrors!.length} baris gagal dan tidak
              diimpor.
            </p>
          </div>
          <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto border-t border-amber-200 pt-2 text-xs">
            {state.rowErrors!.map((e, i) => (
              <li key={i}>
                Baris {e.row}: {e.message}
              </li>
            ))}
          </ul>
          {state.errorFileBase64 && (
            <button
              type="button"
              onClick={() => downloadErrorFile(state.errorFileBase64!)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-900 underline hover:no-underline"
            >
              <Download size={12} /> Unduh ulang file baris error
            </button>
          )}
        </div>
      )}

      {isFailure && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <div className="flex items-start gap-2">
            <XCircle size={16} className="mt-0.5 shrink-0" />
            <p>{state.error}</p>
          </div>
          {hasRowErrors && (
            <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto border-t border-red-200 pt-2 text-xs">
              {state.rowErrors!.map((e, i) => (
                <li key={i}>
                  Baris {e.row}: {e.message}
                </li>
              ))}
            </ul>
          )}
          {state.errorFileBase64 && (
            <button
              type="button"
              onClick={() => downloadErrorFile(state.errorFileBase64!)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-red-800 underline hover:no-underline"
            >
              <Download size={12} /> Unduh ulang file baris error
            </button>
          )}
        </div>
      )}
    </form>
  );
}
