# Contractor Live Demo Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock data with persisted API data across the contractor demo journey from assigned request through quote submission, while making request approval idempotent.

**Architecture:** Numeric request and quote route parameters select the live-data path; nonnumeric `REQ-*` and `SP-*` routes retain the design mock path. Existing APIs are composed through focused hooks and adapters so pages consume stable contractor view models without importing mocks for live records. Backend approval returns whether a real state transition happened so repeat requests cannot repeat notifications or activity updates.

**Tech Stack:** React 19, TypeScript, React Router, Vitest/Testing Library, Axios wrapper, Spring Boot 4, Java 21, JPA, JUnit 5, Mockito

**Spec:** `docs/superpowers/specs/2026-08-19-contractor-live-demo-flow-design.md`

## Global Constraints

- Work starts on the latest `frontend` branch.
- Positive integer route IDs use API data only; API errors or missing records never fall back to `contractorPortalMockData`.
- Nonnumeric design routes retain their current mock behavior.
- Display user nicknames from `RequestResponse.landlordName` or `ChatThread.counterpartName`; never synthesize names such as `99번` or `100번`.
- Do not hardcode the attached demo credentials or company names.
- Write and observe a failing test before each production change.
- Do not force-push. Merge `frontend` into `develop`, verify, then merge `develop` into `main` and verify CI.

---

### Task 1: Preserve live participation state and remove image mock fallback

**Files:**
- Modify: `frontend/src/types/contractorPortal.ts`
- Modify: `frontend/src/utils/contractorRequestAdapter.ts`
- Modify: `frontend/src/utils/contractorRequestAdapter.test.ts`
- Modify: `frontend/src/hooks/useContractorRequest.ts`

**Interfaces:**
- Consumes: `RequestResponse.participationStatus`, `RequestImageResponse[]`, `AnalysisJobResponse`
- Produces: `ContractorRequest.participationStatus?: RequestContractorStatus`, `ContractorRequestDetail.floorPlanImage?: string`, `ContractorRequestDetail.hasLinkedFloorPlan: boolean`

- [ ] **Step 1: Write failing adapter tests for nickname, participation state, and no live image fallback**

```ts
it('preserves the landlord nickname and participation status', () => {
  const result = requestToContractorCard({ ...requestFixture, id: 99, landlordName: '시연 임대인', participationStatus: 'APPROVED' })
  expect(result.customerName).toBe('시연 임대인')
  expect(result.participationStatus).toBe('APPROVED')
})

it('does not inject the bundled floor plan when a live request has no image', () => {
  const result = requestToContractorDetail({ ...requestFixture, floorPlanVariantId: null }, [], null)
  expect(result.floorPlanImage).toBeUndefined()
  expect(result.hasLinkedFloorPlan).toBe(false)
})
```

- [ ] **Step 2: Run the focused adapter tests and verify RED**

Run: `npm run test:run -- src/utils/contractorRequestAdapter.test.ts`

Expected: FAIL because participation state is discarded and `floorPlanFallback` is returned.

- [ ] **Step 3: Extend the contractor view model and adapter**

```ts
export type RequestContractorStatus = 'INVITED' | 'APPROVED' | 'REJECTED' | 'SELECTED' | 'CLOSED'

export interface ContractorRequest {
  // existing fields
  participationStatus?: RequestContractorStatus
}
```

Set `participationStatus: request.participationStatus` in `requestToContractorCard`. Remove `floorPlanFallback` from the live adapter and return `floorPlanImage: linkedFloorPlanImage` with `hasLinkedFloorPlan: Boolean(linkedFloorPlanImage)`.

- [ ] **Step 4: Make `useContractorRequest` initialize mocks only for nonnumeric IDs**

```ts
const liveId = Boolean(requestId && /^\d+$/.test(requestId))
const [request, setRequest] = useState<ContractorRequestDetail | null>(
  () => liveId ? null : findContractorRequestDetail(requestId) ?? null,
)
```

- [ ] **Step 5: Run focused tests and commit**

Run: `npm run test:run -- src/utils/contractorRequestAdapter.test.ts`

