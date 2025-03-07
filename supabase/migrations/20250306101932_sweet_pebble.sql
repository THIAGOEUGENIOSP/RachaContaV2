/*
  # Create contributions table and storage

  1. New Tables
    - `contributions`
      - `id` (uuid, primary key)
      - `participant_id` (uuid, foreign key to participants)
      - `amount` (numeric)
      - `month` (date)
      - `receipt_url` (text)
      - `notes` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on contributions table
    - Add policies for authenticated users
*/

-- Create contributions table
CREATE TABLE IF NOT EXISTS contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  month date NOT NULL,
  receipt_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  
  -- Add foreign key constraint
  CONSTRAINT fk_participant
    FOREIGN KEY (participant_id)
    REFERENCES participants(id)
    ON DELETE CASCADE,
    
  -- Ensure month is always first day of month
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