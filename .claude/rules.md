# Project Rules: Supabase SQL Single Source of Truth

## Scope
All Claude Code generations that touch database schema, functions, triggers, RLS, seeds, or migrations for Supabase.

## Mandatory Guidelines

1. **Use `schemas.sql` at the repository root as the canonical schema reference.**
2. **When proposing DB changes, update `schemas.sql` in the same change.** Do not create divergent SQL elsewhere.
3. **Prefer editing/expanding `schemas.sql`** instead of scattering SQL across multiple files.
4. **For new features requiring DB work:**
   - First, encode the schema in `schemas.sql` (tables, columns, indexes, FKs, functions, triggers, RLS)
   - Then reference those objects from application code
5. **If you must add a migration or ad-hoc SQL snippet,** derive it from `schemas.sql` and reconcile back.
6. **Always cross-check existing names/types in `schemas.sql`** before introducing new ones.
7. **Add brief comments in `schemas.sql`** for nontrivial logic to explain intent and assumptions.

## Conventions
- Use `snake_case` identifiers
- Timestamps as `timestamp with time zone`
- Triggers and functions appear after table definitions
- Explicit `ON DELETE`/`ON UPDATE` actions for foreign keys

## Assistant Behavior
- Open and update `schemas.sql` when asked to modify DB schema
- When generating code that depends on schema, cite exact definitions from `schemas.sql` and keep names/types consistent
- If `schemas.sql` conflicts with existing code, align code to the schema and flag the discrepancy in the PR/response