# 백엔드·실DB 테이블 목록

> 2026-08-07 기준 `.env` 연결 DB와 현재 백엔드 엔티티를 대조한 목록이다. 현재 총 25개이며, 스키마 변경은 `database/migrations`의 명시적 SQL을 기준으로 한다. `ddl-auto=update`는 남은 마이그레이션이 끝난 뒤 `validate`로 전환할 예정이다.

| 테이블 | 역할 | 주요 연결 |
|---|---|---|
| `user_account` | 임대인·시공사·관리자 계정 | 역할: `LANDLORD`, `CONTRACTOR`, `ADMIN` |
| `phone_verification` | 가입 전 휴대폰 인증 | 전화번호 기준 |
| `contractor_profiles` | 시공사 프로필·공개 설정 | `member_id` → `user_account` |
| `portfolios` | 시공사 포트폴리오 | `contractor_id` → `user_account` |
| `property` | 사용자 매물 | `owner_id` → `user_account` |
| `quote_request` | 견적 요청의 중심 데이터 | 사용자·매물 참조 |
| `request_contractors` | 요청에 참여하는 여러 시공사 | 요청·시공사 조합 |
| `request_image` | 요청·AI 입력 이미지 | `request_id` → `quote_request` |
| `analysis_job` | AI 분석 작업·요약 결과 | `request_id` → `quote_request` |
| `analysis_space` | 공간별 AI 분석 결과 | `analysis_id` → `analysis_job` |
| `apartments` | 아파트 검색 기준 정보 | 평면도 상위 데이터 |
| `floorplan_variants` | 아파트별 면적·평면 유형 | `apartment_id` → `apartments` |
| `rental_transaction` | 국토부 임대차 실거래 | 외부 데이터 원본 키 |
| `rental_api_sync_log` | 임대차 API 동기화 기록 | 수집 범위·결과 |
| `material_product` | 테마별 읽기 전용 자재 카탈로그 | 업체·재고·주문과 무관 |
| `contractor_quote` | 시공사별 견적 | 요청·시공사 참조 |
| `contractor_quote_item` | 견적 세부 항목 | `quote_id` → `contractor_quote` |
| `chat_messages` | 요청별 사용자·시공사 채팅 | 요청·발신자·시공사 참조 |
| `site_visits` | 계약 전 현장 방문 일정 | 요청·시공사 참조 |
| `contractor_projects` | 계약 후 시공 진행 | 요청·수락 견적 참조 |
| `project_checklist_items` | 프로젝트 진행 체크리스트 | `project_id` → `contractor_projects` |
| `reviews` | 완료 프로젝트 리뷰 | 요청·사용자·시공사 참조 |
| `notifications` | 사용자별 알림 | `receiver_id` → `user_account` |
| `settlements` | 시공사 정산 | 현재 `partner_id` 명칭은 후속 마이그레이션 대상 |
| `system_settings` | 관리자 시스템 설정 | 설정 키 고유 |

## 제거된 과거 구조

- `products`, `material_orders`: 자재업체 입점·재고·주문 기능 제거에 따라 삭제
- `boards`, `comments`, `upload_files`: 현재 화면과 백엔드 도메인이 없고 데이터 0건이어서 삭제
- `schedule_events`: `site_visits`와 `contractor_projects`에 역할이 중복되고 데이터 0건이어서 삭제
- `MATERIAL_VENDOR`: 현재 회원 역할에서 제거

## 주의

- `material_product`는 반드시 유지한다. 제거된 것은 자재 자체가 아니라 자재업체 판매·재고·주문 기능이다.
- `settlements.partner_id`와 `/api/settlements/partner/me`는 아직 이름만 과거 범용 파트너 구조를 사용한다. 이번 잔존 용어 정리 단계에서는 API·DB 호환을 위해 변경하지 않았으며 정산 구조 보강 단계에서 시공사 기준으로 함께 바꾼다.
- 과거 17개 테이블 문서는 현재 구조와 맞지 않으므로 이 문서로 대체했다.
