/*
  # Update User Authentication and RLS Policies

  1. Changes
    - Add user_id columns to tables if they don't exist
    - Create indexes for user_id columns
    - Create RLS policies only if they don't exist
    - Enable RLS on all tables

  2. Security
    - Enable RLS on all tables
    - Set up policies for authenticated users
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
    ALTER TABLE participants ADD COLUMN user_id uuid;
    CREATE INDEX IF NOT EXISTS participants_user_id_idx ON participants(user_id);
  END IF;

  -- Add user_id to expenses if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN user_id uuid;
    CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON expenses(user_id);
  END IF;

  -- Add user_id to shopping_list if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shopping_list' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE shopping_list ADD COLUMN user_id uuid;
    CREATE INDEX IF NOT EXISTS shopping_list_user_id_idx ON shopping_list(user_id);
  END IF;

  -- Add user_id to contributions if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contributions' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE contributions ADD COLUMN user_id uuid;
    CREATE INDEX IF NOT EXISTS contributions_user_id_idx ON contributions(user_id);
  END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies with existence checks
DO $$
BEGIN
  -- Participants policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'participants' 
    AND policyname = 'Users can manage own participants'
  ) THEN
    CREATE POLICY "Users can manage own participants"
      ON participants
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- Expenses policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'expenses' 
    AND policyname = 'Users can manage own expenses'
  ) THEN
    CREATE POLICY "Users can manage own expenses"
      ON expenses
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- Shopping list policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shopping_list' 
    AND policyname = 'Users can manage own shopping items'
  ) THEN
    CREATE POLICY "Users can manage own shopping items"
      ON shopping_list
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- Contributions policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contributions' 
    AND policyname = 'Users can manage own contributions'
  ) THEN
    CREATE POLICY "Users can manage own contributions"
      ON contributions
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;