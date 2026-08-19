ALTER TABLE contractor_quote
    ADD COLUMN quote_phase VARCHAR(20) NOT NULL DEFAULT 'PRELIMINARY';

CREATE INDEX idx_contractor_quote_request_phase_status_updated
    ON contractor_quote (request_id, quote_phase, status, updated_at);