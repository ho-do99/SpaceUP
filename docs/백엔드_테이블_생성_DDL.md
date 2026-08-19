# 백엔드 DB 테이블 생성 DDL (MySQL 8)

> 실제로 로컬 MySQL에 붙어서 `SHOW CREATE TABLE`로 뽑아낸, 지금 코드가 실제로 만드는 DDL 그대로입니다(Hibernate가 자동 생성한 것과 100% 동일). FK 관계상 아래 순서대로 실행해야 합니다. `user_account`, `quote_request`는 이미 있다고 가정합니다.

---

## 1. phone_verification

```sql
CREATE TABLE phone_verification (
    id           BIGINT NOT NULL AUTO_INCREMENT,
    phone_number VARCHAR(20)     NOT NULL,
    code         VARCHAR(10)     NOT NULL,
    expires_at   DATETIME(6)     NOT NULL,
    verified     BIT(1)          NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

| 컬럼 | 타입 | NULL | 설명 |
| --- | --- | --- | --- |
| id | BIGINT (PK, AI) | X | |
| phone_number | VARCHAR(20) | X | 인증 대상 전화번호 (회원 계정과 무관, 회원가입 전이라 FK 없음) |
| code | VARCHAR(10) | X | 발급된 6자리 인증코드 |
| expires_at | DATETIME(6) | X | 인증코드 만료 시각 (5분) |
| verified | BIT(1) | X | 인증 성공 여부 |

---

## 2. contractor_quote

```sql
CREATE TABLE contractor_quote (
    quote_id              BIGINT NOT NULL AUTO_INCREMENT,
    created_at            DATETIME(6),
    updated_at            DATETIME(6),
    request_id            BIGINT NOT NULL,
    contractor_id         BIGINT NOT NULL,
    title                 VARCHAR(100),
    available_start_date  VARCHAR(255),
    estimated_days        INT,
    material_cost         BIGINT,
    labor_cost            BIGINT,
    vat                   BIGINT,
    discount              BIGINT,
    total_amount          BIGINT,
    detail_content        VARCHAR(500),
    valid_until           DATE,
    revision_request_note VARCHAR(500),
    revision_count        INT NOT NULL,
    status                ENUM('DRAFT','SUBMITTED','ACCEPTED','REJECTED') NOT NULL,
    PRIMARY KEY (quote_id),
    CONSTRAINT fk_contractor_quote_request
        FOREIGN KEY (request_id) REFERENCES quote_request (request_id),
    CONSTRAINT fk_contractor_quote_contractor
        FOREIGN KEY (contractor_id) REFERENCES user_account (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

| 컬럼 | 타입 | NULL | 설명 |
| --- | --- | --- | --- |
| quote_id | BIGINT (PK, AI) | X | |
| request_id | BIGINT (FK→quote_request) | X | 이 견적이 속한 의뢰 |
| contractor_id | BIGINT (FK→user_account) | X | 견적 작성한 시공사 |
| title | VARCHAR(100) | O | 견적 제목 |
| available_start_date | VARCHAR(255) | O | 공사 시작 가능일 |
| estimated_days | INT | O | 예상 공사 기간(일) |
| material_cost / labor_cost / vat / discount | BIGINT | O | 자재비/인건비/부가세/할인 |
| total_amount | BIGINT | O | 최종 견적 금액(자동 계산) |
| detail_content | VARCHAR(500) | O | 견적 상세 내용 |
| valid_until | DATE | O | 견적 유효기간 |
| revision_request_note | VARCHAR(500) | O | 임대인의 수정 요청 메모 |
| revision_count | INT | X | 견적 버전(수정할 때마다 +1) |
| status | ENUM | X | DRAFT/SUBMITTED/ACCEPTED/REJECTED |

---

## 3. contractor_quote_item

```sql
CREATE TABLE contractor_quote_item (
    quote_item_id BIGINT NOT NULL AUTO_INCREMENT,
    quote_id      BIGINT NOT NULL,
    work_type     VARCHAR(30)  NOT NULL,
    description   VARCHAR(100),
    amount        BIGINT       NOT NULL,
    PRIMARY KEY (quote_item_id),
    CONSTRAINT fk_quote_item_quote
        FOREIGN KEY (quote_id) REFERENCES contractor_quote (quote_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

| 컬럼 | 타입 | NULL | 설명 |
| --- | --- | --- | --- |
| quote_item_id | BIGINT (PK, AI) | X | |
| quote_id | BIGINT (FK→contractor_quote) | X | 소속 견적 |
| work_type | VARCHAR(30) | X | 공종(철거/바닥/조명 등) |
| description | VARCHAR(100) | O | 세부 내용 |
| amount | BIGINT | X | 항목 금액 |

---

## 4. analysis_job

```sql
CREATE TABLE analysis_job (
    analysis_id                      BIGINT NOT NULL AUTO_INCREMENT,
    created_at                       DATETIME(6),
    updated_at                       DATETIME(6),
    request_id                       BIGINT NOT NULL UNIQUE,
    status                           ENUM('PENDING','COMPLETED','FAILED') NOT NULL,
    room_count                       INT,
    bathroom_count                   INT,
    has_balcony                      BIT(1),
    kitchen_type                     VARCHAR(20),
    space_score                      INT,
    condition_score                  INT,
    issue_tags                       VARCHAR(500),
    matching_score                   INT,
    estimated_quote_min              BIGINT,
    estimated_quote_max              BIGINT,
    expected_rent_increase_min       BIGINT,
    expected_rent_increase_max       BIGINT,
    payback_period_months_min        INT,
    payback_period_months_max        INT,
    deposit_increase_min             BIGINT,
    deposit_increase_max             BIGINT,
    preliminary_deposit_increase_min BIGINT,
    preliminary_deposit_increase_max BIGINT,
    preliminary_rent_increase_min    BIGINT,
    preliminary_rent_increase_max    BIGINT,
    PRIMARY KEY (analysis_id),
    CONSTRAINT fk_analysis_job_request
        FOREIGN KEY (request_id) REFERENCES quote_request (request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

| 컬럼 | 타입 | NULL | 설명 |
| --- | --- | --- | --- |
| analysis_id | BIGINT (PK, AI) | X | |
| request_id | BIGINT (FK→quote_request, UNIQUE) | X | 의뢰 1건당 분석 1건(1:1) |
| status | ENUM | X | PENDING/COMPLETED/FAILED |
| room_count / bathroom_count | INT | O | 방/욕실 개수 |
| has_balcony | BIT(1) | O | 발코니 유무 |
| kitchen_type | VARCHAR(20) | O | 주방 형태 |
| space_score / condition_score | INT | O | 공간효율/컨디션 점수(0~100) |
| issue_tags | VARCHAR(500) | O | AI 분석 태그(콤마구분) |
| matching_score | INT | O | 시공사 매칭 점수 |
| estimated_quote_min/max | BIGINT | O | 예상 견적 범위 |
| expected_rent_increase_min/max | BIGINT | O | 확정 월세 상승분 |
| payback_period_months_min/max | INT | O | 예상 회수기간(개월) |
| deposit_increase_min/max | BIGINT | O | 확정 전세가치 상승분 |
| preliminary_deposit/rent_increase_min/max | BIGINT | O | 예비(희망예산 기준) 상승분 |

---

## 5. contractor_profiles

```sql
CREATE TABLE contractor_profiles (
    id                       BIGINT NOT NULL AUTO_INCREMENT,
    created_at               DATETIME(6),
    updated_at               DATETIME(6),
    member_id                BIGINT NOT NULL UNIQUE,
    business_reg_no          VARCHAR(20),
    company_name             VARCHAR(50),
    activity_regions         VARCHAR(200),
    specialties              VARCHAR(200),
    portfolio_url            VARCHAR(300),
    introduction             VARCHAR(500),
    rating                   DOUBLE,
    review_count             INT,
    completed_project_count  INT,
    estimate_min             BIGINT,
    estimate_max             BIGINT,
    available_from_date      DATE,
    manager_position         VARCHAR(30),
    consultation_hours       VARCHAR(50),
    profile_public           BIT(1) NOT NULL,
    contact_public           BIT(1) NOT NULL,
    specialty_public         BIT(1) NOT NULL,
    region_public             BIT(1) NOT NULL,
    portfolio_public          BIT(1) NOT NULL,
    available_for_consult    BIT(1) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_contractor_profiles_member
        FOREIGN KEY (member_id) REFERENCES user_account (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

| 컬럼 | 타입 | NULL | 설명 |
| --- | --- | --- | --- |
| id | BIGINT (PK, AI) | X | |
| member_id | BIGINT (FK→user_account, UNIQUE) | X | 시공사 회원 1명당 프로필 1건 |
| business_reg_no | VARCHAR(20) | O | 사업자등록번호 |
| company_name | VARCHAR(50) | O | 업체명 |
| activity_regions / specialties | VARCHAR(200) | O | 활동지역/전문분야(콤마구분) |
| portfolio_url | VARCHAR(300) | O | (레거시) 단일 포트폴리오 링크 |
| introduction | VARCHAR(500) | O | 소개글 |
| rating | DOUBLE | O | 평균 평점 |
| review_count | INT | O | 리뷰 개수 |
| completed_project_count | INT | O | 완료 프로젝트 수 |
| estimate_min/max | BIGINT | O | 통상 견적 범위(추천점수용) |
| available_from_date | DATE | O | 최단 시공 가능일(추천점수용) |
| manager_position / consultation_hours | VARCHAR | O | 담당자 정보 |
| profile_public 등 6개 | BIT(1) | X | 공개설정 토글(기본 전부 공개) |

---

## 6. portfolios

```sql
CREATE TABLE portfolios (
    id             BIGINT NOT NULL AUTO_INCREMENT,
    created_at     DATETIME(6),
    updated_at     DATETIME(6),
    contractor_id  BIGINT NOT NULL,
    project_name   VARCHAR(100) NOT NULL,
    region         VARCHAR(50),
    property_type  VARCHAR(20),
    area_m2        DOUBLE,
    work_items     VARCHAR(200),
    duration_days  INT,
    amount         BIGINT,
    main_image_url VARCHAR(500),
    photo_urls     VARCHAR(2000),
    is_public      BIT(1) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_portfolios_contractor
        FOREIGN KEY (contractor_id) REFERENCES user_account (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

| 컬럼 | 타입 | NULL | 설명 |
| --- | --- | --- | --- |
| id | BIGINT (PK, AI) | X | |
| contractor_id | BIGINT (FK→user_account) | X | 등록한 시공사 |
| project_name | VARCHAR(100) | X | 프로젝트명 |
| region / property_type | VARCHAR | O | 지역/주택유형 |
| area_m2 | DOUBLE | O | 면적 |
| work_items | VARCHAR(200) | O | 시공 항목(콤마구분) |
| duration_days | INT | O | 시공 기간(일) |
| amount | BIGINT | O | 공사 금액 |
| main_image_url | VARCHAR(500) | O | 대표 이미지 URL |
| photo_urls | VARCHAR(2000) | O | 시공 사진 URL 목록(콤마구분) |
| is_public | BIT(1) | X | 공개 여부(기본 공개) |

---

## 7. notifications

```sql
CREATE TABLE notifications (
    id          BIGINT NOT NULL AUTO_INCREMENT,
    created_at  DATETIME(6),
    updated_at  DATETIME(6),
    receiver_id BIGINT NOT NULL,
    type        ENUM('REQUEST','QUOTE','SCHEDULE','SETTLEMENT','CHAT','VISIT','REVIEW','PROJECT') NOT NULL,
    title       VARCHAR(100) NOT NULL,
    content     VARCHAR(300),
    is_read     BIT(1) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_notifications_receiver
        FOREIGN KEY (receiver_id) REFERENCES user_account (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

| 컬럼 | 타입 | NULL | 설명 |
| --- | --- | --- | --- |
| id | BIGINT (PK, AI) | X | |
| receiver_id | BIGINT (FK→user_account) | X | 알림 받는 회원 |
| type | ENUM | X | REQUEST/QUOTE/SCHEDULE/SETTLEMENT |
| title | VARCHAR(100) | X | 알림 제목 |
| content | VARCHAR(300) | O | 알림 내용 |
| is_read | BIT(1) | X | 읽음 여부 (컬럼명이 `read`가 아니라 `is_read`인 이유: `READ`가 MySQL 예약어라 그대로 쓰면 테이블 생성 자체가 실패해서 피함) |

---

## 실행 순서 요약

```
user_account (선행 존재)
  └─ quote_request (선행 존재)
       ├─ contractor_quote
       │    └─ contractor_quote_item
       └─ analysis_job
  └─ contractor_profiles
  └─ portfolios
  └─ notifications
phone_verification (독립, FK 없음)
```
