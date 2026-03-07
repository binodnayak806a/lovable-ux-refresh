
/*
  # Complete Demo Hospital Seed — Final

  All constraint rules applied:
  - patients.gender: lowercase ('male'|'female'|'other')
  - admissions.admission_type: 'general'|'emergency'|'planned'|'transfer'
  - admissions.status: 'active'|'discharged'|'transferred'|'absconded'|'death'
  - appointments.status: 'scheduled'|'confirmed'|'in_progress'|'completed'|'cancelled'|'no_show'
  - bills.status: 'draft'|'pending'|'paid'|'partial'|'cancelled'|'refunded'
  - bills.balance_due: GENERATED column — excluded from INSERT
  - prescriptions.status: 'active'|'dispensed'|'cancelled'|'expired'
  - leave_requests.approved_by: references profiles.id
*/

DO $$
DECLARE
  v_hid  uuid := '11111111-1111-1111-1111-111111111111';
  v_admin_id   uuid := gen_random_uuid();
  v_doctor_id  uuid := gen_random_uuid();
  v_nurse_id   uuid := gen_random_uuid();
  v_recept_id  uuid := gen_random_uuid();
  w_gwa uuid := '52be0c6f-cf74-43ab-9d01-5f89857f1f9c';
  w_gwb uuid := '6e3062fb-16b5-4ad9-98f0-a5fa1dc86df9';
  w_pvt uuid := '21534b5c-c599-4389-8869-de2f06f1571e';
  w_icu uuid := '3f8066cc-603e-4970-8610-55fd78faca8e';
  p uuid[] := ARRAY(SELECT gen_random_uuid() FROM generate_series(1,25));
  a uuid[] := ARRAY(SELECT gen_random_uuid() FROM generate_series(1,30));
  s uuid[] := ARRAY(SELECT gen_random_uuid() FROM generate_series(1,10));
  v_bed uuid;
