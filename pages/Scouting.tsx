
import React, { useState, useEffect, useMemo } from 'react';
import { Match, Player, Fundamental, OutcomeCode, GameEvent, User, MatchLineup, CourtPosition, PlayerPosition, RotationImpact, PlayerMatchStats } from '../types';
import { generateId, updateMatch, getMatches, getTeamPlayers, savePlayerMatchStats, getInitialLineupForMatch } from '../services/dbService';
import { reduceMatchState } from '../lib/engine/matchEngine';
import { computeVolleyRating } from '../lib/ratingSystem';
import { eventStore } from '../lib/storage/eventStore';
import { Button } from '../components/ui/Buttons';

interface ScoutingProps {
  matchId: string;
  user: User;
  onFinished: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

// --- CONFIG (Visual only) ---
type OutcomeConfig = {
  code: OutcomeCode;
  label: string;
  symbol: string;
  rotationImpact: RotationImpact;
};
type FundamentalConfig = { label: string; outcomes: OutcomeConfig[]; };
const FUNDAMENTAL_CONFIG: Record<Fundamental, FundamentalConfig> = {
  serve: {
    label: 'Battuta',
    outcomes: [
      { code: 'serve_ace',          label: 'Ace',             symbol: '++', rotationImpact: 'point_for_us' },
      { code: 'serve_good_pressure',label: 'Spin/Forzata',    symbol: '+',  rotationImpact: 'point_for_us' },
      { code: 'serve_in_play',      label: 'In gioco',        symbol: '/',  rotationImpact: 'neutral' },
      { code: 'serve_error',        label: 'Errore',          symbol: '=', rotationImpact: 'point_for_them' },
    ],
  },
  reception: {
    label: 'Ricezione',
    outcomes: [
      { code: 'reception_perfect',         label: 'Perfetta (#)', symbol: '#', rotationImpact: 'neutral' },
      { code: 'reception_positive',        label: 'Positiva (+)', symbol: '+',  rotationImpact: 'neutral' },
      { code: 'reception_negative',        label: 'Staccata (-)', symbol: '-',  rotationImpact: 'point_for_them' },
      { code: 'reception_slash',           label: 'Slash (/)',    symbol: '/',  rotationImpact: 'point_for_them' },
      { code: 'reception_ace_conceded',    label: 'Ace Subito',   symbol: '=', rotationImpact: 'point_for_them' },
    ],
  },
  attack: {
    label: 'Attacco',
    outcomes: [
      { code: 'attack_point',   label: 'Terra',    symbol: '#', rotationImpact: 'point_for_us' },
      { code: 'attack_tool',    label: 'Mani-out', symbol: '+', rotationImpact: 'point_for_us' },
      { code: 'attack_defended',label: 'Difeso',   symbol: '/',  rotationImpact: 'neutral' },
      { code: 'attack_blocked', label: 'Murato',   symbol: '=',  rotationImpact: 'point_for_them' },
      { code: 'attack_error',   label: 'Out/Rete', symbol: '=', rotationImpact: 'point_for_them' },
    ],
  },
  block: {
    label: 'Muro',
    outcomes: [
      { code: 'block_point',   label: 'Muro Punto', symbol: '#', rotationImpact: 'point_for_us' },
      { code: 'block_touch',   label: 'Tocco',      symbol: '+',  rotationImpact: 'neutral' },
      { code: 'block_late_miss', label: 'Fuori Tempo', symbol: '-', rotationImpact: 'point_for_them' },
      { code: 'block_invasion', label: 'Invasione',  symbol: '=', rotationImpact: 'point_for_them' },
    ],
  },
  defense: {
    label: 'Difesa',
    outcomes: [
      { code: 'defense_great', label: 'Perfetta', symbol: '#', rotationImpact: 'neutral' },
      { code: 'defense_ok',    label: 'Tenuta',  symbol: '+', rotationImpact: 'neutral' },
      { code: 'defense_cover', label: 'Copertura', symbol: '+', rotationImpact: 'neutral' },
      { code: 'defense_error', label: 'Errore',     symbol: '=', rotationImpact: 'point_for_them' },
    ],
  },
  freeball: {
    label: 'Freeball',
    outcomes: [
        { code: 'defense_ok', label: 'Gestita', symbol: '+', rotationImpact: 'neutral' },
        { code: 'defense_error', label: 'Caduta', symbol: '=', rotationImpact: 'point_for_them' }
    ]
  },
  set: { label: 'Palleggio', outcomes: [] },
  [Fundamental.OTHER]: {
    label: 'Falli/Altro',
    outcomes: [
      { code: 'net_fault',      label: 'Invasione (Noi)',      symbol: '=',  rotationImpact: 'point_for_them' },
      { code: 'rotation_fault', label: 'Fallo Form. (Noi)', symbol: '=', rotationImpact: 'point_for_them' },
      { code: 'opponent_error', label: 'Errore Avv. (Punto Noi)', symbol: '+', rotationImpact: 'point_for_us' },
      { code: 'opponent_point', label: 'Punto Avv. (Generico)', symbol: '-', rotationImpact: 'point_for_them' },
      { code: 'card_red',       label: 'Rosso (Pt avv)',  symbol: 'R',  rotationImpact: 'card_red' },
    ],
  },
};

// --- COMPONENT ---

export const Scouting: React.FC<ScoutingProps> = ({ matchId, user, onFinished, showToast }) => {
  // 1. Static Data
  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [initialLineup, setInitialLineup] = useState<MatchLineup | null>(null);
  const [loading, setLoading] = useState(true);

  // 2. Event Log (The Source of Truth)
  const [eventLog, setEventLog] = useState<GameEvent[]>([]);

  // 3. UI Selection State
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedFundamental, setSelectedFundamental] = useState<Fundamental | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<OutcomeCode | null>(null);
  const [isSubMode, setIsSubMode] = useState(false);
  const [selectedBenchPlayerId, setSelectedBenchPlayerId] = useState<string | null>(null);

