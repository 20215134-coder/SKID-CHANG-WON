-- FSAE ERP: Part당 여러 개의 엔지니어링 파일(CAD/도면/이미지)을 버전과 함께 관리한다.
-- 기존 bom_parts.cad_file_url / drawing_url(파트당 파일 1개 제한)을 대체한다.
-- 재실행해도 안전하도록(idempotent) 작성함.

-- 단일 파일 컬럼을 참조하던 리비전 스냅샷 트리거를 먼저 새 컬럼 구성으로 교체한다.
create or replace function public.snapshot_bom_part_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.revision is distinct from old.revision then
    insert into public.bom_part_revisions (
      part_id, part_number, part_name, assembly_id, revision, material, weight,
      manufacturing_status, owner_id, supplier, description, recorded_by
    )
    values (
      old.id, old.part_number, old.part_name, old.assembly_id, old.revision, old.material, old.weight,
      old.manufacturing_status, old.owner_id, old.supplier, old.description,
      auth.uid()
    );
  end if;
  return new;
end;
$$;

alter table public.bom_parts
  drop column if exists cad_file_url,
  drop column if exists drawing_url;

alter table public.bom_part_revisions
  drop column if exists cad_file_url,
  drop column if exists drawing_url;

-- lineage_id: 같은 파일의 여러 버전을 하나로 묶는 식별자 (교체해도 유지됨).
-- is_current: 해당 lineage에서 가장 최신 버전인지 여부.
create table if not exists public.part_files (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references public.bom_parts (id) on delete cascade,
  lineage_id uuid not null default gen_random_uuid(),
  file_name text not null,
  file_type text not null,
  storage_path text not null,
  file_size bigint not null,
  version integer not null default 1,
  is_current boolean not null default true,
  uploaded_by uuid references public.profiles (id) on delete set null,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists part_files_part_id_idx on public.part_files (part_id);
create index if not exists part_files_lineage_id_idx on public.part_files (lineage_id);

drop trigger if exists set_part_files_updated_at on public.part_files;
create trigger set_part_files_updated_at
before update on public.part_files
for each row
execute function public.set_updated_at();

-- 새 파일 업로드와 "새 버전으로 교체"를 하나의 트랜잭션으로 원자적으로 처리한다.
-- p_replaces_file_id가 있으면: 그 파일을 is_current = false로 내리고, 같은 lineage로 다음 버전을 추가한다.
-- 없으면: 완전히 새로운 파일(lineage)을 만든다.
create or replace function public.upload_part_file(
  p_part_id uuid,
  p_file_name text,
  p_file_type text,
  p_storage_path text,
  p_file_size bigint,
  p_replaces_file_id uuid default null
)
returns public.part_files
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category public.bom_category;
  v_role public.user_role;
  v_old public.part_files;
  v_new public.part_files;
begin
  select public.assembly_category(bp.assembly_id) into v_category
  from public.bom_parts bp
  where bp.id = p_part_id;

  if v_category is null then
    raise exception '부품을 찾을 수 없습니다.';
  end if;

  v_role := public.current_user_role();
  if v_role = 'admin' then
    -- 전체 권한
  elsif v_role = 'leader' then
    if v_category is distinct from public.current_user_bom_category() then
      raise exception '담당 카테고리의 부품에만 파일을 업로드할 수 있습니다.';
    end if;
  else
    raise exception '파일을 업로드할 권한이 없습니다.';
  end if;

  if p_replaces_file_id is not null then
    select * into v_old from public.part_files where id = p_replaces_file_id and part_id = p_part_id for update;
    if not found then
      raise exception '교체할 파일을 찾을 수 없습니다.';
    end if;

    update public.part_files set is_current = false where id = v_old.id;

    insert into public.part_files (
      part_id, lineage_id, file_name, file_type, storage_path, file_size, version, is_current, uploaded_by
    )
    values (
      p_part_id, v_old.lineage_id, p_file_name, p_file_type, p_storage_path, p_file_size, v_old.version + 1, true, auth.uid()
    )
    returning * into v_new;
  else
    insert into public.part_files (
      part_id, file_name, file_type, storage_path, file_size, version, is_current, uploaded_by
    )
    values (
      p_part_id, p_file_name, p_file_type, p_storage_path, p_file_size, 1, true, auth.uid()
    )
    returning * into v_new;
  end if;

  return v_new;
end;
$$;

alter table public.part_files enable row level security;

drop policy if exists "part_files_select_active" on public.part_files;
drop policy if exists "part_files_insert_admin" on public.part_files;
drop policy if exists "part_files_insert_leader_own_category" on public.part_files;
drop policy if exists "part_files_update_admin" on public.part_files;
drop policy if exists "part_files_update_leader_own_category" on public.part_files;
drop policy if exists "part_files_delete_admin" on public.part_files;

create policy "part_files_select_active"
on public.part_files
for select
to authenticated
using (public.current_user_status() = 'active');

create policy "part_files_insert_admin"
on public.part_files
for insert
to authenticated
with check (public.current_user_role() = 'admin');

create policy "part_files_insert_leader_own_category"
on public.part_files
for insert
to authenticated
with check (
  public.current_user_role() = 'leader'
  and exists (
    select 1 from public.bom_parts bp
    where bp.id = part_id and public.assembly_category(bp.assembly_id) = public.current_user_bom_category()
  )
);

create policy "part_files_update_admin"
on public.part_files
for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "part_files_update_leader_own_category"
on public.part_files
for update
to authenticated
using (
  public.current_user_role() = 'leader'
  and exists (
    select 1 from public.bom_parts bp
    where bp.id = part_id and public.assembly_category(bp.assembly_id) = public.current_user_bom_category()
  )
)
with check (
  public.current_user_role() = 'leader'
  and exists (
    select 1 from public.bom_parts bp
    where bp.id = part_id and public.assembly_category(bp.assembly_id) = public.current_user_bom_category()
  )
);

create policy "part_files_delete_admin"
on public.part_files
for delete
to authenticated
using (public.current_user_role() = 'admin');
