# CLAUDE.md

## Project Goal

이 프로젝트는 Formula SAE 팀을 위한 ERP 웹사이트이다.

코드는 실제 운영 가능한 수준으로 작성한다.

항상 유지보수성과 확장성을 우선한다.

---

## Development Rules

항상

- PRD.md를 먼저 읽는다.
- 요구사항이 모호하면 질문한다.
- 임의로 기능을 추가하지 않는다.
- 기능은 작은 단위로 구현한다.
- 중복 코드를 만들지 않는다.
- 읽기 쉬운 코드를 작성한다.

---

## Tech Stack

Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend
- Supabase

Database
- PostgreSQL

Deploy
- Vercel

---

## Folder Structure

src/

app/
components/
features/
hooks/
lib/
types/
services/
utils/

---

## Coding Rules

- TypeScript strict mode
- Functional Component 사용
- Async/Await 사용
- any 사용 금지
- 재사용 가능한 컴포넌트 작성

---

## Database Rules

모든 테이블에는

- id
- created_at
- updated_at

컬럼을 포함한다.

UUID를 Primary Key로 사용한다.

---

## Authentication

Role

- Admin
- Leader
- Member

로그인이 필요한 페이지는 반드시 보호한다.

권한을 항상 확인한다.

---

## UI Rules

디자인은

- 깔끔한 ERP 스타일
- Desktop First
- 반응형
- Dark Mode 지원

Sidebar와 Header를 기본 레이아웃으로 사용한다.

---

## Development Order

Version 1

1. 프로젝트 생성
2. 로그인
3. Dashboard
4. Team Management

Version 2

5. Inventory
6. BOM
7. Purchasing

Version 3

8. Manufacturing
9. Expense
10. Vehicle Revision

Version 4

11. Testing
12. Competition

---

## Before Every Task

항상

1. 현재 프로젝트 구조를 확인한다.
2. PRD를 확인한다.
3. 기존 코드를 분석한다.
4. 필요한 파일만 수정한다.
5. 불필요한 리팩토링을 하지 않는다.

---

## Response Rules

기능을 구현하기 전에

- 구현 방법을 설명한다.
- 필요한 파일을 설명한다.
- 완료 후 변경사항을 요약한다.