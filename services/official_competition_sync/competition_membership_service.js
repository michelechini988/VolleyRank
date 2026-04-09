const competitionLinks = [];

export async function addCompetitionLink(appTeamId, officialTeamId, officialCompetitionId, officialSeasonId, isPrimary = false) {
  const id = `link_${Math.random().toString(36).slice(2, 10)}`;
  const link = {
    id,
    appTeamId,
    officialTeamId,
    officialCompetitionId,
    officialSeasonId,
    isPrimary: Boolean(isPrimary),
    createdAt: new Date().toISOString(),
  };
  competitionLinks.push(link);
  return link;
}

export async function removeCompetitionLink(linkId) {
  const idx = competitionLinks.findIndex((x) => x.id === linkId);
  if (idx >= 0) competitionLinks.splice(idx, 1);
  return { success: true };
}

export async function getCompetitionLinks(appTeamId) {
  return competitionLinks.filter((x) => x.appTeamId === appTeamId);
}
