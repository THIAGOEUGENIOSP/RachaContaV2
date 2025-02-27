/*
  # Fix payments table RLS policies

  1. Security
    - Ensure RLS is enabled for payments table
    - Create proper RLS policies for payments table
*/

-- Make sure RLS is enabled
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop the select policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payments' AND policyname = 'Users can read payments'
  ) THEN
    DROP POLICY "Users can read payments" ON payments;
  END IF;

  -- Drop the insert policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payments' AND policyname = 'Users can insert payments'
  ) THEN
    DROP POLICY "Users can insert payments" ON payments;
  END IF;

  -- Drop the update policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payments' AND policyname = 'Users can update payments'
  ) THEN
    DROP POLICY "Users can update payments" ON payments;
  END IF;

  -- Drop the delete policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payments' AND policyname = 'Users can delete payments'
  ) THEN
    DROP POLICY "Users can delete payments" ON payments;
  END IF;
END $$;

-- Create new policies with proper configuration
CREATE POLICY "Users can read payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete payments"
  ON payments
  FOR DELETE
  TO authenticated
  USING (true);