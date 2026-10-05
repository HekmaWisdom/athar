-- Editorial content fields (curated explanation/modern-context/action/journal-prompt)
-- so ExplainSheet can prefer human-written content over live AI generation.
-- Matches shared/content/packs/pack-001-launch-sample.json's translation shape.
ALTER TABLE public.quotes
  ADD COLUMN explanation_ar text,
  ADD COLUMN explanation_en text,
  ADD COLUMN modern_context_ar text,
  ADD COLUMN modern_context_en text,
  ADD COLUMN action_step_ar text,
  ADD COLUMN action_step_en text,
  ADD COLUMN journal_prompt_ar text,
  ADD COLUMN journal_prompt_en text,
  ADD COLUMN is_premium_explanation boolean NOT NULL DEFAULT false;
