-- À exécuter une fois sur la base seniorcare pour activer le répertoire personnel.
CREATE TABLE IF NOT EXISTS senior_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "seniorId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "fullName" varchar(100) NOT NULL,
  phone varchar(30) NOT NULL,
  email varchar(255),
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "IDX_senior_contacts_senior_id"
  ON senior_contacts ("seniorId");