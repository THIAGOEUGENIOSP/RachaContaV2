/*
  # Set up user management and authentication

  1. Changes
    - Add user_id reference to participants table
    - Set up proper RLS policies for user management
    - Enable row level security

  2. Security
    - Enable RLS on participants table
    - Add policies for authenticated users to manage their own data
    - Allow viewing all participants for authenticated users
*/

-- Add user_id to participants table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'participants' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE participants ADD COLUMN user_id uuid REFERENCES auth.users(id);
        CREATE INDEX participants_user_id_idx ON participants(user_id);
    END IF;
END $$;

-- Enable RLS on participants table
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own participants" ON participants;
DROP POLICY IF EXISTS "Users can view all participants" ON participants;

-- Create RLS policies
CREATE POLICY "Users can manage their own participants"
    ON participants
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all participants"
    ON participants
    FOR SELECT
    TO authenticated
    USING (true);