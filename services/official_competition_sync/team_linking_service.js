const links = new Map();

export async function suggestTeamLinks(appTeamId, seasonId) {
  return [
    {
      appTeamId,
      seasonId,
      officialTeamId: `${seasonId}-team-1`,
      officialTeamName: 'Volley Trento A',
      confidence: 0.82,
    },
  ];
}

export async function confirmTeamLink(appTeamId, officialTeamId, seasonId) {
  links.set(appTeamId, { officialTeamId, seasonId, confirmedAt: new Date().toISOString() });
  return links.get(appTeamId);
}
