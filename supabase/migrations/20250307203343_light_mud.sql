/*
  # Associate Data with Carnival 2025

  1. Changes
    - Insert Carnival 2025 record
    - Update all existing expenses to reference Carnival 2025
    - Update all existing shopping list items to reference Carnival 2025

  2. Data Migration
    - Creates Carnival 2025 as the active carnival
    - Associates all existing data with this carnival
*/

-- First, insert Carnival 2025 if it doesn't exist
DO $$ 
DECLARE
  v_carnival_id uuid;
BEGIN
  INSERT INTO carnivals (year, name, start_date, end_date, status)
  VALUES (
    2025,
    'Carnaval 2025',
    '2025-02-28',  -- Carnival 2025 starts February 28
    '2025-03-05',  -- Ends March 5
    'active'
  )
  ON CONFLICT (year) DO UPDATE
  SET name = EXCLUDED.name,
      start_date = EXCLUDED.start_date,
      end_date = EXCLUDED.end_date,
      status = EXCLUDED.status
  RETURNING id INTO v_carnival_id;

  -- Update all existing expenses to reference this carnival
  UPDATE expenses 
  SET carnival_id = v_carnival_id
  WHERE carnival_id IS NULL;

  -- Update all existing shopping list items to reference this carnival
  UPDATE shopping_list
  SET carnival_id = v_carnival_id
  WHERE carnival_id IS NULL;

  -- Add all existing participants to this carnival
  INSERT INTO carnival_participants (carnival_id, participant_id)
  SELECT v_carnival_id, id
  FROM participants p
  WHERE NOT EXISTS (
    SELECT 1 
    FROM carnival_participants cp 
    WHERE cp.carnival_id = v_carnival_id 
    AND cp.participant_id = p.id
  );
END $$;