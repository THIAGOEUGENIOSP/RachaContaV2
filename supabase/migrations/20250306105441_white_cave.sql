/*
  # Fix Contributions Table RLS Policies

  1. Changes
    - Drop existing policies
    - Enable RLS
    - Create new policies for all CRUD operations
    - Set up proper access control for authenticated users
  
  2. Security
    - Enable RLS on contributions table
    - Allow authenticated users to perform all operations
    - Ensure proper access control
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view all contributions" ON contributions;
  DROP POLICY IF EXISTS "Users can insert their own contributions" ON contributions;
  DROP POLICY IF EXISTS "Users can update their own contributions" ON contributions;
  DROP POLICY IF EXISTS "Users can delete their own contributions" ON contributions;
  DROP POLICY IF EXISTS "Enable read access for authenticated users" ON contributions;
  DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON contributions;
  DROP POLICY IF EXISTS "Enable update access for own contributions" ON contributions;
  DROP POLICY IF EXISTS "Enable delete access for own contributions" ON contributions;
END $$;

-- Enable RLS
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Enable read access for all users"
  ON contributions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON contributions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON contributions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON contributions
  FOR DELETE
  TO authenticated
  USING (true);