-- ============================================================
-- TUIBAO LOYALTY APP - Database Schema
-- Chạy file này trong Supabase SQL Editor
-- ============================================================

-- ── Bảng chi nhánh ──────────────────────────────────────────
create table branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ── Bảng hồ sơ nhân viên (mở rộng auth.users) ───────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  branch_id uuid references branches(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ── Bảng khách hàng ─────────────────────────────────────────
create table customers (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  full_name text,
  total_points integer default 0 check (total_points >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── Bảng giao dịch (hóa đơn) ────────────────────────────────
create table transactions (
  id uuid primary key default gen_random_uuid(),
  invoice_code text not null,
  customer_id uuid references customers(id) on delete restrict not null,
  amount integer not null check (amount > 0),
  points_earned integer not null check (points_earned >= 0),
  staff_id uuid references profiles(id) on delete restrict not null,
  branch_id uuid references branches(id) on delete restrict not null,
  created_at timestamptz default now(),
  -- Ngày theo giờ VN (POS reset mã HĐ mỗi ngày)
  invoice_date date not null default (now() at time zone 'Asia/Ho_Chi_Minh')::date,

  -- Cùng mã HĐ + cùng chi nhánh + cùng ngày = trùng
  constraint uq_invoice_branch_date unique (invoice_code, branch_id, invoice_date)
);

-- ── Bảng quà tặng ───────────────────────────────────────────
create table rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  points_required integer not null check (points_required > 0),
  stock_quantity integer default 0 check (stock_quantity >= 0),
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- ── Bảng lịch sử đổi quà ────────────────────────────────────
create table redemptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete restrict not null,
  reward_id uuid references rewards(id) on delete restrict not null,
  points_used integer not null check (points_used > 0),
  staff_id uuid references profiles(id) on delete restrict not null,
  branch_id uuid references branches(id) on delete restrict not null,
  created_at timestamptz default now()
);

-- ── Trigger: tự tạo profile khi đăng ký ─────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Người dùng'),
    coalesce(new.raw_user_meta_data->>'role', 'staff')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Trigger: cập nhật updated_at cho customers ──────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger customers_updated_at
  before update on customers
  for each row execute procedure update_updated_at();

-- ── RPC: Thêm giao dịch (atomic) ────────────────────────────
create or replace function add_transaction(
  p_invoice_code text,
  p_customer_id uuid,
  p_amount integer,
  p_staff_id uuid,
  p_branch_id uuid
) returns transactions as $$
declare
  v_points integer;
  v_transaction transactions;
begin
  v_points := floor(p_amount::numeric / 20000)::integer;

  insert into transactions (invoice_code, customer_id, amount, points_earned, staff_id, branch_id)
  values (p_invoice_code, p_customer_id, p_amount, v_points, p_staff_id, p_branch_id)
  returning * into v_transaction;

  update customers
  set total_points = total_points + v_points,
      updated_at = now()
  where id = p_customer_id;

  return v_transaction;
end;
$$ language plpgsql security definer;

-- ── RPC: Đổi quà (atomic) ────────────────────────────────────
create or replace function redeem_reward(
  p_customer_id uuid,
  p_reward_id uuid,
  p_staff_id uuid,
  p_branch_id uuid
) returns redemptions as $$
declare
  v_reward rewards;
  v_customer customers;
  v_redemption redemptions;
begin
  select * into v_reward from rewards where id = p_reward_id for update;
  if not found then raise exception 'Quà tặng không tồn tại'; end if;
  if not v_reward.is_active then raise exception 'Quà tặng không còn hoạt động'; end if;
  if v_reward.stock_quantity <= 0 then raise exception 'Quà tặng đã hết hàng'; end if;

  select * into v_customer from customers where id = p_customer_id for update;
  if v_customer.total_points < v_reward.points_required then
    raise exception 'Không đủ điểm để đổi quà';
  end if;

  insert into redemptions (customer_id, reward_id, points_used, staff_id, branch_id)
  values (p_customer_id, p_reward_id, v_reward.points_required, p_staff_id, p_branch_id)
  returning * into v_redemption;

  update customers
  set total_points = total_points - v_reward.points_required,
      updated_at = now()
  where id = p_customer_id;

  update rewards
  set stock_quantity = stock_quantity - 1
  where id = p_reward_id;

  return v_redemption;
end;
$$ language plpgsql security definer;

-- ── Row Level Security ───────────────────────────────────────
alter table branches enable row level security;
alter table profiles enable row level security;
alter table customers enable row level security;
alter table transactions enable row level security;
alter table rewards enable row level security;
alter table redemptions enable row level security;

-- Branches
create policy "branches_read" on branches for select to authenticated using (true);
create policy "branches_write_admin" on branches for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Profiles
create policy "profiles_read" on profiles for select to authenticated using (true);
create policy "profiles_insert_admin" on profiles for insert to authenticated
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "profiles_update_admin" on profiles for update to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin') or id = auth.uid());

-- Customers: tất cả nhân viên đều đọc/ghi được
create policy "customers_all_auth" on customers for all to authenticated using (true) with check (true);
-- Public: cho phép trang QR check điểm
create policy "customers_public_read" on customers for select to anon using (true);

-- Transactions
create policy "transactions_read" on transactions for select to authenticated using (true);
create policy "transactions_insert" on transactions for insert to authenticated with check (true);
create policy "transactions_update_admin" on transactions for update to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "transactions_delete_admin" on transactions for delete to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Rewards
create policy "rewards_read_auth" on rewards for select to authenticated using (true);
create policy "rewards_read_anon" on rewards for select to anon using (is_active = true);
create policy "rewards_write_admin" on rewards for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Redemptions
create policy "redemptions_read" on redemptions for select to authenticated using (true);
create policy "redemptions_insert" on redemptions for insert to authenticated with check (true);
create policy "redemptions_delete_admin" on redemptions for delete to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- ── View thống kê khách hàng (cho quản lý) ──────────────────
create view customer_stats
with (security_invoker = true) as
select
  c.id,
  c.phone,
  c.full_name,
  c.total_points,
  c.created_at,
  coalesce(t.total_spent, 0)::bigint      as total_spent,
  coalesce(t.points_earned, 0)::integer   as total_points_earned,
  coalesce(t.tx_count, 0)::integer        as transaction_count,
  t.last_transaction_at,
  coalesce(r.points_used, 0)::integer     as total_points_used,
  coalesce(r.redeem_count, 0)::integer    as redemption_count
from customers c
left join (
  select customer_id, sum(amount) as total_spent, sum(points_earned) as points_earned,
         count(*) as tx_count, max(created_at) as last_transaction_at
  from transactions group by customer_id
) t on t.customer_id = c.id
left join (
  select customer_id, sum(points_used) as points_used, count(*) as redeem_count
  from redemptions group by customer_id
) r on r.customer_id = c.id;

-- ── Index ───────────────────────────────────────────────────
create index idx_transactions_invoice_date on transactions (invoice_date desc);
create index idx_transactions_created_at on transactions (created_at desc);
create index idx_redemptions_created_at on redemptions (created_at desc);

-- ── RPC: Hủy giao dịch vừa tạo (trong 5 phút) ───────────────
create or replace function void_transaction(p_transaction_id uuid)
returns void as $$
declare
  v_tx transactions;
begin
  select * into v_tx from transactions where id = p_transaction_id for update;

  if v_tx is null then
    raise exception 'Không tìm thấy giao dịch';
  end if;

  if now() - v_tx.created_at > interval '5 minutes' then
    raise exception 'Quá 5 phút, không thể hủy. Liên hệ quản lý.';
  end if;

  update customers
  set total_points = greatest(total_points - v_tx.points_earned, 0),
      updated_at = now()
  where id = v_tx.customer_id;

  delete from transactions where id = p_transaction_id;
end;
$$ language plpgsql security definer;

-- ── Dữ liệu mặc định ────────────────────────────────────────
insert into branches (name, address) values
  ('TUIBAO Tân Kỳ Tân Quý', 'Tân Kỳ Tân Quý, Quận Tân Phú, TP.HCM'),
  ('TUIBAO Âu Cơ', 'Âu Cơ, Quận Tân Bình, TP.HCM');

insert into rewards (name, points_required, stock_quantity, sort_order) values
  ('Trà sữa XL', 10, 50, 1),
  ('Áo mưa trẻ em', 15, 20, 2),
  ('Tinh dầu nước hoa', 20, 15, 3),
  ('Bộ ăn dặm trẻ em', 25, 10, 4);
