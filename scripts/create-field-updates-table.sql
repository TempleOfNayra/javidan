-- Audit log table for tracking field updates
CREATE TABLE IF NOT EXISTS field_updates (
  id SERIAL PRIMARY KEY,
  record_type VARCHAR(20) NOT NULL,  -- 'victim', 'agent', 'force', 'video', 'document'
  record_id INTEGER NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  old_value TEXT,  -- Should be NULL for new field fills
  new_value TEXT NOT NULL,
  submitter_twitter_id VARCHAR(100),  -- Optional attribution
  submitter_ip VARCHAR(45),  -- For rate limiting (temporary, until auth)
  submitter_user_id INTEGER,  -- For future auth integration
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_field_updates_record ON field_updates(record_type, record_id);
CREATE INDEX idx_field_updates_ip ON field_updates(submitter_ip, created_at);
CREATE INDEX idx_field_updates_user ON field_updates(submitter_user_id);

-- Comment for future reference
COMMENT ON COLUMN field_updates.submitter_ip IS 'Used for rate limiting until auth is implemented';
COMMENT ON COLUMN field_updates.submitter_user_id IS 'Will be used when authentication is added';
