'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Receipt, Gift, Calendar, Store, Trash2 } from 'lucide-react'
import { formatVND, formatPhone, formatTime, todayVN } from '@/lib/utils'
import type { Branch } from '@/types'

type Mode = 'earn' | 'redeem'

interface TxRow {
  id: string
  invoice_code: string
  amount: number
  points_earned: number
  created_at: string
  customer: { phone: string; full_name: string | null } | null
  profile: { full_name: string } | null
  branch: { name: string } | null
}

interface RedeemRow {
  id: string
  points_used: number
  created_at: string
  customer: { phone: string; full_name: string | null } | null
  reward: { name: string } | null
  profile: { full_name: string } | null
  branch: { name: string } | null
}

export default function TransactionLog({ branches }: { branches: Branch[] }) {
  const [mode, setMode] = useState<Mode>('earn')
  const [date, setDate] = useState(todayVN())
  const [branchId, setBranchId] = useState('')
  const [loading, setLoading] = useState(true)
  const [txs, setTxs] = useState<TxRow[]>([])
  const [reds, setReds] = useState<RedeemRow[]>([])
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    if (mode === 'earn') {
      let q = supabase
        .from('transactions')
        .select(
          'id, invoice_code, amount, points_earned, created_at, customer:customers(phone, full_name), profile:profiles(full_name), branch:branches(name)'
        )
        .eq('invoice_date', date)
        .order('created_at', { ascending: false })

      if (branchId) q = q.eq('branch_id', branchId)
      const { data } = await q
      setTxs((data ?? []) as unknown as TxRow[])
    } else {
      const start = `${date}T00:00:00+07:00`
      const end = `${date}T23:59:59+07:00`
      let q = supabase
        .from('redemptions')
        .select(
          'id, points_used, created_at, customer:customers(phone, full_name), reward:rewards(name), profile:profiles(full_name), branch:branches(name)'
        )
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false })

      if (branchId) q = q.eq('branch_id', branchId)
      const { data } = await q
      setReds((data ?? []) as unknown as RedeemRow[])
    }

    setLoading(false)
  }, [mode, date, branchId])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string) {
    if (!confirm('Xóa giao dịch này? Điểm đã cộng sẽ KHÔNG tự trừ lại.')) return
    setDeleting(id)
    const supabase = createClient()
    const table = mode === 'earn' ? 'transactions' : 'redemptions'
    const { error } = await supabase.from(table).delete().eq('id', id)
    setDeleting(null)
    if (error) { alert('Lỗi xóa: ' + error.message); return }
    load()
  }

  const totalAmount = txs.reduce((s, t) => s + t.amount, 0)
  const totalPoints = txs.reduce((s, t) => s + t.points_earned, 0)

  return (
    <>
      {/* Bộ lọc */}
      <div className="card !p-3 space-y-2.5">
        {/* Chuyển tab */}
        <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
          {([
            { key: 'earn', label: 'Tích điểm', icon: Receipt },
            { key: 'redeem', label: 'Đổi quà', icon: Gift },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg
                          text-sm font-bold transition-colors ${
                mode === key ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {/* Ngày */}
          <div className="relative flex-1">
            <Calendar
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field !py-2.5 pl-9 text-sm"
            />
          </div>

          {/* Chi nhánh */}
          {branches.length > 1 && (
            <div className="relative flex-1">
              <Store
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="input-field !py-2.5 pl-9 text-sm appearance-none"
              >
                <option value="">Tất cả CN</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tổng kết ngày */}
        {mode === 'earn' && !loading && txs.length > 0 && (
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { label: 'Hóa đơn', value: String(txs.length) },
              { label: 'Doanh thu', value: formatVND(totalAmount) },
              { label: 'Tick đã phát', value: String(totalPoints) },
            ].map((s) => (
              <div key={s.label} className="bg-green-50 rounded-xl py-2 text-center">
                <div className="font-black text-sm text-green-800 tabular-nums">{s.value}</div>
                <div className="text-[11px] text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danh sách */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-10">Đang tải...</p>
        ) : mode === 'earn' ? (
          txs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">
              Không có giao dịch ngày này
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {txs.map((t) => (
                <div key={t.id} className="px-3.5 py-3 flex items-start gap-3">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-green-100
                                  flex items-center justify-center font-bold text-green-700 text-sm">
                    {(t.customer?.full_name ?? t.customer?.phone ?? '?')
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">
                      {t.customer?.full_name ?? 'Chưa có tên'}
                    </div>
                    <div className="text-xs text-gray-500 tabular-nums">
                      {t.customer ? formatPhone(t.customer.phone) : '—'}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      HĐ {t.invoice_code} · {formatTime(t.created_at)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {t.branch?.name}
                      {t.profile?.full_name && ` · ${t.profile.full_name}`}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-green-700 font-bold text-sm tabular-nums">
                      +{t.points_earned}
                    </div>
                    <div className="text-xs text-gray-400 tabular-nums">
                      {formatVND(t.amount)}
                    </div>
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={deleting === t.id}
                      className="mt-1 p-1 text-gray-300 active:text-red-500"
                      aria-label="Xóa"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : reds.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">
            Không có lượt đổi quà ngày này
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {reds.map((r) => (
              <div key={r.id} className="px-3.5 py-3 flex items-start gap-3">
                <div className="shrink-0 w-9 h-9 rounded-full bg-orange-100
                                flex items-center justify-center text-orange-600">
                  <Gift size={16} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">
                    {r.customer?.full_name ?? 'Chưa có tên'}
                  </div>
                  <div className="text-xs text-gray-500 tabular-nums">
                    {r.customer ? formatPhone(r.customer.phone) : '—'}
                  </div>
                  <div className="text-xs text-orange-700 font-medium mt-0.5">
                    {r.reward?.name ?? 'Quà đã xóa'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatTime(r.created_at)} · {r.branch?.name}
                    {r.profile?.full_name && ` · ${r.profile.full_name}`}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-orange-600 font-bold text-sm tabular-nums">
                    −{r.points_used}
                  </div>
                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={deleting === r.id}
                    className="mt-1 p-1 text-gray-300 active:text-red-500"
                    aria-label="Xóa"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
