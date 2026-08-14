# Floorplan Analysis and 3D Connection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect stored and uploaded floorplans to one AI inference whose room summary and reusable 3D geometry are both shown on `/analysis/spaces`.

**Architecture:** The Spring backend sends a correctly typed multipart image to the private viewerwall service, validates its room geometry, saves a normalized JSON snapshot on `analysis_job`, and exposes it through an authenticated owner/participant API. The React screen keeps the existing original-image preview and lazily loads a local Three.js renderer in a second tab; no browser call reaches viewerwall and no second inference occurs.

**Tech Stack:** Java 21, Spring Boot 4 RestClient/JPA/Flyway, MySQL JSON, JUnit 5/Mockito/MockRestServiceServer, React 19, TypeScript, Three.js, Vitest/Testing Library, Docker Compose/Nginx.

## Global Constraints

- AI inference runs once per scan; switching tabs and refreshing must never trigger a scan POST.
- viewerwall, OCR, and SPA remain private and are not proxied through public Nginx.
- Supported source media types are exactly `image/png` and `image/jpeg`; `.jpg` and `.jpeg` resolve to `image/jpeg`.
- Timeouts are viewerwall 240s, backend 300s, Nginx 330s, frontend 360s.
- Visualization reads require the same participant authorization as existing analysis reads.
- Persist only normalized allow-listed geometry fields; never log image bytes, Object Storage keys, or tokens.
- New behavior follows strict RED → GREEN → REFACTOR cycles and each task ends with a focused commit.

---

### Task 1: Preserve the multipart image media type and align client timeouts

**Files:**
- Modify: `backend/src/main/java/com/spaceup/domain/analysis/ai/client/AiFloorplanAnalysisClient.java`
- Modify: `backend/src/main/java/com/spaceup/domain/analysis/ai/client/AiFloorplanProperties.java`
- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/src/test/java/com/spaceup/domain/analysis/ai/client/AiFloorplanAnalysisClientTest.java`

**Interfaces:**
- Consumes: `analyze(byte[] imageBytes, String filename, String contentType)`.
- Produces: a multipart `file` part whose filename is a safe basename and whose media type is PNG or JPEG.

- [ ] **Step 1: Write failing multipart contract tests**

Add request matchers that parse the outbound `MockClientHttpRequest` multipart body and assert literal headers:

```java
@Test
void sendsPngAsTypedMultipartFilePart() {
    server.expect(requestTo("https://ai.test/api/analyze"))
        .andExpect(method(HttpMethod.POST))
        .andExpect(request -> {
            String body = request.getBody().toString(StandardCharsets.ISO_8859_1);
            assertThat(body).contains("filename=\"plan.png\"");
            assertThat(body).contains("Content-Type: image/png");
        })
        .andRespond(validAnalysisResponse());

    client.analyze(new byte[] { 1 }, "folder/plan.png", "image/png");
}

@Test
void rejectsUnsupportedMediaTypeBeforeCallingAi() {
    assertThatThrownBy(() -> client.analyze(new byte[] { 1 }, "plan.webp", "image/webp"))
        .isInstanceOf(AiFloorplanAnalysisException.class)
        .hasMessageContaining("PNG").hasMessageContaining("JPEG");
    server.verify();
}
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `cd backend && ./gradlew test --tests '*AiFloorplanAnalysisClientTest'`

Expected: the PNG test fails because the file part is `application/octet-stream`; unsupported media does not fail before the request.

- [ ] **Step 3: Implement the typed part**

Create `resolveImageMediaType` and `safeFilename`, then wrap the resource:

```java
MediaType imageType = resolveImageMediaType(filename, contentType);
HttpHeaders partHeaders = new HttpHeaders();
partHeaders.setContentType(imageType);
partHeaders.setContentDisposition(ContentDisposition.formData()
    .name("file").filename(safeFilename(filename)).build());
body.add("file", new HttpEntity<>(fileResource, partHeaders));
```

Set `AiFloorplanProperties.readTimeout` and `external-api.ai-floorplan.read-timeout` defaults to `Duration.ofSeconds(300)` / `300s`.

