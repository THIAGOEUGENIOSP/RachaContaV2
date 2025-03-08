/*
  # Add Carnival Support and Update Policies

  1. Changes
    - Create default carnival for 2025
    - Add carnival_id to expenses, payments, and shopping_list tables
    - Update existing records to link to Carnival 2025
    - Add NOT NULL constraints after data migration
    - Create indexes for better performance
    - Update RLS policies for carnival-specific access

  2. Security
    - Drop existing policies to avoid conflicts
    - Create new policies for carnival-specific access
    - Ensure proper data access control
*/

-- First, ensure we have at least one carnival for 2025
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM carnivals WHERE year = 2025
  ) THEN
    INSERT INTO carnivals (year, name, start_date, end_date, status)
    VALUES (
      2025,
      'Carnaval 2025',
      '2025-02-14',
      '2025-02-18',
      'active'
    );
  END IF;
END $$;

-- Get the carnival ID for 2025
DO $$ 
DECLARE
  v_carnival_id uuid;
BEGIN
  SELECT id INTO v_carnival_id FROM carnivals WHERE year = 2025;

  -- Add carnival_id to expenses if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'carnival_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN carnival_id uuid REFERENCES carnivals(id) ON DELETE CASCADE;
    CREATE INDEX idx_expenses_carnival_id ON expenses(carnival_id);
    -- Update existing records
    UPDATE expenses SET carnival_id = v_carnival_id WHERE carnival_id IS NULL;
  END IF;

  -- Add carnival_id to payments if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'carnival_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN carnival_id uuid REFERENCES carnivals(id) ON DELETE CASCADE;
    CREATE INDEX idx_payments_carnival_id ON payments(carnival_id);
    -- Update existing records
    UPDATE payments SET carnival_id = v_carnival_id WHERE carnival_id IS NULL;
  END IF;

  -- Add carnival_id to shopping_list if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shopping_list' AND column_name = 'carnival_id'
  ) THEN
    ALTER TABLE shopping_list ADD COLUMN carnival_id uuid REFERENCES carnivals(id) ON DELETE CASCADE;
    CREATE INDEX idx_shopping_list_carnival_id ON shopping_list(carnival_id);
    -- Update existing records
    UPDATE shopping_list SET carnival_id = v_carnival_id WHERE carnival_id IS NULL;
  END IF;

  -- Now that all existing records have been updated, we can add the NOT NULL constraints
  ALTER TABLE expenses 
    ALTER COLUMN carnival_id SET NOT NULL;

  ALTER TABLE payments 
    ALTER COLUMN carnival_id SET NOT NULL;

  ALTER TABLE shopping_list 
    ALTER COLUMN carnival_id SET NOT NULL;
END $$;

-- Drop existing policies before creating new ones
DROP POLICY IF EXISTS "Users can view carnival expenses" ON expenses;
DROP POLICY IF EXISTS "Users can view carnival payments" ON payments;
DROP POLICY IF EXISTS "Users can view carnival shopping list" ON shopping_list;

-- Create new policies for carnival-specific access

-- Expenses policies
CREATE POLICY "Users can view carnival expenses" ON expenses
  FOR SELECT
  TO authenticated
  USING (carnival_id IS NOT NULL);

-- Payments policies
CREATE POLICY "Users can view carnival payments" ON payments
  FOR SELECT
  TO authenticated
  USING (carnival_id IS NOT NULL);

-- Shopping list policies
CREATE POLICY "Users can view carnival shopping list" ON shopping_list
  FOR SELECT
  TO authenticated
  USING (carnival_id IS NOT NULL);

-- Create composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_carnival_date ON expenses(carnival_id, date);
CREATE INDEX IF NOT EXISTS idx_payments_carnival_date ON payments(carnival_id, created_at);
CREATE INDEX IF NOT EXISTS idx_shopping_list_carnival_completed ON shopping_list(carnival_id, completed);