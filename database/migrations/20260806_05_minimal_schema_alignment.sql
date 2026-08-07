-- Align the live schema with the Figma v2 user/contractor flows while keeping
-- the smallest safe table set. MySQL DDL implicitly commits: take a full
-- backup before applying this migration.

CREATE TABLE apartments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    road_address VARCHAR(200) NULL,
    lot_address VARCHAR(200) NULL,
    region VARCHAR(50) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    INDEX idx_apartments_region_name (region, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE floorplan_variants (
    id BIGINT NOT NULL AUTO_INCREMENT,
    apartment_id BIGINT NOT NULL,
    exclusive_area_m2 DOUBLE NOT NULL,
    supply_area_m2 DOUBLE NULL,
    type_label VARCHAR(30) NULL,
    room_count INT NULL,
    floor_plan_image_url VARCHAR(300) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    INDEX idx_floorplan_variants_search (apartment_id, exclusive_area_m2, room_count),
    CONSTRAINT fk_floorplan_variants_apartment
        FOREIGN KEY (apartment_id) REFERENCES apartments (id) ON DELETE CASCADE,
    CONSTRAINT ck_floorplan_variants_area CHECK (exclusive_area_m2 > 0),
    CONSTRAINT ck_floorplan_variants_room_count CHECK (room_count IS NULL OR room_count >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE contractor_projects (
    id BIGINT NOT NULL AUTO_INCREMENT,
    request_id BIGINT NOT NULL,
    quote_id BIGINT NOT NULL,
    status ENUM('VISIT_SCHEDULED', 'START_SCHEDULED', 'IN_PROGRESS', 'COMPLETION_REQUESTED', 'COMPLETED') NOT NULL,
    contract_date DATE NULL,
    contract_amount BIGINT NULL,
    start_date DATE NULL,
    completion_date DATE NULL,
    construction_items VARCHAR(200) NULL,
    customer_request VARCHAR(500) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_contractor_projects_request UNIQUE (request_id),
    CONSTRAINT uk_contractor_projects_quote UNIQUE (quote_id),
    CONSTRAINT fk_contractor_projects_request
        FOREIGN KEY (request_id) REFERENCES quote_request (request_id) ON DELETE CASCADE,
    CONSTRAINT fk_contractor_projects_quote
        FOREIGN KEY (quote_id) REFERENCES contractor_quote (quote_id),
    CONSTRAINT ck_contractor_projects_amount CHECK (contract_amount IS NULL OR contract_amount >= 0),
    CONSTRAINT ck_contractor_projects_dates CHECK (
        start_date IS NULL OR completion_date IS NULL OR completion_date >= start_date
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE project_checklist_items (
    id BIGINT NOT NULL AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    label VARCHAR(100) NOT NULL,
    completed BIT(1) NOT NULL DEFAULT b'0',
    sort_order INT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_project_checklist_order UNIQUE (project_id, sort_order),
    CONSTRAINT fk_project_checklist_project
        FOREIGN KEY (project_id) REFERENCES contractor_projects (id) ON DELETE CASCADE,
    CONSTRAINT ck_project_checklist_label CHECK (CHAR_LENGTH(TRIM(label)) > 0),
    CONSTRAINT ck_project_checklist_sort_order CHECK (sort_order >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE reviews (
    id BIGINT NOT NULL AUTO_INCREMENT,
    request_id BIGINT NOT NULL,
    reviewer_id BIGINT NOT NULL,
    contractor_id BIGINT NOT NULL,
    rating INT NOT NULL,
    content VARCHAR(1000) NOT NULL,
    keywords VARCHAR(200) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_reviews_request UNIQUE (request_id),
    INDEX idx_reviews_contractor_rating_created (contractor_id, rating, created_at),
    INDEX idx_reviews_reviewer (reviewer_id),
    CONSTRAINT fk_reviews_request
        FOREIGN KEY (request_id) REFERENCES quote_request (request_id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_reviewer
        FOREIGN KEY (reviewer_id) REFERENCES user_account (user_id),
    CONSTRAINT fk_reviews_contractor
        FOREIGN KEY (contractor_id) REFERENCES user_account (user_id),
    CONSTRAINT ck_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT ck_reviews_content CHECK (CHAR_LENGTH(TRIM(content)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- These four tables have zero rows in the verified live database. Boards,
-- comments and their DB-backed upload metadata have no current UI or backend
-- domain. Generic schedules duplicate site_visits and contractor_projects.
DROP TABLE IF EXISTS upload_files;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS boards;
DROP TABLE IF EXISTS schedule_events;
