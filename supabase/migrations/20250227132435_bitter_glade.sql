/*
  # Add payer_id to expenses table

  1. Changes
    - Add payer_id field to expenses table if it doesn't exist
    - Add foreign key constraint to participants table
  
  2. Security
    - No security changes
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'payer_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN payer_id uuid REFERENCES participants(id);
  END IF;
END $$;