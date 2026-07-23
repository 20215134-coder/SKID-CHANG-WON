-- FSAE ERP: 인증/권한 기반 스키마 (profiles + role)

create type public.user_role as enum ('admin', 'leader', 'member');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role public.user_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- 신규 가입(auth.users insert) 시 profiles 행을 자동 생성한다. 기본 role은 member.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- RLS 정책에서 재귀 없이 현재 사용자의 role을 조회하기 위한 helper.
create function public.current_user_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

alter table public.profiles enable row level security;

-- 팀원 누구나 팀 현황 확인을 위해 전체 프로필을 조회할 수 있다.
create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

-- role 변경은 Admin만 가능하다.
create policy "profiles_update_admin_only"
on public.profiles
for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');
