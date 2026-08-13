# Object Storage 평면도 분석 복구 설계

## 확인된 운영 장애

- 운영 DB의 `floorplan_variants`에는 `floorplans/floorplan1.png`부터 `floorplan4.png`까지 네 개 키가 연결돼 있다.
- 네 개 이미지 조회 API가 모두 HTTP 500을 반환한다.
- 운영 백엔드는 `AI_FLOORPLAN_BASE_URL=http://viewerwall:8000`으로 호출하지만 운영 Compose에는 `viewerwall`, `spa`, `ocr` 서비스가 없다.
- 현재 배포하는 `spaceup-ai` 이미지는 `/analysis` 목업 API이며 백엔드가 요구하는 `/api/analyze` 계약과 다르다.

## 목표 흐름

주소를 선택하면 정규화된 건물명 또는 주소로 내부 아파트 카탈로그를 조회한다. 등록 variant가 있으면 DB에 저장된 Object Storage key를 백엔드가 읽고, 동일한 바이트를 미리보기와 AI 분석에 사용한다. 직접 업로드도 저장된 파일을 읽은 뒤 같은 `viewerwall` 분석 계약을 사용한다.

## Object Storage 복구

- Object Storage가 활성화됐을 때 NCP 필수 설정이 없으면 애플리케이션 시작을 거부한다.
- PNG/JPEG/WebP를 실제 확장자에 맞는 Content-Type으로 응답한다.
- NCP 인증·접속 오류는 일반 500 대신 Object Storage 전용 예외로 구분한다.
- 배포 완료 조건에 등록 도면 variant 1~4의 HTTP 200 및 이미지 Content-Type 검사를 포함한다.
- 운영 비밀파일에는 `NCP_OBJECT_STORAGE_ENABLED=true`, endpoint, region, bucket, access key, secret key가 반드시 있어야 한다.

## AI 배포 복구

- CI가 `spaceup-ocr`, `spaceup-spa`, `spaceup-viewerwall` 이미지를 별도로 빌드·게시한다.
- SPA 이미지에는 저장소의 FP/CS 모델 파일을 포함한다.
- 운영 Compose는 OCR → SPA → viewerwall 의존성을 구성하고 백엔드는 viewerwall을 호출한다.
- 배포 스크립트는 세 이미지 pull/up, 각 health endpoint, viewerwall `/api/analyze` 경로 존재 여부를 검사한다.
- 기존 `spaceup-ai` 서비스는 다른 기능 호환을 위해 유지한다.

## 오류 처리

- Object Storage 파일 없음은 404이다.
- Object Storage 설정 누락은 시작 실패 또는 503이다.
- Object Storage 상위 서비스 오류는 502이다.
- AI 서비스 호출·응답 오류는 기존 502 계약을 유지하고 AnalysisJob을 FAILED로 전환한다.

## 테스트

- PNG/JPEG/WebP Content-Type 단위 테스트.
- NCP 조회 성공, 없는 key, S3 오류 매핑 테스트.
- 등록 도면과 직접 업로드가 같은 AI client 및 결과 저장 흐름을 통과하는 서비스 테스트.
- Docker Compose 렌더링 테스트에서 ai/ocr/spa/viewerwall/backend와 이미지·모델·의존성을 검증.
- 배포 스크립트 구문 검사와 운영 smoke check 항목 검증.

## 배포 완료 조건

- variant 1~4 이미지 API 모두 200.
- 등록 도면 분석 API 성공 및 분석 공간 저장.
- 직접 업로드 분석 API 성공 및 분석 공간 저장.
- 전체 backend/frontend/AI/배포 구성 검증 성공.
