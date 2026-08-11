-- Remove retired rental-value fields. Production may already be updated manually.
SET @spaceup_drop_columns = (
    SELECT GROUP_CONCAT(CONCAT('DROP COLUMN `', COLUMN_NAME, '`') ORDER BY ORDINAL_POSITION SEPARATOR ', ')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'analysis_job'
      AND COLUMN_NAME IN (
          'expected_rent_increase_min', 'expected_rent_increase_max',
          'deposit_increase_min', 'deposit_increase_max',
          'preliminary_deposit_increase_min', 'preliminary_deposit_increase_max',
          'preliminary_rent_increase_min', 'preliminary_rent_increase_max'
      )
);
SET @spaceup_drop_sql = IF(@spaceup_drop_columns IS NULL, 'SELECT 1', CONCAT('ALTER TABLE `analysis_job` ', @spaceup_drop_columns));
PREPARE spaceup_drop_statement FROM @spaceup_drop_sql;
EXECUTE spaceup_drop_statement;
DEALLOCATE PREPARE spaceup_drop_statement;