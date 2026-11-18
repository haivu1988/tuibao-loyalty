'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Gift, Receipt, Check, AlertCircle } from 'lucide-react'
import { calcPoints, formatPhone, formatVND, findNearMilestone } from '@/lib/utils'
import { useKeyboardOpen } from '@/lib/useKeyboard'
import AmountInput, { QuickAmounts } from './AmountInput'
import type { SuccessData } from './SuccessModal'
import type { Customer, Reward } from '@/types'

interface Props {
  customer: Customer
  isNew: boolean
  rewards: Reward[]
  staffId: string
  branchId: string
  startOnRedeem?: boolean
  onClose: () => void
  onSuccess: (data: SuccessData) => void
}

type Tab = 'earn' | 'redeem'

export default function CustomerSheet({
  customer: initialCustomer,
  isNew,
  rewards,
  staffId,
  branchId,
  startOnRedeem,
  onClose,
  onSuccess,
}: Props) {
  const keyboardOpen = useKeyboardOpen()
  const nameRef = useRef<HTMLInputElement>(null)
  const invoiceRef = useRef<HTMLInputElement>(null)

  const [customer, setCustomer] = useState(initialCustomer)
  const [needName, setNeedName] = useState(isNew || !initialCustomer.full_name)
  const [name, setName] = useState('')
  const [savingName, setSavingName] = useState(false)

  const [tab, setTab] = useState<Tab>(startOnRedeem ? 'redeem' : 'earn')
  const [invoiceCode, setInvoiceCode] = useState('')
  const [amount, setAmount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [redeemingId, setRedeemingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const points = calcPoints(amount)
  const nearMilestone = findNearMilestone(customer.total_points, rewards)
  const redeemable = rewards.filter(
    (r) => r.is_active && r.stock_quantity > 0 && customer.total_points >= r.points_required
  )

  // Tự focus đúng ô cần nhập
  useEffect(() => {
    const t = setTimeout(() => {
      if (needName) nameRef.current?.focus()
      else if (tab === 'earn') invoiceRef.current?.focus()
    }, 350)
    return () => clearTimeout(t)
  }, [needName, tab])

  /** Lưu tên khách mới */
  async function saveName(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Hãy nhập tên khách')
      return
    }
    setSavingName(true)
    setError('')
    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('customers')
      .update({ full_name: name.trim() })
      .eq('id', customer.id)
      .select()
      .single()

    setSavingName(false)
    if (err || !data) {
      setError('Lỗi lưu tên: ' + (err?.message ?? ''))
      return
    }
    setCustomer(data)
    setNeedName(false)
  }

  /** Tích điểm */
  async function handleEarn(e: React.FormEvent) {
    e.preventDefault()
    if (!branchId) {
      setError('Tài khoản chưa được gán chi nhánh. Liên hệ quản lý.')
      return
    }
    if (!invoiceCode.trim()) {
      setError('Chưa nhập mã hóa đơn')
      return
    }
    if (points < 1) {
      setError('Số tiền chưa đủ 20.000đ để tích 1 tick')
      return
    }

    setSaving(true)
    setError('')
    const supabase = createClient()
    const { data, error: rpcError } = await supabase.rpc('add_transaction', {
      p_invoice_code: invoiceCode.trim().toUpperCase(),
      p_customer_id: customer.id,
      p_amount: amount,
      p_staff_id: staffId,
      p_branch_id: branchId,
    })

    setSaving(false)

    if (rpcError) {
      if (
        rpcError.message.includes('uq_invoice_branch_date') ||
        rpcError.message.includes('duplicate') ||
        rpcError.message.includes('unique')
      ) {
        setError('Hóa đơn này đã được tích điểm hôm nay rồi!')
      } else {
        setError('Lỗi: ' + rpcError.message)
      }
      return
    }

    const newTotal = customer.total_points + points
    const unlocked = rewards.filter(
      (r) =>
        r.is_active &&
        r.stock_quantity > 0 &&
        newTotal >= r.points_required &&
        customer.total_points < r.points_required
    )
    const next = rewards
      .filter((r) => r.is_active && r.points_required > newTotal)
      .sort((a, b) => a.points_required - b.points_required)[0]

    onSuccess({
      transactionId: (data as { id: string })?.id ?? '',
      customerName: customer.full_name ?? 'Khách',
      customerPhone: customer.phone,
      invoiceCode: invoiceCode.trim().toUpperCase(),
      amount,
      pointsEarned: points,
      newTotal,
      unlockedRewards: unlocked,
      nextMilestone: next
        ? { name: next.name, diff: next.points_required - newTotal }
        : null,
    })
  }

  /** Đổi quà */
  async function handleRedeem(reward: Reward) {
    setRedeemingId(reward.id)
    setError('')
    const supabase = createClient()
    const { error: rpcError } = await supabase.rpc('redeem_reward', {
      p_customer_id: customer.id,
      p_reward_id: reward.id,
      p_staff_id: staffId,
      p_branch_id: branchId,
    })

    setRedeemingId(null)
    setConfirmId(null)

    if (rpcError) {
      setError('Lỗi đổi quà: ' + rpcError.message)
      return
    }

    setCustomer({
      ...customer,
      total_points: customer.total_points - reward.points_required,
    })
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(60)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl animate-slide-up
                      flex flex-col max-h-[92dvh]">
        {/* ── Đầu sheet: thông tin khách ── */}
        <div className="shrink-0 bg-green-700 text-white rounded-t-3xl px-5 pt-4 pb-4 relative">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 p-2 rounded-full text-green-200 active:bg-green-800"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>

          <div className="text-green-200 text-sm tabular-nums">
            {formatPhone(customer.phone)}
          </div>
          <div className="text-lg font-bold truncate pr-10">
            {customer.full_name ?? 'Khách mới'}
          </div>

          {/* Điểm — thu gọn khi bàn phím mở */}
          <div
            className={`flex items-baseline gap-2 transition-all duration-200 ${
              keyboardOpen ? 'mt-1' : 'mt-2'
            }`}
          >
            <span className={`font-black tabular-nums transition-all ${
              keyboardOpen ? 'text-3xl' : 'text-5xl'
            }`}>
              {customer.total_points}
            </span>
            <span className="text-green-200 text-sm">tick</span>
          </div>

          {!keyboardOpen && nearMilestone && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-green-800/60
                            rounded-full px-3 py-1 text-xs">
              🎯 Còn {nearMilestone.diff} tick → {nearMilestone.reward.name}
            </div>
          )}
        </div>

        {/* ── Bước 1: Hỏi tên nếu chưa có ── */}
        {needName ? (
          <form onSubmit={saveName} className="p-5 space-y-3">
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200
                            rounded-xl p-3 text-sm text-blue-800">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>Khách chưa có tên trong hệ thống. Hỏi tên khách để nhập.</span>
            </div>

            <div>
              <label className="label">Tên khách hàng</label>
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError('') }}
                className="input-field text-lg"
                placeholder="Nguyễn Văn A"
                autoComplete="off"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" className="btn-primary" disabled={savingName}>
              {savingName ? 'Đang lưu...' : 'Lưu tên và tiếp tục'}
            </button>
          </form>
        ) : (
          <>
            {/* ── Tab ── */}
            <div className="shrink-0 flex border-b border-gray-200 px-2 pt-1">
              <button
                onClick={() => setTab('earn')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-bold
                            border-b-2 transition-colors ${
                  tab === 'earn'
                    ? 'border-green-700 text-green-700'
                    : 'border-transparent text-gray-400'
                }`}
              >
                <Receipt size={16} />
                Tích điểm
              </button>
              <button
                onClick={() => setTab('redeem')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-bold
                            border-b-2 transition-colors relative ${
                  tab === 'redeem'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-400'
                }`}
              >
                <Gift size={16} />
                Đổi quà
                {redeemable.length > 0 && (
                  <span className="absolute top-2 right-1/4 w-5 h-5 rounded-full
                                   bg-orange-500 text-white text-[10px] font-bold
                                   flex items-center justify-center">
                    {redeemable.length}
                  </span>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-5 pb-7">
              {/* ── Tab tích điểm ── */}
              {tab === 'earn' && (
                <form onSubmit={handleEarn} className="space-y-4">
                  <div>
                    <label className="label">Mã số hóa đơn</label>
                    <input
                      ref={invoiceRef}
                      type="text"
                      value={invoiceCode}
                      onChange={(e) => {
                        setInvoiceCode(e.target.value.toUpperCase())
                        setError('')
                      }}
                      className="input-field uppercase text-lg font-semibold tracking-wide"
                      placeholder="HD001234"
                      autoComplete="off"
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className="label">Số tiền hóa đơn</label>
                    <AmountInput
                      value={amount}
                      onChange={(v) => { setAmount(v); setError('') }}
                      disabled={saving}
                    />
                    <div className="mt-2">
                      <QuickAmounts onPick={(v) => setAmount(v)} disabled={saving} />
                    </div>
                  </div>

                  {/* Xem trước số tick */}
                  <div
                    className={`rounded-2xl py-3 text-center border transition-colors ${
                      points > 0
                        ? 'bg-green-50 border-green-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {points > 0 ? (
                      <>
                        <div className="text-3xl font-black text-green-700 tabular-nums">
                          +{points} tick
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 tabular-nums">
                          {formatVND(amount)} → tổng {customer.total_points + points} tick
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-400 py-1">
                        Mỗi 20.000đ = 1 tick
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700
                                    rounded-xl px-4 py-3 text-sm flex items-start gap-2">
                      <AlertCircle size={18} className="shrink-0 mt-0.5" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn-primary py-4 text-lg"
                    disabled={saving || points < 1 || !invoiceCode.trim()}
                  >
                    {saving ? 'Đang lưu...' : `Tích ${points > 0 ? points : ''} tick`}
                  </button>
                </form>
              )}

              {/* ── Tab đổi quà ── */}
              {tab === 'redeem' && (
                <div className="space-y-3">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700
                                    rounded-xl px-4 py-3 text-sm">
                      {error}
                    </div>
                  )}

                  {rewards.filter((r) => r.is_active).map((r) => {
                    const canRedeem = customer.total_points >= r.points_required
                    const outOfStock = r.stock_quantity <= 0
                    const isConfirming = confirmId === r.id

                    return (
                      <div
                        key={r.id}
                        className={`rounded-2xl border p-3.5 transition-colors ${
                          canRedeem && !outOfStock
                            ? 'bg-orange-50 border-orange-300'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className={`font-bold text-sm ${
                              canRedeem && !outOfStock ? 'text-orange-900' : 'text-gray-500'
                            }`}>
                              {canRedeem && !outOfStock ? '🎁' : '🔒'} {r.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 tabular-nums">
                              {r.points_required} tick
                              {outOfStock
                                ? ' · Hết hàng'
                                : ` · còn ${r.stock_quantity}`}
                              {!canRedeem && !outOfStock &&
                                ` · thiếu ${r.points_required - customer.total_points}`}
                            </div>
                          </div>

                          {canRedeem && !outOfStock && !isConfirming && (
                            <button
                              onClick={() => setConfirmId(r.id)}
                              className="shrink-0 bg-orange-500 text-white px-4 py-2
                                         rounded-xl font-bold text-sm active:bg-orange-600"
                            >
                              Đổi
                            </button>
                          )}
                        </div>

                        {/* Xác nhận 2 bước */}
                        {isConfirming && (
                          <div className="mt-3 pt-3 border-t border-orange-200">
                            <p className="text-sm text-orange-900 mb-2.5">
                              Xác nhận đổi <strong>{r.name}</strong>?
                              Trừ {r.points_required} tick, còn lại{' '}
                              <strong className="tabular-nums">
                                {customer.total_points - r.points_required} tick
                              </strong>
                              .
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setConfirmId(null)}
                                className="flex-1 bg-white border border-gray-300 text-gray-600
                                           py-2.5 rounded-xl font-semibold text-sm"
                              >
                                Hủy
                              </button>
                              <button
                                onClick={() => handleRedeem(r)}
                                disabled={redeemingId === r.id}
                                className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl
                                           font-bold text-sm active:bg-orange-600
                                           disabled:opacity-50 flex items-center justify-center gap-1.5"
                              >
                                <Check size={16} />
                                {redeemingId === r.id ? 'Đang đổi...' : 'Xác nhận'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {redeemable.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-3">
                      Khách chưa đủ điểm đổi quà nào
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
