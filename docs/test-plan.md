# Crew'd Up Test Plan

## Automated coverage

| Area | Tool | Command |
| ---- | ---- | ------- |
| Reducers | Jest (Expo) | `cd apps/mobile && pnpm test` |
| Shared utilities | Vitest | `pnpm --filter @crewdup/shared test` |
| Type safety | TypeScript | `pnpm typecheck` |
| Linting | Expo ESLint | `pnpm lint` |

## Manual scenarios

1. **Host onboarding + verification**
   - Complete age gate and nickname, trigger SMS verification, confirm Home unlocks Create Room.
2. **Guest join flow**
   - Second device skips phone verification, enters join code, ensure guest_join issues session and lobby lists member.
3. **Practice Mode solo run**
   - Launch Practice Mode, confirm bots render, session starts with one human, recap shows Practice watermark.
4. **Live session flow**
   - Host starts verified room, two guests join, run three rounds, ensure timers sum to ~6 minutes and recap lacks Practice badge.
5. **Recap share + settings**
   - Toggle Practice recap saving in Settings and observe Summary copy changes before sharing.
6. **Moderation**
   - Enter banned keyword in Dare round, expect client prompt to rephrase.
7. **Host migration**
   - Disconnect host mid-round; ensure next longest member becomes host (manual DB tweak acceptable for MVP).
8. **RLS hardening**
   - Attempt to read room data from unauthenticated client; expect access denied.

## Performance smoke

- Toggle airplane mode twice during a session to confirm reconnection messaging.
- Validate recap edge function completes in under 3s using Supabase logs.
