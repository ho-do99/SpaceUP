# SpaceUP 프로젝트 초기 구조 설계

## 목표

AI 평면도 분석 기반 인테리어 리포트 및 시공 중개 플랫폼 SpaceUP의 로컬·개발 환경에서 실행 가능한 모노레포 골격을 구성한다.

## 범위

- React, Vite, TypeScript, Tailwind CSS 3 기반 프런트엔드
- Spring Boot, Gradle 기반 백엔드
- FastAPI 기반 AI 분석 서버
- Nginx 기반 단일 진입점과 리버스 프록시
- MySQL 데이터베이스
- Docker 및 Docker Compose 기반 실행 환경
- 환경 변수 예시와 실행 문서

현재 범위에서는 실제 OCR·세그멘테이션 모델, 인증, 도메인 기능, Redis, 메시지 큐, 오브젝트 스토리지, GitHub Actions를 구현하지 않는다.

## 디렉터리 구조

```text
SpaceUP/
├─ frontend/
├─ backend/
├─ ai-server/
├─ nginx/
├─ docker-compose.local.yml
├─ docker-compose.dev.yml
├─ .env.example
└─ README.md
```

서비스별 내부 파일은 각 런타임의 표준 구조를 따른다. 프런트엔드는 Vite의 `src` 구조, 백엔드는 Gradle의 `src/main`·`src/test` 구조, AI 서버는 FastAPI의 `app`·`tests` 구조를 사용한다.

## 서비스 구성

### Frontend

- React와 TypeScript로 기본 화면을 제공한다.
- Vite 개발 서버를 사용한다.
- Tailwind CSS 3을 PostCSS 플러그인으로 구성한다.
- `/api`와 `/ai` 요청은 동일 출처의 Nginx 경로를 사용한다.
- 상태 확인용 기본 화면에서 백엔드 및 AI 서버 연결 상태를 확인할 수 있다.

### Backend

- Java 21과 Spring Boot 3 계열을 사용한다.
- Gradle Wrapper로 빌드 도구 버전을 고정한다.
- Spring Web, Validation, Spring Data JPA, MySQL Driver, Actuator를 포함한다.
- `/api/health`에서 서비스 상태를 반환한다.
- 데이터베이스 연결 정보와 AI 서버 주소는 환경 변수로 주입한다.

### AI Server

- Python과 FastAPI를 사용한다.
- `/health`에서 서비스 상태를 반환한다.
- 향후 OCR, 전처리, 공간 세그멘테이션 기능을 분리할 수 있도록 `api`, `core`, `schemas`, `services` 경계를 둔다.
- 현재는 실제 모델을 내려받거나 가중치를 포함하지 않는다.

### Nginx

- `/` 요청은 프런트엔드로 전달한다.
- `/api/` 요청은 Spring Boot로 전달하며 `/api` 경로를 유지한다.
- `/ai/` 요청은 FastAPI로 전달하며 FastAPI에는 `/` 이하 경로로 전달한다.
- 업로드될 평면도 PDF와 이미지에 대비해 요청 본문 크기 제한을 설정한다.

### MySQL

- MySQL 8.4 계열을 사용한다.
- 데이터베이스명, 사용자명, 비밀번호는 환경 변수로 설정한다.
- 로컬 데이터는 Docker 볼륨으로 유지한다.
- 초기 프로젝트에서는 JPA가 스키마를 갱신하도록 하되 운영 환경 설정으로 간주하지 않는다.

## 실행 환경

### `docker-compose.local.yml`

개발자의 소스 수정이 즉시 반영되는 환경이다. 프런트엔드는 Vite 개발 서버, AI 서버는 Uvicorn reload 모드, 백엔드는 Gradle `bootRun`을 사용하며 소스와 Gradle 캐시를 볼륨으로 연결한다.

### `docker-compose.dev.yml`

통합 개발 서버와 유사한 환경이다. 각 서비스의 Dockerfile로 이미지를 빌드하며 소스 볼륨과 핫 리로드를 사용하지 않는다. Nginx를 외부 진입점으로 사용하고 각 내부 서비스는 Docker 네트워크에서만 통신한다.

## 요청 흐름

```text
Browser
  └─ Nginx :80
      ├─ /      → Frontend
      ├─ /api/* → Spring Boot :8080
      └─ /ai/*  → FastAPI :8000

Spring Boot
  ├─ MySQL :3306
  └─ FastAPI :8000
```

## 오류 처리와 상태 확인

- 모든 컨테이너에는 가능한 범위에서 헬스 체크를 둔다.
- Nginx는 시작 순서가 아니라 서비스 이름 기반 네트워크 연결을 사용한다.
- 백엔드와 AI 서버의 기본 API는 구조화된 JSON을 반환한다.
- 비밀 값은 저장소에 포함하지 않고 `.env.example`에 개발용 예시만 제공한다.

## 검증 기준

- Gradle 테스트가 통과한다.
- FastAPI 테스트가 통과한다.
- 프런트엔드 타입 검사와 프로덕션 빌드가 통과한다.
- 두 Compose 파일 모두 `docker compose config` 검증을 통과한다.
- 통합 실행 시 Nginx를 통해 프런트엔드, `/api/health`, `/ai/health`에 접근할 수 있다.

## 향후 확장

GitHub Actions는 이번 작업에서 생성하지 않는다. 추후 프런트엔드 빌드·테스트, 백엔드 Gradle 테스트, AI 서버 테스트, Docker 이미지 빌드와 배포 단계를 추가할 수 있도록 각 서비스를 독립적으로 빌드 가능한 구조로 유지한다.
