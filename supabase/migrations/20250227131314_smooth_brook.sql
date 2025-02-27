/*
  # Add completed field to shopping_list table

  1. Changes
    - Add completed field to shopping_list table if it doesn't exist
    - Set default value to false for completed field
  
  2. Security
    - No security changes
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopping_list' AND column_name = 'completed'
  ) THEN
    ALTER TABLE shopping_list ADD COLUMN completed boolean DEFAULT false;
  END IF;
END $$;