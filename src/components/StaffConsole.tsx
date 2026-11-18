"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  isValidPhone,
  normalizePhone,
  formatPhone,
  formatVND,
  formatTime,
} from "@/lib/utils";
import { useKeyboardOpen } from "@/lib/useKeyboard";
import CustomerSheet from "./CustomerSheet";
import SuccessModal, { type SuccessData } from "./SuccessModal";
import CustomerQR from "./CustomerQR";
import type { Customer, Gift, TodayEntry } from "@/types";

interface Props {
  gifts: Gift[];
  todayList: TodayEntry[];
  zaloAlerts: { customer: Customer; diff: number; giftName: string }[];
}

export default function StaffConsole({ gifts, todayList, zaloAlerts }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const keyboardOpen = useKeyboardOpen();
  const phoneRef = useRef<HTMLInputElement>(null);

  const [phone, setPhone] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [startRedeem, setStartRedeem] = useState(false);
  const [qrFor, setQrFor] = useState<string | null>(null);

  const typing = keyboardOpen && phone.length > 0;

  /** Tìm hoặc tạo khách theo SĐT */
  const handleSearch = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!isValidPhone(phone)) {
        setError("Số điện thoại không hợp lệ (tối thiểu 8 chữ số)");
        return;
      }

      setSearching(true);
      setError(null);

      const { data, error: err } = await supabase.rpc("find_or_create_customer", {
        p_phone: normalizePhone(phone),
        p_full_name: null,
      });

      setSearching(false);

      if (err) {
        setError(err.message || "Không tìm được khách hàng");
        return;
      }

      phoneRef.current?.blur();
      setStartRedeem(false);
      setSelected(data as Customer);
    },
    [phone, supabase]
  );

  function closeSheet() {
    setSelected(null);
    setStartRedeem(false);
    setPhone("");
    router.refresh();
  }

  function handleSuccess(data: SuccessData) {
    setSelected(null);
    setSuccess(data);
    setPhone("");
    router.refresh();
  }

  async function handleUndo(transactionId: string) {
    const { error: err } = await supabase.rpc("void_transaction", {
      p_transaction_id: transactionId,
    });
    if (err) {
      alert("Không huỷ được: " + err.message);
      return;
    }
    setSuccess(null);
    router.refresh();
  }

  /** Từ modal thành công → mở lại sheet ở tab đổi quà */
  async function goRedeem() {
    if (!success) return;
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("phone", success.customerPhone)
      .maybeSingle();
    setSuccess(null);
    if (data) {
      setStartRedeem(true);
      setSelected(data as Customer);
    }
  }

  function openCustomer(c: Customer) {
    setStartRedeem(false);
    setSelected(c);
  }

  return (
    <div className="space-y-3">
      {/* ── Ô nhập SĐT ── */}
      <form onSubmit={handleSearch} className="card !p-4">
        <label className="label" htmlFor="phone">
          Số điện thoại khách
        </label>
        <div className="relative">
          <input
            ref={phoneRef}
            id="phone"
            inputMode="tel"
            autoComplete="off"
            className="input pr-11 text-lg font-semibold tabular-nums tracking-wide"
            placeholder="0912 345 678"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, "").slice(0, 11));
              setError(null);
            }}
          />
          {phone && (
            <button
              type="button"
              onClick={() => {
                setPhone("");
                phoneRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full
                         px-2 py-1 text-slate-400 active:bg-slate-100"
              aria-label="Xoá"
            >
              ✕
            </button>
          )}
        </div>

        {error && (
          <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {isValidPhone(phone) && (
          <button
            type="submit"
            className="btn-primary mt-3 w-full py-3"
            disabled={searching}
          >
            {searching ? "Đang tìm…" : "Tiếp tục"}
          </button>
        )}
      </form>

      {/* ── Phần dưới: thu gọn khi đang gõ ── */}
      <div
        className={`space-y-3 transition-all duration-200 ${
          typing ? "pointer-events-none max-h-0 overflow-hidden opacity-0" : "opacity-100"
        }`}
      >
        {/* Nhắc Zalo */}
        {zaloAlerts.length > 0 && (
          <div className="card !p-4 !border-sun-200 !bg-sun-50/70">
            <h2 className="mb-2.5 text-sm font-bold text-sun-900">
              📱 Nhắc Zalo ({zaloAlerts.length})
            </h2>
            <div className="space-y-1.5">
              {zaloAlerts.map(({ customer, diff, giftName }) => (
                <button
                  key={customer.id}
                  onClick={() => openCustomer(customer)}
                  className="flex w-full items-center justify-between gap-2 rounded-2xl
                             bg-white px-3.5 py-2.5 text-left active:bg-sun-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {customer.full_name || "Khách chưa đặt tên"}
                    </p>
                    <p className="text-xs tabular-nums text-slate-500">
                      {formatPhone(customer.phone)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-sun-800">
                      thiếu {diff} tick
                    </p>
                    <p className="max-w-[120px] truncate text-[11px] text-slate-500">
                      {giftName}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Khách tích hôm nay */}
        <div className="card !p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Khách tích hôm nay</h2>
            <span className="chip bg-brand-100 text-brand-800 tabular-nums">
              {todayList.length}
            </span>
          </div>

          {todayList.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              Chưa có khách nào tích tick hôm nay
            </p>
          ) : (
            <div className="divide-y divide-brand-50">
              {todayList.map(({ customer, lastAmount, lastTicks, lastTime, txCount }) => (
                <div key={customer.id} className="flex items-center gap-3 py-2.5">
                  <button
                    onClick={() => openCustomer(customer)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center
                                    rounded-full bg-brand-100 font-black text-brand-700">
                      {(customer.full_name || customer.phone).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800">
                        {customer.full_name || "Chưa có tên"}
                      </p>
                      <p className="text-xs tabular-nums text-slate-500">
                        {formatPhone(customer.phone)} · {formatTime(lastTime)}
                        {txCount > 1 && ` · ${txCount} lần`}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-black tabular-nums text-brand-700">
                        +{lastTicks}
                      </p>
                      <p className="text-xs tabular-nums text-slate-400">
                        {formatVND(lastAmount)}
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      setQrFor(qrFor === customer.phone ? null : customer.phone)
                    }
                    className="shrink-0 rounded-full px-2 py-1 text-lg active:bg-slate-100"
                    aria-label="Mã QR"
                  >
                    ⠿
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Mã QR khách ── */}
      {qrFor && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-sm animate-fade-in"
            onClick={() => setQrFor(null)}
          />
          <div className="relative w-full max-w-xs rounded-[1.75rem] bg-white p-6 text-center">
            <p className="mb-1 text-sm font-bold text-slate-900">Mã QR của khách</p>
            <p className="mb-4 text-xs tabular-nums text-slate-500">
              {formatPhone(qrFor)}
            </p>
            <div className="flex justify-center">
              <CustomerQR phone={qrFor} />
            </div>
            <button onClick={() => setQrFor(null)} className="btn-secondary mt-5 w-full">
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* ── Sheet khách hàng ── */}
      {selected && (
        <CustomerSheet
          customer={selected}
          gifts={gifts}
          startOnRedeem={startRedeem}
          onClose={closeSheet}
          onSuccess={handleSuccess}
        />
      )}

      {/* ── Modal thành công ── */}
      {success && (
        <SuccessModal
          data={success}
          onClose={() => {
            setSuccess(null);
            router.refresh();
          }}
          onRedeem={goRedeem}
          onUndo={handleUndo}
        />
      )}
    </div>
  );
}
