/*
  # Fix Contributions RLS Policies

  1. Changes
    - Drop existing policies
    - Create new policies with correct auth checks
    - Ensure proper access control for all operations
  
  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Use proper UUID comparison for auth.uid()
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view all contributions" ON contributions;
  DROP POLICY IF EXISTS "Users can insert their own contributions" ON contributions;
  DROP POLICY IF EXISTS "Users can update their own contributions" ON contributions;
  DROP POLICY IF EXISTS "Users can delete their own contributions" ON contributions;
END $$;

-- Enable RLS (in case it's not enabled)
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Create new policies with correct auth checks
CREATE POLICY "Enable read access for authenticated users"
  ON contributions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON contributions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for own contributions"
  ON contributions
  FOR UPDATE
  TO authenticated
  USING (participant_id::uuid = auth.uid())
  WITH CHECK (participant_id::uuid = auth.uid());

CREATE POLICY "Enable delete access for own contributions"
  ON contributions
  FOR DELETE
  TO authenticated
  USING (participant_id::uuid = auth.uid());