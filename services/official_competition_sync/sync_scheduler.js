import { fetchCompetitionsBySeason, fetchMatchesByCompetition, fetchSeasons, fetchStandingsByCompetition, fetchTeamsByCompetition } from './provider_fipav_trentino.js';

export async function runFullSync(appTeamId) {
  const seasons = await fetchSeasons();
  const season = seasons[0];
  const competitions = await fetchCompetitionsBySeason(season.id);
  const competition = competitions[0];
  const teams = await fetchTeamsByCompetition(competition.id);
  const matches = await fetchMatchesByCompetition(competition.id);
  const standings = await fetchStandingsByCompetition(competition.id);

  return {
    appTeamId,
    mode: 'full',
    season,
    competition,
    teamsSynced: teams.length,
    matchesSynced: matches.length,
    standingsSynced: standings.length,
    completedAt: new Date().toISOString(),
  };
}

export async function runIncrementalSync(appTeamId) {
  const result = await runFullSync(appTeamId);
  return {
    ...result,
    mode: 'incremental',
  };
}
