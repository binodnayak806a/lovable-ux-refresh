/*
  # Add Description Columns and Seed Symptoms/Diagnoses

  ## Summary
  1. Adds description column to symptoms and diagnoses tables
  2. Seeds 60+ symptoms categorized by medical specialty
  3. Seeds 50+ ICD-10 coded diagnoses

  ## Notes
  - Uses ON CONFLICT DO NOTHING to prevent duplicate errors
*/

-- Add description columns if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'symptoms' AND column_name = 'description'
  ) THEN
    ALTER TABLE symptoms ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'diagnoses' AND column_name = 'description'
  ) THEN
    ALTER TABLE diagnoses ADD COLUMN description text;
  END IF;
END $$;

-- SYMPTOMS SEED
INSERT INTO symptoms (name, category, usage_count) VALUES
  -- General
  ('Fever', 'General', 100),
  ('Fatigue', 'General', 95),
  ('Weakness', 'General', 90),
  ('Weight Loss', 'General', 50),
  ('Weight Gain', 'General', 40),
  ('Night Sweats', 'General', 35),
  ('Loss of Appetite', 'General', 60),
  ('Chills', 'General', 55),
  ('Malaise', 'General', 45),

  -- Respiratory
  ('Cough', 'Respiratory', 98),
  ('Shortness of Breath', 'Respiratory', 85),
  ('Wheezing', 'Respiratory', 60),
  ('Chest Tightness', 'Respiratory', 55),
  ('Sputum Production', 'Respiratory', 50),
  ('Hemoptysis', 'Respiratory', 20),
  ('Runny Nose', 'Respiratory', 75),
  ('Nasal Congestion', 'Respiratory', 80),
  ('Sneezing', 'Respiratory', 70),
  ('Sore Throat', 'Respiratory', 85),

  -- Cardiovascular
  ('Chest Pain', 'Cardiovascular', 70),
  ('Palpitations', 'Cardiovascular', 55),
  ('Edema', 'Cardiovascular', 45),
  ('Syncope', 'Cardiovascular', 25),
  ('Dizziness', 'Cardiovascular', 65),
  ('Leg Swelling', 'Cardiovascular', 40),

  -- Gastrointestinal
  ('Abdominal Pain', 'Gastrointestinal', 80),
  ('Nausea', 'Gastrointestinal', 75),
  ('Vomiting', 'Gastrointestinal', 65),
  ('Diarrhea', 'Gastrointestinal', 70),
  ('Constipation', 'Gastrointestinal', 55),
  ('Bloating', 'Gastrointestinal', 50),
  ('Heartburn', 'Gastrointestinal', 45),
  ('Dysphagia', 'Gastrointestinal', 30),
  ('Blood in Stool', 'Gastrointestinal', 25),
  ('Indigestion', 'Gastrointestinal', 48),

  -- Neurological
  ('Headache', 'Neurological', 95),
  ('Migraine', 'Neurological', 50),
  ('Numbness', 'Neurological', 40),
  ('Tingling', 'Neurological', 35),
  ('Tremors', 'Neurological', 25),
  ('Seizures', 'Neurological', 15),
  ('Memory Loss', 'Neurological', 20),
  ('Confusion', 'Neurological', 30),
  ('Visual Disturbances', 'Neurological', 35),

  -- Musculoskeletal
  ('Joint Pain', 'Musculoskeletal', 75),
  ('Back Pain', 'Musculoskeletal', 85),
  ('Neck Pain', 'Musculoskeletal', 60),
  ('Muscle Pain', 'Musculoskeletal', 55),
  ('Joint Stiffness', 'Musculoskeletal', 45),
  ('Swelling of Joints', 'Musculoskeletal', 40),
  ('Limited Mobility', 'Musculoskeletal', 35),

  -- Dermatological
  ('Rash', 'Dermatological', 55),
  ('Itching', 'Dermatological', 60),
  ('Skin Lesions', 'Dermatological', 35),
  ('Dry Skin', 'Dermatological', 40),
  ('Hair Loss', 'Dermatological', 25),
  ('Bruising', 'Dermatological', 30),

  -- ENT
  ('Ear Pain', 'ENT', 50),
  ('Hearing Loss', 'ENT', 30),
  ('Tinnitus', 'ENT', 25),
  ('Hoarseness', 'ENT', 35),
  ('Difficulty Swallowing', 'ENT', 30),

  -- Urogenital
  ('Urinary Frequency', 'Urogenital', 45),
  ('Painful Urination', 'Urogenital', 40),
  ('Blood in Urine', 'Urogenital', 25),
  ('Urinary Incontinence', 'Urogenital', 20),
  ('Flank Pain', 'Urogenital', 30),

  -- Psychological
  ('Anxiety', 'Psychological', 55),
  ('Depression', 'Psychological', 45),
  ('Insomnia', 'Psychological', 50),
  ('Mood Swings', 'Psychological', 30),
  ('Panic Attacks', 'Psychological', 25)

ON CONFLICT DO NOTHING;

