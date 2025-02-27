/*
  # Create expense_participants table

  1. New Tables
    - `expense_participants` - Tracks which participants are part of each expense and how much they owe
      - `id` (uuid, primary key)
      - `expense_id` (uuid, foreign key to expenses)
      - `participant_id` (uuid, foreign key to participants)
      - `amount` (numeric, the amount this participant owes for this expense)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `expense_participants` table
    - Add policies for authenticated users to read, insert, update, and delete expense_participants
*/

-- Create the expense_participants table if it doesn't exist
CREATE TABLE IF NOT EXISTS expense_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid REFERENCES expenses(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable row level security
ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;

-- Create policies only if they don't exist
DO $$
BEGIN
  -- Check if the read policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'expense_participants' AND policyname = 'Anyone can read expense_participants'
  ) THEN
    CREATE POLICY "Anyone can read expense_participants"
      ON expense_participants
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- Check if the insert policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'expense_participants' AND policyname = 'Anyone can insert expense_participants'
  ) THEN
    CREATE POLICY "Anyone can insert expense_participants"
      ON expense_participants
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  -- Check if the update policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'expense_participants' AND policyname = 'Anyone can update expense_participants'
  ) THEN
    CREATE POLICY "Anyone can update expense_participants"
      ON expense_participants
      FOR UPDATE
      TO authenticated
      USING (true);
  END IF;

  -- Check if the delete policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'expense_participants' AND policyname = 'Anyone can delete expense_participants'
  ) THEN
    CREATE POLICY "Anyone can delete expense_participants"
      ON expense_participants
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;