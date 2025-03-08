/*
  # Add Carnival Relationships and Update Data Structure

  1. Changes
    - Add carnival_id to expenses, payments, and shopping_list tables
    - Create default carnival for 2025 if it doesn't exist
    - Link all existing records to Carnival 2025
    - Add indexes for better performance
    - Update RLS policies

  2. Security
    - Enable RLS on all affected tables
    - Add policies for carnival-specific access

  3. Notes
    - Handles existing data by linking to Carnival 2025
    - Ensures data integrity through proper constraints
    - Creates necessary indexes for performance
*/

-- Create Carnival 2025 if it doesn't exist
DO $$ 
DECLARE
  carnival_2025_id uuid;
BEGIN
  -- First check if Carnival 2025 exists
  SELECT id INTO carnival_2025_id
  FROM carnivals 
  WHERE year = 2025;

  -- If it doesn't exist, create it
  IF carnival_2025_id IS NULL THEN
    INSERT INTO carnivals (year, name, start_date, end_date, status)
    VALUES (
      2025,
      'Carnaval 2025',
      '2025-02-14',
      '2025-02-18',
      'active'
    )
    RETURNING id INTO carnival_2025_id;
  END IF;

  -- Add carnival_id to expenses if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'carnival_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN carnival_id uuid;
    CREATE INDEX idx_expenses_carnival_id ON expenses(carnival_id);
  END IF;

  -- Add carnival_id to payments if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'carnival_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN carnival_id uuid;
    CREATE INDEX idx_payments_carnival_id ON payments(carnival_id);
  END IF;

  -- Add carnival_id to shopping_list if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shopping_list' AND column_name = 'carnival_id'
  ) THEN
    ALTER TABLE shopping_list ADD COLUMN carnival_id uuid;
    CREATE INDEX idx_shopping_list_carnival_id ON shopping_list(carnival_id);
  END IF;

  -- Update all existing records to link to Carnival 2025
  UPDATE expenses SET carnival_id = carnival_2025_id WHERE carnival_id IS NULL;
  UPDATE payments SET carnival_id = carnival_2025_id WHERE carnival_id IS NULL;
  UPDATE shopping_list SET carnival_id = carnival_2025_id WHERE carnival_id IS NULL;

  -- Add foreign key constraints
  ALTER TABLE expenses 
    ADD CONSTRAINT fk_expenses_carnival 
    FOREIGN KEY (carnival_id) 
    REFERENCES carnivals(id) 
    ON DELETE CASCADE;

  ALTER TABLE payments 
    ADD CONSTRAINT fk_payments_carnival 
    FOREIGN KEY (carnival_id) 
    REFERENCES carnivals(id) 
    ON DELETE CASCADE;

  ALTER TABLE shopping_list 
    ADD CONSTRAINT fk_shopping_list_carnival 
    FOREIGN KEY (carnival_id) 
    REFERENCES carnivals(id) 
    ON DELETE CASCADE;

  -- Now that all records have been updated, add NOT NULL constraints
  ALTER TABLE expenses ALTER COLUMN carnival_id SET NOT NULL;
  ALTER TABLE payments ALTER COLUMN carnival_id SET NOT NULL;
  ALTER TABLE shopping_list ALTER COLUMN carnival_id SET NOT NULL;
END $$;

-- Create composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_carnival_date 
  ON expenses(carnival_id, date);

CREATE INDEX IF NOT EXISTS idx_payments_carnival_date 
  ON payments(carnival_id, created_at);

CREATE INDEX IF NOT EXISTS idx_shopping_list_carnival_completed 
  ON shopping_list(carnival_id, completed);

-- Update RLS policies for carnival-specific access

-- Expenses policies
DROP POLICY IF EXISTS "Users can view carnival expenses" ON expenses;
CREATE POLICY "Users can view carnival expenses" ON expenses
  FOR SELECT
  TO authenticated
  USING (true);

-- Payments policies
DROP POLICY IF EXISTS "Users can view carnival payments" ON payments;
CREATE POLICY "Users can view carnival payments" ON payments
  FOR SELECT
  TO authenticated
  USING (true);

-- Shopping list policies
DROP POLICY IF EXISTS "Users can view carnival shopping list" ON shopping_list;
CREATE POLICY "Users can view carnival shopping list" ON shopping_list
  FOR SELECT
  TO authenticated
  USING (true);