- [ ] **Step 4: Verify GREEN and regression scope**

Run: `cd backend && ./gradlew test --tests '*AiFloorplanAnalysisClientTest' --tests '*AiFloorplanAnalysisServiceTest'`

Expected: all selected tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/spaceup/domain/analysis/ai/client/AiFloorplanAnalysisClient.java backend/src/main/java/com/spaceup/domain/analysis/ai/client/AiFloorplanProperties.java backend/src/main/resources/application.yml backend/src/test/java/com/spaceup/domain/analysis/ai/client/AiFloorplanAnalysisClientTest.java
git commit -m "fix(ai): preserve floorplan multipart media type"
```

### Task 2: Normalize and validate reusable visualization geometry

**Files:**
- Create: `backend/src/main/java/com/spaceup/domain/analysis/ai/client/AiFloorplanBoundingBox.java`
- Create: `backend/src/main/java/com/spaceup/domain/analysis/ai/client/AiFloorplanPoint.java`
- Create: `backend/src/main/java/com/spaceup/domain/analysis/ai/client/AiFloorplanVisualization.java`
- Extend: `backend/src/main/java/com/spaceup/domain/analysis/ai/client/AiFloorplanRoom.java`
- Modify: `backend/src/main/java/com/spaceup/domain/analysis/ai/client/AiFloorplanAnalysisResponse.java`
- Modify: `backend/src/main/java/com/spaceup/domain/analysis/ai/client/AiFloorplanAnalysisClient.java`
- Modify: `backend/src/test/java/com/spaceup/domain/analysis/ai/client/AiFloorplanAnalysisClientTest.java`

**Interfaces:**
- Produces: `AiFloorplanAnalysisResponse(long totalAreaPixelCount, List<AiFloorplanRoom> rooms, AiFloorplanVisualization visualization)`.
- `AiFloorplanVisualization` contains `imageWidth`, `imageHeight`, and the same immutable normalized room list used for summary calculations.

- [ ] **Step 1: Write failing response-validation tests**

Use literal JSON fixtures with `image_width`, `image_height`, `bbox`, `polygons`, and `viewer_polygons`. Add tests for:

```java
@Test void parsesGeometryNeededByThe3dViewer() { /* assert exact points and bbox */ }
@Test void rejectsPolygonPointOutsideImageBounds() { /* x == image_width must fail */ }
@Test void rejectsResponseWithoutRenderableRoomGeometry() { /* no bbox and no 3-point polygon */ }
@Test void dropsDebugFieldsFromNormalizedVisualization() { /* serialize DTO and assert absent */ }
```

- [ ] **Step 2: Run and verify RED**

Run: `cd backend && ./gradlew test --tests '*AiFloorplanAnalysisClientTest'`

Expected: compilation fails because visualization records and the response field do not exist.

- [ ] **Step 3: Implement immutable normalized records and parser validation**

Use explicit camelCase records, never a raw `JsonNode` outside the client:

```java
public record AiFloorplanPoint(int x, int y) {}
public record AiFloorplanBoundingBox(int x, int y, int width, int height) {}
public record AiFloorplanVisualization(int imageWidth, int imageHeight,
        long totalAreaPixelCount, List<AiFloorplanRoom> rooms) {}
```

Extend `AiFloorplanRoom` with `instanceId`, `displayName`, `bbox`, `polygons`, `viewerPolygons`, `viewerAnchor`, and `viewerRadius`, retaining `isBedroom/isBathroom/isBalcony`. Accept `viewer_polygons` first, then `polygons`, then a positive bbox as renderable geometry. Validate all points against `0 <= x < imageWidth`, `0 <= y < imageHeight`.

- [ ] **Step 4: Run focused tests and full client mutation check**

Run: `cd backend && ./gradlew test --tests '*AiFloorplanAnalysisClientTest'`

Expected: all response and multipart tests pass. Mentally mutate boundary comparison from `<` to `<=`; the out-of-bounds test must fail.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/spaceup/domain/analysis/ai/client backend/src/test/java/com/spaceup/domain/analysis/ai/client/AiFloorplanAnalysisClientTest.java
git commit -m "feat(ai): normalize floorplan visualization geometry"
```

