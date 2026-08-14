# 도면 분석 결과 및 3D 미리보기 연결 설계

## 목표

주소 검색으로 선택한 아파트 평면도를 NCP Object Storage에서 한 번 읽고 AI로 한 번 분석한 뒤, 같은 결과로 다음 두 기능을 모두 제공한다.

- `/analysis/spaces`에서 방 이름, 방별 면적, 방·욕실 개수와 발코니 여부를 확인하고 수정한다.
- 같은 화면의 `원본 도면 / 3D 분석` 탭에서 분석된 벽과 공간 구획을 3D로 확인한다.

직접 업로드한 평면도도 같은 분석·저장·표시 경로를 사용한다.

## 현재 문제와 근거

현재 호출 흐름 자체는 프론트, 백엔드, AI 서비스에 존재하지만 세 경계가 끊겨 있다.

1. `AiFloorplanAnalysisClient`는 `contentType` 인자를 받으면서 multipart 파일 파트에는 적용하지 않는다. `viewerwall`의 `/api/analyze`는 파일 파트가 `image/png` 또는 `image/jpeg`가 아니면 HTTP 415를 반환한다.
2. `viewerwall` 내부 SPA/OCR 호출 제한은 각각 최대 240초인데 백엔드 읽기 제한은 30초, 프론트 제한은 45초, Nginx 제한은 90초다. 정상적인 장시간 추론도 중간 계층에서 먼저 종료될 수 있다.
3. AI 응답의 `rooms[].polygons`, `rooms[].viewer_polygons`, `bbox`, 이미지 크기 등 3D 데이터는 백엔드에서 방 요약과 면적으로 변환된 뒤 폐기된다. 프론트는 원본 이미지 URL만 전달받으므로 분석된 구획이나 3D를 복원할 수 없다.

## 검토한 접근법

### 1. 분석 결과 영속화 및 프론트 3D 렌더링 — 채택

AI 응답을 검증·정규화하고 분석 작업에 저장한다. 인증된 API로 결과를 다시 조회하며, 프론트의 Three.js 컴포넌트가 이를 렌더링한다.

- 장점: AI 추론 한 번, 새로고침 복구, 비공개 AI 서비스 유지, 공간 정보와 3D 데이터 일치
- 비용: DB 마이그레이션과 3D 컴포넌트가 필요함

### 2. viewerwall 공개 프록시 및 iframe

private 서버의 viewerwall을 public Nginx에 노출하고 iframe에서 별도로 이미지를 분석한다.

- 장점: 기존 viewerwall 화면을 거의 그대로 재사용
- 단점: 같은 도면을 두 번 추론하고 내부 AI 서비스 노출 면적이 커지며 인증과 라우팅이 복잡해짐

### 3. 브라우저 메모리로만 AI 결과 전달

분석 POST 응답의 3D 데이터를 라우터 state에 담는다.

- 장점: DB 변경이 적음
- 단점: 새로고침, 직접 진입, 다른 기기에서 결과를 복구할 수 없음

## 아키텍처

```text
주소 검색/직접 업로드
  -> 분석 작업 생성
  -> Object Storage 또는 연결 이미지에서 원본 바이트 로드
  -> 올바른 파일명과 image/* Content-Type으로 viewerwall 호출
  -> AI 응답 검증
       -> 요약/방별 면적 계산 및 기존 analysis_job/analysis_space 저장
       -> 정규화한 3D 시각화 JSON 저장
  -> COMPLETED
  -> /analysis/spaces가 요약, 공간 목록, 시각화 결과 조회
  -> 원본 도면 / 3D 분석 탭 표시
```

AI 서비스는 private Compose 네트워크 안에 유지한다. 브라우저는 viewerwall을 직접 호출하지 않고 Spring 백엔드의 인증·소유권 검사를 통과한 결과만 조회한다.

## 백엔드 설계

### multipart 계약 수정

`AiFloorplanAnalysisClient.analyze`는 `ByteArrayResource`를 그대로 body에 넣지 않는다. 파일 파트를 `HttpEntity<Resource>`로 감싸 다음 헤더를 명시한다.

- `Content-Disposition: form-data; name="file"; filename="<안전한 파일명>"`
- `Content-Type: image/png` 또는 `image/jpeg`

