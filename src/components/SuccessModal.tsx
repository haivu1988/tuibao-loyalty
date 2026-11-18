"use client";

import { useEffect, useState } from "react";
import { formatVND } from "@/lib/utils";
import type { Gift } from "@/types";

export interface SuccessData {
  transactionId: string | null;
  customerName: string;
  customerPhone: string;
  invoiceNumber: string | null;
  amount: number;
  ticksEarned: number;
  newTicks: number;
  /** Quà khách vừa đủ điểm đổi */
  unlockedGifts: Gift[];
  /** Mốc kế tiếp còn thiếu mấy tick */
  nextGift: { name: string; diff: number } | null;
}

interface Props {
  data: SuccessData;
  onClose: () => void;
  onRedeem: () => void;
  onUndo: (transactionId: string) => Promise<void>;
}

export default function SuccessModal({ data, onClose, onRedeem, onUndo }: Props) {
  const [undoing, setUndoing] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300);

  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
    }
  }, []);

  const hasUnlocked = data.unlockedGifts.length > 0;

  async function handleUndo() {
    if (!data.transactionId) return;
    if (!confirm("Huỷ giao dịch này? Tick vừa cộng sẽ bị trừ lại.")) return;
    setUndoing(true);
    await onUndo(data.transactionId);
    setUndoing(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div
        className="animate-slide-up relative max-h-[92dvh] w-full overflow-y-auto
                   rounded-t-[1.75rem] bg-white p-6 pb-8 sm:max-w-sm sm:rounded-[1.75rem]"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 active:bg-slate-100"
          aria-label="Đóng"
        >
          ✕
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="animate-pop flex h-20 w-20 items-center justify-center rounded-full bg-brand-100">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-3xl text-white">
              ✓
            </div>
          </div>

          <h2 className="mt-4 text-xl font-black text-slate-900">
            Tích tick thành công
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {data.customerName} · {data.customerPhone}
          </p>

          <div className="mt-5 w-full rounded-[1.5rem] border-2 border-brand-100 bg-brand-50 py-4">
            <div className="text-4xl font-black tabular-nums text-brand-700">
              +{data.ticksEarned}{" "}
              <span className="text-xl font-bold">tick</span>
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Tổng cộng:{" "}
              <b className="tabular-nums text-slate-900">{data.newTicks} tick</b>
            </div>
          </div>

          <div className="mt-3 flex w-full justify-between px-1 text-sm text-slate-500">
            <span>{data.invoiceNumber ? `HĐ ${data.invoiceNumber}` : "Không có mã HĐ"}</span>
            <span className="tabular-nums">{formatVND(data.amount)}</span>
          </div>
        </div>

        {/* Đủ điểm đổi quà */}
        {hasUnlocked && (
          <div className="mt-5 rounded-[1.5rem] border-2 border-carrot-300 bg-carrot-50 p-4">
            <p className="font-bold text-carrot-800">🎁 Khách đủ tick đổi quà!</p>
            <ul className="mt-2 space-y-1">
              {data.unlockedGifts.map((g) => (
                <li
                  key={g.id}
                  className="flex justify-between text-sm text-carrot-700"
                >
                  <span>• {g.name}</span>
                  <span className="font-bold tabular-nums">{g.tick_cost} tick</span>
                </li>
              ))}
            </ul>
            <button onClick={onRedeem} className="btn-accent mt-3 w-full">
              Đổi quà ngay
            </button>
          </div>
        )}

        {/* Gần đủ điểm */}
        {!hasUnlocked && data.nextGift && data.nextGift.diff <= 2 && (
          <div className="mt-5 rounded-[1.5rem] border-2 border-sun-200 bg-sun-50 p-3.5 text-center">
            <p className="text-sm text-sun-800">
              Còn <b className="text-base">{data.nextGift.diff} tick</b> nữa là đổi được
            </p>
            <p className="mt-0.5 font-bold text-sun-900">{data.nextGift.name}</p>
            <p className="mt-1.5 text-xs text-sun-700">Nhắn Zalo nhắc khách nhé</p>
          </div>
        )}

        <button onClick={onClose} className="btn-primary mt-5 w-full">
          Xong
        </button>

        {/* Huỷ giao dịch */}
        {data.transactionId && secondsLeft > 0 && (
          <button
            onClick={handleUndo}
            disabled={undoing}
            className="mt-3 w-full py-1 text-sm text-slate-400 active:text-red-500 disabled:opacity-50"
          >
            {undoing
              ? "Đang huỷ…"
              : `Nhập sai? Huỷ giao dịch (${Math.floor(secondsLeft / 60)}:${String(
                  secondsLeft % 60
                ).padStart(2, "0")})`}
          </button>
        )}
      </div>
    </div>
  );
}