```bash
git add frontend/src/types/contractorPortal.ts frontend/src/utils/contractorRequestAdapter.ts frontend/src/utils/contractorRequestAdapter.test.ts frontend/src/hooks/useContractorRequest.ts
git commit -m "fix(frontend): preserve live contractor request data"
```

### Task 2: Make request approval idempotent end to end

**Files:**
- Modify: `backend/src/main/java/com/spaceup/domain/request/entity/RequestContractor.java`
- Modify: `backend/src/main/java/com/spaceup/domain/request/service/RequestService.java`
- Modify: `backend/src/test/java/com/spaceup/domain/request/service/RequestServiceMultiContractorTest.java`
- Modify: `frontend/src/pages/contractor/ContractorRequestDetailPage.tsx`
- Modify: `frontend/src/pages/contractor/ContractorRequestAnalysisPage.tsx`
- Modify: `frontend/src/components/contractor/ContractorRequestActions.tsx`
- Create: `frontend/src/pages/contractor/ContractorRequestDetailPage.test.tsx`

**Interfaces:**
- Produces: `RequestContractor.approve(): boolean`; `true` only for `INVITED → APPROVED`
- Consumes: `ContractorRequest.participationStatus`

- [ ] **Step 1: Write a failing backend test proving repeat approval has no side effects**

```java
@Test
void repeatedApprovalDoesNotNotifyOrTouchTheRequestAgain() {
    RequestContractor participation = approvedParticipation();
    RequestStatus statusBefore = request.getStatus();
    LocalDateTime activityBefore = request.getLastActivityAt();
    when(quoteRequestRepository.findById(1L)).thenReturn(Optional.of(request));
    when(requestContractorRepository.findByRequestIdAndContractorId(1L, 20L))
            .thenReturn(Optional.of(participation));

    service.approve(1L, 20L);

    verify(notificationService, never()).notify(anyLong(), any(), anyString(), anyString());
    assertEquals(statusBefore, request.getStatus());
    assertEquals(activityBefore, request.getLastActivityAt());
}
```

Use a real `QuoteRequest` fixture and assert its `lastActivityAt` and status are unchanged rather than mocking entity getters.

- [ ] **Step 2: Run the focused backend test and verify RED**

Run: `./gradlew test --tests '*RequestServiceMultiContractorTest*' --no-daemon`

Expected: FAIL because `RequestService.approve` still touches and notifies after the entity no-op.

- [ ] **Step 3: Return transition status from the entity and short-circuit service side effects**

```java
public boolean approve() {
    if (status == RequestContractorStatus.APPROVED || status == RequestContractorStatus.SELECTED) {
        return false;
    }
    validateStatus(RequestContractorStatus.INVITED);
    status = RequestContractorStatus.APPROVED;
    return true;
}
```

```java
if (!participation.approve()) {
    return;
}
request.markQuoteRequested();
request.touch();
notificationService.notify(request.getOwner().getId(), NotificationType.REQUEST,
        "의뢰가 승인되었습니다",
        String.format("%s 의뢰를 시공사가 승인했습니다. 견적을 확인해 주세요.", request.getRequestCode()));
```

- [ ] **Step 4: Write a failing frontend test for approved requests**

```tsx
it('does not offer approval again after the participation is approved', async () => {
  getRequestMock.mockResolvedValue({ ...requestFixture, participationStatus: 'APPROVED', landlordName: '시연 임대인' })
  renderRequestDetail('/contractor/requests/99')
  expect(await screen.findByText('시연 임대인')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: '의뢰 승인' })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: /채팅/ })).toHaveAttribute('href', '/contractor/requests/99/chat')
})
```

- [ ] **Step 5: Render actions by participation state and lock the pending action**

Only `INVITED` renders approve/reject controls. `APPROVED` and `SELECTED` render a chat continuation link. Add an `isSubmitting` state shared by approve/reject handlers and pass it through `ContractorRequestActions.disabled`.

- [ ] **Step 6: Run focused backend/frontend tests and commit**

Run: `./gradlew test --tests '*RequestServiceMultiContractorTest*' --no-daemon`

Run: `npm run test:run -- src/pages/contractor/ContractorRequestDetailPage.test.tsx`

