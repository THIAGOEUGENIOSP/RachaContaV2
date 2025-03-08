/*
  # Carnival Schema Update

  1. New Tables
    - carnivals
      - id (uuid, primary key)
      - year (integer)
      - name (text)
      - start_date (date)
      - end_date (date)
      - status (carnival_status)
      - created_at (timestamptz)

    - carnival_participants
      - id (uuid, primary key)
      - carnival_id (uuid, references carnivals)
      - participant_id (uuid, references participants)
      - created_at (timestamptz)

  2. Changes
    - Add carnival_id to expenses, payments, and shopping_list tables
    - Add indexes for better query performance
    - Enable RLS and add security policies

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create carnival_status type if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'carnival_status') THEN
    CREATE TYPE carnival_status AS ENUM ('planning', 'active', 'completed');
  END IF;
END $$;

-- Create carnivals table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'carnivals') THEN
    CREATE TABLE carnivals (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      year integer NOT NULL CHECK (year >= 2024),
      name text NOT NULL,
      start_date date NOT NULL,
      end_date date NOT NULL,
      status carnival_status NOT NULL DEFAULT 'planning',
      created_at timestamptz DEFAULT now(),
      CHECK (end_date >= start_date)
    );

    -- Create unique index to ensure only one active carnival
    CREATE UNIQUE INDEX idx_carnivals_active ON carnivals (status) WHERE status = 'active';
    CREATE INDEX idx_carnivals_status ON carnivals (status);
    CREATE INDEX idx_carnivals_year ON carnivals (year);
  END IF;
END $$;

-- Create carnival_participants table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'carnival_participants') THEN
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

-- Add carnival_id to expenses if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'carnival_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN carnival_id uuid REFERENCES carnivals(id) ON DELETE CASCADE;
    CREATE INDEX idx_expenses_carnival_id ON expenses(carnival_id);
    CREATE INDEX idx_expenses_carnival_date ON expenses(carnival_id, date);
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
    CREATE INDEX idx_payments_carnival_date ON payments(carnival_id, created_at);
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
    CREATE INDEX idx_shopping_list_carnival_completed ON shopping_list(carnival_id, completed);
  END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE carnivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE carnival_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for carnivals
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'carnivals' AND policyname = 'Authenticated users can manage carnivals'
  ) THEN
    CREATE POLICY "Authenticated users can manage carnivals"
      ON carnivals
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'carnivals' AND policyname = 'Public can view carnivals'
  ) THEN
    CREATE POLICY "Public can view carnivals"
      ON carnivals
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

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