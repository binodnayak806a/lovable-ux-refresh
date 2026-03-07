/*
  # Seed Demo Hospital, Wards, Beds, and Service Items

  ## Data Seeded

  ### Demo Hospital record for testing
  ### Departments (15 departments)
  ### Wards (8 wards)
  ### Beds (auto-generated for each ward)
  ### Service Items (60+ billable items)
  ### Demo Ambulances (3 vehicles)
*/

-- ============================================================
-- DEMO HOSPITAL
-- ============================================================
INSERT INTO hospitals (id, name, registration_number, address, city, state, phone, email, bed_count)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'City General Hospital',
  'HOSP/2024/0001',
  '123 Hospital Road, Medical District',
  'Mumbai',
  'Maharashtra',
  '+91 22 1234 5678',
  'admin@citygeneralhospital.com',
  100
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DEPARTMENTS
-- ============================================================
INSERT INTO departments (hospital_id, name, code, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'General Medicine', 'GM', true),
('11111111-1111-1111-1111-111111111111', 'Surgery', 'SUR', true),
('11111111-1111-1111-1111-111111111111', 'Pediatrics', 'PED', true),
('11111111-1111-1111-1111-111111111111', 'Gynecology & Obstetrics', 'GYN', true),
('11111111-1111-1111-1111-111111111111', 'Orthopedics', 'ORT', true),
('11111111-1111-1111-1111-111111111111', 'Cardiology', 'CAR', true),
('11111111-1111-1111-1111-111111111111', 'Neurology', 'NEU', true),
('11111111-1111-1111-1111-111111111111', 'Dermatology', 'DER', true),
('11111111-1111-1111-1111-111111111111', 'ENT', 'ENT', true),
('11111111-1111-1111-1111-111111111111', 'Ophthalmology', 'OPH', true),
('11111111-1111-1111-1111-111111111111', 'Radiology', 'RAD', true),
('11111111-1111-1111-1111-111111111111', 'Pathology & Lab', 'LAB', true),
('11111111-1111-1111-1111-111111111111', 'Emergency Medicine', 'EM', true),
('11111111-1111-1111-1111-111111111111', 'Anesthesiology', 'ANS', true),
('11111111-1111-1111-1111-111111111111', 'Administration', 'ADM', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- WARDS
-- ============================================================
DO $$
DECLARE
  w1 uuid; w2 uuid; w3 uuid; w4 uuid; w5 uuid; w6 uuid; w7 uuid; w8 uuid;
  i integer;
BEGIN
  -- Insert wards, capturing the generated IDs
  INSERT INTO wards (hospital_id, name, ward_type, total_beds, available_beds, floor, block, daily_rate)
  VALUES ('11111111-1111-1111-1111-111111111111', 'General Ward A', 'general', 20, 20, 1, 'A', 500)
  ON CONFLICT DO NOTHING RETURNING id INTO w1;

  IF w1 IS NULL THEN
    SELECT id INTO w1 FROM wards WHERE hospital_id = '11111111-1111-1111-1111-111111111111' AND name = 'General Ward A';
  END IF;

  INSERT INTO wards (hospital_id, name, ward_type, total_beds, available_beds, floor, block, daily_rate)
  VALUES ('11111111-1111-1111-1111-111111111111', 'General Ward B', 'general', 20, 20, 1, 'B', 500)
  ON CONFLICT DO NOTHING RETURNING id INTO w2;

  IF w2 IS NULL THEN
    SELECT id INTO w2 FROM wards WHERE hospital_id = '11111111-1111-1111-1111-111111111111' AND name = 'General Ward B';
  END IF;

  INSERT INTO wards (hospital_id, name, ward_type, total_beds, available_beds, floor, block, daily_rate)
  VALUES ('11111111-1111-1111-1111-111111111111', 'Private Ward', 'private', 10, 10, 2, 'A', 2500)
  ON CONFLICT DO NOTHING RETURNING id INTO w3;

  IF w3 IS NULL THEN
    SELECT id INTO w3 FROM wards WHERE hospital_id = '11111111-1111-1111-1111-111111111111' AND name = 'Private Ward';
  END IF;

  INSERT INTO wards (hospital_id, name, ward_type, total_beds, available_beds, floor, block, daily_rate)
  VALUES ('11111111-1111-1111-1111-111111111111', 'Semi-Private Ward', 'semi_private', 10, 10, 2, 'B', 1500)
  ON CONFLICT DO NOTHING RETURNING id INTO w4;

  IF w4 IS NULL THEN
    SELECT id INTO w4 FROM wards WHERE hospital_id = '11111111-1111-1111-1111-111111111111' AND name = 'Semi-Private Ward';
  END IF;

  INSERT INTO wards (hospital_id, name, ward_type, total_beds, available_beds, floor, block, daily_rate)
  VALUES ('11111111-1111-1111-1111-111111111111', 'ICU', 'icu', 10, 10, 3, 'A', 8000)
  ON CONFLICT DO NOTHING RETURNING id INTO w5;

  IF w5 IS NULL THEN
    SELECT id INTO w5 FROM wards WHERE hospital_id = '11111111-1111-1111-1111-111111111111' AND name = 'ICU';
  END IF;

  INSERT INTO wards (hospital_id, name, ward_type, total_beds, available_beds, floor, block, daily_rate)
  VALUES ('11111111-1111-1111-1111-111111111111', 'HDU', 'hdu', 8, 8, 3, 'B', 5000)
  ON CONFLICT DO NOTHING RETURNING id INTO w6;

  IF w6 IS NULL THEN
    SELECT id INTO w6 FROM wards WHERE hospital_id = '11111111-1111-1111-1111-111111111111' AND name = 'HDU';
  END IF;

  INSERT INTO wards (hospital_id, name, ward_type, total_beds, available_beds, floor, block, daily_rate)
  VALUES ('11111111-1111-1111-1111-111111111111', 'Maternity Ward', 'general', 10, 10, 2, 'C', 1200)
  ON CONFLICT DO NOTHING RETURNING id INTO w7;

  IF w7 IS NULL THEN
    SELECT id INTO w7 FROM wards WHERE hospital_id = '11111111-1111-1111-1111-111111111111' AND name = 'Maternity Ward';
  END IF;

  INSERT INTO wards (hospital_id, name, ward_type, total_beds, available_beds, floor, block, daily_rate)
  VALUES ('11111111-1111-1111-1111-111111111111', 'Pediatric Ward', 'general', 10, 10, 1, 'C', 800)
  ON CONFLICT DO NOTHING RETURNING id INTO w8;

  IF w8 IS NULL THEN
    SELECT id INTO w8 FROM wards WHERE hospital_id = '11111111-1111-1111-1111-111111111111' AND name = 'Pediatric Ward';
  END IF;

  -- Generate beds for each ward
  FOR i IN 1..20 LOOP
    INSERT INTO beds (hospital_id, ward_id, bed_number, bed_type, status, daily_rate)
    VALUES ('11111111-1111-1111-1111-111111111111', w1, 'GWA-' || LPAD(i::text, 2, '0'), 'general', 'available', 500)
    ON CONFLICT DO NOTHING;
  END LOOP;

  FOR i IN 1..20 LOOP
    INSERT INTO beds (hospital_id, ward_id, bed_number, bed_type, status, daily_rate)
    VALUES ('11111111-1111-1111-1111-111111111111', w2, 'GWB-' || LPAD(i::text, 2, '0'), 'general', 'available', 500)
    ON CONFLICT DO NOTHING;
  END LOOP;

  FOR i IN 1..10 LOOP
    INSERT INTO beds (hospital_id, ward_id, bed_number, bed_type, status, daily_rate)
    VALUES ('11111111-1111-1111-1111-111111111111', w3, 'PVT-' || LPAD(i::text, 2, '0'), 'general', 'available', 2500)
    ON CONFLICT DO NOTHING;
  END LOOP;

  FOR i IN 1..10 LOOP
    INSERT INTO beds (hospital_id, ward_id, bed_number, bed_type, status, daily_rate)
    VALUES ('11111111-1111-1111-1111-111111111111', w4, 'SPV-' || LPAD(i::text, 2, '0'), 'general', 'available', 1500)
    ON CONFLICT DO NOTHING;
  END LOOP;

  FOR i IN 1..10 LOOP
    INSERT INTO beds (hospital_id, ward_id, bed_number, bed_type, status, daily_rate)
    VALUES ('11111111-1111-1111-1111-111111111111', w5, 'ICU-' || LPAD(i::text, 2, '0'), 'icu', 'available', 8000)
    ON CONFLICT DO NOTHING;
  END LOOP;

  FOR i IN 1..8 LOOP
    INSERT INTO beds (hospital_id, ward_id, bed_number, bed_type, status, daily_rate)
    VALUES ('11111111-1111-1111-1111-111111111111', w6, 'HDU-' || LPAD(i::text, 2, '0'), 'oxygen', 'available', 5000)
    ON CONFLICT DO NOTHING;
  END LOOP;

  FOR i IN 1..10 LOOP
    INSERT INTO beds (hospital_id, ward_id, bed_number, bed_type, status, daily_rate)
    VALUES ('11111111-1111-1111-1111-111111111111', w7, 'MAT-' || LPAD(i::text, 2, '0'), 'general', 'available', 1200)
    ON CONFLICT DO NOTHING;
  END LOOP;

  FOR i IN 1..10 LOOP
    INSERT INTO beds (hospital_id, ward_id, bed_number, bed_type, status, daily_rate)
    VALUES ('11111111-1111-1111-1111-111111111111', w8, 'PED-' || LPAD(i::text, 2, '0'), 'general', 'available', 800)
    ON CONFLICT DO NOTHING;
  END LOOP;

END $$;

-- ============================================================
-- SERVICE ITEMS
-- ============================================================
INSERT INTO service_items (hospital_id, name, code, category, rate, tax_percent, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'General Consultation', 'CONS-GM', 'consultation', 500, 0, true),
('11111111-1111-1111-1111-111111111111', 'Specialist Consultation', 'CONS-SP', 'consultation', 800, 0, true),
('11111111-1111-1111-1111-111111111111', 'Senior Specialist Consultation', 'CONS-SS', 'consultation', 1200, 0, true),
('11111111-1111-1111-1111-111111111111', 'Emergency Consultation', 'CONS-EM', 'consultation', 1000, 0, true),
('11111111-1111-1111-1111-111111111111', 'Follow-up Consultation', 'CONS-FU', 'consultation', 300, 0, true),
('11111111-1111-1111-1111-111111111111', 'General Ward Bed (per day)', 'ROOM-GW', 'room_charges', 500, 0, true),
('11111111-1111-1111-1111-111111111111', 'Semi-Private Room (per day)', 'ROOM-SP', 'room_charges', 1500, 0, true),
('11111111-1111-1111-1111-111111111111', 'Private Room (per day)', 'ROOM-PV', 'room_charges', 2500, 0, true),
('11111111-1111-1111-1111-111111111111', 'ICU Bed (per day)', 'ROOM-IC', 'room_charges', 8000, 0, true),
('11111111-1111-1111-1111-111111111111', 'HDU Bed (per day)', 'ROOM-HD', 'room_charges', 5000, 0, true),
('11111111-1111-1111-1111-111111111111', 'Nursing Charges (per day)', 'NURS-01', 'nursing', 300, 0, true),
('11111111-1111-1111-1111-111111111111', 'ICU Nursing (per day)', 'NURS-IC', 'nursing', 1500, 0, true),
('11111111-1111-1111-1111-111111111111', 'IV Cannula Insertion', 'NURS-IV', 'nursing', 150, 0, true),
('11111111-1111-1111-1111-111111111111', 'Wound Dressing', 'NURS-DR', 'nursing', 200, 0, true),
('11111111-1111-1111-1111-111111111111', 'Urinary Catheterization', 'NURS-CA', 'nursing', 400, 0, true),
('11111111-1111-1111-1111-111111111111', 'Minor Surgical Procedure', 'PROC-MS', 'procedure', 2000, 18, true),
('11111111-1111-1111-1111-111111111111', 'Major Surgical Procedure', 'PROC-MJ', 'procedure', 15000, 18, true),
('11111111-1111-1111-1111-111111111111', 'Laparoscopic Surgery', 'PROC-LA', 'procedure', 25000, 18, true),
('11111111-1111-1111-1111-111111111111', 'Caesarean Section', 'PROC-CS', 'procedure', 35000, 18, true),
('11111111-1111-1111-1111-111111111111', 'Normal Delivery', 'PROC-ND', 'procedure', 15000, 0, true),
('11111111-1111-1111-1111-111111111111', 'Suturing', 'PROC-SU', 'procedure', 500, 18, true),
('11111111-1111-1111-1111-111111111111', 'ECG', 'PROC-EC', 'procedure', 300, 18, true),
('11111111-1111-1111-1111-111111111111', 'Echocardiography', 'PROC-EH', 'procedure', 2500, 18, true),
('11111111-1111-1111-1111-111111111111', 'Endoscopy', 'PROC-EN', 'procedure', 3500, 18, true),
('11111111-1111-1111-1111-111111111111', 'X-Ray (single view)', 'RAD-XR1', 'radiology', 300, 18, true),
('11111111-1111-1111-1111-111111111111', 'X-Ray (two views)', 'RAD-XR2', 'radiology', 500, 18, true),
('11111111-1111-1111-1111-111111111111', 'Chest X-Ray', 'RAD-CXR', 'radiology', 350, 18, true),
('11111111-1111-1111-1111-111111111111', 'USG Abdomen', 'RAD-USA', 'radiology', 1200, 18, true),
('11111111-1111-1111-1111-111111111111', 'USG Whole Abdomen', 'RAD-USW', 'radiology', 1500, 18, true),
('11111111-1111-1111-1111-111111111111', 'CT Scan Head', 'RAD-CTH', 'radiology', 5000, 18, true),
('11111111-1111-1111-1111-111111111111', 'CT Scan Chest', 'RAD-CTC', 'radiology', 6000, 18, true),
('11111111-1111-1111-1111-111111111111', 'MRI Brain', 'RAD-MRB', 'radiology', 8000, 18, true),
('11111111-1111-1111-1111-111111111111', 'MRI Spine', 'RAD-MRS', 'radiology', 9000, 18, true),
('11111111-1111-1111-1111-111111111111', 'Local Anesthesia', 'ANS-LA', 'anesthesia', 500, 18, true),
('11111111-1111-1111-1111-111111111111', 'General Anesthesia', 'ANS-GA', 'anesthesia', 5000, 18, true),
('11111111-1111-1111-1111-111111111111', 'Spinal Anesthesia', 'ANS-SA', 'anesthesia', 3000, 18, true),
('11111111-1111-1111-1111-111111111111', 'OT Charges (minor)', 'OT-MIN', 'ot_charges', 3000, 18, true),
('11111111-1111-1111-1111-111111111111', 'OT Charges (major)', 'OT-MAJ', 'ot_charges', 10000, 18, true),
('11111111-1111-1111-1111-111111111111', 'Ambulance (within city)', 'AMB-CY', 'ambulance', 800, 0, true),
('11111111-1111-1111-1111-111111111111', 'Ambulance (outside city)', 'AMB-OC', 'ambulance', 2000, 0, true),
('11111111-1111-1111-1111-111111111111', 'Diet Charges (per day)', 'DIET-01', 'dietetics', 300, 5, true),
('11111111-1111-1111-1111-111111111111', 'Physiotherapy Session', 'PHY-01', 'physiotherapy', 500, 0, true),
('11111111-1111-1111-1111-111111111111', 'Blood Transfusion (per unit)', 'BB-TR', 'blood_bank', 1500, 0, true),
('11111111-1111-1111-1111-111111111111', 'Oxygen (per day)', 'MISC-OX', 'miscellaneous', 500, 0, true),
('11111111-1111-1111-1111-111111111111', 'Ventilator Charges (per day)', 'MISC-VN', 'miscellaneous', 5000, 0, true),
('11111111-1111-1111-1111-111111111111', 'Nebulization', 'MISC-NB', 'miscellaneous', 200, 0, true),
('11111111-1111-1111-1111-111111111111', 'Admission Registration Fee', 'MISC-AR', 'miscellaneous', 200, 0, true),
('11111111-1111-1111-1111-111111111111', 'Medical Certificate', 'MISC-MC', 'miscellaneous', 300, 0, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- DEMO AMBULANCES
-- ============================================================
INSERT INTO ambulances (hospital_id, vehicle_number, vehicle_type, make_model, driver_name, driver_phone, current_status)
VALUES
('11111111-1111-1111-1111-111111111111', 'MH-01-AA-1001', 'basic', 'TATA Winger', 'Ramesh Kumar', '+91 98765 11001', 'available'),
('11111111-1111-1111-1111-111111111111', 'MH-01-AA-1002', 'advanced', 'Force Traveller ALS', 'Suresh Patil', '+91 98765 11002', 'available'),
('11111111-1111-1111-1111-111111111111', 'MH-01-AA-1003', 'icu_on_wheels', 'TATA Winger ICU', 'Mahesh Sharma', '+91 98765 11003', 'available')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED LAB TESTS WITH HOSPITAL ID (for the demo hospital)
-- ============================================================
UPDATE lab_tests SET hospital_id = '11111111-1111-1111-1111-111111111111'
WHERE hospital_id IS NULL;
