# DB 조회 인덱스 보강 안내

## 목적

현재 Spring Data Repository의 실제 조회 조건과 정렬 순서를 실DB 인덱스 및 `EXPLAIN` 결과와 대조해 필요한 복합 인덱스만 추가했다. 테이블·컬럼·제약조건·데이터와 백엔드·프론트 기능 코드는 변경하지 않았다.

## 적용 마이그레이션

- `database/migrations/20260807_01_query_index_alignment.sql`

## 추가한 인덱스 5개

| 테이블 | 인덱스 | 대상 조회 |
|---|---|---|
| `notifications` | `idx_notifications_receiver_created (receiver_id, created_at DESC)` | 사용자별 알림 최신순 페이지 조회 |
| `notifications` | `idx_notifications_receiver_read (receiver_id, is_read)` | 사용자별 안 읽은 알림 조회 |
| `chat_messages` | `idx_chat_messages_thread_unread (request_id, contractor_id, is_read, sender_type)` | 요청·시공사 대화방의 상대방 미확인 메시지 조회 |
| `contractor_quote` | `idx_contractor_quote_contractor_status (contractor_id, status)` | 시공사 대시보드의 상태별 견적 집계 |
| `contractor_quote` | `idx_contractor_quote_request_status_updated (request_id, status, updated_at DESC)` | 요청별 특정 상태의 최신 견적 조회 |

## 추가하지 않은 인덱스

- `site_visits`: 기존 고유 인덱스 `(request_id, contractor_id)`가 현재 요청별·요청/시공사별 조회를 모두 처리한다.
- `request_contractors`: 기존 고유 인덱스 `(request_id, contractor_id)`와 시공사 FK 인덱스가 현재 조회를 처리한다. 요청당 참여 시공사 수가 작아 `(request_id, status)`를 추가하면 쓰기 비용 대비 이득이 작다.
- `contractor_quote` 고유 제약: 수정 견적을 같은 행에서 갱신할지 여러 이력 행으로 보관할지 정책이 확정되지 않아 추가하지 않았다.
- `idx_chat_messages_request_created (request_id, created_at DESC)`: 적용 후 `EXPLAIN`에서 `request_id IN (...) ORDER BY created_at DESC`의 전역 `filesort`를 제거하지 못했다. 효과가 불명확해 즉시 실DB와 마이그레이션에서 제거했다.

## 채팅 목록의 남은 확장성 문제

`findByRequestIdInOrderByCreatedAtDesc`는 여러 요청의 전체 메시지를 불러온 뒤 서비스에서 대화방별 최근 메시지와 미확인 수를 그룹화한다. 메시지가 많아지면 인덱스 하나로 해결되지 않으며 다음 중 하나의 코드 변경이 필요하다.

- DB에서 대화방별 최근 메시지와 미확인 수를 집계하는 전용 쿼리
- 대화방 요약 테이블 또는 마지막 메시지 스냅샷
- 최소한의 페이지네이션과 조회 범위 제한

이번 단계에서는 담당자의 채팅 흐름을 건드리지 않기 위해 코드 변경을 보류했다.

## 백업과 검증

- 백업: `tmp/db-backups/spaceup-before-query-indexes-20260807-001452.sql`
- SHA-256: `997BCC7F81DB8F890ED9184454636CAAD04C70A8201F111DA846833AA551BFC6`
- 덤프 완료 표식: 확인
- 적용 후 테이블: 25개
- 적용 후 주요 데이터: 회원 7건, 요청 5건, 견적 1건, 알림 10건, 자재 36건
- 최종 추가 인덱스: 5개
- 백엔드 전체 테스트: 112건, 실패 0, 오류 0, 기존 스킵 1
- 프론트엔드 전체 테스트: 23건 통과
- 프론트엔드 프로덕션 빌드: 성공
- 커밋·푸시: 없음
