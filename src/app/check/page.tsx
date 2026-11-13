"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { isValidPhone, normalizePhone } from "@/lib/utils";

export default function CheckLandingPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidPhone(phone)) {
      setError("Số điện thoại chưa hợp lệ (tối thiểu 8 chữ số).");
      return;
    }
    router.push(`/check/${normalizePhone(phone)}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={88} />
          <h1 className="mt-3 text-2xl font-black text-brand-700">
            Tra cứu tích điểm
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Nhập số điện thoại để xem bạn có bao nhiêu tick 🧋
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label" htmlFor="phone">
              Số điện thoại
            </label>
            <input
              id="phone"
              inputMode="tel"
              autoComplete="tel"
              autoFocus
              className="input text-center text-lg tracking-widest"
              placeholder="0912 345 678"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError(null);
              }}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full text-base">
            Xem tick của tôi
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Thẻ thành viên điện tử · TUIBAO
        </p>
      </div>
    </main>
  );
}
