# VolleyRank — Execution Master Plan (0 → 100)

Date: 2026-04-08  
Market Focus: Italy (Pilot: FIPAV Trentino)  
Target Segment: Adult mixed leagues (3a, 2a, 1a divisione, Serie D, Serie C)

## 1) Product Goal (Phase 1)

Deliver a stable and market-ready **club-first scouting platform** that enables:

1. Team setup and roster management.
2. Championship + fixtures synchronization.
3. Live match scouting with reliable event logging.
4. Team/player statistics and auto-generated match ratings.
5. Player-facing visibility of stats/rating already in private beta.

## 2) Strategic Decisions Locked

- **Go-to-market segment**: adult mixed leagues first.
- **Pilot geography**: Trentino / FIPAV Trentino ecosystem.
- **Player rating visibility**: enabled already in beta.
- **Mobile strategy**: optimize web app now, stores after beta.

## 3) Product Scope by Stage

### Stage A — Stabilize Core (Now)

- Restore missing modules (`lib/repositories`, `services/official_competition_sync/*`).
- Make `npm run build` and `npm run dev` pass on clean environment.
- Add baseline automated tests on match engine + rating + event store.
- Add error monitoring and structured logging.

### Stage B — Club MVP (Market-testable)

- Club/team/roster CRUD.
- Official competition sync + fallback manual import.
- Live scouting UX optimized for bench use (speed + undo safety).
- Post-match analytics dashboard.
- Match report export (CSV/PDF).

### Stage C — Beta Private (Pilot clubs)

- Player app views for stats/rating/leaderboards.
- Role-based access and permission hardening.
- Rating explainability panel ("why this score").
- Data quality workflows (event correction + audit log).

### Stage D — Public Readiness

- Billing, onboarding, support playbooks.
- Security/compliance completion.
- App-store track (wrapper + native compliance) after proven beta KPIs.

## 4) Rating System v1 (Sofascore-style, action-based)

## 4.1 Principles

- 100% based on match actions.
- Role-normalized evaluation.
- Context-aware impact (clutch points, key moments).
- Explainable output for coaches and players.

## 4.2 Model Components

For each player and match:

- Positive actions weighted by role.
- Negative actions weighted by role.
- Efficiency modifiers (e.g. attack efficiency, reception quality).
- Clutch multiplier in key game moments.
- Floor/Ceiling clamp to [0, 10].

Output:
- `match_rating`
- `season_rating`
- `trend_last_5`
- `explanation_breakdown`

## 4.3 Guardrails

- Minimum event volume threshold before exposing final rating.
- Role constraints to avoid unfair penalization (e.g. libero not judged on block/serve patterns outside role expectations).
- Anti-bias review every 2 weeks using real match samples.

## 5) Pricing Strategy Proposal (to define in pilot)

Since pricing is not finalized, run a structured pilot experiment:

### Hypothesis H1 (recommended starting point)
- **Per-team monthly subscription**
- Example pilot bands: 49€/team, 79€/team, 119€/team (feature-tiered)

### Hypothesis H2
- **Per-club monthly bundle** (includes 2 teams, extra team add-on)

### Decision Rule
After 6–8 weeks pilot:
- choose model with best balance of conversion, expansion potential, and support complexity.

## 6) 12-Week Delivery Plan

## Sprint 1 (Weeks 1-2) — Build Unblock + Data Layer

- Rebuild repository module and adapters.
- Restore/implement official sync services referenced by server.
- Green build/dev pipeline.
- Unit tests for engine/rating/event store.

**Exit Criteria**
- Build and dev start pass.
- Core domain tests pass.

## Sprint 2 (Weeks 3-4) — Scouting Reliability

- Harden live scouting flow (record/undo/substitutions/end-set).
- Event integrity checks and repair tools.
- Match finalization and stat aggregation.

**Exit Criteria**
- Full match can be scouted end-to-end without data corruption.

## Sprint 3 (Weeks 5-6) — Competition Sync + Dashboard

- Official fixture sync and manual fallback.
- Team and player dashboards with core KPIs.
- Match report export.

**Exit Criteria**
- Coach can run weekly workflow fully in product.

## Sprint 4 (Weeks 7-8) — Rating v1 + Explainability

- Activate role-based rating formula.
- Add explainability UI.
- Add leaderboard filters by role/team/territory.

**Exit Criteria**
- Players/coaches can understand and trust rating output.

## Sprint 5 (Weeks 9-10) — Pilot Operations

- Onboarding for 2-3 pilot clubs in Trentino.
- Feedback loop and telemetry dashboard.
- Reliability hardening from real usage.

**Exit Criteria**
- Weekly active usage from pilot clubs.

## Sprint 6 (Weeks 11-12) — Beta Gate

- Final bug bash and performance tuning.
- Security/privacy checklist completion.
- Commercial package draft + rollout plan.

**Exit Criteria**
- Private beta quality bar reached.

## 7) KPI Framework

### Product Quality
- Match completion rate without critical error.
- Event correction rate per match.
- Scouting input latency.

### User Value (Coach)
- Weekly active coaches.
- Matches scouted per team/month.
- Report export usage rate.

### User Value (Player)
- Player profile views/week.
- Rating view frequency.
- Leaderboard engagement.

### Business
- Pilot conversion to paid.
- Net revenue per club.
- Churn risk signals.

## 8) Risks and Mitigations

1. Sync instability with official sources
   - Mitigation: manual fallback import + cached snapshots.
2. Rating trust risk
   - Mitigation: explainability + periodic calibration reviews.
3. Low adoption by staff
   - Mitigation: optimize live scouting UX for <2 taps/event.
4. Privacy/legal friction
   - Mitigation: early compliance workstream, especially for player data visibility.

## 9) Immediate Next Actions (Week 0)

1. Freeze MVP requirements for Stage A + Stage B.
2. Create technical backlog from missing modules and failing imports.
3. Implement build-unblock tasks before feature expansion.
4. Define pilot club shortlist (Trentino) and outreach plan.
5. Start pricing discovery interviews with 5 clubs.

## 10) Working Method

- You own strategic product decisions.
- I propose implementation sequence, architecture decisions, and delivery checkpoints.
- Weekly cadence:
  - Monday: priority lock
  - Mid-week: progress/risk update
  - Friday: demo + next sprint refinement