```bash
git add backend/src/main/java/com/spaceup/domain/request backend/src/test/java/com/spaceup/domain/request/service/RequestServiceMultiContractorTest.java frontend/src/pages/contractor/ContractorRequestDetailPage.tsx frontend/src/pages/contractor/ContractorRequestAnalysisPage.tsx frontend/src/components/contractor/ContractorRequestActions.tsx frontend/src/pages/contractor/ContractorRequestDetailPage.test.tsx
git commit -m "fix: make contractor request approval idempotent"
```

### Task 3: Activate the live contractor chat continuation flow

**Files:**
- Modify: `frontend/src/pages/contractor/ContractorChatPage.tsx`
- Modify: `frontend/src/pages/contractor/ContractorChatListPage.tsx`
- Create: `frontend/src/pages/contractor/ContractorChatPage.test.tsx`
- Create: `frontend/src/pages/contractor/ContractorChatListPage.test.tsx`

**Interfaces:**
- Consumes: `ChatThread.contactable`, `ChatThread.counterpartName`, `ChatThread.requestCode`, `useContractorRequest`
- Produces: live visit link `/contractor/requests/{requestId}/visit`

- [ ] **Step 1: Write failing chat page tests**

```tsx
it('enables messages and visit scheduling for a contactable live thread', async () => {
  getChatThreadsMock.mockResolvedValue([{ ...threadFixture, requestId: 99, counterpartName: '시연 임대인', contactable: true }])
  renderChat('/contractor/requests/99/chat')
  expect(await screen.findByRole('heading', { name: '시연 임대인 사용자' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: '현장 방문 일정 잡기' })).toHaveAttribute('href', '/contractor/requests/99/visit')
  expect(screen.getByRole('textbox')).toBeEnabled()
})

it('keeps a closed thread readable but disables sending', async () => {
  getChatThreadsMock.mockResolvedValue([{ ...threadFixture, contactable: false }])
  renderChat('/contractor/requests/99/chat')
  expect(await screen.findByRole('textbox')).toBeDisabled()
})
```

- [ ] **Step 2: Run chat tests and verify RED**

Run: `npm run test:run -- src/pages/contractor/ContractorChatPage.test.tsx src/pages/contractor/ContractorChatListPage.test.tsx`

Expected: FAIL because live routes hide the visit controls.

- [ ] **Step 3: Use live request/thread data for header and actions**

Load `useContractorRequest(requestId)` in `ContractorChatPage`. Build paths from the route `requestId`, not `request?.requestId`. Always render the visit action for a loaded live thread; render quote action when the API visit status is `COMPLETED`. Keep composer enablement strictly `liveThread?.contactable === true`.

- [ ] **Step 4: Verify list cards use nickname and remain clickable for readable closed rooms**

Map `customerName: thread.counterpartName`. A closed thread still gets the normal chat URL and the page disables only the composer; it is not removed or disabled from history.

- [ ] **Step 5: Run focused tests and commit**

```bash
npm run test:run -- src/pages/contractor/ContractorChatPage.test.tsx src/pages/contractor/ContractorChatListPage.test.tsx
git add frontend/src/pages/contractor/ContractorChatPage.tsx frontend/src/pages/contractor/ContractorChatListPage.tsx frontend/src/pages/contractor/ContractorChatPage.test.tsx frontend/src/pages/contractor/ContractorChatListPage.test.tsx
git commit -m "feat(frontend): activate live contractor chat flow"
```

### Task 4: Replace visit company and schedule mocks with API data

**Files:**
- Modify: `frontend/src/types/backendContractor.ts`
- Modify: `frontend/src/pages/UserVisitSchedulePage.tsx`
- Create: `frontend/src/pages/UserVisitSchedulePage.test.tsx`
- Modify: `frontend/src/pages/contractor/ContractorVisitPage.tsx`
- Create: `frontend/src/pages/contractor/ContractorVisitPage.test.tsx`

**Interfaces:**
- Consumes: `getContractor(contractorId)`, `getVisit(requestId)`, `useContractorRequest(requestId)`
- Produces: `SiteVisit.contractorId: number`; company card from `ContractorProfile`

- [ ] **Step 1: Write failing landlord visit tests**

