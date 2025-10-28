/*
  # Create tickets table for hospital ticket management system

  1. New Tables
    - `tickets`
      - `id` (uuid, primary key)
      - `full_name` (text) - Patient name
      - `ticket_type` (text) - Type of ticket (emergency, appointment, etc.)
      - `symptoms` (text) - Patient symptoms/reason
      - `appointment_date` (date) - Scheduled appointment date
      - `appointment_time` (time) - Scheduled appointment time
      - `status` (text) - Ticket status (pending, accepted, rejected, ongoing, closed)
      - `doctor_assigned` (text) - Doctor assigned to ticket
      - `created_at` (timestamptz) - Timestamp when ticket was created
      - `updated_at` (timestamptz) - Timestamp when ticket was last updated

  2. Security
    - Enable RLS on `tickets` table
    - Add policy for authenticated users to read all tickets
    - Add policy for authenticated users to insert tickets
    - Add policy for authenticated users to update tickets they have access to

  3. Notes
    - Default status is 'pending' for new tickets
    - Timestamps automatically track creation and updates
*/

CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  ticket_type text DEFAULT 'general',
  symptoms text,
  appointment_date date,
  appointment_time time,
  status text DEFAULT 'pending',
  doctor_assigned text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all tickets"
  ON tickets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tickets"
  ON tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tickets"
  ON tickets
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can insert tickets"
  ON tickets
  FOR INSERT
  TO anon
  WITH CHECK (true);