BEGIN

  -- AUTH USERS
  INSERT INTO auth.users (id,instance_id,aud,role,email,encrypted_password,
    email_confirmed_at,raw_app_meta_data,raw_user_meta_data,
    created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
  VALUES
  (v_admin_id, '00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'admin@healthray.demo',crypt('Demo@1234',gen_salt('bf')),now(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Dr. Rajesh Kumar"}',now(),now(),'','','',''),
  (v_doctor_id,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'doctor@healthray.demo',crypt('Demo@1234',gen_salt('bf')),now(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Dr. Priya Sharma"}',now(),now(),'','','',''),
  (v_nurse_id, '00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'nurse@healthray.demo',crypt('Demo@1234',gen_salt('bf')),now(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Anita Desai"}',now(),now(),'','','',''),
  (v_recept_id,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'reception@healthray.demo',crypt('Demo@1234',gen_salt('bf')),now(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Suresh Patel"}',now(),now(),'','','','')
  ON CONFLICT (id) DO NOTHING;

  -- PROFILES
  INSERT INTO profiles (id,email,full_name,role,hospital_id,department,designation,phone,is_active)
  VALUES
  (v_admin_id, 'admin@healthray.demo',    'Dr. Rajesh Kumar','superadmin',  v_hid,'Administration',  'Chief Medical Officer',   '+91 98200 11111',true),
  (v_doctor_id,'doctor@healthray.demo',   'Dr. Priya Sharma','doctor',      v_hid,'General Medicine','Senior Consultant',       '+91 98200 22222',true),
  (v_nurse_id, 'nurse@healthray.demo',    'Anita Desai',     'nurse',       v_hid,'General Medicine','Senior Staff Nurse',      '+91 98200 33333',true),
  (v_recept_id,'reception@healthray.demo','Suresh Patel',    'receptionist',v_hid,'Administration',  'Front Desk Receptionist', '+91 98200 44444',true)
  ON CONFLICT (id) DO NOTHING;

  -- PATIENTS
  INSERT INTO patients (id,uhid,hospital_id,full_name,date_of_birth,gender,blood_group,
    phone,email,address,city,state,emergency_contact_name,emergency_contact_phone,emergency_contact_relation)
  VALUES
  (p[1], 'UH-2024-000001',v_hid,'Amit Sharma',     '1978-03-15','male',  'B+', '9876500001','amit.s@email.com',   '12 MG Road',        'Mumbai',   'Maharashtra','Priya Sharma',     '9876500101','Wife'),
  (p[2], 'UH-2024-000002',v_hid,'Sunita Patel',    '1985-07-22','female','A+', '9876500002','sunita.p@email.com', '34 Park Street',    'Pune',     'Maharashtra','Ramesh Patel',     '9876500102','Husband'),
  (p[3], 'UH-2024-000003',v_hid,'Ravi Kumar',      '1965-11-08','male',  'O+', '9876500003','ravi.k@email.com',   '78 Gandhi Nagar',   'Mumbai',   'Maharashtra','Meena Kumar',      '9876500103','Wife'),
  (p[4], 'UH-2024-000004',v_hid,'Meena Joshi',     '1992-05-30','female','AB+','9876500004','meena.j@email.com',  '56 Nehru Colony',   'Thane',    'Maharashtra','Arun Joshi',       '9876500104','Husband'),
  (p[5], 'UH-2024-000005',v_hid,'Arjun Singh',     '1958-09-12','male',  'B-', '9876500005','arjun.s@email.com',  '90 Shivaji Marg',   'Nashik',   'Maharashtra','Kavita Singh',     '9876500105','Wife'),
  (p[6], 'UH-2024-000006',v_hid,'Kavita Reddy',    '1970-01-25','female','A-', '9876500006','kavita.r@email.com', '23 Banjara Hills',  'Hyderabad','Telangana',  'Suresh Reddy',    '9876500106','Husband'),
  (p[7], 'UH-2024-000007',v_hid,'Pradeep Nair',    '1983-06-14','male',  'O-', '9876500007','pradeep.n@email.com','67 Marine Drive',   'Mumbai',   'Maharashtra','Sujata Nair',      '9876500107','Wife'),
  (p[8], 'UH-2024-000008',v_hid,'Anita Verma',     '1990-12-03','female','B+', '9876500008','anita.v@email.com',  '45 Andheri West',   'Mumbai',   'Maharashtra','Vikram Verma',     '9876500108','Husband'),
  (p[9], 'UH-2024-000009',v_hid,'Suresh Verma',    '1955-04-18','male',  'AB-','9876500009','suresh.v@email.com', '12 Civil Lines',    'Nagpur',   'Maharashtra','Rekha Verma',      '9876500109','Wife'),
  (p[10],'UH-2024-000010',v_hid,'Rekha Gupta',     '1967-08-27','female','A+', '9876500010','rekha.g@email.com',  '89 Saket Nagar',    'Delhi',    'Delhi',      'Anil Gupta',      '9876500110','Husband'),
  (p[11],'UH-2024-000011',v_hid,'Vinod Mehta',     '1980-02-09','male',  'O+', '9876500011','vinod.m@email.com',  '34 Worli Sea Face', 'Mumbai',   'Maharashtra','Shobha Mehta',     '9876500111','Wife'),
  (p[12],'UH-2024-000012',v_hid,'Shobha Rao',      '1995-10-16','female','B+', '9876500012','shobha.r@email.com', '56 Koramangala',    'Bengaluru','Karnataka',  'Arun Rao',        '9876500112','Husband'),
  (p[13],'UH-2024-000013',v_hid,'Deepak Tiwari',   '1972-07-05','male',  'A+', '9876500013','deepak.t@email.com', '78 Hazratganj',     'Lucknow',  'UP',         'Suman Tiwari',    '9876500113','Wife'),
  (p[14],'UH-2024-000014',v_hid,'Lakshmi Iyer',    '1988-03-21','female','O+', '9876500014','lakshmi.i@email.com','23 T Nagar',        'Chennai',  'Tamil Nadu', 'Gopal Iyer',      '9876500114','Husband'),
  (p[15],'UH-2024-000015',v_hid,'Gopal Mishra',    '1960-11-30','male',  'AB+','9876500015','gopal.m@email.com',  '45 Civil Lines',    'Allahabad','UP',         'Uma Mishra',      '9876500115','Wife'),
  (p[16],'UH-2024-000016',v_hid,'Priya Saxena',    '1994-06-08','female','B-', '9876500016','priya.sx@email.com', '12 Gomti Nagar',    'Lucknow',  'UP',         'Rahul Saxena',    '9876500116','Husband'),
  (p[17],'UH-2024-000017',v_hid,'Rohit Bansal',    '1976-09-17','male',  'A-', '9876500017','rohit.b@email.com',  '67 Lajpat Nagar',   'Delhi',    'Delhi',      'Nisha Bansal',    '9876500117','Wife'),
  (p[18],'UH-2024-000018',v_hid,'Nisha Chaudhary', '1982-04-24','female','O-', '9876500018','nisha.c@email.com',  '34 Model Town',     'Ludhiana', 'Punjab',     'Ashok Chaudhary', '9876500118','Husband'),
  (p[19],'UH-2024-000019',v_hid,'Ashok Pillai',    '1969-12-11','male',  'B+', '9876500019','ashok.p@email.com',  '89 MG Road',        'Kochi',    'Kerala',     'Sheela Pillai',   '9876500119','Wife'),
  (p[20],'UH-2024-000020',v_hid,'Sheela Krishnan', '1991-08-06','female','A+', '9876500020','sheela.k@email.com', '23 Adyar',          'Chennai',  'Tamil Nadu', 'Rajan Krishnan',  '9876500120','Husband'),
  (p[21],'UH-2024-000021',v_hid,'Manoj Dubey',     '1963-05-19','male',  'O+', '9876500021','manoj.d@email.com',  '56 Napier Town',    'Jabalpur', 'MP',         'Savita Dubey',    '9876500121','Wife'),
  (p[22],'UH-2024-000022',v_hid,'Savita Bhatt',    '1987-01-28','female','AB+','9876500022','savita.b@email.com', '78 Navrangpura',    'Ahmedabad','Gujarat',    'Sunil Bhatt',     '9876500122','Husband'),
  (p[23],'UH-2024-000023',v_hid,'Kiran Kulkarni',  '1975-10-03','male',  'B+', '9876500023','kiran.k@email.com',  '12 Deccan Gymkhana','Pune',     'Maharashtra','Madhuri Kulkarni','9876500123','Wife'),
  (p[24],'UH-2024-000024',v_hid,'Madhuri Pawar',   '1996-07-14','female','A-', '9876500024','madhuri.p@email.com','34 Kalyani Nagar',  'Pune',     'Maharashtra','Ajay Pawar',      '9876500124','Husband'),
  (p[25],'UH-2024-000025',v_hid,'Ajay Thakur',     '1953-03-07','male',  'O-', '9876500025','ajay.t@email.com',   '67 Malviya Nagar',  'Bhopal',   'MP',         'Kamla Thakur',   '9876500125','Wife')
  ON CONFLICT (hospital_id,uhid) DO NOTHING;

  -- APPOINTMENTS
  INSERT INTO appointments (id,hospital_id,patient_id,doctor_id,appointment_date,
    appointment_time,slot_duration_minutes,type,status,token_number,chief_complaint,created_by)
  VALUES
  (a[1], v_hid,p[1], v_doctor_id,CURRENT_DATE,   '09:00',15,'opd','completed',  1,'Fever and body ache for 3 days',     v_recept_id),
  (a[2], v_hid,p[2], v_doctor_id,CURRENT_DATE,   '09:15',15,'opd','completed',  2,'Diabetes follow-up',                 v_recept_id),
  (a[3], v_hid,p[3], v_doctor_id,CURRENT_DATE,   '09:30',15,'opd','in_progress',3,'Chest pain and shortness of breath', v_recept_id),
  (a[4], v_hid,p[4], v_doctor_id,CURRENT_DATE,   '09:45',15,'opd','scheduled',  4,'Nausea and vomiting',                v_recept_id),
  (a[5], v_hid,p[5], v_doctor_id,CURRENT_DATE,   '10:00',15,'opd','scheduled',  5,'Hypertension review',                v_recept_id),
  (a[6], v_hid,p[6], v_doctor_id,CURRENT_DATE,   '10:15',15,'opd','scheduled',  6,'Skin rash and itching',              v_recept_id),
  (a[7], v_hid,p[7], v_doctor_id,CURRENT_DATE,   '10:30',15,'opd','scheduled',  7,'Joint pain - left knee',             v_recept_id),
  (a[8], v_hid,p[8], v_doctor_id,CURRENT_DATE,   '10:45',15,'opd','scheduled',  8,'Headache and dizziness',             v_recept_id),
  (a[9], v_hid,p[9], v_doctor_id,CURRENT_DATE-1, '09:00',15,'opd','completed',  1,'Cough and cold for 1 week',          v_recept_id),
  (a[10],v_hid,p[10],v_doctor_id,CURRENT_DATE-1, '09:15',15,'opd','completed',  2,'Lower back pain',                    v_recept_id),
  (a[11],v_hid,p[11],v_doctor_id,CURRENT_DATE-1, '09:30',15,'opd','completed',  3,'Thyroid follow-up',                  v_recept_id),
  (a[12],v_hid,p[12],v_doctor_id,CURRENT_DATE-1, '09:45',15,'opd','completed',  4,'Abdominal pain',                     v_recept_id),
  (a[13],v_hid,p[13],v_doctor_id,CURRENT_DATE-2, '10:00',15,'opd','completed',  1,'Urinary tract infection',            v_recept_id),
  (a[14],v_hid,p[14],v_doctor_id,CURRENT_DATE-2, '10:15',15,'opd','completed',  2,'Post-op follow-up',                  v_recept_id),
  (a[15],v_hid,p[15],v_doctor_id,CURRENT_DATE-2, '10:30',15,'opd','cancelled',  3,'Annual health check',                v_recept_id),
  (a[16],v_hid,p[16],v_doctor_id,CURRENT_DATE-3, '09:00',15,'opd','completed',  1,'Anaemia work-up',                    v_recept_id),
  (a[17],v_hid,p[17],v_doctor_id,CURRENT_DATE-3, '09:15',15,'opd','completed',  2,'Migraine evaluation',                v_recept_id),
  (a[18],v_hid,p[18],v_doctor_id,CURRENT_DATE-3, '09:30',15,'opd','completed',  3,'Diabetes new case',                  v_recept_id),
  (a[19],v_hid,p[19],v_doctor_id,CURRENT_DATE-4, '10:00',15,'opd','completed',  1,'Asthma exacerbation',                v_recept_id),
  (a[20],v_hid,p[20],v_doctor_id,CURRENT_DATE-4, '10:15',15,'opd','completed',  2,'Knee pain - osteoarthritis',         v_recept_id),
  (a[21],v_hid,p[21],v_doctor_id,CURRENT_DATE-5, '09:00',15,'opd','completed',  1,'GERD symptoms',                      v_recept_id),
  (a[22],v_hid,p[22],v_doctor_id,CURRENT_DATE-5, '09:15',15,'opd','completed',  2,'Polycystic ovary syndrome',          v_recept_id),
  (a[23],v_hid,p[23],v_doctor_id,CURRENT_DATE-6, '09:30',15,'opd','completed',  1,'Ear pain and discharge',             v_recept_id),
  (a[24],v_hid,p[24],v_doctor_id,CURRENT_DATE-6, '09:45',15,'opd','completed',  2,'Eye redness and watering',           v_recept_id),
  (a[25],v_hid,p[25],v_doctor_id,CURRENT_DATE-7, '10:00',15,'opd','completed',  1,'Constipation and bloating',          v_recept_id),
  (a[26],v_hid,p[1], v_doctor_id,CURRENT_DATE+1, '09:00',15,'opd','scheduled',  1,'Follow-up after fever treatment',    v_recept_id),
  (a[27],v_hid,p[5], v_doctor_id,CURRENT_DATE+1, '09:15',15,'opd','scheduled',  2,'BP monitoring follow-up',            v_recept_id),
  (a[28],v_hid,p[9], v_doctor_id,CURRENT_DATE+2, '10:00',15,'opd','scheduled',  1,'Respiratory review',                 v_recept_id),
  (a[29],v_hid,p[13],v_doctor_id,CURRENT_DATE+2, '10:15',15,'opd','scheduled',  2,'UTI follow-up urine culture',        v_recept_id),
  (a[30],v_hid,p[17],v_doctor_id,CURRENT_DATE+3, '09:30',15,'opd','scheduled',  1,'Neurology consultation',             v_recept_id)
  ON CONFLICT DO NOTHING;

  -- IPD ADMISSIONS
  SELECT id INTO v_bed FROM beds WHERE ward_id=w_gwa AND hospital_id=v_hid AND status='available' LIMIT 1;
  IF v_bed IS NOT NULL THEN
    INSERT INTO admissions (admission_number,hospital_id,patient_id,doctor_id,ward_id,bed_id,admission_date,admission_type,status,primary_diagnosis,created_by)
    VALUES ('ADM-2026-000001',v_hid,p[3],v_doctor_id,w_gwa,v_bed,CURRENT_DATE-2,'emergency','active','Acute Myocardial Infarction',v_doctor_id)
    ON CONFLICT (hospital_id,admission_number) DO NOTHING;
    UPDATE beds SET status='occupied' WHERE id=v_bed;
  END IF;

  SELECT id INTO v_bed FROM beds WHERE ward_id=w_gwa AND hospital_id=v_hid AND status='available' LIMIT 1;
  IF v_bed IS NOT NULL THEN
    INSERT INTO admissions (admission_number,hospital_id,patient_id,doctor_id,ward_id,bed_id,admission_date,admission_type,status,primary_diagnosis,created_by)
    VALUES ('ADM-2026-000002',v_hid,p[9],v_doctor_id,w_gwa,v_bed,CURRENT_DATE-5,'general','active','Severe COPD Exacerbation',v_doctor_id)
    ON CONFLICT (hospital_id,admission_number) DO NOTHING;
    UPDATE beds SET status='occupied' WHERE id=v_bed;
  END IF;

  SELECT id INTO v_bed FROM beds WHERE ward_id=w_gwb AND hospital_id=v_hid AND status='available' LIMIT 1;
  IF v_bed IS NOT NULL THEN
    INSERT INTO admissions (admission_number,hospital_id,patient_id,doctor_id,ward_id,bed_id,admission_date,admission_type,status,primary_diagnosis,created_by)
    VALUES ('ADM-2026-000003',v_hid,p[15],v_doctor_id,w_gwb,v_bed,CURRENT_DATE-3,'planned','active','Uncontrolled Type 2 Diabetes',v_doctor_id)
    ON CONFLICT (hospital_id,admission_number) DO NOTHING;
    UPDATE beds SET status='occupied' WHERE id=v_bed;
  END IF;

  SELECT id INTO v_bed FROM beds WHERE ward_id=w_pvt AND hospital_id=v_hid AND status='available' LIMIT 1;
  IF v_bed IS NOT NULL THEN
    INSERT INTO admissions (admission_number,hospital_id,patient_id,doctor_id,ward_id,bed_id,admission_date,admission_type,status,primary_diagnosis,created_by)
    VALUES ('ADM-2026-000004',v_hid,p[22],v_doctor_id,w_pvt,v_bed,CURRENT_DATE-1,'planned','active','Laparoscopic Cholecystectomy Post-op',v_doctor_id)
    ON CONFLICT (hospital_id,admission_number) DO NOTHING;
    UPDATE beds SET status='occupied' WHERE id=v_bed;
  END IF;

  SELECT id INTO v_bed FROM beds WHERE ward_id=w_icu AND hospital_id=v_hid AND status='available' LIMIT 1;
  IF v_bed IS NOT NULL THEN
    INSERT INTO admissions (admission_number,hospital_id,patient_id,doctor_id,ward_id,bed_id,admission_date,admission_type,status,primary_diagnosis,created_by)
    VALUES ('ADM-2026-000005',v_hid,p[5],v_doctor_id,w_icu,v_bed,CURRENT_DATE-1,'emergency','active','Hypertensive Crisis with Encephalopathy',v_doctor_id)
    ON CONFLICT (hospital_id,admission_number) DO NOTHING;
    UPDATE beds SET status='occupied' WHERE id=v_bed;
  END IF;

  SELECT id INTO v_bed FROM beds WHERE ward_id=w_gwb AND hospital_id=v_hid AND status='available' LIMIT 1;
  IF v_bed IS NOT NULL THEN
    INSERT INTO admissions (admission_number,hospital_id,patient_id,doctor_id,ward_id,bed_id,admission_date,discharge_date,admission_type,status,primary_diagnosis,discharge_summary,created_by)
    VALUES ('ADM-2026-000006',v_hid,p[1],v_doctor_id,w_gwb,v_bed,CURRENT_DATE-10,CURRENT_DATE-7,'emergency','discharged','Viral Fever with Dehydration','Patient recovered. Discharged on oral antibiotics. Follow-up in 7 days.',v_doctor_id)
    ON CONFLICT (hospital_id,admission_number) DO NOTHING;
  END IF;

  -- BILLS (balance_due is a generated column — omit it)
  INSERT INTO bills (bill_number,hospital_id,patient_id,appointment_id,bill_date,
    bill_type,subtotal,discount_amount,tax_amount,total_amount,paid_amount,
    payment_mode,status,created_by)
  VALUES
  ('BILL-2026-000001',v_hid,p[1], a[1], CURRENT_DATE,   'opd', 800,   0,  0,  800,  800, 'cash','paid',   v_recept_id),
  ('BILL-2026-000002',v_hid,p[2], a[2], CURRENT_DATE,   'opd', 600,  50,  0,  550,  550, 'upi', 'paid',   v_recept_id),
  ('BILL-2026-000003',v_hid,p[9], a[9], CURRENT_DATE-1, 'opd', 750,   0,  0,  750,  750, 'card','paid',   v_recept_id),
  ('BILL-2026-000004',v_hid,p[10],a[10],CURRENT_DATE-1, 'opd', 900, 100,  0,  800,  500, 'cash','partial',v_recept_id),
  ('BILL-2026-000005',v_hid,p[11],a[11],CURRENT_DATE-1, 'opd',1200,   0, 60, 1260, 1260, 'upi', 'paid',   v_recept_id),
  ('BILL-2026-000006',v_hid,p[12],a[12],CURRENT_DATE-1, 'opd', 850,   0,  0,  850,    0, 'cash','pending',v_recept_id),
  ('BILL-2026-000007',v_hid,p[13],a[13],CURRENT_DATE-2, 'opd', 700,   0,  0,  700,  700, 'cash','paid',   v_recept_id),
  ('BILL-2026-000008',v_hid,p[14],a[14],CURRENT_DATE-2, 'opd',1500,   0, 75, 1575, 1575, 'card','paid',   v_recept_id),
  ('BILL-2026-000009',v_hid,p[3], NULL, CURRENT_DATE-2, 'ipd',25000,  0,  0,25000,10000, 'cash','partial',v_recept_id),
  ('BILL-2026-000010',v_hid,p[1], NULL, CURRENT_DATE-7, 'ipd',18000,  0,  0,18000,18000, 'upi', 'paid',   v_recept_id),
  ('BILL-2026-000011',v_hid,p[22],NULL, CURRENT_DATE-1, 'ipd',35000,2000, 0,33000,20000, 'card','partial',v_recept_id),
  ('BILL-2026-000012',v_hid,p[16],a[16],CURRENT_DATE-3, 'opd', 950,   0,  0,  950,  950, 'cash','paid',   v_recept_id)
  ON CONFLICT DO NOTHING;

  -- PRESCRIPTIONS
  INSERT INTO prescriptions (prescription_number,hospital_id,patient_id,doctor_id,
    appointment_id,prescription_date,diagnosis,notes,status)
  VALUES
  ('RX-2026-000001',v_hid,p[1], v_doctor_id,a[1], CURRENT_DATE,   'Viral Fever',             'Take plenty of fluids. Rest 3 days.','active'),
  ('RX-2026-000002',v_hid,p[2], v_doctor_id,a[2], CURRENT_DATE,   'Type 2 Diabetes Mellitus','Continue regimen. Review HbA1c in 3 months.','active'),
  ('RX-2026-000003',v_hid,p[9], v_doctor_id,a[9], CURRENT_DATE-1, 'COPD',                    'Nebulization 3x/day. Steroid taper.','active'),
  ('RX-2026-000004',v_hid,p[10],v_doctor_id,a[10],CURRENT_DATE-1, 'Lumbar Spondylosis',      'Physiotherapy advised. Hot fomentation.','active'),
  ('RX-2026-000005',v_hid,p[13],v_doctor_id,a[13],CURRENT_DATE-2, 'Urinary Tract Infection', 'Complete full antibiotic course.','active'),
  ('RX-2026-000006',v_hid,p[16],v_doctor_id,a[16],CURRENT_DATE-3, 'Iron Deficiency Anaemia', 'Iron-rich diet. Supplement for 3 months.','active'),
  ('RX-2026-000007',v_hid,p[17],v_doctor_id,a[17],CURRENT_DATE-3, 'Migraine',                'Avoid triggers. Sleep hygiene counseling.','active'),
  ('RX-2026-000008',v_hid,p[19],v_doctor_id,a[19],CURRENT_DATE-4, 'Bronchial Asthma',        'Use rescue inhaler when needed.','active')
  ON CONFLICT DO NOTHING;

  -- STAFF
  INSERT INTO staff (id,hospital_id,employee_id,first_name,last_name,email,phone,
    date_of_birth,gender,designation,department,date_of_joining,employment_type,salary,status)
  VALUES
  (s[1], v_hid,'EMP-001','Rajesh','Kumar', 'r.kumar@hospital.com', '9900000001','1975-04-10','Male',  'Chief Medical Officer',  'Administration',  '2015-01-01','full_time',250000,'active'),
  (s[2], v_hid,'EMP-002','Priya', 'Sharma','p.sharma@hospital.com','9900000002','1982-08-22','Female','Senior Consultant',       'General Medicine','2018-03-15','full_time',180000,'active'),
  (s[3], v_hid,'EMP-003','Anita', 'Desai', 'a.desai@hospital.com', '9900000003','1990-01-05','Female','Senior Staff Nurse',      'General Medicine','2019-06-01','full_time', 55000,'active'),
  (s[4], v_hid,'EMP-004','Suresh','Patel', 's.patel@hospital.com', '9900000004','1988-11-30','Male',  'Front Desk Receptionist', 'Administration',  '2020-02-10','full_time', 35000,'active'),
  (s[5], v_hid,'EMP-005','Vikram','Joshi', 'v.joshi@hospital.com', '9900000005','1979-07-18','Male',  'Consultant Surgeon',      'Surgery',         '2016-09-20','full_time',200000,'active'),
  (s[6], v_hid,'EMP-006','Meena', 'Singh', 'm.singh@hospital.com', '9900000006','1985-03-25','Female','Radiologist',             'Radiology',       '2017-11-05','full_time',160000,'active'),
  (s[7], v_hid,'EMP-007','Arun',  'Nair',  'a.nair@hospital.com',  '9900000007','1992-09-12','Male',  'Junior Resident',         'Pediatrics',      '2022-07-01','full_time', 80000,'active'),
  (s[8], v_hid,'EMP-008','Pooja', 'Reddy', 'p.reddy@hospital.com', '9900000008','1994-05-08','Female','Staff Nurse',             'ICU',             '2021-03-20','full_time', 48000,'active'),
  (s[9], v_hid,'EMP-009','Rajan', 'Gupta', 'r.gupta@hospital.com', '9900000009','1987-12-15','Male',  'Medical Lab Technician',  'Pathology & Lab', '2019-08-12','full_time', 45000,'active'),
  (s[10],v_hid,'EMP-010','Kavya', 'Menon', 'k.menon@hospital.com', '9900000010','1991-02-28','Female','Pharmacist',              'Pharmacy',        '2020-10-01','full_time', 52000,'active')
  ON CONFLICT (employee_id) DO NOTHING;

  -- ATTENDANCE
  INSERT INTO attendance (staff_id,date,status)
  SELECT sid, d::date, 'present'
  FROM unnest(s) AS sid,
       generate_series(CURRENT_DATE-4, CURRENT_DATE, '1 day'::interval) AS d
  ON CONFLICT (staff_id,date) DO NOTHING;

  UPDATE attendance SET status='absent'   WHERE staff_id=s[7] AND date=CURRENT_DATE-2;
  UPDATE attendance SET status='half_day' WHERE staff_id=s[8] AND date=CURRENT_DATE-1;

  -- LEAVE REQUESTS (approved_by references profiles.id)
  INSERT INTO leave_requests (staff_id,leave_type,from_date,to_date,total_days,reason,status,approved_by)
  VALUES
  (s[7],'Sick Leave',  CURRENT_DATE+3, CURRENT_DATE+5, 3,'Medical procedure planned','pending', NULL),
  (s[3],'Casual Leave',CURRENT_DATE+7, CURRENT_DATE+8, 2,'Family function',           'approved',v_admin_id),
  (s[8],'Earned Leave',CURRENT_DATE+14,CURRENT_DATE+18,5,'Annual vacation',           'pending', NULL)
  ON CONFLICT DO NOTHING;

END $$;
