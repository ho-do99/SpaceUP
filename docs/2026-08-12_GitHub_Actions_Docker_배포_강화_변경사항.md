# SpaceUP GitHub Actions·Docker 배포 강화 변경사항

- 작성일: 2026-08-12
- 대상 저장소: `ho-do99/SpaceUP`
- 대상 브랜치: `infra`, `main`
- 운영 도메인: `spaceup.duckdns.org`
- 기존 도메인: `101.79.26.89.sslip.io`
- 상태: **로컬 작성 및 정적 검증 완료 / 커밋·푸시·서버 적용 전**

## 1. 결론

이번 변경은 애플리케이션 기능 코드를 수정한 작업이 아니다. 백엔드·프론트엔드·AI 기능 코드는 변경하지 않았고 다음 배포 관련 파일만 추가 또는 수정했다.

- GitHub Actions CI 및 수동 운영 배포
- 운영 역할별 Docker Compose 파일
- 운영 Nginx 설정
- 배포 전 검증, 동시 실행 차단, 상태 확인, 실패 시 이전 이미지 복구 스크립트
- PUB/PRI 서버 설정 예시 파일

기존처럼 `main`에 push되면 바로 운영 서버에서 컨테이너를 먼저 삭제하고 다시 빌드하는 방식은 제거했다. 새 방식은 테스트가 통과한 커밋을 SHA 태그의 불변 Docker 이미지로 만든 후, 관리자가 수동 배포를 시작하고 GitHub Environment 승인을 통과한 경우에만 PRI와 PUB 순서로 배포한다.

## 2. 변경 파일과 담당 영역

| 파일 | 변경 내용 | 주 담당 |
|---|---|---|
| `.github/workflows/ci.yml` | 백엔드, 프론트, 핵심 AI, 배포 설정 검사와 GHCR 이미지 발행 | 공통/인프라 |
| `.github/workflows/deploy.yml` | 수동 운영 배포, 승인 분리, 이미지 확인, SSH 고정 호스트 검증, 배포 후 외부 점검 | 인프라 |
| `deploy/compose.private.yml` | PRI에서 핵심 AI와 백엔드만 실행 | 인프라/백엔드 |
| `deploy/compose.public.yml` | PUB에서 프론트엔드와 Nginx만 실행 | 인프라/프론트 |
| `deploy/nginx.production.conf.template` | 공식 도메인 TLS, API/AI 프록시, 기존 도메인 TLS 및 301 이동 | 인프라 |
| `deploy/scripts/common.sh` | 입력값, 커밋, 브랜치, GHCR 주소, HTTP 상태 검사 공통 함수 | 인프라 |
| `deploy/scripts/deploy-private.sh` | DB 3307 및 PRI 바인딩 강제, 이미지 선행 pull, 백엔드 상태 검사와 이미지 복구 | 인프라/백엔드 |
| `deploy/scripts/deploy-public.sh` | 인증서·도메인 일치 검사, Nginx 사전 검사, HTTPS/API/기존 도메인 이동 검사 | 인프라 |
| `deploy/examples/spaceup-private.env.example` | PRI 배포 설정 예시 | 인프라 |
| `deploy/examples/spaceup-public.env.example` | PUB 배포 설정 예시 | 인프라 |

`deploy/backend-rental-column-cleanup.zip`은 기존 파일이며 이번 작업 대상이 아니다. 커밋할 때 `git add deploy`처럼 폴더 전체를 추가하지 말고 위 파일만 정확히 지정해야 한다.

## 3. 새 배포 흐름

1. `infra` 또는 `main`에 코드가 push된다.
2. GitHub Actions가 다음 검사를 수행한다.
   - 백엔드: Java 21, Gradle 테스트, `bootJar`
   - 프론트: Node.js 22, 테스트, ESLint, 개발 빌드
   - 핵심 AI: Python 3.11, pytest
   - 배포 파일: Bash 문법 및 Docker Compose 렌더링
