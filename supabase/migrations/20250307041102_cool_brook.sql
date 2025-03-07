/*
  # Add task validation constraints

  1. Changes
    - Add NOT NULL constraints for required fields
    - Set default values for optional fields
    - Add CHECK constraints for data validation
    - Add trigger for updated_at timestamp
  
  2. Security
    - Maintain existing RLS policies
*/

-- Set default values first
ALTER TABLE tasks
  ALTER COLUMN completed SET DEFAULT false,
  ALTER COLUMN tags SET DEFAULT '{}',
  ALTER COLUMN parent_ids SET DEFAULT '{}',
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- Then set NOT NULL constraints
ALTER TABLE tasks
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN priority SET NOT NULL,
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN completed SET NOT NULL,
  ALTER COLUMN tags SET NOT NULL,
  ALTER COLUMN parent_ids SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

-- Add check constraint for priority values if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_priority'
  ) THEN
    ALTER TABLE tasks
      ADD CONSTRAINT valid_priority 
      CHECK (priority IN ('low', 'medium', 'high'));
  END IF;
END $$;

-- Create function for updating updated_at timestamp if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_tasks_updated_at'
  ) THEN
    CREATE TRIGGER update_tasks_updated_at
      BEFORE UPDATE ON tasks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;