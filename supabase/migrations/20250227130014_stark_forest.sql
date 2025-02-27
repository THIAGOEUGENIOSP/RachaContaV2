/*
  # Create initial schema for Splitwise Clone

  1. New Tables
    - `participants` - Stores information about participants (individuals or couples)
    - `expenses` - Stores expense records
    - `payments` - Stores payment records between participants
    - `shopping_list` - Stores shopping list items

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('individual', 'casal')),
  children integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  amount decimal NOT NULL,
  category text NOT NULL,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_id uuid NOT NULL REFERENCES participants(id),
  receiver_id uuid NOT NULL REFERENCES participants(id),
  amount decimal NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create shopping list table
CREATE TABLE IF NOT EXISTS shopping_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  quantity decimal DEFAULT 1,
  category text NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow full access to authenticated users for participants"
  ON participants
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow full access to authenticated users for expenses"
  ON expenses
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow full access to authenticated users for payments"
  ON payments
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow full access to authenticated users for shopping_list"
  ON shopping_list
  FOR ALL
  TO authenticated
  USING (true);