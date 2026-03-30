# FIPAV Trentino Integration Module

This module provides a backend integration between the scouting app and the official FIPAV Trentino portal.

## Architecture

The integration is built as a set of backend services running on an Express server, which is integrated with Vite for development.

### Modules:
1. **provider_fipav_trentino**: Scrapes and parses data from the FIPAV Trentino website using `cheerio`.
2. **official_catalog_service**: Manages the persistence of official data (seasons, competitions, teams) into Supabase.
3. **team_linking_service**: Handles the fuzzy matching and linking of internal app teams to official teams.
4. **competition_membership_service**: Manages multi-competition links for a single team.
5. **fixture_sync_service**: Syncs official matches and triggers resolution.
6. **standing_sync_service**: Syncs and snapshots official standings.
7. **match_resolution_service**: Reconciles official matches with internal scouting matches, handling conflicts.
8. **sync_scheduler**: Orchestrates full and incremental syncs.
9. **audit_log_service**: Logs actions and anomalies.

## Setup Instructions

1. **Database Schema**:
   You must apply the SQL schema to your Supabase project.
   Open the Supabase SQL Editor and run the contents of `supabase_schema_fipav.sql`.

2. **Environment Variables**:
   Ensure you have the following environment variables set in your `.env` file:
   - `VITE_SUPABASE_URL`: Your Supabase project URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (required for backend operations to bypass RLS). If not available, `VITE_SUPABASE_ANON_KEY` will be used, but you may need to adjust RLS policies.

3. **Running the Server**:
   The `dev` script in `package.json` has been updated to run the Express server using `tsx`.
   Run `npm run dev` to start the server.

## API Endpoints

The following internal APIs are exposed by the Express server:

- `GET /api/official/seasons`
- `GET /api/official/competitions?season_id=...`
- `GET /api/official/competitions/:id/teams`
- `POST /api/teams/:appTeamId/official-link/suggest`
- `POST /api/teams/:appTeamId/official-link/confirm`
- `POST /api/teams/:appTeamId/competitions`
- `DELETE /api/teams/:appTeamId/competitions/:linkId`
- `GET /api/teams/:appTeamId/competitions`
- `POST /api/teams/:appTeamId/sync`
- `GET /api/teams/:appTeamId/matches`
- `GET /api/teams/:appTeamId/standings`
- `GET /api/teams/:appTeamId/sync/conflicts`
- `POST /api/teams/:appTeamId/sync/conflicts/:conflictId/resolve`

## Notes on FIPAV Provider

The current implementation of `provider_fipav_trentino.ts` includes basic HTML parsing using `cheerio`. Since the FIPAV portal uses server-rendered HTML and ASP.NET WebForms (indicated by `__VIEWSTATE`), a full implementation for fetching matches and standings would require simulating form submissions or parsing specific table structures. Mock implementations are provided for `fetchMatchesByCompetition` and `fetchStandingsByCompetition` as placeholders to demonstrate the architecture. You will need to inspect the actual HTML structure of those pages to complete the parsing logic.
