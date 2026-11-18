'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, X, Phone } from 'lucide-react'
import { formatPhone, formatVND, formatTime } from '@/lib/utils'
import { useKeyboardOpen } from '@/lib/useKeyboard'
import CustomerSheet from './CustomerSheet'
import SuccessModal, { type SuccessData } from './SuccessModal'
import type { Customer, Reward } from '@/types'

export interface TodayEntry {
  customer: Customer
  lastAmount: number
  lastPoints: number
  lastTime: string
  txCount: number
}

interface Props {
  staffId: string
  branchId: string
  rewards: Reward[]
  todayList: TodayEntry[]
  zaloAlerts: { customer: Customer; diff: number; rewardName: string }[]
}

export default function StaffWorkspace({
  staffId,
  branchId,
  rewards,
  todayList,
  zaloAlerts,
}: Props) {
  const router = useRouter()
  const keyboardOpen = useKeyboardOpen()
  const phoneRef = useRef<HTMLInputElement>(null)

  const [phone, setPhone] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [success, setSuccess] = useState<SuccessData | null>(null)
  const [openRedeemOnMount, setOpenRedeemOnMount] = useState(false)

  const phoneFocused = phone.length > 0 && keyboardOpen

  /** Tìm hoặc tạo khách theo SĐT */
  const handleSearch = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      const clean = phone.replace(/\D/g, '')
      if (clean.length < 9) {
        setSearchError('Số điện thoại chưa đủ')
        return
      }

      setSearching(true)
      setSearchError('')
      const supabase = createClient()

      const { data: existing } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', clean)
        .maybeSingle()

      if (existing) {
        setSearching(false)
        setIsNew(false)
        setSelected(existing)
        phoneRef.current?.blur()
        return
      }

      // Chưa có → tạo mới, hỏi tên trong sheet
      const { data: created, error } = await supabase
        .from('customers')
        .insert({ phone: clean, full_name: null })
        .select()
        .single()

      setSearching(false)
      if (error || !created) {
        setSearchError('Lỗi tạo khách: ' + (error?.message ?? ''))
        return
      }
      setIsNew(true)
      setSelected(created)
      phoneRef.current?.blur()
    },
    [phone]
  )

  function closeSheet() {
    setSelected(null)
    setIsNew(false)
    setOpenRedeemOnMount(false)
    setPhone('')
    router.refresh()
  }

  function handleSuccess(data: SuccessData) {
    setSelected(null)
    setSuccess(data)
    setPhone('')
    router.refresh()
  }

  async function handleUndo(transactionId: string) {
    const supabase = createClient()
    const { error } = await supabase.rpc('void_transaction', {
      p_transaction_id: transactionId,
    })
    if (error) {
      alert('Không hủy được: ' + error.message)
      return
    }
    setSuccess(null)
    router.refresh()
  }

  /** Từ modal thành công → mở lại sheet ở tab đổi quà */
  async function goRedeem() {
    if (!success) return
    const supabase = createClient()
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', success.customerPhone)
      .single()
    setSuccess(null)
    if (data) {
      setOpenRedeemOnMount(true)
      setSelected(data)
    }
  }

  return (
    <div className="flex flex-col h-full pb-3">
      {/* ─── Ô nhập SĐT: luôn ở trên cùng ─── */}
      <form onSubmit={handleSearch} className="shrink-0">
        <div className="card !p-3">
          <div className="relative">
            <Phone
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              ref={phoneRef}
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))
                setSearchError('')
              }}
              placeholder="Nhập số điện thoại khách"
              className="input-field pl-11 pr-11 text-lg font-semibold tracking-wide tabular-nums"
              autoComplete="off"
            />
            {phone && (
              <button
                type="button"
                onClick={() => { setPhone(''); phoneRef.current?.focus() }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full
                           text-gray-400 active:bg-gray-100"
                aria-label="Xóa"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {searchError && (
            <p className="text-sm text-red-600 mt-2 px-1">{searchError}</p>
          )}

          {phone.length >= 9 && (
            <button
              type="submit"
              disabled={searching}
              className="btn-primary mt-2.5 flex items-center justify-center gap-2 py-3"
            >
              <Search size={18} />
              {searching ? 'Đang tìm...' : 'Tiếp tục'}
            </button>
          )}
        </div>
      </form>

      {/* ─── Phần dưới: ẩn khi bàn phím mở ─── */}
      <div
        className={`flex-1 min-h-0 overflow-y-auto no-scrollbar transition-all duration-200 ${
          phoneFocused ? 'opacity-0 pointer-events-none max-h-0' : 'opacity-100 mt-3'
        }`}
      >
        {/* Nhắc Zalo */}
        {zaloAlerts.length > 0 && (
          <div className="card !p-3 mb-3 border border-amber-200 bg-amber-50/60">
            <div className="flex items-center gap-1.5 mb-2">
              <span>📱</span>
              <h2 className="font-bold text-amber-800 text-sm">
                Nhắc Zalo ({zaloAlerts.length})
              </h2>
            </div>
            <div className="space-y-1.5">
              {zaloAlerts.slice(0, 5).map(({ customer, diff, rewardName }) => (
                <button
                  key={customer.id}
                  onClick={() => { setIsNew(false); setSelected(customer) }}
                  className="w-full flex items-center justify-between bg-white rounded-xl
                             px-3 py-2 text-left active:bg-amber-50"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {customer.full_name ?? 'Khách'}
                    </div>
                    <div className="text-xs text-gray-500 tabular-nums">
                      {formatPhone(customer.phone)}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="text-amber-700 font-bold text-sm">
                      thiếu {diff} tick
                    </div>
                    <div className="text-[11px] text-gray-500 truncate max-w-[110px]">
                      {rewardName}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Khách tích hôm nay */}
        <div className="card !p-3">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="font-bold text-gray-900 text-sm">
              Khách tích hôm nay
            </h2>
            <span className="text-xs font-semibold text-green-700 bg-green-100
                             px-2 py-0.5 rounded-full tabular-nums">
              {todayList.length}
            </span>
          </div>

          {todayList.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Chưa có khách nào tích điểm hôm nay
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {todayList.map(({ customer, lastAmount, lastPoints, lastTime, txCount }) => (
                <button
                  key={customer.id}
                  onClick={() => { setIsNew(false); setSelected(customer) }}
                  className="w-full flex items-center gap-3 py-2.5 text-left
                             active:bg-gray-50 -mx-1 px-1 rounded-lg"
                >
                  {/* Avatar chữ cái */}
                  <div className="shrink-0 w-10 h-10 rounded-full bg-green-100
                                  flex items-center justify-center font-bold text-green-700">
                    {(customer.full_name ?? customer.phone).charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">
                      {customer.full_name ?? 'Chưa có tên'}
                    </div>
                    <div className="text-xs text-gray-500 tabular-nums">
                      {formatPhone(customer.phone)} · {formatTime(lastTime)}
                      {txCount > 1 && ` · ${txCount} lần`}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-green-700 text-sm tabular-nums">
                      +{lastPoints}
                    </div>
                    <div className="text-xs text-gray-400 tabular-nums">
                      {formatVND(lastAmount)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Sheet khách hàng ─── */}
      {selected && (
        <CustomerSheet
          customer={selected}
          isNew={isNew}
          rewards={rewards}
          staffId={staffId}
          branchId={branchId}
          startOnRedeem={openRedeemOnMount}
          onClose={closeSheet}
          onSuccess={handleSuccess}
        />
      )}

      {/* ─── Modal thành công ─── */}
      {success && (
        <SuccessModal
          data={success}
          onClose={() => { setSuccess(null); router.refresh() }}
          onRedeem={goRedeem}
          onUndo={handleUndo}
        />
      )}
    </div>
  )
}