3. 모든 검사가 성공하면 아래 이미지를 GHCR에 커밋 SHA 태그로 발행한다.
   - `ghcr.io/ho-do99/spaceup-backend:<40자리 커밋 SHA>`
   - `ghcr.io/ho-do99/spaceup-frontend:<40자리 커밋 SHA>`
   - `ghcr.io/ho-do99/spaceup-ai:<40자리 커밋 SHA>`
4. 관리자가 `Deploy production` 워크플로를 수동 실행한다.
5. 세 이미지가 모두 존재하는지 먼저 확인한다.
6. `production-private` 승인을 받은 후 PUB를 경유하여 PRI에 배포한다.
7. PRI 백엔드 API가 정상일 때만 `production-public` 단계로 이동한다.
8. `production-public` 승인을 받은 후 PUB의 프론트엔드와 Nginx를 배포한다.
9. 외부 GitHub 러너에서 공식 HTTPS, API, 기존 도메인의 인증서 및 301 이동을 다시 검사한다.

동일한 시각에 운영 배포가 두 개 실행되지 않도록 `spaceup-production` 동시 실행 잠금을 적용했다. 서버 내부에서도 `flock`으로 PUB와 PRI 배포의 중복 실행을 각각 차단한다.

## 4. 보안상 달라진 점

### 4.1 GitHub Action 공급망

외부 Action은 버전 이름만 쓰지 않고 확인한 40자리 커밋 SHA로 고정했다. 태그가 나중에 다른 커밋을 가리키더라도 승인하지 않은 코드가 자동 실행되는 위험을 낮춘다.

| Action | 고정 버전 | 커밋 SHA |
|---|---:|---|
| `actions/checkout` | 6.0.2 | `de0fac2e4500dabe0009e67214ff5f5447ce83dd` |
| `actions/setup-java` | 5.6.0 | `03ad4de0992f5dab5e18fcb136590ce7c4a0ac95` |
| `actions/setup-node` | 6.0.0 | `2028fbc5c25fe9cf00d9f06a71cc4710d4507903` |
| `actions/setup-python` | 6.2.0 | `a309ff8b426b58ec0e2a45f0f869d46889d02405` |
| `docker/login-action` | 3.6.0 | `5e57cd118135c172c3672efd75eb46360885c0ef` |
| `docker/setup-buildx-action` | 3.11.1 | `e468171a9de216ec08956ac3ada2f0791b6bd435` |
| `docker/build-push-action` | 6.19.2 | `10e90e3645eae34f1e60eeb005ba3a3d33f178e8` |

기존의 `appleboy/ssh-action@v1.0.3`은 제거하고 GitHub 러너의 기본 SSH 클라이언트를 사용한다.

### 4.2 SSH

- `StrictHostKeyChecking=yes`를 강제한다.
- GitHub Secret에 등록한 정확한 서버 호스트 키가 없으면 접속하지 않는다.
- 비밀번호 인증 대신 이 배포 전용 SSH 키를 사용한다.
- PRI는 외부에 직접 공개하지 않고 PUB를 ProxyJump 방식의 경유 서버로 사용한다.
- SSH 키와 호스트 키는 Environment 승인 전에는 배포 Job에 제공되지 않는다.

### 4.3 Docker 이미지

- 운영 서버에서 매번 소스 빌드를 하지 않는다.
- CI가 한 번 만든 동일한 이미지를 PUB/PRI가 받는다.
- `latest` 대신 40자리 커밋 SHA를 사용한다.
- 이미지에는 빌드한 저장소와 커밋 정보를 OCI 라벨로 기록한다.
- SBOM과 빌드 출처 증명을 생성하도록 설정했다.
- 새 이미지를 완전히 pull한 후에만 실행 컨테이너를 교체한다.

### 4.4 애플리케이션 비밀값