### Task 3: Persist visualization atomically with analysis results

**Files:**
- Create: `backend/src/main/resources/db/migration/V7__floorplan_visualization_json.sql`
- Modify: `backend/src/main/java/com/spaceup/domain/analysis/entity/AnalysisJob.java`
- Create: `backend/src/main/java/com/spaceup/domain/analysis/dto/FloorplanVisualizationResponse.java`
- Modify: `backend/src/main/java/com/spaceup/domain/analysis/service/AnalysisJobService.java`
- Modify: `backend/src/main/java/com/spaceup/domain/analysis/ai/service/AiFloorplanAnalysisService.java`
- Modify: `backend/src/test/java/com/spaceup/domain/analysis/ai/service/AiFloorplanAnalysisServiceTest.java`
- Create: `backend/src/test/java/com/spaceup/domain/analysis/service/AnalysisVisualizationServiceTest.java`

**Interfaces:**
- Produces: `AnalysisJobService.saveVisualization(Long requestId, Long landlordId, AiFloorplanVisualization visualization)`.
- Produces: `AnalysisJobService.getVisualization(Long requestId, Long memberId): FloorplanVisualizationResponse`.
- Produces: `AnalysisJob.prepareForAnalysis()`, `saveFloorplanVisualizationJson(String)`, and `fail()` clearing incomplete JSON.

- [ ] **Step 1: Write failing service tests**

Add behavior tests proving:

```java
@Test void successfulAiAnalysisSavesSummarySpacesAndVisualization() { /* capture all three */ }
@Test void retryClearsPreviousVisualizationBeforeCallingAi() { /* verify prepare call ordering */ }
@Test void failedAnalysisRecordsFailedStateInRequiresNewTransactionBoundary() { /* verify markFailed */ }
@Test void participantCanReadSavedVisualization() { /* literal DTO fields */ }
@Test void missingVisualizationRaisesConflictDomainException() { /* exact exception type */ }
```

- [ ] **Step 2: Run and verify RED**

Run: `cd backend && ./gradlew test --tests '*AiFloorplanAnalysisServiceTest' --tests '*AnalysisVisualizationServiceTest'`

Expected: compilation fails because persistence methods, DTO, and column are absent.

- [ ] **Step 3: Add schema and entity behavior**

Migration:

```sql
ALTER TABLE `analysis_job`
    ADD COLUMN `floorplan_visualization_json` JSON NULL AFTER `total_wallpaper_area_m2`;
```

Map it as a nullable String with `@Column(name = "floorplan_visualization_json", columnDefinition = "json")`. Ensure `prepareForAnalysis()` sets `PENDING` and clears JSON; `fail()` clears JSON; success stores JSON before returning `COMPLETED`.

- [ ] **Step 4: Implement typed serialization and orchestration**

`FloorplanVisualizationResponse` mirrors the allow-listed client DTO. Serialize with the project Jackson 3 `ObjectMapper`, convert serialization failures to `AiFloorplanAnalysisException`, and reuse `validateParticipant`. Call `prepareForAnalysis` before the AI request, then save summary, spaces, and visualization inside the existing analysis transaction. Keep `markFailed` as `REQUIRES_NEW`.

- [ ] **Step 5: Verify GREEN**

Run: `cd backend && ./gradlew test --tests '*AiFloorplanAnalysisServiceTest' --tests '*AnalysisVisualizationServiceTest'`

