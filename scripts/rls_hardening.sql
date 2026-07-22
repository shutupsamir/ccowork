-- ============================================================================
-- rls_hardening.sql — ccowork schema RLS defense-in-depth. LOCKDOWN-ONLY.
-- Applied: 2026-07-22 (cross-project data-security sweep; companion to
-- printbliss-platform supabase/migrations/634_rls_security_lockdown.sql).
-- Idempotent — safe to re-run.
--
-- Context: ccowork's Prisma tables live in the dedicated `ccowork` schema of
-- Supabase project mnrefdbvrdaxftlolepd. As of 2026-07-22 the schema is NOT
-- reachable anonymously: it is not in PostgREST's exposed schemas (live probe
-- returned PGRST106 "Only the following schemas are exposed: public,
-- graphql_public") and carries zero grants to anon/authenticated/public
-- (schema ACL grantees = {postgres} only). RLS was nonetheless DISABLED on
-- all 9 tables, so a single future GRANT or exposed-schema config change
-- would have made every table world-readable.
--
-- This enables RLS on all ccowork tables with NO policies = deny-all for any
-- non-owner role. The ccowork app is unaffected: Prisma connects as
-- `postgres` (pooler user postgres.mnrefdbvrdaxftlolepd), which OWNS these
-- tables, and table owners bypass RLS unless FORCE ROW LEVEL SECURITY is set
-- (it is not, deliberately).
--
-- NOT stored in prisma/migrations/ — a hand-applied SQL folder there would
-- desync `prisma migrate` history checksums. Prisma does not model RLS, so
-- no schema drift is introduced. Apply with:
--   node -e "...pg client..." < scripts/rls_hardening.sql   (or via psql)
-- ============================================================================

BEGIN;

ALTER TABLE ccowork."Agent"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccowork."AgentApiKey"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccowork."MatchRequest"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccowork."Session"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccowork."SessionMessage"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccowork."SessionParticipant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccowork."User"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccowork."UserBlocklist"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccowork."VideoRoom"          ENABLE ROW LEVEL SECURITY;

COMMIT;
