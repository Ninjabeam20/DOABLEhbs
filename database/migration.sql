-- Migration SQL for existing databases
-- Run this if you already created the database with the old schema

USE doable_db;

-- Remove email column from users table (if it exists)
ALTER TABLE users DROP COLUMN IF EXISTS email;
DROP INDEX IF EXISTS idx_email ON users;

-- Add is_deleted column to todos table (if it doesn't exist)
ALTER TABLE todos ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Add index for is_deleted column
CREATE INDEX IF NOT EXISTS idx_is_deleted ON todos(is_deleted);

-- Update any existing todos to have is_deleted = FALSE (in case of NULL values)
UPDATE todos SET is_deleted = FALSE WHERE is_deleted IS NULL;

