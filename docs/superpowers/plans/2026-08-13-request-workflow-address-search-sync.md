# 요청 흐름·주소 검색·브랜치 동기화 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans and superpowers:test-driven-development. 각 동작은 실패 테스트 확인 후 최소 구현한다.

**Goal:** 중복 분석 409, 비활성 시공사 로그아웃, 평면도 카탈로그에 종속된 주소 검색을 수정하고 검증된 결과를 팀 브랜치에 동기화한다.

**Architecture:** 요청 생성과 분석 작업 생성을 분리하고 분석 작업은 멱등적으로 만든다. Kakao 공식 주소 선택 후 SpaceUP 카탈로그를 후속 매칭한다. 로그아웃 UI와 세션 제거를 공유 컴포넌트로 통일한다.

**Tech Stack:** Java 21, Spring Boot, JPA, JUnit 5, React 19, TypeScript, Vitest, React Testing Library

### Task 1: 분석 작업 멱등성

**Files:**
- Modify: `backend/src/main/java/com/spaceup/domain/request/controller/RequestController.java`
- Modify: `backend/src/main/java/com/spaceup/domain/analysis/service/AnalysisJobService.java`
- Modify: `backend/src/main/java/com/spaceup/domain/request/repository/QuoteRequestRepository.java`
- Create: `backend/src/test/java/com/spaceup/domain/request/controller/RequestCreateControllerTest.java`
- Create: `backend/src/test/java/com/spaceup/domain/analysis/service/AnalysisJobServiceIdempotencyTest.java`

- [ ] 의뢰 생성 시 분석 서비스 미호출 테스트 RED
- [ ] 기존 분석 작업 ID 반환 테스트 RED
- [ ] 의뢰 행 잠금 조회와 기존 작업 반환 구현
- [ ] 대상 테스트 GREEN

### Task 2: 시공사 로그아웃

**Files:**
- Create: `frontend/src/components/contractor/ContractorLogoutDialog.tsx`
- Modify: `frontend/src/pages/contractor/ContractorAccountSettingsPage.tsx`
- Modify: `frontend/src/pages/contractor/ContractorSettingsPage.tsx`
- Create: `frontend/src/pages/contractor/ContractorAccountSettingsPage.test.tsx`
- Modify: `frontend/src/pages/contractor/ContractorSettingsPage.test.tsx`

- [ ] 계정설정 로그아웃 활성화·취소·확인 테스트 RED
- [ ] 공용 다이얼로그 추출 및 양쪽 화면 연결
- [ ] 인증·요청 흐름 세션 제거 테스트 GREEN

### Task 3: 공식 주소 검색 후 평면도 매칭

**Files:**
- Modify: `frontend/src/utils/daumPostcode.ts`
- Modify: `frontend/src/utils/daumPostcode.test.ts`
- Modify: `frontend/src/pages/ApartmentAddressSearchPage.tsx`
- Modify: `frontend/src/pages/ApartmentAddressSearchPage.test.tsx`

- [ ] 검색어와 구조화 주소 결과 테스트 RED
- [ ] 키 없는 Kakao 주소 선택 API 확장
- [ ] 등록 평면도 있음/없음 컴포넌트 테스트 RED
- [ ] 선택 주소 유지와 카탈로그 후속 매칭 구현
- [ ] 대상 테스트 GREEN

### Task 4: 공유 문서와 전체 검증

**Files:**
- Create: `docs/2026-08-13_요청흐름_로그아웃_주소검색_브랜치동기화_안내.md`

- [ ] 변경 내용, API 계약, 팀원 확인 항목 기록
- [ ] `backend\\gradlew.bat -p backend test`
- [ ] `npm --prefix frontend run test:run`
- [ ] `npm --prefix frontend run lint`
- [ ] `npm --prefix frontend run build`
- [ ] `git diff --check`

### Task 5: 안전한 Git 통합

- [ ] 변경을 기능 단위 커밋
- [ ] `ai` 푸시
- [ ] 원격 재-fetch 및 fast-forward 가능성 검사
- [ ] `main` 통합 후 전체 검증·푸시
- [ ] 팀 브랜치 fast-forward 푸시
- [ ] 최종 원격 SHA 목록 기록

