import { Player, Match, GameEvent, PlayerMatchStats, MatchLineup, User, Club, Team } from '../types';
import { mockUsers, mockClubs, mockTeams, mockPlayers, mockMatches } from './mockData';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleSupabaseError(error: unknown, operationType: OperationType, path: string | null) {
  console.error(`Mock DB Error [${operationType}] at ${path}:`, error);
  throw new Error(JSON.stringify({ error, operationType, path }));
}

export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id_' + Math.random().toString(36).substr(2, 9);
};

// --- LOCAL STORAGE HELPERS ---
const getStorage = <T>(key: string, defaultData: T[]): T[] => {
  const data = localStorage.getItem(`volleyrank_${key}`);
  if (!data) {
    localStorage.setItem(`volleyrank_${key}`, JSON.stringify(defaultData));
    return defaultData;
  }
  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(`volleyrank_${key}`, JSON.stringify(defaultData));
      return defaultData;
    }
    // Force load mock data if the array is empty (useful for prototype recovery)
    if (parsed.length === 0 && Array.isArray(defaultData) && defaultData.length > 0) {
        localStorage.setItem(`volleyrank_${key}`, JSON.stringify(defaultData));
        return defaultData;
    }
    return parsed;
  } catch (e) {
    console.error(`Error parsing localStorage key volleyrank_${key}`, e);
    localStorage.setItem(`volleyrank_${key}`, JSON.stringify(defaultData));
    return defaultData;
  }
};

const setStorage = <T>(key: string, data: T[]) => {
  localStorage.setItem(`volleyrank_${key}`, JSON.stringify(data));
};

// --- USERS ---
export const getUser = async (userId: string): Promise<User | null> => {
    const users = getStorage('users', mockUsers);
    return users.find(u => u.id === userId) || null;
};

export const createUser = async (user: User): Promise<void> => {
    const users = getStorage('users', mockUsers);
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
        users[index] = user;
    } else {
        users.push(user);
    }
    setStorage('users', users);
};

// --- CLUBS & TEAMS ---
export const getClub = async (clubId: string): Promise<Club | null> => {
    const clubs = getStorage('clubs', mockClubs);
    return clubs.find(c => c.id === clubId) || null;
};

export const getTeams = async (clubId: string): Promise<Team[]> => {
    const teams = getStorage('teams', mockTeams);
    return teams.filter(t => t.clubId === clubId);
};

// --- PLAYERS ---
export const getTeamPlayers = async (teamId: string, clubId: string): Promise<Player[]> => {
    const players = getStorage('players', mockPlayers);
    return players.filter(p => p.teamId === teamId && p.clubId === clubId);
};

export const getPlayerById = async (playerId: string): Promise<Player | null> => {
    const players = getStorage('players', mockPlayers);
    return players.find(p => p.id === playerId) || null;
};

export const createPlayer = async (player: Player): Promise<Player> => {
    const players = getStorage('players', mockPlayers);
    players.push(player);
    setStorage('players', players);
    return player;
};

export const updatePlayer = async (player: Player): Promise<Player> => {
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
    const matches = getStorage('matches', mockMatches);
    return matches.filter(m => m.teamId === teamId && m.clubId === clubId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const createMatch = async (match: Match): Promise<Match> => {
    const matches = getStorage('matches', mockMatches);
    matches.push(match);
    setStorage('matches', matches);
    return match;
};

export const updateMatch = async (match: Match): Promise<Match> => {
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
    const events = getStorage<GameEvent>('game_events', []);
    return events.filter(e => e.matchId === matchId).sort((a, b) => a.timestamp - b.timestamp);
};

export const appendMatchEvent = async (matchId: string, event: GameEvent): Promise<void> => {
    const events = getStorage<GameEvent>('game_events', []);
    events.push({ ...event, matchId });
    setStorage('game_events', events);
};

export const deleteMatchEvent = async (matchId: string, eventId: string): Promise<void> => {
    const events = getStorage<GameEvent>('game_events', []);
    const filtered = events.filter(e => !(e.id === eventId && e.matchId === matchId));
    setStorage('game_events', filtered);
};

// --- LINEUPS ---
export const getInitialLineupForMatch = async (matchId: string): Promise<MatchLineup | null> => {
    const lineups = getStorage<MatchLineup>('lineups', []);
    return lineups.find(l => l.matchId === matchId) || null;
};

export const saveInitialLineup = async (lineup: MatchLineup): Promise<void> => {
    const lineups = getStorage<MatchLineup>('lineups', []);
    const index = lineups.findIndex(l => l.matchId === lineup.matchId);
    if (index >= 0) {
        lineups[index] = lineup;
    } else {
        lineups.push(lineup);
    }
    setStorage('lineups', lineups);
};

// --- STATS ---
export const savePlayerMatchStats = async (stats: PlayerMatchStats[]): Promise<void> => {
    const allStats = getStorage<PlayerMatchStats>('player_match_stats', []);
    stats.forEach(s => {
        const index = allStats.findIndex(existing => existing.id === s.id);
        if (index >= 0) {
            allStats[index] = s;
        } else {
            allStats.push(s);
        }
    });
    setStorage('player_match_stats', allStats);
};

export const getPlayerMatchStats = async (playerId: string): Promise<PlayerMatchStats[]> => {
    const allStats = getStorage<PlayerMatchStats>('player_match_stats', []);
    return allStats.filter(s => s.playerId === playerId);
};

export const getLeaderboard = async (filters: { role: string; region: string; clubId: string }): Promise<Player[]> => {
    let players = getStorage('players', mockPlayers);
    
    if (filters.role !== 'all') players = players.filter(p => p.position === filters.role);
    if (filters.region !== 'all') players = players.filter(p => p.region === filters.region);
    if (filters.clubId !== 'all') players = players.filter(p => p.clubId === filters.clubId);

    return players.sort((a, b) => b.averageRating - a.averageRating).slice(0, 50);
};
