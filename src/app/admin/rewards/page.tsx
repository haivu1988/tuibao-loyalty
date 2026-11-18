import { createClient } from '@/lib/supabase/server'
import RewardManager from '@/components/RewardManager'

export default async function RewardsPage() {
  const supabase = await createClient()
  const { data: rewards } = await supabase
    .from('rewards')
    .select('*')
    .order('sort_order')

  return (
    <div className="pt-2">
      <h1 className="text-xl font-bold mb-4">Quà tặng</h1>
      <RewardManager initialRewards={rewards ?? []} />
    </div>
  )
}