GEMINI 키, DB 비밀번호, JWT 비밀값 등 애플리케이션 비밀은 GitHub 워크플로·Compose·문서에 넣지 않는다. PRI의 기존 `/home/ubuntu/spaceup-secret.env`에만 유지한다. 로그나 채팅에 파일 내용을 출력하면 안 된다.

## 5. GitHub에서 최초 1회 설정

### 5.1 GHCR 패키지 확인

첫 CI push 후 생성되는 `spaceup-backend`, `spaceup-frontend`, `spaceup-ai` 패키지가 **Private**인지 각각 확인한다. 패키지 설정에서 저장소 `ho-do99/SpaceUP`에 Actions 접근 권한도 부여한다.

GitHub Actions 안에서는 장기 PAT 대신 해당 실행의 `GITHUB_TOKEN`으로 이미지를 발행한다. 운영 서버가 private 이미지를 pull할 때만 `read:packages` 범위의 Personal access token (classic)을 사용한다.

공식 참고: <https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry>

### 5.2 Environment 생성

저장소의 `Settings → Environments`에서 다음 두 환경을 만든다.

1. `production-private`
2. `production-public`

두 환경 모두 다음 보호 설정을 권장한다.

- Required reviewers 지정
- Prevent self-review 활성화
- 관리자 우회 비활성화 가능 시 적용
- Deployment branches는 `infra`와 `main`만 허용

주의: 비공개 저장소에서 Environment secrets 또는 Required reviewers를 사용할 수 있는지는 GitHub 요금제에 따라 다르다. 기능이 보이지 않는 상태에서 무작정 배포하지 말고 저장소 공개 범위와 요금제를 먼저 확인해야 한다.

공식 참고: <https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments>

### 5.3 Environment Secret 등록

`production-private`:

| 이름 | 값의 의미 |
|---|---|
| `PUBLIC_HOST` | PUB 서버의 접속 가능한 공인 IP 또는 검증된 호스트명 |
| `PRIVATE_HOST` | PRI 서버의 사설 IP `10.10.20.6` |
| `SSH_USER` | 배포 전용 SSH 사용자. 현재 구조상 `/root/SpaceUP` 접근 권한 필요 |
| `SSH_PRIVATE_KEY` | 이번 배포에만 사용하는 전용 개인키 전체 내용 |
| `SSH_KNOWN_HOSTS` | PUB와 PRI의 검증된 SSH 호스트 키 두 줄 이상 |

`production-public`:

| 이름 | 값의 의미 |
|---|---|
| `PUBLIC_HOST` | PUB 서버의 공인 IP 또는 검증된 호스트명 |
| `SSH_USER` | PUB 배포 사용자 |
| `SSH_PRIVATE_KEY` | 배포 전용 개인키 전체 내용 |
| `SSH_KNOWN_HOSTS` | PUB의 검증된 SSH 호스트 키 |

개인적으로 쓰던 SSH 개인키를 재사용하지 않는다. 배포 전용 키를 새로 만들고 두 서버의 `authorized_keys`에는 공개키만 등록한다. 현재 서버가 `root`와 `/root/SpaceUP`을 사용하므로 키가 유출되면 영향이 매우 크다. 가능하면 추후 전용 배포 사용자와 전용 저장소 경로로 분리해야 한다.

호스트 키는 `ssh-keyscan` 결과를 그대로 믿으면 안 된다. NCP 콘솔로 각 서버에 직접 접속하여 다음과 같이 실제 지문을 확인하고, 별도로 수집한 known_hosts 키의 지문과 대조한 뒤 Secret에 등록한다.

