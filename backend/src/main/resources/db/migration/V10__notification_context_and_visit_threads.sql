SET @schema_name = DATABASE();

SET @has_notification_request = (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = @schema_name AND table_name = 'notifications' AND column_name = 'request_id'
);
SET @ddl = IF(@has_notification_request = 0,
    'ALTER TABLE notifications ADD COLUMN request_id BIGINT NULL AFTER content', 'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_notification_contractor = (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = @schema_name AND table_name = 'notifications' AND column_name = 'contractor_id'
);
SET @ddl = IF(@has_notification_contractor = 0,
    'ALTER TABLE notifications ADD COLUMN contractor_id BIGINT NULL AFTER request_id', 'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_notification_context_index = (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = @schema_name AND table_name = 'notifications'
      AND index_name = 'idx_notifications_request_contractor'
);
SET @ddl = IF(@has_notification_context_index = 0,
    'ALTER TABLE notifications ADD INDEX idx_notifications_request_contractor (request_id, contractor_id)', 'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_visit_contractor = (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = @schema_name AND table_name = 'site_visits' AND column_name = 'contractor_id'
);
SET @ddl = IF(@has_visit_contractor = 0,
    'ALTER TABLE site_visits ADD COLUMN contractor_id BIGINT NULL AFTER request_id', 'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE site_visits sv
LEFT JOIN quote_request qr ON qr.request_id = sv.request_id
LEFT JOIN (
    SELECT request_id,
           COALESCE(
               MIN(CASE WHEN status IN ('APPROVED', 'SELECTED') THEN contractor_id END),
               MIN(contractor_id)
           ) AS contractor_id
    FROM request_contractors
    GROUP BY request_id
) rc ON rc.request_id = sv.request_id
SET sv.contractor_id = COALESCE(sv.contractor_id, qr.contractor_id, rc.contractor_id)
WHERE sv.contractor_id IS NULL;

SET @legacy_visit_unique = (
    SELECT index_name
    FROM information_schema.statistics
    WHERE table_schema = @schema_name AND table_name = 'site_visits' AND index_name <> 'PRIMARY'
    GROUP BY index_name
    HAVING MAX(non_unique) = 0
       AND GROUP_CONCAT(column_name ORDER BY seq_in_index) = 'request_id'
    LIMIT 1
);
SET @ddl = IF(@legacy_visit_unique IS NOT NULL,
    CONCAT('ALTER TABLE site_visits DROP INDEX `', REPLACE(@legacy_visit_unique, '`', '``'), '`'), 'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_visit_thread_unique = (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = @schema_name AND table_name = 'site_visits'
      AND index_name = 'uk_site_visits_request_contractor'
);
SET @ddl = IF(@has_visit_thread_unique = 0,
    'ALTER TABLE site_visits ADD UNIQUE INDEX uk_site_visits_request_contractor (request_id, contractor_id)', 'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_visit_contractor_fk = (
    SELECT COUNT(*) FROM information_schema.referential_constraints
    WHERE constraint_schema = @schema_name AND table_name = 'site_visits'
      AND constraint_name = 'fk_site_visits_contractor'
);
SET @ddl = IF(@has_visit_contractor_fk = 0,
    'ALTER TABLE site_visits ADD CONSTRAINT fk_site_visits_contractor FOREIGN KEY (contractor_id) REFERENCES user_account(user_id)', 'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
