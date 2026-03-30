
export enum UserRole {
  CLUB_ADMIN = 'club_admin',
  STAFF = 'staff',
  PLAYER = 'player'
}

export enum PlayerPosition {
  SETTER = 'setter',
  OPPOSITE = 'opposite',
  OUTSIDE_HITTER = 'outside_hitter',
  MIDDLE_BLOCKER = 'middle_blocker',
  LIBERO = 'libero'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  playerId?: string;
  clubId: string;
}

export interface Club {
  id: string;
  name: string;
  city: string;
}

export interface Team {
  id: string;
  clubId: string;
  name: string;
  category: string;
  gender: 'M' | 'F';
}

export interface Player {
  id: string;
  teamId: string;
  clubId: string;
  firstName: string;
  lastName: string;
  position: PlayerPosition;
  shirtNumber: number;
  height?: number;
  avatarUrl?: string;
  averageRating: number;
  region: string;
  category: string;
  matchesPlayed: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface Match {
  id: string;
  teamId: string;
  clubId: string;
  opponentName: string;
  date: string;
  location: string;
  isHome: boolean;
  competition: string;
  status: 'scheduled' | 'live' | 'completed';
  result?: string;
}

export interface SetScore {
  setNumber: number;
  teamPoints: number;
  opponentPoints: number;
  isFinished: boolean;
}

// --- SCOUTING & RATING ---

export enum Fundamental {
  ATTACK = 'attack',
  SERVE = 'serve',
  RECEPTION = 'reception',
  BLOCK = 'block',
  DEFENSE = 'defense',
  FREEBALL = 'freeball',
  SET = 'set',
  OTHER = 'other'
}

export type OutcomeCode = 
  | 'attack_point' | 'attack_blocked' | 'attack_error' | 'attack_defended' | 'attack_tool'
  | 'serve_ace' | 'serve_good_pressure' | 'serve_in_play' | 'serve_error'
  | 'reception_perfect' | 'reception_positive' | 'reception_negative' | 'reception_ace_conceded' | 'reception_slash'
  | 'block_point' | 'block_touch' | 'block_late_miss' | 'block_invasion'
  | 'defense_great' | 'defense_ok' | 'defense_error' | 'defense_cover'
  | 'net_fault' | 'rotation_fault' | 'card_yellow' | 'card_red' | 'generic_error'
  | 'opponent_point' | 'opponent_error'
  | 'sub_in'; 

export type EventType = 
  | 'match_start'
  | 'set_start' 
  | 'game' 
  | 'sub' 
  | 'timeout' 
  | 'manual_adjustment' // For fixing score without game logic
  | 'rotation_update'; // For manual rotation correction

export interface GameEvent {
  id: string;
  matchId: string;
  timestamp: number;
  eventType: EventType;
  setNumber: number; // Context at creation time

  // Game Action Payload
  playerId?: string;
  fundamental?: Fundamental;
  outcome?: OutcomeCode;
  
  // Substitution Payload
  subInPlayerId?: string;
  subOutPlayerId?: string;

  // Metadata
  isImportantPoint?: boolean;
  isDecisivePoint?: boolean;
  
  // For set_start
  startingLineup?: MatchLineup;
  
  // For manual adjustments or snapshotting
  adjustmentData?: {
      newScoreTeam?: number;
      newScoreOpponent?: number;
      rotationSteps?: number; // +1 (clockwise) or -1 (counter-clockwise)
  };
}

export type CourtPosition = 1 | 2 | 3 | 4 | 5 | 6;

export interface OnCourtSlot {
  position: CourtPosition;
  playerId: string;
}

export interface MatchLineup {
  id: string;
  matchId: string;
  setNumber: number;
  rotationIndex: number;
  onCourt: OnCourtSlot[];
  liberoId?: string;
  benchPlayerIds: string[];
}

export interface SubstitutionEvent {
  outPlayerId: string;
  inPlayerId: string;
  position: CourtPosition;
  setNumber: number;
  rallyNumber: number;
}

export interface PlayerMatchStats {
  id: string;
  matchId: string;
  playerId: string;
  teamId?: string;
  rating: number;
  breakdown: {
    attack: number;
    serve: number;
    reception: number;
    block: number;
    defense: number;
  };
  totals: {
    attacks: number;
    attackPoints: number;
    attackErrors: number;
    serves: number;
    aces: number;
    serveErrors: number;
    receptions: number;
    perfectReceptions: number;
    negativeReceptions: number;
    blocks: number;
    blockPoints: number;
    digs: number;
  };
  totalPoints: number;
  errors: number;
  matchDate?: string;
  opponentName?: string;
}

// --- COURT & LINEUP ---

export type RotationImpact = 'point_for_us' | 'point_for_them' | 'neutral' | 'card_red';

// --- LIVE STATS ---

export interface PlayerLiveStats {
  playerId: string;
  matchId: string;
  attacks: number;
  attackPoints: number;
  attackErrors: number;
  attackBlocked: number;
  serves: number;
  aces: number;
  serveErrors: number;
  receptions: number;
  perfectReceptions: number;
  positiveReceptions: number;
  negativeReceptions: number;
  acesConceded: number;
  blocks: number;
  blockPoints: number;
  blockTouches: number;
  blockErrors: number;
  digs: number;
  digErrors: number;
}

export interface TeamMatchStats {
  matchId: string;
  teamId: string;
  totalPoints: number;
  pointsFromServe: number;
  pointsFromReception: number;
  pointsFromBlock: number;
  pointsFromAttack: number;
  aces: number;
  serveErrors: number;
  receptionErrors: number;
  attackErrors: number;
  blockErrors: number;
}

export interface RallyEntry {
  id: string;
  setNumber: number;
  sequence: number;
  teamPointsAfter: number;
  opponentPointsAfter: number;
  scoringSide: 'us' | 'them';
  scoringPlayerId?: string;
  fundamental: Fundamental;
  outcomeCode: OutcomeCode;
}
