# Spaceup 백엔드 전체 API 문서 (프론트엔드 전달용)

작성일: 2026-08-06 (2026-08-11 갱신: 회원 이메일 인증/비밀번호 변경 추가, 견적 수정요청 구조화, 주택가치 리포트 필드·`/api/schedules` 삭제 반영, `ProjectResponse.contractorId` 추가)
대상 브랜치: `backend` (push 완료)
검증: `origin/frontend` 최신 커밋(`61d9cdf`) 기준 실제 프론트 코드와 필드명 대조 완료 — 대조 상세는 [`2026-08-11_보류항목_DTO_확인_회신.md`](./2026-08-11_보류항목_DTO_확인_회신.md) 참고

프론트엔드팀에 넘겨드리는 **전체 API 목록**입니다. 이번 세션에 새로 만든 것뿐 아니라 기존에 이미 구현되어 있던 API까지 전부 포함합니다.

> ⚠️ 의뢰당 여러 시공사가 동시에 참여하는 다중 시공사 구조(`request_contractors`, 채팅/방문의 `contractorId` 파라미터 등)는 이 문서에서 상세히 다루지 않습니다. 자세한 내용은 [`백엔드_다중시공사_견적채팅_전환_안내.md`](./백엔드_다중시공사_견적채팅_전환_안내.md)를 참고하세요.

## 공통 사항

- **Base URL**: 로컬 `http://localhost:8090` (환경에 따라 `SERVER_PORT` 다름, 배포 시 별도 안내)
- **인증**: `Authorization: Bearer {accessToken}` 헤더. 로그인(`POST /api/member/login`) 응답의 `accessToken` 사용
- **공통 응답 포맷**: 모든 API가 아래 형태로 응답합니다.
  ```json
  { "success": true, "message": "...", "data": { ... } }
  ```
- **CORS**: `http://localhost:5173`, `http://127.0.0.1:5173` 허용, `Authorization`/`Content-Type` 헤더 허용, credentials 허용
- **주요 에러 상태코드**: 400(입력값 오류) · 401(미인증) · 403(권한 없음/본인 소유 아님) · 404(존재하지 않음) · 409(잘못된 상태 전이/중복) · 413(업로드 20MB 초과) · 502/503(외부 API 연동 실패/미설정)
- 아래 표에서 **인증** 열이 "공개"인 것을 제외하면 전부 로그인(JWT) 필요합니다.

---

## 1. 회원 (`/api/member`)

| Method | URL | 인증 | 설명 |
|---|---|---|---|
| POST | `/api/member/join` | 공개 | 회원가입 |
| POST | `/api/member/join/phone/verify-code/send` | 공개 | 회원가입 전 휴대폰 인증코드 발송 (목업 - SMS 미연동, 코드가 응답에 그대로 포함됨) |
| POST | `/api/member/join/phone/verify-code/confirm` | 공개 | 회원가입 전 인증코드 확인 |
| POST | `/api/member/login` | 공개 | 로그인 |
| GET | `/api/member/{memberId}` | 로그인 | 회원정보 조회 |
| PUT | `/api/member/{memberId}` | 로그인(본인) | 회원정보 수정 |
| PATCH | `/api/member/me/phone` | 로그인 | 휴대폰 번호 변경 (변경 즉시 `phoneVerified=false`) |
| POST | `/api/member/me/phone/verify-code/send` | 로그인 | 로그인 후 인증코드 발송 (목업) |
| POST | `/api/member/me/phone/verify-code/confirm` | 로그인 | 인증코드 확인 |
| **POST** | **`/api/member/me/email/verify-code/send`** | 로그인 | **[신규]** 이메일 인증코드 발송 (목업 - 실제 메일 미발송, 코드가 응답에 그대로 포함됨) |
| **POST** | **`/api/member/me/email/verify-code/confirm`** | 로그인 | **[신규]** 이메일 인증코드 확인 → `emailVerified=true` |
| **PATCH** | **`/api/member/me/password`** | 로그인 | **[신규]** 비밀번호 변경 (현재 비밀번호 확인 후에만 변경) |
| POST | `/api/member/me/resubmit` | 로그인 | 보완 자료 재제출 버튼 (NEEDS_REVISION 상태에서만) |
| DELETE | `/api/member/{memberId}` | 로그인(본인) | 회원 탈퇴 |

