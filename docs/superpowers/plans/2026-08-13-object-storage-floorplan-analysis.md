# Object Storage Floorplan Analysis Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** NCP Object Storage의 등록 도면과 직접 업로드 도면을 실제 OCR/SPA/viewerwall 파이프라인으로 분석한다.

**Architecture:** 백엔드는 Object Storage key 또는 업로드 파일에서 바이트를 읽은 뒤 공통 AI client로 전달한다. 운영 환경에는 OCR, SPA, viewerwall을 독립 컨테이너로 배포하고 배포 전후 검증에서 스토리지 도면과 AI health를 확인한다.

**Tech Stack:** Spring Boot, AWS SDK S3, JUnit/Mockito, FastAPI, Docker Compose, GitHub Actions

## Global Constraints

- 실제 자격증명은 저장소에 커밋하지 않는다.
- Object Storage bucket은 private 상태를 유지한다.
- 브라우저가 NCP URL을 직접 호출하지 않는다.
- 기존 API URL과 요청 형식은 유지한다.

### Task 1: Object Storage 이미지 제공

- [ ] 실패 테스트로 PNG/JPEG/WebP Content-Type과 NCP 오류 매핑을 재현한다.
- [ ] 서비스가 이미지 resource와 media type을 함께 반환하게 수정한다.
- [ ] 설정 오류 503, 상위 스토리지 오류 502 예외 계약을 추가한다.
- [ ] 관련 백엔드 테스트를 통과시키고 커밋한다.

### Task 2: 공통 분석 흐름

- [ ] 등록 도면과 직접 업로드가 동일한 AI client/result 저장 경로를 타는 회귀 테스트를 보강한다.
- [ ] 실패 원인이 AnalysisJob FAILED로 보존되는지 검증한다.
- [ ] 관련 테스트를 통과시키고 커밋한다.

### Task 3: 운영 AI 컨테이너 구성

- [ ] 배포 Compose 테스트를 먼저 추가해 OCR/SPA/viewerwall 누락을 RED로 확인한다.
- [ ] OCR Dockerfile을 공개 base에서 재현 가능하게 만들고 필요한 모델·코드를 포함한다.
- [ ] SPA Dockerfile에 FP/CS 모델을 포함한다.
- [ ] CI에 세 이미지 빌드·게시를 추가한다.
- [ ] 운영 Compose와 배포 스크립트에 서비스·health·rollback을 추가한다.
- [ ] 구성 테스트를 통과시키고 커밋한다.

### Task 4: 전체 검증과 배포

- [ ] backend clean test, frontend test/lint/build, AI tests를 실행한다.
- [ ] Dockerfile build 또는 최소 구성 검증을 실행한다.
- [ ] ai를 push하고 CI 이미지 게시 성공을 확인한다.
- [ ] main과 팀 브랜치를 Fast-forward 동기화한다.
- [ ] 운영 배포 workflow를 실행한다.
- [ ] variant 1~4 이미지 200과 실제 분석 경로를 검증한다.
