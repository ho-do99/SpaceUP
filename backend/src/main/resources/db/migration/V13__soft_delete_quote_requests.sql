ALTER TABLE `quote_request`
  ADD COLUMN `deleted_at` DATETIME(6) NULL AFTER `warning_sent`,
  ADD INDEX `idx_quote_request_owner_deleted` (`owner_id`, `deleted_at`);
