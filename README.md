# SKID

Formula SAE 팀을 위한 ERP. 현재 마일스톤은 프로젝트 기반 구축 + 로그인/권한 시스템입니다.

## Tech Stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Supabase (Auth + Postgres)

## 시작하기

### 1. 의존성 설치

```bash
pnpm install
```

### 2. Supabase 준비

로컬 개발(Docker 필요):

```bash
pnpm supabase:start
```

명령이 끝나면 출력되는 `API URL`, `anon key`를 아래 `.env.local`에 채워 넣습니다.

원격(Hosted) 프로젝트를 사용한다면 Supabase Dashboard > Project Settings > API 값을 사용하고,
`supabase/migrations`의 SQL을 Supabase Studio SQL Editor에서 실행하거나 `supabase link` 후 `supabase db push`로 적용하세요.

```bash
cp .env.local.example .env.local
```

### 3. 개발 서버 실행

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000) 접속 시 미인증 상태면 `/login`으로, 인증 상태면 `/dashboard`로 이동합니다.

## 인증/권한

- 이메일/비밀번호 회원가입 및 로그인 (Supabase Auth)
- 신규 가입자는 `profiles` 테이블에 자동 생성되며 기본 role은 `member`
- Role: `admin` / `leader` / `member` (`src/lib/auth/roles.ts`)
- `middleware.ts`가 `/dashboard/**`를 비로그인 접근으로부터 보호하고, 로그인 상태에서 `/login`, `/signup` 접근 시 `/dashboard`로 리다이렉트합니다.
- 서버 컴포넌트에서는 `requireUser()` / `requireRole(minimum)` (`src/lib/auth/require-user.ts`)으로 한 번 더 방어적으로 권한을 확인합니다.

## 폴더 구조

```
src/
  app/            라우트 (App Router)
  components/     공용/레이아웃/UI 컴포넌트
  features/       기능 단위 로직 (예: features/auth)
  hooks/          커스텀 훅
  lib/            Supabase 클라이언트, 인증 헬퍼 등
  services/       Supabase 데이터 조회 계층
  types/          공용 타입, DB 타입
supabase/
  migrations/     Postgres 스키마 마이그레이션
```

## 유용한 스크립트

| 명령 | 설명 |
| --- | --- |
| `pnpm dev` | 개발 서버 실행 |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm lint` | ESLint 검사 |
| `pnpm supabase:start` / `supabase:stop` | 로컬 Supabase 스택 시작/종료 (Docker 필요) |
| `pnpm supabase:reset` | 로컬 DB를 migrations 기준으로 재생성 |
| `pnpm supabase:types` | 로컬 DB 스키마로부터 TypeScript 타입 재생성 |
