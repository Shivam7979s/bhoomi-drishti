-- Phase 11: Link Land Records to User Accounts
-- Adds optional user_id reference so real authenticated users only see their own linked records,
-- while demo users see their dedicated showcase records, and unassigned records remain public cadastre.

ALTER TABLE land_records
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES app_user(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_land_records_user_id ON land_records(user_id);

-- Link the 4 demo parcels explicitly to the seeded citizen demo account (Ramesh Patel)
UPDATE land_records
SET user_id = 'c1712e00-0000-4000-a000-000000000001'
WHERE owner_name = 'Ramesh Patel'
  AND user_id IS NULL;

