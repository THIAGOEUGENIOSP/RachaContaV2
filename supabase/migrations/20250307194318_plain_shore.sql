/*
  # Add Carnival Control Module

  1. New Tables
    - `carnivals`
      - `id` (uuid, primary key)
      - `year` (integer, unique)
      - `name` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `created_at` (timestamp)
      - `status` (text) - planning/active/completed
      
    - `carnival_participants`
      - `id` (uuid, primary key)
      - `carnival_id` (uuid, references carnivals)
      - `participant_id` (uuid, references participants)
      - `created_at` (timestamp)
      
  2. Security
    - Enable RLS on all tables
    - Add policies for CRUD operations
    
  3. Changes
    - Add carnival_id to existing tables (expenses, shopping_list)
*/

-- Create carnivals table
CREATE TABLE IF NOT EXISTS carnivals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL UNIQUE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE carnivals ENABLE ROW LEVEL SECURITY;

-- Create carnival_participants table
CREATE TABLE IF NOT EXISTS carnival_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carnival_id uuid NOT NULL REFERENCES carnivals(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(carnival_id, participant_id)
);

-- Enable RLS
ALTER TABLE carnival_participants ENABLE ROW LEVEL SECURITY;

-- Add carnival_id to expenses
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS carnival_id uuid REFERENCES carnivals(id) ON DELETE SET NULL;

-- Add carnival_id to shopping_list
ALTER TABLE shopping_list 
ADD COLUMN IF NOT EXISTS carnival_id uuid REFERENCES carnivals(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_carnival_participants_carnival_id ON carnival_participants(carnival_id);
CREATE INDEX IF NOT EXISTS idx_carnival_participants_participant_id ON carnival_participants(participant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_carnival_id ON expenses(carnival_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_carnival_id ON shopping_list(carnival_id);

-- Add RLS policies
CREATE POLICY "Enable read access for all users" ON carnivals
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON carnivals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON carnivals
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON carnivals
  FOR DELETE USING (true);

-- Policies for carnival_participants
CREATE POLICY "Enable read access for all users" ON carnival_participants
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON carnival_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON carnival_participants
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON carnival_participants
  FOR DELETE USING (true);