/*
  # Create Events System

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `created_at` (timestamp)
      - `created_by` (uuid, references auth.users)

    - `event_participants`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events)
      - `participant_id` (uuid, references participants)
      - `created_at` (timestamp)

  2. Changes to Existing Tables
    - Add `event_id` to:
      - expenses
      - payments
      - shopping_list

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create event_participants table
CREATE TABLE IF NOT EXISTS event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, participant_id)
);

-- Add event_id to existing tables
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE CASCADE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE CASCADE;
ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for events
CREATE POLICY "Users can view all events"
  ON events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own events"
  ON events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own events"
  ON events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create policies for event_participants
CREATE POLICY "Users can view event participants"
  ON event_participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage event participants"
  ON event_participants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_participants.event_id
      AND events.created_by = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_expenses_event_id ON expenses(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_event_id ON payments(event_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_event_id ON shopping_list(event_id);

-- Insert initial event for Carnaval 2025
DO $$
BEGIN
  INSERT INTO events (name, description, start_date, end_date, created_by)
  VALUES (
    'Carnaval 2025',
    'Evento principal do Carnaval 2025',
    '2025-02-28',
    '2025-03-05',
    (SELECT id FROM auth.users WHERE email = 'thigocaicorn@hotmail.com' LIMIT 1)
  )
  ON CONFLICT DO NOTHING;
END
$$;