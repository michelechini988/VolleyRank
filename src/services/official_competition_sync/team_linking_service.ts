import { supabaseAdmin } from './official_catalog_service.js';

export interface TeamLinkSuggestion {
  official_team_id: string;
  canonical_name: string;
  confidence_score: number;
}

export async function suggestTeamLinks(appTeamId: string, seasonId: string): Promise<TeamLinkSuggestion[]> {
  // 1. Get the app team details
  const { data: appTeam, error: appTeamError } = await supabaseAdmin
    .from('app_teams')
    .select('*')
    .eq('id', appTeamId)
    .single();

  if (appTeamError || !appTeam) {
    console.error("Error fetching app team:", appTeamError);
    return [];
  }

  // 2. Get all official teams for the given season
  // We need to join official_competition_teams -> official_competitions -> official_seasons
  const { data: officialTeams, error: officialTeamsError } = await supabaseAdmin
    .from('official_teams')
    .select(`
      id,
      canonical_name,
      normalized_name,
      official_competition_teams!inner (
        official_competitions!inner (
          official_season_id,
          official_seasons!inner (
            source_season_id
          )
        )
      )
    `)
    .eq('official_competition_teams.official_competitions.official_seasons.source_season_id', seasonId);

  if (officialTeamsError || !officialTeams) {
    console.error("Error fetching official teams:", officialTeamsError);
    return [];
  }

  // 3. Perform fuzzy matching and scoring
  const normalizedAppTeamName = normalizeName(appTeam.display_name);
  const suggestions: TeamLinkSuggestion[] = [];

  for (const team of officialTeams) {
    const score = calculateConfidenceScore(normalizedAppTeamName, team.normalized_name);
    if (score > 0.3) { // Only suggest if there's some similarity
      suggestions.push({
        official_team_id: team.id,
        canonical_name: team.canonical_name,
        confidence_score: score
      });
    }
  }

  // Sort by confidence score descending
  return suggestions.sort((a, b) => b.confidence_score - a.confidence_score).slice(0, 5);
}

export async function confirmTeamLink(appTeamId: string, officialTeamId: string, seasonId: string): Promise<void> {
  // Resolve internal season ID
  const { data: seasonData } = await supabaseAdmin
    .from('official_seasons')
    .select('id')
    .eq('source_season_id', seasonId)
    .single();

  if (!seasonData) {
    throw new Error("Season not found");
  }

  const { error } = await supabaseAdmin
    .from('team_sync_links')
    .upsert({
      app_team_id: appTeamId,
      official_team_id: officialTeamId,
      official_season_id: seasonData.id,
      verification_status: 'verified',
      confidence_score: 1.0,
      link_method: 'manual',
      linked_at: new Date().toISOString(),
      is_active: true
    }, { onConflict: 'app_team_id, official_team_id, official_season_id' });

  if (error) {
    console.error("Error confirming team link:", error);
    throw error;
  }
}

// Helper functions for matching
function normalizeName(name: string): string {
  return name
    .toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^\w\s]/gi, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Remove multiple spaces
    .replace(/\b(ASD|SSD|US|USD|PALLAVOLO|VOLLEY|VOLLEYBALL)\b/g, '') // Remove frequent tokens
    .trim();
}

function calculateConfidenceScore(name1: string, name2: string): number {
  // Simple Jaccard similarity for now
  const set1 = new Set(name1.split(' '));
  const set2 = new Set(name2.split(' '));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}
