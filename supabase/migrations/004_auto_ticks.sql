-- =====================================================================
-- TUIBAO LOYALTY — Cập nhật 004
--   earn_ticks: tự tính tick theo giá trị hoá đơn.
--   Mặc định: 20.000đ = 1 tick (làm tròn xuống). Đổi v_rate nếu cần.
-- Chạy trong Supabase → SQL Editor → Run.
-- =====================================================================

create or replace function public.earn_ticks(
  p_customer_id uuid,
  p_invoice_number text,
  p_amount bigint,
  p_ticks int default 1   -- giữ cho tương thích, KHÔNG dùng nữa (tick tính theo tiền)
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
begin
  select * into v_staff from public.profiles
    where id = auth.uid() and active = true;
  if not found then
    raise exception 'Không có quyền thực hiện thao tác này';
  end if;

  if v_amount <= 0 then
    raise exception 'Vui lòng nhập số tiền hoá đơn';
  end if;

  insert into public.transactions
    (customer_id, staff_id, branch_id, invoice_number, amount, ticks_earned)
  values
    (p_customer_id, v_staff.id, v_staff.branch_id,
     nullif(trim(coalesce(p_invoice_number, '')), ''),
     v_amount, v_ticks);

  update public.customers
    set ticks = ticks + v_ticks,
        total_spent = total_spent + v_amount,
        updated_at = now()
    where id = p_customer_id
    returning * into v_customer;

  if not found then
    raise exception 'Không tìm thấy khách hàng';
  end if;

  return v_customer;
end;
$$;

grant execute on function public.earn_ticks(uuid, text, bigint, int) to authenticated;
