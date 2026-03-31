
import { GameEvent } from '../../types';
import { matchEventRepository } from '../repositories';

// In-memory cache for fast UI updates
const memoryStore: Record<string, GameEvent[]> = {};

export const eventStore = {
  
  getEvents: (matchId: string): GameEvent[] => {
    return memoryStore[matchId] || [];
  },

  // Async version for initial load
  loadEventsAsync: async (matchId: string): Promise<GameEvent[]> => {
      try {
          const events = await matchEventRepository.getMatchEvents(matchId);
          memoryStore[matchId] = events;
          return events;
      } catch (e) {
          console.error("Failed to load events", e);
          return memoryStore[matchId] || [];
      }
  },

  appendEvent: async (matchId: string, event: GameEvent): Promise<GameEvent[]> => {
    const events = eventStore.getEvents(matchId);
    events.push(event);
    
    // Update memory
    memoryStore[matchId] = events;

    try {
      await matchEventRepository.appendMatchEvent(matchId, event);
    } catch (e) {
      console.error("Failed to append event to DB", e);
      // Rollback memory if DB fails
      events.pop();
      memoryStore[matchId] = events;
      throw e;
    }
    
    return events;
  },

  undoLastEvent: async (matchId: string): Promise<GameEvent[]> => {
    const events = eventStore.getEvents(matchId);
    if (events.length === 0) return [];
    
    const lastEvent = events.pop(); // Remove last
    
    if (lastEvent) {
      try {
        await matchEventRepository.deleteMatchEvent(matchId, lastEvent.id);
        // Update memory only if DB succeeds
        memoryStore[matchId] = events;
      } catch (e) {
        console.error("Failed to delete event from DB", e);
        // Rollback memory if DB fails
        events.push(lastEvent);
        memoryStore[matchId] = events;
        throw e;
      }
    }
    
    return events;
  },

  clearEvents: (matchId: string) => {
      delete memoryStore[matchId];
      // Note: We don't clear from DB here to prevent accidental data loss.
      // A separate admin function should handle full match deletion.
  }
};
