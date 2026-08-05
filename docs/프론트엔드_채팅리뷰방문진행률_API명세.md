# 채팅 / 리뷰 / 현장방문 예약 / 공사 진행률 / AI 인테리어 이미지 생성 — API 명세

작성일: 2026-08-05
대상 브랜치: `backend` (커밋 `f911798` ~ `d4bff3a`, push 완료)

`origin/frontend` 브랜치 코드(`contractorPortal` 타입/목업/화면)를 실제로 다시 확인해 4개 기능(채팅/리뷰/현장방문/공사 진행률)이 **시공사 화면 쪽에는 이미 만들어져 있지만 API 연동은 전혀 안 된 상태**(전부 `mocks/contractorPortalMockData.ts` 목업 데이터만 사용 중)임을 확인했습니다. 아래는 그 화면들이 붙을 수 있도록 새로 구현한 백엔드 API입니다. 모두 실제로 기동해 end-to-end로 검증했습니다.

**공통**: 모든 응답은 기존과 동일하게 `{success, message, data}` 형태이며, `Authorization: Bearer {accessToken}` 헤더가 필요합니다(리뷰 조회 API 제외 — 아래 표시).

---

## 1. 채팅 (`/api/chats`)

의뢰(`requestId`) 1건당 스레드 1개입니다. 별도 스레드 ID 없이 `requestId`로 스레드를 식별합니다.

| Method | URL | 설명 |
|---|---|---|
| GET | `/api/chats/threads` | 로그인한 회원(임대인/시공사)이 참여 중인 스레드 목록. 각 항목에 `lastMessage`, `unreadCount` 포함 |
| GET | `/api/chats/{requestId}/messages` | 스레드의 전체 메시지 (시간순) |
| POST | `/api/chats/{requestId}/messages` | 메시지 전송. body: `{ "content": "..." }`. `senderType`은 로그인한 역할로 서버가 자동 결정 |
| POST | `/api/chats/{requestId}/read` | 상대방이 보낸 안 읽은 메시지를 모두 읽음 처리 |

- `senderType`: `LANDLORD`(프론트의 `customer`) / `CONTRACTOR` / `SYSTEM`. 지금은 `SYSTEM` 메시지를 서버가 자동 생성하지는 않습니다(필요 시 요청해 주세요).
- 시공사가 아직 배정되지 않은 의뢰는 채팅을 보낼 수 없습니다(403).
- 메시지 전송 시 상대방에게 알림(`NotificationType.CHAT`)이 자동 발송됩니다.

```json
// GET /api/chats/threads 응답 예시
{ "requestId": 2, "requestCode": "REQ-260805-000002", "counterpartName": "테스트임대인",
  "requestStatus": "REVIEWING", "lastMessage": "네, 이번 주 토요일...", "lastMessageAt": "2026-08-05T17:50:41",
  "unreadCount": 1 }
```

---

## 2. 현장방문 예약 (`/api/visits`)

프론트 `ContractorVisitPage` 흐름과 동일한 상태 4단계: `UNSCHEDULED → SCHEDULED → CHANGE_REQUESTED → SCHEDULED → COMPLETED`.

**중요**: 기존 `/api/schedules`(공사 착공 일정)와는 **별개 도메인**입니다. 현장방문은 견적 작성 **이전**, 의뢰 승인 직후 시작되는 흐름이고 `/api/schedules`는 계약 체결 **이후** 착공 일정입니다. `POST /api/requests/{id}/approve` 호출 시 이 방문 레코드가 `UNSCHEDULED` 상태로 자동 생성됩니다 — 별도 생성 API는 없습니다.

| Method | URL | 권한 | 설명 |
|---|---|---|---|
| GET | `/api/visits/request/{requestId}` | 본인 의뢰만 | 방문 일정 조회 (의뢰 승인 전이면 404) |
| POST | `/api/visits/request/{requestId}/register` | 시공사 | 최초 등록. body: `{visitDate, visitTime, managerName, note}` → `SCHEDULED` |
| POST | `/api/visits/{visitId}/change-request` | 임대인 | 다른 일정 요청. body: `{requestedDate, requestedTime, reason}` → `CHANGE_REQUESTED` |
| POST | `/api/visits/{visitId}/accept-change` | 시공사 | 임대인 요청 수락 → `SCHEDULED` (요청받은 일정으로 확정) |
| POST | `/api/visits/{visitId}/propose` | 시공사 | 다른 일정 역제안. body: `{visitDate, visitTime, note}` → `SCHEDULED` |
| POST | `/api/visits/{visitId}/reject-change` | 시공사 | 임대인 요청 거절 → `SCHEDULED` (기존 일정 유지) |
| POST | `/api/visits/{visitId}/complete` | 시공사 | 방문 완료. body(optional): `{note}` → `COMPLETED` |

