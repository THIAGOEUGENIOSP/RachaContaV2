/*
  # Fix expense_participants table RLS policies

  1. Security
    - Drop existing policies for expense_participants table
    - Re-create RLS policies with proper configuration
*/

-- First, drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop the select policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'expense_participants' AND policyname = 'Anyone can read expense_participants'
  ) THEN
    DROP POLICY "Anyone can read expense_participants" ON expense_participants;
  END IF;

  -- Drop the insert policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'expense_participants' AND policyname = 'Anyone can insert expense_participants'
  ) THEN
    DROP POLICY "Anyone can insert expense_participants" ON expense_participants;
  END IF;

  -- Drop the update policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'expense_participants' AND policyname = 'Anyone can update expense_participants'
  ) THEN
    DROP POLICY "Anyone can update expense_participants" ON expense_participants;
  END IF;

  -- Drop the delete policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'expense_participants' AND policyname = 'Anyone can delete expense_participants'
  ) THEN
    DROP POLICY "Anyone can delete expense_participants" ON expense_participants;
  END IF;
END $$;

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS expense_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid REFERENCES expenses(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Make sure RLS is enabled
ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;

-- Create new policies with proper configuration
CREATE POLICY "Users can read expense_participants"
  ON expense_participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert expense_participants"
  ON expense_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update expense_participants"
  ON expense_participants
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete expense_participants"
  ON expense_participants
  FOR DELETE
  TO authenticated
  USING (true);