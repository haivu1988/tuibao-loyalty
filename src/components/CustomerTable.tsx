'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, ArrowUpDown, X, Gift, Receipt } from 'lucide-react'
import { formatVND, formatPhone, formatDate } from '@/lib/utils'
import type { CustomerStats } from '@/types'

type SortKey = 'total_spent' | 'total_points' | 'transaction_count' | 'last_transaction_at'

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'total_spent', label: 'Tổng tiền' },
  { key: 'total_points', label: 'Điểm hiện có' },
  { key: 'transaction_count', label: 'Số lần mua' },
  { key: 'last_transaction_at', label: 'Mua gần nhất' },
]

interface HistoryRow {
  id: string
  points_used: number
  created_at: string
  reward: { name: string } | null
  profile: { full_name: string } | null
}

interface TxRow {
  id: string
  invoice_code: string
  amount: number
  points_earned: number
  created_at: string
  profile: { full_name: string } | null
  branch: { name: string } | null
}

export default function CustomerTable({ customers }: { customers: CustomerStats[] }) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('total_spent')
  const [detail, setDetail] = useState<CustomerStats | null>(null)
  const [redemptions, setRedemptions] = useState<HistoryRow[] | null>(null)
  const [transactions, setTransactions] = useState<TxRow[] | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? customers.filter(
          (c) =>
            c.phone.includes(q.replace(/\D/g, '')) ||
            (c.full_name ?? '').toLowerCase().includes(q)
        )
      : customers

    return [...list].sort((a, b) => {
      if (sortKey === 'last_transaction_at') {
        return (
          new Date(b.last_transaction_at ?? 0).getTime() -
          new Date(a.last_transaction_at ?? 0).getTime()
        )
      }
      return (b[sortKey] as number) - (a[sortKey] as number)
    })
  }, [customers, query, sortKey])

  async function openDetail(c: CustomerStats) {
    setDetail(c)
    setRedemptions(null)
    setTransactions(null)
    setLoadingDetail(true)

    const supabase = createClient()
    const [{ data: reds }, { data: txs }] = await Promise.all([
      supabase
        .from('redemptions')
        .select('id, points_used, created_at, reward:rewards(name), profile:profiles(full_name)')
        .eq('customer_id', c.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('transactions')
        .select('id, invoice_code, amount, points_earned, created_at, profile:profiles(full_name), branch:branches(name)')
        .eq('customer_id', c.id)
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    setRedemptions((reds ?? []) as unknown as HistoryRow[])
    setTransactions((txs ?? []) as unknown as TxRow[])
    setLoadingDetail(false)
  }

  return (
    <>
      {/* Tìm kiếm + sắp xếp */}
      <div className="card !p-3 space-y-2.5">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc số điện thoại"
            className="input-field pl-11 pr-10"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <ArrowUpDown size={14} className="text-gray-400 shrink-0" />
          {sortOptions.map((o) => (
            <button
              key={o.key}
              onClick={() => setSortKey(o.key)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                sortKey === o.key
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-100 text-gray-600'
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
          <p className="text-sm text-gray-400 text-center py-10">
            Không tìm thấy khách hàng
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => openDetail(c)}
                className="w-full px-3.5 py-3 flex items-center gap-3 text-left active:bg-gray-50"
              >
                <div className="shrink-0 w-10 h-10 rounded-full bg-green-100
                                flex items-center justify-center font-bold text-green-700">
                  {(c.full_name ?? c.phone).charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">
                    {c.full_name ?? 'Chưa có tên'}
                  </div>
                  <div className="text-xs text-gray-500 tabular-nums">
                    {formatPhone(c.phone)} · {c.transaction_count} lần mua
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-bold text-gray-900 text-sm tabular-nums">
                    {formatVND(c.total_spent)}
                  </div>
                  <div className="text-xs tabular-nums">
                    <span className="text-green-700 font-semibold">{c.total_points} tick</span>
                    {c.redemption_count > 0 && (
                      <span className="text-orange-500"> · {c.redemption_count} quà</span>
                    )}
                  </div>
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
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setDetail(null)}
          />

          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl animate-slide-up
                          flex flex-col max-h-[90dvh]">
            {/* Header */}
            <div className="shrink-0 bg-green-700 text-white rounded-t-3xl px-5 py-4 relative">
              <button
                onClick={() => setDetail(null)}
                className="absolute right-3 top-3 p-2 rounded-full text-green-200 active:bg-green-800"
              >
                <X size={20} />
              </button>
              <div className="text-green-200 text-sm tabular-nums">
                {formatPhone(detail.phone)}
              </div>
              <div className="text-lg font-bold truncate pr-10">
                {detail.full_name ?? 'Chưa có tên'}
              </div>
              <div className="text-green-200 text-xs mt-1">
                Thành viên từ {formatDate(detail.created_at).split(',')[0]}
              </div>
            </div>

            {/* Số liệu */}
            <div className="shrink-0 grid grid-cols-3 gap-2 p-4 bg-gray-50 border-b border-gray-200">
              {[
                { label: 'Tổng tiền', value: formatVND(detail.total_spent), color: 'text-gray-900' },
                { label: 'Điểm hiện có', value: `${detail.total_points}`, color: 'text-green-700' },
                { label: 'Đã tích', value: `${detail.total_points_earned}`, color: 'text-blue-600' },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl py-2.5 text-center">
                  <div className={`font-black text-base tabular-nums ${s.color}`}>
                    {s.value}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Lịch sử */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 pb-7">
              {loadingDetail && (
                <p className="text-sm text-gray-400 text-center py-6">Đang tải...</p>
              )}

              {/* Lịch sử đổi quà */}
              {!loadingDetail && (
                <div>
                  <h3 className="flex items-center gap-1.5 font-bold text-sm text-gray-900 mb-2">
                    <Gift size={15} className="text-orange-500" />
                    Lịch sử đổi quà ({redemptions?.length ?? 0})
                  </h3>
                  {(redemptions ?? []).length === 0 ? (
                    <p className="text-sm text-gray-400 py-2">Chưa đổi quà lần nào</p>
                  ) : (
                    <div className="space-y-1.5">
                      {redemptions!.map((r) => (
                        <div
                          key={r.id}
                          className="flex justify-between items-start bg-orange-50
                                     border border-orange-200 rounded-xl px-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-orange-900 truncate">
                              {r.reward?.name ?? 'Quà đã xóa'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(r.created_at)}
                              {r.profile?.full_name && ` · NV: ${r.profile.full_name}`}
                            </div>
                          </div>
                          <div className="text-orange-600 font-bold text-sm shrink-0 ml-2 tabular-nums">
                            −{r.points_used}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Lịch sử tích điểm */}
              {!loadingDetail && (
                <div>
                  <h3 className="flex items-center gap-1.5 font-bold text-sm text-gray-900 mb-2">
                    <Receipt size={15} className="text-green-600" />
                    Lịch sử mua hàng ({transactions?.length ?? 0})
                  </h3>
                  {(transactions ?? []).length === 0 ? (
                    <p className="text-sm text-gray-400 py-2">Chưa có giao dịch</p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {transactions!.map((t) => (
                        <div key={t.id} className="flex justify-between items-start py-2">
                          <div className="min-w-0">
                            <div className="text-sm font-medium">HĐ {t.invoice_code}</div>
                            <div className="text-xs text-gray-500">
                              {formatDate(t.created_at)}
                            </div>
                            <div className="text-xs text-gray-400">
                              {t.branch?.name}
                              {t.profile?.full_name && ` · ${t.profile.full_name}`}
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <div className="text-green-700 font-bold text-sm tabular-nums">
                              +{t.points_earned}
                            </div>
                            <div className="text-xs text-gray-400 tabular-nums">
                              {formatVND(t.amount)}
                            </div>
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
  )
}
