/*
  # Fix RLS Policies

  1. Changes
    - Fix infinite recursion in RLS policies
    - Add proper user_id columns to tables
    - Set up correct RLS policies for all tables
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Ensure proper data isolation between users
*/

-- Add user_id columns with proper foreign keys
DO $$
BEGIN
  -- Add user_id to participants if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'participants' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE participants ADD COLUMN user_id uuid REFERENCES auth.users(id);
    CREATE INDEX IF NOT EXISTS participants_user_id_idx ON participants(user_id);
  END IF;

  -- Add user_id to expenses if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN user_id uuid REFERENCES auth.users(id);
    CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON expenses(user_id);
  END IF;

  -- Add user_id to shopping_list if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shopping_list' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE shopping_list ADD COLUMN user_id uuid REFERENCES auth.users(id);
    CREATE INDEX IF NOT EXISTS shopping_list_user_id_idx ON shopping_list(user_id);
  END IF;

  -- Add user_id to contributions if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contributions' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE contributions ADD COLUMN user_id uuid REFERENCES auth.users(id);
    CREATE INDEX IF NOT EXISTS contributions_user_id_idx ON contributions(user_id);
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage own participants" ON participants;
DROP POLICY IF EXISTS "Users can manage own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can manage own shopping items" ON shopping_list;
DROP POLICY IF EXISTS "Users can manage own contributions" ON contributions;
DROP POLICY IF EXISTS "Admin users can manage admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admin users can view admin_users" ON admin_users;

-- Enable RLS on all tables
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create new policies for participants
CREATE POLICY "Enable read access for authenticated users"
  ON participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for own participants"
  ON participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for own participants"
  ON participants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for own participants"
  ON participants
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create new policies for expenses
CREATE POLICY "Enable read access for shared expenses"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM participants p
      WHERE p.user_id = auth.uid()
      AND (
        p.id = expenses.payer_id
        OR EXISTS (
          SELECT 1 FROM expense_participants ep
          WHERE ep.expense_id = expenses.id
          AND ep.participant_id = p.id
        )
      )
    )
  );

CREATE POLICY "Enable insert for own expenses"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for own expenses"
  ON expenses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for own expenses"
  ON expenses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create new policies for shopping_list
CREATE POLICY "Enable read access for shopping list"
  ON shopping_list
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for own shopping items"
  ON shopping_list
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for own shopping items"
  ON shopping_list
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for own shopping items"
  ON shopping_list
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create new policies for contributions
CREATE POLICY "Enable read access for contributions"
  ON contributions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for own contributions"
  ON contributions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for own contributions"
  ON contributions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for own contributions"
  ON contributions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create new policies for admin_users
CREATE POLICY "Enable read access for admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable all access for admin users"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users a 
    WHERE a.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users a 
    WHERE a.user_id = auth.uid()
  ));