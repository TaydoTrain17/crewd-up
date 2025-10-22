# Crew'd Up

Crew'd Up is a micro-social party game for 3-6 friends built with Expo + Supabase. This repository contains the mobile client, shared utilities, Supabase schema, Edge Functions, and supporting scripts.

## Repository structure

```
apps/mobile        Expo React Native application
packages/shared    Shared TypeScript types and utilities
supabase/          Database schema, seed data, and Edge Functions
scripts/           Tooling and seed helpers
docs/              Product brief, runbook, and test plan
```

## Getting started

1. Install Node 18+, Expo CLI, and Supabase CLI.
2. Copy `.env.example` to `.env` and fill in credentials.
3. Install dependencies (use `npm ci` if pnpm is blocked in your environment):

```bash
npm ci
```

4. Run the Expo app:

```bash
npx expo start
```

Supabase migrations can be applied via the CLI using the SQL in `supabase/schema.sql` plus the idempotent scripts in `supabase/migrations`. Seed the prompt catalog with `node scripts/seed-prompts.mjs`.

More operational details live in [`docs/runbook.md`](docs/runbook.md).
