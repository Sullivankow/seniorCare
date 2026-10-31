-- À exécuter une fois si DB_SYNCHRONIZE=false.
CREATE TABLE IF NOT EXISTS voice_messages (
  id uuid PRIMARY KEY,
  "seniorId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "storageKey" varchar(255) NOT NULL UNIQUE,
  "mimeType" varchar(50) NOT NULL,
  "durationSeconds" integer NOT NULL CHECK ("durationSeconds" BETWEEN 1 AND 60),
  "fileSizeBytes" integer NOT NULL CHECK ("fileSizeBytes" BETWEEN 1 AND 5242880),
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "IDX_voice_messages_senior_created_at"
  ON voice_messages ("seniorId", "createdAt");