import { createClient } from '@/lib/supabase/server'
import { findNearMilestone } from '@/lib/utils'

interface Props {
  params: Promise<{ phone: string }>
}

export default async function CheckPage({ params }: Props) {
  const { phone: rawPhone } = await params
  const phone = decodeURIComponent(rawPhone)

  const supabase = await createClient()

  const [{ data: customer }, { data: rewards }] = await Promise.all([
    supabase.from('customers').select('*').eq('phone', phone).single(),
    supabase.from('rewards').select('*').eq('is_active', true).order('points_required'),
  ])

  if (!customer) {
    return (
      <div className="min-h-screen bg-green-700 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-white font-black text-3xl mb-2">TUIBAO</div>
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full">
          <div className="text-4xl mb-3">❓</div>
          <h1 className="font-bold text-gray-900 text-lg mb-2">Chưa có tài khoản</h1>
          <p className="text-gray-500 text-sm">
            Số <strong>{phone}</strong> chưa tham gia chương trình tích điểm.
          </p>
          <p className="text-gray-400 text-xs mt-3">
            Nhờ nhân viên quán đăng ký giúp bạn nhé!
          </p>
        </div>
      </div>
    )
  }

  const nearMilestone = findNearMilestone(customer.total_points, rewards ?? [])
  const redeemable = (rewards ?? []).filter((r) => customer.total_points >= r.points_required)

  return (
    <div className="min-h-screen bg-green-700 flex flex-col items-center pt-10 p-4">
      {/* Header */}
      <div className="text-white font-black text-3xl mb-6">TUIBAO</div>

      <div className="w-full max-w-sm space-y-4">
        {/* Points card */}
        <div className="bg-white rounded-3xl p-6 text-center shadow-xl">
          <div className="text-gray-500 text-sm mb-1">Xin chào,</div>
          <div className="text-gray-900 font-bold text-xl mb-1">
            {customer.full_name ?? phone}
          </div>
          <div className="text-gray-400 text-sm mb-4">{phone}</div>

          <div className="bg-green-50 rounded-2xl py-5 px-4">
            <div className="text-6xl font-black text-green-700 leading-none">
              {customer.total_points}
            </div>
            <div className="text-green-600 font-medium mt-1">tick tích lũy</div>
          </div>
        </div>

        {/* Near milestone */}
        {nearMilestone && (
          <div className="bg-orange-500 text-white rounded-2xl p-4">
            <div className="font-bold text-lg">🎯 Gần đến rồi!</div>
            <div className="text-orange-100 text-sm mt-1">
              Còn <strong>{nearMilestone.diff} tick</strong> nữa là đổi được{' '}
              <strong>{nearMilestone.reward.name}</strong>!
            </div>
          </div>
        )}

        {/* Can redeem */}
        {redeemable.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow">
            <div className="font-bold text-gray-900 mb-3">🎁 Có thể đổi ngay</div>
            <div className="space-y-2">
              {redeemable.map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-green-50 rounded-xl px-3 py-2">
                  <span className="text-sm font-medium text-green-800">{r.name}</span>
                  <span className="text-xs text-green-600 font-bold">{r.points_required} tick</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">
              Nhờ nhân viên quán đổi quà giúp bạn nhé!
            </p>
          </div>
        )}

        {/* Rewards table */}
        <div className="bg-white rounded-2xl p-4 shadow">
          <div className="font-bold text-gray-900 mb-3">🏆 Bảng đổi quà</div>
          <div className="space-y-2">
            {(rewards ?? []).map((r) => {
              const reached = customer.total_points >= r.points_required
              return (
                <div key={r.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{reached ? '✅' : '⬜'}</span>
                    <span className={`text-sm ${reached ? 'font-semibold text-green-800' : 'text-gray-500'}`}>
                      {r.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-700">{r.points_required} tick</span>
                </div>
              )
            })}
          </div>
          <div className="text-xs text-center text-gray-400 mt-3">
            Mỗi 20.000đ = 1 tick
          </div>
        </div>
      </div>

      <div className="text-green-300 text-xs mt-6 mb-8">TUIBAO Trà Sữa & Trà Trái Cây</div>
    </div>
  )
}
