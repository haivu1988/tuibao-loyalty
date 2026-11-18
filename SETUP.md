# TUIBAO Tích Điểm — Hướng dẫn cài đặt

## Yêu cầu
- Node.js 18+
- Tài khoản Supabase (miễn phí)
- Tài khoản Vercel (miễn phí)

---

## Bước 1: Cài đặt Supabase

1. Tạo project mới tại [supabase.com](https://supabase.com)
2. Vào **SQL Editor** → paste toàn bộ nội dung file `supabase/migrations/001_initial.sql` → **Run**
3. Lấy thông tin từ **Settings → API**:
   - `Project URL`
   - `anon public key`
   - `service_role secret key`

### Tạo tài khoản admin đầu tiên
Trong Supabase SQL Editor, chạy:
```sql
-- Sau khi chạy migration xong
-- Tạo tài khoản admin qua Authentication > Users > Add user
-- Email: admin@tuibao.vn | Password: (tự đặt)
-- Sau đó cập nhật role:
UPDATE profiles SET role = 'admin' WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@tuibao.vn'
);
```

---

## Bước 2: Cài đặt local

```bash
# Clone / download project
cd tuibao-loyalty

# Cài dependencies
npm install

# Tạo file .env.local
cp .env.local.example .env.local
# Điền NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# Chạy thử
npm run dev
# Mở http://localhost:3000
```

---

## Bước 3: Deploy lên Vercel

1. Push code lên GitHub
2. Vào [vercel.com](https://vercel.com) → **New Project** → chọn repo
3. Thêm **Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
4. **Deploy** — xong!

---

## Luồng sử dụng

### Nhân viên
1. Đăng nhập tại `your-app.vercel.app/login`
2. Nhập SĐT khách → tìm hoặc tạo mới
3. Nhập mã hóa đơn + số tiền → tích điểm
4. Nếu đủ điểm → bấm Đổi quà

### Khách hàng tự check điểm
- Nhân viên cho khách quét QR trên màn hình
- Hoặc khách vào: `your-app.vercel.app/check/0912345678`

### Quản lý
1. Vào `/admin` (hoặc bấm biểu tượng ⚙️)
2. Quản lý nhân viên: tạo tài khoản, gán chi nhánh
3. Quản lý chi nhánh: thêm/tắt
4. Quản lý quà: cập nhật tồn kho, thêm quà mới

---

## Cơ chế tính điểm
- Mỗi **20.000đ = 1 tick**
- Điểm được tính tự động: `floor(số tiền / 20.000)`
- Mã hóa đơn trùng sẽ bị chặn tự động

## Mốc đổi quà mặc định
| Tick | Quà |
|------|-----|
| 10 | Trà sữa XL |
| 15 | Áo mưa trẻ em |
| 20 | Tinh dầu nước hoa |
| 25 | Bộ ăn dặm trẻ em |
