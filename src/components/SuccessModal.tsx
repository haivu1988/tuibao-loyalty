'use client'

import { useEffect, useState } from 'react'
import { Check, Gift, X, Undo2 } from 'lucide-react'
import { formatVND } from '@/lib/utils'
import type { Reward } from '@/types'

export interface SuccessData {
  transactionId: string
  customerName: string
  customerPhone: string
  invoiceCode: string
  amount: number
  pointsEarned: number
  newTotal: number
  /** Quà khách vừa đủ điểm đổi (nếu có) */
  unlockedRewards: Reward[]
  /** Còn thiếu mấy tick nữa tới mốc kế */
  nextMilestone: { name: string; diff: number } | null
}

interface Props {
  data: SuccessData
  onClose: () => void
  onRedeem: () => void
  onUndo: (transactionId: string) => Promise<void>
}

export default function SuccessModal({ data, onClose, onRedeem, onUndo }: Props) {
  const [undoing, setUndoing] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(300) // 5 phút

  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  // Rung nhẹ báo thành công
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 60, 40])
    }
  }, [])

  const hasUnlocked = data.unlockedRewards.length > 0

  async function handleUndo() {
    if (!confirm('Hủy giao dịch này? Điểm vừa cộng sẽ bị trừ lại.')) return
    setUndoing(true)
    await onUndo(data.transactionId)
    setUndoing(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Nền mờ */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Nội dung */}
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl
                      p-6 pb-8 animate-slide-up max-h-[90dvh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full text-gray-400 active:bg-gray-100"
          aria-label="Đóng"
        >
          <X size={20} />
        </button>

        {/* Dấu tick lớn */}
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center
                          animate-pop">
            <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center">
              <Check size={32} className="text-white" strokeWidth={3} />
            </div>
          </div>

          <h2 className="mt-4 text-xl font-black text-gray-900">Tích điểm thành công</h2>

          <div className="mt-1 text-sm text-gray-500">
            {data.customerName} · {data.customerPhone}
          </div>

          {/* Số tick vừa cộng */}
          <div className="mt-5 w-full bg-green-50 border border-green-200 rounded-2xl py-4">
            <div className="text-4xl font-black text-green-700 tabular-nums">
              +{data.pointsEarned} <span className="text-xl font-bold">tick</span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Tổng cộng: <strong className="text-gray-900 tabular-nums">{data.newTotal} tick</strong>
            </div>
          </div>

          {/* Chi tiết hóa đơn */}
          <div className="mt-3 w-full flex justify-between text-sm text-gray-500 px-1">
            <span>HĐ {data.invoiceCode}</span>
            <span className="tabular-nums">{formatVND(data.amount)}</span>
          </div>
        </div>

        {/* Đủ điểm đổi quà */}
        {hasUnlocked && (
          <div className="mt-5 bg-orange-50 border-2 border-orange-300 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-orange-800 font-bold">
              <Gift size={18} />
              Khách đủ điểm đổi quà!
            </div>
            <ul className="mt-2 space-y-1">
              {data.unlockedRewards.map((r) => (
                <li key={r.id} className="text-sm text-orange-700 flex justify-between">
                  <span>• {r.name}</span>
                  <span className="font-semibold tabular-nums">{r.points_required} tick</span>
                </li>
              ))}
            </ul>
            <button onClick={onRedeem} className="btn-orange mt-3 py-2.5">
              🎁 Đổi quà ngay
            </button>
          </div>
        )}

        {/* Gần đủ điểm */}
        {!hasUnlocked && data.nextMilestone && data.nextMilestone.diff <= 2 && (
          <div className="mt-5 bg-amber-50 border border-amber-300 rounded-2xl p-3.5 text-center">
            <div className="text-sm text-amber-800">
              Còn <strong className="text-base">{data.nextMilestone.diff} tick</strong> nữa là đổi được
            </div>
            <div className="font-bold text-amber-900 mt-0.5">{data.nextMilestone.name}</div>
            <div className="text-xs text-amber-600 mt-1.5">
              Nhắc khách qua Zalo nhé
            </div>
          </div>
        )}

        {/* Nút chính */}
        <button onClick={onClose} className="btn-primary mt-5">
          Xong
        </button>

        {/* Hủy giao dịch */}
        {secondsLeft > 0 && (
          <button
            onClick={handleUndo}
            disabled={undoing}
            className="mt-3 w-full flex items-center justify-center gap-1.5 text-sm
                       text-gray-400 active:text-red-500 disabled:opacity-50 py-1"
          >
            <Undo2 size={14} />
            {undoing
              ? 'Đang hủy...'
              : `Nhập sai? Hủy giao dịch (${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')})`}
          </button>
        )}
      </div>
    </div>
  )
}
