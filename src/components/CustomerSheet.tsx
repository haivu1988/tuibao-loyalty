"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ticksFromAmount,
  formatPhone,
  formatVND,
  findNearGift,
  TICK_RATE,
  formatThousands,
} from "@/lib/utils";
import { useKeyboardOpen } from "@/lib/useKeyboard";
import AmountInput, { QuickAmounts } from "./AmountInput";
import type { SuccessData } from "./SuccessModal";
import type { Customer, Gift } from "@/types";

interface Props {
  customer: Customer;
  gifts: Gift[];
  startOnRedeem?: boolean;
  onClose: () => void;
  onSuccess: (data: SuccessData) => void;
}

type Tab = "earn" | "redeem";

export default function CustomerSheet({
  customer: initialCustomer,
  gifts,
  startOnRedeem,
  onClose,
  onSuccess,
}: Props) {
  const supabase = createClient();
  const keyboardOpen = useKeyboardOpen();
  const nameRef = useRef<HTMLInputElement>(null);
  const invoiceRef = useRef<HTMLInputElement>(null);

  const [customer, setCustomer] = useState(initialCustomer);
  const [needName, setNeedName] = useState(!initialCustomer.full_name);
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [tab, setTab] = useState<Tab>(startOnRedeem ? "redeem" : "earn");
  const [invoice, setInvoice] = useState("");
  const [amount, setAmount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [redeemOk, setRedeemOk] = useState<string | null>(null);

  const ticks = ticksFromAmount(amount);
  const near = findNearGift(customer.ticks, gifts);
  const activeGifts = gifts.filter((g) => g.active);
  const redeemable = activeGifts.filter(
    (g) => g.stock > 0 && customer.ticks >= g.tick_cost
  );

  // Tự đưa con trỏ vào ô cần nhập
  useEffect(() => {
    const t = setTimeout(() => {
      if (needName) nameRef.current?.focus();
      else if (tab === "earn") invoiceRef.current?.focus();
    }, 350);
    return () => clearTimeout(t);
  }, [needName, tab]);

  /** Lưu tên khách mới */
  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Hãy nhập tên khách");
      return;
    }
    setSavingName(true);
    setError(null);

    const { data, error: err } = await supabase.rpc("set_customer_name", {
      p_customer_id: customer.id,
      p_full_name: name.trim(),
    });

    setSavingName(false);
    if (err) {
      setError(err.message || "Không lưu được tên");
      return;
    }
    setCustomer(data as Customer);
    setNeedName(false);
  }

  /** Tích tick */
  async function handleEarn(e: React.FormEvent) {
    e.preventDefault();
    if (amount <= 0) {
      setError("Chưa nhập số tiền hoá đơn");
      return;
    }
    if (ticks < 1) {
      setError(`Số tiền chưa đủ ${formatThousands(TICK_RATE)}đ để tích 1 tick`);
      return;
    }

    setSaving(true);
    setError(null);

    const { data, error: err } = await supabase.rpc("earn_ticks", {
      p_customer_id: customer.id,
      p_invoice_number: invoice.trim() || null,
      p_amount: amount,
      p_ticks: ticks,
    });

    setSaving(false);

    if (err) {
      const msg = err.message || "";
      if (msg.includes("uq_invoice_branch_date") || msg.includes("duplicate")) {
        setError("Hoá đơn này đã được tích tick hôm nay rồi!");
      } else {
        setError(msg || "Tích tick thất bại");
      }
      return;
    }

    const updated = data as Customer;
    const newTicks = updated.ticks;

    const unlocked = activeGifts.filter(
      (g) =>
        g.stock > 0 &&
        newTicks >= g.tick_cost &&
        customer.ticks < g.tick_cost
    );
    const next = activeGifts
      .filter((g) => g.tick_cost > newTicks)
      .sort((a, b) => a.tick_cost - b.tick_cost)[0];

    // Lấy id giao dịch vừa tạo để có thể huỷ trong 5 phút
    const { data: lastTx } = await supabase
      .from("transactions")
      .select("id")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    onSuccess({
      transactionId: (lastTx as { id: string } | null)?.id ?? null,
      customerName: customer.full_name || "Khách",
      customerPhone: customer.phone,
      invoiceNumber: invoice.trim() || null,
      amount,
      ticksEarned: newTicks - customer.ticks,
      newTicks,
      unlockedGifts: unlocked,
      nextGift: next ? { name: next.name, diff: next.tick_cost - newTicks } : null,
    });
  }

  /** Đổi quà */
  async function handleRedeem(gift: Gift) {
    setRedeemingId(gift.id);
    setError(null);
    setRedeemOk(null);

    const { data, error: err } = await supabase.rpc("redeem_gift", {
      p_customer_id: customer.id,
      p_gift_id: gift.id,
    });

    setRedeemingId(null);
    setConfirmId(null);

    if (err) {
      setError(err.message || "Đổi quà thất bại");
      return;
    }

    setCustomer(data as Customer);
    setRedeemOk(`Đã đổi "${gift.name}" (−${gift.tick_cost} tick)`);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(60);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div className="animate-slide-up relative flex max-h-[92dvh] w-full flex-col
                      rounded-t-[1.75rem] bg-white sm:max-w-md">
        {/* ── Đầu sheet ── */}
        <div className="relative shrink-0 rounded-t-[1.75rem] bg-gradient-to-br
                        from-brand-500 to-brand-700 px-5 pb-4 pt-4 text-white">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full bg-white/20 px-2.5 py-1
                       text-xs font-semibold active:bg-white/30"
          >
            Đóng
          </button>

          <p className="text-sm tabular-nums opacity-80">
            {formatPhone(customer.phone)}
          </p>
          <p className="truncate pr-16 text-lg font-bold">
            {customer.full_name || "Khách mới"}
          </p>

          <div className={`flex items-end gap-2 transition-all ${keyboardOpen ? "mt-1" : "mt-3"}`}>
            <span
              className={`font-black leading-none tabular-nums transition-all ${
                keyboardOpen ? "text-3xl" : "text-5xl"
              }`}
            >
              {customer.ticks}
            </span>
            <span className="mb-1 text-sm opacity-80">tick hiện có</span>
          </div>

          {!keyboardOpen && near && (
            <p className="mt-2 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs">
              🎯 Còn {near.diff} tick → {near.gift.name}
            </p>
          )}
        </div>

        {/* ── Hỏi tên nếu khách chưa có ── */}
        {needName ? (
          <form onSubmit={saveName} className="space-y-3 p-5">
            <p className="rounded-2xl bg-sun-50 px-3.5 py-2.5 text-sm text-sun-900">
              Khách chưa có tên trong hệ thống. Hỏi tên khách để nhập.
            </p>

            <div>
              <label className="label" htmlFor="cname">
                Tên khách hàng
              </label>
              <input
                ref={nameRef}
                id="cname"
                className="input text-lg"
                placeholder="Nguyễn Văn A"
                autoComplete="off"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={savingName}>
              {savingName ? "Đang lưu…" : "Lưu tên và tiếp tục"}
            </button>

            <button
              type="button"
              onClick={() => setNeedName(false)}
              className="btn-ghost w-full text-sm"
            >
              Bỏ qua, tích tick luôn
            </button>
          </form>
        ) : (
          <>
            {/* ── Tab ── */}
            <div className="flex shrink-0 gap-1 border-b border-brand-100 px-3 pt-2">
              <button
                onClick={() => setTab("earn")}
                className={`flex-1 border-b-2 pb-2.5 pt-1 text-sm font-bold transition ${
                  tab === "earn"
                    ? "border-brand-600 text-brand-700"
                    : "border-transparent text-slate-400"
                }`}
              >
                Tích tick
              </button>
              <button
                onClick={() => setTab("redeem")}
                className={`relative flex-1 border-b-2 pb-2.5 pt-1 text-sm font-bold transition ${
                  tab === "redeem"
                    ? "border-carrot-500 text-carrot-600"
                    : "border-transparent text-slate-400"
                }`}
              >
                Đổi quà
                {redeemable.length > 0 && (
                  <span className="ml-1.5 inline-flex h-5 min-w-[1.25rem] items-center
                                   justify-center rounded-full bg-carrot-500 px-1
                                   text-[11px] font-bold text-white">
                    {redeemable.length}
                  </span>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-5 pb-7">
              {/* ── Tích tick ── */}
              {tab === "earn" && (
                <form onSubmit={handleEarn} className="space-y-4">
                  <div>
                    <label className="label" htmlFor="invoice">
                      Số hoá đơn{" "}
                      <span className="font-normal text-slate-400">(tuỳ chọn)</span>
                    </label>
                    <input
                      ref={invoiceRef}
                      id="invoice"
                      className="input text-lg font-semibold tracking-wide"
                      placeholder="HD-00123"
                      autoComplete="off"
                      disabled={saving}
                      value={invoice}
                      onChange={(e) => {
                        setInvoice(e.target.value.toUpperCase());
                        setError(null);
                      }}
                    />
                  </div>

                  <div>
                    <label className="label" htmlFor="amount">
                      Số tiền hoá đơn
                    </label>
                    <AmountInput
                      id="amount"
                      value={amount}
                      onChange={(v) => {
                        setAmount(v);
                        setError(null);
                      }}
                      disabled={saving}
                    />
                    <div className="mt-2">
                      <QuickAmounts onPick={setAmount} disabled={saving} />
                    </div>
                  </div>

                  {/* Xem trước */}
                  <div
                    className={`rounded-[1.5rem] border-2 py-3 text-center transition ${
                      ticks > 0
                        ? "border-brand-200 bg-brand-50"
                        : "border-slate-100 bg-slate-50"
                    }`}
                  >
                    {ticks > 0 ? (
                      <>
                        <div className="text-3xl font-black tabular-nums text-brand-700">
                          +{ticks} tick
                        </div>
                        <div className="mt-0.5 text-xs tabular-nums text-slate-500">
                          {formatVND(amount)} → tổng {customer.ticks + ticks} tick
                        </div>
                      </>
                    ) : (
                      <p className="py-1 text-sm text-slate-400">
                        Mỗi {formatThousands(TICK_RATE)}đ = 1 tick
                      </p>
                    )}
                  </div>

                  {error && (
                    <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="btn-primary w-full py-3.5 text-base"
                    disabled={saving || ticks < 1}
                  >
                    {saving ? "Đang lưu…" : `Tích ${ticks > 0 ? ticks : ""} tick`}
                  </button>
                </form>
              )}

              {/* ── Đổi quà ── */}
              {tab === "redeem" && (
                <div className="space-y-3">
                  {error && (
                    <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
                      {error}
                    </p>
                  )}
                  {redeemOk && (
                    <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
                      {redeemOk}
                    </p>
                  )}

                  {activeGifts.length === 0 && (
                    <p className="py-4 text-center text-sm text-slate-400">
                      Chưa có quà nào
                    </p>
                  )}

                  {activeGifts.map((g) => {
                    const enough = customer.ticks >= g.tick_cost;
                    const inStock = g.stock > 0;
                    const can = enough && inStock;
                    const confirming = confirmId === g.id;

                    return (
                      <div
                        key={g.id}
                        className={`rounded-[1.5rem] border-2 p-3.5 transition ${
                          can
                            ? "border-carrot-200 bg-carrot-50"
                            : "border-slate-100 bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {g.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={g.image_url}
                              alt=""
                              className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-black/5"
                            />
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center
                                            justify-center rounded-xl bg-white text-xl">
                              {can ? "🎁" : "🔒"}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p
                              className={`truncate text-sm font-bold ${
                                can ? "text-carrot-900" : "text-slate-500"
                              }`}
                            >
                              {g.name}
                            </p>
                            <p className="text-xs tabular-nums text-slate-500">
                              {g.tick_cost} tick
                              {inStock ? ` · còn ${g.stock}` : " · hết hàng"}
                              {!enough && inStock && (
                                <span className="text-amber-600">
                                  {" "}· thiếu {g.tick_cost - customer.ticks}
                                </span>
                              )}
                            </p>
                          </div>

                          {can && !confirming && (
                            <button
                              onClick={() => setConfirmId(g.id)}
                              className="btn-accent shrink-0 px-5"
                            >
                              Đổi
                            </button>
                          )}
                        </div>

                        {confirming && (
                          <div className="mt-3 border-t border-carrot-200 pt-3">
                            <p className="mb-2.5 text-sm text-carrot-900">
                              Xác nhận đổi <b>{g.name}</b>? Trừ {g.tick_cost} tick,
                              còn lại{" "}
                              <b className="tabular-nums">
                                {customer.ticks - g.tick_cost} tick
                              </b>
                              .
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setConfirmId(null)}
                                className="btn-secondary flex-1"
                              >
                                Huỷ
                              </button>
                              <button
                                onClick={() => handleRedeem(g)}
                                disabled={redeemingId === g.id}
                                className="btn-accent flex-1"
                              >
                                {redeemingId === g.id ? "Đang đổi…" : "Xác nhận"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
