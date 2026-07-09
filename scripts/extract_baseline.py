import re
from pathlib import Path

src = Path('scripts/remote_schema.sql')
out = Path('supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql')

text = src.read_text(encoding='utf-8')


def extract_create_tables():
    blocks = []
    i = 0
    while True:
        start = text.find('CREATE TABLE IF NOT EXISTS "public".', i)
        if start == -1:
            break
        paren_depth = 0
        found_open = False
        end = start
        while end < len(text):
            if text[end] == '(':
                paren_depth += 1
                found_open = True
            elif text[end] == ')':
                paren_depth -= 1
                if found_open and paren_depth == 0:
                    semi = text.find(';', end)
                    if semi != -1:
                        block_end = semi + 1
                        blocks.append(text[start:block_end])
                        i = block_end
                        break
            end += 1
        else:
            break
    return blocks


def extract_primary_constraints():
    pattern = r'ALTER TABLE ONLY "public"\."([^"]+)"\s+ADD CONSTRAINT "([^"]+)" (PRIMARY KEY|UNIQUE)[^;]+;'
    return [m.group(0) for m in re.finditer(pattern, text, re.DOTALL)]


def extract_indexes():
    pattern = r'CREATE INDEX IF NOT EXISTS "([^"]+)" ON "public"\."([^"]+)"[^;]+;'
    return [m.group(0) for m in re.finditer(pattern, text, re.DOTALL)]


def extract_rls():
    pattern = r'ALTER TABLE "public"\."([^"]+)" ENABLE ROW LEVEL SECURITY;'
    return [m.group(0) for m in re.finditer(pattern, text)]


def extract_routines():
    # Extract CREATE OR REPLACE FUNCTION / PROCEDURE blocks.
    pattern = r'(CREATE OR REPLACE (FUNCTION|PROCEDURE) "public"\."([^"]+)"[\s\S]*?AS \$\$[\s\S]*?\$\$;)'
    return [m.group(1) for m in re.finditer(pattern, text)]


def extract_grants():
    # Include only schema and table grants in the baseline. Function/procedure grants are
    # handled by the migration track that creates those routines. This avoids referencing
    # routines that may not exist in the baseline dump.
    pattern = r'GRANT (USAGE|ALL|SELECT|INSERT|UPDATE|DELETE)[^;]+;'
    grants = []
    for m in re.finditer(pattern, text):
        stmt = m.group(0)
        # Keep only public schema and public table grants.
        if 'ON SCHEMA "public"' in stmt or 'ON TABLE "public".' in stmt or 'ON TABLE public.' in stmt:
            grants.append(stmt)
    return grants


create_tables = extract_create_tables()
constraints = extract_primary_constraints()
indexes = extract_indexes()
rls = extract_rls()
routines = extract_routines()
grants = extract_grants()

sections = [
    ('-- Application schema baseline', create_tables),
    ('-- Primary / unique constraints', constraints),
    ('-- Indexes', indexes),
    ('-- Row level security', rls),
    ('-- Helper routines (functions + procedures)', routines),
    ('-- Grants', grants),
]

parts = []
for header, items in sections:
    if items:
        parts.append(header)
        parts.extend(items)

header = """-- F26 baseline: application schema baseline
-- ponytail: this migration recreates the full application schema as it existed on the
-- linked remote project at the time of F26. It uses IF NOT EXISTS so it is safe to run
-- on databases that already have these tables. Foreign keys are intentionally omitted
-- here to avoid ordering conflicts with later migration-track tables; the migration track
-- adds FKs where needed. Routines and grants are included so early RPCs and RLS work.
-- This makes a fresh local/staging database pass `supabase migration up`.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

"""

out.write_text(header + '\n\n'.join(parts) + '\n', encoding='utf-8')
print(f'Wrote baseline with {len(create_tables)} tables, {len(constraints)} constraints, {len(indexes)} indexes, {len(rls)} RLS flags, {len(routines)} routines, {len(grants)} grants')
