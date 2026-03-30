import { supabaseAdmin } from './official_catalog_service.js';
import { fetchMatchesByCompetition } from './provider_fipav_trentino.js';

export interface OfficialMatch {
  source_system: string;
  source_record_id: string;
  source_url: string;
  retrieved_at: string;
  raw_payload: string;
  normalized_fields: {
    match_code: string;
    round_label: string;
    phase_label: string;
    match_date: string;
    match_time: string;
    kickoff_at: string;
    home_team_name_raw: string;
    away_team_name_raw: string;
    venue_name: string;
    venue_address: string;
    venue_city: string;
    status_code: string;
    status_label: string;
    result_home_sets: number;
    result_away_sets: number;
    set_scores_text: string;
  };
  checksum: string;
}

export async function syncFixtures(competitionId: string, seasonId: string): Promise<void> {
  // 1. Fetch matches from provider
  const matches = await fetchMatchesByCompetition(competitionId);
  if (!matches || matches.length === 0) return;

  // 2. Resolve internal IDs
  const sourceId = await getOfficialSourceId('FIPAV_TRENTINO');
  if (!sourceId) return;

  const { data: seasonData } = await supabaseAdmin
    .from('official_seasons')
    .select('id')
    .eq('source_season_id', seasonId)
    .single();

  const { data: compData } = await supabaseAdmin
    .from('official_competitions')
    .select('id')
    .eq('source_competition_id', competitionId)
    .single();

  if (!seasonData || !compData) {
    console.error("Season or Competition not found");
    return;
  }

  // 3. Upsert official matches
  const records = matches.map(m => ({
    source_id: sourceId,
    official_season_id: seasonData.id,
    official_competition_id: compData.id,
    source_match_id: m.source_record_id,
    match_code: m.normalized_fields.match_code,
    round_label: m.normalized_fields.round_label,
    phase_label: m.normalized_fields.phase_label,
    match_date: m.normalized_fields.match_date,
    match_time: m.normalized_fields.match_time,
    kickoff_at: m.normalized_fields.kickoff_at,
    home_team_name_raw: m.normalized_fields.home_team_name_raw,
    away_team_name_raw: m.normalized_fields.away_team_name_raw,
    venue_name: m.normalized_fields.venue_name,
    venue_address: m.normalized_fields.venue_address,
    venue_city: m.normalized_fields.venue_city,
    status_code: m.normalized_fields.status_code,
    status_label: m.normalized_fields.status_label,
    result_home_sets: m.normalized_fields.result_home_sets,
    result_away_sets: m.normalized_fields.result_away_sets,
    set_scores_text: m.normalized_fields.set_scores_text,
    raw_payload: JSON.parse(m.raw_payload),
    checksum: m.checksum,
    source_url: m.source_url,
    updated_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString()
  }));

  const { error } = await supabaseAdmin
    .from('official_matches')
    .upsert(records, { onConflict: 'source_id, official_competition_id, source_match_id' });

  if (error) {
    console.error("Error upserting official matches:", error);
    throw error;
  }

  // 4. Trigger match resolution
  await resolveMatches(compData.id);
}

async function getOfficialSourceId(code: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('official_sources')
    .select('id')
    .eq('code', code)
    .single();
    
  if (error || !data) {
    console.error("Error fetching source ID:", error);
    return null;
  }
  return data.id;
}

// Placeholder for match resolution, will be implemented in match_resolution_service.ts
async function resolveMatches(competitionId: string) {
  // Call match_resolution_service
}
