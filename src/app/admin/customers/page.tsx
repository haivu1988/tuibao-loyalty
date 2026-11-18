import { createClient } from '@/lib/supabase/server'
import CustomerTable from '@/components/CustomerTable'
import type { CustomerStats } from '@/types'

export const dynamic = 'force-dynamic'

export default async function AdminCustomersPage() {
  const supabase = await createClient()

  const { data: customers } = await supabase
    .from('customer_stats')
    .select('*')
    .order('total_spent', { ascending: false })
    .limit(500)

  return (
    <div className="space-y-4 pt-2">
      <div>
        <h1 className="text-xl font-bold">Khách hàng</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {customers?.length ?? 0} khách · chỉ quản lý xem được
        </p>
      </div>

      <CustomerTable customers={(customers ?? []) as CustomerStats[]} />
    </div>
  )
}
