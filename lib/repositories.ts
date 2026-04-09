import type { Club, GameEvent, Match, MatchLineup, Player, PlayerMatchStats, Team, User } from '../types';
import {
  getUser,
  createUser,
  getClub,
  getTeams,
  getTeamPlayers,
  getPlayerById,
  createPlayer,
  updatePlayer,
  getMatches,
  getMatchById,
  createMatch,
  updateMatch,
  getMatchEvents,
  appendMatchEvent,
  deleteMatchEvent,
  getInitialLineupForMatch,
  saveInitialLineup,
  savePlayerMatchStats,
  getPlayerMatchStats,
  getLeaderboard,
} from '../services/dbService';

const hasSupabaseConfig =
  !!import.meta.env.VITE_SUPABASE_URL &&
  !!import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !String(import.meta.env.VITE_SUPABASE_URL).includes('placeholder');

export const useSupabase = hasSupabaseConfig;

export const authRepository = {
  getUser: async (userId: string): Promise<User | null> => getUser(userId),
  createUser: async (user: User): Promise<void> => createUser(user),
};

export const clubRepository = {
  getClub: async (clubId: string): Promise<Club | null> => getClub(clubId),
};

export const teamRepository = {
  getTeams: async (clubId: string): Promise<Team[]> => getTeams(clubId),
};

export const playerRepository = {
  getTeamPlayers: async (teamId: string, clubId: string): Promise<Player[]> => getTeamPlayers(teamId, clubId),
  getPlayerById: async (playerId: string): Promise<Player | null> => getPlayerById(playerId),
  createPlayer: async (player: Player): Promise<Player> => createPlayer(player),
  updatePlayer: async (player: Player): Promise<Player> => updatePlayer(player),
  getLeaderboard: async (filters: { role: string; region: string; clubId: string }): Promise<Player[]> => getLeaderboard(filters),
};

export const matchRepository = {
  getMatches: async (teamId: string, clubId: string): Promise<Match[]> => getMatches(teamId, clubId),
  getMatchById: async (matchId: string): Promise<Match | null> => getMatchById(matchId),
  createMatch: async (match: Match): Promise<Match> => createMatch(match),
  updateMatch: async (match: Match): Promise<Match> => updateMatch(match),
};

export const matchEventRepository = {
  getMatchEvents: async (matchId: string): Promise<GameEvent[]> => getMatchEvents(matchId),
  appendMatchEvent: async (matchId: string, event: GameEvent): Promise<void> => appendMatchEvent(matchId, event),
  deleteMatchEvent: async (matchId: string, eventId: string): Promise<void> => deleteMatchEvent(matchId, eventId),
};

export const lineupRepository = {
  getInitialLineupForMatch: async (matchId: string): Promise<MatchLineup | null> => getInitialLineupForMatch(matchId),
  saveInitialLineup: async (lineup: MatchLineup): Promise<void> => saveInitialLineup(lineup),
};

export const statsRepository = {
  savePlayerMatchStats: async (stats: PlayerMatchStats[]): Promise<void> => savePlayerMatchStats(stats),
  getPlayerMatchStats: async (playerId: string): Promise<PlayerMatchStats[]> => getPlayerMatchStats(playerId),
};