**회원가입 요청** `MemberJoinRequest`: `role`(LANDLORD/CONTRACTOR, ADMIN은 가입 불가), `username`(4~20자), `password`(영문+숫자+특수문자 8~16자), `email`, `name`(≤20자), `phoneNumber`(`010-1234-5678` 형식)

**로그인 응답** `LoginResponse`: `accessToken, memberId, role`

**회원 조회 응답** `MemberResponse`: `id, username, email, emailVerified, name, phoneNumber, phoneVerified, role, approvalStatus, applicationNumber, approvalNumber, revisionMessage, revisionDeadline, createdAt`

> `PUT /api/member/{memberId}`로 이메일이 실제로 바뀌면 `emailVerified`가 자동으로 `false`로 초기화됩니다(이름만 바뀔 때는 초기화 안 함). 휴대폰 인증과 동일한 목업 OTP 방식이라 실제 메일 발송 연동 전까지는 `me/email/verify-code/send` 응답의 코드값을 그대로 확인 API에 넣으면 인증됩니다.

**비밀번호 변경 요청** `PasswordUpdateRequest{currentPassword(필수), newPassword(필수, 영문+숫자+특수문자 8~16자)}` — 현재 비밀번호가 틀리면 400.

**enum MemberRole**: `LANDLORD | CONTRACTOR | ADMIN`
**enum MemberApprovalStatus**: `PENDING | NEEDS_REVISION | APPROVED` (LANDLORD/ADMIN은 즉시 APPROVED, CONTRACTOR는 관리자 승인 필요)

---

## 2. 매물/의뢰 (`/api/requests`)

| Method | URL | 인증 | 설명 |
|---|---|---|---|
| POST | `/api/requests` | 임대인 | 의뢰 생성 (매물+견적요청 동시 생성) + AI 분석 PENDING 자동 등록 |
| GET | `/api/requests/{requestId}` | 로그인 | 의뢰 상세 조회 |
| PATCH | `/api/requests/{requestId}` | 본인 의뢰 | 예산/희망일정/요청항목 등 부분 수정 |
| GET | `/api/requests/contractor/me` | 시공사 | 내게 배정된 의뢰 목록 (페이지네이션) |
| GET | `/api/requests/landlord/me` | 임대인 | 내가 등록한 의뢰 목록 |
| GET | `/api/requests/{requestId}/recommended-contractors` | 본인 의뢰 | 추천 시공사 목록(매칭점수순) |
| POST | `/api/requests/{requestId}/assign/{contractorId}` | 본인 의뢰 | 시공사에게 의뢰 배정 (매칭점수 계산 + 알림) |
| POST | `/api/requests/{requestId}/approve` | 배정받은 시공사 | 의뢰 승인 → 현장방문(SiteVisit) 자동 생성 |
| POST | `/api/requests/{requestId}/reject` | 배정받은 시공사 | 의뢰 거절 (사유 포함) |
| POST | `/api/requests/{requestId}/images` | 본인 의뢰 | 업로드된 이미지를 의뢰에 연결(평면도/사진) |
| GET | `/api/requests/{requestId}/images` | 로그인 | 의뢰에 연결된 이미지 목록 (`imageType` 쿼리로 필터 가능) |
| DELETE | `/api/requests/{requestId}/images/{imageId}` | 본인 의뢰 | 이미지 삭제 |

**의뢰 생성 요청** `RequestCreateRequest`: `region`, `propertyType`, `areaM2`(필수, >0), `deposit`, `monthlyRent`, `targetRent`, `budget`(레거시 단일값), `budgetMin`, `budgetMax`, `desiredDate`, `requestedItems`

**의뢰 수정 요청** `RequestUpdateRequest`: 위 필드 전부 optional (넘긴 필드만 반영)

**의뢰 거절 요청** `RequestRejectRequest`: `reason`(필수), `detail`(reason이 OTHER일 때만)

**의뢰 상세 응답** `RequestResponse`: `id, requestCode, landlordId, landlordName, contractorId, region, propertyType, areaM2, budget, budgetMin, budgetMax, desiredDate, requestedItems, status, rejectReason, rejectReasonDetail, lastActivityAt, matchingScore(분석 전 null), acceptedQuoteAmount(수락된 견적 없으면 null), createdAt`

