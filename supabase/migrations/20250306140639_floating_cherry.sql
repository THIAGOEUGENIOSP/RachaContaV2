/*
  # Create User Account and Link to Participant

  1. Changes
    - Create user account for THIAGO/ALINE with proper UUID generation
    - Link user account to existing participant record
*/

-- Create user account with specified email and password
DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
BEGIN
    -- Insert new user with email and hashed password
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_sent_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        instance_id,
        role,
        aud
    )
    VALUES (
        new_user_id,
        'thiagocaicorn@hotmail.com',
        crypt('S3cur!ty1', gen_salt('bf')),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{}',
        NOW(),
        NOW(),
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated'
    );

    -- Update participant record with new user_id
    UPDATE participants
    SET user_id = new_user_id
    WHERE name = 'THIAGO/ALINE';
END $$;