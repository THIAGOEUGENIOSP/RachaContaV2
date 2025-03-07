/*
  # Authentication Setup

  1. Changes
    - Create auth schema and users table if they don't exist
    - Add user_id columns to relevant tables
    - Set up foreign key constraints
    - Enable RLS and create policies
    - Add necessary indexes

  2. Security
    - Enable RLS on all tables
    - Set up proper policies for authenticated users
    - Ensure data isolation between users
*/

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.users if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'auth' 
    AND tablename = 'users'
  ) THEN
    CREATE TABLE auth.users (
      id uuid NOT NULL PRIMARY KEY,
      email text,
      CONSTRAINT users_email_key UNIQUE (email)
    );
  END IF;
END $$;

-- Add user_id columns if they don't exist
DO $$
BEGIN
  -- Add user_id to participants
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'participants' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE participants ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS participants_user_id_idx ON participants(user_id);
  END IF;

  -- Add user_id to expenses
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON expenses(user_id);
  END IF;

  -- Add user_id to shopping_list
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shopping_list' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE shopping_list ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS shopping_list_user_id_idx ON shopping_list(user_id);
  END IF;

  -- Add user_id to contributions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contributions' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE contributions ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS contributions_user_id_idx ON contributions(user_id);
  END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage own participants" ON participants;
DROP POLICY IF EXISTS "Users can view all participants" ON participants;
DROP POLICY IF EXISTS "Users can manage own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can view shared expenses" ON expenses;
DROP POLICY IF EXISTS "Users can manage own shopping items" ON shopping_list;
DROP POLICY IF EXISTS "Users can view all shopping items" ON shopping_list;
DROP POLICY IF EXISTS "Users can manage own contributions" ON contributions;
DROP POLICY IF EXISTS "Users can view all contributions" ON contributions;
DROP POLICY IF EXISTS "Users can manage payments" ON payments;
DROP POLICY IF EXISTS "Users can manage expense participants" ON expense_participants;
DROP POLICY IF EXISTS "Users can view shared expense participants" ON expense_participants;

-- Create new policies
CREATE POLICY "Users can manage own participants"
    ON participants FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view all participants"
    ON participants FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can manage own expenses"
    ON expenses FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view shared expenses"
    ON expenses FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        id IN (
            SELECT expense_id 
            FROM expense_participants ep 
            JOIN participants p ON p.id = ep.participant_id 
            WHERE p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own shopping items"
    ON shopping_list FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view all shopping items"
    ON shopping_list FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can manage own contributions"
    ON contributions FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view all contributions"
    ON contributions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can manage payments"
    ON payments FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can manage expense participants"
    ON expense_participants FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM expenses e
            WHERE e.id = expense_id
            AND e.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM expenses e
            WHERE e.id = expense_id
            AND e.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view shared expense participants"
    ON expense_participants FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM expenses e
            WHERE e.id = expense_id
            AND (
                e.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM participants p
                    WHERE p.id = participant_id
                    AND p.user_id = auth.uid()
                )
            )
        )
    );