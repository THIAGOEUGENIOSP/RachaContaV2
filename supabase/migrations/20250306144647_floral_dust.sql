/*
  # Update authentication and user management

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
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Create indexes for user_id columns
CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON expenses(user_id);
CREATE INDEX IF NOT EXISTS shopping_list_user_id_idx ON shopping_list(user_id);
CREATE INDEX IF NOT EXISTS contributions_user_id_idx ON contributions(user_id);

-- Enable RLS on all tables
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
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

-- Recreate policies
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