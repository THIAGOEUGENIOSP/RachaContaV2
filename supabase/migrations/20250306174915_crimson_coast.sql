/*
  # Add admin user

  1. Create admin user account
  2. Add user to admin_users table
*/

-- Create admin user
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Create user account
  user_id := extensions.uuid_generate_v4();
  
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    'thiago.barros',
    extensions.crypt('S3cur!ty1', extensions.gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  );

  -- Add user to admin_users table
  INSERT INTO admin_users (user_id) VALUES (user_id);
END $$;