```bash
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

## 6. 서버에서 최초 1회 설정

### 6.1 PRI 설정

`deploy/examples/spaceup-private.env.example`을 참고하여 다음 파일을 만든다.

```text
/home/ubuntu/spaceup-private.env
```

핵심 확인값:

- `COMPOSE_PROJECT_NAME=spaceup-local`
- `BACKEND_BIND_HOST=10.10.20.6`
- `AI_BIND_HOST=10.10.20.6`
- `DB_PORT=3307`
- `SPACEUP_SECRET_ENV=/home/ubuntu/spaceup-secret.env`

기존 애플리케이션 비밀 파일에도 `DB_PORT=3307`이 정확히 있어야 한다. 배포 스크립트는 3306 또는 빈 값을 허용하지 않는다.

### 6.2 PUB 설정

`deploy/examples/spaceup-public.env.example`을 참고하여 다음 파일을 만든다.

```text
/home/ubuntu/spaceup-public.env
```

핵심 확인값:

- `COMPOSE_PROJECT_NAME=spaceup-dev`
- `DOMAIN=spaceup.duckdns.org`
- `LEGACY_DOMAIN=101.79.26.89.sslip.io`
- `BACKEND_HOST=10.10.20.6`
- `AI_HOST=10.10.20.6`
- 두 도메인의 인증서 경로가 서로 섞이지 않아야 함

두 설정 파일 모두 일반 사용자에게 공개되지 않도록 권한을 제한한다.

```bash
chmod 600 /home/ubuntu/spaceup-private.env
chmod 600 /home/ubuntu/spaceup-public.env
```

각 명령은 해당 파일이 존재하는 서버에서만 실행한다.

### 6.3 두 서버에서 GHCR 로그인

GitHub의 Personal access token (classic)을 만들되 `read:packages`만 부여한다. 토큰 소유 계정은 private 패키지를 읽을 권한이 있어야 한다. 토큰을 명령줄 인수나 셸 히스토리에 직접 적지 않는다.

```bash
read -rsp 'GHCR token: ' CR_PAT
printf '%s' "$CR_PAT" | docker login ghcr.io -u GITHUB_USERNAME --password-stdin
unset CR_PAT
```

PUB와 PRI 모두 이미지 pull이 필요하므로 두 서버에서 각각 한 번 수행한다. 로그인 정보가 저장되는 Docker 설정 파일의 소유자와 권한도 확인한다.

## 7. 실제 배포 방법

1. 이번 변경을 담당자가 리뷰한다.
2. 필요한 파일만 커밋하여 `infra`에 push한다.
3. `CI and container images`가 모두 성공하는지 확인한다.
4. GHCR에 해당 40자리 커밋 SHA의 이미지 세 개가 생성됐는지 확인한다.
5. GitHub의 `Actions → Deploy production → Run workflow`로 이동한다.
6. 실행 기준 브랜치와 입력 `branch`를 모두 `infra`로 맞춘다.
7. `revision`은 비워 최신 커밋을 배포하거나, CI 이미지가 존재하는 40자리 SHA를 정확히 입력한다.
8. PRI 변경 내용을 확인하고 `production-private`을 승인한다.
9. PRI 상태 검사가 통과한 후 PUB 변경 내용을 확인하고 `production-public`을 승인한다.
10. 마지막 `Verify public production endpoints`까지 성공해야 배포 완료로 판단한다.

## 8. 실패와 복구

- 이미지 pull 실패: 기존 컨테이너를 건드리기 전에 중단한다.
- PRI 새 백엔드의 API 상태 검사 실패: 직전에 실행 중이던 백엔드·핵심 AI 이미지로 복구를 시도한다.
- PUB HTTPS/API 검사 실패: 직전에 실행 중이던 프론트 이미지로 복구를 시도한다.
- 인증서 경로 또는 도메인이 다름: Nginx 교체 전에 중단한다.
- 서버 저장소의 추적 파일에 로컬 수정이 있음: 덮어쓰지 않고 배포를 중단한다.
- 같은 서버에서 다른 배포가 실행 중임: 두 번째 배포를 중단한다.

주의: 자동 복구는 컨테이너 이미지 중심이다. Nginx 템플릿이나 배포 스크립트 자체에 기능 오류가 있으나 문법 검사를 통과한 경우에는 정상 커밋으로 되돌리는 `git revert`를 만든 뒤 새 SHA 이미지와 함께 다시 배포해야 한다. 서버에서 임의로 `git reset --hard`하지 않는다.

## 9. 이번 검증 결과

2026-08-12 로컬 검사:

- YAML 파싱: 성공
- `docker compose config --quiet`: PRI/PUB 모두 성공
- `bash -n`: 배포 스크립트 3개 성공
- `git diff --check`: 성공
- 비밀값 패턴 검사: 노출 발견 없음
- 백엔드 `clean test bootJar`: 성공
- 프론트 테스트: 32개 파일, 102개 테스트 성공
- 프론트 ESLint: 성공
- 프론트 `build:dev`: 성공

확인된 경고:

- 프론트의 단일 JavaScript chunk가 약 927 KB로 Vite 권장 크기 500 KB를 초과한다. 현재 빌드는 성공하지만 성능 개선 과제로 코드 분할을 검토해야 한다.
- 백엔드의 `AiFloorplanAnalysisClient.java`에서 deprecated API 사용 경고가 있다. 현재 테스트와 빌드는 성공한다.

로컬 미검증 항목:

- 로컬 PC에 실제 Python 3.11 실행환경이 없어 핵심 AI pytest는 로컬 재실행하지 못했다. GitHub Actions의 Python 3.11 Job에서 확인해야 한다.
- 로컬 Docker Desktop 엔진이 꺼져 있어 새 이미지의 로컬 컨테이너 기동은 확인하지 못했다. Compose 렌더링까지만 확인했다.
- GitHub Secret, Environment, GHCR 및 실제 NCP SSH 배포는 아직 적용하지 않았다.

## 10. OCR·도면 서비스 제외 사유

`floorplan4:latest`는 NCP Object Storage의 `floorplans` 폴더에 저장된 도면 사진 네 장이 아니다. `ai/ocr/Dockerfile`이 첫 줄에서 사용하는 OCR 기반 **Docker 이미지 이름**이다.

```dockerfile
FROM floorplan4:latest
```

이 이미지의 신뢰 가능한 원본, 레지스트리 주소 또는 이미지 아카이브가 현재 확인되지 않았다. 출처를 모르는 동명 이미지를 Docker Hub에서 임의로 받으면 안 된다. 따라서 이번 자동배포 대상은 다음 세 개로 제한했다.

- 백엔드
- 프론트엔드
- 핵심 AI

OCR, SPA, viewerwall, viewer3d 등 `floorplan4:latest` 또는 별도 모델 실행환경에 의존하는 서비스는 원본과 빌드 절차가 확인된 뒤 별도 CI 단계로 추가해야 한다.

## 11. 아직 남은 위험과 후속 과제

1. GHCR 패키지 세 개의 실제 공개 범위가 Private인지 첫 발행 직후 확인해야 한다.
2. GitHub 저장소가 private인 경우 현재 요금제에서 Environment secrets와 Required reviewers를 지원하는지 확인해야 한다.
3. 현재 `/root/SpaceUP` 구조는 SSH 배포 키 유출 시 영향이 크다. 전용 배포 사용자 전환을 별도 작업으로 진행하는 것이 좋다.
4. Dockerfile의 기반 이미지가 태그로 지정되어 있다. 다음 단계에서는 공식 이미지 digest 고정과 갱신 절차를 검토해야 한다.
5. `floorplan4:latest`의 제작자, 소스 Dockerfile, 해시, 배포 위치를 담당자에게 받아야 한다.
6. 인증서 자동 갱신 후 Nginx reload가 실제로 실행되는지 PUB의 Certbot timer와 renewal hook을 확인해야 한다.
7. 첫 운영 배포은 사용자가 적은 시간에 수행하고 회원가입, 로그인, 도면 업로드, AI 분석, 견적, 시공사 매칭 등 기능별 수동 점검을 병행해야 한다.

이 문서는 설정값을 설명하기 위한 문서다. 실제 API 키, 비밀번호, PAT, SSH 개인키 또는 인증서 개인키를 이 파일에 추가하지 않는다.