**이미지 연결 요청/응답**: `RequestImageAddRequest{imageType, imageUrl}` / `RequestImageResponse{id, imageType, imageUrl, sortOrder}`

**enum RequestStatus**: `NEW → REVIEWING → QUOTE_REQUESTED → APPROVED → (IN_PROGRESS → COMPLETED) | REJECTED | CANCELED`
**enum RejectReason**: `REGION_NOT_SUPPORTED | BUDGET_MISMATCH | SPECIALTY_MISMATCH | SCHEDULE_CONFLICT | OTHER`
**enum RequestImageType**: `FLOOR_PLAN | PHOTO`

---

## 3. AI 분석 (`/api/analysis`)

| Method | URL | 인증 | 설명 |
|---|---|---|---|
| POST | `/api/analysis/request/{requestId}` | 내부용 | 분석 PENDING 등록 (의뢰 생성 시 자동 호출됨, 직접 호출할 일 없음) |
| POST | `/api/analysis/request/{requestId}/result` | ML 콜백 | 외부 분석 결과 반영 (관리자 수동 보정에도 사용) |
| PATCH | `/api/analysis/request/{requestId}` | 본인 의뢰 | 사용자가 방개수/욕실개수/발코니/주방형태/층고/전용면적 직접 수정 |
| POST | `/api/analysis/request/{requestId}/fail` | 내부용 | 분석 실패 처리 |
| **POST** | **`/api/analysis/request/{requestId}/floorplan-scan`** | 본인 의뢰 | **[신규]** 평면도 이미지를 AI 세그멘테이션 서비스로 분석해 방개수/욕실개수/발코니유무/방이름 자동 채움 |
| GET | `/api/analysis/request/{requestId}` | 로그인 | 분석 결과 조회 |
| PUT | `/api/analysis/request/{requestId}/spaces` | 본인 의뢰 | 공간(방) 목록 전체 교체 저장 |
| GET | `/api/analysis/request/{requestId}/spaces` | 로그인 | 공간 목록 조회 |
| GET | `/api/analysis/request/{requestId}/recommended-products` | 로그인 | 분석 결과 기반 추천 상품 (바닥재/벽지/조명/주방상부장) |
| **POST** | **`/api/analysis/request/{requestId}/interior-images`** | 본인 의뢰 | **[신규]** AI 인테리어 이미지 생성 (Gemini) |

### 3-1. 분석 결과 조회 응답 `AnalysisJobResponse`

```
id, requestId, status(PENDING|COMPLETED|FAILED),
roomCount, bathroomCount, hasBalcony, kitchenType,
spaceScore, conditionScore, issueTags(콤마구분),
matchingScore,
estimatedQuoteMin, estimatedQuoteMax,
expectedRentIncreaseMin, expectedRentIncreaseMax,        // ROI 요약 - 예상 월세 상승 범위 (ML 분석 결과)
paybackPeriodMonthsMin, paybackPeriodMonthsMax,          // ROI 요약 - 회수기간(개월)
ceilingHeightM, totalFloorAreaM2, totalWallpaperAreaM2
```
> ⚠️ **[변경, 2026-08-11]** 최신 기획에서 "주택가치 상승 리포트"(전세가치 상승분 별도 계산 기능)가 빠지면서 `depositIncreaseMin/Max`, `preliminaryDepositIncreaseMin/Max`, `preliminaryRentIncreaseMin/Max` 필드를 삭제했습니다. `expectedRentIncreaseMin/Max`·`paybackPeriodMonthsMin/Max`(ROI 요약 카드용)는 ML 분석 결과 필드라 그대로 유지됩니다.

### 3-2. 공간 목록 (`AnalysisSpaceRequest`/`Response`)
`spaceName`(필수), `spaceAreaM2`, `floorAreaM2`, `wallpaperAreaM2`, `selectedForConstruction`(기본 true). 시공 선택된 공간들의 면적 합이 `totalFloorAreaM2`/`totalWallpaperAreaM2`에 자동 반영됩니다.

