
import { GameEvent, MatchLineup, CourtPosition, RotationImpact, OutcomeCode } from '../../types';

// --- TYPES ---
export interface DerivedMatchState {
  currentSet: number;
  teamPoints: number;
  opponentPoints: number;
  currentLineup: MatchLineup;
  servingSide: 'us' | 'them';
  isSetFinished: boolean;
  setWinner: 'us' | 'them' | null;
  history: GameEvent[]; // The full log used to derive this
  setsWonUs: number;
  setsWonThem: number;
  timeoutsUsedUs: number;
  timeoutsUsedThem: number;
  subsUsedUs: number;
  subsUsedThem: number;
}

export interface EngineOptions {
  matchIsHome: boolean;
}

// --- HELPERS ---

const getImpact = (outcome?: OutcomeCode): RotationImpact => {
  if (!outcome) return 'neutral';
  if (['attack_point', 'serve_ace', 'block_point', 'attack_tool', 'opponent_error'].includes(outcome)) return 'point_for_us';
  if (['serve_error', 'attack_error', 'reception_ace_conceded', 'block_invasion', 'net_fault', 'reception_slash', 'rotation_fault', 'block_late_miss', 'attack_blocked', 'opponent_point', 'generic_error'].includes(outcome)) return 'point_for_them';
  if (outcome === 'card_red') return 'card_red'; // TODO: Handle red card points
  return 'neutral';
};

const rotateLineup = (lineup: MatchLineup): MatchLineup => {
  const nextPosMap: Record<number, CourtPosition> = {
    1: 6, 6: 5, 5: 4, 4: 3, 3: 2, 2: 1
  };
  const nextOnCourt = lineup.onCourt.map(slot => ({
    ...slot,
    position: nextPosMap[slot.position]
  }));
  return {
    ...lineup,
    onCourt: nextOnCourt,
    rotationIndex: lineup.rotationIndex + 1
  };
};

const substitutePlayer = (lineup: MatchLineup, inId: string, outId: string): MatchLineup => {
  const isOnCourt = lineup.onCourt.find(s => s.playerId === outId);
  if (!isOnCourt) return lineup;

  const newOnCourt = lineup.onCourt.map(s => s.playerId === outId ? { ...s, playerId: inId } : s);
  const newBench = lineup.benchPlayerIds.filter(id => id !== inId);
  newBench.push(outId);

  return {
    ...lineup,
    onCourt: newOnCourt,
    benchPlayerIds: newBench
  };
};

const checkSetWin = (us: number, them: number, setNum: number): 'us' | 'them' | null => {
  const target = setNum === 5 ? 15 : 25;
  if (us >= target && us - them >= 2) return 'us';
  if (them >= target && them - us >= 2) return 'them';
  return null;
};

// --- CORE REDUCER ---

