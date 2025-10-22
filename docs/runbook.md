# Crew'd Up Runbook

## Local development

### Environment variables

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
EXPO_PUBLIC_EDGE_URL=
AMPLITUDE_API_KEY=
SENTRY_DSN=
```

### Bootstrap steps

```bash
supabase db reset
supabase db push
node scripts/seed-prompts.mjs
supabase functions deploy guest_join
supabase functions deploy generate_recap
supabase functions deploy score_text
npm ci
npx expo start
```

- Copy `.env.example` to `.env` before running the commands above.
- If `npm ci` fails due to registry restrictions, set `npm config set registry https://registry.npmjs.org` and retry.
- Practice Mode lives alongside live rooms and can be triggered from the Home screen without any time gating.

## Testing

- Mobile unit tests: `cd apps/mobile && pnpm test`
- Shared package tests: `pnpm --filter @crewdup/shared test`
- Type checks: `pnpm typecheck`
- Lint: `pnpm lint`

## Environments

| Env | Supabase project | Notes |
| --- | ---------------- | ----- |
| local | `supabase start` | Use anon + service keys from local CLI |
| staging | `crewdup-stg` | Connect Expo app via `app.config` extra |
| production | `crewdup-prod` | Locked down policies, analytics enabled |

## Deployments

- **Mobile**: Use EAS build. Configure `eas.json` (stub provided). Kick off with `eas build --profile preview`.
- **Edge functions**: Deploy via `supabase functions deploy guest_join`, `supabase functions deploy generate_recap`, and `supabase functions deploy score_text`.
- **Database**: Use migration SQL. Apply in staging first, then production.

## Incident response

1. Check Sentry for crash signatures. Trigger analytics event `crash` for correlation.
2. Use Supabase Studio to inspect active rooms. Boot problematic members by removing from `room_members`.
3. For moderation flags, review `content_flags` table and adjust prompt risk.

## Two-device sanity test

1. Connect two iOS simulators or devices on same network.
2. Device A: onboard, verify phone, create room, share code.
3. Device B: onboard without phone, join via code (guest flow).
4. Run through three rounds (mock prompts) ensuring timers sync even if a device toggles airplane mode briefly.
5. End session, verify recap link displays, share sheet opens, and recap lacks the practice watermark.
6. Run Practice Mode solo, confirm recap badge shows “Practice” and share respects Settings toggle.
7. Confirm a third unauthenticated client cannot query protected tables via Supabase Studio.
