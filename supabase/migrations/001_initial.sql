-- =====================================================================
-- TUIBAO LOYALTY — Initial schema
-- Chạy file này trong: Supabase Dashboard → SQL Editor → New query → Run
-- =====================================================================

create extension if not exists "uuid-ossp";

-- =====================================================================
-- TABLES
-- =====================================================================

-- Chi nhánh
create table if not exists public.branches (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  address     text,
  phone       text,
  created_at  timestamptz not null default now()
);

-- Hồ sơ người dùng nội bộ (nhân viên + quản lý), nối với auth.users
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  role        text not null default 'staff' check (role in ('staff', 'admin')),
  branch_id   uuid references public.branches(id) on delete set null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Khách hàng
create table if not exists public.customers (
  id           uuid primary key default uuid_generate_v4(),
  phone        text not null unique,
  full_name    text,
  ticks        int not null default 0 check (ticks >= 0),
  total_spent  bigint not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Quà
create table if not exists public.gifts (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  tick_cost   int not null check (tick_cost > 0),
  stock       int not null default 0 check (stock >= 0),
  image_url   text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Giao dịch tích điểm (cộng tick)
create table if not exists public.transactions (
  id              uuid primary key default uuid_generate_v4(),
  customer_id     uuid not null references public.customers(id) on delete cascade,
  staff_id        uuid references public.profiles(id) on delete set null,
  branch_id       uuid references public.branches(id) on delete set null,
  invoice_number  text,
  amount          bigint not null default 0,
  ticks_earned    int not null default 1,
  created_at      timestamptz not null default now()
);

-- Đổi quà (trừ tick)
create table if not exists public.redemptions (
  id            uuid primary key default uuid_generate_v4(),
  customer_id   uuid not null references public.customers(id) on delete cascade,
  staff_id      uuid references public.profiles(id) on delete set null,
  gift_id       uuid references public.gifts(id) on delete set null,
  gift_name     text,
  ticks_spent   int not null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_customers_phone on public.customers (phone);
create index if not exists idx_transactions_customer on public.transactions (customer_id);
create index if not exists idx_redemptions_customer on public.redemptions (customer_id);

-- =====================================================================
-- HELPER FUNCTIONS (SECURITY DEFINER để tránh đệ quy RLS trên profiles)
-- =====================================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and active = true
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active = true
  );
$$;

-- =====================================================================
-- BUSINESS LOGIC RPCs
-- =====================================================================

-- Tìm hoặc tạo khách theo SĐT (chuẩn hoá: chỉ giữ chữ số)
create or replace function public.find_or_create_customer(
  p_phone text,
  p_full_name text default null
)
returns public.customers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_customer public.customers;
begin
  if not public.is_staff() then
    raise exception 'Không có quyền thực hiện thao tác này';
  end if;

  if length(v_phone) < 8 then
    raise exception 'Số điện thoại không hợp lệ';
  end if;

  select * into v_customer from public.customers where phone = v_phone;

  if not found then
    insert into public.customers (phone, full_name)
    values (v_phone, nullif(trim(coalesce(p_full_name, '')), ''))
    returning * into v_customer;
  elsif p_full_name is not null and trim(p_full_name) <> ''
        and (v_customer.full_name is null or v_customer.full_name = '') then
    update public.customers
      set full_name = trim(p_full_name), updated_at = now()
      where id = v_customer.id
      returning * into v_customer;
  end if;

  return v_customer;
end;
$$;

-- Tích tick cho khách từ 1 hoá đơn
create or replace function public.earn_ticks(
  p_customer_id uuid,
  p_invoice_number text,
  p_amount bigint,
  p_ticks int default 1
)
returns public.customers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff   public.profiles;
  v_customer public.customers;
  v_ticks   int := greatest(coalesce(p_ticks, 1), 0);
begin
  select * into v_staff from public.profiles
    where id = auth.uid() and active = true;
  if not found then
    raise exception 'Không có quyền thực hiện thao tác này';
  end if;

  if v_ticks = 0 then
    raise exception 'Số tick phải lớn hơn 0';
  end if;

  insert into public.transactions
    (customer_id, staff_id, branch_id, invoice_number, amount, ticks_earned)
  values
    (p_customer_id, v_staff.id, v_staff.branch_id,
     nullif(trim(coalesce(p_invoice_number, '')), ''),
     greatest(coalesce(p_amount, 0), 0), v_ticks);

  update public.customers
    set ticks = ticks + v_ticks,
        total_spent = total_spent + greatest(coalesce(p_amount, 0), 0),
        updated_at = now()
    where id = p_customer_id
    returning * into v_customer;

  if not found then
    raise exception 'Không tìm thấy khách hàng';
  end if;

  return v_customer;
end;
$$;

-- Đổi quà: kiểm tra tồn kho + số tick, trừ cả hai (atomic)
create or replace function public.redeem_gift(
  p_customer_id uuid,
  p_gift_id uuid
)
returns public.customers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff    public.profiles;
  v_gift     public.gifts;
  v_customer public.customers;
begin
  select * into v_staff from public.profiles
    where id = auth.uid() and active = true;
  if not found then
    raise exception 'Không có quyền thực hiện thao tác này';
  end if;

  -- Khoá dòng quà để tránh trừ tồn kho trùng
  select * into v_gift from public.gifts where id = p_gift_id for update;
  if not found or v_gift.active = false then
    raise exception 'Quà không tồn tại hoặc đã ngừng áp dụng';
  end if;
  if v_gift.stock <= 0 then
    raise exception 'Quà đã hết hàng';
  end if;

  select * into v_customer from public.customers where id = p_customer_id for update;
  if not found then
    raise exception 'Không tìm thấy khách hàng';
  end if;
  if v_customer.ticks < v_gift.tick_cost then
    raise exception 'Khách chưa đủ tick để đổi quà này';
  end if;

  update public.gifts set stock = stock - 1 where id = v_gift.id;

  update public.customers
    set ticks = ticks - v_gift.tick_cost, updated_at = now()
    where id = v_customer.id
    returning * into v_customer;

  insert into public.redemptions
    (customer_id, staff_id, gift_id, gift_name, ticks_spent)
  values
    (v_customer.id, v_staff.id, v_gift.id, v_gift.name, v_gift.tick_cost);

  return v_customer;
end;
$$;

-- Trang QR công khai: trả về thông tin an toàn cho khách tự xem (không cần đăng nhập)
create or replace function public.customer_check(p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_customer public.customers;
  v_gifts jsonb;
begin
  select * into v_customer from public.customers where phone = v_phone;
  if not found then
    return jsonb_build_object('found', false);
  end if;

  select coalesce(jsonb_agg(gj order by tc), '[]'::jsonb)
  into v_gifts
  from (
    select jsonb_build_object(
      'id', id,
      'name', name,
      'tick_cost', tick_cost,
      'in_stock', stock > 0,
      'reached', v_customer.ticks >= tick_cost,
      'ticks_needed', greatest(tick_cost - v_customer.ticks, 0)
    ) as gj, tick_cost as tc
    from public.gifts
    where active = true
  ) t;

  return jsonb_build_object(
    'found', true,
    'full_name', v_customer.full_name,
    'phone', v_customer.phone,
    'ticks', v_customer.ticks,
    'gifts', v_gifts
  );
end;
$$;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

alter table public.branches     enable row level security;
alter table public.profiles     enable row level security;
alter table public.customers    enable row level security;
alter table public.gifts        enable row level security;
alter table public.transactions enable row level security;
alter table public.redemptions  enable row level security;

-- profiles: xem hồ sơ của mình; admin xem/sửa tất cả
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- branches: nhân viên xem; admin toàn quyền
drop policy if exists branches_select on public.branches;
create policy branches_select on public.branches
  for select using (public.is_staff());

drop policy if exists branches_admin_all on public.branches;
create policy branches_admin_all on public.branches
  for all using (public.is_admin()) with check (public.is_admin());

-- customers: nhân viên xem + thêm + sửa (tích điểm qua RPC vẫn bỏ qua RLS)
drop policy if exists customers_staff_select on public.customers;
create policy customers_staff_select on public.customers
  for select using (public.is_staff());

drop policy if exists customers_staff_insert on public.customers;
create policy customers_staff_insert on public.customers
  for insert with check (public.is_staff());

drop policy if exists customers_staff_update on public.customers;
create policy customers_staff_update on public.customers
  for update using (public.is_staff()) with check (public.is_staff());

-- gifts: nhân viên xem; admin toàn quyền
drop policy if exists gifts_select on public.gifts;
create policy gifts_select on public.gifts
  for select using (public.is_staff());

drop policy if exists gifts_admin_all on public.gifts;
create policy gifts_admin_all on public.gifts
  for all using (public.is_admin()) with check (public.is_admin());

-- transactions: nhân viên xem + thêm
drop policy if exists tx_select on public.transactions;
create policy tx_select on public.transactions
  for select using (public.is_staff());

drop policy if exists tx_insert on public.transactions;
create policy tx_insert on public.transactions
  for insert with check (public.is_staff());

-- redemptions: nhân viên xem + thêm
drop policy if exists rd_select on public.redemptions;
create policy rd_select on public.redemptions
  for select using (public.is_staff());

drop policy if exists rd_insert on public.redemptions;
create policy rd_insert on public.redemptions
  for insert with check (public.is_staff());

-- =====================================================================
-- GRANTS cho RPC
-- =====================================================================
grant execute on function public.customer_check(text) to anon, authenticated;
grant execute on function public.find_or_create_customer(text, text) to authenticated;
grant execute on function public.earn_ticks(uuid, text, bigint, int) to authenticated;
grant execute on function public.redeem_gift(uuid, uuid) to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_staff() to authenticated;

-- =====================================================================
-- AUTO-TẠO PROFILE khi tạo auth user (metadata: full_name, role, branch_id)
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, branch_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'staff'),
    (nullif(new.raw_user_meta_data->>'branch_id', ''))::uuid
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- SEED dữ liệu mẫu (chi nhánh + quà). Xoá nếu không cần.
-- =====================================================================
insert into public.branches (name, address, phone)
values
  ('TUIBAO - Chi nhánh Quận 1', '12 Nguyễn Huệ, Q.1, TP.HCM', '0901234567'),
  ('TUIBAO - Chi nhánh Quận 3', '45 Võ Văn Tần, Q.3, TP.HCM', '0907654321')
on conflict do nothing;

insert into public.gifts (name, description, tick_cost, stock)
values
  ('Ly nước miễn phí', 'Đổi 1 ly nước bất kỳ size M', 5, 100),
  ('Bánh ngọt', 'Một phần bánh ngọt trong ngày', 8, 50),
  ('Voucher 50.000đ', 'Giảm 50.000đ cho hoá đơn tiếp theo', 10, 200),
  ('Túi vải TUIBAO', 'Túi vải thương hiệu TUIBAO', 20, 30)
on conflict do nothing;
