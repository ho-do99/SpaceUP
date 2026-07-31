# SpaceUP Project Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the approved SpaceUP monorepo scaffold, verify each service and infrastructure configuration, then publish `main`, `develop`, `ai`, `backend`, and `frontend`.

**Architecture:** Keep the three applications independent under `frontend/`, `backend/`, and `ai/`, while Docker Compose and Nginx provide a shared local entry point. Preserve existing frontend source files, add only the missing requested modules, and use environment variables at service boundaries.

**Tech Stack:** React 18, Vite 5, TypeScript 5, Tailwind CSS 3, Spring Boot 3, Java 21, Gradle 8, FastAPI, Python 3, MySQL 8, Nginx, Docker Compose

## Global Constraints

- The initial scaffold commit is shared by all five requested branches.
- `develop` branches from `main`; `ai`, `backend`, and `frontend` branch from `develop`.
- Do not delete or commit the user's existing root `Docs/` and `tmp/` content.
- Do not commit credentials, model binaries, uploaded floor plans, or generated reports.
- Never force-push over pre-existing remote history.
- Keep each requested service independently buildable or syntax-verifiable.

---

## File Map

- `frontend/src/pages/*.tsx`: route-level placeholder screens.
- `frontend/src/api/*.ts`: typed Spring API clients sharing one Axios instance.
- `frontend/src/types/*.ts`: DTO contracts used by the API clients.
- `backend/src/main/java/com/spaceup/SpaceUpApplication.java`: Spring Boot entry point.
- `backend/src/main/java/com/spaceup/config/*.java`: CORS and permissive scaffold security.
- `backend/src/main/java/com/spaceup/*/.gitkeep`: requested domain package boundaries.
- `backend/src/main/resources/application*.yml`: common and environment-specific configuration.
- `ai/app/main.py`: FastAPI application composition.
- `ai/app/routes/*.py`: health and analysis HTTP contracts.
- `ai/app/services/*.py`: OCR and segmentation scaffold services.
- `database/init.sql`: initial MySQL database setup.
- `nginx/*.conf`: local and development routing.
- `docker-compose.*.yml`: environment orchestration.
- `.env.local`, `.env.dev`, `.env.example`: non-secret environment values.
- `.gitignore`: generated output, local documents, uploads, and secrets policy.
- `README.md`: repository layout and run commands.

### Task 1: Complete and verify the frontend scaffold

**Files:**
- Create: `frontend/public/images/.gitkeep`
- Create: `frontend/src/pages/HomePage.tsx`
- Create: `frontend/src/pages/LoginPage.tsx`
- Create: `frontend/src/pages/FloorPlanUploadPage.tsx`
- Create: `frontend/src/pages/AnalysisResultPage.tsx`
- Create: `frontend/src/pages/EstimatePage.tsx`
- Create: `frontend/src/pages/ReportPage.tsx`
- Create: `frontend/src/pages/ContractorPage.tsx`
- Create: `frontend/src/pages/MyPage.tsx`
- Create: `frontend/src/api/axiosInstance.ts`
- Create: `frontend/src/api/authApi.ts`
- Create: `frontend/src/api/floorPlanApi.ts`
- Create: `frontend/src/api/estimateApi.ts`
- Create: `frontend/src/api/contractorApi.ts`
- Create: `frontend/src/types/member.ts`
- Create: `frontend/src/types/floorPlan.ts`
- Create: `frontend/src/types/estimate.ts`
- Create: `frontend/src/types/contractor.ts`
- Modify: `frontend/Dockerfile.dev`

**Interfaces:**
- Produces: `apiClient: AxiosInstance`
- Produces: `Member`, `FloorPlan`, `FloorPlanAnalysis`, `Estimate`, and `Contractor` DTOs
- Consumes: route paths already defined in `frontend/src/router/AppRouter.tsx`

- [ ] **Step 1: Add the eight route components**

Each component exports a default React function. Shared screens use `Header` and `Footer`; upload uses `FileUploader`. Parameterized screens read `id` with `useParams`.