  // 4. Tools & Modals
  const [showTools, setShowTools] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showLiveStats, setShowLiveStats] = useState(false);
  const [manualScoreUs, setManualScoreUs] = useState(0);
  const [manualScoreThem, setManualScoreThem] = useState(0);

  // --- INITIAL LOAD ---
  useEffect(() => {
    const init = async () => {
       try {
           if (!user.clubId) return;
           const [matches, teamPlayers, initLineup] = await Promise.all([
               getMatches('t1', user.clubId),
               getTeamPlayers('t1', user.clubId),
               getInitialLineupForMatch(matchId)
           ]);
           const m = matches.find(x => x.id === matchId);
           setMatch(m || null);
           setPlayers(teamPlayers);
           
           let finalLineup = initLineup;
           if (!finalLineup && teamPlayers.length >= 6) {
               // Auto-generate a default lineup for prototype
               finalLineup = {
                   id: generateId(),
                   matchId,
                   setNumber: 1,
                   rotationIndex: 0,
                   onCourt: [
                       { position: 1, playerId: teamPlayers[0].id },
                       { position: 2, playerId: teamPlayers[1].id },
                       { position: 3, playerId: teamPlayers[2].id },
                       { position: 4, playerId: teamPlayers[3].id },
                       { position: 5, playerId: teamPlayers[4].id },
                       { position: 6, playerId: teamPlayers[5].id },
                   ],
                   benchPlayerIds: teamPlayers.slice(6).map(p => p.id)
               };
           }
           setInitialLineup(finalLineup);
           
           // Load initial events from store
           const storedEvents = await eventStore.loadEventsAsync(matchId);
           setEventLog(storedEvents);

       } catch (error) {
           showToast('error', 'Errore', 'Impossibile caricare i dati del match.');
       } finally {
           setLoading(false);
       }
    };
    init();
  }, [matchId, user.clubId]);

  // --- ENGINE STATE DERIVATION ---
  // This runs whenever eventLog changes. Pure calculation.
  const matchState = useMemo(() => {
    if (!initialLineup || !match) return null;
    
    return reduceMatchState(eventLog, initialLineup, {
        matchIsHome: match.isHome
    });
  }, [eventLog, initialLineup, match]);

  // Derived Helpers
  const playersById = useMemo(() => {
      const map: Record<string, { position: PlayerPosition, data: Player }> = {};
      players.forEach(p => map[p.id] = { position: p.position, data: p });
      return map;
  }, [players]);

  const liveStats = useMemo(() => {
      const stats: Record<string, { 
          points: number, 
          errors: number, 
          attacks: number, 
          attackPoints: number, 
          attackErrors: number,
          rating: number 
      }> = {};
      
      // Initialize
      players.forEach(p => {
          stats[p.id] = { points: 0, errors: 0, attacks: 0, attackPoints: 0, attackErrors: 0, rating: 6.0 };
      });

      // Group events by player
      const playerEvents: Record<string, GameEvent[]> = {};
      eventLog.forEach(ev => {
          if (ev.playerId) {
              if (!playerEvents[ev.playerId]) playerEvents[ev.playerId] = [];
              playerEvents[ev.playerId].push(ev);
          }
      });

      // Calculate stats and rating
      players.forEach(p => {
          const s = stats[p.id];
          const events = playerEvents[p.id] || [];

          events.forEach(ev => {
              if (ev.outcome?.includes('point') || ev.outcome?.includes('ace') || ev.outcome === 'opponent_error') s.points++;
              if (ev.outcome?.includes('error') || ev.outcome?.includes('blocked') || ev.outcome?.includes('net_fault') || ev.outcome === 'opponent_point') s.errors++;
              
              if (ev.fundamental === 'attack') {
                  s.attacks++;
                  if (ev.outcome === 'attack_point' || ev.outcome === 'attack_tool') s.attackPoints++;
                  if (ev.outcome === 'attack_error' || ev.outcome === 'attack_blocked') s.attackErrors++;
              }
          });

          // Calculate Rating
          const ratingResult = computeVolleyRating(events, { role: p.position });
          s.rating = ratingResult.rating;
      });

      return stats;
  }, [eventLog, players]);

  // --- HANDLERS ---

  const handleRecordEvent = () => {
    if (!selectedFundamental || !selectedOutcome || !match || !matchState) return;
    
    // Allow recording without player ONLY for 'other' fundamental (generic points)
    if (!selectedPlayerId && selectedFundamental !== Fundamental.OTHER) {
        showToast('error', 'Seleziona un giocatore', 'Devi selezionare un giocatore per questo fondamentale.');
        return;
    }
    
    // Create Atomic Event
    const newEvent: GameEvent = {
        id: generateId(),
        matchId: match.id,
        eventType: 'game',
        playerId: selectedPlayerId || undefined, // Optional for generic events
        setNumber: matchState.currentSet, // Context from state
        fundamental: selectedFundamental,
        outcome: selectedOutcome,
        timestamp: Date.now(),
        isImportantPoint: matchState.teamPoints > 20 || matchState.opponentPoints > 20,
    };

    // Persistence & State Update
    const newLog = eventStore.appendEvent(matchId, newEvent);
    setEventLog(newLog);

    // UI Feedback
    if (selectedOutcome.includes('ace')) showToast('success', 'ACE!');
    if (selectedOutcome.includes('block_point')) showToast('success', 'MONSTER BLOCK!');
    if (selectedOutcome.includes('attack_point')) showToast('success', 'KILL!');
    if (selectedOutcome === 'opponent_error') showToast('success', 'PUNTO (Errore Avv.)');
    if (selectedOutcome === 'opponent_point') showToast('info', 'Punto Avversario');

    // Reset UI
    setSelectedFundamental(null);
    setSelectedOutcome(null);
    setSelectedPlayerId(null);
  };

  const handleSubExecute = (courtPlayerId: string) => {
      if (!isSubMode || !selectedBenchPlayerId || !matchState || !match) return;
      
      const subEvent: GameEvent = {
        id: generateId(),
        matchId: match.id,
        eventType: 'sub',
        setNumber: matchState.currentSet,
        timestamp: Date.now(),
        subInPlayerId: selectedBenchPlayerId,
        subOutPlayerId: courtPlayerId
      };

      const newLog = eventStore.appendEvent(matchId, subEvent);
      setEventLog(newLog);

      setIsSubMode(false);
      setSelectedBenchPlayerId(null);
      showToast('success', 'Cambio Effettuato');
  };

  const handleUndo = () => {
      const newLog = eventStore.undoLastEvent(matchId);
      setEventLog([...newLog]); // Force new array ref
      showToast('info', 'Annullato', 'Stato ricalcolato.');
  };

  const handleTimeout = () => {
      if (!match || !matchState) return;
      
      const timeoutEvent: GameEvent = {
          id: generateId(),
          matchId: match.id,
          eventType: 'timeout',
          setNumber: matchState.currentSet,
          timestamp: Date.now()
      };
      
      const newLog = eventStore.appendEvent(matchId, timeoutEvent);
      setEventLog(newLog);
      showToast('info', 'Timeout', 'Timeout registrato.');
  };

  const handleNextSet = () => {
      if (!match || !matchState) return;
      
      const newEvent: GameEvent = {
          id: generateId(),
          matchId: match.id,
          eventType: 'set_start',
          setNumber: matchState.currentSet + 1,
          timestamp: Date.now()
      };
      
      const newLog = eventStore.appendEvent(matchId, newEvent);
      setEventLog(newLog);
      showToast('success', `Inizio Set ${matchState.currentSet + 1}`);
  };

  const handleFinishMatch = async () => {
      if (!match || !matchState) return;

      // Use a custom confirmation or just proceed for now to unblock
      // if (confirm('Confermi di voler terminare la partita?')) {
          setLoading(true);
          try {
              // 1. Update Match Status
              const finalScore = `${matchState.setsWonUs}-${matchState.setsWonThem}`;
              await updateMatch({
                  ...match,
                  status: 'completed',
                  result: finalScore
              });

              // 2. Calculate & Update Player Ratings
              const playerStats = new Map<string, GameEvent[]>();
              eventLog.forEach(e => {
                  if (e.playerId) {
                      const list = playerStats.get(e.playerId) || [];
                      list.push(e);
                      playerStats.set(e.playerId, list);
                  }
              });

              const statsToSave: PlayerMatchStats[] = [];
              for (const [pid, events] of playerStats.entries()) {
                  const p = players.find(x => x.id === pid);
                  if (p) {
                      const ratingResult = computeVolleyRating(events, { role: p.position });
                      
                      let attacks = 0, attackPoints = 0, attackErrors = 0;
                      let serves = 0, aces = 0, serveErrors = 0;
                      let receptions = 0, perfectReceptions = 0, negativeReceptions = 0;
                      let blocks = 0, blockPoints = 0, digs = 0;

                      for (const ev of events) {
                        if (!ev.fundamental || !ev.outcome) continue;
                        switch (ev.fundamental) {
                          case Fundamental.ATTACK:
                            attacks++;
                            if (ev.outcome === 'attack_point' || ev.outcome === 'attack_tool') attackPoints++;
                            if (ev.outcome === 'attack_error' || ev.outcome === 'attack_blocked') attackErrors++;
                            break;
                          case Fundamental.SERVE:
                            serves++;
                            if (ev.outcome === 'serve_ace') aces++;
                            if (ev.outcome === 'serve_error') serveErrors++;
                            break;
                          case Fundamental.RECEPTION:
                            receptions++;
                            if (ev.outcome === 'reception_perfect') perfectReceptions++;
                            if (ev.outcome === 'reception_negative' || ev.outcome === 'reception_ace_conceded' || ev.outcome === 'reception_slash') negativeReceptions++;
                            break;
                          case Fundamental.BLOCK:
                            blocks++;
                            if (ev.outcome === 'block_point') blockPoints++;
                            break;
                          case Fundamental.DEFENSE:
                            if (ev.outcome === 'defense_great' || ev.outcome === 'defense_ok' || ev.outcome === 'defense_cover') digs++;
                            break;
                        }
                      }

                      statsToSave.push({
                          id: `s_${match.id}_${pid}`,
                          matchId: match.id,
                          playerId: pid,
                          teamId: match.teamId,
                          rating: ratingResult.rating,
                          breakdown: ratingResult.breakdown,
                          totalPoints: attackPoints + aces + blockPoints,
                          errors: attackErrors + serveErrors,
                          matchDate: match.date,
                          opponentName: match.opponentName,
                          totals: {
                              attacks, attackPoints, attackErrors,
                              serves, aces, serveErrors,
                              receptions, perfectReceptions, negativeReceptions,
                              blocks, blockPoints, digs
                          }
                      });
                  }
              }
              
              if (statsToSave.length > 0) {
                  await savePlayerMatchStats(statsToSave);
              }

              showToast('success', 'Partita Terminata', `Risultato finale: ${finalScore}`);
              onFinished();
          } catch (e) {
              console.error(e);
              showToast('error', 'Errore', 'Impossibile salvare i dati, ma chiudo comunque.');
              onFinished(); // Force close even on error
          } finally {
              setLoading(false);
          }
      // }
  };

  const handleManualScoreSubmit = () => {
      if (!match || !matchState) return;
      
      const adjustmentEvent: GameEvent = {
          id: generateId(),
          matchId: match.id,
          eventType: 'manual_adjustment',
          setNumber: matchState.currentSet,
          timestamp: Date.now(),
          adjustmentData: {
              newScoreTeam: manualScoreUs,
              newScoreOpponent: manualScoreThem
          }
      };
      
      const newLog = eventStore.appendEvent(matchId, adjustmentEvent);
      setEventLog(newLog);
      setShowScoreModal(false);
      showToast('info', 'Punteggio Aggiornato', `Nuovo punteggio: ${manualScoreUs}-${manualScoreThem}`);
  };

  const handleManualRotation = (steps: number) => {
      if (!match || !matchState) return;
      
      const rotationEvent: GameEvent = {
          id: generateId(),
          matchId: match.id,
          eventType: 'rotation_update',
          setNumber: matchState.currentSet,
          timestamp: Date.now(),
          adjustmentData: {
              rotationSteps: steps
          }
      };
      
      const newLog = eventStore.appendEvent(matchId, rotationEvent);
      setEventLog(newLog);
      showToast('info', 'Rotazione Aggiornata', steps > 0 ? 'Avanti (+1)' : 'Indietro (-1)');
  };

  const handleRestartSet = () => {
      if (!match || !matchState) return;
      if (!confirm('Sei sicuro di voler riavviare il set corrente? Tutti i punti di questo set verranno azzerati.')) return;

      const restartEvent: GameEvent = {
          id: generateId(),
          matchId: match.id,
          eventType: 'set_start',
          setNumber: matchState.currentSet,
          timestamp: Date.now()
      };

      const newLog = eventStore.appendEvent(matchId, restartEvent);
      setEventLog(newLog);
      setShowTools(false);
      showToast('info', 'Set Riavviato', `Set ${matchState.currentSet} ricominciato.`);
  };

  // --- RENDER HELPERS ---

  if (loading || !matchState || !match) return <div className="h-screen flex items-center justify-center font-display text-4xl animate-pulse">CARICAMENTO CAMPO...</div>;

  const getGridArea = (pos: CourtPosition) => {
      switch(pos) {
          case 4: return 'row-start-1 col-start-1';
          case 3: return 'row-start-1 col-start-2';
          case 2: return 'row-start-1 col-start-3';
          case 5: return 'row-start-2 col-start-1';
          case 6: return 'row-start-2 col-start-2';
          case 1: return 'row-start-2 col-start-3';
      }
  };

  const isActionAllowed = (player: Player, fundamental: Fundamental, courtPos: CourtPosition): boolean => {
    if (player.position === PlayerPosition.LIBERO) {
        if (fundamental === Fundamental.SERVE) return false;
        if (fundamental === Fundamental.BLOCK) return false;
        if (fundamental === Fundamental.ATTACK && [2,3,4].includes(courtPos)) return false;
    }
    return true;
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col font-sans overflow-hidden bg-cream-light">
      
      {/* SCOREBOARD HEADER */}
      <div className="bg-navy text-cream p-4 flex justify-between items-center shadow-lg z-10">
         <div className="flex items-center gap-6">
            <div className="text-right">
                <div className="font-title text-6xl text-lime leading-[0.8]">{matchState.teamPoints}</div>
                <div className={`text-xs uppercase font-bold ${matchState.servingSide === 'us' ? 'text-lime underline' : 'opacity-70'}`}>
                    Noi {matchState.servingSide === 'us' && '🏐'}
                </div>
                <div className="text-[10px] font-mono mt-1 opacity-60">
                    T: {matchState.timeoutsUsedUs}/2 • S: {matchState.subsUsedUs}/6
                </div>
            </div>
            <div className="h-12 w-[2px] bg-white/20"></div>
            <div>
                <div className="font-title text-6xl text-terracotta leading-[0.8]">{matchState.opponentPoints}</div>
                <div className={`text-xs uppercase font-bold ${matchState.servingSide === 'them' ? 'text-terracotta underline' : 'opacity-70'}`}>
                    Loro {matchState.servingSide === 'them' && '🏐'}
                </div>
            </div>
         </div>
         <div className="flex flex-col items-center">
             <div className="font-bold text-xl uppercase tracking-widest">{match.opponentName}</div>
             <div className="flex gap-4 text-xs font-mono bg-black/20 px-3 py-1 rounded-full mt-1">
                 <span>SET: {matchState.currentSet}</span>
                 {matchState.setsWonUs} - {matchState.setsWonThem}
             </div>
         </div>
         <div className="flex gap-2">
             <Button variant="secondary" size="sm" onClick={handleTimeout} disabled={matchState.timeoutsUsedUs >= 2 || matchState.isSetFinished}>
                 ⏱️ T.OUT
             </Button>
             <Button variant="secondary" size="sm" onClick={handleUndo} disabled={eventLog.length === 0}>
                 ↩ UNDO
             </Button>
             
             <Button variant="secondary" size="sm" onClick={() => setShowTools(true)}>
                 ⚙️ TOOLS
             </Button>

             {matchState.isSetFinished ? (
                 <Button variant="primary" size="sm" onClick={handleNextSet}>
                     START SET {matchState.currentSet + 1}
                 </Button>
             ) : (
                 <Button variant="danger" size="sm" onClick={handleFinishMatch}>FINISCI</Button>
             )}
         </div>
      </div>

      <div className="flex flex-1 min-h-0 gap-4 p-4">
         
         {/* LEFT: COURT */}
         <div className="w-full md:w-[45%] flex flex-col gap-4">
             <div className="relative bg-orange-100 border-4 border-terracotta rounded-lg shadow-inner flex-1 min-h-[400px]">
                 {/* 3-meter line */}
                 <div className="absolute top-1/2 left-0 right-0 h-1 bg-terracotta/40 z-0"></div>

                 <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 p-2 gap-2 z-10">
                     {matchState.currentLineup.onCourt.map((slot) => {
                         const player = playersById[slot.playerId]?.data;
                         if (!player) return null;
                         const isSelected = selectedPlayerId === slot.playerId;
                         const isLibero = player.position === PlayerPosition.LIBERO;
                         
                         const stats = liveStats[player.id];
                         const rating = stats ? stats.rating : 6.0;

                         return (
                             <div 
                                key={slot.playerId}
                                className={`
                                    relative ${getGridArea(slot.position)}
                                    bg-white border-[3px] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all
                                    ${isSelected ? 'border-teal bg-teal/10 scale-95 ring-4 ring-teal/30' : 'border-black hover:bg-gray-50'}
                                    ${isSubMode ? 'animate-pulse ring-4 ring-terracotta' : ''}
                                `}
                                onClick={() => isSubMode ? handleSubExecute(slot.playerId) : setSelectedPlayerId(slot.playerId)}
                             >
                                 <div className="absolute top-2 left-2 bg-black text-white text-[10px] px-1 rounded uppercase">
                                    {player.position === PlayerPosition.SETTER ? 'P' : player.position === PlayerPosition.LIBERO ? 'L' : ''}
                                 </div>
                                 <div className="absolute top-2 right-2 text-gray-400 font-bold text-xs">P{slot.position}</div>
                                 
                                 <div className="font-display text-5xl">{player.shirtNumber}</div>
                                 <div className="text-xs font-bold uppercase truncate w-full text-center px-1">{player.lastName}</div>
                                 
                                 {/* Live Rating Badge */}
                                 <div className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold border border-black/20 ${rating >= 7 ? 'bg-green-100 text-green-700' : rating < 5.5 ? 'bg-red-100 text-red-700' : 'bg-white/80 text-gray-700'}`}>
                                     {rating.toFixed(1)}
                                 </div>
                             </div>
                         );
                     })}
                 </div>
                 
                 {matchState.isSetFinished && (
                     <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm rounded-lg">
                         <div className="bg-cream border-4 border-black p-8 rounded-card text-center shadow-cartoon">
                             <h2 className="font-title text-6xl mb-2">{matchState.setWinner === 'us' ? 'VICTORY!' : 'SET LOST'}</h2>
                             <p className="font-bold uppercase mb-4">Set {matchState.currentSet} Completed</p>
                             
                             {(matchState.setsWonUs === 3 || matchState.setsWonThem === 3) ? (
                                 <div className="space-y-2">
                                     <div className="text-xl font-bold mb-4">PARTITA TERMINATA ({matchState.setsWonUs}-{matchState.setsWonThem})</div>
                                     <Button variant="primary" size="xl" onClick={handleFinishMatch}>
                                         💾 SALVA E CHIUDI
                                     </Button>
                                 </div>
                             ) : (
                                 <Button onClick={handleNextSet}>START NEXT SET</Button>
                             )}
                         </div>
                     </div>
                 )}
             </div>

             {/* BENCH */}
             <div className="flex gap-4 h-24">
                 <div className="flex-1 bg-white border-2 border-black rounded-lg p-2 flex gap-2 overflow-x-auto items-center">
                     <div className="text-[10px] uppercase font-bold text-gray-400 w-4 break-words text-center">PANCHINA</div>
                     {matchState.currentLineup.benchPlayerIds.map(pid => {
                         const p = playersById[pid]?.data;
                         if(!p) return null;
                         return (
                            <button key={pid} onClick={() => { setIsSubMode(true); setSelectedBenchPlayerId(pid); }} 
                                className={`h-full aspect-square border-2 rounded flex flex-col items-center justify-center ${selectedBenchPlayerId === pid ? 'bg-terracotta text-white border-black' : 'bg-gray-100 border-gray-300'}`}>
                                <span className="font-display text-xl">{p.shirtNumber}</span>
                            </button>
                         );
                     })}
                 </div>
             </div>
         </div>

         {/* RIGHT: CONTROLS */}
         <div className="flex-1 bg-white border-4 border-black rounded-xl p-4 flex flex-col shadow-cartoon">
             <div className="mb-4 flex justify-between items-center border-b-2 border-gray-100 pb-2">
                 <h2 className="font-title text-3xl">SCOUTING</h2>
                 {selectedPlayerId ? (
                     <div className="font-bold text-teal uppercase">{playersById[selectedPlayerId]?.data.firstName} #{playersById[selectedPlayerId]?.data.shirtNumber}</div>
                 ) : <div className="text-gray-400 text-sm uppercase">Seleziona giocatore</div>}
             </div>

             {/* FUNDAMENTALS */}
             <div className="grid grid-cols-3 gap-3 mb-4">
                 {(Object.keys(FUNDAMENTAL_CONFIG) as Fundamental[]).filter(f => f !== 'set').map(fund => {
                     const player = selectedPlayerId ? playersById[selectedPlayerId]?.data : null;
                     const slot = matchState.currentLineup.onCourt.find(s => s.playerId === selectedPlayerId);
                     const isOther = fund === Fundamental.OTHER;
                     const disabled = !isOther && (!player || !isActionAllowed(player, fund, slot?.position as CourtPosition));

                     return (
                        <button
                            key={fund}
                            disabled={disabled}
                            onClick={() => { setSelectedFundamental(fund); setSelectedOutcome(null); }}
                            className={`
                                py-3 font-title text-xl uppercase tracking-wider border-2 border-black rounded-lg transition-all
                                ${selectedFundamental === fund ? 'bg-black text-lime translate-y-[2px]' : 'bg-white hover:bg-lime/20 shadow-cartoon-sm'}
                                ${disabled ? 'opacity-30 cursor-not-allowed bg-gray-100 shadow-none' : ''}
                            `}
                        >
                            {FUNDAMENTAL_CONFIG[fund].label}
                        </button>
                     );
                 })}
             </div>

             {/* OUTCOMES */}
             <div className="flex-1 bg-gray-50 border-2 border-black/10 rounded-xl p-4 overflow-y-auto mb-4">
                {selectedFundamental ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {FUNDAMENTAL_CONFIG[selectedFundamental].outcomes.map(outcome => (
                            <button
                                key={outcome.code}
                                onClick={() => setSelectedOutcome(outcome.code)}
                                className={`
                                    h-16 rounded-lg border-2 flex flex-col items-center justify-center transition-all
                                    ${selectedOutcome === outcome.code ? 'ring-4 ring-black scale-95' : 'shadow-sm hover:translate-y-[-2px]'}
                                `}
                            >
                                <span className="font-bold text-sm leading-none mb-1">{outcome.label}</span>
                                <span className="font-mono text-xs opacity-70">{outcome.symbol}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 font-bold uppercase text-sm">
                        Seleziona un fondamentale
                    </div>
                )}
             </div>

             <Button size="xl" onClick={handleRecordEvent} disabled={!selectedOutcome || matchState.isSetFinished} className="w-full">
                 REGISTRA EVENTO
             </Button>
         </div>
      </div>

      {/* TOOLS MODAL */}
      {showTools && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white border-4 border-black rounded-card shadow-cartoon p-6 max-w-sm w-full space-y-4">
                  <h3 className="font-display text-3xl mb-4">STRUMENTI</h3>
                  
                  <Button className="w-full" onClick={() => {
                      setManualScoreUs(matchState.teamPoints);
                      setManualScoreThem(matchState.opponentPoints);
                      setShowScoreModal(true);
                      setShowTools(false);
                  }}>
                      📝 Correggi Punteggio
                  </Button>

                  <Button className="w-full" variant="secondary" onClick={() => {
                      setShowLiveStats(true);
                      setShowTools(false);
                  }}>
                      📊 Statistiche Live
                  </Button>

                  <div className="grid grid-cols-2 gap-4">
                      <Button variant="secondary" onClick={() => handleManualRotation(-1)}>
                          ↺ Ruota Indietro
                      </Button>
                      <Button variant="secondary" onClick={() => handleManualRotation(1)}>
                          ↻ Ruota Avanti
                      </Button>
                  </div>

                  <Button variant="danger" className="w-full" onClick={handleRestartSet}>
                      ⚠️ Riavvia Set Corrente
                  </Button>

                  <div className="border-t border-gray-200 pt-4 mt-4">
                      <Button variant="danger" className="w-full" onClick={() => setShowTools(false)}>
                          Chiudi
                      </Button>
                  </div>
              </div>
          </div>
      )}

      {/* SCORE MODAL */}
      {showScoreModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white border-4 border-black rounded-card shadow-cartoon p-6 max-w-sm w-full">
                  <h3 className="font-display text-2xl mb-4">CORREGGI PUNTEGGIO</h3>
                  
                  <div className="flex items-center gap-4 mb-6">
                      <div className="flex-1 text-center">
                          <label className="block text-xs font-bold uppercase mb-1">NOI</label>
                          <input 
                              type="number" 
                              className="w-full text-center font-display text-4xl border-2 border-black rounded-lg p-2"
                              value={manualScoreUs}
                              onChange={(e) => setManualScoreUs(parseInt(e.target.value) || 0)}
                          />
                      </div>
                      <div className="font-display text-2xl">-</div>
                      <div className="flex-1 text-center">
                          <label className="block text-xs font-bold uppercase mb-1">LORO</label>
                          <input 
                              type="number" 
                              className="w-full text-center font-display text-4xl border-2 border-black rounded-lg p-2"
                              value={manualScoreThem}
                              onChange={(e) => setManualScoreThem(parseInt(e.target.value) || 0)}
                          />
                      </div>
                  </div>

                  <div className="flex gap-4">
                      <Button variant="secondary" className="flex-1" onClick={() => setShowScoreModal(false)}>
                          Annulla
                      </Button>
                      <Button className="flex-1" onClick={handleManualScoreSubmit}>
                          Salva
                      </Button>
                  </div>
              </div>
          </div>
      )}

      {/* LIVE STATS MODAL */}
      {showLiveStats && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white border-4 border-black rounded-card shadow-cartoon p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-display text-3xl">STATISTICHE LIVE</h3>
                      <Button variant="secondary" size="sm" onClick={() => setShowLiveStats(false)}>Chiudi</Button>
                  </div>
                  
                  <div className="overflow-x-auto">
                      <table className="min-w-full text-sm font-soft">
                          <thead>
                              <tr className="bg-cream-dark border-y-2 border-black">
                                  <th className="px-2 py-2 text-left">Giocatore</th>
                                  <th className="px-2 py-2 text-center">Voto</th>
                                  <th className="px-2 py-2 text-center">Punti</th>
                                  <th className="px-2 py-2 text-center">Errori</th>
                                  <th className="px-2 py-2 text-center">Attacchi (Pt/Err)</th>
                              </tr>
                          </thead>
                          <tbody>
                              {players.map(p => {
                                  const s = liveStats[p.id] || { points: 0, errors: 0, attacks: 0, attackPoints: 0, attackErrors: 0, rating: 6.0 };
                                  if (s.points === 0 && s.errors === 0 && s.attacks === 0 && s.rating === 6.0) return null; // Hide empty rows
                                  
                                  return (
                                      <tr key={p.id} className="border-b border-black/10">
                                          <td className="px-2 py-2 font-bold">#{p.shirtNumber} {p.lastName}</td>
                                          <td className="px-2 py-2 text-center font-bold text-lg">
                                              <span className={s.rating >= 7 ? 'text-green-600' : s.rating < 5.5 ? 'text-red-500' : ''}>
                                                  {s.rating.toFixed(1)}
                                              </span>
                                          </td>
                                          <td className="px-2 py-2 text-center font-display text-xl">{s.points}</td>
                                          <td className="px-2 py-2 text-center">{s.errors}</td>
                                          <td className="px-2 py-2 text-center">
                                              {s.attacks} ({s.attackPoints}/{s.attackErrors})
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>
                  
                  {Object.values(liveStats).every((s: any) => s.points === 0 && s.errors === 0) && (
                      <div className="text-center py-8 text-gray-500 italic">Nessun dato registrato.</div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};
