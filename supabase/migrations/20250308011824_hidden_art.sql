/*
  # Add carnival participants table and relationships

  1. New Tables
    - `carnival_participants`
      - `id` (uuid, primary key)
      - `carnival_id` (uuid, references carnivals)
      - `participant_id` (uuid, references participants)
      - `created_at` (timestamp)

  2. Changes
    - Add foreign key constraints to link participants to carnivals
    - Add unique constraint to prevent duplicate participants in a carnival
    - Add indexes for better query performance

  3. Security
    - Enable RLS on carnival_participants table
    - Add policies for authenticated users
*/

-- Create carnival_participants table
CREATE TABLE IF NOT EXISTS carnival_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carnival_id uuid NOT NULL REFERENCES carnivals(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(carnival_id, participant_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_carnival_participants_carnival ON carnival_participants(carnival_id);
CREATE INDEX IF NOT EXISTS idx_carnival_participants_participant ON carnival_participants(participant_id);

-- Enable RLS
ALTER TABLE carnival_participants ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view carnival participants"
  ON carnival_participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert carnival participants"
  ON carnival_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update carnival participants"
  ON carnival_participants
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete carnival participants"
  ON carnival_participants
  FOR DELETE
  TO authenticated
  USING (true);