### 3-3. AI 평면도 스캔 (신규)
`multipart/form-data`, 필드명 `file`(이미지). 응답은 `AnalysisJobResponse` (자동 반영된 값 포함).
> ⚠️ **면적(m²)은 자동으로 채워지지 않습니다.** 현재 연동된 AI 파이프라인이 픽셀 단위 데이터만 반환하고 실제 m² 계산을 하지 않기 때문입니다. 방개수/욕실개수/발코니유무/방이름만 자동 채워지고, 면적은 사용자가 "공간 정보 확인" 화면에서 직접 입력해야 합니다.
> **[변경, 2026-08-11]** 배포용 docker-compose에 AI 평면도 서비스(ocr/spa/viewer3d/viewerwall)를 연결했습니다. 다만 `ocr`은 저장소에 없는 로컬 이미지 `floorplan4:latest`가 배포 서버에 미리 로드되어 있어야 하고, `spa`는 CUDA 런타임 베이스 이미지라 GPU 없는 서버에서는 느릴 수 있습니다 — 실제 서버 기동 전 AI팀과 확인이 필요합니다.

### 3-4. AI 인테리어 이미지 생성 (Gemini)
요청: `{style: "화이트톤 모던 스타일로 바꿔줘", referenceImageUrl?: "/api/files/images/..."}` → 응답: `{imageUrls: [...]}`
> `GEMINI_API_KEY` 환경변수 미설정 시 503. 실제 키는 커밋하지 않고 서버 비밀 환경파일에서만 주입합니다.
> 생성된 파일은 Object Storage 또는 로컬 저장소에 기록되고, 반환 경로는 같은 의뢰의 `request_image`에 `AI_GENERATED` 유형으로 연결됩니다.

**enum AnalysisStatus**: `PENDING | COMPLETED | FAILED`

---

## 4. 아파트/평면도 검색 (`/api/floorplans/apartments`) — 신규

| Method | URL | 인증 | 설명 |
|---|---|---|---|
| POST | `/api/floorplans/apartments` | 관리자 | 아파트 등록 |
| POST | `/api/floorplans/apartments/{apartmentId}/variants` | 관리자 | 면적타입별 평면도 등록 |
| GET | `/api/floorplans/apartments/{apartmentId}` | 공개 | 아파트 상세(평면도 목록 포함) |
| GET | `/api/floorplans/apartments/search` | 공개 | 검색 |

**검색 쿼리 파라미터** (전부 선택): `keyword`(이름/도로명/지번주소 일치), `region`(지역 태그 정확히 일치), `minAreaM2`/`maxAreaM2`(전용면적 범위), `roomCount`(방개수)

**아파트 등록 요청** `ApartmentCreateRequest`: `name`(필수), `roadAddress`, `lotAddress`, `region`
**평면도 등록 요청** `FloorPlanVariantCreateRequest`: `exclusiveAreaM2`(필수, >0), `supplyAreaM2`, `typeLabel`, `roomCount`, `floorPlanImageUrl`

**응답** `ApartmentResponse{id, name, roadAddress, lotAddress, region, variants: [FloorPlanVariantResponse]}`
`FloorPlanVariantResponse{id, exclusiveAreaM2, supplyAreaM2, exclusivePyeong, supplyPyeong(서버가 평 단위 자동 환산), typeLabel, roomCount, floorPlanImageUrl}`

> **[변경, 2026-08-11]** local/dev 서버 기동 시 샘플 데이터가 자동으로 채워집니다(카탈로그가 비어있을 때만). 그중 상무센트럴/상무리버뷰/상무스카이 3곳은 프론트 목업(`mocks/apartments.ts`)과 이름·주소·면적(59/74/84㎡)을 동일하게 맞췄고, 나머지는 지역 필터 확인용 샘플입니다.

---

## 5. 시공사 프로필 (`/api/contractors`)

