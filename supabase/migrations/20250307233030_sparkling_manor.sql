/*
  # Database Structure Update

  1. Changes
    - Enable RLS on all tables
    - Add proper indexes for performance
    - Add foreign key constraints with cascade behavior
    - Add RLS policies for data access
    - Set default values for better data consistency

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Drop existing policies first to avoid conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "authenticated_read_carnivals" ON carnivals;
  DROP POLICY IF EXISTS "authenticated_write_carnivals" ON carnivals;
  DROP POLICY IF EXISTS "authenticated_update_carnivals" ON carnivals;
  DROP POLICY IF EXISTS "authenticated_delete_carnivals" ON carnivals;
  DROP POLICY IF EXISTS "authenticated_read_carnival_participants" ON carnival_participants;
  DROP POLICY IF EXISTS "authenticated_write_carnival_participants" ON carnival_participants;
  DROP POLICY IF EXISTS "authenticated_update_carnival_participants" ON carnival_participants;
  DROP POLICY IF EXISTS "authenticated_delete_carnival_participants" ON carnival_participants;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Enable RLS on all tables
ALTER TABLE carnivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE carnival_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_carnival_date ON expenses(carnival_id, date);
CREATE INDEX IF NOT EXISTS idx_payments_carnival_date ON payments(carnival_id, created_at);
CREATE INDEX IF NOT EXISTS idx_shopping_list_carnival_completed ON shopping_list(carnival_id, completed);
CREATE INDEX IF NOT EXISTS idx_carnival_participants_carnival ON carnival_participants(carnival_id);

-- Drop existing foreign key constraints
DO $$ 
BEGIN
  ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_carnival_id_fkey;
  ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_carnival_id_fkey;
  ALTER TABLE shopping_list DROP CONSTRAINT IF EXISTS shopping_list_carnival_id_fkey;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add foreign key constraints with cascade behavior
ALTER TABLE expenses
  ADD CONSTRAINT expenses_carnival_id_fkey 
  FOREIGN KEY (carnival_id) 
  REFERENCES carnivals(id) 
  ON DELETE CASCADE;

ALTER TABLE payments
  ADD CONSTRAINT payments_carnival_id_fkey 
  FOREIGN KEY (carnival_id) 
  REFERENCES carnivals(id) 
  ON DELETE CASCADE;

ALTER TABLE shopping_list
  ADD CONSTRAINT shopping_list_carnival_id_fkey 
  FOREIGN KEY (carnival_id) 
  REFERENCES carnivals(id) 
  ON DELETE CASCADE;

-- Add RLS policies for carnivals
CREATE POLICY "authenticated_read_carnivals_new"
  ON carnivals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_write_carnivals_new"
  ON carnivals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_carnivals_new"
  ON carnivals FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_delete_carnivals_new"
  ON carnivals FOR DELETE
  TO authenticated
  USING (true);

-- Add RLS policies for carnival participants
CREATE POLICY "authenticated_read_carnival_participants_new"
  ON carnival_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_write_carnival_participants_new"
  ON carnival_participants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_carnival_participants_new"
  ON carnival_participants FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_delete_carnival_participants_new"
  ON carnival_participants FOR DELETE
  TO authenticated
  USING (true);

-- Add default values for better data consistency
ALTER TABLE shopping_list ALTER COLUMN completed SET DEFAULT false;
ALTER TABLE shopping_list ALTER COLUMN quantity SET DEFAULT 1;
ALTER TABLE expenses ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE payments ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE shopping_list ALTER COLUMN created_at SET DEFAULT now();