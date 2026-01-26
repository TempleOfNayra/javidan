-- Migration: Add hashtags, additional_info, and twitter_url to records table
-- Run this via /api/init-db or manually in your database

ALTER TABLE records
ADD COLUMN IF NOT EXISTS hashtags TEXT,
ADD COLUMN IF NOT EXISTS additional_info TEXT,
ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(500);