| Method | URL | 인증 | 설명 |
|---|---|---|---|
| GET | `/api/contractors/me` | 로그인 | 내 프로필 조회 (없으면 자동 생성) |
| GET | `/api/contractors/{contractorId}` | 공개 | 시공사 상세 (임대인이 로그인 없이도 조회 가능) |
| PUT | `/api/contractors/me` | 시공사 | 프로필 저장 |
| PUT | `/api/contractors/me/manager` | 시공사 | 담당자 정보 저장 |
| PUT | `/api/contractors/me/disclosure` | 시공사 | 공개 설정 6개 토글 저장 |
| PUT | `/api/contractors/me/service-info` | 시공사 | 예상 견적 범위/가능일 저장 (매칭점수 계산에 사용) |
| GET | `/api/contractors/me/dashboard` | 시공사 | 대시보드 (신규리드/견적요청/견적발송/계약대기 건수, 정산예정금액) |

**프로필 응답** `ContractorProfileResponse`: `id, memberId, memberName, businessRegistrationNumber, companyName, activityRegions(콤마구분), specialties(콤마구분), portfolioUrl, introduction, rating, reviewCount, completedProjectCount, managerPosition, consultationHours, profilePublic, contactPublic, specialtyPublic, regionPublic, portfolioPublic, availableForConsult, estimateMin, estimateMax, availableFromDate`

> `rating`/`reviewCount`는 리뷰 도메인(`/api/reviews`)에서 자동 갱신됩니다. `completedProjectCount`는 공사 진행률 도메인(`/api/projects`)의 완료 확인 시점에 자동 증가합니다.

---

## 6. 포트폴리오 (`/api/portfolios`)

| Method | URL | 인증 | 설명 |
|---|---|---|---|
| POST | `/api/portfolios` | 시공사 | 포트폴리오 등록 |
| GET | `/api/portfolios/me` | 시공사 | 내 포트폴리오 목록 |
| GET | `/api/portfolios/{portfolioId}` | 공개 | 단건 조회 |
| GET | `/api/portfolios/contractor/{contractorId}` | 공개 | 특정 시공사의 공개 포트폴리오 목록 |
| PUT | `/api/portfolios/{portfolioId}` | 본인 | 수정 |
| DELETE | `/api/portfolios/{portfolioId}` | 본인 | 삭제 |
| PATCH | `/api/portfolios/{portfolioId}/visibility?isPublic=` | 본인 | 공개 설정 변경 |

**요청/응답** `PortfolioCreateRequest`/`PortfolioResponse`: `projectName, region, propertyType, areaM2, workItems(콤마구분), durationDays, amount, mainImageUrl, photoUrls(콤마구분), isPublic`

---

## 7. 현장방문 예약 (`/api/visits`) — 신규

의뢰 승인 직후(견적 작성 이전)부터 시작되는 흐름입니다. 공사 일정(`/api/schedules`)과는 별개입니다.

| Method | URL | 인증 | 설명 |
|---|---|---|---|
| GET | `/api/visits/request/{requestId}` | 참여자 | 방문 일정 조회 |
| POST | `/api/visits/request/{requestId}/register` | 시공사 | 최초 등록 → `SCHEDULED` |
| POST | `/api/visits/{visitId}/change-request` | 임대인 | 일정 변경 요청 → `CHANGE_REQUESTED` |
| POST | `/api/visits/{visitId}/accept-change` | 시공사 | 변경 요청 수락 → `SCHEDULED`(변경된 일정으로) |
| POST | `/api/visits/{visitId}/propose` | 시공사 | 다른 일정 역제안 → `SCHEDULED` |
| POST | `/api/visits/{visitId}/reject-change` | 시공사 | 변경 요청 거절 → `SCHEDULED`(기존 일정 유지) |
| POST | `/api/visits/{visitId}/complete` | 시공사 | 방문 완료 → `COMPLETED` |

**등록/제안 요청**: `{visitDate("yyyy-MM-dd"), visitTime("HH:mm:ss"), managerName, note}`
**변경요청**: `{requestedDate, requestedTime, reason}` (전부 필수)
**완료**: `{note?}` (선택)

**응답** `SiteVisitResponse`: `id, requestId, status, visitDate, visitTime, address(매물 지역에서 자동), managerName, note, completedAt, requestedDate, requestedTime, requestReason`

**enum SiteVisitStatus**: `UNSCHEDULED(의뢰 승인 직후 기본값) → SCHEDULED → CHANGE_REQUESTED → SCHEDULED → COMPLETED`

---

## 8. 견적 (`/api/quotes`)

