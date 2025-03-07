/*
  # Simplified Authentication Setup

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

-- Enable RLS on participants table
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Create policies for participants table
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view own participants" ON participants;
    DROP POLICY IF EXISTS "Users can manage own participants" ON participants;
EXCEPTION
    WHEN undefined_object THEN 
        NULL;
END $$;

CREATE POLICY "Users can view own participants" 
    ON participants FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own participants" 
    ON participants FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);