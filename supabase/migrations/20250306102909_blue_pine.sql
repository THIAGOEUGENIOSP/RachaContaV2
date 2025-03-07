/*
  # Create contributions table and storage bucket

  1. New Tables
    - `contributions`
      - `id` (uuid, primary key)
      - `participant_id` (uuid, foreign key to participants)
      - `amount` (numeric)
      - `month` (date)
      - `receipt_url` (text)
      - `notes` (text)
      - `created_at` (timestamp)

  2. Storage
    - Create receipts bucket
    - Add storage policies for receipt access

  3. Security
    - Enable RLS on contributions table
    - Add policies for authenticated users
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all contributions" ON contributions;
DROP POLICY IF EXISTS "Users can insert contributions" ON contributions;
DROP POLICY IF EXISTS "Users can update their own contributions" ON contributions;
DROP POLICY IF EXISTS "Users can delete their own contributions" ON contributions;

-- Create contributions table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contributions') THEN
    CREATE TABLE contributions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
      amount numeric NOT NULL CHECK (amount > 0),
      month date NOT NULL,
      receipt_url text,
      notes text,
      created_at timestamptz DEFAULT now(),
      
      -- Ensure month is always first day of month
      CONSTRAINT valid_month CHECK (date_trunc('month', month) = month)
    );
  END IF;
END $$;

-- Enable RLS
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Users can view all contributions"
  ON contributions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert contributions"
  ON contributions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own contributions"
  ON contributions
  FOR UPDATE
  TO authenticated
  USING (participant_id = auth.uid())
  WITH CHECK (participant_id = auth.uid());

CREATE POLICY "Users can delete their own contributions"
  ON contributions
  FOR DELETE
  TO authenticated
  USING (participant_id = auth.uid());

-- Create index for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS contributions_participant_month_idx ON contributions (participant_id, month);

-- Create storage bucket for receipts if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM storage.buckets WHERE id = 'receipts'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('receipts', 'receipts', true);
  END IF;
END $$;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Anyone can view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own receipts" ON storage.objects;

-- Create storage bucket policies
CREATE POLICY "Anyone can view receipts"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'receipts');

CREATE POLICY "Authenticated users can upload receipts"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Users can update their own receipts"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'receipts');

CREATE POLICY "Users can delete their own receipts"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'receipts');