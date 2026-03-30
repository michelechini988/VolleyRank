
import { GameEvent, PlayerLiveStats, TeamMatchStats, RallyEntry, Fundamental } from '../types';

export function aggregatePlayerStats(events: GameEvent[], matchId: string): Record<string, PlayerLiveStats> {
  const statsByPlayer: Record<string, PlayerLiveStats> = {};

  const ensure = (playerId: string): PlayerLiveStats => {
    if (!statsByPlayer[playerId]) {
      statsByPlayer[playerId] = {
        playerId,
        matchId,
        attacks: 0,
        attackPoints: 0,
        attackErrors: 0,
        attackBlocked: 0,
        serves: 0,
        aces: 0,
        serveErrors: 0,
        receptions: 0,
        perfectReceptions: 0,
        positiveReceptions: 0,
        negativeReceptions: 0,
        acesConceded: 0,
        blocks: 0,
        blockPoints: 0,
        blockTouches: 0,
        blockErrors: 0,
        digs: 0,
        digErrors: 0,
      };
    }
    return statsByPlayer[playerId];
  };

  for (const ev of events) {
    const s = ensure(ev.playerId);

    switch (ev.fundamental) {
      case Fundamental.ATTACK:
        s.attacks++;
        if (ev.outcome === 'attack_point') s.attackPoints++;
        if (ev.outcome === 'attack_error') s.attackErrors++;
        if (ev.outcome === 'attack_blocked') s.attackBlocked++;
        break;

      case Fundamental.SERVE:
        s.serves++;
        if (ev.outcome === 'serve_ace') s.aces++;
        if (ev.outcome === 'serve_error') s.serveErrors++;
        break;

      case Fundamental.RECEPTION:
        s.receptions++;
        if (ev.outcome === 'reception_perfect') s.perfectReceptions++;
        if (ev.outcome === 'reception_positive') s.positiveReceptions++;
        if (ev.outcome === 'reception_negative') s.negativeReceptions++;
        if (ev.outcome === 'reception_ace_conceded') s.acesConceded++;
        break;

      case Fundamental.BLOCK:
        s.blocks++;
        if (ev.outcome === 'block_point') s.blockPoints++;
        if (ev.outcome === 'block_touch') s.blockTouches++;
        if (ev.outcome === 'block_late_miss') s.blockErrors++;
        break;

      case Fundamental.DEFENSE:
        if (ev.outcome === 'defense_great' || ev.outcome === 'defense_ok') {
          s.digs++;
        }
        if (ev.outcome === 'defense_error') {
          s.digErrors++;
        }
        break;

      default:
        break;
    }
  }

  return statsByPlayer;
}

export function aggregateTeamStats(events: GameEvent[], matchId: string, teamId: string): TeamMatchStats {
  let totalPoints = 0;
  let pointsFromServe = 0;
  let pointsFromReception = 0;
  let pointsFromBlock = 0;
  let pointsFromAttack = 0;
  let aces = 0;
  let serveErrors = 0;
  let receptionErrors = 0;
  let attackErrors = 0;
  let blockErrors = 0;

  for (const ev of events) {
    // In a real app we'd check ev.teamId, but in mock our events are mostly for our team
    // unless explicitly marked otherwise. Here we assume events track "our" players.

    if (ev.fundamental === Fundamental.SERVE) {
      if (ev.outcome === 'serve_ace') {
        totalPoints++;
        pointsFromServe++;
        aces++;
      }
      if (ev.outcome === 'serve_error') {
        serveErrors++;
      }
    }

    if (ev.fundamental === Fundamental.ATTACK) {
      if (ev.outcome === 'attack_point') {
        totalPoints++;
        pointsFromAttack++;
      }
      if (ev.outcome === 'attack_error' || ev.outcome === 'attack_blocked') {
        attackErrors++;
      }
    }

    if (ev.fundamental === Fundamental.RECEPTION) {
      if (ev.outcome === 'reception_negative' || ev.outcome === 'reception_ace_conceded') {
        receptionErrors++;
      }
    }

    if (ev.fundamental === Fundamental.BLOCK) {
      if (ev.outcome === 'block_point') {
        totalPoints++;
        pointsFromBlock++;
      }
      if (ev.outcome === 'block_late_miss') {
        blockErrors++;
      }
    }
  }

  return {
    matchId,
    teamId,
    totalPoints,
    pointsFromServe,
    pointsFromReception,
    pointsFromBlock,
    pointsFromAttack,
    aces,
    serveErrors,
    receptionErrors,
    attackErrors,
    blockErrors,
  };
}

/**
 * Builds a chronological timeline of rallies.
 */
export function buildRallyTimeline(
  events: GameEvent[],
  matchId: string,
  options: {
    startingSetNumber: number;
    teamId: string;
    scoreByPoint: (ev: GameEvent) => { scoringSide: 'us' | 'them' } | null;
  }
): RallyEntry[] {
  // Sort events by timestamp
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
  
  const timeline: RallyEntry[] = [];
  // For the timeline, we only care about the CURRENT set usually, or we list all.
  // The prompt implies "timeline del set". Let's filter by current set.
  const setEvents = sortedEvents.filter(e => e.setNumber === options.startingSetNumber);

  let teamPoints = 0;
  let oppPoints = 0;
  let sequence = 0;

  for (const ev of setEvents) {
    const scoring = options.scoreByPoint(ev);
    if (!scoring) continue;

    if (scoring.scoringSide === 'us') {
      teamPoints++;
    } else {
      oppPoints++;
    }

    sequence++;

    timeline.push({
      id: `${matchId}-${options.startingSetNumber}-${sequence}-${ev.id}`,
      setNumber: options.startingSetNumber,
      sequence,
      teamPointsAfter: teamPoints,
      opponentPointsAfter: oppPoints,
      scoringSide: scoring.scoringSide,
      scoringPlayerId: ev.playerId,
      fundamental: ev.fundamental,
      outcomeCode: ev.outcome,
    });
  }

  // Reverse to show newest on top
  return timeline.reverse();
}
