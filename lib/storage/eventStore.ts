
import { GameEvent } from '../../types';
import { appendMatchEvent, getMatchEvents, deleteMatchEvent } from '../../services/dbService';

// In-memory cache for fast UI updates
const memoryStore: Record<string, GameEvent[]> = {};

export const eventStore = {
  
  getEvents: (matchId: string): GameEvent[] => {
    return memoryStore[matchId] || [];
  },

  // Async version for initial load
  loadEventsAsync: async (matchId: string): Promise<GameEvent[]> => {
      try {
          const events = await getMatchEvents(matchId);
          memoryStore[matchId] = events;
          return events;
      } catch (e) {
          console.error("Failed to load events", e);
          return memoryStore[matchId] || [];
      }
  },

  appendEvent: (matchId: string, event: GameEvent): GameEvent[] => {
    const events = eventStore.getEvents(matchId);
    events.push(event);
    
    // Update memory
    memoryStore[matchId] = events;

    // Fire and forget to DB
    appendMatchEvent(matchId, event).catch(e => console.error("Failed to append event to DB", e));
    
    return events;
  },

  undoLastEvent: (matchId: string): GameEvent[] => {
    const events = eventStore.getEvents(matchId);
    if (events.length === 0) return [];
    
    const lastEvent = events.pop(); // Remove last
    
    // Update memory
    memoryStore[matchId] = events;

    // Fire and forget to DB
    if (lastEvent) {
        deleteMatchEvent(matchId, lastEvent.id).catch(e => console.error("Failed to delete event from DB", e));
    }
    
    return events;
  },

  clearEvents: (matchId: string) => {
      delete memoryStore[matchId];
      // Note: We don't clear from DB here to prevent accidental data loss.
      // A separate admin function should handle full match deletion.
  }
};
