-- =====================================================================
-- TUIBAO LOYALTY — Sửa 003
--   Sửa lỗi customer_check: "missing FROM-clause entry for table g"
--   Nguyên nhân: order by g.tick_cost (g là cột jsonb, không phải bảng).
--   => đổi alias rõ ràng (gj / tc) và order by tc.
-- Chạy trong Supabase → SQL Editor → Run.
-- =====================================================================

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
    select
      jsonb_build_object(
        'id', id,
        'name', name,
        'tick_cost', tick_cost,
        'image_url', image_url,
        'in_stock', stock > 0,
        'reached', v_customer.ticks >= tick_cost,
        'ticks_needed', greatest(tick_cost - v_customer.ticks, 0)
      ) as gj,
      tick_cost as tc
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

grant execute on function public.customer_check(text) to anon, authenticated;