| Method | URL | 인증 | 설명 |
|---|---|---|---|
| POST | `/api/quotes` | 시공사 | 견적 임시저장(DRAFT) |
| GET | `/api/quotes/{quoteId}` | 로그인 | 견적 조회 |
| GET | `/api/quotes/request/{requestId}` | 로그인 | 의뢰에 달린 견적 이력 전체 |
| POST | `/api/quotes/{quoteId}/submit` | 시공사(본인) | 견적 발송 |
| POST | `/api/quotes/{quoteId}/accept` | 임대인 | 견적 최종 선택 (해당 시공사를 `SELECTED`, 나머지 참여 시공사를 `CLOSED`로 전환 — 다중 시공사 구조 참고) |
| POST | `/api/quotes/{quoteId}/reject` | 임대인 | 견적 거절 |
| POST | `/api/quotes/{quoteId}/extend` | 시공사(본인) | 유효기간 연장 |
| POST | `/api/quotes/{quoteId}/request-revision` | 임대인(본인) | 수정 요청 전달 |

**견적 생성 요청** `ContractorQuoteCreateRequest`: `requestId`(필수), `title, startDate, durationDays, materialCost, laborCost, vat, discount, detailContent, items`(1개 이상 필수, `{category(필수), description, amount(필수)}` 배열)

**응답** `ContractorQuoteResponse`: `id, requestId, contractorId, title, startDate, durationDays, totalAmount(자재비+인건비+부가세-할인 자동계산), status, validUntil, revisionRequestNote, revisionTargetItemIds, revisionRequestedAmount, revisionCount, items[{category, description, amount}]`

**[변경, 2026-08-11] 수정 요청** `ContractorQuoteRevisionRequest{note(필수), targetItemIds?, requestedAmount?}` — `targetItemIds`(수정이 필요한 견적 항목 id 목록)와 `requestedAmount`(희망 조정 금액)는 항목별로 구조화해서 요청하고 싶을 때만 채우는 선택 항목이고, 둘 다 생략하면 이전과 동일하게 `note` 텍스트만으로 동작합니다.

**enum QuoteStatus**: `DRAFT → SUBMITTED → ACCEPTED | REJECTED`

---

## 9. 공사 진행률 (`/api/projects`) — 신규

수락된 견적을 시공사가 "계약 전환"하면 생성됩니다. 공사 일정(`/api/schedules`)과는 별개 도메인입니다(아래 §10 참고).

| Method | URL | 인증 | 설명 |
|---|---|---|---|
| POST | `/api/projects` | 시공사 | 계약 전환 (`{quoteId, constructionItems?}`) |
| GET | `/api/projects/{projectId}` | 로그인 | 프로젝트 상세(체크리스트 포함) |
| GET | `/api/projects/contractor/me` | 시공사 | 내 프로젝트 목록 (페이지네이션) |
| GET | `/api/projects/landlord/me` | 임대인 | 내 프로젝트 목록 |
| PATCH | `/api/projects/{projectId}/schedule` | 시공사 | 일정 변경(`{startDate, completionDate, reason}`, 이전/변경값 함께 응답) |
| POST | `/api/projects/{projectId}/start` | 시공사 | 착공 → `IN_PROGRESS` |
| POST | `/api/projects/{projectId}/request-completion` | 시공사 | 완료 요청 → `COMPLETION_REQUESTED` |
| POST | `/api/projects/{projectId}/confirm-completion` | 임대인 | 완료 확인 → `COMPLETED` (시공사 실적 카운트 반영) |
| POST | `/api/projects/{projectId}/checklist` | 시공사 | 체크리스트 항목 추가(`{label}`) |
| PATCH | `/api/projects/{projectId}/checklist/{itemId}` | 시공사 | 체크리스트 완료 토글(`{completed}`) |

**응답** `ProjectResponse`: `id(=projectId), requestId, quoteId, requestCode, customerName, contractorId, contractorName, address, status, contractDate, contractAmount, startDate, completionDate, constructionItems, customerRequest, checklist[{id, label, completed}]`

**enum ProjectStatus**: `VISIT_SCHEDULED`(방문 미완료 상태로 전환) / `START_SCHEDULED`(방문 완료 후 전환, 기본) `→ IN_PROGRESS → COMPLETION_REQUESTED → COMPLETED`

