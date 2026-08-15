-- =============================================
-- Pustora: OTP Codes table for Brevo email OTP
-- Run this in Supabase SQL Editor
-- =============================================

-- Create otp_codes table
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL,
  otp_hash      TEXT NOT NULL,           -- SHA-256 hash of OTP (never store plaintext)
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,    -- Usually created_at + 10 minutes
  used_at       TIMESTAMPTZ,            -- NULL = not yet used
  attempt_count INT DEFAULT 0 NOT NULL  -- Track wrong attempts
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_email       ON public.otp_codes (email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_email_expires ON public.otp_codes (email, expires_at);

-- Enable Row Level Security
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write (API routes use SUPABASE_SERVICE_ROLE_KEY)
-- No public access policies needed

-- Optional: auto-cleanup of expired OTPs older than 24 hours
-- (Can be run as a scheduled Postgres function or Supabase cron)
-- DELETE FROM public.otp_codes WHERE expires_at < now() - interval '24 hours';

COMMENT ON TABLE public.otp_codes IS 'Stores hashed OTPs for email verification via Brevo. Managed by /api/send-otp and /api/verify-otp routes.';
COMMENT ON COLUMN public.otp_codes.otp_hash IS 'SHA-256 hash of the 6-digit OTP. Never stores plaintext OTP.';
COMMENT ON COLUMN public.otp_codes.attempt_count IS 'Number of failed verification attempts. Block after 5.';
