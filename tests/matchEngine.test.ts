import test from 'node:test';
import assert from 'node:assert/strict';

import { reduceMatchState } from '../lib/engine/matchEngine';
import { Fundamental, type GameEvent, type MatchLineup } from '../types';

const initialLineup: MatchLineup = {
  id: 'lineup-1',
  matchId: 'm1',
  setNumber: 1,
  rotationIndex: 0,
  onCourt: [
    { position: 1, playerId: 'p1' },
    { position: 2, playerId: 'p2' },
    { position: 3, playerId: 'p3' },
    { position: 4, playerId: 'p4' },
    { position: 5, playerId: 'p5' },
    { position: 6, playerId: 'p6' },
  ],
  benchPlayerIds: ['p7'],
};

const gameEvent = (id: string, outcome: GameEvent['outcome'], timestamp: number): GameEvent => ({
  id,
  matchId: 'm1',
  timestamp,
  eventType: 'game',
  setNumber: 1,
  playerId: 'p1',
  fundamental: Fundamental.ATTACK,
  outcome,
});

test('reduceMatchState counts points for us and them', () => {
  const events: GameEvent[] = [
    gameEvent('e1', 'attack_point', 1),
    gameEvent('e2', 'serve_error', 2),
  ];

  const state = reduceMatchState(events, initialLineup, { matchIsHome: true });

  assert.equal(state.teamPoints, 1);
  assert.equal(state.opponentPoints, 1);
});

test('reduceMatchState tracks substitutions', () => {
  const sub: GameEvent = {
    id: 's1',
    matchId: 'm1',
    timestamp: 1,
    eventType: 'sub',
    setNumber: 1,
    subInPlayerId: 'p7',
    subOutPlayerId: 'p1',
  };

  const state = reduceMatchState([sub], initialLineup, { matchIsHome: true });

  assert.equal(state.subsUsedUs, 1);
  assert.ok(state.currentLineup.onCourt.some((s) => s.playerId === 'p7'));
  assert.ok(state.currentLineup.benchPlayerIds.includes('p1'));
});
