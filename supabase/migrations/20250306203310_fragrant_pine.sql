/*
  # Fix admin users policies

  1. Changes
    - Drop existing admin_users table and policies
    - Recreate table with proper structure
    - Add correct RLS policies without recursion
    - Insert initial admin users

  2. Security
    - Enable RLS
    - Add non-recursive policies for admin access
    - Allow read access for all authenticated users
    - Restrict write operations to existing admins

  3. Initial Data
    - Add initial admin users for specified emails
*/

-- Drop existing table and policies
DROP TABLE IF EXISTS admin_users CASCADE;

-- Create admin users table
CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

-- For insert/update/delete, we'll use a simpler approach that checks if the user
-- is in the admin_users table without causing recursion
CREATE POLICY "Enable insert for admin users"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM admin_users
    )
  );

CREATE POLICY "Enable update for admin users"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM admin_users
    )
  );

CREATE POLICY "Enable delete for admin users"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users
    )
  );

-- Insert initial admin users
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users 
WHERE email IN (
  'thigocaicorn@hotmail.com',
  'adriano.anselmi@hotmail.com',
  'tairone_souza@hotmail.com'
)
ON CONFLICT (user_id) DO NOTHING;