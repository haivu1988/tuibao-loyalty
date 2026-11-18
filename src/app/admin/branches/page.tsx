import { createClient } from '@/lib/supabase/server'
import BranchManager from '@/components/BranchManager'

export default async function BranchesPage() {
  const supabase = await createClient()
  const { data: branches } = await supabase
    .from('branches')
    .select('*')
    .order('created_at')

  return (
    <div className="pt-2">
      <h1 className="text-xl font-bold mb-4">Chi nhánh</h1>
      <BranchManager initialBranches={branches ?? []} />
    </div>
  )
}
