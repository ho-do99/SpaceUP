# Frontend API Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run the SpaceUP frontend against the backend on port 8090, clear the reported Vite and React Router audit findings, and connect the documented landlord and contractor flows to real APIs before promoting the verified result to `main`.

**Architecture:** Keep the existing Axios-based `apiRequest` as the only HTTP boundary. Add focused domain API modules that unwrap the common backend envelope and return typed data; pages/providers translate that data into existing view models and expose explicit loading, empty, and error states.

**Tech Stack:** React 18, TypeScript, Axios, React Router 7.18, Vite 6.4.3, Vitest, ESLint, Spring Boot backend on `http://localhost:8090`.

## Global Constraints

- Default backend origin remains exactly `http://localhost:8090`.
- Vite must resolve to `6.4.3`; React Router DOM must resolve to at least `7.18.0`.
- Protected endpoints use `Authorization: Bearer <accessToken>` through `apiRequest`.
- Backend responses use `{ success, message, data }`; unsuccessful or missing data never silently falls back to mock data.
- No credentials, API keys, or tokens are committed.
- Every behavior change uses a failing Vitest test before production code.

---

### Task 1: Secure dependency baseline and test harness

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Create: `frontend/vitest.config.ts`
- Create: `frontend/src/test/setup.ts`
- Test: `frontend/src/api/axiosInstance.test.ts`

**Interfaces:**
- Consumes: existing Vite configuration and React 18 application.
- Produces: `npm test`, Vite `6.4.3`, React Router DOM `7.18.0`, and Vitest with jsdom.

- [ ] **Step 1: Add a failing smoke test**

```ts
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from './axiosInstance'

describe('API client configuration', () => {
  it('uses the current backend port', () => {
    expect(API_BASE_URL).toBe('http://localhost:8090')
  })
})
```

- [ ] **Step 2: Run the test before Vitest exists**

Run: `npm test -- --run src/api/axiosInstance.test.ts`
Expected: FAIL because the `test` script/Vitest is not configured.

- [ ] **Step 3: Install exact compatible dependencies**

Run: `npm install -D vite@6.4.3 vitest@latest jsdom@latest @testing-library/react@latest @testing-library/jest-dom@latest && npm install react-router-dom@7.18.0`

Add scripts `"test": "vitest"` and `"test:run": "vitest run"`. Configure jsdom and `src/test/setup.ts` importing `@testing-library/jest-dom/vitest`.

- [ ] **Step 4: Verify baseline**

Run: `npm run test:run -- src/api/axiosInstance.test.ts && npm run lint && npm run build && npm audit`
Expected: test, lint, and build exit 0; addressed Vite/esbuild/React Router findings are absent.

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vitest.config.ts frontend/src/test/setup.ts frontend/src/api/axiosInstance.test.ts
git commit -m "chore(frontend): upgrade vulnerable build and router dependencies"
```

### Task 2: Common response and error boundary

**Files:**
- Modify: `frontend/src/api/axiosInstance.ts`
- Create: `frontend/src/api/apiResponse.ts`
- Test: `frontend/src/api/apiResponse.test.ts`
- Test: `frontend/src/api/axiosInstance.test.ts`

**Interfaces:**
- Consumes: `ApiResponse<T>` from `frontend/src/types/api.ts`.
- Produces: `unwrapApiResponse<T>(value: unknown, fallbackMessage: string): T` and exported `normalizeRequestUrl(url?: string): string | undefined`.

- [ ] **Step 1: Test successful and malformed envelopes**

```ts
expect(unwrapApiResponse({ success: true, message: 'ok', data: { id: 1 } }, '실패'))
  .toEqual({ id: 1 })
expect(() => unwrapApiResponse({ success: true, message: 'ok', data: null }, '실패'))
  .toThrow('서버 응답 데이터가 없습니다.')
expect(() => unwrapApiResponse({ success: false, message: '거절됨', data: null }, '실패'))
  .toThrow('거절됨')
