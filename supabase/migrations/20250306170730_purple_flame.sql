/*
  # Auth Schema and Constraints Setup

  1. Changes
    - Create auth schema and users table if they don't exist
    - Add foreign key constraints for user_id columns with proper existence checks
    - Ensure no duplicate constraints are created

  2. Security
    - Maintain referential integrity with CASCADE delete
    - Proper schema permissions
*/

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.users if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'auth' 
    AND tablename = 'users'
  ) THEN
    CREATE TABLE auth.users (
      id uuid NOT NULL PRIMARY KEY,
      email text,
      CONSTRAINT users_email_key UNIQUE (email)
    );
  END IF;
END $$;

-- Add user_id foreign key constraints with existence checks
DO $$ 
BEGIN
  -- participants table constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'participants_user_id_fkey'
  ) THEN
    ALTER TABLE participants 
      ADD CONSTRAINT participants_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;

  -- expenses table constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'expenses_user_id_fkey'
  ) THEN
    ALTER TABLE expenses 
      ADD CONSTRAINT expenses_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;

  -- shopping_list table constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'shopping_list_user_id_fkey'
  ) THEN
    ALTER TABLE shopping_list 
      ADD CONSTRAINT shopping_list_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;

  -- contributions table constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'contributions_user_id_fkey'
  ) THEN
    ALTER TABLE contributions 
      ADD CONSTRAINT contributions_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
END $$;