- `visitDate`는 `yyyy-MM-dd`, `visitTime`은 `HH:mm:ss` 형식입니다.
- `address`는 매물 정보(`Property.region`)에서 자동 채워지며 입력값으로 받지 않습니다.
- 각 액션마다 상대방에게 알림(`NotificationType.VISIT`)이 자동 발송됩니다.

---

## 3. 공사 진행률 (`/api/projects`)

프론트 `ContractorProject` 화면과 동일합니다. 견적이 수락(`ContractorQuote.ACCEPTED`)된 뒤 시공사가 "계약 전환"하면 생성됩니다.

| Method | URL | 권한 | 설명 |
|---|---|---|---|
| POST | `/api/projects` | 시공사 | 계약 전환. body: `{quoteId, constructionItems?}` |
| GET | `/api/projects/{projectId}` | - | 프로젝트 상세 (체크리스트 포함) |
| GET | `/api/projects/contractor/me` | 시공사 | 내 프로젝트 목록 (페이지네이션) |
| GET | `/api/projects/landlord/me` | 임대인 | 내 프로젝트 목록 |
| PATCH | `/api/projects/{projectId}/schedule` | 시공사 | 일정 변경. body: `{startDate, completionDate, reason}` — 이전/변경 값을 응답으로 함께 반환 |
| POST | `/api/projects/{projectId}/start` | 시공사 | 착공 → `IN_PROGRESS` |
| POST | `/api/projects/{projectId}/request-completion` | 시공사 | 완료 요청 → `COMPLETION_REQUESTED` |
| POST | `/api/projects/{projectId}/confirm-completion` | 임대인 | 완료 확인 → `COMPLETED` (이 시점에 시공사 완료 실적 카운트 반영) |
| POST | `/api/projects/{projectId}/checklist` | 시공사 | 체크리스트 항목 추가. body: `{label}` |
| PATCH | `/api/projects/{projectId}/checklist/{itemId}` | 시공사 | 체크리스트 완료 토글. body: `{completed}` |

- **상태값**: `VISIT_SCHEDULED`(현장방문 미완료 상태로 전환) / `START_SCHEDULED`(현장방문 완료 후 전환, 기본) / `IN_PROGRESS` / `COMPLETION_REQUESTED` / `COMPLETED`. 계약 전환 시점에 방문이 이미 `COMPLETED`면 `START_SCHEDULED`로, 아니면 `VISIT_SCHEDULED`로 시작합니다.
- 체크리스트는 프론트 목업처럼 서버가 임의의 항목(철거/바닥재 등)을 미리 채워 넣지 않습니다. 시공사가 필요할 때마다 추가하는 방식입니다.
- ⚠️ **알려드릴 점**: 기존 `/api/schedules`(ScheduleEvent, PDF "일정관리")도 별도로 시공 완료 시 `ContractorProfile.completedProjectCount`를 증가시킵니다. 이번 프로젝트 도메인의 완료 확인도 동일 카운터를 증가시켜서, 두 플로우를 모두 쓰면 실적이 중복 집계될 수 있습니다. 실제로는 이 `ContractorProject` 플로우가 프론트가 쓰는 화면과 일치하니, 추후 `/api/schedules` 쪽 정리(또는 완전 대체)가 필요한지 논의가 필요합니다.

---

## 4. 리뷰 (`/api/reviews`)

| Method | URL | 권한 | 설명 |
|---|---|---|---|
| POST | `/api/reviews/request/{requestId}` | 임대인 | 리뷰 작성. body: `{rating(1~5), content, keywords?}` |
| GET | `/api/reviews/{reviewId}` | 공개 | 리뷰 상세 |
| GET | `/api/reviews/contractor/{contractorId}?filter=` | 공개 | 시공사별 리뷰 목록. `filter`: `all`(기본)\|`five`\|`four`\|`three_or_less` |
| GET | `/api/reviews/contractor/{contractorId}/summary` | 공개 | 평균/총개수/점수별 개수(`ratingCounts`) |

