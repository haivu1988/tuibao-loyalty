"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isValidPhone, normalizePhone } from "@/lib/utils";
import type { Customer } from "@/types";

export default function CustomerSearch({
  onFound,
}: {
  onFound: (c: Customer) => void;
}) {
  const supabase = createClient();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidPhone(phone)) {
      setError("Số điện thoại không hợp lệ (tối thiểu 8 chữ số).");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc("find_or_create_customer", {
      p_phone: normalizePhone(phone),
      p_full_name: name.trim() || null,
    });
    setLoading(false);

    if (error) {
      setError(error.message || "Không tìm được khách hàng.");
      return;
    }
    onFound(data as Customer);
    setPhone("");
    setName("");
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div>
        <label className="label" htmlFor="phone">
          Số điện thoại khách <span className="text-red-500">*</span>
        </label>
        <input
          id="phone"
          inputMode="tel"
          autoComplete="off"
          className="input text-lg tracking-wide"
          placeholder="0912 345 678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="name">
          Tên khách <span className="text-slate-400">(nếu tạo mới)</span>
        </label>
        <input
          id="name"
          className="input"
          placeholder="Nguyễn Văn A"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Đang tìm…" : "Tìm / tạo khách"}
      </button>
    </form>
  );
}
