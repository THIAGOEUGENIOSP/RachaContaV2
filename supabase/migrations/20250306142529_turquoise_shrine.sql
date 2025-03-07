/*
  # Authentication Setup

  1. Changes
    - Add user_id to participants table
    - Add necessary indexes
    - Enable RLS
    - Add basic policies
*/

-- Add user_id column to participants table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'participants' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE participants ADD COLUMN user_id uuid;
        CREATE INDEX IF NOT EXISTS participants_user_id_idx ON participants (user_id);
    END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Create policies for participants table
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Enable read access for all users" ON participants;
    DROP POLICY IF EXISTS "Enable write access for authenticated users" ON participants;
EXCEPTION
    WHEN undefined_object THEN 
        NULL;
END $$;

CREATE POLICY "Enable read access for all users" 
    ON participants FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Enable write access for authenticated users" 
    ON participants FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create policies for expenses table
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Enable read access for all users" ON expenses;
    DROP POLICY IF EXISTS "Enable write access for authenticated users" ON expenses;
EXCEPTION
    WHEN undefined_object THEN 
        NULL;
END $$;

CREATE POLICY "Enable read access for all users" 
    ON expenses FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Enable write access for authenticated users" 
    ON expenses FOR ALL 
    TO authenticated 
    USING (auth.uid() IN (
        SELECT user_id FROM participants WHERE id = expenses.payer_id
    ))
    WITH CHECK (auth.uid() IN (
        SELECT user_id FROM participants WHERE id = expenses.payer_id
    ));