# Interior Simulation and Material Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the approved interior simulation screens to analysis-based material recommendations, calculated totals, and persisted product selections.

**Architecture:** Preserve the existing Figma-matched pages and their working upload/Gemini pipeline. Add typed recommendation and request-update boundaries, then make the summary page derive defaults and totals from the active request's analysis while the existing catalog pages remain comparison screens.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Axios, Spring Boot, JPA

## Global Constraints

- Keep the supplied Figma layouts and route order unchanged.
- Use the active request ID for every recommendation and persistence operation.
- Do not invent an estimate when recommendation data is unavailable.
- Persist all three product IDs and the selected theme before contractor navigation.
- Preserve unrelated untracked user files.

---

### Task 1: Typed recommendation boundary

**Files:**
- Modify: `frontend/src/api/analysisApi.ts`
- Modify: `frontend/src/api/analysisApi.test.ts`

**Interfaces:**
- Produces: `getRecommendedProducts(requestId: number, theme: MaterialTheme): Promise<RecommendedProduct[]>`

- [ ] **Step 1: Write a failing API test** asserting request `77` and theme `WOOD` produce `GET /api/analysis/request/77/recommended-products` with `{ theme: 'WOOD' }`.
- [ ] **Step 2: Run** `npm run test:run -- src/api/analysisApi.test.ts` and confirm the expected missing-query failure.
- [ ] **Step 3: Add the `theme` argument and query parameter** to `getRecommendedProducts`.
- [ ] **Step 4: Re-run the focused test** and confirm it passes.

### Task 2: Persistable request material contract

**Files:**
- Modify: `frontend/src/types/request.ts`
- Modify: `frontend/src/api/requestApi.test.ts`

**Interfaces:**
- Produces: optional `selectedTheme`, `selectedWallpaperProductId`, `selectedFlooringProductId`, and `selectedLightingProductId` fields on `RequestUpdateInput`.

- [ ] **Step 1: Write a failing request API test** using a complete literal payload with theme and three numeric product IDs.
- [ ] **Step 2: Run** `npm run test:run -- src/api/requestApi.test.ts` and confirm TypeScript or payload expectation fails because the fields are absent.
- [ ] **Step 3: Add the four backend-compatible fields** to `RequestUpdateInput`.
- [ ] **Step 4: Re-run the focused test** and confirm it passes.

### Task 3: Recommendation adapter and request-scoped selection

**Files:**
- Create: `frontend/src/utils/materialRecommendation.ts`
- Create: `frontend/src/utils/materialRecommendation.test.ts`
- Modify: `frontend/src/contexts/EstimateFlowProvider.tsx`
- Modify: `frontend/src/contexts/estimateFlowContext.ts`

**Interfaces:**
- Produces: `groupRecommendedProducts(products)` returning one ordered recommendation list per `FLOORING`, `WALLPAPER`, and `LIGHTING`.
- Produces: request-scoped selection methods that accept backend product IDs as strings.

- [ ] **Step 1: Write failing pure tests** proving categories group correctly, priority one becomes default, and total is the sum of three literal amounts.
- [ ] **Step 2: Run** `npm run test:run -- src/utils/materialRecommendation.test.ts` and confirm the module-not-found failure.
- [ ] **Step 3: Implement grouping and total helpers** with no UI dependencies.
- [ ] **Step 4: Re-run the focused test** and confirm it passes.
- [ ] **Step 5: Namespace selection storage keys by active request ID** and expose a method that applies recommendation defaults only when no request-specific choice exists.

### Task 4: Connect recommendation summary and persistence

**Files:**
- Modify: `frontend/src/pages/EstimateSummaryPage.tsx`
- Create: `frontend/src/pages/EstimateSummaryPage.test.tsx`
- Modify: `frontend/src/components/user/MaterialSummaryCard.tsx`

**Interfaces:**
- Consumes: `getRecommendedProducts`, request-scoped flow selection, and `updateRequest`.
- Produces: an analysis-derived summary and persisted completion action.

- [ ] **Step 1: Write a failing page test** with complete recommendation fixtures asserting the chosen style label, `470 ~ 750만원`-style computed range presentation, and save-before-navigation behavior.
- [ ] **Step 2: Write a failing error test** asserting a rejected `updateRequest` keeps the user on the summary and displays the error.
- [ ] **Step 3: Run** `npm run test:run -- src/pages/EstimateSummaryPage.test.tsx` and confirm failures occur because the page still uses catalog defaults and direct navigation.
- [ ] **Step 4: Fetch recommendations for the active request and selected theme**, apply category defaults, and render backend reason/quantity/amount data.
- [ ] **Step 5: Replace the hardcoded total** with a value derived from chosen material amounts.
- [ ] **Step 6: Await `updateRequest` with numeric IDs and theme** before navigating to `/contractors`; show recoverable errors.
- [ ] **Step 7: Re-run the focused page tests** and confirm they pass.

### Task 5: Regression verification and handoff

**Files:**
- Modify: `docs/2026-08-14_인테리어시뮬레이션_자재추천_연결안내.md`

- [ ] **Step 1: Run** `npm run test:run` in `frontend` and require zero failed tests.
- [ ] **Step 2: Run** `npm run lint` and `npm run build` in `frontend` and require exit code 0.
- [ ] **Step 3: Run** `gradlew.bat test` in `backend` and require `BUILD SUCCESSFUL`.
- [ ] **Step 4: Verify** `git diff --check` and ensure the two pre-existing untracked user documents remain unmodified.
- [ ] **Step 5: Commit** implementation with `feat: connect interior simulation material flow`.
- [ ] **Step 6: Fetch/rebase remote `ai` safely if needed, repeat affected verification, and push `origin ai` without force.
