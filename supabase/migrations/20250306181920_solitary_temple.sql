/*
  # Remove User Authentication and Switch to Public Access

  1. Changes
    - Drop all existing RLS policies
    - Drop user_id columns from all tables using CASCADE
    - Create new public access policies
    - Drop admin_users table

  2. Security
    - Switch to public access model
    - Remove user-specific restrictions
    - Enable full access to all tables
*/

-- First drop all expense-related policies that depend on user_id
DO $$ 
BEGIN
  -- Drop expense_participants policies
  DROP POLICY IF EXISTS "Users can manage expense participants" ON expense_participants;
  DROP POLICY IF EXISTS "Users can view shared expense participants" ON expense_participants;
  DROP POLICY IF EXISTS "Users can insert expense participants" ON expense_participants;
  DROP POLICY IF EXISTS "Users can update expense participants" ON expense_participants;
  DROP POLICY IF EXISTS "Users can delete expense participants" ON expense_participants;
  
  -- Drop expense policies that depend on user_id
  DROP POLICY IF EXISTS "Users can insert their own expenses" ON expenses;
  DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;
  DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses;
  DROP POLICY IF EXISTS "Enable insert for own expenses" ON expenses;
  DROP POLICY IF EXISTS "Enable update for own expenses" ON expenses;
  DROP POLICY IF EXISTS "Enable delete for own expenses" ON expenses;
  DROP POLICY IF EXISTS "Enable write access for authenticated users" ON expenses;
  DROP POLICY IF EXISTS "Users can view shared expenses" ON expenses;
  DROP POLICY IF EXISTS "Enable read access for shared expenses" ON expenses;
  DROP POLICY IF EXISTS "Users can read expenses" ON expenses;
  
  -- Drop shopping list policies that depend on user_id
  DROP POLICY IF EXISTS "Users can insert shopping list items" ON shopping_list;
  DROP POLICY IF EXISTS "Users can delete their shopping list items" ON shopping_list;
  DROP POLICY IF EXISTS "Enable read access for shopping list" ON shopping_list;
  DROP POLICY IF EXISTS "Enable insert for own shopping items" ON shopping_list;
  DROP POLICY IF EXISTS "Enable update for own shopping items" ON shopping_list;
  DROP POLICY IF EXISTS "Enable delete for own shopping items" ON shopping_list;
  DROP POLICY IF EXISTS "Users can read shopping_list" ON shopping_list;
  
  -- Drop participant policies that depend on user_id
  DROP POLICY IF EXISTS "Users can insert their own participants" ON participants;
  DROP POLICY IF EXISTS "Users can update their own participants" ON participants;
  DROP POLICY IF EXISTS "Users can delete their own participants" ON participants;
  DROP POLICY IF EXISTS "Enable insert for own participants" ON participants;
  DROP POLICY IF EXISTS "Enable update for own participants" ON participants;
  DROP POLICY IF EXISTS "Enable delete for own participants" ON participants;
  DROP POLICY IF EXISTS "Enable read access for authenticated users" ON participants;
  DROP POLICY IF EXISTS "Users can read participants" ON participants;
  
  -- Drop payment policies that depend on user_id
  DROP POLICY IF EXISTS "Users can view shared payments" ON payments;
  DROP POLICY IF EXISTS "Users can insert payments" ON payments;
  DROP POLICY IF EXISTS "Users can update their payments" ON payments;
  DROP POLICY IF EXISTS "Users can delete their payments" ON payments;
  DROP POLICY IF EXISTS "Users can manage payments" ON payments;
  DROP POLICY IF EXISTS "Users can read payments" ON payments;
  
  -- Drop contribution policies that depend on user_id
  DROP POLICY IF EXISTS "Users can insert their own contributions" ON contributions;
  DROP POLICY IF EXISTS "Users can update their own contributions" ON contributions;
  DROP POLICY IF EXISTS "Users can delete their own contributions" ON contributions;
  DROP POLICY IF EXISTS "Enable read access for contributions" ON contributions;
  DROP POLICY IF EXISTS "Enable insert for own contributions" ON contributions;
  DROP POLICY IF EXISTS "Enable update for own contributions" ON contributions;
  DROP POLICY IF EXISTS "Enable delete for own contributions" ON contributions;
  DROP POLICY IF EXISTS "Users can read contributions" ON contributions;
END $$;

-- Now we can safely drop the user_id columns with CASCADE
ALTER TABLE participants DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE expenses DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE shopping_list DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE contributions DROP COLUMN IF EXISTS user_id CASCADE;

-- Drop admin_users table
DROP TABLE IF EXISTS admin_users;

-- Create new public access policies
DO $$
BEGIN
  -- Create policy for participants if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'participants' 
    AND policyname = 'Allow public access for participants'
  ) THEN
    CREATE POLICY "Allow public access for participants" ON participants
      FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Create policy for expenses if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'expenses' 
    AND policyname = 'Allow public access for expenses'
  ) THEN
    CREATE POLICY "Allow public access for expenses" ON expenses
      FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Create policy for shopping_list if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shopping_list' 
    AND policyname = 'Allow public access for shopping_list'
  ) THEN
    CREATE POLICY "Allow public access for shopping_list" ON shopping_list
      FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Create policy for contributions if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contributions' 
    AND policyname = 'Allow public access for contributions'
  ) THEN
    CREATE POLICY "Allow public access for contributions" ON contributions
      FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Create policy for expense_participants if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'expense_participants' 
    AND policyname = 'Allow public access for expense_participants'
  ) THEN
    CREATE POLICY "Allow public access for expense_participants" ON expense_participants
      FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Create policy for payments if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payments' 
    AND policyname = 'Allow public access for payments'
  ) THEN
    CREATE POLICY "Allow public access for payments" ON payments
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;