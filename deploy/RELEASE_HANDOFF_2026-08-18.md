# SpaceUP 릴리스·견적 흐름 인수인계 (2026-08-18)

## 이번 릴리스의 핵심

- 시공사 승인 후 바로 작성·발송하는 견적은 **1차 예상 견적(`PRELIMINARY`)**이다.
- 임대인이 1차 견적 하나를 선택하면 해당 시공사만 확정되고, 다른 시공사 참여는 마감된다.
- 이 시점에만 현장 실측 방문(`SiteVisit`)이 생성된다.
- 선택된 시공사는 실측 상태가 `COMPLETED`인 경우에만 **최종 견적(`FINAL`)**을 작성할 수 있다.
- 임대인이 최종 견적을 수락하면 최종 견적 확정 알림이 전달된다.

## DB 변경

Flyway 마이그레이션 `V3__add_contractor_quote_phase.sql`이 `contractor_quote.quote_phase` 컬럼을 추가한다.

- 값: `PRELIMINARY`, `FINAL`
- 기존 견적: DB 기본값에 따라 `PRELIMINARY`
- 인덱스: `(request_id, quote_phase, status, updated_at)`
- 서버의 새 백엔드가 처음 기동될 때 Flyway가 적용한다. 비밀값이나 수동 SQL 입력은 필요 없다.

## 변경한 코드

- `ContractorQuoteService`: 1차 견적 선택과 실측 후 최종 견적을 분리하고 상태 전이를 서버에서 검증
- `ContractorQuote`, `ContractorQuoteResponse`, 프론트 `QuoteResponse`: 견적 단계 값을 저장·응답·수신
- 시공사 견적 화면: 1차 견적 발송 뒤 실측 완료 화면으로 강제 이동하던 프론트 제한 제거
- 견적 단계 단위 테스트 추가 및 기존 프론트 견적 목업 보완

## 검증 결과

- 백엔드: 156 tests, failures 0, errors 0
- 프론트: 45 test files / 182 tests 통과, lint 통과, `npm run build:dev` 통과
- GitHub Actions: 백엔드·프론트·AI·배포 설정·컨테이너 이미지 6개 모두 통과한 뒤 병합

## 배포 전제 조건

- 대상 커밋은 반드시 `origin/main`에 포함된 40자리 전체 SHA여야 한다.
- private 서버 환경 파일:
  - `/home/ubuntu/spaceup-private.env`
  - `/home/ubuntu/spaceup-secret.env`
- public 서버 환경 파일:
  - `/root/spaceup-public.env`
- 환경 파일의 실제 비밀값은 출력·Git 커밋·채팅에 붙여넣지 않는다.

## 실제 서버 수동 배포

`<MAIN_SHA>`는 main 병합 후 아래 명령으로 확인한 **40자리 전체 SHA**로 바꾼다.

```bash
git ls-remote origin refs/heads/main
```

### 1. private 서버 — backend·AI·OCR·SPA·viewerwall

private 서버에 root로 접속한 뒤 실행한다.

```bash
cd /root/SpaceUP
git status --porcelain --untracked-files=no
test -r /home/ubuntu/spaceup-private.env
test -r /home/ubuntu/spaceup-secret.env

MAIN_SHA='<MAIN_SHA>'
printf '%s\n' "$MAIN_SHA" | /usr/local/sbin/spaceup-deploy-private
```

성공 시 `private deployment completed at <MAIN_SHA>`가 출력된다. 실패하면 새 private 이미지가 기존 이미지로 자동 롤백된다.

### 2. public 서버 — frontend·nginx

public 서버에 root로 접속한 뒤 실행한다.

```bash
cd /root/SpaceUP
git status --porcelain --untracked-files=no
test -r /root/spaceup-public.env

MAIN_SHA='<MAIN_SHA>'
printf '%s\n' "$MAIN_SHA" | /usr/local/sbin/spaceup-deploy-public
```

성공 시 `public deployment completed at <MAIN_SHA>`가 출력된다. 실패하면 새 frontend 이미지가 기존 이미지로 자동 롤백된다.

### 3. 배포 후 확인

public 서버에서 실행한다.

```bash
curl -fsS -o /dev/null -w 'HOME %{http_code}\n' https://spaceup.duckdns.org/
curl -fsS -o /dev/null -w 'API %{http_code}\n' 'https://spaceup.duckdns.org/api/rental-transactions/apartments?size=1'
curl -fsS -o /dev/null -w 'AI %{http_code}\n' https://spaceup.duckdns.org/ai/health
```

모두 `200`이면 기본 서비스 연결은 정상이다.

## 시연 확인 순서

1. 임대인이 견적 요청을 생성하고 시공사 3곳에 요청이 도착하는지 확인
2. 시공사가 요청을 승인하고 1차 예상 견적을 작성·발송
3. 임대인이 하나의 1차 견적을 선택
4. 선택 시공사 계정에서 현장 방문 일정을 등록하고 방문 완료 처리
5. 같은 시공사에서 최종 견적을 작성·발송
6. 임대인이 최종 견적을 수락하고 알림·채팅·견적 이력을 확인

## 운영 주의사항

- 서버 배포는 `main`에 포함된 커밋만 가능하다. `infra`나 `develop` SHA를 넣으면 배포 스크립트가 중단한다.
- 서버 작업 트리에 추적 파일 변경이 있으면 배포가 중단한다. 먼저 변경 원인을 확인하고 임의로 `reset --hard` 하지 않는다.
- 배포 이미지 태그는 SHA 고정 방식이다. main push 뒤 GitHub Actions의 이미지 빌드가 끝난 것을 확인한 다음 배포한다.
- 배포 스크립트의 이미지 롤백은 수행하지만, Flyway로 적용된 DB 스키마를 자동 되돌리지는 않는다. 이번 V3는 기본값이 있는 추가 컬럼이라 이전 백엔드와 호환된다.
