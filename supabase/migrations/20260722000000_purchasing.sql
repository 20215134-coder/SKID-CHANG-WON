-- FSAE ERP: Purchasing & Budget Management (Milestone 5).
-- Member -> Purchase Request -> Treasurer 승인 -> 구매 완료 -> 영수증 업로드 흐름을 구현한다.
-- Inventory 연동은 아직 하지 않지만, 나중에 재설계 없이 연결 가능하도록 모든 계층 FK를 갖춘다.
-- 재실행해도 안전하도록(idempotent) 작성함.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'purchase_priority') then
    create type public.purchase_priority as enum ('low', 'normal', 'high', 'urgent');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'purchase_status') then
    create type public.purchase_status as enum ('draft', 'pending_approval', 'approved', 'rejected', 'purchased', 'cancelled');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'purchase_timeline_event') then
    create type public.purchase_timeline_event as enum ('created', 'submitted', 'approved', 'rejected', 'purchased', 'cancelled');
  end if;
end $$;

-- ── Treasurer: role 랭크(member<leader<admin)와 별개인 boolean 플래그로 관리한다. ──
alter table public.profiles
  add column if not exists is_treasurer boolean not null default false;

-- 활성 Treasurer는 항상 최대 1명이어야 한다.
create unique index if not exists one_active_treasurer_idx on public.profiles ((true)) where is_treasurer;

create or replace function public.current_user_is_treasurer()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_treasurer from public.profiles where id = auth.uid()), false);
$$;

-- ── budgets: 차량 전체(category_id null) + 카테고리별(category_id 지정) 예산을 같은 테이블에서 관리한다. ──
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  category_id uuid references public.engineering_categories (id) on delete cascade,
  allocated_budget numeric not null default 0 check (allocated_budget >= 0),
  used_budget numeric not null default 0 check (used_budget >= 0),
  remaining_budget numeric generated always as (allocated_budget - used_budget) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (vehicle_id, category_id)
);

drop trigger if exists set_budgets_updated_at on public.budgets;
create trigger set_budgets_updated_at
before update on public.budgets
for each row
execute function public.set_updated_at();

-- 차량이 생성되면 차량 전체 예산 1건 + 4개 고정 카테고리 예산을 함께 만든다 (allocated_budget 0으로 시작).
create or replace function public.create_default_engineering_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category_id uuid;
  v_category_name public.bom_category;
begin
  insert into public.budgets (vehicle_id, category_id, allocated_budget)
  values (new.id, null, 0);

  foreach v_category_name in array array['chassis', 'powertrain', 'aero', 'electrical']::public.bom_category[]
  loop
    insert into public.engineering_categories (vehicle_id, name)
    values (new.id, v_category_name)
    returning id into v_category_id;

    insert into public.budgets (vehicle_id, category_id, allocated_budget)
    values (new.id, v_category_id, 0);
  end loop;

  return new;
end;
$$;

-- ── purchase_requests ──
create sequence if not exists public.purchase_request_number_seq;

create table if not exists public.purchase_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique,
  title text not null,
  description text,
  vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  category_id uuid not null references public.engineering_categories (id) on delete restrict,
  subsystem_id uuid not null references public.subsystems (id) on delete restrict,
  assembly_id uuid references public.assemblies (id) on delete restrict,
  part_id uuid references public.bom_parts (id) on delete restrict,
  supplier text,
  product_url text,
  quantity integer not null default 1 check (quantity > 0),
  estimated_cost numeric not null default 0 check (estimated_cost >= 0),
  final_cost numeric check (final_cost is null or final_cost >= 0),
  priority public.purchase_priority not null default 'normal',
  status public.purchase_status not null default 'draft',
  requested_by uuid not null references public.profiles (id) on delete restrict,
  approved_by uuid references public.profiles (id) on delete set null,
  purchased_by uuid references public.profiles (id) on delete set null,
  receipt_file text,
  purchase_notes text,
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  purchased_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchase_requests_part_requires_assembly check (part_id is null or assembly_id is not null)
);

create index if not exists purchase_requests_vehicle_id_idx on public.purchase_requests (vehicle_id);
create index if not exists purchase_requests_category_id_idx on public.purchase_requests (category_id);
create index if not exists purchase_requests_requested_by_idx on public.purchase_requests (requested_by);
create index if not exists purchase_requests_status_idx on public.purchase_requests (status);

drop trigger if exists set_purchase_requests_updated_at on public.purchase_requests;
create trigger set_purchase_requests_updated_at
before update on public.purchase_requests
for each row
execute function public.set_updated_at();

