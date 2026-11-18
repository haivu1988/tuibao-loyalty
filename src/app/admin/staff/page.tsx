import Link from 'next/link'
import { Store } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import StaffManager from '@/components/StaffManager'

export default async function StaffPage() {
  const supabase = await createClient()

  const [{ data: staff }, { data: branches }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*, branch:branches(name)')
      .order('created_at'),
    supabase
      .from('branches')
      .select('id, name')
      .eq('is_active', true)
      .order('name'),
  ])

  return (
    <div className="pt-2 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Nhân viên</h1>
        <Link
          href="/admin/branches"
          className="flex items-center gap-1 text-sm font-semibold text-green-700"
        >
          <Store size={15} />
          Chi nhánh
        </Link>
      </div>
      <StaffManager initialStaff={staff ?? []} branches={branches ?? []} />
    </div>
  )
}
