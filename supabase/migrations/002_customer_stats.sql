-- ════════════════════════════════════════════════════════════
-- Migration 002: View thống kê khách hàng + sửa unique hóa đơn
-- Chạy file này nếu bạn ĐÃ chạy 001_initial.sql trước đó
-- ════════════════════════════════════════════════════════════

-- ── 1. Sửa ràng buộc mã hóa đơn (POS reset mỗi ngày) ────────
alter table transactions drop constraint if exists transactions_invoice_code_key;

alter table transactions
  add column if not exists invoice_date date not null
  default (now() at time zone 'Asia/Ho_Chi_Minh')::date;

-- Điền ngày cho các giao dịch cũ
update transactions
set invoice_date = (created_at at time zone 'Asia/Ho_Chi_Minh')::date
where invoice_date is null;

alter table transactions drop constraint if exists uq_invoice_branch_date;
alter table transactions
  add constraint uq_invoice_branch_date
  unique (invoice_code, branch_id, invoice_date);

-- ── 2. View thống kê khách hàng (cho quản lý) ───────────────
drop view if exists customer_stats;

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
  select
    customer_id,
    sum(amount)          as total_spent,
    sum(points_earned)   as points_earned,
    count(*)             as tx_count,
    max(created_at)      as last_transaction_at
  from transactions
  group by customer_id
) t on t.customer_id = c.id
left join (
  select
    customer_id,
    sum(points_used)  as points_used,
    count(*)          as redeem_count
  from redemptions
  group by customer_id
) r on r.customer_id = c.id;

-- ── 3. Index cho truy vấn theo ngày ─────────────────────────
create index if not exists idx_transactions_invoice_date
  on transactions (invoice_date desc);

create index if not exists idx_transactions_created_at
  on transactions (created_at desc);

create index if not exists idx_redemptions_created_at
  on redemptions (created_at desc);

-- ── 4. RPC: Hủy giao dịch vừa tạo (trong 5 phút) ────────────
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
