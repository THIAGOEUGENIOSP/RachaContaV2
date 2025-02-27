/*
  # Fix expenses table RLS policies

  1. Security
    - Ensure RLS is enabled for expenses table
    - Create proper RLS policies for expenses table
*/

-- Make sure RLS is enabled
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop the select policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'expenses' AND policyname = 'Users can read expenses'
  ) THEN
    DROP POLICY "Users can read expenses" ON expenses;
  END IF;

  -- Drop the insert policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'expenses' AND policyname = 'Users can insert expenses'
  ) THEN
    DROP POLICY "Users can insert expenses" ON expenses;
  END IF;

  -- Drop the update policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'expenses' AND policyname = 'Users can update expenses'
  ) THEN
    DROP POLICY "Users can update expenses" ON expenses;
  END IF;

  -- Drop the delete policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'expenses' AND policyname = 'Users can delete expenses'
  ) THEN
    DROP POLICY "Users can delete expenses" ON expenses;
  END IF;
END $$;

-- Create new policies with proper configuration
CREATE POLICY "Users can read expenses"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert expenses"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update expenses"
  ON expenses
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete expenses"
  ON expenses
  FOR DELETE
  TO authenticated
  USING (true);