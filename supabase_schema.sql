-- Supabase Schema for VolleyRank

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('club_admin', 'staff', 'player')),
  player_id UUID,
  club_id UUID NOT NULL
);

-- Clubs
CREATE TABLE clubs (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL
);

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES clubs(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('M', 'F'))
);

-- Players
CREATE TABLE players (
  id UUID PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id),
  club_id UUID NOT NULL REFERENCES clubs(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  position TEXT NOT NULL,
  shirt_number INTEGER NOT NULL,
  height INTEGER,
  avatar_url TEXT,
  average_rating NUMERIC DEFAULT 0,
  region TEXT NOT NULL,
  category TEXT NOT NULL,
  matches_played INTEGER DEFAULT 0,
  trend TEXT CHECK (trend IN ('up', 'down', 'stable'))
);

-- Matches
CREATE TABLE matches (
  id UUID PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id),
  club_id UUID NOT NULL REFERENCES clubs(id),
  opponent_name TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  is_home BOOLEAN NOT NULL,
  competition TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'live', 'completed')),
  result TEXT
);

-- Game Events
CREATE TABLE game_events (
  id UUID PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES matches(id),
  timestamp BIGINT NOT NULL,
  event_type TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  player_id UUID REFERENCES players(id),
  fundamental TEXT,
  outcome TEXT,
  sub_in_player_id UUID REFERENCES players(id),
  sub_out_player_id UUID REFERENCES players(id),
  is_important_point BOOLEAN DEFAULT FALSE,
  is_decisive_point BOOLEAN DEFAULT FALSE,
  starting_lineup JSONB,
  adjustment_data JSONB
);

-- Lineups
CREATE TABLE lineups (
  match_id UUID PRIMARY KEY REFERENCES matches(id),
  id UUID NOT NULL,
  set_number INTEGER NOT NULL,
  rotation_index INTEGER NOT NULL,
  on_court JSONB NOT NULL,
  libero_id UUID REFERENCES players(id),
  bench_player_ids JSONB NOT NULL
);

-- Player Match Stats
CREATE TABLE player_match_stats (
  id UUID PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES players(id),
  match_id UUID NOT NULL REFERENCES matches(id),
  attacks INTEGER DEFAULT 0,
  attack_points INTEGER DEFAULT 0,
  attack_errors INTEGER DEFAULT 0,
  serves INTEGER DEFAULT 0,
  serve_points INTEGER DEFAULT 0,
  serve_errors INTEGER DEFAULT 0,
  blocks INTEGER DEFAULT 0,
  block_points INTEGER DEFAULT 0,
  block_errors INTEGER DEFAULT 0,
  receptions INTEGER DEFAULT 0,
  reception_perfect INTEGER DEFAULT 0,
  reception_errors INTEGER DEFAULT 0,
  digs INTEGER DEFAULT 0,
  dig_errors INTEGER DEFAULT 0,
  sets INTEGER DEFAULT 0,
  set_errors INTEGER DEFAULT 0,
  overall_rating NUMERIC DEFAULT 0
);
