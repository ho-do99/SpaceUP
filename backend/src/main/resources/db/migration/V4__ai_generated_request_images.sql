-- Keep uploaded room photos and AI-generated remodeling results in the same
-- request_image table while preserving their distinct business meanings.
ALTER TABLE request_image
    MODIFY COLUMN image_type ENUM('FLOOR_PLAN', 'PHOTO', 'AI_GENERATED') NOT NULL;
