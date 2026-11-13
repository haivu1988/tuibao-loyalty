"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Customer, Gift } from "@/types";

export default function RedeemGift({
  customer,
  gifts,
  onUpdated,
}: {
  customer: Customer;
  gifts: Gift[];
  onUpdated: (c: Customer) => void;
}) {
  const supabase = createClient();
  const [confirmGift, setConfirmGift] = useState<Gift | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function handleRedeem(gift: Gift) {
    setError(null);
    setOk(null);
    setLoading(true);
    const { data, error } = await supabase.rpc("redeem_gift", {
      p_customer_id: customer.id,
      p_gift_id: gift.id,
    });
    setLoading(false);
    setConfirmGift(null);

    if (error) {
      setError(error.message || "Đổi quà thất bại.");
      return;
    }
    onUpdated(data as Customer);
    setOk(`Đã đổi "${gift.name}" (-${gift.tick_cost} tick).`);
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      {ok && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {ok}
        </p>
      )}

      <ul className="space-y-2">
        {gifts.length === 0 && (
          <li className="text-sm text-slate-400">Chưa có quà nào.</li>
        )}
        {gifts.map((gift) => {
          const enough = customer.ticks >= gift.tick_cost;
          const inStock = gift.stock > 0;
          const canRedeem = enough && inStock;
          return (
            <li
              key={gift.id}
              className="flex items-center gap-3 rounded-2xl border-2 border-brand-100 px-3 py-2.5"
            >
              {gift.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={gift.image_url}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-black/5"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl">
                  🎁
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800">
                  {gift.name}
                </p>
                <p className="text-xs text-slate-500">
                  {gift.tick_cost} tick · Còn {gift.stock}
                  {!enough && (
                    <span className="text-amber-600">
                      {" "}
                      · thiếu {gift.tick_cost - customer.ticks} tick
                    </span>
                  )}
                  {!inStock && <span className="text-red-500"> · hết hàng</span>}
                </p>
              </div>
              <button
                className={canRedeem ? "btn-primary" : "btn-secondary"}
                disabled={!canRedeem || loading}
                onClick={() => setConfirmGift(gift)}
              >
                Đổi
              </button>
            </li>
          );
        })}
      </ul>

      {/* Modal xác nhận */}
      {confirmGift && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Xác nhận đổi quà</h3>
            <p className="mt-2 text-sm text-slate-600">
              Đổi <b>{confirmGift.name}</b> cho khách{" "}
              <b>{customer.full_name || customer.phone}</b>?
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Trừ {confirmGift.tick_cost} tick (còn lại{" "}
              {customer.ticks - confirmGift.tick_cost}) và giảm 1 tồn kho.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                className="btn-secondary flex-1"
                onClick={() => setConfirmGift(null)}
                disabled={loading}
              >
                Huỷ
              </button>
              <button
                className="btn-primary flex-1"
                onClick={() => handleRedeem(confirmGift)}
                disabled={loading}
              >
                {loading ? "Đang đổi…" : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