---

> **[삭제, 2026-08-11] `/api/schedules`(공사 일정)** — `/api/projects`와 기능이 중복되어 도메인 자체를 삭제했습니다. 공사 일정/진행 관련 기능은 전부 `/api/projects`로 일원화되어 있습니다(§9 참고).

---

## 10. 채팅 (`/api/chats`) — 신규

의뢰(`requestId`) 1건당 스레드 1개.

| Method | URL | 인증 | 설명 |
|---|---|---|---|
| GET | `/api/chats/threads` | 로그인 | 참여 중인 스레드 목록 (마지막 메시지/안읽음수 포함) |
| GET | `/api/chats/{requestId}/messages` | 참여자 | 메시지 전체 조회 |
| POST | `/api/chats/{requestId}/messages` | 참여자 | 메시지 전송 (`{content}`) |
| POST | `/api/chats/{requestId}/read` | 참여자 | 안읽은 메시지 읽음 처리 |

**응답** `ChatThreadResponse{requestId, requestCode, counterpartName, requestStatus, lastMessage, lastMessageAt, unreadCount}`
`ChatMessageResponse{id, senderType, senderName, content, read, createdAt}`

**enum ChatSenderType**: `LANDLORD`(프론트의 customer) `| CONTRACTOR | SYSTEM`(자동 생성 없음, 확장 지점)
> 시공사가 배정되지 않은 의뢰는 채팅 불가(403).

---

## 11. 리뷰 (`/api/reviews`) — 신규

| Method | URL | 인증 | 설명 |
|---|---|---|---|
| POST | `/api/reviews/request/{requestId}` | 임대인 | 리뷰 작성 |
| GET | `/api/reviews/{reviewId}` | 공개 | 리뷰 상세 |
| GET | `/api/reviews/contractor/{contractorId}?filter=` | 공개 | 시공사별 리뷰 목록 (`filter`: all/five/four/three_or_less) |
| GET | `/api/reviews/contractor/{contractorId}/summary` | 공개 | 평균/총개수/점수별 개수 |

**작성 요청** `ReviewCreateRequest{rating(1~5, 필수), content(필수), keywords?}`
- `keywords`는 고정 4종: `SCHEDULE_KEPT`(일정을 잘 지켰어요) `| CLEAN_FINISH`(마감이 깔끔해요) `| DETAILED_CONSULT`(상담이 자세해요) `| FAST_COMMUNICATION`(소통이 빨라요)
- **작성 조건**: 해당 의뢰의 `ContractorProject.status`가 `COMPLETED`여야 함(그 전엔 400). 의뢰당 1개만 허용(중복 시 400).
- 작성 시 `ContractorProfile.rating`/`reviewCount` 자동 갱신.

**응답** `ReviewResponse{id, requestId, contractorId, reviewerName(가운데 마스킹, 예: "홍*동"), rating, content, keywords, createdAt}`
`ReviewSummaryResponse{contractorId, contractorName, averageRating, totalCount, ratingCounts({1:n,2:n,...,5:n})}`

---

## 12. 자재 카탈로그 (`/api/material-products`)

| Method | URL | 인증 | 설명 |
|---|---|---|---|
| GET | `/api/material-products?theme=&workType=` | 공개 | 활성 자재 카탈로그 조회 (`theme`, `workType` 선택 필터) |

**응답** `MaterialProductResponse`: `productId, workType, materialCategory, theme, priceTier, brandName, productName, modelCode, productUrl, imageUrl, saleUnit, coveragePerUnitM2, currentPrice, normalizedPriceM2, specJson, priceCheckedAt`

**enum MaterialTheme**: `MODERN | WOOD | WHITE | MARBLE`
**enum MaterialWorkType**: `WALLPAPER | FLOORING | LIGHTING`
**enum MaterialPriceTier**: `LOW | MID | HIGH`

자재업체 입점·상품 등록·재고·주문 API는 현재 프로젝트 범위에서 제거됐다. `material_product`는 사용자가 비교하는 읽기 전용 카탈로그이며 업체 판매 재고가 아니다.

---

## 13. 정산 (`/api/settlements`)