export const reduceMatchState = (
  events: GameEvent[], 
  initialLineup: MatchLineup, 
  options: EngineOptions
): DerivedMatchState => {
  
  // 1. Initialize State
  let state: DerivedMatchState = {
    currentSet: 1,
    teamPoints: 0,
    opponentPoints: 0,
    currentLineup: { ...initialLineup, setNumber: 1 },
    servingSide: options.matchIsHome ? 'us' : 'them',
    isSetFinished: false,
    setWinner: null,
    history: events,
    setsWonUs: 0,
    setsWonThem: 0,
    timeoutsUsedUs: 0,
    timeoutsUsedThem: 0,
    subsUsedUs: 0,
    subsUsedThem: 0
  };

  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

  for (const event of sortedEvents) {
    
    // --- 1. SET MANAGEMENT ---
    if (event.eventType === 'set_start') {
        // Explicit new set start
        state.currentSet = event.setNumber;
        state.teamPoints = 0;
        state.opponentPoints = 0;
        state.isSetFinished = false;
        state.setWinner = null;
        
        if (event.startingLineup) {
            state.currentLineup = { ...event.startingLineup, setNumber: event.setNumber };
        } else {
            // Fallback to initial lineup
            state.currentLineup = { ...initialLineup, setNumber: event.setNumber };
        }
        
        // Reset counters for new set
        state.timeoutsUsedUs = 0;
        state.timeoutsUsedThem = 0;
        state.subsUsedUs = 0;
        state.subsUsedThem = 0;

        // Logic: Who serves next? Usually loser of previous set, or alternating.
        // For MVP we can toggle based on set number relative to home/away
        const isOddSet = event.setNumber % 2 !== 0;
        state.servingSide = (isOddSet === options.matchIsHome) ? 'us' : 'them';
        continue;
    }

    // --- 2. SUBSTITUTIONS ---
    if (event.eventType === 'sub' && event.subInPlayerId && event.subOutPlayerId) {
        state.currentLineup = substitutePlayer(state.currentLineup, event.subInPlayerId, event.subOutPlayerId);
        state.subsUsedUs++; // Assuming we only track our subs for now
        continue;
    }

    // --- 3. TIMEOUTS ---
    if (event.eventType === 'timeout') {
        // We need to know WHO took the timeout. 
        // For now, let's assume if it's logged, it's US unless specified otherwise.
        // Ideally GameEvent should have a 'team' field for timeouts.
        // Let's assume 'us' for now as we don't have a way to log opponent timeouts yet.
        state.timeoutsUsedUs++;
        continue;
    }

    // --- 4. MANUAL ADJUSTMENTS (For corrections without logic) ---
    if (event.eventType === 'manual_adjustment' && event.adjustmentData) {
        if (event.adjustmentData.newScoreTeam !== undefined) state.teamPoints = event.adjustmentData.newScoreTeam;
        if (event.adjustmentData.newScoreOpponent !== undefined) state.opponentPoints = event.adjustmentData.newScoreOpponent;
        
        // Check win condition after manual adjustment
        const winner = checkSetWin(state.teamPoints, state.opponentPoints, state.currentSet);
        if (winner) {
            state.isSetFinished = true;
            state.setWinner = winner;
            if (winner === 'us') state.setsWonUs++;
            else state.setsWonThem++;
        }
        continue;
    }

    // --- 5. ROTATION UPDATE ---
    if (event.eventType === 'rotation_update' && event.adjustmentData?.rotationSteps) {
        const steps = event.adjustmentData.rotationSteps;
        // Positive = Clockwise (standard rotation)
        // Negative = Counter-Clockwise (undo rotation)
        
        let newLineup = { ...state.currentLineup };
        
        if (steps > 0) {
            for (let i = 0; i < steps; i++) {
                newLineup = rotateLineup(newLineup);
            }
        } else if (steps < 0) {
            for (let i = 0; i < Math.abs(steps); i++) {
                // Inverse rotation logic
                const prevPosMap: Record<number, CourtPosition> = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 1 };
                const nextOnCourt = newLineup.onCourt.map(slot => ({
                    ...slot,
                    position: prevPosMap[slot.position]
                }));
                newLineup = {
                    ...newLineup,
                    onCourt: nextOnCourt,
                    rotationIndex: newLineup.rotationIndex - 1
                };
            }
        }
        state.currentLineup = newLineup;
        continue;
    }

    // --- 6. GAME ACTIONS ---
    if (event.eventType === 'game' && event.outcome) {
        // If set is already finished, ignore game events until set_start
        if (state.isSetFinished) continue;

        const impact = getImpact(event.outcome);

        if (impact === 'point_for_us') {
            state.teamPoints++;
            
            // SIDE-OUT LOGIC:
            // We only rotate if we win a point while NOT serving.
            if (state.servingSide === 'them') {
                state.currentLineup = rotateLineup(state.currentLineup);
                state.servingSide = 'us';
            }
            // If we were serving, we keep serving (no rotation).
        } 
        else if (impact === 'point_for_them') {
            state.opponentPoints++;
            state.servingSide = 'them'; 
            // We assume opponent rotates if they side-out, but we don't track their lineup.
        }

        // Check Set End Condition immediately after point
        const winner = checkSetWin(state.teamPoints, state.opponentPoints, state.currentSet);
        if (winner) {
            state.isSetFinished = true;
            state.setWinner = winner;
            if (winner === 'us') state.setsWonUs++;
            else state.setsWonThem++;
        }
    }
  }

  return state;
};
