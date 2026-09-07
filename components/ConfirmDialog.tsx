"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Info } from "lucide-react";

interface DialogState {
  variant: "confirm" | "alert";
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
}

// Pengganti window.confirm()/window.alert() bawaan browser dengan modal
// bergaya Tailwind yang konsisten sama desain app. Dipakai lewat hook:
//
//   const { confirm, alert, dialog } = useConfirmDialog();
//   ...
//   if (!(await confirm("Hapus data ini?", { danger: true }))) return;
//   ...
//   return <div>...{dialog}</div>;
//
// confirm()/alert() balikin Promise (resolve saat user klik tombol),
// menggantikan sifat blocking window.confirm sinkron -- makanya handler
// pemanggilnya perlu jadi async.
export function useConfirmDialog() {
  const [state, setState] = useState<DialogState | null>(null);
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback(
    (message: string, opts?: { title?: string; confirmLabel?: string; danger?: boolean }) => {
      return new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
        setState({
          variant: "confirm",
          title: opts?.title ?? "Konfirmasi",
          message,
          confirmLabel: opts?.confirmLabel ?? "Ya, lanjutkan",
          danger: opts?.danger ?? false,
        });
      });
    },
    []
  );

  const alert = useCallback((message: string, opts?: { title?: string }) => {
    return new Promise<void>((resolve) => {
      resolverRef.current = () => resolve();
      setState({
        variant: "alert",
        title: opts?.title ?? "Pemberitahuan",
        message,
        confirmLabel: "OK",
        danger: false,
      });
    });
  }, []);

  function handleClose(result: boolean) {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setState(null);
  }

  const dialog: ReactNode = state ? (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={() => handleClose(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-t-xl bg-white p-5 shadow-xl sm:rounded-xl"
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              state.danger ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
            }`}
          >
            {state.danger ? <AlertTriangle size={18} /> : <Info size={18} />}
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900">{state.title}</h2>
            <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{state.message}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {state.variant === "confirm" && (
            <button
              onClick={() => handleClose(false)}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
            >
              Batal
            </button>
          )}
          <button
            onClick={() => handleClose(true)}
            autoFocus
            className={`w-full rounded-md px-4 py-2 text-sm font-medium text-white sm:w-auto ${
              state.danger ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, alert, dialog };
}
