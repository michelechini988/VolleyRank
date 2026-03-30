import { supabaseAdmin } from './official_catalog_service.js';
import { syncFixtures } from './fixture_sync_service.js';
import { syncStandings } from './standing_sync_service.js';
import { fetchSeasons, fetchCompetitionsBySeason, fetchTeamsByCompetition } from './provider_fipav_trentino.js';
import { upsertSeasons, upsertCompetitions, upsertTeams } from './official_catalog_service.js';

export async function runFullSync(appTeamId: string): Promise<void> {
  // 1. Get all active competition links for the team
  const { data: links, error } = await supabaseAdmin
    .from('team_competition_links')
    .select('official_competition_id, official_season_id')
    .eq('app_team_id', appTeamId)
    .eq('sync_enabled', true);

  if (error || !links) {
    console.error("Error fetching links for full sync:", error);
    return;
  }

  // 2. Fetch seasons
  const seasons = await fetchSeasons();
  await upsertSeasons(seasons);

  for (const link of links) {
    const compId = link.official_competition_id;
    const seasonId = link.official_season_id;

    // Fetch competitions for the season
    const { data: seasonData } = await supabaseAdmin
      .from('official_seasons')
      .select('source_season_id')
      .eq('id', seasonId)
      .single();

    if (seasonData) {
      const competitions = await fetchCompetitionsBySeason(seasonData.source_season_id);
      await upsertCompetitions(competitions, seasonData.source_season_id);
    }

    // Fetch teams for the competition
    const { data: compData } = await supabaseAdmin
      .from('official_competitions')
      .select('source_competition_id')
      .eq('id', compId)
      .single();

    if (compData) {
      const teams = await fetchTeamsByCompetition(compData.source_competition_id);
      await upsertTeams(teams, compData.source_competition_id);
    }

    // Sync fixtures and standings
    await syncFixtures(compId, seasonId);
    await syncStandings(compId, seasonId);
  }
}

export async function runIncrementalSync(appTeamId: string): Promise<void> {
  // 1. Get all active competition links for the team
  const { data: links, error } = await supabaseAdmin
    .from('team_competition_links')
    .select('official_competition_id, official_season_id')
    .eq('app_team_id', appTeamId)
    .eq('sync_enabled', true);

  if (error || !links) {
    console.error("Error fetching links for incremental sync:", error);
    return;
  }

  for (const link of links) {
    const compId = link.official_competition_id;
    const seasonId = link.official_season_id;

    // Only sync fixtures and standings
    await syncFixtures(compId, seasonId);
    await syncStandings(compId, seasonId);
  }
}
