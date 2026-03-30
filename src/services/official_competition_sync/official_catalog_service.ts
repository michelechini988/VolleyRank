import { createClient } from '@supabase/supabase-js';
import { OfficialSeason, OfficialCompetition, OfficialTeam } from './provider_fipav_trentino.js';

// Initialize Supabase client for backend
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function getOfficialSourceId(code: string): Promise<string | null> {
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

export async function upsertSeasons(seasons: OfficialSeason[]): Promise<void> {
  const sourceId = await getOfficialSourceId('FIPAV_TRENTINO');
  if (!sourceId) return;

  const records = seasons.map(s => ({
    source_id: sourceId,
    source_season_id: s.source_record_id,
    name: s.normalized_fields.name,
    start_date: s.normalized_fields.start_date,
    end_date: s.normalized_fields.end_date,
    raw_payload: JSON.parse(s.raw_payload),
    checksum: s.checksum,
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabaseAdmin
    .from('official_seasons')
    .upsert(records, { onConflict: 'source_id, source_season_id' });

  if (error) {
    console.error("Error upserting seasons:", error);
    throw error;
  }
}

export async function upsertCompetitions(competitions: OfficialCompetition[], seasonId: string): Promise<void> {
  const sourceId = await getOfficialSourceId('FIPAV_TRENTINO');
  if (!sourceId) return;

  // Resolve internal season ID
  const { data: seasonData } = await supabaseAdmin
    .from('official_seasons')
    .select('id')
    .eq('source_season_id', seasonId)
    .eq('source_id', sourceId)
    .single();

  if (!seasonData) {
    console.error("Season not found for ID:", seasonId);
    return;
  }

  const records = competitions.map(c => ({
    source_id: sourceId,
    official_season_id: seasonData.id,
    source_competition_id: c.source_record_id,
    name: c.normalized_fields.name,
    category: c.normalized_fields.category,
    gender: c.normalized_fields.gender,
    raw_payload: JSON.parse(c.raw_payload),
    checksum: c.checksum,
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabaseAdmin
    .from('official_competitions')
    .upsert(records, { onConflict: 'source_id, official_season_id, source_competition_id' });

  if (error) {
    console.error("Error upserting competitions:", error);
    throw error;
  }
}

export async function upsertTeams(teams: OfficialTeam[], competitionId: string): Promise<void> {
  const sourceId = await getOfficialSourceId('FIPAV_TRENTINO');
  if (!sourceId) return;

  // Resolve internal competition ID
  const { data: compData } = await supabaseAdmin
    .from('official_competitions')
    .select('id')
    .eq('source_competition_id', competitionId)
    .eq('source_id', sourceId)
    .single();

  if (!compData) {
    console.error("Competition not found for ID:", competitionId);
    return;
  }

  const teamRecords = teams.map(t => ({
    source_id: sourceId,
    source_team_id: t.source_record_id,
    canonical_name: t.normalized_fields.canonical_name,
    normalized_name: t.normalized_fields.normalized_name,
    raw_payload: JSON.parse(t.raw_payload),
    checksum: t.checksum,
    updated_at: new Date().toISOString()
  }));

  const { data: upsertedTeams, error: teamError } = await supabaseAdmin
    .from('official_teams')
    .upsert(teamRecords, { onConflict: 'source_id, source_team_id' })
    .select('id, source_team_id');

  if (teamError || !upsertedTeams) {
    console.error("Error upserting teams:", teamError);
    throw teamError;
  }

  // Link teams to competition
  const compTeamRecords = upsertedTeams.map(t => ({
    official_competition_id: compData.id,
    official_team_id: t.id,
    role_status: 'active'
  }));

  const { error: linkError } = await supabaseAdmin
    .from('official_competition_teams')
    .upsert(compTeamRecords, { onConflict: 'official_competition_id, official_team_id' });

  if (linkError) {
    console.error("Error linking teams to competition:", linkError);
    throw linkError;
  }
}
