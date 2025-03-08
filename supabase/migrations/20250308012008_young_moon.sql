/*
  # Update carnival data structure

  1. Changes
    - Add year and date validation checks
    - Add indexes for better query performance
    - Create carnival_participants table with proper relationships
    - Update related tables to require carnival_id

  2. Security
    - Add policies for authenticated users
*/

-- Add year check if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'carnivals_year_check'
  ) THEN
    ALTER TABLE carnivals
    ADD CONSTRAINT carnivals_year_check CHECK (year >= 2024);
  END IF;
END $$;

-- Add dates check if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'carnivals_dates_check'
  ) THEN
    ALTER TABLE carnivals
    ADD CONSTRAINT carnivals_dates_check CHECK (end_date >= start_date);
  END IF;
END $$;

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_carnivals_status ON carnivals(status);
CREATE INDEX IF NOT EXISTS idx_carnivals_year ON carnivals(year);

-- Create carnival_participants table if not exists
CREATE TABLE IF NOT EXISTS carnival_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carnival_id uuid NOT NULL REFERENCES carnivals(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(carnival_id, participant_id)
);

-- Create indexes for carnival_participants
CREATE INDEX IF NOT EXISTS idx_carnival_participants_carnival ON carnival_participants(carnival_id);
CREATE INDEX IF NOT EXISTS idx_carnival_participants_participant ON carnival_participants(participant_id);

-- Enable RLS on carnival_participants
ALTER TABLE carnival_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for carnival_participants
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public can view carnival participants'
  ) THEN
    CREATE POLICY "Public can view carnival participants"
      ON carnival_participants
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can manage carnival participants'
  ) THEN
    CREATE POLICY "Authenticated users can manage carnival participants"
      ON carnival_participants
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Update expenses table to require carnival_id if not already required
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' 
    AND column_name = 'carnival_id' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE expenses
    ALTER COLUMN carnival_id SET NOT NULL;
  END IF;
END $$;

-- Update payments table to require carnival_id if not already required
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' 
    AND column_name = 'carnival_id' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE payments
    ALTER COLUMN carnival_id SET NOT NULL;
  END IF;
END $$;

-- Update shopping_list table to require carnival_id if not already required
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shopping_list' 
    AND column_name = 'carnival_id' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE shopping_list
    ALTER COLUMN carnival_id SET NOT NULL;
  END IF;
END $$;