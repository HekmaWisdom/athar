-- Client-side E2E encryption for journal entries (AES-256-GCM), matching what the
-- original design (legacy Flutter/Fastify plan) specified but the Supabase rebuild
-- had dropped — journal_entries.content was plain text with no encryption at all.
-- Table is empty (0 rows) at migration time, so no data migration needed.

ALTER TABLE public.journal_entries RENAME COLUMN content TO ciphertext;
ALTER TABLE public.journal_entries ADD COLUMN iv text NOT NULL;

COMMENT ON COLUMN public.journal_entries.ciphertext IS
  'Base64 AES-256-GCM ciphertext, encrypted client-side. Server never sees plaintext.';
COMMENT ON COLUMN public.journal_entries.iv IS
  'Base64 12-byte IV, unique per entry. Not secret — required to decrypt.';

-- Per-user salt for deriving the journal encryption key from their passphrase (PBKDF2).
-- Not secret (salts never are) — safe to store server-side, just needs to be consistent
-- across sessions/devices so the same passphrase always derives the same key.
ALTER TABLE public.profiles ADD COLUMN journal_salt text;