지원하지 않거나 비어 있는 Content-Type은 파일 확장자로 보정한다. PNG/JPEG가 아닌 값은 AI 호출 전에 도메인 예외로 거절한다.

### AI 응답 정규화

기존 요약 계산 필드에 더해 아래 3D 필드를 명시적인 DTO로 읽는다.

- 최상위: `image_width`, `image_height`, `total_area_pixel_count`
- 공간: `instance_id`, `room_name`, `display_name`, `class_id`, `pixel_count`, `included_in_total_area`, `bbox`
- 도형: `polygons`, `viewer_polygons`, `viewer_anchor`, `viewer_radius`

좌표는 유한한 0 이상의 정수이며 이미지 경계 안에 있어야 한다. 다각형은 점이 3개 이상인 것만 저장한다. 3D에 필요한 유효 공간이 하나도 없으면 분석을 성공으로 처리하지 않고 `FAILED`로 전환한다. 저장 DTO는 AI의 디버그 필드와 내부 구현 세부사항을 제외한다.

### 저장 구조

Flyway `V7`에서 `analysis_job.floorplan_visualization_json JSON NULL` 컬럼을 추가한다. 기존 분석 행은 `NULL`을 유지하며, 신규 분석 또는 재분석 완료 시 정규화한 JSON으로 교체한다.

분석 성공 트랜잭션은 다음 결과를 함께 반영한다.

- 분석 요약과 `COMPLETED` 상태
- `analysis_space` 전체 교체
- 3D 시각화 JSON 교체

분석 실패 시 상태를 `FAILED`로 바꾸며 이전 실패 시도의 불완전한 시각화 JSON은 제거한다.

### API

기존 분석 시작 API는 유지한다.

- `POST /api/analysis/request/{requestId}/floorplan-scan-storage`
- `POST /api/analysis/request/{requestId}/floorplan-scan-linked`
- `POST /api/analysis/request/{requestId}/floorplan-scan`

조회 API를 추가한다.

- `GET /api/analysis/request/{requestId}/floorplan-visualization`
- 성공: 정규화된 `FloorplanVisualizationResponse`
- 분석 미완료 또는 기존 결과 없음: HTTP 409
- 다른 임대인의 의뢰: HTTP 403
- 없는 의뢰: HTTP 404

### 시간 제한

1차 연결 작업에서는 현재 동기 호출을 유지하되 계층별 제한을 안쪽보다 바깥쪽이 길게 정렬한다.

- viewerwall의 SPA/OCR 내부 제한: 기존 240초 유지
- 백엔드 AI 읽기 제한: 300초
- Nginx `/api/` 읽기·전송 제한: 330초
- 프론트 분석 요청 제한: 360초

2차 작업에서 동기 HTTP를 백그라운드 실행과 상태 폴링으로 교체한다.

## 프론트엔드 설계

### 공간 정보 화면

`/analysis/spaces` 상단 도면 영역에 접근 가능한 탭을 둔다.

- `원본 도면`: 현재 Object Storage 이미지 미리보기
- `3D 분석`: 저장된 시각화 JSON을 Three.js로 렌더링

기본 탭은 `원본 도면`이다. 3D 탭을 처음 선택할 때 시각화 API를 호출하고 같은 페이지 체류 중에는 결과를 재사용한다. 새로고침하면 API로 다시 조회하므로 AI 추론은 재실행하지 않는다.

### 3D 컴포넌트

`three`를 고정 버전 애플리케이션 의존성으로 추가한다. 외부 CDN import map은 사용하지 않는다. 컴포넌트는 다음 책임만 가진다.

- `viewer_polygons` 우선, 없으면 `polygons`, 마지막으로 `bbox`를 사용해 바닥과 벽을 생성
- 마우스/터치 회전, 확대·축소, 초기화
- 공간 이름과 계산된 면적 표시
- 컴포넌트 unmount 시 geometry, material, renderer와 이벤트 리스너 해제

기존 viewerwall의 모델 수정 없이 검증된 좌표 우선순위와 카메라 동작을 포팅한다. 파일 업로드와 AI 호출 코드는 포팅하지 않는다.

WebGL을 사용할 수 없거나 시각화 결과가 없는 경우 원본 도면 탭은 계속 사용할 수 있으며, 3D 탭에는 재분석 안내를 표시한다.

