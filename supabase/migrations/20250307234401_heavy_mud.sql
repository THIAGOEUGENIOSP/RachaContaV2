/*
  # Initial Schema Setup for Carnival Management

  1. Tables
    - carnivals: Main carnival events
    - carnival_participants: Participants in each carnival
    - participants: User profiles
    - expenses: Expense records
    - expense_participants: Expense sharing details
    - payments: Payment records
    - shopping_list: Shopping items
    - contributions: Monthly contributions

  2. Security
    - RLS enabled on all tables
    - Policies for authenticated users
*/

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  -- Carnivals policies
  DROP POLICY IF EXISTS "authenticated_read_carnivals_new" ON carnivals;
  DROP POLICY IF EXISTS "authenticated_write_carnivals_new" ON carnivals;
  DROP POLICY IF EXISTS "authenticated_update_carnivals_new" ON carnivals;
  DROP POLICY IF EXISTS "authenticated_delete_carnivals_new" ON carnivals;
  
  -- Carnival participants policies
  DROP POLICY IF EXISTS "authenticated_read_carnival_participants_new" ON carnival_participants;
  DROP POLICY IF EXISTS "authenticated_write_carnival_participants_new" ON carnival_participants;
  DROP POLICY IF EXISTS "authenticated_update_carnival_participants_new" ON carnival_participants;
  DROP POLICY IF EXISTS "authenticated_delete_carnival_participants_new" ON carnival_participants;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS carnivals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'planning',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT carnivals_year_key UNIQUE (year),
  CONSTRAINT carnivals_status_check CHECK (status IN ('planning', 'active', 'completed'))
);

CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('individual', 'casal')),
  children integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS carnival_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carnival_id uuid NOT NULL REFERENCES carnivals(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT carnival_participants_carnival_id_participant_id_key UNIQUE (carnival_id, participant_id)
);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  amount numeric NOT NULL,
  category text NOT NULL,
  date date NOT NULL,
  payer_id uuid REFERENCES participants(id),
  carnival_id uuid NOT NULL REFERENCES carnivals(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expense_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_id uuid NOT NULL REFERENCES participants(id),
  receiver_id uuid NOT NULL REFERENCES participants(id),
  amount numeric NOT NULL,
  notes text,
  carnival_id uuid NOT NULL REFERENCES carnivals(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shopping_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  quantity numeric DEFAULT 1,
  category text NOT NULL,
  completed boolean DEFAULT false,
  carnival_id uuid NOT NULL REFERENCES carnivals(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  month date NOT NULL,
  receipt_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_month CHECK (date_trunc('month', month) = month)
);

-- Enable RLS on all tables
ALTER TABLE carnivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE carnival_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_carnival_date ON expenses(carnival_id, date);
CREATE INDEX IF NOT EXISTS idx_payments_carnival_date ON payments(carnival_id, created_at);
CREATE INDEX IF NOT EXISTS idx_shopping_list_carnival_completed ON shopping_list(carnival_id, completed);
CREATE INDEX IF NOT EXISTS idx_carnival_participants_carnival ON carnival_participants(carnival_id);

-- Create RLS policies for carnivals
CREATE POLICY "authenticated_read_carnivals_new"
  ON carnivals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_write_carnivals_new"
  ON carnivals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_carnivals_new"
  ON carnivals FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_delete_carnivals_new"
  ON carnivals FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for carnival participants
CREATE POLICY "authenticated_read_carnival_participants_new"
  ON carnival_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_write_carnival_participants_new"
  ON carnival_participants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_carnival_participants_new"
  ON carnival_participants FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_delete_carnival_participants_new"
  ON carnival_participants FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for other tables
CREATE POLICY "authenticated_access_participants"
  ON participants FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_access_expenses"
  ON expenses FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_access_expense_participants"
  ON expense_participants FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_access_payments"
  ON payments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_access_shopping_list"
  ON shopping_list FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_access_contributions"
  ON contributions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);