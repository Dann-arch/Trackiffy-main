/*
  # Fleet Management Database Schema

  1. New Tables
    - `vehicles`
      - Basic vehicle information including make, model, year, license plate
    - `fuel_logs`
      - Fuel consumption tracking with amount, cost, and mileage
    - `service_records`
      - Maintenance and service history
    - `service_schedules`
      - Planned maintenance schedules
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  license_plate text NOT NULL,
  vin text,
  status text DEFAULT 'active',
  current_mileage integer DEFAULT 0,
  user_id uuid REFERENCES auth.users(id)
);

-- Fuel logs table
CREATE TABLE IF NOT EXISTS fuel_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  vehicle_id uuid REFERENCES vehicles(id),
  fuel_amount decimal NOT NULL,
  cost_per_unit decimal NOT NULL,
  total_cost decimal NOT NULL,
  mileage integer NOT NULL,
  fuel_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id)
);

-- Service records table
CREATE TABLE IF NOT EXISTS service_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  vehicle_id uuid REFERENCES vehicles(id),
  service_date date NOT NULL,
  service_type text NOT NULL,
  description text,
  cost decimal NOT NULL,
  mileage integer NOT NULL,
  next_service_date date,
  next_service_mileage integer,
  user_id uuid REFERENCES auth.users(id)
);

-- Service schedules table
CREATE TABLE IF NOT EXISTS service_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  vehicle_id uuid REFERENCES vehicles(id),
  service_type text NOT NULL,
  interval_months integer,
  interval_mileage integer,
  description text,
  user_id uuid REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own vehicles"
  ON vehicles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own fuel logs"
  ON fuel_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own service records"
  ON service_records
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own service schedules"
  ON service_schedules
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);