| Method | URL | 인증 | 설명 |
|---|---|---|---|
| POST | `/api/settlements` | **관리자** | 정산 레코드 생성(`{partnerId, transactionAmount}`) |
| GET | `/api/settlements/{settlementId}` | 로그인 | 정산 조회 |
| GET | `/api/settlements/partner/me` | 시공사 | 내 정산 내역 |
| POST | `/api/settlements/{settlementId}/complete` | **관리자** | 정산 완료 처리 |

**응답** `SettlementResponse`: `id, transactionCode, partnerId, partnerName, transactionAmount, commissionAmount, payoutAmount, status`
**enum SettlementStatus**: `PENDING | SETTLED`

---

## 14. 알림 (`/api/notifications`)

알림 생성 API는 없습니다 — 다른 도메인 이벤트(의뢰배정/견적발송/채팅/방문/리뷰/정산 등)가 발생할 때 서버가 자동 생성합니다.

| Method | URL | 인증 | 설명 |
|---|---|---|---|
| GET | `/api/notifications/me` | 로그인 | 알림 목록 (페이지네이션) |
| POST | `/api/notifications/{notificationId}/read` | 본인 | 읽음 처리 |
| POST | `/api/notifications/read-all` | 로그인 | 모두 읽음 |

**응답** `NotificationResponse`: `id, type, title, content, read, createdAt`
**enum NotificationType**: `QUOTE | SCHEDULE | REQUEST | SETTLEMENT | CHAT | VISIT | REVIEW | PROJECT`

---

> **[삭제, 2026-08-11] `/api/rental-transactions`(국토부 전월세 실거래가 동기화)** — 프론트 어디에도 연동 계획이 없는 게 확인되어 도메인 자체를 삭제했습니다.

---

## 15. 이미지 업로드 (`/api/files/images`)

| Method | URL | 인증 | 설명 |
|---|---|---|---|
| POST | `/api/files/images` | 로그인 | 이미지 업로드 (multipart, 필드명 `file`). 20MB 초과 시 413 |
| GET | `/api/files/images/{storeFileName}` | 공개 | 업로드된 이미지 서빙 (`<img src>` 직접 사용 가능) |

**응답** `ImageUploadResponse{imageUrl}` — 반환된 `imageUrl`을 Property 사진/Portfolio/Product/Request 이미지 연결 등에 그대로 사용하면 됩니다.

---

## 16. 관리자 (`/api/admin`) — 전체 `hasRole("ADMIN")`

| Method | URL | 설명 |
|---|---|---|
| GET | `/api/admin/dashboard` | 전체 운영 현황 |
| GET | `/api/admin/members?role=` | 회원 목록 |
| GET | `/api/admin/members/pending?role=` | 승인 대기 회원 목록 (필수 파라미터) |
| POST | `/api/admin/members/{memberId}/approve` | 회원 승인 |
| POST | `/api/admin/members/{memberId}/request-revision` | 보완 요청 (`{message, deadline}`) |
| GET | `/api/admin/settings/{key}` | 시스템 설정 조회 |
| PUT | `/api/admin/settings/{key}` | 시스템 설정 변경 (`{settingValue}`, 없으면 생성) |

**대시보드 응답** `AdminDashboardResponse`: `totalLandlords, totalContractors, pendingContractorApprovals, totalRequests, pendingSettlements`

---

## 부록: 도메인 간 관계 한눈에 보기

```
회원가입/로그인
  → 매물+의뢰 생성 (Property+QuoteRequest) → AI 분석 PENDING 자동등록
    → AI 평면도 스캔(선택) 또는 AI 콜백/수동 보정으로 분석 완료
    → 추천 시공사 조회 → 시공사 배정(assign) → 현장방문(SiteVisit) 자동 생성
      → 채팅으로 방문 일정 협의 → 방문 등록/변경/완료
      → 의뢰 승인(approve)
        → 시공사 견적 작성/발송 → 임대인 견적 수락(accept)
          → "계약 전환"으로 공사 프로젝트(ContractorProject) 생성
            → 착공 → 완료요청 → 임대인 완료확인 → 리뷰 작성 가능
자재: 테마·시공 종류·가격대별 읽기 전용 카탈로그 조회 및 AI 추천
정산: 관리자가 생성/완료 처리 (향후 이벤트 자동화 예정)
```
