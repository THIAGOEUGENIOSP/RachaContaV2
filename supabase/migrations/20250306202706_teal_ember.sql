/*
  # Authentication and Admin Schema Setup

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `admin_users` table
    - Add policies for admin access
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin users can read admin_users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

CREATE POLICY "Admin users can insert admin_users"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));

CREATE POLICY "Admin users can update admin_users"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM admin_users))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));

CREATE POLICY "Admin users can delete admin_users"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Create initial admin users
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users
WHERE email IN (
  'thigocaicorn@hotmail.com',
  'adriano.anselmi@hotmail.com',
  'tairone_souza@hotmail.com'
);

-- Update RLS policies for other tables to allow admin access

-- Participants table
CREATE POLICY "Admin users have full access to participants"
  ON participants
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Expenses table
CREATE POLICY "Admin users have full access to expenses"
  ON expenses
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Expense participants table
CREATE POLICY "Admin users have full access to expense_participants"
  ON expense_participants
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Payments table
CREATE POLICY "Admin users have full access to payments"
  ON payments
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Shopping list table
CREATE POLICY "Admin users have full access to shopping_list"
  ON shopping_list
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Contributions table
CREATE POLICY "Admin users have full access to contributions"
  ON contributions
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM admin_users));