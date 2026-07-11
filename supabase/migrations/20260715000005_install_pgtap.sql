-- Sub-Phase 6.1: Install pgTAP extension for database tests.
-- ponytail: create extension in the dedicated extensions schema to keep public clean.

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
