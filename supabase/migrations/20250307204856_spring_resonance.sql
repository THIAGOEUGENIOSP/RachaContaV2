/*
  # Add Events Support
  
  1. New Tables
    - `events` table for managing events
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, optional)
      - `start_date` (date)
      - `end_date` (date)
      - `created_at` (timestamp)
      - `created_by` (uuid, references auth.users)
    
    - `event_participants` table for managing event participants
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events)
      - `participant_id` (uuid, references participants)
      - `created_at` (timestamp)
  
  2. Changes
    - Add `event_id` column to `expenses` table
    - Add `event_id` column to `shopping_list` table
  
  3. Security
    - Enable RLS on new tables
    - Add policies for event management
    - Add policies for event participants
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

-- Add event_id to expenses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN event_id uuid REFERENCES events(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add event_id to shopping_list table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopping_list' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE shopping_list ADD COLUMN event_id uuid REFERENCES events(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_expenses_event_id ON expenses(event_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_event_id ON shopping_list(event_id);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "event_insert_policy" ON events;
DROP POLICY IF EXISTS "event_delete_policy" ON events;
DROP POLICY IF EXISTS "event_update_policy" ON events;
DROP POLICY IF EXISTS "event_select_policy" ON events;
DROP POLICY IF EXISTS "event_participants_all_policy" ON event_participants;
DROP POLICY IF EXISTS "event_participants_select_policy" ON event_participants;

-- Create policies for events
CREATE POLICY "event_insert_policy" ON events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "event_delete_policy" ON events
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "event_update_policy" ON events
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "event_select_policy" ON events
  FOR SELECT TO authenticated
  USING (true);

-- Create policies for event_participants
CREATE POLICY "event_participants_all_policy" ON event_participants
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_participants.event_id
    AND events.created_by = auth.uid()
  ));

CREATE POLICY "event_participants_select_policy" ON event_participants
  FOR SELECT TO authenticated
  USING (true);