```

- [ ] **Step 2: Verify RED**

Run: `npm run test:run -- src/api/apiResponse.test.ts`
Expected: FAIL because `unwrapApiResponse` does not exist.

- [ ] **Step 3: Implement the pure envelope helper and export URL normalization**

`unwrapApiResponse` validates object shape, throws `ApiClientError('invalid-response')` for malformed/null successful data, and throws `ApiClientError('business')` using the backend message when `success` is false. `normalizeRequestUrl` keeps external URLs, inserts one leading slash, and collapses `/api/api` to `/api`.

- [ ] **Step 4: Verify GREEN**

Run: `npm run test:run -- src/api/apiResponse.test.ts src/api/axiosInstance.test.ts`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/api/apiResponse.ts frontend/src/api/apiResponse.test.ts frontend/src/api/axiosInstance.ts frontend/src/api/axiosInstance.test.ts
git commit -m "refactor(frontend): standardize backend response handling"
```

### Task 3: Landlord request and analysis APIs

**Files:**
- Create: `frontend/src/types/request.ts`
- Create: `frontend/src/types/analysis.ts`
- Create: `frontend/src/api/requestApi.ts`
- Create: `frontend/src/api/analysisApi.ts`
- Replace: `frontend/src/api/floorPlanApi.ts`
- Test: `frontend/src/api/requestApi.test.ts`
- Test: `frontend/src/api/analysisApi.test.ts`
- Modify: `frontend/src/pages/PropertyInformationPage.tsx`
- Modify: `frontend/src/pages/FloorPlanUploadPage.tsx`
- Modify: `frontend/src/pages/FloorPlanAnalysisLoadingPage.tsx`
- Modify: `frontend/src/pages/SpaceInformationPage.tsx`
- Modify: `frontend/src/pages/HomeValueIncreaseReportPage.tsx`

**Interfaces:**
- Produces: `createRequest(input): Promise<RequestResponse>`, `updateRequest(id,input)`, `attachRequestImage(id,input)`, `getRequestImages(id,type?)`, `getAnalysis(id)`, `scanFloorPlan(id,file)`, `replaceAnalysisSpaces(id,spaces)`, `getRecommendedProducts(id)`.
- Request identifiers persist in `sessionStorage` under `spaceup.activeRequestId` so route transitions share one server-side request.

- [ ] **Step 1: Write failing contract tests**

Mock `apiRequest` and assert `createRequest` calls `POST /api/requests` with `authenticated: true`, `getAnalysis(7)` calls `GET /api/analysis/request/7`, and `replaceAnalysisSpaces` calls `PUT /api/analysis/request/7/spaces` with the complete array.

- [ ] **Step 2: Verify RED**

Run: `npm run test:run -- src/api/requestApi.test.ts src/api/analysisApi.test.ts`
Expected: FAIL because the domain modules are absent.

- [ ] **Step 3: Implement types and domain modules**

Use documented field names: `region`, `propertyType`, `areaM2`, `budgetMin`, `budgetMax`, `desiredDate`, `requestedItems`; analysis fields include `status`, room/bathroom counts, value increase ranges, payback ranges, and total material areas. Every method calls `unwrapApiResponse`.

- [ ] **Step 4: Connect the landlord pages**

Property submission creates the request and stores its ID. Floor-plan upload uses `/api/files/images`, attaches `{imageType:'FLOOR_PLAN', imageUrl}`, then optionally scans it. Loading fetches analysis and routes on `COMPLETED`/`FAILED`. Space confirmation sends the full space list. The value report renders server ranges and an explicit unavailable state for null values.

- [ ] **Step 5: Verify GREEN and build**

