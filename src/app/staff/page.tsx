import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { todayVN } from '@/lib/utils'
import StaffWorkspace, { type TodayEntry } from '@/components/StaffWorkspace'
import type { Customer, Reward } from '@/types'

export const dynamic = 'force-dynamic'

export default async function StaffPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, branch_id')
    .eq('id', user.id)
    .single()

  const [{ data: rewards }, { data: todayTx }, { data: allCustomers }] =
    await Promise.all([
      supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_required'),

      // Giao dịch hôm nay (theo giờ VN)
      supabase
        .from('transactions')
        .select('customer_id, amount, points_earned, created_at, customer:customers(*)')
        .eq('invoice_date', todayVN())
        .order('created_at', { ascending: false }),

      // Khách có điểm, để tính nhắc Zalo
      supabase
        .from('customers')
        .select('*')
        .gt('total_points', 0)
        .order('total_points', { ascending: false })
        .limit(200),
    ])

  const rewardList = (rewards ?? []) as Reward[]

  // ── Gom giao dịch hôm nay theo khách ──
  const map = new Map<string, TodayEntry>()
  for (const tx of todayTx ?? []) {
    // @ts-expect-error supabase join
    const c = tx.customer as Customer | null
    if (!c) continue
    const existing = map.get(c.id)
    if (existing) {
      existing.txCount += 1
    } else {
      map.set(c.id, {
        customer: c,
        lastAmount: tx.amount,
        lastPoints: tx.points_earned,
        lastTime: tx.created_at,
        txCount: 1,
      })
    }
  }
  const todayList = Array.from(map.values())

  // ── Khách gần đủ điểm (thiếu 1-2 tick) ──
  const sortedRewards = [...rewardList].sort(
    (a, b) => a.points_required - b.points_required
  )
  const zaloAlerts = (allCustomers ?? [])
    .map((c) => {
      const next = sortedRewards.find((r) => r.points_required > c.total_points)
      if (!next) return null
      const diff = next.points_required - c.total_points
      if (diff > 2) return null
      return { customer: c as Customer, diff, rewardName: next.name }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .slice(0, 10)

  return (
    <StaffWorkspace
      staffId={profile?.id ?? user.id}
      branchId={profile?.branch_id ?? ''}
      rewards={rewardList}
      todayList={todayList}
      zaloAlerts={zaloAlerts}
    />
  )
}
