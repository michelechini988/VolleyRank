import { Player, Match, GameEvent, PlayerMatchStats, MatchLineup, User, Club, Team } from '../types';
import { supabase } from '../supabase';
import { mockUsers, mockClubs, mockTeams, mockPlayers, mockMatches } from './mockData';

const hasSupabaseConfig =
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_ANON_KEY !== 'placeholder';

export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id_' + Math.random().toString(36).substr(2, 9);
};

// --- LOCAL STORAGE HELPERS (FALLBACK) ---
const getStorage = <T>(key: string, defaultData: T[]): T[] => {
  if (typeof window === 'undefined') return defaultData;
  const data = localStorage.getItem(`volleyrank_${key}`);
  if (!data) {
    localStorage.setItem(`volleyrank_${key}`, JSON.stringify(defaultData));
    return defaultData;
  }
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : defaultData;
  } catch (e) {
    return defaultData;
  }
};

const setStorage = <T>(key: string, data: T[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`volleyrank_${key}`, JSON.stringify(data));
  }
};

// --- USERS ---
export const getUser = async (userId: string): Promise<User | null> => {
  if (hasSupabaseConfig) {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error || !data) return null;
    return { id: data.id, name: data.name, email: data.email, role: data.role, playerId: data.player_id, clubId: data.club_id };
  }
  const users = getStorage('users', mockUsers);
  return users.find(u => u.id === userId) || null;
};

export const createUser = async (user: User): Promise<void> => {
  if (hasSupabaseConfig) {
    await supabase.from('users').upsert({ id: user.id, name: user.name, email: user.email, role: user.role, player_id: user.playerId, club_id: user.clubId });
    return;
  }
  const users = getStorage('users', mockUsers);
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) users[index] = user; else users.push(user);
  setStorage('users', users);
};

// --- CLUBS & TEAMS ---
export const getClub = async (clubId: string): Promise<Club | null> => {
  if (hasSupabaseConfig) {
    const { data } = await supabase.from('clubs').select('*').eq('id', clubId).single();
    return data;
  }
  const clubs = getStorage('clubs', mockClubs);
  return clubs.find(c => c.id === clubId) || null;
};

export const getTeams = async (clubId: string): Promise<Team[]> => {
  if (hasSupabaseConfig) {
    const { data } = await supabase.from('teams').select('*').eq('club_id', clubId);
    return (data || []).map(t => ({ id: t.id, clubId: t.club_id, name: t.name, category: t.category, gender: t.gender }));
  }
  const teams = getStorage('teams', mockTeams);
  return teams.filter(t => t.clubId === clubId);
};

export const createTeam = async (team: Team): Promise<Team> => {
  if (hasSupabaseConfig) {
    await supabase.from('teams').insert({
      id: team.id,
      club_id: team.clubId,
      name: team.name,
      category: team.category,
      gender: team.gender
    });
    return team;
  }
  const teams = getStorage('teams', mockTeams);
  teams.push(team);
  setStorage('teams', teams);
  return team;
};

// --- PLAYERS ---
export const getTeamPlayers = async (teamId: string, clubId: string): Promise<Player[]> => {
  if (hasSupabaseConfig) {
    const { data } = await supabase.from('players').select('*').eq('team_id', teamId).eq('club_id', clubId);
    return (data || []).map(p => ({
      id: p.id, teamId: p.team_id, clubId: p.club_id, firstName: p.first_name, lastName: p.last_name,
      position: p.position, shirtNumber: p.shirt_number, height: p.height, avatarUrl: p.avatar_url,
      averageRating: Number(p.average_rating || 0), region: p.region, category: p.category,
      matchesPlayed: p.matches_played || 0, trend: p.trend
    }));
  }
  const players = getStorage('players', mockPlayers);
  return players.filter(p => p.teamId === teamId && p.clubId === clubId);
};

