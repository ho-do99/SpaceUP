# SpaceUP 프로젝트 초기 구조 설계

## 목표

`SpaceUP`을 React/Vite/TypeScript 프런트엔드, Spring Boot/Gradle 백엔드,
FastAPI AI 분석 서버로 나눈 모노레포로 초기화한다. 저장소를 받은 팀원이 각
서비스를 독립적으로 확장할 수 있도록 요청된 디렉터리와 최소 실행 가능한
설정 파일을 제공한다.

## Git 브랜치 전략

- `main`: 배포 및 안정 버전 기준 브랜치
- `develop`: 기능 통합 브랜치이며 `main`에서 분기
- `ai`, `backend`, `frontend`: 담당 영역 개발 브랜치이며 모두 `develop`에서 분기
- 최초 스캐폴딩 커밋은 모든 브랜치가 공유한다.
- 원격 저장소는 `https://github.com/ho-do99/SpaceUP.git`을 `origin`으로 사용한다.
- 원격에 기존 커밋이 있다면 강제 푸시하지 않고 이력을 확인한 뒤 안전하게 통합한다.

## 저장소 구조

```text
SpaceUP/
├── frontend/
│   ├── public/images/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/
│   │   ├── types/
│   │   ├── router/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── .env.local
│   ├── .env.dev
│   ├── Dockerfile.local
│   ├── Dockerfile.dev
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/
│   ├── src/main/java/com/spaceup/
│   │   ├── SpaceUpApplication.java
│   │   ├── config/
│   │   ├── member/
│   │   ├── housing/
│   │   ├── floorplan/
│   │   ├── analysis/
│   │   ├── estimate/
│   │   ├── report/
│   │   ├── contractor/
│   │   └── quotation/
│   ├── src/main/resources/
│   ├── src/test/
│   ├── Dockerfile.local
│   ├── Dockerfile.dev
│   ├── build.gradle
│   ├── settings.gradle
│   ├── gradlew
│   └── gradlew.bat
├── ai/
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/
│   │   ├── services/
│   │   └── models/
│   ├── Dockerfile.local
│   ├── Dockerfile.dev
│   └── requirements.txt
├── database/init.sql
├── nginx/
│   ├── local.conf
│   └── dev.conf
├── storage/
│   ├── floorplans/
│   ├── reports/
│   └── images/
├── docker-compose.local.yml
├── docker-compose.dev.yml
├── .env.local
├── .env.dev
├── .env.example
├── .gitignore
└── README.md
```

Git이 빈 디렉터리를 추적하지 않으므로 코드가 아직 없는 도메인 패키지와 저장소
디렉터리에는 `.gitkeep`을 둔다. 사용자가 이미 보유한 루트 `Docs/`와 `tmp/`
내용은 삭제하지 않고 초기 원격 커밋 대상에서도 제외한다.

## 서비스별 초기 범위

### Frontend

- 기존 React/Vite/TypeScript 설정과 공통 컴포넌트를 보존한다.
- 요청된 페이지, API 모듈, 타입 파일을 추가한다.
- 라우터가 모든 초기 페이지를 연결하며, 구현 전 화면은 명확한 자리표시자로 표시한다.
- Axios 기본 URL은 Vite 환경 변수에서 읽는다.

### Backend

- Spring Boot 애플리케이션과 CORS/보안 기본 설정을 제공한다.
- 각 업무 도메인은 독립 패키지로 생성한다.
- 초기 상태에서는 인증이나 실제 데이터 모델을 임의로 구현하지 않는다.
- 환경별 YAML은 데이터베이스와 AI 서버 주소를 환경 변수로 받는다.

### AI

- FastAPI 앱이 상태 확인 및 분석 요청 라우트를 제공한다.
- OCR과 세그멘테이션 서비스는 확장 가능한 인터페이스와 안전한 자리표시자 응답만 제공한다.
- 모델 바이너리는 커밋하지 않고 `models/.gitkeep`만 추적한다.

### 인프라

- 로컬과 개발 환경을 분리한 Dockerfile, Compose, Nginx 설정을 제공한다.
- MySQL 초기화 스크립트는 기본 데이터베이스 생성에 필요한 최소 내용만 둔다.
- `.env` 파일에는 비밀값을 넣지 않고 개발용 예시값만 사용한다.
- 업로드 및 생성 결과 디렉터리는 구조만 추적하고 실제 산출물은 무시한다.

## 오류 처리

- 프런트엔드 API 모듈은 Axios 오류를 호출자가 처리할 수 있도록 그대로 전달한다.
- 백엔드와 AI 서버는 상태 확인 엔드포인트를 제공한다.
- 분석 기능은 아직 실제 모델이 없음을 응답에 명확히 나타낸다.
- 환경 변수가 누락돼도 로컬 개발용 기본값으로 시작할 수 있게 구성한다.

## 검증 기준

- 요청된 모든 경로가 존재하고 Git에 필요한 빈 디렉터리가 추적된다.
- 프런트엔드 TypeScript 빌드가 성공한다.
- 백엔드 Gradle 테스트가 성공한다.
- AI Python 모듈을 컴파일할 수 있고 FastAPI 라우트 테스트가 성공한다.
- 두 Compose 파일이 `docker compose config` 검증을 통과한다.
- `main`, `develop`, `ai`, `backend`, `frontend`가 원격에 존재한다.
- 최종 `git status`에는 의도하지 않은 추적 변경이 없다.
