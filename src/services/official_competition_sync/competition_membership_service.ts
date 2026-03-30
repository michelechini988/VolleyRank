import { supabaseAdmin } from './official_catalog_service.js';

export interface CompetitionLink {
  id: string;
  app_team_id: string;
  official_team_id: string;
  official_competition_id: string;
  official_season_id: string;
  is_primary: boolean;
  sync_enabled: boolean;
  verification_status: string;
  confidence_score: number;
}

export async function addCompetitionLink(
  appTeamId: string,
  officialTeamId: string,
  officialCompetitionId: string,
  officialSeasonId: string,
  isPrimary: boolean = false
): Promise<void> {
  // Check if primary already exists, if so, update it if this one is primary
  if (isPrimary) {
    const { data: existingPrimary, error: primaryError } = await supabaseAdmin
      .from('team_competition_links')
      .select('id')
      .eq('app_team_id', appTeamId)
      .eq('official_season_id', officialSeasonId)
      .eq('is_primary', true);

    if (primaryError) {
      console.error("Error checking primary links:", primaryError);
      throw primaryError;
    }

    if (existingPrimary && existingPrimary.length > 0) {
      // Demote existing primary
      const idsToDemote = existingPrimary.map(link => link.id);
      await supabaseAdmin
        .from('team_competition_links')
        .update({ is_primary: false })
        .in('id', idsToDemote);
    }
  }

  const { error } = await supabaseAdmin
    .from('team_competition_links')
    .upsert({
      app_team_id: appTeamId,
      official_team_id: officialTeamId,
      official_competition_id: officialCompetitionId,
      official_season_id: officialSeasonId,
      is_primary: isPrimary,
      sync_enabled: true,
      verification_status: 'verified',
      confidence_score: 1.0,
      updated_at: new Date().toISOString()
    }, { onConflict: 'app_team_id, official_competition_id' });

  if (error) {
    console.error("Error adding competition link:", error);
    throw error;
  }
}

export async function removeCompetitionLink(linkId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('team_competition_links')
    .delete()
    .eq('id', linkId);

  if (error) {
    console.error("Error removing competition link:", error);
    throw error;
  }
}

export async function getCompetitionLinks(appTeamId: string): Promise<CompetitionLink[]> {
  const { data, error } = await supabaseAdmin
    .from('team_competition_links')
    .select('*')
    .eq('app_team_id', appTeamId);

  if (error || !data) {
    console.error("Error fetching competition links:", error);
    return [];
  }

  return data as CompetitionLink[];
}
