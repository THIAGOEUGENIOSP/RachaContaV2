/*
  # Fix carnival schema and relationships

  1. Changes
    - Add proper status handling for carnivals
    - Add constraints and indexes
    - Update foreign key relationships
    - Add RLS policies

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create carnival_status type if not exists
DO $$ BEGIN
  CREATE TYPE carnival_status AS ENUM ('planning', 'active', 'completed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create a temporary table to store existing data
CREATE TEMP TABLE temp_carnivals AS 
SELECT * FROM carnivals;

-- Drop existing table
DROP TABLE carnivals CASCADE;

-- Recreate carnivals table with proper status type
CREATE TABLE carnivals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL CHECK (year >= 2024),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL CHECK (end_date >= start_date),
  status carnival_status NOT NULL DEFAULT 'planning'::carnival_status,
  created_at timestamptz DEFAULT now()
);

-- Restore data with proper status casting
INSERT INTO carnivals (id, year, name, start_date, end_date, status, created_at)
SELECT 
  id, 
  year, 
  name, 
  start_date, 
  end_date,
  CASE status
    WHEN 'planning' THEN 'planning'::carnival_status
    WHEN 'active' THEN 'active'::carnival_status
    WHEN 'completed' THEN 'completed'::carnival_status
    ELSE 'planning'::carnival_status
  END,
  created_at
FROM temp_carnivals;

-- Drop temporary table
DROP TABLE temp_carnivals;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_carnivals_status ON carnivals(status);
CREATE INDEX IF NOT EXISTS idx_carnivals_year ON carnivals(year);
CREATE UNIQUE INDEX IF NOT EXISTS idx_carnivals_active ON carnivals(status) WHERE status = 'active';

-- Enable RLS
ALTER TABLE carnivals ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public can view carnivals'
  ) THEN
    CREATE POLICY "Public can view carnivals"
      ON carnivals
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can manage carnivals'
  ) THEN
    CREATE POLICY "Authenticated users can manage carnivals"
      ON carnivals
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Update related tables to require carnival_id
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' 
    AND column_name = 'carnival_id' 
    AND is_nullable = 'YES'
  ) THEN
    -- First, delete any records without carnival_id
    DELETE FROM expenses WHERE carnival_id IS NULL;
    -- Then make the column not null
    ALTER TABLE expenses
    ALTER COLUMN carnival_id SET NOT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' 
    AND column_name = 'carnival_id' 
    AND is_nullable = 'YES'
  ) THEN
    -- First, delete any records without carnival_id
    DELETE FROM payments WHERE carnival_id IS NULL;
    -- Then make the column not null
    ALTER TABLE payments
    ALTER COLUMN carnival_id SET NOT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shopping_list' 
    AND column_name = 'carnival_id' 
    AND is_nullable = 'YES'
  ) THEN
    -- First, delete any records without carnival_id
    DELETE FROM shopping_list WHERE carnival_id IS NULL;
    -- Then make the column not null
    ALTER TABLE shopping_list
    ALTER COLUMN carnival_id SET NOT NULL;
  END IF;
END $$;

-- Add foreign key constraints if not exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_expenses_carnival'
  ) THEN
    ALTER TABLE expenses
    ADD CONSTRAINT fk_expenses_carnival
    FOREIGN KEY (carnival_id) REFERENCES carnivals(id)
    ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_payments_carnival'
  ) THEN
    ALTER TABLE payments
    ADD CONSTRAINT fk_payments_carnival
    FOREIGN KEY (carnival_id) REFERENCES carnivals(id)
    ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_shopping_list_carnival'
  ) THEN
    ALTER TABLE shopping_list
    ADD CONSTRAINT fk_shopping_list_carnival
    FOREIGN KEY (carnival_id) REFERENCES carnivals(id)
    ON DELETE CASCADE;
  END IF;
END $$;