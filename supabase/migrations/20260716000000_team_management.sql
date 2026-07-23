-- FSAE ERP: Team Management (profiles 확장 + 승인 플로우 + 부서 기반 권한)
-- 재실행해도 안전하도록(idempotent) 작성함.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'member_status') then
    create type public.member_status as enum ('pending', 'active', 'inactive');
  end if;
end $$;

alter table public.profiles
  add column if not exists student_id text,
  add column if not exists phone text,
  add column if not exists department text,
  add column if not exists joined_at date not null default current_date,
  add column if not exists status public.member_status not null default 'pending';

create unique index if not exists profiles_student_id_key on public.profiles (student_id) where student_id is not null;

-- 신규 가입 시 프로필에 학번/부서/연락처도 함께 채우고, 기본 상태는 승인 대기(pending)로 시작한다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, student_id, department, phone)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'student_id',
    new.raw_user_meta_data ->> 'department',
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

-- 현재 로그인 사용자의 department/status를 RLS 재귀 없이 조회하기 위한 helper.
create or replace function public.current_user_department()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select department from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_status()
returns public.member_status
language sql
security definer
set search_path = public
stable
as $$
  select status from public.profiles where id = auth.uid();
$$;

-- role / department / status / email 변경은 Admin만 허용한다 (Leader의 컬럼 단위 권한 제한).
create or replace function public.enforce_profile_update_permissions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid()가 없다는 것은 Supabase Auth 세션 없이 실행됐다는 뜻이다(SQL Editor, 마이그레이션 등).
  -- 이 경우는 신뢰할 수 있는 관리 작업으로 간주하고 통과시킨다.
  if auth.uid() is null or public.current_user_role() = 'admin' then
    return new;
  end if;

  if new.role is distinct from old.role
    or new.status is distinct from old.status
    or new.department is distinct from old.department
    or new.email is distinct from old.email then
    raise exception '이 항목은 관리자만 수정할 수 있습니다.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_profile_update_permissions on public.profiles;

create trigger enforce_profile_update_permissions
before update on public.profiles
for each row
execute function public.enforce_profile_update_permissions();

-- 팀 전체 명단 조회는 승인된(active) 사용자만 가능하고, 그 외에는 본인 행만 볼 수 있다.
drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_active_roster" on public.profiles;
drop policy if exists "profiles_update_leader_own_department" on public.profiles;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles_select_active_roster"
on public.profiles
for select
to authenticated
using (public.current_user_status() = 'active');

-- Leader는 본인 부서 팀원의 행을 수정할 수 있다 (컬럼 단위 제한은 위 trigger가 담당).
create policy "profiles_update_leader_own_department"
on public.profiles
for update
to authenticated
using (
  public.current_user_role() = 'leader'
  and department = public.current_user_department()
)
with check (
  public.current_user_role() = 'leader'
  and department = public.current_user_department()
);
