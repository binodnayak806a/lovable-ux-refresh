/*
  # Seed Sample Doctors Data

  1. Sample Data
    - 5 doctors with different specializations
    - Multiple fee types for each doctor
    - Weekly schedules
*/

DO $$
DECLARE
  demo_hospital_id uuid := '11111111-1111-1111-1111-111111111111';
  general_med_dept_id uuid;
  cardiology_dept_id uuid;
  ortho_dept_id uuid;
  pedia_dept_id uuid;
  gyn_dept_id uuid;
  dr1_id uuid;
  dr2_id uuid;
  dr3_id uuid;
  dr4_id uuid;
  dr5_id uuid;
BEGIN
  -- Get department IDs (use LIMIT 1 to ensure single row)
  SELECT id INTO general_med_dept_id FROM departments WHERE hospital_id = demo_hospital_id AND name ILIKE '%General Medicine%' LIMIT 1;
  SELECT id INTO cardiology_dept_id FROM departments WHERE hospital_id = demo_hospital_id AND name ILIKE '%Cardiology%' LIMIT 1;
  SELECT id INTO ortho_dept_id FROM departments WHERE hospital_id = demo_hospital_id AND name ILIKE '%Orthopedic%' LIMIT 1;
  SELECT id INTO pedia_dept_id FROM departments WHERE hospital_id = demo_hospital_id AND name ILIKE '%Pediatric%' LIMIT 1;
  SELECT id INTO gyn_dept_id FROM departments WHERE hospital_id = demo_hospital_id AND name ILIKE '%Gynecology%' OR name ILIKE '%Obstetric%' LIMIT 1;

  -- Insert Doctor 1 - General Medicine
  INSERT INTO doctors (hospital_id, employee_id, first_name, last_name, gender, specialty, qualification, registration_number, registration_council, experience_years, department_id, phone, email, is_active, is_available_for_opd, is_available_for_ipd, is_available_for_emergency)
  VALUES (demo_hospital_id, 'DR-0001', 'Rajesh', 'Sharma', 'male', 'General Medicine', 'MBBS, MD (Medicine)', 'MCI-2010-12345', 'Medical Council of India', 15, general_med_dept_id, '9876543210', 'dr.rajesh@hospital.com', true, true, true, true)
  ON CONFLICT (hospital_id, employee_id) DO NOTHING
  RETURNING id INTO dr1_id;
  
  IF dr1_id IS NULL THEN
    SELECT id INTO dr1_id FROM doctors WHERE hospital_id = demo_hospital_id AND employee_id = 'DR-0001';
  END IF;

  -- Insert Doctor 2 - Cardiology
  INSERT INTO doctors (hospital_id, employee_id, first_name, last_name, gender, specialty, qualification, registration_number, registration_council, experience_years, department_id, phone, email, is_active, is_available_for_opd, is_available_for_ipd, is_available_for_emergency)
  VALUES (demo_hospital_id, 'DR-0002', 'Priya', 'Patel', 'female', 'Cardiology', 'MBBS, MD, DM (Cardiology)', 'MCI-2008-23456', 'Medical Council of India', 18, cardiology_dept_id, '9876543211', 'dr.priya@hospital.com', true, true, true, true)
  ON CONFLICT (hospital_id, employee_id) DO NOTHING
  RETURNING id INTO dr2_id;

  IF dr2_id IS NULL THEN
    SELECT id INTO dr2_id FROM doctors WHERE hospital_id = demo_hospital_id AND employee_id = 'DR-0002';
  END IF;

  -- Insert Doctor 3 - Orthopedics
  INSERT INTO doctors (hospital_id, employee_id, first_name, last_name, gender, specialty, qualification, registration_number, registration_council, experience_years, department_id, phone, email, is_active, is_available_for_opd, is_available_for_ipd, is_available_for_emergency)
  VALUES (demo_hospital_id, 'DR-0003', 'Amit', 'Kumar', 'male', 'Orthopedics', 'MBBS, MS (Ortho)', 'MCI-2012-34567', 'Medical Council of India', 12, ortho_dept_id, '9876543212', 'dr.amit@hospital.com', true, true, true, false)
  ON CONFLICT (hospital_id, employee_id) DO NOTHING
  RETURNING id INTO dr3_id;

  IF dr3_id IS NULL THEN
    SELECT id INTO dr3_id FROM doctors WHERE hospital_id = demo_hospital_id AND employee_id = 'DR-0003';
  END IF;

  -- Insert Doctor 4 - Pediatrics
  INSERT INTO doctors (hospital_id, employee_id, first_name, last_name, gender, specialty, qualification, registration_number, registration_council, experience_years, department_id, phone, email, is_active, is_available_for_opd, is_available_for_ipd, is_available_for_emergency)
  VALUES (demo_hospital_id, 'DR-0004', 'Sneha', 'Reddy', 'female', 'Pediatrics', 'MBBS, MD (Pediatrics)', 'MCI-2015-45678', 'Medical Council of India', 9, pedia_dept_id, '9876543213', 'dr.sneha@hospital.com', true, true, false, true)
  ON CONFLICT (hospital_id, employee_id) DO NOTHING
  RETURNING id INTO dr4_id;

  IF dr4_id IS NULL THEN
    SELECT id INTO dr4_id FROM doctors WHERE hospital_id = demo_hospital_id AND employee_id = 'DR-0004';
  END IF;

  -- Insert Doctor 5 - OBG
  INSERT INTO doctors (hospital_id, employee_id, first_name, last_name, gender, specialty, qualification, registration_number, registration_council, experience_years, department_id, phone, email, is_active, is_available_for_opd, is_available_for_ipd, is_available_for_emergency)
  VALUES (demo_hospital_id, 'DR-0005', 'Anita', 'Verma', 'female', 'Obstetrics & Gynecology', 'MBBS, MS (OBG)', 'MCI-2011-56789', 'Medical Council of India', 14, gyn_dept_id, '9876543214', 'dr.anita@hospital.com', true, true, true, true)
  ON CONFLICT (hospital_id, employee_id) DO NOTHING
  RETURNING id INTO dr5_id;

  IF dr5_id IS NULL THEN
    SELECT id INTO dr5_id FROM doctors WHERE hospital_id = demo_hospital_id AND employee_id = 'DR-0005';
  END IF;

  -- Insert fees for Doctor 1
  IF dr1_id IS NOT NULL THEN
    INSERT INTO doctor_fees (doctor_id, fee_type, amount, validity_days, description)
    VALUES 
      (dr1_id, 'consultation', 500, 0, 'Regular OPD Consultation'),
      (dr1_id, 'follow_up', 300, 7, 'Follow-up within 7 days'),
      (dr1_id, 'emergency', 1000, 0, 'Emergency Consultation'),
      (dr1_id, 'video_consultation', 400, 0, 'Online Video Consultation')
    ON CONFLICT (doctor_id, fee_type) DO NOTHING;

    -- Insert schedule for Doctor 1
    INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, max_patients)
    VALUES 
      (dr1_id, 1, '09:00', '13:00', 15, 16),
      (dr1_id, 2, '09:00', '13:00', 15, 16),
      (dr1_id, 3, '09:00', '13:00', 15, 16),
      (dr1_id, 4, '09:00', '13:00', 15, 16),
      (dr1_id, 5, '09:00', '13:00', 15, 16),
      (dr1_id, 6, '09:00', '12:00', 15, 12)
    ON CONFLICT (doctor_id, day_of_week, start_time) DO NOTHING;
  END IF;

  -- Insert fees for Doctor 2
  IF dr2_id IS NOT NULL THEN
    INSERT INTO doctor_fees (doctor_id, fee_type, amount, validity_days, description)
    VALUES 
      (dr2_id, 'consultation', 1500, 0, 'Cardiology Consultation'),
      (dr2_id, 'follow_up', 800, 15, 'Follow-up within 15 days'),
      (dr2_id, 'emergency', 3000, 0, 'Emergency Cardiac Consultation'),
      (dr2_id, 'video_consultation', 1200, 0, 'Online Video Consultation')
    ON CONFLICT (doctor_id, fee_type) DO NOTHING;

    INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, max_patients)
    VALUES 
      (dr2_id, 1, '10:00', '14:00', 20, 12),
      (dr2_id, 2, '10:00', '14:00', 20, 12),
      (dr2_id, 3, '10:00', '14:00', 20, 12),
      (dr2_id, 4, '10:00', '14:00', 20, 12),
      (dr2_id, 5, '10:00', '14:00', 20, 12)
    ON CONFLICT (doctor_id, day_of_week, start_time) DO NOTHING;
  END IF;

  -- Insert fees for Doctor 3
  IF dr3_id IS NOT NULL THEN
    INSERT INTO doctor_fees (doctor_id, fee_type, amount, validity_days, description)
    VALUES 
      (dr3_id, 'consultation', 800, 0, 'Orthopedic Consultation'),
      (dr3_id, 'follow_up', 500, 10, 'Follow-up within 10 days'),
      (dr3_id, 'emergency', 1500, 0, 'Emergency Consultation'),
      (dr3_id, 'procedure', 2000, 0, 'Minor Procedure Fee')
    ON CONFLICT (doctor_id, fee_type) DO NOTHING;

    INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, max_patients)
    VALUES 
      (dr3_id, 1, '11:00', '15:00', 15, 16),
      (dr3_id, 2, '11:00', '15:00', 15, 16),
      (dr3_id, 4, '11:00', '15:00', 15, 16),
      (dr3_id, 5, '11:00', '15:00', 15, 16)
    ON CONFLICT (doctor_id, day_of_week, start_time) DO NOTHING;
  END IF;

  -- Insert fees for Doctor 4
  IF dr4_id IS NOT NULL THEN
    INSERT INTO doctor_fees (doctor_id, fee_type, amount, validity_days, description)
    VALUES 
      (dr4_id, 'consultation', 600, 0, 'Pediatric Consultation'),
      (dr4_id, 'follow_up', 350, 7, 'Follow-up within 7 days'),
      (dr4_id, 'emergency', 1200, 0, 'Emergency Pediatric Care'),
      (dr4_id, 'video_consultation', 500, 0, 'Online Video Consultation')
    ON CONFLICT (doctor_id, fee_type) DO NOTHING;

    INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, max_patients)
    VALUES 
      (dr4_id, 1, '09:30', '13:30', 15, 16),
      (dr4_id, 2, '09:30', '13:30', 15, 16),
      (dr4_id, 3, '09:30', '13:30', 15, 16),
      (dr4_id, 4, '09:30', '13:30', 15, 16),
      (dr4_id, 5, '09:30', '13:30', 15, 16),
      (dr4_id, 6, '09:30', '12:30', 15, 12)
    ON CONFLICT (doctor_id, day_of_week, start_time) DO NOTHING;
  END IF;

  -- Insert fees for Doctor 5
  IF dr5_id IS NOT NULL THEN
    INSERT INTO doctor_fees (doctor_id, fee_type, amount, validity_days, description)
    VALUES 
      (dr5_id, 'consultation', 700, 0, 'Gynecology Consultation'),
      (dr5_id, 'follow_up', 400, 7, 'Follow-up within 7 days'),
      (dr5_id, 'emergency', 1500, 0, 'Emergency OBG Care'),
      (dr5_id, 'home_visit', 2000, 0, 'Home Visit Charges'),
      (dr5_id, 'procedure', 1500, 0, 'Minor Procedure Fee')
    ON CONFLICT (doctor_id, fee_type) DO NOTHING;

    INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, max_patients)
    VALUES 
      (dr5_id, 1, '10:00', '14:00', 20, 12),
      (dr5_id, 2, '10:00', '14:00', 20, 12),
      (dr5_id, 3, '10:00', '14:00', 20, 12),
      (dr5_id, 4, '10:00', '14:00', 20, 12),
      (dr5_id, 5, '10:00', '14:00', 20, 12)
    ON CONFLICT (doctor_id, day_of_week, start_time) DO NOTHING;
  END IF;

END $$;
