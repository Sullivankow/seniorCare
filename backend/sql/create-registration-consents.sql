-- À exécuter une fois sur une base existante lorsque DB_SYNCHRONIZE=false.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "termsAcceptedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "termsVersion" varchar(32),
  ADD COLUMN IF NOT EXISTS "privacyPolicyAcceptedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "privacyPolicyVersion" varchar(32);