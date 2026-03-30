
import React, { useEffect, useState } from 'react';
import { Player, PlayerMatchStats, Match, User } from '../types';
import { getPlayerMatchStats, getMatches, getTeamPlayers } from '../services/dbService';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface PlayerProfileProps {
  user: User;
  playerId: string;
  onNavigate?: (path: string) => void;
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({ user, playerId, onNavigate }) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<PlayerMatchStats[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        if (!user.clubId) return;
        // Fetch player details first
        const allPlayers = await getTeamPlayers('t1', user.clubId);
        const foundPlayer = allPlayers.find(p => p.id === playerId);
        
        if (foundPlayer && isMounted) {
            setPlayer(foundPlayer);
            const [m, s] = await Promise.all([
                getMatches('t1', user.clubId),
                getPlayerMatchStats(playerId),
            ]);
            if (isMounted) {
                // Filter matches to only those the player participated in based on stats
                const playedMatchIds = new Set(s.map(stat => stat.matchId));
                setMatches(m.filter(match => playedMatchIds.has(match.id) && match.status === 'completed'));
                setStats(s);
            }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [playerId, user.clubId]);

  if (isLoading) return <div className="text-center py-12 font-display text-2xl animate-pulse">Loading Profile...</div>;
  if (!player) return <div className="text-center py-12 font-display text-2xl text-red-500">Player Not Found</div>;

  // Format data for Recharts
  const chartData = stats.map((s, i) => ({
      name: `M${i+1}`,
      date: s.matchDate ? new Date(s.matchDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric'}) : `Match ${i+1}`,
      rating: s.rating
  }));

  const totalAttacks = stats.reduce((acc, s) => acc + s.totals.attacks, 0);
  const totalAttackPoints = stats.reduce((acc, s) => acc + s.totals.attackPoints, 0);
  const totalAttackErrors = stats.reduce((acc, s) => acc + s.totals.attackErrors, 0);
  const attackEff = totalAttacks > 0 ? ((totalAttackPoints - totalAttackErrors) / totalAttacks) * 100 : 0;

  const totalReceptions = stats.reduce((acc, s) => acc + s.totals.receptions, 0);
  const totalPerfectReceptions = stats.reduce((acc, s) => acc + s.totals.perfectReceptions, 0);
  const totalNegativeReceptions = stats.reduce((acc, s) => acc + s.totals.negativeReceptions, 0);
  const recEff = totalReceptions > 0 ? ((totalPerfectReceptions - totalNegativeReceptions) / totalReceptions) * 100 : 0;

  const totalServes = stats.reduce((acc, s) => acc + s.totals.serves, 0);
  const totalAces = stats.reduce((acc, s) => acc + s.totals.aces, 0);
  const totalServeErrors = stats.reduce((acc, s) => acc + s.totals.serveErrors, 0);
  const serveEff = totalServes > 0 ? ((totalAces - totalServeErrors) / totalServes) * 100 : 0;

  const totalBlocks = stats.reduce((acc, s) => acc + s.totals.blocks, 0);
  const totalBlockPoints = stats.reduce((acc, s) => acc + s.totals.blockPoints, 0);
  const blockEff = totalBlocks > 0 ? (totalBlockPoints / totalBlocks) * 100 : 0;

  const totalDigs = stats.reduce((acc, s) => acc + s.totals.digs, 0);
  const avgDigs = matches.length > 0 ? totalDigs / matches.length : 0;
  const digScore = Math.min((avgDigs / 10) * 100, 100);

  const radarData = [
      { subject: 'Attack', A: Math.max(0, attackEff), fullMark: 100 },
      { subject: 'Serve', A: Math.max(0, serveEff), fullMark: 100 },
      { subject: 'Reception', A: Math.max(0, recEff), fullMark: 100 },
      { subject: 'Block', A: Math.max(0, blockEff), fullMark: 100 },
      { subject: 'Defense', A: Math.max(0, digScore), fullMark: 100 },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* HEADER CARD */}
      <div className="bg-white border-2 border-black rounded-xl p-6 md:p-8 shadow-cartoon mb-8 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4">
             <div className="bg-cream border-2 border-black px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                 {player.category} • {player.region}
             </div>
         </div>
         
         <div className="flex flex-col md:flex-row items-center gap-8">
             {/* Avatar */}
             <div className="relative">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-gray-200 rounded-full border-4 border-black flex items-center justify-center font-display text-6xl text-gray-400 overflow-hidden">
                    {player.avatarUrl ? <img src={player.avatarUrl} alt="" className="w-full h-full object-cover"/> : player.shirtNumber}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-lime border-2 border-black rounded-lg px-2 py-1 font-bold text-xl shadow-sm rotate-[-5deg]">
                    #{player.shirtNumber}
                </div>
             </div>

             {/* Info */}
             <div className="text-center md:text-left flex-1">
                 <h1 className="font-display text-6xl md:text-7xl leading-none mb-2">{player.firstName}<br/>{player.lastName}</h1>
                 <div className="inline-block bg-teal text-cream px-4 py-2 text-sm font-bold uppercase rounded-lg border-2 border-black shadow-sm mb-4">
                    {player.position.replace('_', ' ')}
                 </div>
             </div>

             {/* Season Avg */}
             <div className="bg-cream-dark p-6 rounded-xl border-2 border-black text-center min-w-[150px]">
                 <div className="text-xs uppercase font-bold tracking-widest text-gray-500 mb-1">Season Avg</div>
                 <div className={`font-display text-6xl ${player.averageRating >= 7.5 ? 'text-terracotta' : 'text-black'}`}>
                     {player.averageRating}
                 </div>
                 <div className="text-xs font-bold mt-2">{matches.length} Matches</div>
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: History & Stats */}
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white border-2 border-black rounded-xl p-6 shadow-cartoon">
                <h3 className="font-display text-3xl mb-6">PERFORMANCE TREND</h3>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12}} dy={10} />
                            <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: '2px solid black', boxShadow: '4px 4px 0px 0px #000' }}
                                itemStyle={{ fontWeight: 'bold', color: '#a13920' }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="rating" 
                                stroke="#2d6664" 
                                strokeWidth={4} 
                                dot={{ r: 6, fill: "#dade5c", strokeWidth: 2, stroke: "#1d1d1b" }} 
                                activeDot={{ r: 8, strokeWidth: 2, stroke: "#1d1d1b" }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detailed Match Table */}
            <div>
                <h3 className="font-display text-3xl mb-4">MATCH LOG</h3>
                
                {isLoading && (
                    <div className="text-sm font-soft text-black/60 italic p-4 bg-white border-2 border-black rounded-xl">Loading stats...</div>
                )}

                {!isLoading && stats.length === 0 && (
                    <div className="text-sm font-soft text-black/60 italic p-4 bg-white border-2 border-black rounded-xl">
                        No match data available.
                    </div>
                )}

                {!isLoading && stats.length > 0 && (
                    <div className="bg-white border-2 border-black rounded-xl overflow-hidden shadow-cartoon">
                        <div className="overflow-x-auto">
                        <table className="min-w-full text-xs md:text-sm font-soft">
                            <thead>
                            <tr className="bg-cream-dark border-b-2 border-black">
                                <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Date / Opponent</th>
                                <th className="px-2 py-3 text-center font-bold uppercase tracking-wider">Rating</th>
                                <th className="px-2 py-3 text-center font-bold uppercase tracking-wider">Attack<br/><span className="text-[10px] opacity-60">Pt/Err</span></th>
                                <th className="px-2 py-3 text-center font-bold uppercase tracking-wider">Serve<br/><span className="text-[10px] opacity-60">Ace/Err</span></th>
                                <th className="px-2 py-3 text-center font-bold uppercase tracking-wider">Rec<br/><span className="text-[10px] opacity-60">Perf/Tot</span></th>
                                <th className="px-2 py-3 text-center font-bold uppercase tracking-wider">Block<br/><span className="text-[10px] opacity-60">Pt</span></th>
                                <th className="px-2 py-3 text-center font-bold uppercase tracking-wider">Digs</th>
                            </tr>
                            </thead>
                            <tbody>
                            {stats.map((ms) => {
                                // Fallback dates if not present in stats wrapper
                                const dateLabel = ms.matchDate ? new Date(ms.matchDate).toLocaleDateString() : 'N/A';
                                const opponent = ms.opponentName || 'Unknown';

                                return (
                                <tr key={ms.id} className="border-b border-black/10 hover:bg-cream-light transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-bold">{opponent}</div>
                                        <div className="text-xs text-gray-500">{dateLabel}</div>
                                    </td>
                                    <td className="px-2 py-3 text-center">
                                        <span className={`font-title text-xl px-2 py-1 rounded border border-black ${ms.rating >= 7.5 ? 'bg-lime' : 'bg-white'}`}>
                                            {ms.rating.toFixed(1)}
                                        </span>
                                    </td>
                                    <td className="px-2 py-3 text-center font-mono">
                                        {ms.totals.attackPoints}/{ms.totals.attackErrors}
                                    </td>
                                    <td className="px-2 py-3 text-center font-mono">
                                        {ms.totals.aces}/{ms.totals.serveErrors}
                                    </td>
                                    <td className="px-2 py-3 text-center font-mono">
                                        {ms.totals.perfectReceptions}/{ms.totals.receptions}
                                    </td>
                                    <td className="px-2 py-3 text-center font-mono">
                                        {ms.totals.blockPoints}
                                    </td>
                                    <td className="px-2 py-3 text-center font-mono">
                                        {ms.totals.digs}
                                    </td>
                                </tr>
                                );
                            })}
                            </tbody>
                        </table>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Right Column: Skill Summary */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border-2 border-black shadow-cartoon">
                <h3 className="font-display text-3xl mb-4">SKILL PROFILE</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#1d1d1b', fontSize: 12, fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="Player" dataKey="A" stroke="#2d6664" fill="#2d6664" fillOpacity={0.5} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: '2px solid black', boxShadow: '4px 4px 0px 0px #000' }}
                                itemStyle={{ fontWeight: 'bold', color: '#a13920' }}
                                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Efficiency']}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-pink p-6 rounded-xl border-2 border-black shadow-cartoon">
                 <h3 className="font-display text-3xl mb-4 text-terracotta">QUICK STATS</h3>
                 <div className="space-y-3">
                     <div className="flex justify-between items-center border-b border-black/10 pb-2">
                         <span className="font-bold">Total Points</span>
                         <span className="font-display text-2xl">{stats.reduce((acc, s) => acc + s.totalPoints, 0)}</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-black/10 pb-2">
                         <span className="font-bold">Errors</span>
                         <span className="font-display text-2xl">{stats.reduce((acc, s) => acc + s.errors, 0)}</span>
                     </div>
                     <div className="flex justify-between items-center pb-2">
                         <span className="font-bold">Best Match</span>
                         <span className="font-display text-2xl text-terracotta">{Math.max(...stats.map(s => s.rating), 0)}</span>
                     </div>
                 </div>
            </div>
            
            <div className="bg-teal text-cream p-6 rounded-xl border-2 border-black shadow-cartoon">
                <h3 className="font-display text-3xl mb-2">TRENDING</h3>
                <div className="text-sm mb-4 opacity-80">Last 3 Matches</div>
                <div className="flex items-center gap-2">
                    {stats.slice(0, 3).map((s, i) => (
                        <div key={i} className={`h-2 rounded flex-1 ${s.rating >= 7 ? 'bg-lime' : 'bg-white/20'}`}></div>
                    ))}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
