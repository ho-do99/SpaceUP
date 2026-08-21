SET @schema_name = DATABASE();
SET @has_site_visit_check = (
    SELECT COUNT(*)
    FROM information_schema.table_constraints
    WHERE constraint_schema = @schema_name
      AND table_name = 'site_visits'
      AND constraint_name = 'ck_site_visits_state'
      AND constraint_type = 'CHECK'
);
SET @drop_site_visit_check = IF(
    @has_site_visit_check > 0,
    'ALTER TABLE site_visits DROP CHECK ck_site_visits_state',
    'DO 0'
);
PREPARE drop_site_visit_check_stmt FROM @drop_site_visit_check;
EXECUTE drop_site_visit_check_stmt;
DEALLOCATE PREPARE drop_site_visit_check_stmt;

ALTER TABLE site_visits
    ADD CONSTRAINT ck_site_visits_state CHECK (
        status = 'UNSCHEDULED'
        OR (
            status = 'SCHEDULED'
            AND visit_date IS NOT NULL
            AND visit_time IS NOT NULL
        )
        OR (
            status = 'CHANGE_REQUESTED'
            AND requested_date IS NOT NULL
            AND requested_time IS NOT NULL
        )
        OR (
            status = 'COMPLETED'
            AND visit_date IS NOT NULL
            AND visit_time IS NOT NULL
            AND completed_at IS NOT NULL
        )
    );
