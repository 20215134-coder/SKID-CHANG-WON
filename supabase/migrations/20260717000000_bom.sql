-- FSAE ERP: Vehicle BOM (Bill of Materials) — 설계/엔지니어링 정보만 관리한다.
-- 재고/수량/창고 위치는 다루지 않는다 (Inventory 모듈에서 별도 구현).
-- 재실행해도 안전하도록(idempotent) 작성함.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'bom_category') then
    create type public.bom_category as enum ('chassis', 'powertrain', 'aero', 'electrical');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'manufacturing_status') then
    create type public.manufacturing_status as enum (
      'designing',
      'ready_for_manufacturing',
      'manufacturing',
      'inspection',
      'assembly',
      'completed'
    );
  end if;
end $$;

-- Leader가 담당하는 BOM 카테고리 (Team Management의 자유 텍스트 department와는 별개 개념).
alter table public.profiles
  add column if not exists bom_category public.bom_category;

create table if not exists public.bom_parts (
  id uuid primary key default gen_random_uuid(),
  part_number text not null unique,
  part_name text not null,
  category public.bom_category not null,
  revision text not null default 'A',
  material text,
  weight numeric,
  manufacturing_status public.manufacturing_status not null default 'designing',
  owner_id uuid references public.profiles (id) on delete set null,
  supplier text,
  cad_file_url text,
  drawing_url text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_bom_parts_updated_at
before update on public.bom_parts
for each row
execute function public.set_updated_at();

-- 리비전 이력: revision 값이 바뀌는 순간에만 "바뀌기 직전 상태"를 스냅샷으로 남긴다. 절대 수정/삭제하지 않는다.
create table if not exists public.bom_part_revisions (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references public.bom_parts (id) on delete cascade,
  part_number text not null,
  part_name text not null,
  category public.bom_category not null,
  revision text not null,
  material text,
  weight numeric,
  manufacturing_status public.manufacturing_status not null,
  owner_id uuid references public.profiles (id) on delete set null,
  supplier text,
  cad_file_url text,
  drawing_url text,
  description text,
  recorded_at timestamptz not null default now(),
  recorded_by uuid references public.profiles (id) on delete set null
);

create or replace function public.snapshot_bom_part_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.revision is distinct from old.revision then
    insert into public.bom_part_revisions (
      part_id, part_number, part_name, category, revision, material, weight,
      manufacturing_status, owner_id, supplier, cad_file_url, drawing_url, description, recorded_by
    )
    values (
      old.id, old.part_number, old.part_name, old.category, old.revision, old.material, old.weight,
      old.manufacturing_status, old.owner_id, old.supplier, old.cad_file_url, old.drawing_url, old.description,
      auth.uid()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists snapshot_bom_part_revision on public.bom_parts;

create trigger snapshot_bom_part_revision
before update on public.bom_parts
for each row
execute function public.snapshot_bom_part_revision();

-- 현재 로그인 사용자가 담당하는 BOM 카테고리를 RLS 재귀 없이 조회하기 위한 helper.
create or replace function public.current_user_bom_category()
returns public.bom_category
language sql
security definer
set search_path = public
stable
as $$
  select bom_category from public.profiles where id = auth.uid();
$$;

alter table public.bom_parts enable row level security;
alter table public.bom_part_revisions enable row level security;

drop policy if exists "bom_parts_select_active" on public.bom_parts;
drop policy if exists "bom_parts_insert_admin" on public.bom_parts;
drop policy if exists "bom_parts_insert_leader_own_category" on public.bom_parts;
drop policy if exists "bom_parts_update_admin" on public.bom_parts;
drop policy if exists "bom_parts_update_leader_own_category" on public.bom_parts;
drop policy if exists "bom_parts_delete_admin" on public.bom_parts;

create policy "bom_parts_select_active"
on public.bom_parts
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "bom_parts_insert_admin"
on public.bom_parts
for insert
to authenticated
with check (public.current_user_role() = 'admin');

create policy "bom_parts_insert_leader_own_category"
on public.bom_parts
for insert
to authenticated
with check (
  public.current_user_role() = 'leader'
  and category = public.current_user_bom_category()
);

create policy "bom_parts_update_admin"
on public.bom_parts
for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "bom_parts_update_leader_own_category"
on public.bom_parts
for update
to authenticated
using (
  public.current_user_role() = 'leader'
  and category = public.current_user_bom_category()
)
with check (
  public.current_user_role() = 'leader'
  and category = public.current_user_bom_category()
);

create policy "bom_parts_delete_admin"
on public.bom_parts
for delete
to authenticated
using (public.current_user_role() = 'admin');

drop policy if exists "bom_part_revisions_select_active" on public.bom_part_revisions;

create policy "bom_part_revisions_select_active"
on public.bom_part_revisions
for select
to authenticated
using (public.current_user_status() = 'active');

-- Storage: BOM 파일(CAD/도면/이미지) 저장용 비공개 버킷. 다운로드는 서명 URL로만 접근한다.
insert into storage.buckets (id, name, public)
values ('bom-files', 'bom-files', false)
on conflict (id) do nothing;

drop policy if exists "bom_files_select_active" on storage.objects;
drop policy if exists "bom_files_write_admin_or_leader" on storage.objects;
drop policy if exists "bom_files_delete_admin_or_leader" on storage.objects;

create policy "bom_files_select_active"
on storage.objects
for select
to authenticated
using (bucket_id = 'bom-files' and public.current_user_status() = 'active');

create policy "bom_files_write_admin_or_leader"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'bom-files'
  and public.current_user_role() in ('admin', 'leader')
);

create policy "bom_files_delete_admin_or_leader"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'bom-files'
  and public.current_user_role() in ('admin', 'leader')
);
