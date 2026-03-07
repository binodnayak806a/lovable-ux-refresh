/*
  # Add Missing usage_count Column to Medications
  
  1. Schema Changes
    - Add usage_count column to medications table
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medications' AND column_name = 'usage_count'
  ) THEN
    ALTER TABLE medications ADD COLUMN usage_count integer DEFAULT 0;
  END IF;
END $$;