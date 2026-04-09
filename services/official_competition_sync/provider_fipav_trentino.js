export async function fetchSeasons() {
  return [
    { id: '2025-2026', name: 'Stagione 2025/2026' },
    { id: '2024-2025', name: 'Stagione 2024/2025' },
  ];
}

export async function fetchCompetitionsBySeason(seasonId) {
  return [
    { id: `${seasonId}-serie-c`, seasonId, name: 'Serie C' },
    { id: `${seasonId}-serie-d`, seasonId, name: 'Serie D' },
    { id: `${seasonId}-prima`, seasonId, name: 'Prima Divisione' },
  ];
}

export async function fetchTeamsByCompetition(competitionId) {
  return [
    { id: `${competitionId}-team-1`, name: 'Volley Trento A' },
    { id: `${competitionId}-team-2`, name: 'Volley Rovereto' },
  ];
}

export async function fetchMatchesByCompetition(competitionId) {
  return [
    {
      id: `${competitionId}-m1`,
      competitionId,
      homeTeam: 'Volley Trento A',
      awayTeam: 'Volley Rovereto',
      date: new Date().toISOString(),
      status: 'scheduled',
    },
  ];
}

export async function fetchStandingsByCompetition(competitionId) {
  return [
    { competitionId, teamName: 'Volley Trento A', points: 9, played: 4 },
    { competitionId, teamName: 'Volley Rovereto', points: 6, played: 4 },
  ];
}
