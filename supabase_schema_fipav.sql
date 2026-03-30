-- Supabase Schema for FIPAV Trentino Integration

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- A. Dominio interno applicativo (Minimal setup for context)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    display_name TEXT NOT NULL,
    gender_category TEXT,
    age_category TEXT,
    default_season_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_team_id UUID REFERENCES app_teams(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    birth_year INTEGER,
    role TEXT,
    jersey_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scouting_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_team_id UUID REFERENCES app_teams(id),
    title TEXT NOT NULL,
    match_type TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    home_away TEXT,
    opponent_app_team_id UUID REFERENCES app_teams(id),
    opponent_official_team_id UUID, -- Will reference official_teams
    official_match_id UUID, -- Will reference official_matches
    official_competition_id UUID, -- Will reference official_competitions
    status TEXT DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- B. Dominio ufficiale esterno
CREATE TABLE IF NOT EXISTS official_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    region TEXT,
    source_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert FIPAV Trentino source
INSERT INTO official_sources (code, name, region, source_type) 
VALUES ('FIPAV_TRENTINO', 'FIPAV Trentino', 'Trentino', 'WEB_PORTAL')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS official_seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES official_sources(id),
    source_season_id TEXT NOT NULL,
    name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    raw_payload JSONB,
    checksum TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source_id, source_season_id)
);

CREATE TABLE IF NOT EXISTS official_competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES official_sources(id),
    official_season_id UUID REFERENCES official_seasons(id),
    source_competition_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    gender TEXT,
    age_band TEXT,
    competition_type TEXT,
    level TEXT,
    group_code TEXT,
    raw_payload JSONB,
    checksum TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source_id, official_season_id, source_competition_id)
);

CREATE TABLE IF NOT EXISTS official_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES official_sources(id),
    source_team_id TEXT NOT NULL,
    canonical_name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    club_name TEXT,
    gender TEXT,
    age_band TEXT,
    raw_payload JSONB,
    checksum TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source_id, source_team_id)
);

CREATE TABLE IF NOT EXISTS official_team_aliases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    official_team_id UUID REFERENCES official_teams(id),
    alias_name TEXT NOT NULL,
    normalized_alias_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS official_competition_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    official_competition_id UUID REFERENCES official_competitions(id),
    official_team_id UUID REFERENCES official_teams(id),
    role_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(official_competition_id, official_team_id)
);

-- Layer di mapping
CREATE TABLE IF NOT EXISTS team_sync_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_team_id UUID REFERENCES app_teams(id),
    official_team_id UUID REFERENCES official_teams(id),
    official_season_id UUID REFERENCES official_seasons(id),
    verification_status TEXT DEFAULT 'suggested', -- suggested, verified, suspended
    confidence_score NUMERIC(3, 2),
    link_method TEXT,
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unlinked_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(app_team_id, official_team_id, official_season_id)
);

CREATE TABLE IF NOT EXISTS team_competition_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_team_id UUID REFERENCES app_teams(id),
    official_team_id UUID REFERENCES official_teams(id),
    official_competition_id UUID REFERENCES official_competitions(id),
    official_season_id UUID REFERENCES official_seasons(id),
    is_primary BOOLEAN DEFAULT false,
    sync_enabled BOOLEAN DEFAULT true,
    verification_status TEXT DEFAULT 'verified',
    confidence_score NUMERIC(3, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(app_team_id, official_competition_id)
);

CREATE TABLE IF NOT EXISTS official_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES official_sources(id),
    official_season_id UUID REFERENCES official_seasons(id),
    official_competition_id UUID REFERENCES official_competitions(id),
    source_match_id TEXT NOT NULL,
    match_code TEXT,
    round_label TEXT,
    phase_label TEXT,
    match_date DATE,
    match_time TIME,
    kickoff_at TIMESTAMP WITH TIME ZONE,
    home_team_id UUID REFERENCES official_teams(id),
    away_team_id UUID REFERENCES official_teams(id),
    home_team_name_raw TEXT,
    away_team_name_raw TEXT,
    venue_name TEXT,
    venue_address TEXT,
    venue_city TEXT,
    status_code TEXT,
    status_label TEXT,
    result_home_sets INTEGER,
    result_away_sets INTEGER,
    set_scores_text TEXT,
    raw_payload JSONB,
    checksum TEXT,
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source_id, official_competition_id, source_match_id)
);

-- Add foreign keys to scouting_matches now that official_matches and official_competitions exist
ALTER TABLE scouting_matches 
  ADD CONSTRAINT fk_scouting_matches_official_team FOREIGN KEY (opponent_official_team_id) REFERENCES official_teams(id),
  ADD CONSTRAINT fk_scouting_matches_official_match FOREIGN KEY (official_match_id) REFERENCES official_matches(id),
  ADD CONSTRAINT fk_scouting_matches_official_comp FOREIGN KEY (official_competition_id) REFERENCES official_competitions(id);

CREATE TABLE IF NOT EXISTS official_standing_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    official_competition_id UUID REFERENCES official_competitions(id),
    official_season_id UUID REFERENCES official_seasons(id),
    snapshot_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    official_team_id UUID REFERENCES official_teams(id),
    rank_position INTEGER,
    played INTEGER,
    won INTEGER,
    lost INTEGER,
    points INTEGER,
    sets_for INTEGER,
    sets_against INTEGER,
    score_for INTEGER,
    score_against INTEGER,
    raw_payload JSONB,
    checksum TEXT
);

CREATE TABLE IF NOT EXISTS match_sync_resolution (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scouting_match_id UUID REFERENCES scouting_matches(id),
    official_match_id UUID REFERENCES official_matches(id),
    resolution_status TEXT, -- suggested, conflict, resolved
    confidence_score NUMERIC(3, 2),
    resolved_by UUID, -- user id
    resolved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    UNIQUE(scouting_match_id, official_match_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    source_system TEXT,
    old_value JSONB,
    new_value JSONB,
    severity TEXT DEFAULT 'info',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies (Basic setup, assuming authenticated users can read, and service role can write)
-- For a real app, these would be more granular based on user roles and organization membership.
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE scouting_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_team_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_competition_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_sync_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_competition_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_standing_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_sync_resolution ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies allowing read access to authenticated users for official data
CREATE POLICY "Allow read access to authenticated users" ON official_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON official_seasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON official_competitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON official_teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON official_team_aliases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON official_competition_teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON official_matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON official_standing_snapshots FOR SELECT TO authenticated USING (true);

-- Create policies for app data (assuming users can read their own org's data, simplified here)
CREATE POLICY "Allow read access to authenticated users" ON organizations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON app_teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON players FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON scouting_matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON team_sync_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON team_competition_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON match_sync_resolution FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON audit_logs FOR SELECT TO authenticated USING (true);
