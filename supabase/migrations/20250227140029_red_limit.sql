/*
  # Fix expense division logic for Splitwise-like functionality

  1. Updates
    - Ensure expense_participants table has proper RLS policies
    - Add payer_id column to expenses table if not exists
  
  2. Security
    - Update RLS policies to allow proper access to expense_participants
*/

-- Make sure payer_id column exists in expenses table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'payer_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN payer_id uuid REFERENCES participants(id);
  END IF;
END $$;

-- Make sure RLS is enabled on expense_participants
ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop all existing policies on expense_participants
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS "' || policyname || '" ON expense_participants;', ' ')
    FROM pg_policies
    WHERE tablename = 'expense_participants'
  );
EXCEPTION WHEN OTHERS THEN
  -- If there's an error, just continue
  NULL;
END $$;

-- Create new policies with proper configuration for anonymous users
CREATE POLICY "anon_select_expense_participants"
  ON expense_participants
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_insert_expense_participants"
  ON expense_participants
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_update_expense_participants"
  ON expense_participants
  FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "anon_delete_expense_participants"
  ON expense_participants
  FOR DELETE
  TO anon
  USING (true);

-- Also create policies for authenticated users
CREATE POLICY "authenticated_select_expense_participants"
  ON expense_participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_insert_expense_participants"
  ON expense_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_expense_participants"
  ON expense_participants
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_delete_expense_participants"
  ON expense_participants
  FOR DELETE
  TO authenticated
  USING (true);