Run: `npm run test:run -- src/api/requestApi.test.ts src/api/analysisApi.test.ts && npm run lint && npm run build`
Expected: all commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/types/request.ts frontend/src/types/analysis.ts frontend/src/api/requestApi.ts frontend/src/api/analysisApi.ts frontend/src/api/floorPlanApi.ts frontend/src/api/*.test.ts frontend/src/pages/PropertyInformationPage.tsx frontend/src/pages/FloorPlanUploadPage.tsx frontend/src/pages/FloorPlanAnalysisLoadingPage.tsx frontend/src/pages/SpaceInformationPage.tsx frontend/src/pages/HomeValueIncreaseReportPage.tsx
git commit -m "feat(frontend): connect landlord analysis flow"
```

### Task 4: Contractor request, quote, chat, visit, project, and review APIs

**Files:**
- Replace: `frontend/src/api/contractorApi.ts`
- Replace: `frontend/src/api/estimateApi.ts`
- Create: `frontend/src/api/chatApi.ts`
- Create: `frontend/src/api/visitApi.ts`
- Create: `frontend/src/api/projectApi.ts`
- Create: `frontend/src/api/reviewApi.ts`
- Create: `frontend/src/types/backendContractor.ts`
- Test: `frontend/src/api/contractorFlows.test.ts`

**Interfaces:**
- Produces: `getAssignedRequests`, `approveRequest`, `rejectRequest`, `createQuote`, `submitQuote`, `getChatThreads`, `getChatMessages`, `sendChatMessage`, `getVisit`, `registerVisit`, `completeVisit`, `getContractorProjects`, `getProject`, `updateProjectSchedule`, `startProject`, `requestProjectCompletion`, `getContractorReviews`, and `getReviewSummary`.

- [ ] **Step 1: Write failing endpoint tests**

Assert exact paths including `/api/requests/contractor/me`, `/api/quotes`, `/api/chats/{requestId}/messages`, `/api/visits/request/{requestId}`, `/api/projects/contractor/me`, and `/api/reviews/contractor/{contractorId}`. Assert protected endpoints set `authenticated: true`; review GET endpoints do not require it.

- [ ] **Step 2: Verify RED**

Run: `npm run test:run -- src/api/contractorFlows.test.ts`
Expected: FAIL because the new methods/modules are absent.

- [ ] **Step 3: Implement documented endpoint wrappers**

Remove obsolete `/contractors`, `/estimates`, `/floorplans`, and `/analyses` paths. Preserve backend enums exactly and map no display labels inside API modules.

- [ ] **Step 4: Verify GREEN**

Run: `npm run test:run -- src/api/contractorFlows.test.ts`
Expected: endpoint and envelope tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/api/contractorApi.ts frontend/src/api/estimateApi.ts frontend/src/api/chatApi.ts frontend/src/api/visitApi.ts frontend/src/api/projectApi.ts frontend/src/api/reviewApi.ts frontend/src/api/contractorFlows.test.ts frontend/src/types/backendContractor.ts
git commit -m "feat(frontend): add contractor workflow API clients"
```

### Task 5: Replace contractor portal mock state with server state

**Files:**
- Modify: `frontend/src/components/contractor/ContractorPortalFlowProvider.tsx`
- Modify: `frontend/src/components/contractor/contractorPortalFlowContext.ts`
- Create: `frontend/src/components/contractor/contractorApiMapper.ts`
- Test: `frontend/src/components/contractor/contractorApiMapper.test.ts`
- Modify: contractor request, estimate, chat, visit, project, and review pages under `frontend/src/pages/contractor/`.

**Interfaces:**
- Consumes: Task 4 API response types.
- Produces: existing `ContractorRequest`, `ContractorVisitSchedule`, `ContractorProject`, `ContractorReview`, and chat view models so presentational components do not need wholesale rewrites.

- [ ] **Step 1: Write failing mapper tests**

Provide representative backend request/chat/visit/project/review payloads and assert ID string conversion, `LANDLORD -> customer`, backend status preservation, Korean display labels, ISO date formatting, and nullable field fallbacks such as `'-'`.

- [ ] **Step 2: Verify RED**

Run: `npm run test:run -- src/components/contractor/contractorApiMapper.test.ts`
Expected: FAIL because mapper functions are absent.

- [ ] **Step 3: Implement pure mappers**

Keep API values separate from UI labels. Do not fabricate request/project/review records when the server returns an empty list.

- [ ] **Step 4: Replace provider initialization and actions**

Load server data after authentication; expose `{loading,error,retry}`; wire approve/reject, message send/read, visit actions, quote submit, schedule/project actions, and review loading to Task 4 modules. Disable duplicate submissions while requests are pending.

- [ ] **Step 5: Update pages to render provider states**

List pages render loading, retryable errors, and existing empty-state components. Detail pages render not-found only after loading completes. Forms display `ApiClientError.message` and retain entered values after failure.

- [ ] **Step 6: Verify**

Run: `npm run test:run -- src/components/contractor/contractorApiMapper.test.ts && npm run lint && npm run build`
Expected: tests, lint, and build pass.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/contractor frontend/src/pages/contractor
git commit -m "feat(frontend): connect contractor portal to backend"
```

### Task 6: Notifications, portfolios, settlements, and public contractor views

**Files:**
- Create: `frontend/src/api/notificationApi.ts`
- Create: `frontend/src/api/portfolioApi.ts`
- Create: `frontend/src/api/settlementApi.ts`
- Test: `frontend/src/api/secondaryFlows.test.ts`
- Modify: `frontend/src/pages/NotificationCenterPage.tsx`
- Modify: `frontend/src/pages/ContractorPage.tsx`
- Modify: `frontend/src/pages/ContractorDetailPage.tsx`
- Modify: portfolio and settlement pages under `frontend/src/pages/contractor/`.

**Interfaces:**
- Produces: `getNotifications`, `readNotification`, `readAllNotifications`, portfolio CRUD/visibility methods, `getMySettlements`, public contractor profile and portfolio reads.

- [ ] **Step 1: Write failing endpoint tests**

Assert `/api/notifications/me`, `/api/notifications/{id}/read`, `/api/portfolios/me`, `/api/portfolios/contractor/{id}`, and `/api/settlements/partner/me` with correct authentication.

- [ ] **Step 2: Verify RED**

Run: `npm run test:run -- src/api/secondaryFlows.test.ts`
Expected: FAIL because modules are absent.

- [ ] **Step 3: Implement API modules and page adapters**

Use server data for lists and mutations, preserve existing empty states, resolve relative image URLs through `API_BASE_URL`, and show permission errors for admin-only settlement mutations instead of exposing those actions to contractors.

- [ ] **Step 4: Verify GREEN**

Run: `npm run test:run -- src/api/secondaryFlows.test.ts && npm run lint && npm run build`
Expected: all commands pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/api/notificationApi.ts frontend/src/api/portfolioApi.ts frontend/src/api/settlementApi.ts frontend/src/api/secondaryFlows.test.ts frontend/src/pages/NotificationCenterPage.tsx frontend/src/pages/ContractorPage.tsx frontend/src/pages/ContractorDetailPage.tsx frontend/src/pages/contractor
git commit -m "feat(frontend): connect secondary account flows"
```

### Task 7: Release verification and branch promotion

**Files:**
- Modify only files required by discovered verification failures, with a failing regression test before each code fix.

**Interfaces:**
- Consumes: completed frontend branch.
- Produces: synchronized `origin/frontend`, `origin/develop`, `origin/main`, and local `main` checkout.

- [ ] **Step 1: Verify frontend from a clean dependency install**

Run: `npm ci && npm run test:run && npm run lint && npm run build && npm audit`
Expected: exit 0 and no addressed audit findings.

- [ ] **Step 2: Push frontend**

Run: `git push origin frontend:frontend` after fetching and confirming no remote divergence.

- [ ] **Step 3: Merge and verify develop**

Switch to `develop`, fast-forward from `origin/develop`, merge `frontend` with a merge commit, then run frontend verification plus `backend/gradlew.bat test --no-daemon`. Confirm all source branches are ancestors and no conflict markers remain.

- [ ] **Step 4: Push develop**

Run: `git push origin develop:develop` only after Step 3 succeeds.

- [ ] **Step 5: Merge and verify main**

Switch to `main`, fast-forward from `origin/main`, merge `develop` with a merge commit, rerun frontend tests/lint/build/audit and backend tests.

- [ ] **Step 6: Push main and leave local checkout synchronized**

Run: `git push origin main:main`, fetch, verify local `main == origin/main`, and confirm `git status --porcelain` is empty in `C:\Users\SMHRD\Desktop\SpaceUP`.

