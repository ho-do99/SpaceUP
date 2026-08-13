# Login Role Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 선택한 사용자/시공사 유형과 실제 계정 역할이 다르면 로그인을 차단하고 로그인 화면의 관리자 문구를 제거한다.

**Architecture:** 기존 로그인 API가 반환하는 신뢰 가능한 `role`을 화면의 `loginRole`과 세션 저장 전에 비교한다. 역할이 일치할 때만 기존 세션 저장과 역할별 이동을 수행하고, 불일치는 로그인 화면 오류로 처리한다.

**Tech Stack:** React 19, TypeScript, React Router, Vitest, Testing Library

## Global Constraints

- 로그인 API 요청·응답 계약은 변경하지 않는다.
- 역할 불일치 토큰은 세션에 저장하지 않는다.
- 관리자 백엔드 역할은 삭제하지 않고 로그인 화면의 문구만 제거한다.
- `ai`에서 검증 후 `main`, `develop`, `frontend`, `backend`, `infra`를 Fast-forward 동기화한다.
- 강제 푸시는 사용하지 않는다.

---

### Task 1: 로그인 화면 역할 검증 회귀 테스트

**Files:**
- Create: `frontend/src/pages/LoginPage.test.tsx`
- Modify: `frontend/src/pages/LoginPage.tsx`

**Interfaces:**
- Consumes: `login(request, signal): Promise<LoginResponse>`, `saveAuthSession(LoginResponse)`
- Produces: 선택 역할과 응답 역할이 일치할 때만 세션 저장·이동하는 `LoginPage`

- [ ] **Step 1: 역할 불일치와 관리자 문구 회귀 테스트 작성**

`LoginPage.test.tsx`에서 `login`을 모킹하고 MemoryRouter로 화면을 렌더링한다. 사용자 선택에 `CONTRACTOR` 응답, 시공사 선택에 `LANDLORD` 응답을 각각 반환해 오류 문구, 세션 미저장, 대상 경로 미이동을 검증한다. 또한 `관리자 로그인` 문구가 없음을 검증한다.

- [ ] **Step 2: RED 확인**

Run: `npm run test:run -- src/pages/LoginPage.test.tsx`

Expected: 현재 화면이 역할 불일치 응답도 저장·이동하고 `관리자 로그인`을 렌더링하므로 실패한다.

- [ ] **Step 3: 최소 구현**

`LoginPage.tsx`에서 `loginResponse.role !== loginRole`이면 `선택한 로그인 유형과 계정 유형이 일치하지 않습니다.`를 설정하고 반환한다. 이 검사는 `saveAuthSession`보다 먼저 수행한다. 역할 라디오 변경 시 기존 역할 오류를 지운다. 화면 하단 관리자 문구 요소를 삭제한다.

- [ ] **Step 4: GREEN 확인**

Run: `npm run test:run -- src/pages/LoginPage.test.tsx`

Expected: 모든 로그인 화면 테스트가 통과한다.

- [ ] **Step 5: 정상 역할 회귀 테스트 보강**

사용자 응답은 `/`, 시공사 응답은 `/contractor`로 이동하고 세션에 실제 토큰·역할이 저장되는지 검증한다.

- [ ] **Step 6: 관련 테스트 재실행**

Run: `npm run test:run -- src/pages/LoginPage.test.tsx src/api/authApi.test.ts`

Expected: 두 테스트 파일이 모두 통과한다.

- [ ] **Step 7: 구현 커밋**

```powershell
git add -- frontend/src/pages/LoginPage.tsx frontend/src/pages/LoginPage.test.tsx
git commit -m "fix(frontend): enforce selected login role"
```

### Task 2: 전체 검증 및 브랜치 동기화

**Files:**
- Modify: `docs/2026-08-13_로그인유형검증_브랜치동기화_안내.md`

**Interfaces:**
- Consumes: Task 1의 검증된 `ai` 커밋
- Produces: 팀 공유 문서와 동일 SHA의 원격 브랜치 6개

- [ ] **Step 1: 전체 프론트 검증**

Run: `npm run test:run`, `npm run lint`, `npm run build`

Expected: 모든 명령이 exit code 0으로 끝난다.

- [ ] **Step 2: 백엔드 회귀 검증**

Run: `backend\\gradlew.bat test`

Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 3: 팀 공유 문서 작성 및 커밋**

역할 불일치 차단 방식, 관리자 문구 제거, 테스트 결과, 팀원 로컬 갱신 명령을 문서화하고 커밋한다.

- [ ] **Step 4: 원격 최신 상태와 Fast-forward 가능 여부 확인**

`git fetch origin --prune` 후 `ai`, `main`, `develop`, `frontend`, `backend`, `infra`가 대상 커밋으로 강제 푸시 없이 이동 가능한지 merge-base로 확인한다.

- [ ] **Step 5: ai와 main 푸시**

먼저 `ai`를 푸시하고 CI/원격 상태를 확인한 뒤 같은 커밋을 `main`에 Fast-forward 푸시한다.

- [ ] **Step 6: 팀 브랜치 원격 동기화**

`develop`, `frontend`, `backend`, `infra`를 같은 커밋으로 atomic Fast-forward 푸시한다.

- [ ] **Step 7: 원격 SHA와 CI 확인**

6개 브랜치 SHA가 모두 같은지 확인하고 트리거된 GitHub Actions가 성공할 때까지 확인한다.