create or replace function public.generate_purchase_request_number()
returns trigger
language plpgsql
as $$
begin
  if new.request_number is null then
    new.request_number := 'PR-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.purchase_request_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists set_purchase_request_number on public.purchase_requests;
create trigger set_purchase_request_number
before insert on public.purchase_requests
for each row
execute function public.generate_purchase_request_number();

-- ── purchase_request_files: 승인 전 첨부(견적/스펙 등). 버전 관리는 필요 없다(엔지니어링 소스가 아님). ──
create table if not exists public.purchase_request_files (
  id uuid primary key default gen_random_uuid(),
  purchase_request_id uuid not null references public.purchase_requests (id) on delete cascade,
  file_name text not null,
  file_type text not null,
  storage_path text not null,
  file_size bigint not null,
  uploaded_by uuid references public.profiles (id) on delete set null,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists purchase_request_files_request_id_idx on public.purchase_request_files (purchase_request_id);

drop trigger if exists set_purchase_request_files_updated_at on public.purchase_request_files;
create trigger set_purchase_request_files_updated_at
before update on public.purchase_request_files
for each row
execute function public.set_updated_at();

-- ── purchase_timeline: append-only 이력. 절대 수정/삭제하지 않는다 (RLS에도 update/delete 정책을 두지 않는다). ──
create table if not exists public.purchase_timeline (
  id uuid primary key default gen_random_uuid(),
  purchase_request_id uuid not null references public.purchase_requests (id) on delete cascade,
  event_type public.purchase_timeline_event not null,
  note text,
  actor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists purchase_timeline_request_id_idx on public.purchase_timeline (purchase_request_id);

-- ── 예산 사용액 자동 계산: status가 'purchased'인 요청들의 final_cost 합계로 used_budget을 갱신한다. ──
create or replace function public.recalculate_budget_usage(p_vehicle_id uuid, p_category_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.budgets
  set used_budget = coalesce(
    (
      select sum(final_cost) from public.purchase_requests
      where vehicle_id = p_vehicle_id and category_id = p_category_id and status = 'purchased'
    ),
    0
  )
  where vehicle_id = p_vehicle_id and category_id = p_category_id;

  update public.budgets
  set used_budget = coalesce(
    (
      select sum(final_cost) from public.purchase_requests
      where vehicle_id = p_vehicle_id and status = 'purchased'
    ),
    0
  )
  where vehicle_id = p_vehicle_id and category_id is null;
end;
$$;

create or replace function public.handle_purchase_request_budget_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_budget_usage(old.vehicle_id, old.category_id);
    return old;
  end if;

  perform public.recalculate_budget_usage(new.vehicle_id, new.category_id);

  if tg_op = 'UPDATE' and (old.vehicle_id is distinct from new.vehicle_id or old.category_id is distinct from new.category_id) then
    perform public.recalculate_budget_usage(old.vehicle_id, old.category_id);
  end if;

  return new;
end;
$$;

drop trigger if exists purchase_request_budget_change on public.purchase_requests;
create trigger purchase_request_budget_change
after insert or update or delete on public.purchase_requests
for each row
execute function public.handle_purchase_request_budget_change();

-- ── RLS: purchase_requests ──
alter table public.purchase_requests enable row level security;

drop policy if exists "purchase_requests_select" on public.purchase_requests;
drop policy if exists "purchase_requests_insert_own" on public.purchase_requests;
drop policy if exists "purchase_requests_update_admin_or_treasurer" on public.purchase_requests;
drop policy if exists "purchase_requests_update_requester_own" on public.purchase_requests;

create policy "purchase_requests_select"
on public.purchase_requests
for select
to authenticated
using (
  public.current_user_status() = 'active'
  and (
    public.current_user_role() = 'admin'
    or public.current_user_is_treasurer()
    or (public.current_user_role() = 'leader' and public.engineering_category_name(category_id) = public.current_user_bom_category())
    or requested_by = auth.uid()
  )
);

create policy "purchase_requests_insert_own"
on public.purchase_requests
for insert
to authenticated
with check (
  public.current_user_status() = 'active'
  and requested_by = auth.uid()
  and status in ('draft', 'pending_approval')
);

create policy "purchase_requests_update_admin_or_treasurer"
on public.purchase_requests
for update
to authenticated
using (public.current_user_role() = 'admin' or public.current_user_is_treasurer())
with check (public.current_user_role() = 'admin' or public.current_user_is_treasurer());

create policy "purchase_requests_update_requester_own"
on public.purchase_requests
for update
to authenticated
using (requested_by = auth.uid() and status in ('draft', 'pending_approval'))
with check (requested_by = auth.uid());

-- ── RLS: purchase_request_files ──
alter table public.purchase_request_files enable row level security;

drop policy if exists "purchase_request_files_select" on public.purchase_request_files;
drop policy if exists "purchase_request_files_insert" on public.purchase_request_files;
drop policy if exists "purchase_request_files_delete" on public.purchase_request_files;

create policy "purchase_request_files_select"
on public.purchase_request_files
for select
to authenticated
using (
  exists (
    select 1 from public.purchase_requests pr
    where pr.id = purchase_request_id
      and (
        public.current_user_role() = 'admin'
        or public.current_user_is_treasurer()
        or (public.current_user_role() = 'leader' and public.engineering_category_name(pr.category_id) = public.current_user_bom_category())
        or pr.requested_by = auth.uid()
      )
  )
);

create policy "purchase_request_files_insert"
on public.purchase_request_files
for insert
to authenticated
with check (
  exists (
    select 1 from public.purchase_requests pr
    where pr.id = purchase_request_id
      and (
        public.current_user_role() = 'admin'
        or public.current_user_is_treasurer()
        or pr.requested_by = auth.uid()
      )
  )
);

create policy "purchase_request_files_delete"
on public.purchase_request_files
for delete
to authenticated
using (
  exists (
    select 1 from public.purchase_requests pr
    where pr.id = purchase_request_id
      and (
        public.current_user_role() = 'admin'
        or public.current_user_is_treasurer()
        or (pr.requested_by = auth.uid() and pr.status = 'draft')
      )
  )
);

-- ── RLS: purchase_timeline (select만 허용, update/delete 정책 없음 = 영구 불변) ──
alter table public.purchase_timeline enable row level security;

drop policy if exists "purchase_timeline_select" on public.purchase_timeline;
drop policy if exists "purchase_timeline_insert" on public.purchase_timeline;

create policy "purchase_timeline_select"
on public.purchase_timeline
for select
to authenticated
using (
  exists (
    select 1 from public.purchase_requests pr
    where pr.id = purchase_request_id
      and (
        public.current_user_role() = 'admin'
        or public.current_user_is_treasurer()
        or (public.current_user_role() = 'leader' and public.engineering_category_name(pr.category_id) = public.current_user_bom_category())
        or pr.requested_by = auth.uid()
      )
  )
);

create policy "purchase_timeline_insert"
on public.purchase_timeline
for insert
to authenticated
with check (
  exists (
    select 1 from public.purchase_requests pr
    where pr.id = purchase_request_id
      and (
        public.current_user_role() = 'admin'
        or public.current_user_is_treasurer()
        or pr.requested_by = auth.uid()
      )
  )
);

-- ── RLS: budgets (client insert/delete 없음 — 차량/카테고리 생성 트리거로만 생성) ──
alter table public.budgets enable row level security;

drop policy if exists "budgets_select" on public.budgets;
drop policy if exists "budgets_update_admin" on public.budgets;

create policy "budgets_select"
on public.budgets
for select
to authenticated
using (
  public.current_user_status() = 'active'
  and (
    public.current_user_role() = 'admin'
    or public.current_user_is_treasurer()
    or (
      public.current_user_role() = 'leader'
      and (category_id is null or public.engineering_category_name(category_id) = public.current_user_bom_category())
    )
  )
);

create policy "budgets_update_admin"
on public.budgets
for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

-- ── Storage: 구매 첨부/영수증 파일 (private, 서명 URL로만 접근) ──
insert into storage.buckets (id, name, public)
values ('purchase-files', 'purchase-files', false)
on conflict (id) do nothing;

drop policy if exists "purchase_files_select_active" on storage.objects;
drop policy if exists "purchase_files_write_active" on storage.objects;
drop policy if exists "purchase_files_delete_admin_or_treasurer" on storage.objects;

create policy "purchase_files_select_active"
on storage.objects
for select
to authenticated
using (bucket_id = 'purchase-files' and public.current_user_status() = 'active');

create policy "purchase_files_write_active"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'purchase-files' and public.current_user_status() = 'active');

create policy "purchase_files_delete_admin_or_treasurer"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'purchase-files'
  and (public.current_user_role() = 'admin' or public.current_user_is_treasurer())
);
