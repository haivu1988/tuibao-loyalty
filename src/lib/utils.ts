// Quy đổi tick: 20.000đ = 1 tick (phải khớp v_rate trong migration 004)
export const TICK_RATE = 20000;

export function ticksFromAmount(amount: number): number {
  return Math.floor(Math.max(amount || 0, 0) / TICK_RATE);
}

// Định dạng tiền VND
export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

// Chuẩn hoá số điện thoại: chỉ giữ chữ số
export function normalizePhone(phone: string): string {
  return (phone || "").replace(/\D/g, "");
}

// Kiểm tra SĐT hợp lệ (tối thiểu 8 chữ số)
export function isValidPhone(phone: string): boolean {
  return normalizePhone(phone).length >= 8;
}

// Đăng nhập bằng ID: Supabase Auth cần email, nên ta map ID -> email nội bộ.
// Nếu người dùng vẫn nhập dạng email (có @) thì giữ nguyên để tương thích.
export const LOGIN_DOMAIN = "tuibao.local";

export function loginIdToEmail(input: string): string {
  const v = (input || "").trim().toLowerCase();
  if (!v) return v;
  if (v.includes("@")) return v;
  return `${v.replace(/\s+/g, "")}@${LOGIN_DOMAIN}`;
}

// Định dạng ngày giờ VN
export function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ── Bổ sung cho giao diện mới ────────────────────────────────

/** 50000 → "50.000" (dùng cho ô nhập tiền) */
export function formatThousands(value: string | number): string {
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** "50.000" → 50000 */
export function parseThousands(value: string): number {
  const digits = (value || "").replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

/** Chỉ giờ phút: "14:32" */
export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** Chỉ ngày: "18/11/2026" */
export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Hôm nay theo giờ VN, dạng YYYY-MM-DD */
export function todayVN(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

/** Hiển thị SĐT: 0912345678 → "091 234 5678" */
export function formatPhone(phone: string): string {
  const clean = normalizePhone(phone);
  if (clean.length === 10) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }
  return phone;
}

/** Mốc quà gần nhất khách chưa đạt, nếu còn thiếu <= maxDiff tick */
export function findNearGift<T extends { tick_cost: number; active?: boolean }>(
  ticks: number,
  gifts: T[],
  maxDiff = 2
): { gift: T; diff: number } | null {
  const sorted = [...gifts]
    .filter((g) => g.active !== false)
    .sort((a, b) => a.tick_cost - b.tick_cost);

  for (const gift of sorted) {
    if (ticks < gift.tick_cost) {
      const diff = gift.tick_cost - ticks;
      return diff <= maxDiff ? { gift, diff } : null;
    }
  }
  return null;
}
