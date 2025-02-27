/*
  # Fix participants table RLS policies

  1. Security
    - Ensure RLS is enabled for participants table
    - Create proper RLS policies for participants table
*/

-- Make sure RLS is enabled
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop the select policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'participants' AND policyname = 'Users can read participants'
  ) THEN
    DROP POLICY "Users can read participants" ON participants;
  END IF;

  -- Drop the insert policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'participants' AND policyname = 'Users can insert participants'
  ) THEN
    DROP POLICY "Users can insert participants" ON participants;
  END IF;

  -- Drop the update policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'participants' AND policyname = 'Users can update participants'
  ) THEN
    DROP POLICY "Users can update participants" ON participants;
  END IF;

  -- Drop the delete policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'participants' AND policyname = 'Users can delete participants'
  ) THEN
    DROP POLICY "Users can delete participants" ON participants;
  END IF;
END $$;

-- Create new policies with proper configuration
CREATE POLICY "Users can read participants"
  ON participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert participants"
  ON participants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update participants"
  ON participants
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete participants"
  ON participants
  FOR DELETE
  TO authenticated
  USING (true);