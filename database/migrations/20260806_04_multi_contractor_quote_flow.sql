-- Support multiple contractor conversations and quotes before one contractor is selected.
-- MySQL DDL implicitly commits. Take a full backup before applying this migration.

CREATE TABLE request_contractors (
    id BIGINT NOT NULL AUTO_INCREMENT,
    request_id BIGINT NOT NULL,
    contractor_id BIGINT NOT NULL,
    status ENUM('INVITED', 'APPROVED', 'REJECTED', 'SELECTED', 'CLOSED') NOT NULL,
    reject_reason ENUM('BUDGET_MISMATCH', 'OTHER', 'REGION_NOT_SUPPORTED', 'SCHEDULE_CONFLICT', 'SPECIALTY_MISMATCH') NULL,
    reject_reason_detail VARCHAR(300) NULL,
    matching_score INT NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_request_contractors_request_contractor UNIQUE (request_id, contractor_id),
    CONSTRAINT fk_request_contractors_request
        FOREIGN KEY (request_id) REFERENCES quote_request (request_id) ON DELETE CASCADE,
    CONSTRAINT fk_request_contractors_contractor
        FOREIGN KEY (contractor_id) REFERENCES user_account (user_id),
    CONSTRAINT ck_request_contractors_reject_reason CHECK (
        status <> 'REJECTED' OR reject_reason IS NOT NULL
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Preserve the old single-contractor assignments as participation records.
-- An already accepted quote means that contractor was already finally selected.
INSERT INTO request_contractors (
    request_id, contractor_id, status, reject_reason, reject_reason_detail, matching_score, created_at, updated_at
)
SELECT
    request.request_id,
    request.contractor_id,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM contractor_quote quote
            WHERE quote.request_id = request.request_id
              AND quote.contractor_id = request.contractor_id
              AND quote.status = 'ACCEPTED'
        ) THEN 'SELECTED'
        WHEN request.status IN ('QUOTE_REQUESTED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED') THEN 'APPROVED'
        WHEN request.status = 'REJECTED' THEN 'REJECTED'
        ELSE 'INVITED'
    END,
    CASE WHEN request.status = 'REJECTED' THEN request.reject_reason ELSE NULL END,
    CASE WHEN request.status = 'REJECTED' THEN request.reject_reason_detail ELSE NULL END,
    analysis.matching_score,
    request.created_at,
    request.updated_at
FROM quote_request request
LEFT JOIN analysis_job analysis ON analysis.request_id = request.request_id
WHERE request.contractor_id IS NOT NULL;

-- contractor_id on quote_request now means the finally selected contractor only.
UPDATE quote_request request
JOIN contractor_quote quote
  ON quote.request_id = request.request_id
 AND quote.status = 'ACCEPTED'
SET request.contractor_id = quote.contractor_id,
    request.status = CASE
        WHEN request.status IN ('IN_PROGRESS', 'COMPLETED') THEN request.status
        ELSE 'APPROVED'
    END;

UPDATE quote_request request
SET request.contractor_id = NULL
WHERE request.contractor_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM contractor_quote quote
      WHERE quote.request_id = request.request_id
        AND quote.status = 'ACCEPTED'
  );

-- A visit belongs to one contractor's pre-contract flow, not to the request globally.
ALTER TABLE site_visits
    ADD COLUMN contractor_id BIGINT NULL AFTER request_id;

UPDATE site_visits visit
JOIN request_contractors participation
  ON participation.request_id = visit.request_id
SET visit.contractor_id = participation.contractor_id
WHERE visit.contractor_id IS NULL
  AND participation.status IN ('SELECTED', 'APPROVED');

ALTER TABLE site_visits
    DROP INDEX uk_site_visits_request,
    MODIFY COLUMN contractor_id BIGINT NOT NULL,
    ADD CONSTRAINT uk_site_visits_request_contractor UNIQUE (request_id, contractor_id),
    ADD CONSTRAINT fk_site_visits_contractor
        FOREIGN KEY (contractor_id) REFERENCES user_account (user_id);

CREATE TABLE chat_messages (
    id BIGINT NOT NULL AUTO_INCREMENT,
    request_id BIGINT NOT NULL,
    contractor_id BIGINT NOT NULL,
    sender_type ENUM('LANDLORD', 'CONTRACTOR', 'SYSTEM') NOT NULL,
    sender_id BIGINT NULL,
    content VARCHAR(1000) NOT NULL,
    is_read BIT(1) NOT NULL DEFAULT b'0',
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    INDEX idx_chat_messages_thread_created (request_id, contractor_id, created_at),
    CONSTRAINT fk_chat_messages_request
        FOREIGN KEY (request_id) REFERENCES quote_request (request_id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_messages_contractor
        FOREIGN KEY (contractor_id) REFERENCES user_account (user_id),
    CONSTRAINT fk_chat_messages_sender
        FOREIGN KEY (sender_id) REFERENCES user_account (user_id),
    CONSTRAINT ck_chat_messages_sender CHECK (
        (sender_type = 'SYSTEM' AND sender_id IS NULL)
        OR (sender_type IN ('LANDLORD', 'CONTRACTOR') AND sender_id IS NOT NULL)
    ),
    CONSTRAINT ck_chat_messages_content CHECK (CHAR_LENGTH(TRIM(content)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
