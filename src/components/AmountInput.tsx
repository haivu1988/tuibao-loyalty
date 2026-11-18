'use client'

import { formatThousands, parseThousands } from '@/lib/utils'

interface Props {
  value: number
  onChange: (value: number) => void
  onFocus?: () => void
  onBlur?: () => void
  disabled?: boolean
  placeholder?: string
  autoFocus?: boolean
}

/** Ô nhập tiền: gõ 50000 → hiện "50.000" */
export default function AmountInput({
  value,
  onChange,
  onFocus,
  onBlur,
  disabled,
  placeholder = '50.000',
  autoFocus,
}: Props) {
  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        value={value ? formatThousands(value) : ''}
        onChange={(e) => onChange(parseThousands(e.target.value))}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="input-field pr-12 text-right text-2xl font-bold tabular-nums tracking-tight"
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold pointer-events-none">
        đ
      </span>
    </div>
  )
}

/** Các mức tiền bấm nhanh */
export function QuickAmounts({
  onPick,
  disabled,
}: {
  onPick: (v: number) => void
  disabled?: boolean
}) {
  const presets = [20000, 40000, 60000, 80000, 100000]
  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
      {presets.map((p) => (
        <button
          key={p}
          type="button"
          disabled={disabled}
          onClick={() => onPick(p)}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm
                     font-semibold active:bg-gray-200 disabled:opacity-40 tabular-nums"
        >
          {formatThousands(p)}
        </button>
      ))}
    </div>
  )
}
