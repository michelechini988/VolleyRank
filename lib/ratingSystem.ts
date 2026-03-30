
import { GameEvent, Fundamental, OutcomeCode, PlayerPosition } from '../types';

interface RatingContext {
  role: PlayerPosition;
}

interface RatingResult {
  rating: number;
  breakdown: {
    attack: number;
    serve: number;
    reception: number;
    block: number;
    defense: number;
  };
}

// --- CONFIGURATION ---
const BASE_RATING = 6.0;
const MIN_RATING = 3.5;
const MAX_RATING = 10.0;

/**
 * Base score values for each specific outcome.
 * Positive values increase rating, negative values decrease it.
 */
const SCORE_VALUES: Record<OutcomeCode, number> = {
  // Attack
  'attack_point': 0.35,
  'attack_blocked': -0.30,
  'attack_error': -0.40,
  'attack_defended': 0.05, 
  'attack_tool': 0.35,

  // Serve
  'serve_ace': 0.40,
  'serve_good_pressure': 0.15,
  'serve_in_play': 0.0,
  'serve_error': -0.25,

  // Reception
  'reception_perfect': 0.15,
  'reception_positive': 0.08,
  'reception_negative': -0.10,
  'reception_ace_conceded': -0.40,
  'reception_slash': -0.25,

  // Block
  'block_point': 0.40,
  'block_touch': 0.10,
  'block_late_miss': -0.10,
  'block_invasion': -0.20,

  // Defense
  'defense_great': 0.25,
  'defense_ok': 0.05,
  'defense_error': -0.15,
  'defense_cover': 0.05,

  // Other
  'net_fault': -0.20,
  'rotation_fault': -0.20,
  'card_yellow': -0.30,
  'card_red': -0.60,
  'generic_error': -0.20,
  'sub_in': 0, // Ignored
  'opponent_point': 0, // Ignored for player rating
  'opponent_error': 0, // Ignored for player rating
};

const ROLE_MULTIPLIERS: Record<PlayerPosition, Partial<Record<Fundamental, number>>> = {
  [PlayerPosition.LIBERO]: {
    [Fundamental.RECEPTION]: 1.2,
    [Fundamental.DEFENSE]: 1.3,
    [Fundamental.ATTACK]: 0,
    [Fundamental.SERVE]: 0,
    [Fundamental.BLOCK]: 0
  },
  [PlayerPosition.SETTER]: {
    [Fundamental.SERVE]: 1.1,
    [Fundamental.BLOCK]: 1.1,
    [Fundamental.DEFENSE]: 1.1,
    [Fundamental.ATTACK]: 1.5
  },
  [PlayerPosition.MIDDLE_BLOCKER]: {
    [Fundamental.BLOCK]: 1.2,
    [Fundamental.ATTACK]: 1.1,
    [Fundamental.DEFENSE]: 0.9,
    [Fundamental.RECEPTION]: 0.5
  },
  [PlayerPosition.OUTSIDE_HITTER]: {
    [Fundamental.ATTACK]: 1.0,
    [Fundamental.RECEPTION]: 1.1,
    [Fundamental.SERVE]: 1.0,
    [Fundamental.BLOCK]: 1.0
  },
  [PlayerPosition.OPPOSITE]: {
    [Fundamental.ATTACK]: 1.2,
    [Fundamental.SERVE]: 1.1,
    [Fundamental.BLOCK]: 1.1,
    [Fundamental.RECEPTION]: 0.5
  }
};

export const computeVolleyRating = (events: GameEvent[], context: RatingContext): RatingResult => {
  let deltaTotal = 0;
  
  const breakdown = {
    attack: 0,
    serve: 0,
    reception: 0,
    block: 0,
    defense: 0
  };

  events.forEach(event => {
    // Skip events that are not game actions (e.g. substitutions)
    if (event.eventType !== 'game' || !event.outcome || !event.fundamental) return;

    let score = SCORE_VALUES[event.outcome] || 0;

    // 1. Context Multipliers
    if (event.isDecisivePoint) {
      score *= 1.5;
    } else if (event.isImportantPoint) {
      score *= 1.2;
    }

    // 2. Role Multipliers
    const roleMultipliers = ROLE_MULTIPLIERS[context.role];
    const multiplier = roleMultipliers[event.fundamental] ?? 1.0;
    score *= multiplier;

    // 3. Accumulate
    deltaTotal += score;

    // 4. Breakdown
    switch(event.fundamental) {
      case Fundamental.ATTACK: breakdown.attack += score; break;
      case Fundamental.SERVE: breakdown.serve += score; break;
      case Fundamental.RECEPTION: breakdown.reception += score; break;
      case Fundamental.BLOCK: breakdown.block += score; break;
      case Fundamental.DEFENSE: breakdown.defense += score; break;
    }
  });

  let finalRating = BASE_RATING + deltaTotal;
  finalRating = Math.max(MIN_RATING, Math.min(MAX_RATING, finalRating));
  finalRating = Math.round(finalRating * 10) / 10;

  return {
    rating: finalRating,
    breakdown
  };
};