Expected: all selected tests pass.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/resources/db/migration/V7__floorplan_visualization_json.sql backend/src/main/java/com/spaceup/domain/analysis backend/src/test/java/com/spaceup/domain/analysis
git commit -m "feat(analysis): persist floorplan visualization"
```

### Task 4: Expose an authenticated visualization result API

**Files:**
- Modify: `backend/src/main/java/com/spaceup/domain/analysis/controller/AnalysisJobController.java`
- Create: `backend/src/main/java/com/spaceup/global/error/AnalysisVisualizationNotReadyException.java`
- Modify: `backend/src/main/java/com/spaceup/global/error/GlobalExceptionHandler.java`
- Create: `backend/src/test/java/com/spaceup/domain/analysis/controller/AnalysisVisualizationControllerTest.java`

**Interfaces:**
- Produces: `GET /api/analysis/request/{requestId}/floorplan-visualization` returning `ApiResponse<FloorplanVisualizationResponse>`.
- Missing visualization maps to HTTP 409; existing 403/404 mappings remain unchanged.

- [ ] **Step 1: Write failing MockMvc contract tests**

```java
@Test void ownerReceivesNormalizedVisualization() { /* jsonPath imageWidth and rooms[0].viewerPolygons */ }
@Test void analysisWithoutVisualizationReturns409() { /* mock service exception */ }
@Test void nonParticipantReturns403() { /* exercise service authorization */ }
```

- [ ] **Step 2: Run and verify RED**

Run: `cd backend && ./gradlew test --tests '*AnalysisVisualizationControllerTest'`

Expected: 404/no handler or compilation failure.

- [ ] **Step 3: Implement endpoint and exception mapping**

```java
@GetMapping("/request/{requestId}/floorplan-visualization")
public ResponseEntity<ApiResponse<FloorplanVisualizationResponse>> getFloorplanVisualization(
        @PathVariable Long requestId, Authentication authentication) {
    return ResponseEntity.ok(ApiResponse.success("평면도 시각화 조회 완료",
        analysisJobService.getVisualization(requestId, getMemberId(authentication))));
}
```

Map `AnalysisVisualizationNotReadyException` to `HttpStatus.CONFLICT` in `GlobalExceptionHandler`.

- [ ] **Step 4: Verify GREEN and controller regression**

Run: `cd backend && ./gradlew test --tests '*AnalysisVisualizationControllerTest' --tests '*AnalysisJob*Test'`

Expected: all selected tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/spaceup/domain/analysis/controller/AnalysisJobController.java backend/src/main/java/com/spaceup/global/error backend/src/test/java/com/spaceup/domain/analysis/controller/AnalysisVisualizationControllerTest.java
git commit -m "feat(api): expose floorplan visualization result"
```

### Task 5: Add the frontend visualization contract and lazy API call

**Files:**
- Modify: `frontend/src/types/analysis.ts`
- Modify: `frontend/src/api/analysisApi.ts`
- Modify: `frontend/src/api/analysisApi.test.ts`

**Interfaces:**
- Produces: `getFloorplanVisualization(requestId: number): Promise<FloorplanVisualization>`.
- Types: `FloorplanPoint`, `FloorplanBoundingBox`, `FloorplanVisualizationRoom`, `FloorplanVisualization`.

- [ ] **Step 1: Write the failing API test**

```ts
it('requests the authenticated saved visualization without starting analysis', async () => {
  await getFloorplanVisualization(77)
  expect(apiRequest).toHaveBeenCalledWith({
    method: 'GET',
    url: '/api/analysis/request/77/floorplan-visualization',
    authenticated: true,
  })
})
```

- [ ] **Step 2: Run and verify RED**

Run: `cd frontend && npm run test:run -- src/api/analysisApi.test.ts`

Expected: import/type failure because the function is absent.

- [ ] **Step 3: Add exact TypeScript types and API function**

Use camelCase fields matching Spring JSON. Set `FLOOR_PLAN_SCAN_TIMEOUT_MS = 360_000`. The GET has no long timeout because it reads stored JSON.

- [ ] **Step 4: Verify GREEN**

Run: `cd frontend && npm run test:run -- src/api/analysisApi.test.ts`

