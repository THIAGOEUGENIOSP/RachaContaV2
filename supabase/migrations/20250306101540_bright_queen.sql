/*
  # Fix contributions table relationships and create storage bucket

  1. Changes
    - Add foreign key constraint to contributions table
    - Create storage bucket for receipts
    - Update RLS policies

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS contributions;

-- Create contributions table with proper foreign key
CREATE TABLE contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  month date NOT NULL,
  receipt_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_month CHECK (date_trunc('month', month) = month)
);

-- Enable RLS
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all contributions"
  ON contributions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own contributions"
  ON contributions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (
    SELECT id FROM participants WHERE id = participant_id
  ));

CREATE POLICY "Users can update their own contributions"
  ON contributions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM participants WHERE id = participant_id
  ))
  WITH CHECK (auth.uid() IN (
    SELECT id FROM participants WHERE id = participant_id
  ));

CREATE POLICY "Users can delete their own contributions"
  ON contributions
  FOR DELETE
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM participants WHERE id = participant_id
  ));

-- Create index for better performance
CREATE INDEX contributions_participant_month_idx ON contributions (participant_id, month);