import { supabaseAdmin } from './official_catalog_service.js';

export async function resolveMatches(competitionId: string): Promise<void> {
  // 1. Get all official matches for the competition
  const { data: officialMatches, error: matchesError } = await supabaseAdmin
    .from('official_matches')
    .select('*')
    .eq('official_competition_id', competitionId);

  if (matchesError || !officialMatches) {
    console.error("Error fetching official matches:", matchesError);
    return;
  }

  // 2. Get all app teams linked to this competition
  const { data: linkedTeams, error: linkedTeamsError } = await supabaseAdmin
    .from('team_competition_links')
    .select('app_team_id, official_team_id')
    .eq('official_competition_id', competitionId)
    .eq('sync_enabled', true);

  if (linkedTeamsError || !linkedTeams) {
    console.error("Error fetching linked teams:", linkedTeamsError);
    return;
  }

  // 3. For each linked team, find their matches
  for (const link of linkedTeams) {
    const appTeamId = link.app_team_id;
    const officialTeamId = link.official_team_id;

    // Filter official matches where this team is playing
    const teamMatches = officialMatches.filter(
      m => m.home_team_id === officialTeamId || m.away_team_id === officialTeamId
    );

    for (const officialMatch of teamMatches) {
      await processMatchResolution(appTeamId, officialTeamId, officialMatch);
    }
  }
}

async function processMatchResolution(appTeamId: string, officialTeamId: string, officialMatch: any): Promise<void> {
  // 1. Check if already linked
  const { data: existingLink } = await supabaseAdmin
    .from('scouting_matches')
    .select('id, status')
    .eq('official_match_id', officialMatch.id)
    .single();

  if (existingLink) {
    // Update existing match status if needed
    if (officialMatch.status_code === 'completed' && existingLink.status !== 'completed') {
      await supabaseAdmin
        .from('scouting_matches')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', existingLink.id);
    }
    return;
  }

  // 2. Try to find a matching internal match
  // Look for matches within 24 hours
  const matchDate = new Date(officialMatch.match_date);
  const startDate = new Date(matchDate.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const endDate = new Date(matchDate.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const { data: internalMatches } = await supabaseAdmin
    .from('scouting_matches')
    .select('id, title, scheduled_at')
    .eq('app_team_id', appTeamId)
    .is('official_match_id', null)
    .gte('scheduled_at', startDate)
    .lte('scheduled_at', endDate);

  if (internalMatches && internalMatches.length === 1) {
    // High confidence match
    await linkMatch(internalMatches[0].id, officialMatch.id, appTeamId, officialTeamId, officialMatch);
  } else if (internalMatches && internalMatches.length > 1) {
    // Conflict
    await createConflict(internalMatches.map(m => m.id), officialMatch.id);
  } else {
    // No match found, create a new scouting match
    await createScoutingMatch(appTeamId, officialTeamId, officialMatch);
  }
}

async function linkMatch(scoutingMatchId: string, officialMatchId: string, appTeamId: string, officialTeamId: string, officialMatch: any) {
  const opponentOfficialTeamId = officialMatch.home_team_id === officialTeamId ? officialMatch.away_team_id : officialMatch.home_team_id;
  
  await supabaseAdmin
    .from('scouting_matches')
    .update({
      official_match_id: officialMatchId,
      official_competition_id: officialMatch.official_competition_id,
      opponent_official_team_id: opponentOfficialTeamId,
      status: officialMatch.status_code === 'completed' ? 'completed' : 'scheduled',
      updated_at: new Date().toISOString()
    })
    .eq('id', scoutingMatchId);

  await supabaseAdmin
    .from('match_sync_resolution')
    .upsert({
      scouting_match_id: scoutingMatchId,
      official_match_id: officialMatchId,
      resolution_status: 'resolved',
      confidence_score: 0.9,
      resolved_at: new Date().toISOString()
    }, { onConflict: 'scouting_match_id, official_match_id' });
}

async function createConflict(scoutingMatchIds: string[], officialMatchId: string) {
  for (const smId of scoutingMatchIds) {
    await supabaseAdmin
      .from('match_sync_resolution')
      .upsert({
        scouting_match_id: smId,
        official_match_id: officialMatchId,
        resolution_status: 'conflict',
        confidence_score: 0.5
      }, { onConflict: 'scouting_match_id, official_match_id' });
  }
}

async function createScoutingMatch(appTeamId: string, officialTeamId: string, officialMatch: any) {
  const isHome = officialMatch.home_team_id === officialTeamId;
  const opponentName = isHome ? officialMatch.away_team_name_raw : officialMatch.home_team_name_raw;
  const opponentOfficialTeamId = isHome ? officialMatch.away_team_id : officialMatch.home_team_id;
  
  const title = isHome ? `vs ${opponentName}` : `@ ${opponentName}`;
  const scheduledAt = officialMatch.kickoff_at || `${officialMatch.match_date}T${officialMatch.match_time || '00:00:00'}Z`;

  const { data, error } = await supabaseAdmin
    .from('scouting_matches')
    .insert({
      app_team_id: appTeamId,
      title,
      match_type: 'official',
      scheduled_at: scheduledAt,
      home_away: isHome ? 'home' : 'away',
      opponent_official_team_id: opponentOfficialTeamId,
      official_match_id: officialMatch.id,
      official_competition_id: officialMatch.official_competition_id,
      status: officialMatch.status_code === 'completed' ? 'completed' : 'scheduled'
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error("Error creating scouting match:", error);
    return;
  }

  await supabaseAdmin
    .from('match_sync_resolution')
    .upsert({
      scouting_match_id: data.id,
      official_match_id: officialMatch.id,
      resolution_status: 'resolved',
      confidence_score: 1.0,
      resolved_at: new Date().toISOString(),
      notes: 'Auto-created from official match'
    }, { onConflict: 'scouting_match_id, official_match_id' });
}
