import { supabaseAdmin } from './official_catalog_service.js';
import { fetchStandingsByCompetition } from './provider_fipav_trentino.js';

export interface OfficialStanding {
  source_system: string;
  source_record_id: string;
  source_url: string;
  retrieved_at: string;
  raw_payload: string;
  normalized_fields: {
    rank_position: number;
    played: number;
    won: number;
    lost: number;
    points: number;
    sets_for: number;
    sets_against: number;
    score_for: number;
    score_against: number;
    team_name_raw: string;
  };
  checksum: string;
}

export async function syncStandings(competitionId: string, seasonId: string): Promise<void> {
  // 1. Fetch standings from provider
  const standings = await fetchStandingsByCompetition(competitionId);
  if (!standings || standings.length === 0) return;

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

  // 3. Create snapshot records
  const snapshotAt = new Date().toISOString();
  const records = standings.map(s => ({
    official_competition_id: compData.id,
    official_season_id: seasonData.id,
    snapshot_at: snapshotAt,
    // official_team_id: tbd, we need to resolve the team ID
    rank_position: s.normalized_fields.rank_position,
    played: s.normalized_fields.played,
    won: s.normalized_fields.won,
    lost: s.normalized_fields.lost,
    points: s.normalized_fields.points,
    sets_for: s.normalized_fields.sets_for,
    sets_against: s.normalized_fields.sets_against,
    score_for: s.normalized_fields.score_for,
    score_against: s.normalized_fields.score_against,
    raw_payload: JSON.parse(s.raw_payload),
    checksum: s.checksum
  }));

  // Resolve team IDs before inserting
  for (const record of records) {
    const teamNameRaw = record.raw_payload.team_name_raw; // Assuming it's in raw payload
    if (teamNameRaw) {
      const { data: teamData } = await supabaseAdmin
        .from('official_teams')
        .select('id')
        .eq('canonical_name', teamNameRaw)
        .eq('source_id', sourceId)
        .single();
      
      if (teamData) {
        (record as any).official_team_id = teamData.id;
      }
    }
  }

  const { error } = await supabaseAdmin
    .from('official_standing_snapshots')
    .insert(records);

  if (error) {
    console.error("Error inserting standing snapshots:", error);
    throw error;
  }
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