export const getPlayerById = async (playerId: string): Promise<Player | null> => {
  if (hasSupabaseConfig) {
    const { data } = await supabase.from('players').select('*').eq('id', playerId).single();
    if (!data) return null;
    return {
      id: data.id, teamId: data.team_id, clubId: data.club_id, firstName: data.first_name, lastName: data.last_name,
      position: data.position, shirtNumber: data.shirt_number, height: data.height, avatarUrl: data.avatar_url,
      averageRating: Number(data.average_rating || 0), region: data.region, category: data.category,
      matchesPlayed: data.matches_played || 0, trend: data.trend
    };
  }
  const players = getStorage('players', mockPlayers);
  return players.find(p => p.id === playerId) || null;
};

export const createPlayer = async (player: Player): Promise<Player> => {
  if (hasSupabaseConfig) {
    await supabase.from('players').insert({
      id: player.id, team_id: player.teamId, club_id: player.clubId, first_name: player.firstName, last_name: player.lastName,
      position: player.position, shirt_number: player.shirtNumber, height: player.height, avatar_url: player.avatarUrl,
      average_rating: player.averageRating, region: player.region, category: player.category, matches_played: player.matchesPlayed, trend: player.trend
    });
    return player;
  }
  const players = getStorage('players', mockPlayers);
  players.push(player);
  setStorage('players', players);
  return player;
};

export const updatePlayer = async (player: Player): Promise<Player> => {
  if (hasSupabaseConfig) {
    await supabase.from('players').update({
      team_id: player.teamId, club_id: player.clubId, first_name: player.firstName, last_name: player.lastName,
      position: player.position, shirt_number: player.shirtNumber, height: player.height, avatar_url: player.avatarUrl,
      average_rating: player.averageRating, region: player.region, category: player.category, matches_played: player.matchesPlayed, trend: player.trend
    }).eq('id', player.id);
    return player;
  }
  const players = getStorage('players', mockPlayers);
  const index = players.findIndex(p => p.id === player.id);
  if (index >= 0) {
    players[index] = player;
    setStorage('players', players);
  }
  return player;
};

