import type { Club, GameEvent, Match, MatchLineup, Player, PlayerMatchStats, Team, User } from '../types';
import * as db from '../services/dbService';
import { hasSupabaseConfig } from '../supabase';

export { hasSupabaseConfig as useSupabase };

export const authRepository = {
  getUser: async (userId: string): Promise<User | null> => db.getUser(userId),
  createUser: async (user: User): Promise<void> => db.createUser(user),
};

export const clubRepository = {
  getClub: async (clubId: string): Promise<Club | null> => db.getClub(clubId),
};

export const teamRepository = {
  getTeams: async (clubId: string): Promise<Team[]> => db.getTeams(clubId),
};

export const playerRepository = {
  getTeamPlayers: async (teamId: string, clubId: string): Promise<Player[]> => db.getTeamPlayers(teamId, clubId),
  getPlayerById: async (playerId: string): Promise<Player | null> => db.getPlayerById(playerId),
  createPlayer: async (player: Player): Promise<Player> => db.createPlayer(player),
  updatePlayer: async (player: Player): Promise<Player> => db.updatePlayer(player),
  getLeaderboard: async (filters: { role: string; region: string; clubId: string }): Promise<Player[]> => db.getLeaderboard(filters),
};

export const matchRepository = {
  getMatches: async (teamId: string, clubId: string): Promise<Match[]> => db.getMatches(teamId, clubId),
  getMatchById: async (matchId: string): Promise<Match | null> => db.getMatchById(matchId),
  createMatch: async (match: Match): Promise<Match> => db.createMatch(match),
  updateMatch: async (match: Match): Promise<Match> => db.updateMatch(match),
};

export const matchEventRepository = {
  getMatchEvents: async (matchId: string): Promise<GameEvent[]> => db.getMatchEvents(matchId),
  appendMatchEvent: async (matchId: string, event: GameEvent): Promise<void> => db.appendMatchEvent(matchId, event),
  deleteMatchEvent: async (matchId: string, eventId: string): Promise<void> => db.deleteMatchEvent(matchId, eventId),
};

export const lineupRepository = {
  getInitialLineupForMatch: async (matchId: string): Promise<MatchLineup | null> => db.getInitialLineupForMatch(matchId),
  saveInitialLineup: async (lineup: MatchLineup): Promise<void> => db.saveInitialLineup(lineup),
};

export const statsRepository = {
  savePlayerMatchStats: async (stats: PlayerMatchStats[]): Promise<void> => db.savePlayerMatchStats(stats),
  getPlayerMatchStats: async (playerId: string): Promise<PlayerMatchStats[]> => db.getPlayerMatchStats(playerId),
};
