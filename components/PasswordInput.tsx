"use client";

import { forwardRef, useState, type CSSProperties, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

// Input password dengan tombol mata buat lihat/sembunyikan isian -- dipakai
// di semua form yang punya field password (login, tambah/edit pengguna,
// edit profil) supaya konsisten.
const PasswordInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function PasswordInput(
  { className, style, ...props },
  ref
) {
  const [visible, setVisible] = useState(false);
  const mergedStyle: CSSProperties = { ...style, paddingRight: "2.25rem" };

  return (
    <div className="relative">
      <input {...props} ref={ref} type={visible ? "text" : "password"} className={className} style={mergedStyle} />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
});

export default PasswordInput;
