"use client";

import { formatThousands, parseThousands } from "@/lib/utils";

interface Props {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
}

/** Ô nhập tiền: gõ 50000 → hiện "50.000" */
export default function AmountInput({
  value,
  onChange,
  disabled,
  autoFocus,
  id,
}: Props) {
  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value ? formatThousands(value) : ""}
        onChange={(e) => onChange(parseThousands(e.target.value))}
        disabled={disabled}
        autoFocus={autoFocus}
        placeholder="50.000"
        className="input pr-11 text-right text-2xl font-extrabold tabular-nums tracking-tight"
      />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
        đ
      </span>
    </div>
  );
}

/** Các mức tiền bấm nhanh */
export function QuickAmounts({
  onPick,
  disabled,
}: {
  onPick: (v: number) => void;
  disabled?: boolean;
}) {
  const presets = [20000, 35000, 50000, 70000, 100000];
  return (
    <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
      {presets.map((p) => (
        <button
          key={p}
          type="button"
          disabled={disabled}
          onClick={() => onPick(p)}
          className="shrink-0 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-bold
                     tabular-nums text-brand-700 active:bg-brand-100 disabled:opacity-40"
        >
          {formatThousands(p)}
        </button>
      ))}
    </div>
  );
}