```tsx
export default function HomePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24">SpaceUP</main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Add DTOs and API clients**

`axiosInstance.ts` must expose a single instance with a safe relative default:

```ts
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15_000,
})
```

API methods return typed `response.data` and do not swallow Axios errors.

- [ ] **Step 3: Make the development image self-contained**

Remove the nonexistent `frontend/nginx/nginx.conf` copy from `Dockerfile.dev`; use the Nginx image's default static configuration because the root proxy handles public routing.

- [ ] **Step 4: Install and build**

Run: `npm install`

Run: `npm run build`

Expected: both commands exit `0`, TypeScript resolves every router import, and `frontend/dist/` is generated.

- [ ] **Step 5: Stage the frontend deliverable**

Run: `git add -- frontend`

Do not commit yet; the user requested one initial scaffold commit shared by all branches.

### Task 2: Create and verify the Spring Boot scaffold

**Files:**
- Create: `backend/build.gradle`
- Create: `backend/settings.gradle`
- Create: `backend/src/main/java/com/spaceup/SpaceUpApplication.java`
- Create: `backend/src/main/java/com/spaceup/config/SecurityConfig.java`
- Create: `backend/src/main/java/com/spaceup/config/CorsConfig.java`
- Create: `backend/src/main/java/com/spaceup/{member,housing,floorplan,analysis,estimate,report,contractor,quotation}/.gitkeep`
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/resources/application-local.yml`
- Create: `backend/src/main/resources/application-dev.yml`
- Create: `backend/src/test/java/com/spaceup/SpaceUpApplicationTests.java`
- Create: `backend/Dockerfile.local`
- Create: `backend/Dockerfile.dev`
- Generate: `backend/gradlew`
- Generate: `backend/gradlew.bat`
- Generate: `backend/gradle/wrapper/gradle-wrapper.jar`
- Generate: `backend/gradle/wrapper/gradle-wrapper.properties`

**Interfaces:**
- Produces: Spring application on port `8080`
- Produces: Actuator health at `/actuator/health`
- Consumes: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, and `AI_BASE_URL`

- [ ] **Step 1: Add the Gradle build and application test**

Use Java 21 toolchains, Spring Web, Validation, Security, Data JPA, MySQL runtime driver, Actuator, and Spring Boot Test.

```java
@SpringBootTest(properties = {
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration"
})
class SpaceUpApplicationTests {
    @Test
    void contextLoads() {}
}
```

- [ ] **Step 2: Add the application and config classes**

`SecurityConfig` permits all requests for the scaffold and disables CSRF. `CorsConfig` reads `APP_CORS_ALLOWED_ORIGINS` and registers `/api/**`.

- [ ] **Step 3: Add YAML profiles and Dockerfiles**

The default profile is `local`; environment files resolve database and AI service settings with local fallbacks. The local image runs `bootRun`; the dev image builds and launches the executable JAR.

- [ ] **Step 4: Generate and validate the Gradle wrapper**

Run a Gradle 8 wrapper generator targeting Gradle `8.10.2`.

Run: `backend\gradlew.bat test`

Expected: exit `0` and one context test passes.

- [ ] **Step 5: Stage the backend deliverable**

Run: `git add -- backend`

### Task 3: Create and verify the FastAPI scaffold

**Files:**
- Create: `ai/app/__init__.py`
- Create: `ai/app/main.py`
- Create: `ai/app/routes/__init__.py`
- Create: `ai/app/routes/health.py`
- Create: `ai/app/routes/analysis.py`
- Create: `ai/app/services/__init__.py`
- Create: `ai/app/services/ocr_service.py`
- Create: `ai/app/services/segmentation_service.py`
- Create: `ai/app/models/.gitkeep`
- Create: `ai/tests/test_routes.py`
- Create: `ai/Dockerfile.local`
- Create: `ai/Dockerfile.dev`
- Create: `ai/requirements.txt`

**Interfaces:**
- Produces: `GET /health -> {"status": "ok", "service": "spaceup-ai"}`
- Produces: `POST /analysis` multipart upload response with filename, status, OCR text, and segmented room names
- Produces: `extract_text(file_bytes: bytes) -> str`
- Produces: `segment_rooms(file_bytes: bytes) -> list[str]`

- [ ] **Step 1: Write the route tests**

```python
def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
```

The analysis test uploads a small byte payload and expects status `accepted`.

- [ ] **Step 2: Run the tests to confirm the missing app fails**

Run: `python -m pytest ai/tests/test_routes.py -q`

