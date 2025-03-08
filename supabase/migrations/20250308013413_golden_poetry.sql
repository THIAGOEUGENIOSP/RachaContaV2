/*
  # Carnival Participants Schema Update

  1. Changes
    - Add carnival_id to expenses, payments, and shopping_list tables
    - Add indexes for better query performance
    - Enable RLS and add security policies
    - Add carnival_participants table to link participants to specific carnivals

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Add carnival_id to expenses if not exists
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

-- Add carnival_id to payments if not exists
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

-- Add carnival_id to shopping_list if not exists
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

-- Create carnival_participants table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'carnival_participants'
  ) THEN
    CREATE TABLE carnival_participants (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      carnival_id uuid NOT NULL REFERENCES carnivals(id) ON DELETE CASCADE,
      participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
      created_at timestamptz DEFAULT now(),
      UNIQUE(carnival_id, participant_id)
    );

    CREATE INDEX idx_carnival_participants_carnival_id ON carnival_participants(carnival_id);
    CREATE INDEX idx_carnival_participants_participant_id ON carnival_participants(participant_id);
  END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE carnival_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for carnival_participants
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'carnival_participants' AND policyname = 'authenticated_access_carnival_participants_new'
  ) THEN
    CREATE POLICY "authenticated_access_carnival_participants_new"
      ON carnival_participants
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Create RLS policies for expenses
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'expenses' AND policyname = 'authenticated_access_expenses'
  ) THEN
    CREATE POLICY "authenticated_access_expenses"
      ON expenses
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Create RLS policies for payments
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payments' AND policyname = 'authenticated_access_payments'
  ) THEN
    CREATE POLICY "authenticated_access_payments"
      ON payments
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Create RLS policies for shopping list
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shopping_list' AND policyname = 'authenticated_access_shopping_list'
  ) THEN
    CREATE POLICY "authenticated_access_shopping_list"
      ON shopping_list
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;