-- DIAGNOSES SEED (ICD-10 coded)
INSERT INTO diagnoses (name, icd10_code, category) VALUES
  -- Infectious Diseases
  ('Acute Upper Respiratory Infection', 'J06.9', 'Infectious'),
  ('Acute Bronchitis', 'J20.9', 'Infectious'),
  ('Pneumonia', 'J18.9', 'Infectious'),
  ('Urinary Tract Infection', 'N39.0', 'Infectious'),
  ('Gastroenteritis', 'A09', 'Infectious'),
  ('Dengue Fever', 'A90', 'Infectious'),
  ('Malaria', 'B54', 'Infectious'),
  ('Typhoid Fever', 'A01.0', 'Infectious'),
  ('COVID-19', 'U07.1', 'Infectious'),
  ('Influenza', 'J11.1', 'Infectious'),

  -- Cardiovascular
  ('Essential Hypertension', 'I10', 'Cardiovascular'),
  ('Ischemic Heart Disease', 'I25.9', 'Cardiovascular'),
  ('Atrial Fibrillation', 'I48.91', 'Cardiovascular'),
  ('Heart Failure', 'I50.9', 'Cardiovascular'),
  ('Angina Pectoris', 'I20.9', 'Cardiovascular'),

  -- Respiratory
  ('Asthma', 'J45.909', 'Respiratory'),
  ('COPD', 'J44.9', 'Respiratory'),
  ('Allergic Rhinitis', 'J30.9', 'Respiratory'),
  ('Sinusitis', 'J32.9', 'Respiratory'),
  ('Pharyngitis', 'J02.9', 'Respiratory'),
  ('Tonsillitis', 'J03.90', 'Respiratory'),

  -- Endocrine/Metabolic
  ('Type 2 Diabetes Mellitus', 'E11.9', 'Endocrine'),
  ('Type 1 Diabetes Mellitus', 'E10.9', 'Endocrine'),
  ('Hypothyroidism', 'E03.9', 'Endocrine'),
  ('Hyperthyroidism', 'E05.90', 'Endocrine'),
  ('Obesity', 'E66.9', 'Endocrine'),
  ('Hyperlipidemia', 'E78.5', 'Endocrine'),

  -- Gastrointestinal
  ('Gastritis', 'K29.70', 'Gastrointestinal'),
  ('GERD', 'K21.0', 'Gastrointestinal'),
  ('Peptic Ulcer', 'K27.9', 'Gastrointestinal'),
  ('Irritable Bowel Syndrome', 'K58.9', 'Gastrointestinal'),
  ('Acute Appendicitis', 'K35.80', 'Gastrointestinal'),
  ('Hepatitis', 'K75.9', 'Gastrointestinal'),
  ('Fatty Liver Disease', 'K76.0', 'Gastrointestinal'),

  -- Musculoskeletal
  ('Osteoarthritis', 'M19.90', 'Musculoskeletal'),
  ('Rheumatoid Arthritis', 'M06.9', 'Musculoskeletal'),
  ('Lower Back Pain', 'M54.5', 'Musculoskeletal'),
  ('Cervical Spondylosis', 'M47.812', 'Musculoskeletal'),
  ('Frozen Shoulder', 'M75.00', 'Musculoskeletal'),
  ('Gout', 'M10.9', 'Musculoskeletal'),

  -- Neurological
  ('Migraine Disorder', 'G43.909', 'Neurological'),
  ('Tension Headache', 'G44.209', 'Neurological'),
  ('Epilepsy', 'G40.909', 'Neurological'),
  ('Vertigo', 'R42', 'Neurological'),
  ('Peripheral Neuropathy', 'G62.9', 'Neurological'),

  -- Dermatological
  ('Eczema', 'L30.9', 'Dermatological'),
  ('Psoriasis', 'L40.9', 'Dermatological'),
  ('Acne Vulgaris', 'L70.0', 'Dermatological'),
  ('Fungal Skin Infection', 'B36.9', 'Dermatological'),
  ('Urticaria', 'L50.9', 'Dermatological'),

  -- Psychiatric
  ('Major Depressive Disorder', 'F32.9', 'Psychiatric'),
  ('Generalized Anxiety Disorder', 'F41.1', 'Psychiatric'),
  ('Panic Disorder', 'F41.0', 'Psychiatric'),
  ('Insomnia Disorder', 'G47.00', 'Psychiatric'),

  -- Renal
  ('Chronic Kidney Disease', 'N18.9', 'Renal'),
  ('Acute Kidney Injury', 'N17.9', 'Renal'),
  ('Kidney Stones', 'N20.0', 'Renal'),

  -- Ophthalmology
  ('Conjunctivitis', 'H10.9', 'Ophthalmology'),
  ('Cataract', 'H26.9', 'Ophthalmology'),
  ('Glaucoma', 'H40.9', 'Ophthalmology'),

  -- Anemia
  ('Iron Deficiency Anemia', 'D50.9', 'Hematology'),
  ('Vitamin B12 Deficiency', 'E53.8', 'Hematology')

ON CONFLICT DO NOTHING;
