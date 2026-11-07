-- À exécuter une fois si DB_SYNCHRONIZE=false.
CREATE TABLE IF NOT EXISTS family_photos (
  id uuid PRIMARY KEY,
  "seniorId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "uploadedByFamilyId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "senderName" varchar(120) NOT NULL,
  "storageKey" varchar(255) NOT NULL UNIQUE,
  "mimeType" varchar(50) NOT NULL,
  "fileSizeBytes" integer NOT NULL CHECK ("fileSizeBytes" BETWEEN 1 AND 12582912),
  caption varchar(500),
  "memoryDate" date,
  "surpriseDate" date,
  "likedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "IDX_family_photos_senior_created_at"
  ON family_photos ("seniorId", "createdAt");

CREATE INDEX IF NOT EXISTS "IDX_family_photos_senior_surprise_date"
  ON family_photos ("seniorId", "surpriseDate");