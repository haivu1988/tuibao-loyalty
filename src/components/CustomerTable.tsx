"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatVND, formatPhone, formatDate, formatDateTime, normalizePhone } from "@/lib/utils";
import type { CustomerStats } from "@/types";

type SortKey = "total_spent" | "ticks" | "transaction_count" | "last_transaction_at";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "total_spent", label: "Tổng tiền" },
  { key: "ticks", label: "Tick hiện có" },
  { key: "transaction_count", label: "Số lần mua" },
  { key: "last_transaction_at", label: "Mua gần nhất" },
];

interface RedemptionRow {
  id: string;
  gift_name: string | null;
  ticks_spent: number;
  created_at: string;
  staff: { full_name: string } | null;
}

interface TxRow {
  id: string;
  invoice_number: string | null;
  amount: number;
  ticks_earned: number;
  created_at: string;
  staff: { full_name: string } | null;
  branch: { name: string } | null;
}

export default function CustomerTable({ customers }: { customers: CustomerStats[] }) {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("total_spent");
  const [detail, setDetail] = useState<CustomerStats | null>(null);
  const [reds, setReds] = useState<RedemptionRow[] | null>(null);
  const [txs, setTxs] = useState<TxRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = normalizePhone(query);
    const list = q
      ? customers.filter(
          (c) =>
            (digits && c.phone.includes(digits)) ||
            (c.full_name ?? "").toLowerCase().includes(q)
        )
      : customers;

    return [...list].sort((a, b) => {
      if (sortKey === "last_transaction_at") {
        return (
          new Date(b.last_transaction_at ?? 0).getTime() -
          new Date(a.last_transaction_at ?? 0).getTime()
        );
      }
      return (b[sortKey] as number) - (a[sortKey] as number);
    });
  }, [customers, query, sortKey]);

  async function openDetail(c: CustomerStats) {
    setDetail(c);
    setReds(null);
    setTxs(null);
    setLoading(true);

    const [{ data: r }, { data: t }] = await Promise.all([
      supabase
        .from("redemptions")
        .select("id, gift_name, ticks_spent, created_at, staff:profiles(full_name)")
        .eq("customer_id", c.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("transactions")
        .select(
          "id, invoice_number, amount, ticks_earned, created_at, staff:profiles(full_name), branch:branches(name)"
        )
        .eq("customer_id", c.id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    setReds((r ?? []) as unknown as RedemptionRow[]);
    setTxs((t ?? []) as unknown as TxRow[]);
    setLoading(false);
  }

  return (
    <>
      {/* Tìm kiếm + sắp xếp */}
      <div className="card !p-4 space-y-3">
        <div className="relative">
          <input
            className="input pr-10"
            placeholder="Tìm theo tên hoặc số điện thoại"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-2 text-slate-400"
            >
              ✕
            </button>
          )}
        </div>

        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
          {sortOptions.map((o) => (
            <button
              key={o.key}
              onClick={() => setSortKey(o.key)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                sortKey === o.key
                  ? "bg-brand-600 text-white"
                  : "bg-brand-50 text-brand-700"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách */}
      <div className="card !p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            Không tìm thấy khách hàng
          </p>
        ) : (
          <div className="divide-y divide-brand-50">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => openDetail(c)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-brand-50/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center
                                rounded-full bg-brand-100 font-black text-brand-700">
                  {(c.full_name || c.phone).charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">
                    {c.full_name || "Chưa có tên"}
                  </p>
                  <p className="text-xs tabular-nums text-slate-500">
                    {formatPhone(c.phone)} · {c.transaction_count} lần mua
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-black tabular-nums text-slate-900">
                    {formatVND(c.total_spent)}
                  </p>
                  <p className="text-xs tabular-nums">
                    <span className="font-bold text-brand-700">{c.ticks} tick</span>
                    {c.redemption_count > 0 && (
                      <span className="text-carrot-600"> · {c.redemption_count} quà</span>
                    )}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chi tiết khách */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-sm animate-fade-in"
            onClick={() => setDetail(null)}
          />

          <div className="animate-slide-up relative flex max-h-[90dvh] w-full flex-col
                          rounded-t-[1.75rem] bg-white sm:max-w-md">
            {/* Header */}
            <div className="relative shrink-0 rounded-t-[1.75rem] bg-gradient-to-br
                            from-brand-500 to-brand-700 px-5 py-4 text-white">
              <button
                onClick={() => setDetail(null)}
                className="absolute right-3 top-3 rounded-full bg-white/20 px-2.5 py-1
                           text-xs font-semibold active:bg-white/30"
              >
                Đóng
              </button>
              <p className="text-sm tabular-nums opacity-80">
                {formatPhone(detail.phone)}
              </p>
              <p className="truncate pr-16 text-lg font-bold">
                {detail.full_name || "Chưa có tên"}
              </p>
              <p className="mt-1 text-xs opacity-70">
                Khách từ {formatDate(detail.created_at)}
              </p>
            </div>

            {/* Số liệu */}
            <div className="grid shrink-0 grid-cols-3 gap-2 border-b border-brand-100 bg-brand-50/60 p-4">
              {[
                { label: "Tổng tiền", value: formatVND(detail.total_spent) },
                { label: "Tick hiện có", value: String(detail.ticks) },
                { label: "Tick đã tích", value: String(detail.ticks_earned) },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-white py-2.5 text-center">
                  <p className="text-base font-black tabular-nums text-slate-900">
                    {s.value}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 pb-7">
              {loading && (
                <p className="py-6 text-center text-sm text-slate-400">Đang tải…</p>
              )}

              {/* Lịch sử đổi quà */}
              {!loading && (
                <div>
                  <h3 className="mb-2 text-sm font-bold text-slate-900">
                    🎁 Lịch sử đổi quà ({reds?.length ?? 0})
                  </h3>
                  {(reds ?? []).length === 0 ? (
                    <p className="py-2 text-sm text-slate-400">Chưa đổi quà lần nào</p>
                  ) : (
                    <div className="space-y-1.5">
                      {reds!.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-start justify-between rounded-2xl
                                     border-2 border-carrot-100 bg-carrot-50 px-3.5 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-carrot-900">
                              {r.gift_name || "Quà đã xoá"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatDateTime(r.created_at)}
                              {r.staff?.full_name && ` · ${r.staff.full_name}`}
                            </p>
                          </div>
                          <p className="ml-2 shrink-0 text-sm font-black tabular-nums text-carrot-600">
                            −{r.ticks_spent}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Lịch sử mua hàng */}
              {!loading && (
                <div>
                  <h3 className="mb-2 text-sm font-bold text-slate-900">
                    🧾 Lịch sử mua hàng ({txs?.length ?? 0})
                  </h3>
                  {(txs ?? []).length === 0 ? (
                    <p className="py-2 text-sm text-slate-400">Chưa có giao dịch</p>
                  ) : (
                    <div className="divide-y divide-brand-50">
                      {txs!.map((t) => (
                        <div key={t.id} className="flex items-start justify-between py-2.5">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800">
                              {t.invoice_number ? `HĐ ${t.invoice_number}` : "Không có mã HĐ"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatDateTime(t.created_at)}
                            </p>
                            <p className="text-xs text-slate-400">
                              {t.branch?.name}
                              {t.staff?.full_name && ` · ${t.staff.full_name}`}
                            </p>
                          </div>
                          <div className="ml-2 shrink-0 text-right">
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
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
