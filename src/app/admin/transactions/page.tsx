import { createClient } from '@/lib/supabase/server'
import TransactionLog from '@/components/TransactionLog'
import type { Branch } from '@/types'

export const dynamic = 'force-dynamic'

export default async function AdminTransactionsPage() {
  const supabase = await createClient()

  const { data: branches } = await supabase
    .from('branches')
    .select('*')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="space-y-4 pt-2">
      <div>
        <h1 className="text-xl font-bold">Lịch sử giao dịch</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Toàn bộ lần tích điểm và đổi quà
        </p>
      </div>

      <TransactionLog branches={(branches ?? []) as Branch[]} />
    </div>
  )
}
