/*
  # Events Schema

  1. New Tables
    - events
      - id (uuid, primary key)
      - name (text)
      - description (text, nullable)
      - start_date (date)
      - end_date (date)
      - created_at (timestamptz)
      - created_by (uuid, references auth.users)

    - event_participants
      - id (uuid, primary key)
      - event_id (uuid, references events)
      - participant_id (uuid, references participants)
      - created_at (timestamptz)

  2. Changes
    - Add created_by to track event ownership
    - Add indexes for better query performance

  3. Security
    - Enable RLS on all tables
    - Add policies for data security
*/

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CHECK (end_date >= start_date)
);

-- Create event_participants table
CREATE TABLE IF NOT EXISTS event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, participant_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_participant_id ON event_participants(participant_id);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for events
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'events' AND policyname = 'event_select_policy'
  ) THEN
    CREATE POLICY "event_select_policy"
      ON events
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'events' AND policyname = 'event_insert_policy'
  ) THEN
    CREATE POLICY "event_insert_policy"
      ON events
      FOR INSERT
      TO authenticated
      WITH CHECK (uid() = created_by);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'events' AND policyname = 'event_update_policy'
  ) THEN
    CREATE POLICY "event_update_policy"
      ON events
      FOR UPDATE
      TO authenticated
      USING (uid() = created_by)
      WITH CHECK (uid() = created_by);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'events' AND policyname = 'event_delete_policy'
  ) THEN
    CREATE POLICY "event_delete_policy"
      ON events
      FOR DELETE
      TO authenticated
      USING (uid() = created_by);
  END IF;
END $$;

-- Create RLS policies for event_participants
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'event_participants' AND policyname = 'event_participants_select_policy'
  ) THEN
    CREATE POLICY "event_participants_select_policy"
      ON event_participants
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'event_participants' AND policyname = 'event_participants_all_policy'
  ) THEN
    CREATE POLICY "event_participants_all_policy"
      ON event_participants
      FOR ALL
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_participants.event_id
        AND events.created_by = uid()
      ));
  END IF;
END $$;