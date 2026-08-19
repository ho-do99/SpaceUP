SET @schema_name = DATABASE();

SET @has_chat_contractor = (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = @schema_name AND table_name = 'chat_messages' AND column_name = 'contractor_id'
);
SET @ddl = IF(@has_chat_contractor = 0,
    'ALTER TABLE chat_messages ADD COLUMN contractor_id BIGINT NULL AFTER request_id',
    'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE chat_messages cm
LEFT JOIN quote_request qr ON qr.request_id = cm.request_id
LEFT JOIN (
    SELECT request_id, MIN(contractor_id) AS contractor_id
    FROM request_contractors
    GROUP BY request_id
) rc ON rc.request_id = cm.request_id
SET cm.contractor_id = COALESCE(cm.contractor_id, qr.contractor_id, rc.contractor_id)
WHERE cm.contractor_id IS NULL;

SET @has_chat_index = (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = @schema_name AND table_name = 'chat_messages'
      AND index_name = 'idx_chat_messages_thread_created'
);
SET @ddl = IF(@has_chat_index = 0,
    'ALTER TABLE chat_messages ADD INDEX idx_chat_messages_thread_created (request_id, contractor_id, created_at)',
    'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_chat_fk = (
    SELECT COUNT(*) FROM information_schema.referential_constraints
    WHERE constraint_schema = @schema_name AND table_name = 'chat_messages'
      AND constraint_name = 'fk_chat_messages_contractor'
);
SET @ddl = IF(@has_chat_fk = 0,
    'ALTER TABLE chat_messages ADD CONSTRAINT fk_chat_messages_contractor FOREIGN KEY (contractor_id) REFERENCES user_account(user_id)',
    'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_floorplan_variant = (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = @schema_name AND table_name = 'quote_request' AND column_name = 'floor_plan_variant_id'
);
SET @ddl = IF(@has_floorplan_variant = 0,
    'ALTER TABLE quote_request ADD COLUMN floor_plan_variant_id BIGINT NULL AFTER property_id',
    'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_floorplan_index = (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = @schema_name AND table_name = 'quote_request'
      AND index_name = 'idx_quote_request_floor_plan_variant'
);
SET @ddl = IF(@has_floorplan_index = 0,
    'ALTER TABLE quote_request ADD INDEX idx_quote_request_floor_plan_variant (floor_plan_variant_id)',
    'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_floorplan_fk = (
    SELECT COUNT(*) FROM information_schema.referential_constraints
    WHERE constraint_schema = @schema_name AND table_name = 'quote_request'
      AND constraint_name = 'fk_quote_request_floor_plan_variant'
);
SET @ddl = IF(@has_floorplan_fk = 0,
    'ALTER TABLE quote_request ADD CONSTRAINT fk_quote_request_floor_plan_variant FOREIGN KEY (floor_plan_variant_id) REFERENCES floorplan_variants(id) ON DELETE SET NULL',
    'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
