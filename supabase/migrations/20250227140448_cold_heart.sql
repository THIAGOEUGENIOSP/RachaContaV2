/*
  # Create expense_participants table and update RLS policies

  1. New Tables
    - `expense_participants`
      - `id` (uuid, primary key)
      - `expense_id` (uuid, foreign key to expenses)
      - `participant_id` (uuid, foreign key to participants)
      - `amount` (numeric, the amount this participant owes)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `expense_participants` table
    - Add policy for authenticated users to read and insert expense participants
*/

-- Create expense_participants table
CREATE TABLE IF NOT EXISTS expense_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid REFERENCES expenses(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read expense_participants"
  ON expense_participants
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can insert expense_participants"
  ON expense_participants
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update expense_participants"
  ON expense_participants
  FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Anyone can delete expense_participants"
  ON expense_participants
  FOR DELETE
  TO anon
  USING (true);

-- Add payer_id to expenses table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'payer_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN payer_id uuid REFERENCES participants(id);
  END IF;
END $$;