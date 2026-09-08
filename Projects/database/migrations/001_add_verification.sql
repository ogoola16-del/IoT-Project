-- ============================================================
-- MIGRATION: Add Email Verification (PostgreSQL)
-- ============================================================
-- Run this only if upgrading from an older schema.
-- Prefer using the full schema.sql for new deployments.

ALTER TABLE doctors
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS email_verifications (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_email
    ON email_verifications (email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_code
    ON email_verifications (code);
