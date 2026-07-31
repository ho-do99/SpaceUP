# SpaceUP

AI 평면도 분석을 기반으로 예상 인테리어 견적, 주택 가치 리포트, 시공사
연결 기능을 제공하기 위한 모노레포입니다.

## 구성

```text
SpaceUP/
├── frontend/   React + Vite + TypeScript
├── backend/    Spring Boot + Gradle
├── ai/         FastAPI
├── database/   MySQL 초기화 스크립트
├── nginx/      환경별 리버스 프록시 설정
├── storage/    업로드 및 생성 파일
├── docker-compose.local.yml
└── docker-compose.dev.yml
```

## 요구 사항

- Docker Desktop 및 Docker Compose
- 개별 실행 시 Node.js 20+, Java 21, Python 3.11+

저장소의 `.env.local`과 `.env.dev`는 개발용 예시값만 포함합니다. 배포 환경에서는
반드시 데이터베이스 비밀번호를 별도 비밀 저장소에서 주입하세요.

## 로컬 개발 환경

소스 변경을 즉시 반영하는 개발 서버를 실행합니다.

```bash
docker compose --env-file .env.local -f docker-compose.local.yml up --build
```

- 통합 진입점: `http://localhost`
- 프런트엔드 직접 접속: `http://localhost:5173`
- Spring Boot: `http://localhost:8080`
- FastAPI: `http://localhost:8000`
- FastAPI 상태 확인: `http://localhost/ai/health`

종료:

```bash
docker compose --env-file .env.local -f docker-compose.local.yml down
```

## 개발 서버형 환경

소스를 이미지로 빌드하고 Nginx만 외부에 노출합니다.

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml up --build -d
```

종료:

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml down
```

## 개별 검증

```bash
cd frontend
npm install
npm run build
```

```bash
cd backend
./gradlew test
```

```bash
python -m venv ai/.venv
ai/.venv/Scripts/python -m pip install -r ai/requirements.txt
ai/.venv/Scripts/python -m pytest ai/tests -q
```

## 브랜치

- `main`: 안정 및 배포 기준
- `develop`: 통합 개발
- `ai`: AI 서버 작업
- `backend`: Spring Boot 작업
- `frontend`: React 작업

`ai`, `backend`, `frontend`는 `develop`에서 분기하며, 기능 완료 후
`develop`에 통합합니다.
