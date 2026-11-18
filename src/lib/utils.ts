import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { NearMilestone, Reward } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
}

/** 50000 → "50.000" (dùng cho ô nhập tiền) */
export function formatThousands(value: string | number): string {
  const digits = String(value).replace(/\D/g, '')
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/** "50.000" → 50000 */
export function parseThousands(value: string): number {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

/** Chỉ giờ phút: "14:32" */
export function formatTime(dateStr: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

/** Ngày hôm nay theo giờ VN, dạng YYYY-MM-DD */
export function todayVN(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export function calcPoints(amount: number): number {
  return Math.floor(amount / 20000)
}

/** Tìm milestone gần nhất còn thiếu 1-2 tick */
export function findNearMilestone(
  currentPoints: number,
  rewards: Reward[]
): NearMilestone | null {
  const sorted = [...rewards]
    .filter((r) => r.is_active)
    .sort((a, b) => a.points_required - b.points_required)

  for (const reward of sorted) {
    if (currentPoints < reward.points_required) {
      const diff = reward.points_required - currentPoints
      if (diff <= 2) return { reward, diff }
      break // milestone tiếp theo còn xa hơn, không cần check
    }
  }
  return null
}

export function formatPhone(phone: string): string {
  // 0912345678 → 091 234 5678
  const clean = phone.replace(/\D/g, '')
  if (clean.length === 10) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`
  }
  return phone
}
