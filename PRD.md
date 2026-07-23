# SKID - Product Requirements Document

## Project Overview

Formula SAE(FSAE) 자작자동차 팀을 위한 ERP 웹사이트를 개발한다.

현재 Notion, Excel, Google Drive 등으로 분산되어 있는 정보를 하나의 웹사이트에서 관리할 수 있도록 한다.

목표는 팀원 관리, 부품 관리, 일정 관리, 구매 관리 등을 하나의 시스템으로 통합하는 것이다.

---

# MVP (Version 1)

이번 버전에서는 ERP의 기본 구조만 개발한다.

## Authentication

목적
- 로그인 시스템 구축

기능
- 로그인
- 로그아웃
- 권한 관리(Admin, Leader, Member)

---

## Dashboard

목적
로그인 후 메인 화면 제공

기능
- 환영 메시지
- 최근 공지
- 팀 현황
- 추후 기능을 위한 카드 UI

---

## Team Management

목적
팀원 정보 관리

데이터
- 이름
- 학번
- 파트
- 직책
- 연락처
- 가입일

기능
- 조회
- 추가
- 수정
- 삭제

---

# Future Features

## Inventory
- 재고관리
- 입출고
- QR 코드
- 최소 재고 알림

## BOM
- 차량 부품 관리
- Part Number
- Revision
- CAD 파일
- Drawing

## Purchasing
- 구매 요청
- 승인 시스템
- 구매 이력

## Manufacturing
- 제작 진행률
- 작업 상태
- 담당자

## Expense
- 예산
- 사용금액
- 영수증

## Vehicle Revision
- 차량 버전 관리
- 변경 이력

## Testing
- Brake Test
- Skidpad
- Acceleration
- Endurance

## Competition
- SES
- Cost Report
- Design Report
- 제출 현황

---

## Non-functional Requirements

- 빠른 속도
- 반응형 웹
- 직관적인 UI
- 유지보수가 쉬운 구조
- 확장 가능한 구조