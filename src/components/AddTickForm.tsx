"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TICK_RATE, ticksFromAmount, formatVND } from "@/lib/utils";
import type { Customer } from "@/types";

export default function AddTickForm({
  customer,
  onUpdated,
}: {
  customer: Customer;
  onUpdated: (c: Customer) => void;
}) {
  const supabase = createClient();
  const [invoice, setInvoice] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const amountNum = parseInt(amount.replace(/\D/g, ""), 10) || 0;
  const previewTicks = ticksFromAmount(amountNum);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (amountNum <= 0) {
      setError("Vui lòng nhập số tiền hoá đơn.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc("earn_ticks", {
      p_customer_id: customer.id,
      p_invoice_number: invoice.trim() || null,
      p_amount: amountNum,
      p_ticks: previewTicks, // server tự tính lại theo tiền, đây chỉ để tương thích
    });
    setLoading(false);

    if (error) {
      setError(error.message || "Tích tick thất bại.");
      return;
    }

    onUpdated(data as Customer);
    setOk(`Đã tích ${previewTicks} tick (${formatVND(amountNum)}).`);
    setInvoice("");
    setAmount("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="label" htmlFor="invoice">
          Số hoá đơn <span className="text-slate-400">(tuỳ chọn)</span>
        </label>
        <input
          id="invoice"
          className="input"
          placeholder="HD-00123"
          value={invoice}
          onChange={(e) => setInvoice(e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="amount">
          Số tiền hoá đơn (đ)
        </label>
        <input
          id="amount"
          inputMode="numeric"
          className="input text-lg"
          placeholder="150000"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {[20000, 35000, 50000, 100000].map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAmount(String(a))}
              className="btn-secondary h-8 px-3 text-xs"
            >
              {a / 1000}k
            </button>
          ))}
        </div>
      </div>

      {/* Xem trước số tick auto */}
      <div className="flex items-center justify-between rounded-2xl bg-brand-50 px-4 py-3">
        <span className="text-sm text-brand-800">
          Tự tính: mỗi {formatVND(TICK_RATE)} = 1 tick
        </span>
        <span className="pill-tick">+{previewTicks} tick</span>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      {ok && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {ok}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Đang xử lý…" : "Tích tick"}
      </button>
    </form>
  );
}
