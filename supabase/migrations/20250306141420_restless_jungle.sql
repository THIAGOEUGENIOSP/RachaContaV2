/*
  # Update participant user association

  1. Changes
    - Link existing user to participant record
    - Handle case where user already exists
*/

-- Update participant record with existing user's ID
DO $$
DECLARE
    existing_user_id UUID;
BEGIN
    -- Get the ID of the existing user
    SELECT id INTO existing_user_id
    FROM auth.users
    WHERE email = 'thiagocaicorn@hotmail.com'
    LIMIT 1;

    -- Update participant record with the existing user's ID
    IF existing_user_id IS NOT NULL THEN
        UPDATE participants
        SET user_id = existing_user_id
        WHERE name = 'THIAGO/ALINE';
    END IF;
END $$;