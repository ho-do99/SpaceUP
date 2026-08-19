-- The production database was baselined from the legacy schema where only
-- REQUEST, QUOTE, SCHEDULE and SETTLEMENT notifications were allowed.
-- Chat messages and visit changes create CHAT/VISIT notifications in the same
-- transaction, so MySQL rejected the enum value and rolled the business write
-- back. Keep the enum aligned with NotificationType for both upgraded and
-- freshly created databases.
ALTER TABLE notifications
    MODIFY COLUMN type ENUM(
        'REQUEST',
        'QUOTE',
        'SCHEDULE',
        'SETTLEMENT',
        'CHAT',
        'VISIT',
        'REVIEW',
        'PROJECT'
    ) NOT NULL;
