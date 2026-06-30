-- Migration: add read_at to contact_submissions for inbox read-state tracking
ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS read_at timestamptz;
