/*
  # Associate User with Participant

  1. Changes
    - Update participant record for THIAGO/ALINE with their user_id
*/

-- Update THIAGO/ALINE participant with their user_id
DO $$
DECLARE
    found_user_id UUID;
BEGIN
    -- Get user_id for thiagocaicorn@hotmail.com
    SELECT id INTO found_user_id
    FROM auth.users
    WHERE email = 'thiagocaicorn@hotmail.com';

    -- Update participant record
    UPDATE participants
    SET user_id = found_user_id
    WHERE name = 'THIAGO/ALINE';
END $$;