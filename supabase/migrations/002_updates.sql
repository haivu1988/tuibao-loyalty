-- =====================================================================
-- TUIBAO LOYALTY — Cập nhật 002
--   • Thêm cột branches.active (tạm dừng chi nhánh)
--   • customer_check trả thêm image_url của quà
--   • Tạo Storage bucket "gifts" (ảnh quà) + policy
-- Chạy sau 001_initial.sql trong Supabase → SQL Editor.
-- =====================================================================

-- 1) Tạm dừng chi nhánh --------------------------------------------------
alter table public.branches
  add column if not exists active boolean not null default true;

-- 2) customer_check: thêm ảnh quà ---------------------------------------
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
      'image_url', image_url,
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

grant execute on function public.customer_check(text) to anon, authenticated;

-- 3) Storage bucket cho ảnh quà -----------------------------------------
-- Bucket công khai để trang QR của khách xem được ảnh.
insert into storage.buckets (id, name, public)
values ('gifts', 'gifts', true)
on conflict (id) do update set public = true;

-- Ai cũng xem được ảnh (bucket public)
drop policy if exists "gifts_public_read" on storage.objects;
create policy "gifts_public_read" on storage.objects
  for select using (bucket_id = 'gifts');

-- Chỉ nhân viên đã đăng nhập mới được tải ảnh lên / sửa / xoá
drop policy if exists "gifts_staff_insert" on storage.objects;
create policy "gifts_staff_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'gifts' and public.is_staff());

drop policy if exists "gifts_staff_update" on storage.objects;
create policy "gifts_staff_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'gifts' and public.is_staff());

drop policy if exists "gifts_staff_delete" on storage.objects;
create policy "gifts_staff_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'gifts' and public.is_staff());
