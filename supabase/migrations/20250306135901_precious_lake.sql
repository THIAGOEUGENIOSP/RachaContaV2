/*
  # Add Authentication and User Relations

  1. Changes
    - Add user_id column to relevant tables
    - Enable Row Level Security (RLS) for all tables
    - Create policies for user-based access control
    - Add storage bucket for contribution receipts
    - Add policies for contribution receipts storage

  2. Security
    - Enable RLS on all tables
    - Add policies to restrict access based on user authentication
    - Add policies for shared resources
*/

-- Create storage bucket for contribution receipts if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to avoid conflicts
DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can view receipts" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Create storage policy for receipts bucket
CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Anyone can view receipts"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'receipts');

-- Add user_id to participants table
ALTER TABLE participants
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add user_id to expenses table
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add user_id to contributions table
ALTER TABLE contributions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add user_id to shopping_list table
ALTER TABLE shopping_list
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Enable RLS on all tables
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
    -- Participants policies
    DROP POLICY IF EXISTS "Users can view all participants" ON participants;
    DROP POLICY IF EXISTS "Users can insert their own participants" ON participants;
    DROP POLICY IF EXISTS "Users can update their own participants" ON participants;
    DROP POLICY IF EXISTS "Users can delete their own participants" ON participants;

    -- Expenses policies
    DROP POLICY IF EXISTS "Users can view shared expenses" ON expenses;
    DROP POLICY IF EXISTS "Users can insert their own expenses" ON expenses;
    DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;
    DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses;

    -- Expense participants policies
    DROP POLICY IF EXISTS "Users can view shared expense participants" ON expense_participants;
    DROP POLICY IF EXISTS "Users can insert expense participants" ON expense_participants;
    DROP POLICY IF EXISTS "Users can update expense participants" ON expense_participants;
    DROP POLICY IF EXISTS "Users can delete expense participants" ON expense_participants;

    -- Payments policies
    DROP POLICY IF EXISTS "Users can view shared payments" ON payments;
    DROP POLICY IF EXISTS "Users can insert payments" ON payments;
    DROP POLICY IF EXISTS "Users can update their payments" ON payments;
    DROP POLICY IF EXISTS "Users can delete their payments" ON payments;

    -- Shopping list policies
    DROP POLICY IF EXISTS "Users can view all shopping list items" ON shopping_list;
    DROP POLICY IF EXISTS "Users can insert shopping list items" ON shopping_list;
    DROP POLICY IF EXISTS "Users can update any shopping list item" ON shopping_list;
    DROP POLICY IF EXISTS "Users can delete their shopping list items" ON shopping_list;

    -- Contributions policies
    DROP POLICY IF EXISTS "Users can view all contributions" ON contributions;
    DROP POLICY IF EXISTS "Users can insert their own contributions" ON contributions;
    DROP POLICY IF EXISTS "Users can update their own contributions" ON contributions;
    DROP POLICY IF EXISTS "Users can delete their own contributions" ON contributions;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Participants policies
CREATE POLICY "Users can view all participants"
ON participants FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own participants"
ON participants FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participants"
ON participants FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own participants"
ON participants FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Expenses policies
CREATE POLICY "Users can view shared expenses"
ON expenses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM expense_participants ep
    WHERE ep.expense_id = id
    AND ep.participant_id IN (
      SELECT p.id FROM participants p
      WHERE p.user_id = auth.uid()
    )
  )
  OR user_id = auth.uid()
);

CREATE POLICY "Users can insert their own expenses"
ON expenses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
ON expenses FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
ON expenses FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Expense participants policies
CREATE POLICY "Users can view shared expense participants"
ON expense_participants FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM expenses e
    WHERE e.id = expense_id
    AND (
      e.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM participants p
        WHERE p.id = participant_id
        AND p.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can insert expense participants"
ON expense_participants FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM expenses e
    WHERE e.id = expense_id
    AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update expense participants"
ON expense_participants FOR UPDATE
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

CREATE POLICY "Users can delete expense participants"
ON expense_participants FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM expenses e
    WHERE e.id = expense_id
    AND e.user_id = auth.uid()
  )
);

-- Payments policies
CREATE POLICY "Users can view shared payments"
ON payments FOR SELECT
TO authenticated
USING (
  payer_id IN (
    SELECT id FROM participants
    WHERE user_id = auth.uid()
  )
  OR receiver_id IN (
    SELECT id FROM participants
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert payments"
ON payments FOR INSERT
TO authenticated
WITH CHECK (
  payer_id IN (
    SELECT id FROM participants
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their payments"
ON payments FOR UPDATE
TO authenticated
USING (
  payer_id IN (
    SELECT id FROM participants
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  payer_id IN (
    SELECT id FROM participants
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their payments"
ON payments FOR DELETE
TO authenticated
USING (
  payer_id IN (
    SELECT id FROM participants
    WHERE user_id = auth.uid()
  )
);

-- Shopping list policies
CREATE POLICY "Users can view all shopping list items"
ON shopping_list FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert shopping list items"
ON shopping_list FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update any shopping list item"
ON shopping_list FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can delete their shopping list items"
ON shopping_list FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Contributions policies
CREATE POLICY "Users can view all contributions"
ON contributions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own contributions"
ON contributions FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND participant_id IN (
    SELECT id FROM participants
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own contributions"
ON contributions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contributions"
ON contributions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);