import test from 'node:test';
import assert from 'node:assert/strict';

import { computeVolleyRating } from '../lib/ratingSystem';
import { Fundamental, PlayerPosition, type GameEvent } from '../types';

const baseEvent = (overrides: Partial<GameEvent>): GameEvent => ({
  id: 'e1',
  matchId: 'm1',
  timestamp: Date.now(),
  eventType: 'game',
  setNumber: 1,
  playerId: 'p1',
  fundamental: Fundamental.ATTACK,
  outcome: 'attack_point',
  ...overrides,
});

test('computeVolleyRating returns baseline when no events', () => {
  const result = computeVolleyRating([], { role: PlayerPosition.OUTSIDE_HITTER });
  assert.equal(result.rating, 6.0);
});

test('positive attacking actions increase rating', () => {
  const events: GameEvent[] = [
    baseEvent({ outcome: 'attack_point' }),
    baseEvent({ id: 'e2', outcome: 'attack_tool' }),
  ];

  const result = computeVolleyRating(events, { role: PlayerPosition.OPPOSITE });
  assert.ok(result.rating > 6.0);
  assert.ok(result.breakdown.attack > 0);
});

test('negative actions decrease rating and respects lower bound', () => {
  const events: GameEvent[] = Array.from({ length: 40 }).map((_, i) =>
    baseEvent({ id: `err-${i}`, fundamental: Fundamental.SERVE, outcome: 'serve_error' })
  );

  const result = computeVolleyRating(events, { role: PlayerPosition.SETTER });
  assert.equal(result.rating, 3.5);
});
