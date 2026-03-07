/*
  # Database Functions / RPCs

  1. Functions Created
    - `generate_admission_number` - Sequential admission numbers: ADM-YYYY-NNNNNN
    - `generate_bill_number` - Sequential bill numbers: BILL-YYYY-NNNNNN
    - `generate_prescription_number` - Sequential prescription numbers: RX-YYYY-NNNNNN
    - `generate_lab_order_number` - Sequential lab order numbers: LAB-YYYY-NNNNNN

  2. Security
    - All functions use SECURITY DEFINER
    - EXECUTE granted to authenticated role
*/

CREATE OR REPLACE FUNCTION generate_admission_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year text;
  v_count integer;
  v_number text;
BEGIN
  v_year := to_char(NOW(), 'YYYY');
  SELECT COUNT(*) + 1 INTO v_count
  FROM admissions
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  v_number := 'ADM-' || v_year || '-' || LPAD(v_count::text, 6, '0');
  RETURN v_number;
END;
$$;

CREATE OR REPLACE FUNCTION generate_bill_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year text;
  v_count integer;
  v_number text;
BEGIN
  v_year := to_char(NOW(), 'YYYY');
  SELECT COUNT(*) + 1 INTO v_count
  FROM bills
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  v_number := 'BILL-' || v_year || '-' || LPAD(v_count::text, 6, '0');
  RETURN v_number;
END;
$$;

CREATE OR REPLACE FUNCTION generate_prescription_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year text;
  v_count integer;
  v_number text;
BEGIN
  v_year := to_char(NOW(), 'YYYY');
  SELECT COUNT(*) + 1 INTO v_count
  FROM prescriptions
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  v_number := 'RX-' || v_year || '-' || LPAD(v_count::text, 6, '0');
  RETURN v_number;
END;
$$;

CREATE OR REPLACE FUNCTION generate_lab_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year text;
  v_count integer;
  v_number text;
BEGIN
  v_year := to_char(NOW(), 'YYYY');
  SELECT COUNT(*) + 1 INTO v_count
  FROM lab_orders
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  v_number := 'LAB-' || v_year || '-' || LPAD(v_count::text, 6, '0');
  RETURN v_number;
END;
$$;

GRANT EXECUTE ON FUNCTION generate_admission_number() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_bill_number() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_prescription_number() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_lab_order_number() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_doctor_id(uuid) TO authenticated;
