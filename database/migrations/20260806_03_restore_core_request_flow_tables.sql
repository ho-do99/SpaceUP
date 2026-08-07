-- Restore tables that are already required by the current backend request flow.
-- MySQL DDL implicitly commits; take a full backup before applying this file.

CREATE TABLE analysis_space (
    id BIGINT NOT NULL AUTO_INCREMENT,
    analysis_id BIGINT NOT NULL,
    space_name VARCHAR(30) NOT NULL,
    space_area_m2 DOUBLE NULL,
    floor_area_m2 DOUBLE NULL,
    wallpaper_area_m2 DOUBLE NULL,
    selected_for_construction BIT(1) NOT NULL DEFAULT b'1',
    sort_order INT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_analysis_space_order UNIQUE (analysis_id, sort_order),
    CONSTRAINT fk_analysis_space_analysis
        FOREIGN KEY (analysis_id) REFERENCES analysis_job (analysis_id) ON DELETE CASCADE,
    CONSTRAINT ck_analysis_space_name CHECK (CHAR_LENGTH(TRIM(space_name)) > 0),
    CONSTRAINT ck_analysis_space_area CHECK (
        (space_area_m2 IS NULL OR space_area_m2 >= 0)
        AND (floor_area_m2 IS NULL OR floor_area_m2 >= 0)
        AND (wallpaper_area_m2 IS NULL OR wallpaper_area_m2 >= 0)
    ),
    CONSTRAINT ck_analysis_space_sort_order CHECK (sort_order >= 0),
    CONSTRAINT ck_analysis_space_selected CHECK (selected_for_construction IN (b'0', b'1'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE request_image (
    id BIGINT NOT NULL AUTO_INCREMENT,
    request_id BIGINT NOT NULL,
    image_type ENUM('FLOOR_PLAN', 'PHOTO') NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    sort_order INT NOT NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_request_image_order UNIQUE (request_id, image_type, sort_order),
    CONSTRAINT fk_request_image_request
        FOREIGN KEY (request_id) REFERENCES quote_request (request_id) ON DELETE CASCADE,
    CONSTRAINT ck_request_image_url CHECK (CHAR_LENGTH(TRIM(image_url)) > 0),
    CONSTRAINT ck_request_image_sort_order CHECK (sort_order >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE site_visits (
    id BIGINT NOT NULL AUTO_INCREMENT,
    request_id BIGINT NOT NULL,
    status ENUM('UNSCHEDULED', 'SCHEDULED', 'CHANGE_REQUESTED', 'COMPLETED') NOT NULL,
    visit_date DATE NULL,
    visit_time TIME(6) NULL,
    manager_name VARCHAR(50) NULL,
    note VARCHAR(300) NULL,
    completed_at DATETIME(6) NULL,
    requested_date DATE NULL,
    requested_time TIME(6) NULL,
    request_reason VARCHAR(300) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_site_visits_request UNIQUE (request_id),
    CONSTRAINT fk_site_visits_request
        FOREIGN KEY (request_id) REFERENCES quote_request (request_id) ON DELETE CASCADE,
    CONSTRAINT ck_site_visits_state CHECK (
        status = 'UNSCHEDULED'
        OR (status = 'SCHEDULED' AND visit_date IS NOT NULL AND visit_time IS NOT NULL)
        OR (status = 'CHANGE_REQUESTED' AND visit_date IS NOT NULL AND visit_time IS NOT NULL
            AND requested_date IS NOT NULL AND requested_time IS NOT NULL)
        OR (status = 'COMPLETED' AND visit_date IS NOT NULL AND visit_time IS NOT NULL
            AND completed_at IS NOT NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