Expected: all analysis API tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types/analysis.ts frontend/src/api/analysisApi.ts frontend/src/api/analysisApi.test.ts
git commit -m "feat(frontend): add floorplan visualization api"
```

### Task 6: Build a testable Three.js floorplan renderer

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Create: `frontend/src/utils/floorPlanScene.ts`
- Create: `frontend/src/utils/floorPlanScene.test.ts`
- Create: `frontend/src/components/user/FloorPlan3DViewer.tsx`
- Create: `frontend/src/components/user/FloorPlan3DViewer.test.tsx`

**Interfaces:**
- Produces: `buildFloorPlanScene(visualization): FloorPlanSceneRoom[]` as a pure geometry-selection function.
- Produces: `<FloorPlan3DViewer visualization={...} spaces={...} />`.

- [ ] **Step 1: Install pinned Three.js types and write pure failing tests**

Run: `cd frontend && npm install three@0.180.0 && npm install -D @types/three@0.180.0`

Tests must assert hand-derived literals:

```ts
it('prefers viewer polygons over raw polygons and bbox', () => { /* exact selected points */ })
it('falls back to raw polygons when viewer polygons are empty', () => { /* exact points */ })
it('falls back to a bbox rectangle when polygons are absent', () => { /* four literal corners */ })
it('normalizes the plan around its center with a stable scale', () => { /* literal coordinates */ })
```

- [ ] **Step 2: Run and verify RED**

Run: `cd frontend && npm run test:run -- src/utils/floorPlanScene.test.ts`

Expected: module-not-found failure.

- [ ] **Step 3: Implement the pure scene model**

Select geometry in the documented order and map pixels to centered world coordinates. Return room name, area label input, and polygons without importing Three.js so the contract is deterministic and fast to test.

- [ ] **Step 4: Verify scene model GREEN**

Run: `cd frontend && npm run test:run -- src/utils/floorPlanScene.test.ts`

Expected: all pure geometry tests pass.

- [ ] **Step 5: Write failing viewer lifecycle/component tests**

Mock the WebGL adapter boundary, not room behavior. Assert the component creates one scene from real `buildFloorPlanScene` output, exposes reset/top/isometric controls, lists room name/area, and disposes once on unmount. A WebGL initialization error must render `3D 미리보기를 사용할 수 없습니다`.

- [ ] **Step 6: Implement the minimal renderer**

Create floors with `THREE.Shape` + `ExtrudeGeometry`, boundary walls with `BoxGeometry`, `OrbitControls`, top/isometric/reset controls, and a `ResizeObserver`. Dispose geometries, materials, renderer, controls, animation frame, observer, and listeners in the effect cleanup.

- [ ] **Step 7: Verify component and frontend regression tests**

Run: `cd frontend && npm run test:run -- src/utils/floorPlanScene.test.ts src/components/user/FloorPlan3DViewer.test.tsx`

Expected: all selected tests pass without unhandled WebGL errors.

- [ ] **Step 8: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/utils/floorPlanScene.ts frontend/src/utils/floorPlanScene.test.ts frontend/src/components/user/FloorPlan3DViewer.tsx frontend/src/components/user/FloorPlan3DViewer.test.tsx
git commit -m "feat(frontend): render saved floorplan in 3d"
```

### Task 7: Connect original and 3D tabs on the space information screen

**Files:**
- Create: `frontend/src/components/user/FloorPlanPreviewTabs.tsx`
- Create: `frontend/src/components/user/FloorPlanPreviewTabs.test.tsx`
- Modify: `frontend/src/pages/SpaceInformationPage.tsx`
- Modify: `frontend/src/pages/SpaceInformationPage.test.tsx`

**Interfaces:**
- `FloorPlanPreviewTabs` consumes `requestId`, `floorPlanPreviewUrl`, and `spaces`.
- It calls `getFloorplanVisualization` only on first activation of `3D 분석` and caches the fulfilled result in component state.

- [ ] **Step 1: Write failing tab behavior tests**

```tsx
it('shows original floorplan by default and does not request visualization', async () => { /* zero calls */ })
it('loads saved visualization once on first 3d activation', async () => { /* switch twice, one call */ })
it('keeps original tab usable when visualization returns 409', async () => { /* error plus original image */ })
it('refreshing the spaces route never calls any scan endpoint', async () => { /* GETs only */ })
```

- [ ] **Step 2: Run and verify RED**