```tsx
it('shows the selected contractor profile instead of the bundled company text', async () => {
  getContractorMock.mockResolvedValue({ memberId: 1, companyName: '1204디자인 전남광주점 (시연용)', activityRegions: '광주', specialties: '리모델링', availableForConsult: true })
  renderVisit('/mypage/requests/99/visit/1')
  expect(await screen.findByText('1204디자인 전남광주점 (시연용)')).toBeInTheDocument()
  expect(screen.queryByText('공간디자인 인테리어')).not.toBeInTheDocument()
})

it('does not report success through session storage when no server visit exists', async () => {
  getVisitMock.mockRejectedValue(notFoundError)
  renderVisit('/mypage/requests/99/visit/1')
  expect(await screen.findByText(/채팅에서 시공사와 일정을 먼저 협의/)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: '방문 일정 요청하기' })).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Write failing contractor visit tests**

```tsx
it('shows an empty live schedule without injecting the default July visit', async () => {
  getVisitMock.mockRejectedValue(notFoundError)
  renderContractorVisit('/contractor/requests/99/visit')
  expect(await screen.findByText('등록된 방문 일정이 없습니다.')).toBeInTheDocument()
  expect(screen.queryByText('2026.07.24')).not.toBeInTheDocument()
})
```

- [ ] **Step 3: Run both page tests and verify RED**

Run: `npm run test:run -- src/pages/UserVisitSchedulePage.test.tsx src/pages/contractor/ContractorVisitPage.test.tsx`

- [ ] **Step 4: Implement landlord company loading and honest no-visit state**

Load contractor profile and visit independently. Render `companyName ?? memberName`, `activityRegions`, `specialties`, and `availableForConsult`. Delete the `sessionStorage.setItem` fallback; if the visit lookup is not found, show the chat-first instruction and return link.

- [ ] **Step 5: Implement contractor schedule solely from `SiteVisit` for live IDs**

For live IDs, calculate status and schedule only from `liveVisit`; do not read `contractorDefaultVisitSchedule`, `findContractorProjectByRequestId`, or portal flow state. Retain those values only in the explicit nonnumeric mock branch.

- [ ] **Step 6: Run focused tests and commit**

```bash
npm run test:run -- src/pages/UserVisitSchedulePage.test.tsx src/pages/contractor/ContractorVisitPage.test.tsx
git add frontend/src/types/backendContractor.ts frontend/src/pages/UserVisitSchedulePage.tsx frontend/src/pages/UserVisitSchedulePage.test.tsx frontend/src/pages/contractor/ContractorVisitPage.tsx frontend/src/pages/contractor/ContractorVisitPage.test.tsx
git commit -m "feat(frontend): connect live visit scheduling data"
```

### Task 5: Show only user-owned floor plans and photos on live requests

**Files:**
- Modify: `frontend/src/pages/contractor/ContractorRequestFloorPlanPage.tsx`
- Modify: `frontend/src/pages/contractor/ContractorRequestPhotosPage.tsx`
- Modify: `frontend/src/components/contractor/ContractorRequestDetailLayout.tsx`
- Create: `frontend/src/pages/contractor/ContractorRequestMediaPages.test.tsx`

**Interfaces:**
- Consumes: `ContractorRequestDetail.floorPlanImage`, `hasLinkedFloorPlan`, `photos`, `beforeImage`, `afterImage`
- Produces: explicit live empty states

- [ ] **Step 1: Write failing media tests**

```tsx
it('renders the uploaded user floor plan on a live request', async () => {
  getRequestImagesMock.mockResolvedValue([{ id: 7, imageType: 'FLOOR_PLAN', imageUrl: '/api/files/images/user-plan.png', sortOrder: 0 }])
  renderMedia('/contractor/requests/99/floor-plan')
  expect(await screen.findByRole('img', { name: /평면도/ })).toHaveAttribute('src', expect.stringContaining('/api/files/images/user-plan.png'))
})