Expected: FAIL because `ai.app.main` does not exist yet.

- [ ] **Step 3: Implement the app, routes, and service boundaries**

The services return deterministic scaffold values. The analysis endpoint rejects empty uploads with HTTP `400`.

- [ ] **Step 4: Install dependencies and rerun verification**

Run: `python -m pip install -r ai/requirements.txt`

Run: `python -m pytest ai/tests/test_routes.py -q`

Run: `python -m compileall -q ai/app`

Expected: all commands exit `0`.

- [ ] **Step 5: Stage the AI deliverable**

Run: `git add -- ai`

### Task 4: Add and validate shared infrastructure

**Files:**
- Create: `database/init.sql`
- Create: `nginx/local.conf`
- Create: `nginx/dev.conf`
- Create: `storage/floorplans/.gitkeep`
- Create: `storage/reports/.gitkeep`
- Create: `storage/images/.gitkeep`
- Create: `docker-compose.local.yml`
- Create: `docker-compose.dev.yml`
- Create: `.env.local`
- Create: `.env.dev`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `README.md`

**Interfaces:**
- Nginx routes `/` to frontend, `/api/` to backend, and `/ai/` to FastAPI.
- Compose service names are `frontend`, `backend`, `ai`, `db`, and `nginx`.
- The database service is reachable as `db:3306`.

- [ ] **Step 1: Add safe environment files and ignore rules**

Use development-only values such as `spaceup`, `spaceup_user`, and `spaceup_password`; document that deployed secrets must be injected. Ignore `Docs/`, `tmp/`, dependency folders, build output, Python caches, model binaries, and storage contents while retaining `.gitkeep`.

- [ ] **Step 2: Add database and Nginx configuration**

`init.sql` creates the `spaceup` database with UTF-8. Both Nginx configs support SPA fallback and proxy service paths.

- [ ] **Step 3: Add the Compose configurations**

Local Compose mounts source for hot reload. Development Compose builds immutable images. Both include MySQL health checks and service dependencies.

- [ ] **Step 4: Add README usage documentation**

Document prerequisites, the requested directory tree, `docker compose --env-file` commands, service URLs, and the Git branch policy.

- [ ] **Step 5: Validate and stage**

Run: `docker compose --env-file .env.local -f docker-compose.local.yml config`

Run: `docker compose --env-file .env.dev -f docker-compose.dev.yml config`

Expected: both exit `0`.

Run: `git add -- database nginx storage docker-compose.local.yml docker-compose.dev.yml .env.local .env.dev .env.example .gitignore README.md`

### Task 5: Verify, commit, branch, and publish

**Files:**
- Verify all staged files and all requested paths.
- Modify Git refs and remote configuration only after verification.

**Interfaces:**
- Produces remote branches `origin/main`, `origin/develop`, `origin/ai`, `origin/backend`, and `origin/frontend`.

- [ ] **Step 1: Verify requirements and staged scope**

Run: `git diff --cached --check`

Run: `git status --short`

Run a path manifest check covering every requested file and required `.gitkeep`.

Expected: no whitespace errors, no staged `Docs/` or `tmp/` files, and no requested path missing.

- [ ] **Step 2: Re-run all available builds and tests**

Run: `npm run build` in `frontend/`

Run: `backend\gradlew.bat test`

Run: `python -m pytest ai/tests/test_routes.py -q`

Run both `docker compose ... config` commands.

Expected: every available command exits `0`; report any unavailable runtime explicitly.

- [ ] **Step 3: Create the scaffold commit**

Run:

```text
git commit -m "chore: scaffold SpaceUP monorepo"
```

- [ ] **Step 4: Inspect and configure the remote**

Run: `git ls-remote https://github.com/ho-do99/SpaceUP.git`

If the remote is empty, rename `master` to `main` and add `origin`. If it has existing history, fetch and integrate without force.

- [ ] **Step 5: Create the branch graph**

Rename the current branch to `main`, create `develop` at `main`, then create `ai`, `backend`, and `frontend` at `develop`. Return to `develop` after creating the refs.

- [ ] **Step 6: Push and verify remote refs**

Push `main`, `develop`, `ai`, `backend`, and `frontend` with upstream tracking.

Run: `git ls-remote --heads origin`

Expected: all five branch names resolve to the verified scaffold commit.
