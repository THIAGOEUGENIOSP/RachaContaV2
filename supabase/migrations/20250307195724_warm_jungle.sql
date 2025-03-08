/*
  # Carnival Management Schema

  1. New Tables
    - `carnivals`
      - `id` (uuid, primary key)
      - `year` (integer, unique)
      - `name` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `status` (text: planning, active, completed)
      - `created_at` (timestamptz)

    - `carnival_participants`
      - `id` (uuid, primary key)
      - `carnival_id` (uuid, references carnivals)
      - `participant_id` (uuid, references participants)
      - `created_at` (timestamptz)

  2. Changes
    - Add `carnival_id` to existing tables:
      - expenses
      - shopping_list

  3. Security
    - Enable RLS on all new tables
    - Add policies for public access (temporary)
*/

-- Create carnivals table
CREATE TABLE IF NOT EXISTS carnivals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer UNIQUE NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'planning',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT carnivals_status_check CHECK (status IN ('planning', 'active', 'completed'))
);

-- Create carnival_participants table
CREATE TABLE IF NOT EXISTS carnival_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carnival_id uuid NOT NULL REFERENCES carnivals(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT carnival_participants_carnival_id_participant_id_key UNIQUE (carnival_id, participant_id)
);

-- Add carnival_id to expenses
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS carnival_id uuid REFERENCES carnivals(id) ON DELETE SET NULL;

-- Add carnival_id to shopping_list
ALTER TABLE shopping_list 
ADD COLUMN IF NOT EXISTS carnival_id uuid REFERENCES carnivals(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_carnival_participants_carnival_id ON carnival_participants(carnival_id);
CREATE INDEX IF NOT EXISTS idx_carnival_participants_participant_id ON carnival_participants(participant_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_carnival_id ON shopping_list(carnival_id);
CREATE INDEX IF NOT EXISTS carnivals_year_key ON carnivals(year);

-- Enable Row Level Security
ALTER TABLE carnivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE carnival_participants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for carnivals
DO $$ BEGIN
  CREATE POLICY "Public can view carnivals" ON carnivals FOR SELECT USING (true);
  CREATE POLICY "Public can insert carnivals" ON carnivals FOR INSERT WITH CHECK (true);
  CREATE POLICY "Public can update carnivals" ON carnivals FOR UPDATE USING (true);
  CREATE POLICY "Public can delete carnivals" ON carnivals FOR DELETE USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create RLS policies for carnival_participants
DO $$ BEGIN
  CREATE POLICY "Public can view carnival participants" ON carnival_participants FOR SELECT USING (true);
  CREATE POLICY "Public can insert carnival participants" ON carnival_participants FOR INSERT WITH CHECK (true);
  CREATE POLICY "Public can update carnival participants" ON carnival_participants FOR UPDATE USING (true);
  CREATE POLICY "Public can delete carnival participants" ON carnival_participants FOR DELETE USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;