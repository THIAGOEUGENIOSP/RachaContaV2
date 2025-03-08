/*
  # Create admin users table and policies

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `admin_users` table
    - Add policies for admin users to manage the table
    - Add policies for authenticated users to read admin status

  3. Initial Data
    - Insert initial admin users for specified emails
*/

-- Create admin users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Enable read access for authenticated users" ON admin_users;
  DROP POLICY IF EXISTS "Enable insert for admin users" ON admin_users;
  DROP POLICY IF EXISTS "Enable update for admin users" ON admin_users;
  DROP POLICY IF EXISTS "Enable delete for admin users" ON admin_users;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create new policies with fixed conditions
CREATE POLICY "Enable read access for authenticated users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for admin users"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users a
      WHERE a.user_id = auth.uid()
    )
  );

CREATE POLICY "Enable update for admin users"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users a
      WHERE a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users a
      WHERE a.user_id = auth.uid()
    )
  );

CREATE POLICY "Enable delete for admin users"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users a
      WHERE a.user_id = auth.uid()
    )
  );

-- Insert initial admin users if they don't exist
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users 
WHERE email IN (
  'thigocaicorn@hotmail.com',
  'adriano.anselmi@hotmail.com',
  'tairone_souza@hotmail.com'
)
AND NOT EXISTS (
  SELECT 1 FROM admin_users WHERE user_id = auth.users.id
);