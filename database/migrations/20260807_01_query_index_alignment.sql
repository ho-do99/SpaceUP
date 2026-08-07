-- Add only the composite indexes required by the current Spring Data
-- repository query patterns. This migration does not change tables, columns,
-- constraints, or data.

-- Notification list: receiver filter + newest first.
CREATE INDEX idx_notifications_receiver_created
    ON notifications (receiver_id, created_at DESC);

-- Mark-all-read lookup: receiver filter + unread flag.
CREATE INDEX idx_notifications_receiver_read
    ON notifications (receiver_id, is_read);

-- Unread lookup inside one request/contractor thread.
CREATE INDEX idx_chat_messages_thread_unread
    ON chat_messages (request_id, contractor_id, is_read, sender_type);

-- Contractor dashboard count by quote status.
CREATE INDEX idx_contractor_quote_contractor_status
    ON contractor_quote (contractor_id, status);

-- Latest quote for a request and status (for example, the accepted quote).
CREATE INDEX idx_contractor_quote_request_status_updated
    ON contractor_quote (request_id, status, updated_at DESC);
