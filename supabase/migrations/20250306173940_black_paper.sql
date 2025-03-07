/*
  # Create admin users table and policies

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on admin_users table
    - Add policies for admin access
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin users can view admin_users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT user_id FROM admin_users));

CREATE POLICY "Admin users can manage admin_users"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (user_id IN (SELECT user_id FROM admin_users))
  WITH CHECK (user_id IN (SELECT user_id FROM admin_users));