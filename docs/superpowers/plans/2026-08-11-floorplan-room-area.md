# Floorplan Room Area Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AI 세그멘테이션 픽셀 비율로 방별 전용면적을 계산해 `AnalysisSpace.spaceAreaM2`에 저장한다.

**Architecture:** AI 서비스는 방 마스크들의 합집합 픽셀 수를 `total_area_pixel_count`로 반환한다. Spring 백엔드는 응답 전체를 값 객체로 파싱하고, 요청의 전용면적에 픽셀 비율을 적용해 기존 공간 저장 서비스로 전달한다.

**Tech Stack:** Python 3.11, NumPy, pytest, Java 21, Spring Boot 4, JUnit 5, Mockito, Gradle

## Global Constraints

- 기존 AI JSON 필드는 삭제하거나 이름을 바꾸지 않는다.
- 평 단위 값은 저장하지 않고 `spaceAreaM2`만 저장한다.
- 프론트엔드 소스는 변경하지 않고 연동 문서만 작성한다.
- 구현은 `ai` 브랜치에서 검증한다.

---

### Task 1: AI 전체 면적 픽셀 계산

**Files:**
- Create: `ai/spa/app/area_pixels.py`
- Create: `ai/spa/tests/test_area_pixels.py`
- Modify: `ai/spa/app/main.py`

**Interfaces:**
- Produces: `total_area_pixel_count(instances: list[dict]) -> int`
- Produces: `room_json.total_area_pixel_count: int`

- [ ] 방 마스크 두 개가 겹칠 때 합집합 픽셀만 세는 실패 테스트를 작성한다.
- [ ] `ai/.venv/Scripts/python.exe -m pytest ai/spa/tests/test_area_pixels.py -q`를 실행해 실패를 확인한다.
- [ ] NumPy 논리 OR로 마스크 합집합 픽셀을 세는 최소 구현을 작성한다.
- [ ] `room_json` payload에 계산 결과를 추가한다.
- [ ] 단위 테스트를 재실행해 통과를 확인한다.
- [ ] `feat(ai): expose total floorplan area pixels`로 커밋한다.

### Task 2: 백엔드 AI 응답 파싱

**Files:**
- Create: `backend/src/main/java/com/spaceup/domain/analysis/ai/client/AiFloorplanAnalysisResponse.java`
- Modify: `backend/src/main/java/com/spaceup/domain/analysis/ai/client/AiFloorplanRoom.java`
- Modify: `backend/src/main/java/com/spaceup/domain/analysis/ai/client/AiFloorplanAnalysisClient.java`
- Create: `backend/src/test/java/com/spaceup/domain/analysis/ai/client/AiFloorplanAnalysisClientTest.java`

**Interfaces:**
- Produces: `AiFloorplanAnalysisResponse(long totalAreaPixelCount, List<AiFloorplanRoom> rooms)`
- Produces: `AiFloorplanRoom(String roomName, int classId, long pixelCount)`

- [ ] 정상 JSON이 전체 픽셀과 방별 픽셀로 파싱되는 실패 테스트를 작성한다.
- [ ] 전체 픽셀 누락·0 이하와 방 픽셀 오류를 거부하는 실패 테스트를 작성한다.
- [ ] `backend/gradlew.bat test --tests '*AiFloorplanAnalysisClientTest'`로 실패를 확인한다.
- [ ] 응답 레코드와 엄격한 파싱·검증을 구현한다.
- [ ] 테스트를 재실행해 통과를 확인한다.
- [ ] `feat(backend): parse floorplan pixel counts`로 커밋한다.

### Task 3: 방별 면적 계산과 저장

**Files:**
- Modify: `backend/src/main/java/com/spaceup/domain/analysis/ai/service/AiFloorplanAnalysisService.java`
- Create: `backend/src/test/java/com/spaceup/domain/analysis/ai/service/AiFloorplanAnalysisServiceTest.java`

**Interfaces:**
- Consumes: `AiFloorplanAnalysisResponse`
- Produces: `AnalysisSpaceRequest.spaceAreaM2`

- [ ] 전용면적 84㎡, 전체 3000픽셀, 방 1000픽셀에서 28㎡가 전달되는 실패 테스트를 작성한다.
- [ ] `backend/gradlew.bat test --tests '*AiFloorplanAnalysisServiceTest'`로 실패를 확인한다.
- [ ] `exclusiveAreaM2 * pixelCount / totalAreaPixelCount` 계산을 구현한다.
- [ ] `spaceAreaM2`와 `floorAreaM2`에 계산 결과를 전달한다.
- [ ] 서비스 테스트와 백엔드 전체 테스트를 실행한다.
- [ ] `feat(backend): calculate room area from AI pixels`로 커밋한다.

### Task 4: 프론트엔드 연동 문서와 통합 검증

**Files:**
- Create: `docs/프론트엔드_방별면적_API_연동안내.md`

**Interfaces:**
- Produces: 공간 조회 API의 `spaceAreaM2` 사용법과 평 변환 공식

- [ ] AI 입력 JSON, 백엔드 저장 결과, 프론트 표시 공식을 문서화한다.
- [ ] `git diff --check`, AI 단위 테스트, 백엔드 전체 테스트를 실행한다.
- [ ] `docs: explain room area frontend integration`으로 커밋한다.

### Task 5: 브랜치 통합과 동기화

**Files:**
- Modify: Git refs only

**Interfaces:**
- Consumes: 검증된 `ai`, 원격 `backend`, `frontend`, `infra`
- Produces: 검증된 `develop`, `main`, 동기화된 네 하위 브랜치

- [ ] `ai`를 원격에 푸시한다.
- [ ] 최신 원격 네 하위 브랜치를 `develop`에 병합한다.
- [ ] 백엔드·프론트엔드·AI 검증을 실행한다.
- [ ] 검증된 `develop`을 `main`에 병합하고 푸시한다.
- [ ] 최신 `main`을 `ai`, `backend`, `frontend`, `infra`에 병합하고 각각 푸시한다.
