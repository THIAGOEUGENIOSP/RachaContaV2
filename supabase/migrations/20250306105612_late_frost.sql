/*
  # Disable RLS for Contributions Table

  1. Changes
    - Drop all existing policies
    - Disable RLS on contributions table
    
  2. Security
    - Remove RLS since there's no authentication
    - Allow public access to all operations
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
  DROP POLICY IF EXISTS "Enable read access for all users" ON contributions;
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON contributions;
  DROP POLICY IF EXISTS "Enable update for authenticated users" ON contributions;
  DROP POLICY IF EXISTS "Enable delete for authenticated users" ON contributions;
END $$;

-- Disable RLS
ALTER TABLE contributions DISABLE ROW LEVEL SECURITY;