// --- MATCHES ---
export const getMatches = async (teamId: string, clubId: string): Promise<Match[]> => {
  if (hasSupabaseConfig) {
    const { data } = await supabase.from('matches').select('*').eq('team_id', teamId).eq('club_id', clubId).order('date', { ascending: false });
    return (data || []).map(m => ({
      id: m.id, teamId: m.team_id, clubId: m.club_id, opponentName: m.opponent_name, date: m.date,
      location: m.location, isHome: m.is_home, competition: m.competition, status: m.status, result: m.result
    }));
  }
  const matches = getStorage('matches', mockMatches);
  return matches.filter(m => m.teamId === teamId && m.clubId === clubId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getMatchById = async (matchId: string): Promise<Match | null> => {
  if (hasSupabaseConfig) {
    const { data } = await supabase.from('matches').select('*').eq('id', matchId).single();
    if (!data) return null;
    return {
      id: data.id, teamId: data.team_id, clubId: data.club_id, opponentName: data.opponent_name, date: data.date,
      location: data.location, isHome: data.is_home, competition: data.competition, status: data.status, result: data.result
    };
  }
  const matches = getStorage('matches', mockMatches);
  return matches.find(m => m.id === matchId) || null;
};

export const createMatch = async (match: Match): Promise<Match> => {
  if (hasSupabaseConfig) {
    await supabase.from('matches').insert({
      id: match.id, team_id: match.teamId, club_id: match.clubId, opponent_name: match.opponentName, date: match.date,
      location: match.location, is_home: match.isHome, competition: match.competition, status: match.status, result: match.result
    });
    return match;
  }
  const matches = getStorage('matches', mockMatches);
  matches.push(match);
  setStorage('matches', matches);
  return match;
};

export const updateMatch = async (match: Match): Promise<Match> => {
  if (hasSupabaseConfig) {
    await supabase.from('matches').update({
      team_id: match.teamId, club_id: match.clubId, opponent_name: match.opponentName, date: match.date,
      location: match.location, is_home: match.isHome, competition: match.competition, status: match.status, result: match.result
    }).eq('id', match.id);
    return match;
  }
  const matches = getStorage('matches', mockMatches);
  const index = matches.findIndex(m => m.id === match.id);
  if (index >= 0) {
    matches[index] = match;
    setStorage('matches', matches);
  }
  return match;
};

// --- GAME EVENTS ---
export const getMatchEvents = async (matchId: string): Promise<GameEvent[]> => {
  if (hasSupabaseConfig) {
    const { data } = await supabase.from('game_events').select('*').eq('match_id', matchId).order('timestamp', { ascending: true });
    return (data || []).map(e => ({
      id: e.id, matchId: e.match_id, timestamp: Number(e.timestamp), eventType: e.event_type, setNumber: e.set_number,
      playerId: e.player_id, fundamental: e.fundamental, outcome: e.outcome, subInPlayerId: e.sub_in_player_id,
      subOutPlayerId: e.sub_out_player_id, isImportantPoint: e.is_important_point, isDecisivePoint: e.is_decisive_point,
      startingLineup: e.starting_lineup, adjustmentData: e.adjustment_data
    }));
  }
  const events = getStorage<GameEvent>('game_events', []);
  return events.filter(e => e.matchId === matchId).sort((a, b) => a.timestamp - b.timestamp);
};

export const appendMatchEvent = async (matchId: string, event: GameEvent): Promise<void> => {
  if (hasSupabaseConfig) {
    await supabase.from('game_events').insert({
      id: event.id, match_id: matchId, timestamp: event.timestamp, event_type: event.eventType, set_number: event.setNumber,
      player_id: event.playerId, fundamental: event.fundamental, outcome: event.outcome, sub_in_player_id: event.subInPlayerId,
      sub_out_player_id: event.subOutPlayerId, is_important_point: event.isImportantPoint, is_decisive_point: event.isDecisivePoint,
      starting_lineup: event.startingLineup, adjustment_data: event.adjustmentData
    });
    return;
  }
  const events = getStorage<GameEvent>('game_events', []);
  events.push({ ...event, matchId });
  setStorage('game_events', events);
};

export const deleteMatchEvent = async (matchId: string, eventId: string): Promise<void> => {
  if (hasSupabaseConfig) {
    await supabase.from('game_events').delete().eq('id', eventId).eq('match_id', matchId);
    return;
  }
  const events = getStorage<GameEvent>('game_events', []);
  const filtered = events.filter(e => !(e.id === eventId && e.matchId === matchId));
  setStorage('game_events', filtered);
};

// --- LINEUPS ---
export const getInitialLineupForMatch = async (matchId: string): Promise<MatchLineup | null> => {
  if (hasSupabaseConfig) {
    const { data } = await supabase.from('lineups').select('*').eq('match_id', matchId).single();
    if (!data) return null;
    return { id: data.id, matchId: data.match_id, setNumber: data.set_number, rotationIndex: data.rotation_index, onCourt: data.on_court, liberoId: data.libero_id, benchPlayerIds: data.bench_player_ids };
  }
  const lineups = getStorage<MatchLineup>('lineups', []);
  return lineups.find(l => l.matchId === matchId) || null;
};

export const saveInitialLineup = async (lineup: MatchLineup): Promise<void> => {
  if (hasSupabaseConfig) {
    await supabase.from('lineups').upsert({ id: lineup.id, match_id: lineup.matchId, set_number: lineup.setNumber, rotation_index: lineup.rotationIndex, on_court: lineup.onCourt, libero_id: lineup.liberoId, bench_player_ids: lineup.benchPlayerIds });
    return;
  }
  const lineups = getStorage<MatchLineup>('lineups', []);
  const index = lineups.findIndex(l => l.matchId === lineup.matchId);
  if (index >= 0) lineups[index] = lineup; else lineups.push(lineup);
  setStorage('lineups', lineups);
};

// --- STATS ---
export const savePlayerMatchStats = async (stats: PlayerMatchStats[]): Promise<void> => {
  if (hasSupabaseConfig) {
    const records = stats.map(s => ({
      id: s.id, player_id: s.playerId, match_id: s.matchId, overall_rating: s.rating,
      attacks: s.totals.attacks, attack_points: s.totals.attackPoints, attack_errors: s.totals.attackErrors,
      serves: s.totals.serves, serve_points: s.totals.aces, serve_errors: s.totals.serveErrors,
      blocks: s.totals.blocks, block_points: s.totals.blockPoints, receptions: s.totals.receptions,
      reception_perfect: s.totals.perfectReceptions, reception_errors: s.totals.negativeReceptions, digs: s.totals.digs
    }));
    await supabase.from('player_match_stats').upsert(records);
    return;
  }
  const allStats = getStorage<PlayerMatchStats>('player_match_stats', []);
  stats.forEach(s => {
    const index = allStats.findIndex(existing => existing.id === s.id);
    if (index >= 0) allStats[index] = s; else allStats.push(s);
  });
  setStorage('player_match_stats', allStats);
};

export const getPlayerMatchStats = async (playerId: string): Promise<PlayerMatchStats[]> => {
  if (hasSupabaseConfig) {
    const { data } = await supabase.from('player_match_stats').select('*, matches(*)').eq('player_id', playerId);
    return (data || []).map(s => ({
      id: s.id, matchId: s.match_id, playerId: s.player_id, rating: Number(s.overall_rating || 0), breakdown: { attack: 0, serve: 0, reception: 0, block: 0, defense: 0 },
      totals: { attacks: s.attacks || 0, attackPoints: s.attack_points || 0, attackErrors: s.attack_errors || 0, serves: s.serves || 0, aces: s.serve_points || 0, serveErrors: s.serve_errors || 0, receptions: s.receptions || 0, perfectReceptions: s.reception_perfect || 0, negativeReceptions: s.reception_errors || 0, blocks: s.blocks || 0, blockPoints: s.block_points || 0, digs: s.digs || 0 },
      totalPoints: (s.attack_points || 0) + (s.serve_points || 0) + (s.block_points || 0), errors: (s.attack_errors || 0) + (s.serve_errors || 0), matchDate: s.matches?.date, opponentName: s.matches?.opponent_name
    }));
  }
  const allStats = getStorage<PlayerMatchStats>('player_match_stats', []);
  return allStats.filter(s => s.playerId === playerId);
};

export const getLeaderboard = async (filters: { role: string; region: string; clubId: string }): Promise<Player[]> => {
  if (hasSupabaseConfig) {
    let query = supabase.from('players').select('*');
    if (filters.role !== 'all') query = query.eq('position', filters.role);
    if (filters.region !== 'all') query = query.eq('region', filters.region);
    if (filters.clubId !== 'all') query = query.eq('club_id', filters.clubId);
    const { data } = await query.order('average_rating', { ascending: false }).limit(50);
    return (data || []).map(p => ({
      id: p.id, teamId: p.team_id, clubId: p.club_id, firstName: p.first_name, lastName: p.last_name,
      position: p.position, shirtNumber: p.shirt_number, height: p.height, avatarUrl: p.avatar_url,
      averageRating: Number(p.average_rating || 0), region: p.region, category: p.category, matchesPlayed: p.matches_played || 0, trend: p.trend
    }));
  }
  let players = getStorage('players', mockPlayers);
  if (filters.role !== 'all') players = players.filter(p => p.position === filters.role);
  if (filters.region !== 'all') players = players.filter(p => p.region === filters.region);
  if (filters.clubId !== 'all') players = players.filter(p => p.clubId === filters.clubId);
  return players.sort((a, b) => b.averageRating - a.averageRating).slice(0, 50);
};
