# VolleyRank — Beta Readiness Assessment

Date: 2026-04-07

## Executive Summary

Current readiness for a **public beta launch** is **low**.

The project shows a clear product direction (dashboard, team management, scouting, leaderboards, player profile), but the current branch is blocked by build/runtime failures and architectural gaps for mobile distribution.

**Suggested readiness score**: **3/10** for a closed technical preview, **1/10** for App Store / Play Store release.

## What I tested

1. Dependency installation (`npm install`) completed.
2. Production build (`npm run build`) failed.
3. Local development boot (`npm run dev`) failed at startup.
4. Codebase review of key flow files:
   - app routing/auth shell
   - dashboard/match creation
   - roster/team management
   - scouting flow
   - leaderboard and player profile
   - backend API server and FIPAV integration docs

## Functional coverage (implemented)

The following product flows are present at source level:

- **Auth shell + route gating** with landing/login and protected app pages.
- **Dashboard** with match list and create-match modal.
- **Team management** with add/edit player workflow.
- **Scouting UI** for event logging, substitution, undo, and set progression.
- **Leaderboard** with role/region filters.
- **Player profile** with trend chart + skill radar.

## Critical blockers (must fix before beta)

1. **Missing repository layer files**
   - Multiple frontend modules import `../lib/repositories`, but the file/module is not in the tree.
   - This causes TypeScript compile failure.

2. **Missing official sync service files**
   - `server.ts` imports files under `services/official_competition_sync/*.js` that are not present.
   - This prevents `npm run dev` from starting.

3. **No automated tests configured**
   - No `test` script in `package.json`.
   - No unit/integration/e2e suite available for regression confidence.

4. **Mobile release gap (App Store / Play Store)**
   - Current stack is web (React + Vite + Express), with no native packaging strategy in repo.
   - For stores, you need at least one path: React Native app, Flutter rewrite, or web-wrapper (Capacitor) with native compliance work.

## High-priority risks (next 2–4 weeks)

- **Data consistency risk**: local in-memory event state + storage rollback paths need deterministic tests.
- **Security/compliance risk**: no visible app-level privacy, consent, data retention, or account deletion flows.
- **Operational risk**: no CI quality gates (build, test, lint), no release channeling, no crash monitoring setup in repo.
- **Backend dependency risk**: FIPAV sync integration is architected but appears incomplete/missing from current branch.

## Recommended roadmap to reach a launchable beta

### Phase 1 — Unblock build and runtime (Week 1)

- Restore/add `lib/repositories` module and the `services/official_competition_sync` subtree expected by imports.
- Ensure `npm run build` and `npm run dev` are green on clean checkout.
- Add health smoke checks for core flows (auth mock, create match, scouting event append/undo).

### Phase 2 — Quality baseline (Week 2)

- Add `npm test` with:
  - unit tests for scoring/rating engine (`lib/engine`, `lib/ratingSystem`, `lib/liveRating`),
  - integration tests for repositories and event store behavior,
  - at least one e2e happy path for core scouting flow.
- Add CI pipeline requiring build + tests before merge.

### Phase 3 — Private beta hardening (Weeks 3–4)

- Error handling polish (user-facing failures, retries, offline edge cases).
- Telemetry/observability (crash + API error monitoring).
- Security and privacy baseline (policy links, consent, account deletion path, data export/deletion process).

### Phase 4 — Mobile distribution track (parallel)

- Choose target strategy (recommended: **Capacitor short-term** to validate demand quickly, then native if needed).
- Implement native wrappers, deep links, push permissions strategy, and store-compliant assets.
- Run store pre-checklists (privacy nutrition labels, permissions justification, review notes, test credentials).

## Go/No-Go Recommendation

**No-Go for public beta today.**

Proceed only after:

1. Build/runtime blockers are resolved.
2. Minimum automated test baseline is in place.
3. Mobile packaging and store-compliance path is chosen and validated.

