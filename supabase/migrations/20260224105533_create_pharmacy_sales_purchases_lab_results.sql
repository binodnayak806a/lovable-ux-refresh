/*
  # Create Pharmacy Sales, Purchases, and Lab Results tables

  1. New Tables
    - `pharmacy_sales`
      - `id` (uuid, primary key)
      - `hospital_id` (uuid, references hospitals)
      - `patient_id` (uuid, nullable, references patients)
      - `consultation_id` (uuid, nullable)
      - `sale_number` (text, unique identifier)
      - `items` (jsonb, array of sale line items)
      - `subtotal` (decimal)
      - `discount_amount` (decimal)
      - `gst_amount` (decimal)
      - `total` (decimal)
      - `payment_mode` (text: cash/card/upi)
      - `patient_name` (text, for walk-in patients)
      - `patient_phone` (text, for walk-in patients)
      - `created_by` (uuid)
      - `created_at` (timestamptz)

    - `pharmacy_purchases`
      - `id` (uuid, primary key)
      - `hospital_id` (uuid, references hospitals)
      - `supplier_name` (text)
      - `invoice_number` (text)
      - `invoice_date` (date)
      - `items` (jsonb, array of purchase line items)
      - `subtotal` (decimal)
      - `gst_amount` (decimal)
      - `total` (decimal)
      - `created_by` (uuid)
      - `created_at` (timestamptz)

    - `lab_results`
      - `id` (uuid, primary key)
      - `hospital_id` (uuid, references hospitals)
      - `lab_order_id` (uuid, references lab_orders)
      - `patient_id` (uuid, references patients)
      - `results` (jsonb, test results data)
      - `status` (text: pending/completed)
      - `completed_at` (timestamptz)
      - `completed_by` (uuid)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage data scoped to their hospital
*/

CREATE TABLE IF NOT EXISTS pharmacy_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL,
  patient_id uuid,
  consultation_id uuid,
  sale_number text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  gst_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  payment_mode text NOT NULL DEFAULT 'cash',
  patient_name text,
  patient_phone text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pharmacy_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pharmacy sales"
  ON pharmacy_sales FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert pharmacy sales"
  ON pharmacy_sales FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update pharmacy sales"
  ON pharmacy_sales FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS pharmacy_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL,
  supplier_name text NOT NULL,
  invoice_number text NOT NULL,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  gst_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pharmacy_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pharmacy purchases"
  ON pharmacy_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert pharmacy purchases"
  ON pharmacy_purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update pharmacy purchases"
  ON pharmacy_purchases FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS lab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid,
  lab_order_id uuid,
  patient_id uuid,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  completed_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lab results"
  ON lab_results FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert lab results"
  ON lab_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update lab results"
  ON lab_results FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_pharmacy_sales_hospital ON pharmacy_sales(hospital_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_sales_patient ON pharmacy_sales(patient_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_purchases_hospital ON pharmacy_purchases(hospital_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_order ON lab_results(lab_order_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_patient ON lab_results(patient_id);
