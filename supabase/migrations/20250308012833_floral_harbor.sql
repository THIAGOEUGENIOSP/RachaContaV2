/*
  # Carnival Participants Schema Update

  1. Changes
    - Add carnival_participants table to manage participants per carnival
    - Add foreign key constraints and indexes
    - Enable RLS and add policies
    - Add carnival_id to related tables

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add policies for public access where needed

  3. Notes
    - Each carnival will have its own set of participants
    - Participants can be part of multiple carnivals
    - All expenses, payments, and shopping list items are tied to a specific carnival
*/

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

-- Create policies for carnival_participants if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'carnival_participants' 
    AND policyname = 'Authenticated users can manage carnival participants'
  ) THEN
    CREATE POLICY "Authenticated users can manage carnival participants"
      ON carnival_participants
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Add carnival_id to expenses table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'carnival_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN carnival_id uuid REFERENCES carnivals(id) ON DELETE CASCADE;
    CREATE INDEX idx_expenses_carnival_id ON expenses(carnival_id);
  END IF;
END $$;

-- Add carnival_id to payments table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'carnival_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN carnival_id uuid REFERENCES carnivals(id) ON DELETE CASCADE;
    CREATE INDEX idx_payments_carnival_id ON payments(carnival_id);
  END IF;
END $$;

-- Add carnival_id to shopping_list table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shopping_list' AND column_name = 'carnival_id'
  ) THEN
    ALTER TABLE shopping_list ADD COLUMN carnival_id uuid REFERENCES carnivals(id) ON DELETE CASCADE;
    CREATE INDEX idx_shopping_list_carnival_id ON shopping_list(carnival_id);
  END IF;
END $$;

-- Enable RLS on all tables if not already enabled
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

-- Create policies for expenses if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'expenses' 
    AND policyname = 'Users can view carnival expenses'
  ) THEN
    CREATE POLICY "Users can view carnival expenses"
      ON expenses
      FOR SELECT
      TO authenticated
      USING (carnival_id IS NOT NULL);
  END IF;
END $$;

-- Create policies for payments if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payments' 
    AND policyname = 'Users can view carnival payments'
  ) THEN
    CREATE POLICY "Users can view carnival payments"
      ON payments
      FOR SELECT
      TO authenticated
      USING (carnival_id IS NOT NULL);
  END IF;
END $$;

-- Create policies for shopping list if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shopping_list' 
    AND policyname = 'Users can view carnival shopping list'
  ) THEN
    CREATE POLICY "Users can view carnival shopping list"
      ON shopping_list
      FOR SELECT
      TO authenticated
      USING (carnival_id IS NOT NULL);
  END IF;
END $$;