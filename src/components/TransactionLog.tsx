"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatVND, formatPhone, formatTime, todayVN } from "@/lib/utils";
import type { Branch } from "@/types";

type Mode = "earn" | "redeem";

interface TxRow {
  id: string;
  invoice_number: string | null;
  amount: number;
  ticks_earned: number;
  created_at: string;
  customer: { phone: string; full_name: string | null } | null;
  staff: { full_name: string } | null;
  branch: { name: string } | null;
}

interface RedeemRow {
  id: string;
  gift_name: string | null;
  ticks_spent: number;
  created_at: string;
  customer: { phone: string; full_name: string | null } | null;
  staff: { full_name: string } | null;
}

export default function TransactionLog({ branches }: { branches: Branch[] }) {
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>("earn");
  const [date, setDate] = useState(todayVN());
  const [branchId, setBranchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [txs, setTxs] = useState<TxRow[]>([]);
  const [reds, setReds] = useState<RedeemRow[]>([]);
  const [warn, setWarn] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setWarn(null);

    if (mode === "earn") {
      let q = supabase
        .from("transactions")
        .select(
          "id, invoice_number, amount, ticks_earned, created_at, customer:customers(phone, full_name), staff:profiles(full_name), branch:branches(name)"
        )
        .eq("invoice_date", date)
        .order("created_at", { ascending: false });

      if (branchId) q = q.eq("branch_id", branchId);
      const { data, error } = await q;

      if (error) {
        setWarn(
          "Chưa chạy migration 005_ux_updates.sql nên chưa lọc được theo ngày."
        );
        setTxs([]);
      } else {
        setTxs((data ?? []) as unknown as TxRow[]);
      }
    } else {
      const start = `${date}T00:00:00+07:00`;
      const end = `${date}T23:59:59+07:00`;
      const { data } = await supabase
        .from("redemptions")
        .select(
          "id, gift_name, ticks_spent, created_at, customer:customers(phone, full_name), staff:profiles(full_name)"
        )
        .gte("created_at", start)
        .lte("created_at", end)
        .order("created_at", { ascending: false });

      setReds((data ?? []) as unknown as RedeemRow[]);
    }

    setLoading(false);
  }, [mode, date, branchId, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const totalAmount = txs.reduce((s, t) => s + t.amount, 0);
  const totalTicks = txs.reduce((s, t) => s + t.ticks_earned, 0);

  return (
    <>
      {/* Bộ lọc */}
      <div className="card !p-4 space-y-3">
        <div className="flex gap-1.5 rounded-full bg-brand-50 p-1">
          {(
            [
              { key: "earn", label: "Tích tick" },
              { key: "redeem", label: "Đổi quà" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`flex-1 rounded-full py-2 text-sm font-bold transition ${
                mode === key ? "bg-white text-brand-700 shadow-sm" : "text-slate-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input flex-1 !py-2 text-sm"
          />
          {mode === "earn" && branches.length > 1 && (
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="input flex-1 !py-2 text-sm"
            >
              <option value="">Tất cả chi nhánh</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {warn && (
          <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
            {warn}
          </p>
        )}

        {/* Tổng kết ngày */}
        {mode === "earn" && !loading && txs.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Hoá đơn", value: String(txs.length) },
              { label: "Doanh thu", value: formatVND(totalAmount) },
              { label: "Tick đã phát", value: String(totalTicks) },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-brand-50 py-2.5 text-center">
                <p className="text-sm font-black tabular-nums text-brand-800">
                  {s.value}
                </p>
                <p className="text-[11px] text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danh sách */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <p className="py-10 text-center text-sm text-slate-400">Đang tải…</p>
        ) : mode === "earn" ? (
          txs.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">
              Không có giao dịch ngày này
            </p>
          ) : (
            <div className="divide-y divide-brand-50">
              {txs.map((t) => (
                <div key={t.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center
                                  rounded-full bg-brand-100 text-sm font-black text-brand-700">
                    {(t.customer?.full_name || t.customer?.phone || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {t.customer?.full_name || "Chưa có tên"}
                    </p>
                    <p className="text-xs tabular-nums text-slate-500">
                      {t.customer ? formatPhone(t.customer.phone) : "—"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {t.invoice_number ? `HĐ ${t.invoice_number}` : "Không mã HĐ"} ·{" "}
                      {formatTime(t.created_at)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {t.branch?.name}
                      {t.staff?.full_name && ` · ${t.staff.full_name}`}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black tabular-nums text-brand-700">
                      +{t.ticks_earned}
                    </p>
                    <p className="text-xs tabular-nums text-slate-400">
                      {formatVND(t.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : reds.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            Không có lượt đổi quà ngày này
          </p>
        ) : (
          <div className="divide-y divide-brand-50">
            {reds.map((r) => (
              <div key={r.id} className="flex items-start gap-3 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center
                                rounded-full bg-carrot-100 text-base">
                  🎁
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">
                    {r.customer?.full_name || "Chưa có tên"}
                  </p>
                  <p className="text-xs tabular-nums text-slate-500">
                    {r.customer ? formatPhone(r.customer.phone) : "—"}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-carrot-700">
                    {r.gift_name || "Quà đã xoá"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatTime(r.created_at)}
                    {r.staff?.full_name && ` · ${r.staff.full_name}`}
                  </p>
                </div>

                <p className="shrink-0 text-sm font-black tabular-nums text-carrot-600">
                  −{r.ticks_spent}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
