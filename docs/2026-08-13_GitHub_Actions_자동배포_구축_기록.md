# GitHub Actions 자동 배포 구축 기록

- 작업일: 2026-08-13
- 기준 저장소: `ho-do99/SpaceUP`
- 배포 기준 브랜치: `main`
- 배포 대상 커밋: `c9abeba0e626fb04a348f5d691f6e23981b70e0f`
- 이전 운영 기준 커밋: `00b41abfcc35733d245bdc0dd0353c991deb6b9d`
- 상태: 코드 병합 및 CI 통과, 전용 배포 계정 연결 진행 중

## 작업 목적

기존 수동 배포는 운영자가 서버에 직접 로그인해 코드를 받고 이미지 빌드와 컨테이너
재시작을 수행해야 했다. 이를 `main`의 검증된 커밋을 선택하고, 승인 후 같은 커밋의
불변 이미지로 PUB/PRI 서버를 배포하는 수동 승인형 GitHub Actions 흐름으로 전환한다.

## 코드에서 바뀐 내용과 이유

| 구분 | 변경 내용 | 변경 이유 |
| --- | --- | --- |
| GitHub Actions 배포 | `.github/workflows/deploy.yml`에서 전체 40자리 `main` 커밋 SHA 검증, GHCR 이미지 존재 확인, PRI 선배포, PUB 후배포, 공개 URL 검증 순서를 구성 | 검증되지 않은 브랜치나 가변 태그가 운영에 배포되는 것을 차단하고 장애 범위를 줄이기 위해 |
| 전용 배포 계정 | `install-deploy-user.sh`와 PUB/PRI 배포 게이트웨이를 추가 | Actions에 root 계정을 직접 제공하지 않고 서버 역할별 배포 명령 하나만 sudo로 허용하기 위해 |
| 전용 계정 잠금 수정 | 고정된 `*` shadow 값을 폐기하고 설치 시 생성한 예측 불가능한 임시 비밀번호의 SHA-512 해시를 저장 | Ubuntu OpenSSH가 잠긴 계정의 올바른 공개키까지 거부해 자동배포 SSH 연결이 실패했기 때문에. 평문은 저장하지 않고 공개키 인증만 사용한다. |
| 공개키 옵션 호환 수정 | PUB의 잘못된 `permitlisten="none"`을 유효한 단일 loopback listen 제한으로 교체 | OpenSSH 9.6의 `authorized_keys`가 해당 키 한 줄 전체를 무시하던 문제를 해결하면서 임의 원격 포워딩을 제한하기 위해 |
| 점프 호스트 키 명시 | Actions SSH 설정에 PUB/PRI 별칭과 동일한 `IdentityFile`을 지정하고 PRI가 PUB을 `ProxyJump`로 사용하도록 변경 | 명령행의 `-i`와 `-J` 조합이 점프 호스트에 전용 키를 확실히 전달하지 않아 PRI 연결이 시간 초과되던 문제를 방지하기 위해 |
| PRI host key 교체 | PUB과 중복된 PRI SSH host key를 백업 후 새 키로 교체 | 복제된 동일 지문으로는 Actions가 PUB과 PRI를 서로 다른 서버로 신뢰성 있게 식별할 수 없기 때문에 |
| SSH 제한 | PUB은 `10.10.20.6:22` 점프 연결만, PRI는 포트 포워딩 없이 접속하도록 공개키 옵션을 제한 | 탈취된 배포 키가 임의 터널이나 다른 관리자 작업에 사용될 가능성을 낮추기 위해 |
| AI 이미지 빌드 | CI에서 OCR/SPA 모델 파일을 Git LFS로 내려받고 LFS 포인터가 이미지에 들어가지 않았는지 검사 | SPA 분석 시 모델 대신 LFS 포인터가 포함되어 `invalid load key 'v'` 오류가 발생했던 문제를 방지하기 위해 |
| 평면도 API | 프론트 요청 경로를 `/api/floorplans/apartments/variants/{id}/image`로 수정하고 테스트를 같은 경로로 정렬 | 기존 경로가 백엔드 컨트롤러와 달라 500 오류가 발생했기 때문에 |
| 평면도 배포 점검 | `FLOORPLAN_HEALTHCHECK_VARIANT_IDS`를 환경 설정으로 분리하고 `18 19 20 21`을 운영값으로 사용 | 실제 매핑 ID를 코드에 고정하지 않고 환경별로 바꾸며 배포 시 네 이미지를 모두 검증하기 위해 |
| 배포 스크립트 | 재시도·헬스체크와 실패 시 이전 이미지 복구 흐름을 유지·보강 | 서비스 시작 지연을 허용하면서도 잘못된 버전이 계속 노출되는 것을 막기 위해 |

## 반영된 주요 커밋

| 커밋 | 내용 |
| --- | --- |
| `ce2d34c` | main 전용 운영 배포 보안 강화 |
| `6e8fd8c` | 배포 변경 PR #22 병합 |
| `90708a5` | 프론트 평면도 이미지 API 경로 수정 |
| `c34e1ad` | 최신 AI 6개 서비스 배포 구성을 infra에 병합 |
| `438daed` | 프론트 테스트의 평면도 API 경로 정렬 |
| `c9abeba` | 평면도 헬스체크 ID를 환경값으로 분리 |

