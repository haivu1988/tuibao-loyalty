# TUIBAO Loyalty

Hệ thống tích điểm (tick) & đổi quà cho chuỗi cửa hàng TUIBAO.

**Stack:** Next.js 14 (App Router) · Supabase (Postgres + Auth + RLS) · Tailwind CSS · Vercel

## Tính năng

- 👤 **Nhân viên:** tìm/tạo khách theo SĐT, tích tick theo hoá đơn, đổi quà (trừ tick + tồn kho, atomic).
- 🛠️ **Quản lý:** dashboard, tạo nhân viên, quản lý chi nhánh, quản lý quà & tồn kho.
- 📱 **Khách hàng:** quét QR xem số tick và mốc quà sắp đạt — không cần đăng nhập.

## Cấu trúc

```
tuibao-loyalty/
├── supabase/migrations/001_initial.sql   # Schema + RLS + RPC + seed
├── .env.local.example                    # Mẫu biến môi trường
├── SETUP.md                              # Hướng dẫn cài đặt & deploy chi tiết
├── middleware.ts                         # Bảo vệ route + refresh session
└── src/
    ├── app/
    │   ├── login/            # Đăng nhập
    │   ├── staff/            # Màn hình nhân viên
    │   ├── admin/            # Khu quản lý (dashboard, staff, branches, gifts)
    │   ├── check/[phone]/    # Trang QR công khai
    │   └── api/staff/        # API tạo tài khoản nhân viên (service role)
    ├── components/           # UI components
    ├── lib/supabase/         # client / server / middleware
    ├── lib/utils.ts          # helper (format tiền, SĐT, ngày)
    └── types/                # TypeScript types
```

## Bắt đầu nhanh

```bash
npm install
cp .env.local.example .env.local   # rồi điền key Supabase
npm run dev
```

Xem chi tiết từng bước (tạo Supabase, chạy migration, tạo admin, deploy Vercel) trong [SETUP.md](SETUP.md).

## Mô hình điểm

Mỗi hoá đơn nhân viên nhập sẽ cộng **tick** cho khách (mặc định +1, có thể chọn +2/+3/+5 hoặc nhập tay). Khách dùng tick để đổi quà; mỗi quà có `tick_cost` và tồn kho riêng. Trang `/check/[phone]` cho khách thấy tick hiện có và còn thiếu bao nhiêu tick để đạt từng mốc quà.