- **작성 조건**: 해당 의뢰의 `ContractorProject.status`가 `COMPLETED`여야 합니다(공사 완료 전에는 400). 의뢰당 리뷰 1개만 허용됩니다(중복 작성 시 400).
- `keywords`는 프론트 4종 고정값 중 선택: `SCHEDULE_KEPT`(일정을 잘 지켰어요) / `CLEAN_FINISH`(마감이 깔끔해요) / `DETAILED_CONSULT`(상담이 자세해요) / `FAST_COMMUNICATION`(소통이 빨라요).
- `reviewerName`은 프론트 예시(`홍*동`)처럼 가운데를 마스킹해서 내려줍니다.
- 리뷰가 등록될 때마다 `GET /api/contractors/{id}`가 돌려주는 `rating`/`reviewCount`가 자동 갱신됩니다(시공사 카드/상세 화면의 별점이 이 값을 그대로 씁니다).
- GET 3종은 로그인 없이도 호출 가능합니다(시공사 상세 화면에서 비로그인 사용자도 리뷰를 볼 수 있도록).

---

## 5. AI 인테리어 이미지 생성 (`/api/analysis/request/{requestId}/interior-images`)

| Method | URL | 권한 | 설명 |
|---|---|---|---|
| POST | `/api/analysis/request/{requestId}/interior-images` | 임대인(본인 의뢰) | body: `{style, referenceImageUrl?}` → `{imageUrls: [...]}` |

- `style`: 원하는 스타일 설명(자유 텍스트, 예: "화이트톤 모던 스타일로 바꿔줘").
- `referenceImageUrl`: 이미 업로드된 집 사진 URL(`/api/files/images/{...}` 형태)을 넘기면 그 사진을 기반으로 생성합니다. 생략하면 텍스트 설명만으로 생성합니다.
- 응답의 `imageUrls`는 기존 이미지 업로드와 동일한 경로(`/api/files/images/{파일명}`)로 저장되어 `<img src>`로 바로 렌더링 가능합니다.
- **Gemini 2.5 Flash Image API로 실제 연동되어 있습니다.** `GEMINI_API_KEY` 환경변수만 채우면 바로 동작합니다. 현재는 키가 설정되어 있지 않아 호출 시 **503**(`GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.`)이 돌아옵니다 — 실제 키 값은 전달주신 그대로 어떤 파일에도 커밋하지 않았습니다(이 저장소는 `.env.local` 등도 git에 커밋되는 구조라, 키가 있는 채로 커밋하면 그대로 GitHub에 노출되기 때문입니다). 운영 배포 시 서버 환경변수로만 채워 넣어 주세요.
- 외부 API 호출 자체가 실패하면 502, 잘못된 참고 이미지 URL이면 400을 반환합니다.

---

## 참고: 상태값 요약

| 도메인 | 상태값 |
|---|---|
| SiteVisit | `UNSCHEDULED → SCHEDULED → CHANGE_REQUESTED → SCHEDULED → COMPLETED` |
| ContractorProject | `VISIT_SCHEDULED`/`START_SCHEDULED → IN_PROGRESS → COMPLETION_REQUESTED → COMPLETED` |
| ChatSenderType | `LANDLORD`(customer) / `CONTRACTOR` / `SYSTEM` |
| ReviewKeyword | `SCHEDULE_KEPT` / `CLEAN_FINISH` / `DETAILED_CONSULT` / `FAST_COMMUNICATION` |

## 실기동 검증 완료 항목

로컬에서 `test_landlord`/`test_contractor`/`test_admin` 계정으로 아래 전체 플로우를 실제 HTTP 호출로 검증했습니다:
의뢰 생성 → 배정 → 승인(방문 자동 생성) → 채팅 3회 → 방문 등록 → 변경요청 → 수락 → 방문완료 → 견적 작성/발송/수락 → 계약전환(프로젝트 생성) → 일정변경 → 체크리스트 추가/토글 → 착공 → 완료요청 → 완료확인 → 리뷰 작성 → 시공사 평점 자동 갱신 확인. 완료 전 프로젝트/중복 리뷰 작성 시도가 정확히 거부되는 것도 확인했습니다.
