# Hướng dẫn cài đặt & deploy — TUIBAO Loyalty

Stack: **Next.js 14 (App Router) · Supabase · Tailwind CSS · Vercel**

---

## 0. Yêu cầu

- Node.js 18.17+ (khuyến nghị 20)
- Tài khoản [Supabase](https://supabase.com) (free tier là đủ)
- Tài khoản [Vercel](https://vercel.com) để deploy (tuỳ chọn)

---

## 1. Tạo project Supabase

1. Vào https://supabase.com → **New project**. Đặt tên, chọn region gần VN (Singapore), đặt **Database Password** (lưu lại).
2. Chờ project khởi tạo xong (~2 phút).

### Chạy migration

1. Mở **SQL Editor** → **New query**.
2. Dán toàn bộ nội dung file [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql) → **Run**.
3. Migration sẽ tạo: bảng (`branches`, `profiles`, `customers`, `gifts`, `transactions`, `redemptions`), các RPC nghiệp vụ, RLS, trigger tự tạo profile, và seed dữ liệu mẫu (2 chi nhánh + 4 quà).

---

## 2. Lấy API keys

Vào **Project Settings → API**, copy:

| Biến môi trường | Lấy ở đâu |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key — **bí mật**, chỉ dùng ở server |

> ⚠️ **Không bao giờ** commit `service_role` key hay đưa nó ra client. Chỉ API route `/api/staff` dùng key này.

---

## 3. Chạy local

```bash
# 1. Cài dependencies
npm install

# 2. Tạo file .env.local từ mẫu
cp .env.local.example .env.local   # Windows PowerShell: Copy-Item .env.local.example .env.local

# 3. Mở .env.local và điền 4 giá trị (URL, anon key, service role key, site URL)

# 4. Chạy dev server
npm run dev
```

Mở http://localhost:3000

---

## 4. Tạo tài khoản quản lý đầu tiên

Vì khu `/admin` chỉ cho `role = 'admin'`, bạn cần 1 admin khởi đầu. Có 2 cách:

### Cách A — qua Supabase Dashboard (khuyến nghị)

1. **Authentication → Users → Add user** → nhập email + mật khẩu, bật **Auto Confirm User**.
2. Trigger `handle_new_user` sẽ tạo profile với `role = 'staff'`. Nâng lên admin bằng SQL Editor:

   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'admin@tuibao.vn');
   ```

3. Đăng nhập tại `/login` → bạn vào được `/admin`.
4. Từ **/admin/staff**, tạo các nhân viên còn lại (không cần vào Dashboard nữa).

### Cách B — bằng SQL thủ công (nếu quen)

Tạo user trong `auth.users` rồi set role như trên.

---

## 5. Luồng sử dụng

| Vai trò | Luồng |
|---|---|
| **Nhân viên** | Đăng nhập → nhập SĐT → tìm/tạo khách → nhập HĐ + tiền → **Tích tick** |
| **Nhân viên** | Khách đủ tick → bấm **Đổi** → xác nhận → trừ tick + trừ tồn kho |
| **Quản lý** | `/admin` → tạo NV, thêm chi nhánh, cập nhật tồn kho quà |
| **Khách hàng** | Quét QR → `/check/0912345678` → xem tick & mốc sắp đạt (không cần đăng nhập) |

---

## 6. Deploy lên Vercel

1. Push code lên GitHub.
2. Vercel → **New Project** → import repo.
3. **Environment Variables** — thêm cả 4 biến (giống `.env.local`), nhớ đổi:
   - `NEXT_PUBLIC_SITE_URL` = domain thật, ví dụ `https://tuibao.vercel.app`
4. **Deploy**.

> Sau khi có domain thật, cập nhật lại `NEXT_PUBLIC_SITE_URL` để QR trỏ đúng.

---

## 7. Ghi chú bảo mật

- Mọi thao tác ghi điểm/đổi quà đi qua **RPC `SECURITY DEFINER`** nên trừ tick + tồn kho là **atomic** (không âm kho, không trừ trùng).
- RLS bật trên tất cả bảng. Nhân viên chỉ đọc/ghi qua policy; admin toàn quyền.
- Trang `/check/[phone]` chỉ gọi RPC `customer_check` trả về **tên, SĐT, số tick, danh sách quà** — không lộ lịch sử giao dịch.
