-- =====================================================================
-- TUIBAO LOYALTY — Cập nhật 005
--   • Chống trùng hoá đơn: cùng mã + cùng chi nhánh + cùng ngày
--     (POS reset số hoá đơn mỗi ngày nên KHÁC NGÀY vẫn tích được)
--   • void_transaction: nhân viên huỷ giao dịch vừa nhập trong 5 phút
--   • customer_stats: view thống kê khách cho trang quản lý
-- Chạy trong Supabase → SQL Editor → Run. An toàn, không mất dữ liệu.
-- =====================================================================

-- ── 1) Cột ngày hoá đơn (theo giờ VN) ───────────────────────────────
alter table public.transactions
  add column if not exists invoice_date date;

-- Điền ngày cho các giao dịch cũ
update public.transactions
set invoice_date = (created_at at time zone 'Asia/Ho_Chi_Minh')::date
where invoice_date is null;

alter table public.transactions
  alter column invoice_date set default (now() at time zone 'Asia/Ho_Chi_Minh')::date;

alter table public.transactions
  alter column invoice_date set not null;

-- ── 2) Xem thử có hoá đơn trùng sẵn không ───────────────────────────
-- Nếu câu lệnh ở bước 3 báo lỗi, chạy riêng câu này để xem trùng ở đâu:
--
--   select invoice_number, branch_id, invoice_date, count(*)
--   from public.transactions
--   where invoice_number is not null
--   group by 1,2,3 having count(*) > 1;

-- ── 3) Chặn trùng hoá đơn (chỉ khi có nhập mã) ──────────────────────
-- Dọn dẹp bản cũ: có thể đang tồn tại dạng constraint HOẶC dạng index.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'uq_invoice_branch_date'
      and conrelid = 'public.transactions'::regclass
  ) then
    alter table public.transactions drop constraint uq_invoice_branch_date;
  end if;
end $$;

drop index if exists public.uq_invoice_branch_date;

-- Chưa gán chi nhánh (branch_id rỗng) được coi như MỘT chi nhánh riêng,
-- nhờ coalesce — nếu để rỗng thẳng, Postgres coi mọi dòng là khác nhau
-- và hoá đơn trùng sẽ lọt hết.
create unique index if not exists uq_invoice_branch_date
  on public.transactions (
    invoice_number,
    (coalesce(branch_id, '00000000-0000-0000-0000-000000000000'::uuid)),
    invoice_date
  )
  where invoice_number is not null;

-- ── 3b) earn_ticks: bắt buộc có chi nhánh + báo lỗi trùng rõ ràng ───
create or replace function public.earn_ticks(
  p_customer_id uuid,
  p_invoice_number text,
  p_amount bigint,
  p_ticks int default 1   -- giữ cho tương thích, KHÔNG dùng nữa
)
returns public.customers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff    public.profiles;
  v_customer public.customers;
  v_rate     int := 20000;            -- 20.000đ = 1 tick
  v_amount   bigint := greatest(coalesce(p_amount, 0), 0);
  v_ticks    int := floor(v_amount::numeric / v_rate)::int;
  v_invoice  text := nullif(trim(coalesce(p_invoice_number, '')), '');
begin
  select * into v_staff from public.profiles
    where id = auth.uid() and active = true;
  if not found then
    raise exception 'Không có quyền thực hiện thao tác này';
  end if;

  if v_amount <= 0 then
    raise exception 'Vui lòng nhập số tiền hoá đơn';
  end if;

  begin
    insert into public.transactions
      (customer_id, staff_id, branch_id, invoice_number, amount, ticks_earned)
    values
      (p_customer_id, v_staff.id, v_staff.branch_id, v_invoice, v_amount, v_ticks);
  exception when unique_violation then
    raise exception 'Hoá đơn % đã được tích tick tại chi nhánh này hôm nay rồi.', v_invoice
      using errcode = 'unique_violation';
  end;

  update public.customers
    set ticks       = ticks + v_ticks,
        total_spent = total_spent + v_amount,
        updated_at  = now()
    where id = p_customer_id
    returning * into v_customer;

  if not found then
    raise exception 'Không tìm thấy khách hàng';
  end if;

  return v_customer;
end;
$$;

grant execute on function public.earn_ticks(uuid, text, bigint, int) to authenticated;

-- ── 4) Huỷ giao dịch vừa nhập (trong 5 phút) ────────────────────────
create or replace function public.void_transaction(p_transaction_id uuid)
returns public.customers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx       public.transactions;
  v_customer public.customers;
begin
  if not public.is_staff() then
    raise exception 'Không có quyền thực hiện thao tác này';
  end if;

  select * into v_tx
  from public.transactions
  where id = p_transaction_id
  for update;

  if not found then
    raise exception 'Không tìm thấy giao dịch';
  end if;

  if now() - v_tx.created_at > interval '5 minutes' then
    raise exception 'Quá 5 phút, không thể huỷ. Liên hệ quản lý.';
  end if;

  update public.customers
  set ticks       = greatest(ticks - v_tx.ticks_earned, 0),
      total_spent = greatest(total_spent - v_tx.amount, 0),
      updated_at  = now()
  where id = v_tx.customer_id
  returning * into v_customer;

  delete from public.transactions where id = p_transaction_id;

  return v_customer;
end;
$$;

grant execute on function public.void_transaction(uuid) to authenticated;

-- ── 5) Cập nhật tên khách (nhân viên hỏi tên rồi nhập) ──────────────
create or replace function public.set_customer_name(
  p_customer_id uuid,
  p_full_name   text
)
returns public.customers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer public.customers;
begin
  if not public.is_staff() then
    raise exception 'Không có quyền thực hiện thao tác này';
  end if;

  update public.customers
  set full_name  = nullif(trim(coalesce(p_full_name, '')), ''),
      updated_at = now()
  where id = p_customer_id
  returning * into v_customer;

  if not found then
    raise exception 'Không tìm thấy khách hàng';
  end if;

  return v_customer;
end;
$$;

grant execute on function public.set_customer_name(uuid, text) to authenticated;

-- ── 6) View thống kê khách hàng (trang quản lý) ─────────────────────
drop view if exists public.customer_stats;

create view public.customer_stats
with (security_invoker = true) as
select
  c.id,
  c.phone,
  c.full_name,
  c.ticks,
  c.total_spent,
  c.created_at,
  coalesce(t.ticks_earned, 0)::int    as ticks_earned,
  coalesce(t.tx_count, 0)::int        as transaction_count,
  t.last_transaction_at,
  coalesce(r.ticks_spent, 0)::int     as ticks_spent,
  coalesce(r.redeem_count, 0)::int    as redemption_count
from public.customers c
left join (
  select customer_id,
         sum(ticks_earned) as ticks_earned,
         count(*)          as tx_count,
         max(created_at)   as last_transaction_at
  from public.transactions
  group by customer_id
) t on t.customer_id = c.id
left join (
  select customer_id,
         sum(ticks_spent) as ticks_spent,
         count(*)         as redeem_count
  from public.redemptions
  group by customer_id
) r on r.customer_id = c.id;

-- ── 7) Index tăng tốc truy vấn theo ngày ────────────────────────────
create index if not exists idx_transactions_invoice_date
  on public.transactions (invoice_date desc);

create index if not exists idx_transactions_created_at
  on public.transactions (created_at desc);

create index if not exists idx_redemptions_created_at
  on public.redemptions (created_at desc);
