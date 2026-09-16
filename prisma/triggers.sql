-- HWC immutability triggers
--
-- Spec section 14: "No edit / delete / re-order / undo function should be
-- available in V1. The database should enforce this rather than relying
-- solely on the UI." Section 33 extends this to completed races and
-- completed championships.
--
-- Run this once after your first `prisma migrate deploy` (see README):
--   npm run db:triggers
--
-- These triggers run underneath Prisma. Prisma's own generated queries
-- never try to update/delete a race_results row or a completed race, so in
-- normal operation you will never see these errors — they exist as a
-- backstop against bugs, a stray manual UPDATE, or a compromised app
-- server.

-- 1. race_results is fully append-only. No UPDATE, no DELETE, ever.
CREATE OR REPLACE FUNCTION hwc_block_result_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'race_results is immutable: results cannot be edited or deleted once submitted (HWC spec section 14)';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hwc_no_result_update ON race_results;
CREATE TRIGGER hwc_no_result_update
  BEFORE UPDATE ON race_results
  FOR EACH ROW EXECUTE FUNCTION hwc_block_result_mutation();

DROP TRIGGER IF EXISTS hwc_no_result_delete ON race_results;
CREATE TRIGGER hwc_no_result_delete
  BEFORE DELETE ON race_results
  FOR EACH ROW EXECUTE FUNCTION hwc_block_result_mutation();

-- 2. A race that is already COMPLETED cannot be changed further. Note this
-- checks OLD.status, so the single UPDATE that transitions a race from
-- OPEN -> COMPLETED is still allowed; only rows that were *already*
-- COMPLETED are frozen.
CREATE OR REPLACE FUNCTION hwc_block_completed_race_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'COMPLETED' THEN
    RAISE EXCEPTION 'races is immutable once COMPLETED (HWC spec section 33)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hwc_no_completed_race_update ON races;
CREATE TRIGGER hwc_no_completed_race_update
  BEFORE UPDATE ON races
  FOR EACH ROW EXECUTE FUNCTION hwc_block_completed_race_mutation();

DROP TRIGGER IF EXISTS hwc_no_completed_race_delete ON races;
CREATE TRIGGER hwc_no_completed_race_delete
  BEFORE DELETE ON races
  FOR EACH ROW EXECUTE FUNCTION hwc_block_completed_race_mutation();

-- 3. Same rule for championships once COMPLETED.
CREATE OR REPLACE FUNCTION hwc_block_completed_championship_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'COMPLETED' THEN
    RAISE EXCEPTION 'championships is immutable once COMPLETED (HWC spec section 33)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hwc_no_completed_championship_update ON championships;
CREATE TRIGGER hwc_no_completed_championship_update
  BEFORE UPDATE ON championships
  FOR EACH ROW EXECUTE FUNCTION hwc_block_completed_championship_mutation();

DROP TRIGGER IF EXISTS hwc_no_completed_championship_delete ON championships;
CREATE TRIGGER hwc_no_completed_championship_delete
  BEFORE DELETE ON championships
  FOR EACH ROW EXECUTE FUNCTION hwc_block_completed_championship_mutation();
