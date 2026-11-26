-- À exécuter une fois si DB_SYNCHRONIZE=false.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "profilePhotoKey" varchar(255),
  ADD COLUMN IF NOT EXISTS "profilePhotoMimeType" varchar(50),
  ADD COLUMN IF NOT EXISTS "profilePhotoUpdatedAt" timestamptz;