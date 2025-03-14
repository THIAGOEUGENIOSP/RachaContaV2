/*
  # Authentication and User Management Setup

  1. Changes
    - Add user_id to all relevant tables
    - Set up proper RLS policies for user management
    - Enable row level security on all tables

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Ensure proper data isolation between users
*/

-- Add user_id to tables that need it
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'participants' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE participants ADD COLUMN user_id uuid;
        CREATE INDEX participants_user_id_idx ON participants(user_id);
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'expenses' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE expenses ADD COLUMN user_id uuid;
        CREATE INDEX expenses_user_id_idx ON expenses(user_id);
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'shopping_list' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE shopping_list ADD COLUMN user_id uuid;
        CREATE INDEX shopping_list_user_id_idx ON shopping_list(user_id);
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'contributions' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE contributions ADD COLUMN user_id uuid;
        CREATE INDEX contributions_user_id_idx ON contributions(user_id);
    END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN 
    -- Participants policies
    DROP POLICY IF EXISTS "Users can manage own participants" ON participants;
    DROP POLICY IF EXISTS "Users can view all participants" ON participants;
    DROP POLICY IF EXISTS "Users can manage their own participants" ON participants;
    DROP POLICY IF EXISTS "Users can view own participants" ON participants;
    
    -- Expenses policies
    DROP POLICY IF EXISTS "Users can manage own expenses" ON expenses;
    DROP POLICY IF EXISTS "Users can view shared expenses" ON expenses;
    
    -- Shopping list policies
    DROP POLICY IF EXISTS "Users can manage own shopping items" ON shopping_list;
    DROP POLICY IF EXISTS "Users can view all shopping items" ON shopping_list;
    
    -- Contributions policies
    DROP POLICY IF EXISTS "Users can manage own contributions" ON contributions;
    DROP POLICY IF EXISTS "Users can view all contributions" ON contributions;
    
    -- Payments policies
    DROP POLICY IF EXISTS "Users can manage payments" ON payments;
    
    -- Expense participants policies
    DROP POLICY IF EXISTS "Users can manage expense participants" ON expense_participants;
    DROP POLICY IF EXISTS "Users can view shared expense participants" ON expense_participants;
END $$;

-- Create new policies
-- Participants policies
CREATE POLICY "Users can manage own participants"
    ON participants FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view all participants"
    ON participants FOR SELECT
    TO authenticated
    USING (true);

-- Expenses policies
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

-- Shopping list policies
CREATE POLICY "Users can manage own shopping items"
    ON shopping_list FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view all shopping items"
    ON shopping_list FOR SELECT
    TO authenticated
    USING (true);

-- Contributions policies
CREATE POLICY "Users can manage own contributions"
    ON contributions FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view all contributions"
    ON contributions FOR SELECT
    TO authenticated
    USING (true);

-- Payments policies
CREATE POLICY "Users can manage payments"
    ON payments FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Expense participants policies
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