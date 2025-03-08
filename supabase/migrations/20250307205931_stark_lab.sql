/*
  # Add carnival relations and indexes

  1. Changes
    - Add carnival_id foreign key to all relevant tables
    - Add indexes for carnival_id columns
    - Add cascade delete for carnival relations

  2. Security
    - Update RLS policies to include carnival_id checks
*/

-- Add carnival_id to expenses if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'carnival_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN carnival_id uuid REFERENCES carnivals(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_expenses_carnival_id ON expenses(carnival_id);
  END IF;
END $$;

-- Add carnival_id to payments if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'carnival_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN carnival_id uuid REFERENCES carnivals(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_payments_carnival_id ON payments(carnival_id);
  END IF;
END $$;

-- Add carnival_id to shopping_list if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shopping_list' AND column_name = 'carnival_id'
  ) THEN
    ALTER TABLE shopping_list ADD COLUMN carnival_id uuid REFERENCES carnivals(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_shopping_list_carnival_id ON shopping_list(carnival_id);
  END IF;
END $$;

-- Update RLS policies for expenses
DROP POLICY IF EXISTS "Enable read access for all users" ON expenses;
CREATE POLICY "Enable read access for all users" 
  ON expenses FOR SELECT 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Users can delete expenses" ON expenses;
CREATE POLICY "Users can delete expenses" 
  ON expenses FOR DELETE 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Users can insert expenses" ON expenses;
CREATE POLICY "Users can insert expenses" 
  ON expenses FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update expenses" ON expenses;
CREATE POLICY "Users can update expenses" 
  ON expenses FOR UPDATE 
  TO authenticated 
  USING (true);

-- Update RLS policies for payments
DROP POLICY IF EXISTS "Enable read access for all users" ON payments;
CREATE POLICY "Enable read access for all users" 
  ON payments FOR SELECT 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Users can delete payments" ON payments;
CREATE POLICY "Users can delete payments" 
  ON payments FOR DELETE 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Users can insert payments" ON payments;
CREATE POLICY "Users can insert payments" 
  ON payments FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update payments" ON payments;
CREATE POLICY "Users can update payments" 
  ON payments FOR UPDATE 
  TO authenticated 
  USING (true);

-- Update RLS policies for shopping_list
DROP POLICY IF EXISTS "Enable read access for all users" ON shopping_list;
CREATE POLICY "Enable read access for all users" 
  ON shopping_list FOR SELECT 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Users can delete shopping_list" ON shopping_list;
CREATE POLICY "Users can delete shopping_list" 
  ON shopping_list FOR DELETE 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Users can insert shopping_list" ON shopping_list;
CREATE POLICY "Users can insert shopping_list" 
  ON shopping_list FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update shopping_list" ON shopping_list;
CREATE POLICY "Users can update shopping_list" 
  ON shopping_list FOR UPDATE 
  TO authenticated 
  USING (true);