Run: `cd frontend && npm run test:run -- src/components/user/FloorPlanPreviewTabs.test.tsx src/pages/SpaceInformationPage.test.tsx`

Expected: tab queries fail because the component is absent.

- [ ] **Step 3: Implement accessible tabs and page integration**

Use `role="tablist"`, `role="tab"`, `aria-selected`, and paired `tabpanel` IDs. Preserve the existing image alt text and space-selection form. On visualization failure show `3D 분석 결과가 없습니다. 평면도를 다시 분석해 주세요.` with a button that returns to `/analysis/loading`; do not call scan APIs from the tab.

- [ ] **Step 4: Verify GREEN and frontend suite**

Run: `cd frontend && npm run test:run -- src/components/user/FloorPlanPreviewTabs.test.tsx src/pages/SpaceInformationPage.test.tsx`

Expected: all selected tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/user/FloorPlanPreviewTabs.tsx frontend/src/components/user/FloorPlanPreviewTabs.test.tsx frontend/src/pages/SpaceInformationPage.tsx frontend/src/pages/SpaceInformationPage.test.tsx
git commit -m "feat(frontend): connect floorplan and 3d result tabs"
```

### Task 8: Align edge timeouts and verify the complete change

**Files:**
- Modify: `deploy/nginx.production.conf.template`
- Modify: `deploy/tests/private-compose-analysis.test.ps1`
- Modify: `docs/2026-08-14_도면분석_3D연결_안내.md`

**Interfaces:**
- Nginx `/api/` sends and reads for 330 seconds.
- Deployment test verifies the timeout literals and private viewerwall wiring.

- [ ] **Step 1: Write the failing deployment assertions**

Add runtime configuration assertions to `private-compose-analysis.test.ps1`:

```powershell
if (-not $nginx.Contains('proxy_send_timeout 330s;')) { throw 'missing 330s send timeout' }
if (-not $nginx.Contains('proxy_read_timeout 330s;')) { throw 'missing 330s read timeout' }
if (-not $application.Contains('read-timeout: 300s')) { throw 'missing backend AI timeout' }
```

- [ ] **Step 2: Run and verify RED**

Run: `powershell -File deploy/tests/private-compose-analysis.test.ps1`

Expected: failure because Nginx still uses 90s and backend config still uses 30s before Task 1.

- [ ] **Step 3: Set Nginx timeout and document operations**

Change only the `/api/` `proxy_send_timeout` and `proxy_read_timeout` values to `330s`. Document API flow, failure diagnosis (415/timeout/invalid geometry), retry steps, and the follow-up async/polling roadmap.

- [ ] **Step 4: Run backend verification**

Run: `cd backend && ./gradlew test`

Expected: Gradle exits 0 with all tests passing.

- [ ] **Step 5: Run frontend verification**

Run: `cd frontend && npm run test:run && npm run lint && npm run build`

Expected: Vitest, ESLint, TypeScript, and Vite all exit 0.

- [ ] **Step 6: Run deployment verification**

Run: `powershell -File deploy/tests/private-compose-analysis.test.ps1`

Expected: script exits 0.

- [ ] **Step 7: Review the final diff and commit**

Run: `git diff --check && git status --short && git diff --stat origin/ai...HEAD`

Expected: no whitespace errors; only plan-scoped source, tests, migration, lockfile, deploy config, and docs are changed.

```bash
git add deploy/nginx.production.conf.template deploy/tests/private-compose-analysis.test.ps1 docs/2026-08-14_도면분석_3D연결_안내.md
git commit -m "chore(deploy): allow floorplan inference window"
```

## Follow-up Plan Summary

After this synchronous connection is proven in production:

1. Add a durable background analysis executor and poll `PENDING/PROCESSING/COMPLETED/FAILED` instead of holding HTTP for up to six minutes.
2. Store `pipeline_version` and the source-image hash; reuse a result only when both match.
3. Record per-stage latency and categorized 415/5xx/timeout/invalid-geometry metrics without sensitive payloads.
4. Add owner editing of detected room names/polygons with revision history.
5. Add a low-power 2D geometry view and selectable 3D quality levels for mobile devices.