## 오류 처리와 재시도

- 415: 지원 이미지 형식 또는 multipart Content-Type 문제로 구분해 기록
- AI 연결 실패/시간 초과/잘못된 JSON: `FAILED` 전환, 사용자에게 재시도 제공
- 3D JSON만 누락된 기존 완료 작업: 공간 정보는 유지하고 3D 탭에서 재분석 안내
- 재시도: 같은 `analysis_job`을 `PENDING`으로 되돌리고 기존 시각화 JSON을 제거한 뒤 전체 분석 재실행
- 브라우저가 응답 전에 끊겨도 서버가 성공 완료했다면 재진입 시 저장 결과를 조회 가능

운영 로그에는 `requestId`, `analysisJobId`, 처리 단계, 소요 시간, AI HTTP 상태만 남긴다. Object Storage 키, 인증 토큰, 이미지 바이트는 기록하지 않는다.

## 보안

- 시각화 API는 기존 분석 조회와 동일한 로그인 및 의뢰 소유권 검사를 적용한다.
- viewerwall, OCR, SPA는 public Nginx에 직접 노출하지 않는다.
- AI 응답은 허용 필드만 정규화해 저장하고 프론트로 전달한다.
- 이미지 파일명은 경로 구분자와 제어문자를 제거한 basename만 사용한다.

## 테스트 전략

### 백엔드

- multipart 파일 파트가 실제 `image/png` 또는 `image/jpeg`로 전송되는지 검사
- 잘못된 Content-Type이 AI 호출 전에 거절되는지 검사
- 유효 AI 응답이 요약, 공간, 시각화 JSON을 함께 저장하는지 검사
- 잘못된 좌표, 빈 다각형, 필수 필드 누락을 거절하는지 검사
- 시각화 조회의 성공, 403, 404, 409 계약 검사
- 실패 후 재시도가 기존 불완전 결과를 제거하는지 검사

### 프론트엔드

- 공간 정보 화면에서 두 탭이 표시되고 기본 탭이 원본인지 검사
- 3D 탭 최초 진입 시 한 번만 시각화 API를 호출하는지 검사
- 유효한 다각형 데이터가 렌더러 입력으로 전달되는지 검사
- 결과 없음과 WebGL 실패 시 원본 도면과 안내 문구가 유지되는지 검사
- 새로고침 복구 시 AI 분석 POST를 다시 호출하지 않는지 검사

### 배포

- Compose에서 backend가 viewerwall에 접근하는지 검사
- 실제 PNG를 이용한 viewerwall `/api/analyze` 통합 헬스체크 추가
- main 배포 전 테스트 계정으로 주소 검색부터 공간 정보·3D 탭까지 확인

## 배포 순서

1. `ai` 브랜치에서 단위·통합 테스트와 프론트 빌드 통과
2. `develop` 병합 후 전체 CI 통과
3. `main` fast-forward 후 이미지 빌드 확인
4. private 서버 배포 및 AI 서비스 내부 헬스체크
5. public 서버 배포
6. 등록 도면 4장과 직접 업로드 1장으로 공간 정보와 3D 결과 검증

## 다음 작업

1. 분석 실행을 백그라운드 작업으로 전환하고 프론트는 상태를 폴링한다.
2. `pipeline_version`과 원본 이미지 해시를 저장해 같은 도면·같은 모델 결과를 재사용한다.
3. AI 단계별 처리시간, 415/5xx/timeout 횟수, 실패 원인을 메트릭으로 수집한다.
4. 분석 결과의 방 이름과 다각형을 사용자가 수정하고 수정 이력을 저장할 수 있게 한다.
5. 모바일 저사양 기기를 위한 2D 구획 미리보기와 3D 품질 단계를 추가한다.

## 완료 기준

- 등록 평면도와 직접 업로드 평면도 모두 분석이 완료된다.
- 공간 이름과 면적이 `/analysis/spaces`에 표시된다.
- 같은 분석 결과로 3D 탭이 표시되며 탭 전환이나 새로고침이 AI 재분석을 유발하지 않는다.
- 다른 사용자는 시각화 결과를 조회할 수 없다.
- 분석 실패 시 `FAILED`와 재시도 동작이 일관된다.
- 관련 백엔드·프론트·배포 테스트와 빌드가 모두 통과한다.