## Git 외 운영 설정

다음 항목은 서버 또는 DB에만 적용되므로 Git 커밋만으로 재현되지 않는다.

- 평면도 variant `18`, `19`, `20`, `21`을 실제 주소 네 곳과 Object Storage의
  `floorplan1.png`부터 `floorplan4.png`까지 순서대로 연결했다.
- 이전 가상 주소용 variant `1`부터 `4`의 이미지 URL은 백업 후 `NULL`로 해제했다.
- PRI `/home/ubuntu/spaceup-private.env`에
  `FLOORPLAN_HEALTHCHECK_VARIANT_IDS=18 19 20 21`을 설정했다.
- Object Storage 접근 키는 Git과 채팅에 남기지 않고 PRI 비밀 환경 파일에서 관리한다.
- PUB에는 공식 인증서 `spaceup.duckdns.org`를 사용하고 기존 sslip 주소는 공식 주소로
  301 리다이렉트한다.

## 검증 결과

- `main`, `develop`, `infra`가 모두 `c9abeba`를 가리키는 것을 확인했다.
- `main` CI의 테스트·설정 검증·6개 이미지 빌드 총 10개 작업이 모두 성공했다.
- CI 결과: <https://github.com/ho-do99/SpaceUP/actions/runs/31707018148>
- 운영 공개 점검에서 HOME, API, AI가 모두 HTTP 200이었다.
- 평면도 variant `18`, `19`, `20`, `21`이 모두 HTTP 200 `image/png`를 반환했다.
- 사용자가 실제 주소 네 곳을 검색해 지정한 평면도가 표시되는 것을 확인했다.

## 남은 작업

1. PUB/PRI에 `spaceup-deploy` 전용 계정과 제한된 배포 게이트웨이를 설치한다.
2. 검증한 서버 host key와 전용 개인키를 두 GitHub Environment secret에 등록한다.
3. `Deploy production`을 수동 실행하고 `production-private`, `production-public`을 순서대로 승인한다.
4. Actions의 운영 검증까지 성공한 뒤 서버 이미지 SHA와 공개 URL을 다시 확인한다.
5. 3D 모델링 완료 후 실제 평면도 분석을 별도 기능 시험한다. 현재 전체 추론 성공은 자동 배포 완료 조건에 포함하지 않는다.

## 보안상 주의사항

- 전용 개인키, Object Storage 키, DB 비밀번호는 이 문서나 Git 기록에 입력하지 않는다.
- `spaceup-deploy`를 Docker 그룹에 추가하지 않는다. Docker 그룹은 사실상 root 권한이다.
- SSH host key는 `ssh-keyscan` 결과만 믿지 않고 각 서버가 직접 출력한 지문과 비교한다.
- Actions 실행은 자동 시작이 아니라 `workflow_dispatch`와 Environment 승인을 모두 거친다.

## 2026-08-14 추가 작업 이력

- `main`과 6개 컨테이너 이미지 빌드 CI가 커밋 `021e94d`에서 모두 성공했다.
- 첫 운영 배포의 PUB 단계에서 운영 Docker Compose가 `run --add-host`를 지원하지 않는
  문제가 확인되어, 해당 옵션을 제거하고 Compose 설정 검증을 유지했다.
- 다음 운영 배포에서는 PRI의 외부 AI 헬스체크가 성공했지만 OCR/SPA/ViewerWall의 내부
  헬스체크를 시작 직후 한 번만 실행해 `ConnectionRefusedError`가 발생했다. 배포 스크립트가
  이전 이미지로 자동 복구했으며 PUB 배포는 시작되지 않았다.
- 컨테이너별 내부 헬스체크를 최대 40회, 2초 간격으로 재시도하도록 변경했다. 일시적인
  시작 지연은 허용하되 제한 시간 내 준비되지 않으면 기존 롤백 동작을 그대로 수행한다.
- 같은 문제가 다시 생기지 않도록 배포 구성 테스트에 내부 헬스체크 재시도 구조 검증을
  추가했다.

## 2026-08-18 Gemini 설정 누락 재발 방지

- 운영 백엔드가 HTTP 503을 반환하고 프론트에 `AI 생성 설정을 확인할 수 없습니다.`가
  표시되는 현상을 확인했다.
- 백엔드는 `GEMINI_API_KEY`가 비어 있으면 의도적으로 503을 반환하지만, 기존 PRI 배포
  사전검사는 DB와 Object Storage 설정만 검사해 누락을 차단하지 못했다.
- `deploy-private.sh`가 이미지 pull과 컨테이너 교체 전에 PRI 비밀 환경 파일의
  `GEMINI_API_KEY`가 비어 있지 않은지 검사하도록 보강했다.
- 실제 키는 Git·GitHub Actions·문서에 저장하지 않고 기존과 같이 PRI의
  `/home/ubuntu/spaceup-secret.env`에서만 관리한다.
- 배포 구성 테스트에 Gemini 필수검사 존재 여부와 실행 순서 검증을 추가했다.
