/*
  # Fix shopping_list table RLS policies

  1. Security
    - Ensure RLS is enabled for shopping_list table
    - Create proper RLS policies for shopping_list table
*/

-- Make sure RLS is enabled
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop the select policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shopping_list' AND policyname = 'Users can read shopping_list'
  ) THEN
    DROP POLICY "Users can read shopping_list" ON shopping_list;
  END IF;

  -- Drop the insert policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shopping_list' AND policyname = 'Users can insert shopping_list'
  ) THEN
    DROP POLICY "Users can insert shopping_list" ON shopping_list;
  END IF;

  -- Drop the update policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shopping_list' AND policyname = 'Users can update shopping_list'
  ) THEN
    DROP POLICY "Users can update shopping_list" ON shopping_list;
  END IF;

  -- Drop the delete policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shopping_list' AND policyname = 'Users can delete shopping_list'
  ) THEN
    DROP POLICY "Users can delete shopping_list" ON shopping_list;
  END IF;
END $$;

-- Create new policies with proper configuration
CREATE POLICY "Users can read shopping_list"
  ON shopping_list
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert shopping_list"
  ON shopping_list
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update shopping_list"
  ON shopping_list
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete shopping_list"
  ON shopping_list
  FOR DELETE
  TO authenticated
  USING (true);