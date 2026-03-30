import { GameEvent, PlayerPosition } from '../types';
import { computeVolleyRating } from './ratingSystem';

/**
 * Calculates live ratings for a list of players based on the current stack of events.
 * Used in the Scouting interface to show real-time performance on the court.
 * 
 * @param events All events recorded in the current match so far
 * @param playersById Map of players to get their roles (needed for the rating engine)
 * @returns Map of { [playerId]: { rating: number } }
 */
export function computeLiveRatingsForMatch(
  events: GameEvent[],
  playersById: Record<string, { position: PlayerPosition }>
): Record<string, { rating: number }> {
  
  // 1. Group events by playerId
  const eventsByPlayer: Record<string, GameEvent[]> = {};
  
  events.forEach(event => {
    if (!eventsByPlayer[event.playerId]) {
      eventsByPlayer[event.playerId] = [];
    }
    eventsByPlayer[event.playerId].push(event);
  });

  // 2. Compute rating for each player found in the map
  const results: Record<string, { rating: number }> = {};

  Object.keys(playersById).forEach(playerId => {
    const playerEvents = eventsByPlayer[playerId] || [];
    const playerContext = playersById[playerId];

    if (playerEvents.length === 0) {
      // Default starting rating
      results[playerId] = { rating: 6.0 }; 
    } else {
      const { rating } = computeVolleyRating(playerEvents, { role: playerContext.position });
      results[playerId] = { rating };
    }
  });

  return results;
}