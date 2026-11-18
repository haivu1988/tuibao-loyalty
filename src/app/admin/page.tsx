import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatVND, formatPhone, formatTime, todayVN } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const today = todayVN()

  const [
    { count: totalCustomers },
    { data: todayTx },
    { data: topCustomers },
    { data: recentTransactions },
  ] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }),

    supabase
      .from('transactions')
      .select('amount, points_earned')
      .eq('invoice_date', today),

    supabase
      .from('customer_stats')
      .select('id, phone, full_name, total_points, total_spent')
      .order('total_spent', { ascending: false })
      .limit(5),

    supabase
      .from('transactions')
      .select('id, invoice_code, amount, points_earned, created_at, customer:customers(phone, full_name), profile:profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const todayRevenue = (todayTx ?? []).reduce((s, t) => s + t.amount, 0)
  const todayPoints = (todayTx ?? []).reduce((s, t) => s + t.points_earned, 0)

  return (
    <div className="space-y-4 pt-2">
      <h1 className="text-xl font-bold">Tổng quan</h1>

      {/* Hôm nay */}
      <div className="card !p-4 bg-green-700 text-white">
        <div className="text-green-200 text-xs font-semibold uppercase tracking-wide">
          Hôm nay
        </div>
        <div className="text-3xl font-black mt-1 tabular-nums">
          {formatVND(todayRevenue)}
        </div>
        <div className="flex gap-4 mt-2 text-sm text-green-100 tabular-nums">
          <span>{todayTx?.length ?? 0} hóa đơn</span>
          <span>·</span>
          <span>{todayPoints} tick đã phát</span>
        </div>
      </div>

      {/* Tổng khách */}
      <Link href="/admin/customers" className="card !p-4 flex items-center justify-between active:bg-gray-50">
        <div>
          <div className="text-2xl font-black text-gray-900 tabular-nums">
            {totalCustomers ?? 0}
          </div>
          <div className="text-sm text-gray-500">Khách hàng đã đăng ký</div>
        </div>
        <ChevronRight size={20} className="text-gray-300" />
      </Link>

      {/* Top khách hàng */}
      <div className="card !p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 text-sm">Khách chi nhiều nhất</h2>
          <Link href="/admin/customers" className="text-xs font-semibold text-green-700">
            Xem tất cả
          </Link>
        </div>
        {(topCustomers ?? []).length === 0 ? (
          <p className="text-sm text-gray-400 py-2">Chưa có dữ liệu</p>
        ) : (
          <div className="space-y-2.5">
            {topCustomers!.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="shrink-0 w-6 text-center font-black text-gray-300 tabular-nums">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">
                    {c.full_name ?? 'Chưa có tên'}
                  </div>
                  <div className="text-xs text-gray-400 tabular-nums">
                    {formatPhone(c.phone)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-sm text-gray-900 tabular-nums">
                    {formatVND(c.total_spent)}
                  </div>
                  <div className="text-xs text-green-700 font-semibold tabular-nums">
                    {c.total_points} tick
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Giao dịch gần đây */}
      <div className="card !p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 text-sm">Giao dịch gần đây</h2>
          <Link href="/admin/transactions" className="text-xs font-semibold text-green-700">
            Xem tất cả
          </Link>
        </div>
        {(recentTransactions ?? []).length === 0 ? (
          <p className="text-sm text-gray-400 py-2">Chưa có giao dịch</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentTransactions!.map((t) => (
              <div key={t.id} className="flex justify-between items-start py-2.5">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {/* @ts-expect-error supabase join */}
                    {t.customer?.full_name ?? 'Chưa có tên'}
                  </div>
                  <div className="text-xs text-gray-400 tabular-nums">
                    {/* @ts-expect-error supabase join */}
                    {t.customer ? formatPhone(t.customer.phone) : '—'}
                  </div>
                  <div className="text-xs text-gray-400">
                    HĐ {t.invoice_code} · {formatTime(t.created_at)}
                    {/* @ts-expect-error supabase join */}
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
    </div>
  )
}
