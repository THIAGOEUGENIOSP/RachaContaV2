/*
  # Fix Row Level Security Policies

  1. Changes
    - Update RLS policies to allow public access for all tables
    - This is necessary because the application is not using authentication yet

  2. Security
    - Note: In a production environment, you should implement proper authentication
    - These policies are for development purposes only
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow full access to authenticated users for participants" ON participants;
DROP POLICY IF EXISTS "Allow full access to authenticated users for expenses" ON expenses;
DROP POLICY IF EXISTS "Allow full access to authenticated users for payments" ON payments;
DROP POLICY IF EXISTS "Allow full access to authenticated users for shopping_list" ON shopping_list;

-- Create new policies that allow public access
CREATE POLICY "Allow public access for participants"
  ON participants
  FOR ALL
  USING (true);

CREATE POLICY "Allow public access for expenses"
  ON expenses
  FOR ALL
  USING (true);

CREATE POLICY "Allow public access for payments"
  ON payments
  FOR ALL
  USING (true);

CREATE POLICY "Allow public access for shopping_list"
  ON shopping_list
  FOR ALL
  USING (true);