it('renders a live empty state instead of bundled room photos', async () => {
  getRequestImagesMock.mockResolvedValue([])
  renderMedia('/contractor/requests/99/photos')
  expect(await screen.findByText('사용자가 등록한 공간 사진이 없습니다.')).toBeInTheDocument()
  expect(screen.queryByAltText('거실')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run the media tests and verify RED**

Run: `npm run test:run -- src/pages/contractor/ContractorRequestMediaPages.test.tsx`

- [ ] **Step 3: Render live images or explicit empty states**

Branch only on numeric route detection. Do not call `findContractorRequestDetail` in the live branch. Use `request.floorPlanImage` and `request.photos`; display empty-state copy when absent.

- [ ] **Step 4: Run focused tests and commit**

```bash
npm run test:run -- src/pages/contractor/ContractorRequestMediaPages.test.tsx
git add frontend/src/pages/contractor/ContractorRequestFloorPlanPage.tsx frontend/src/pages/contractor/ContractorRequestPhotosPage.tsx frontend/src/components/contractor/ContractorRequestDetailLayout.tsx frontend/src/pages/contractor/ContractorRequestMediaPages.test.tsx
git commit -m "feat(frontend): show live request media"
```

### Task 6: Connect contractor quote pages to API data

**Files:**
- Create: `frontend/src/utils/contractorQuoteAdapter.ts`
- Create: `frontend/src/utils/contractorQuoteAdapter.test.ts`
- Create: `frontend/src/hooks/useContractorQuotes.ts`
- Create: `frontend/src/hooks/useContractorQuote.ts`
- Modify: `frontend/src/pages/contractor/ContractorEstimateListPage.tsx`
- Modify: `frontend/src/pages/contractor/ContractorEstimateDetailPage.tsx`
- Modify: `frontend/src/pages/contractor/ContractorEstimateEditPage.tsx`
- Modify: `frontend/src/pages/contractor/ContractorEstimatePreviewPage.tsx`
- Modify: `frontend/src/pages/contractor/ContractorEstimateSentPage.tsx`
- Create: `frontend/src/pages/contractor/ContractorEstimateLiveFlow.test.tsx`

**Interfaces:**
- Produces: `quoteToContractorSentEstimate(quote: QuoteResponse, request: RequestResponse): ContractorSentEstimate`
- Produces: `useContractorQuotes(): { items; loading; error }`
- Produces: `useContractorQuote(estimateId?: string): { quote; request; view; loading; error }`
- Consumes: `getAssignedRequests`, `getQuotesByRequest`, `getQuote`, `getRequest`, `createQuote`, `updateQuote`, `submitQuote`

- [ ] **Step 1: Write failing adapter tests**

```ts
it('maps a live quote and landlord nickname without demo literals', () => {
  const result = quoteToContractorSentEstimate(quoteFixture, { ...requestFixture, landlordName: '시연 임대인' })
  expect(result.estimateId).toBe(String(quoteFixture.id))
  expect(result.customerName).toBe('시연 임대인')
  expect(result.finalAmount).toBe(quoteFixture.totalAmount)
})
```

- [ ] **Step 2: Run the adapter test and verify RED**

Run: `npm run test:run -- src/utils/contractorQuoteAdapter.test.ts`

- [ ] **Step 3: Implement quote adapters and hooks**

`useContractorQuotes` loads assigned requests with `size: 100`, requests quotes for each numeric request ID, and joins them by request ID. Preserve partial successes while reporting an error only when the assigned-request request fails.

`useContractorQuote` treats a positive integer `estimateId` as live, loads `getQuote`, then loads its `getRequest`. Nonnumeric IDs return the existing mock view.

- [ ] **Step 4: Write failing live-page tests**

```tsx
it('lists API quotes and does not render contractorSentEstimates for live data', async () => {
  getAssignedRequestsMock.mockResolvedValue(pageOf(requestFixture))
  getQuotesByRequestMock.mockResolvedValue([quoteFixture])
  renderEstimateList()
  expect(await screen.findByText('시연 임대인')).toBeInTheDocument()
  expect(screen.queryByText('김지선')).not.toBeInTheDocument()
})

it('loads numeric quote detail from the API', async () => {
  getQuoteMock.mockResolvedValue(quoteFixture)
  getRequestMock.mockResolvedValue({ ...requestFixture, landlordName: '시연 임대인' })
  renderEstimateDetail('/contractor/estimates/41')
  expect(await screen.findByText('시연 임대인')).toBeInTheDocument()
  expect(getQuoteMock).toHaveBeenCalledWith(41)
})
```

- [ ] **Step 5: Replace live mock lookups in list/detail/edit/preview/sent pages**

List and detail pages consume the new hooks. Edit/preview/sent pages already use API calls for numeric request IDs; remove remaining numeric-path `contractorDefaultEstimateDraft`, `findContractorRequestDetail`, and `findContractorSentEstimate` fallbacks. Render loading, not-found, and API error states explicitly.

- [ ] **Step 6: Run focused quote tests and commit**

```bash
npm run test:run -- src/utils/contractorQuoteAdapter.test.ts src/pages/contractor/ContractorEstimateLiveFlow.test.tsx
git add frontend/src/utils/contractorQuoteAdapter.ts frontend/src/utils/contractorQuoteAdapter.test.ts frontend/src/hooks/useContractorQuotes.ts frontend/src/hooks/useContractorQuote.ts frontend/src/pages/contractor/ContractorEstimateListPage.tsx frontend/src/pages/contractor/ContractorEstimateDetailPage.tsx frontend/src/pages/contractor/ContractorEstimateEditPage.tsx frontend/src/pages/contractor/ContractorEstimatePreviewPage.tsx frontend/src/pages/contractor/ContractorEstimateSentPage.tsx frontend/src/pages/contractor/ContractorEstimateLiveFlow.test.tsx
git commit -m "feat(frontend): connect contractor quotes to live data"
```

### Task 7: Run complete verification and request review

**Files:**
- Verify all modified files

**Interfaces:**
- Consumes: all preceding task outputs
- Produces: a reviewed, merge-ready `frontend` branch

- [ ] **Step 1: Run frontend verification**

Run: `npm run test:run`

Run: `npm run lint`

Run: `npm run build:dev`

Expected: all commands exit 0.

- [ ] **Step 2: Run backend verification**

Run: `./gradlew clean test bootJar --no-daemon`

Expected: exit 0 with no failed tests.

- [ ] **Step 3: Run deployment configuration checks**

Run from repository root:

```powershell
pwsh -NoProfile -File deploy/tests/private-compose-analysis.test.ps1
pwsh -NoProfile -File deploy/tests/dedicated-deploy-account.test.ps1
& 'C:\Program Files\Git\bin\bash.exe' -n deploy/scripts/common.sh deploy/scripts/deploy-private.sh deploy/scripts/deploy-public.sh
git diff --check
```

- [ ] **Step 4: Request code review and resolve all Critical/Important findings**

Review the complete range from `159477e` through `HEAD`, including test quality, live/mock boundary, authorization, and approval idempotency.

- [ ] **Step 5: Re-run all verification after review fixes**

Repeat Steps 1–3 and require fresh exit-0 evidence.

### Task 8: Merge frontend through develop to main

**Files:**
- No source changes expected

**Interfaces:**
- Produces: synchronized `frontend`, `develop`, and `main` containing the verified feature

- [ ] **Step 1: Push `frontend` and wait for applicable CI**

```bash
git push origin frontend
```

Verify `origin/frontend` equals local `frontend`.

- [ ] **Step 2: Fast-forward or merge `frontend` into latest `develop`**

Fetch first. If `develop` has diverged, create a normal merge commit; never rewrite either branch.

```bash
git switch develop
git merge --ff-only origin/develop
git merge --no-ff frontend -m "merge: integrate contractor live demo flow"
```

- [ ] **Step 3: Re-run frontend and backend verification on `develop`**

Run all Task 7 commands. Push `develop` only after they pass, then confirm remote SHA and CI status.

- [ ] **Step 4: Merge verified `develop` into latest `main`**

```bash
git switch main
git merge --ff-only origin/main
git merge --no-ff develop -m "merge: promote contractor live demo flow to main"
```

- [ ] **Step 5: Run final verification, push main, and monitor CI**

Run all Task 7 commands again. Push `main`, wait for `CI and container images`, and require backend, frontend, AI, deployment configuration, and all six image jobs to conclude `success`.

- [ ] **Step 6: Report exact SHAs and results**

Report `frontend`, `develop`, and `main` SHAs, local verification command results, CI run URLs, remaining intentionally mocked screens, and any production deployment action still requiring explicit approval.
