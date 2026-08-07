-- Align the existing shared database with the current JPA entities.
--
-- Preconditions checked before application:
--   * analysis_job exists and the three analysis measurement columns do not.
--   * products exists and the four product presentation/locking columns do not.
--   * notifications.type contains only the four legacy values.
--
-- MySQL DDL auto-commits. Take and verify a database backup before running this file.

ALTER TABLE analysis_job
    ADD COLUMN ceiling_height_m DOUBLE NULL,
    ADD COLUMN total_floor_area_m2 DOUBLE NULL,
    ADD COLUMN total_wallpaper_area_m2 DOUBLE NULL;

ALTER TABLE products
    ADD COLUMN image_url VARCHAR(500) NULL,
    ADD COLUMN unit VARCHAR(20) NULL,
    ADD COLUMN coverage_m2 DOUBLE NULL,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE notifications
    MODIFY COLUMN type ENUM(
        'QUOTE',
        'SCHEDULE',
        'REQUEST',
        'SETTLEMENT',
        'CHAT',
        'VISIT',
        'REVIEW',
        'PROJECT'
    ) NOT NULL;
