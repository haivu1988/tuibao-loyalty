"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
  const [ticks, setTicks] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);

    const nTicks = parseInt(ticks, 10);
    if (!nTicks || nTicks < 1) {
      setError("Số tick phải ≥ 1.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc("earn_ticks", {
      p_customer_id: customer.id,
      p_invoice_number: invoice.trim() || null,
      p_amount: Math.max(parseInt(amount.replace(/\D/g, ""), 10) || 0, 0),
      p_ticks: nTicks,
    });
    setLoading(false);

    if (error) {
      setError(error.message || "Tích tick thất bại.");
      return;
    }

    onUpdated(data as Customer);
    setOk(`Đã tích ${nTicks} tick cho khách.`);
    setInvoice("");
    setAmount("");
    setTicks("1");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="invoice">
            Số hoá đơn
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
            Số tiền (đ)
          </label>
          <input
            id="amount"
            inputMode="numeric"
            className="input"
            placeholder="150000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="ticks">
          Số tick cộng
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setTicks(String(n))}
              className={`btn ${
                ticks === String(n) ? "btn-primary" : "btn-secondary"
              } px-3`}
            >
              +{n}
            </button>
          ))}
          <input
            id="ticks"
            inputMode="numeric"
            className="input w-20"
            value={ticks}
            onChange={(e) => setTicks(e.target.value.replace(/\D/g, ""))}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      {ok && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {ok}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Đang xử lý…" : "Tích tick"}
      </button>
    </form>
  );
}
