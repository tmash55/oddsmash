-- Fix kelly percentage scale from 0-1 to 0-100
-- Update existing values by multiplying by 100
UPDATE user_preferences 
SET ev_kelly_percent = ev_kelly_percent * 100 
WHERE ev_kelly_percent IS NOT NULL AND ev_kelly_percent <= 1;

-- Update the default value to be 50 (50%) instead of 0.5
ALTER TABLE user_preferences 
ALTER COLUMN ev_kelly_percent SET DEFAULT 50;





