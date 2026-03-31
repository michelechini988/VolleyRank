import React, { useEffect, useState } from 'react';
import { Player, PlayerPosition, User } from '../types';
import { playerRepository } from '../lib/repositories';

interface LeaderboardProps {
  user: User;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ user }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    if (user.clubId) {
        playerRepository.getLeaderboard({ role: roleFilter, region: regionFilter, clubId: user.clubId }).then(data => {
            setPlayers(data);
            setLoading(false);
        });
    } else {
        setLoading(false);
    }
  }, [roleFilter, regionFilter, user.clubId]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="font-display text-6xl text-center mb-8 uppercase">Leaderboards</h1>

        {/* Filters Bar */}
        <div className="bg-cream-dark border-2 border-black rounded-xl p-4 mb-8 flex flex-col md:flex-row gap-4 justify-center items-center shadow-cartoon-sm">
            <div className="flex flex-col gap-1 w-full md:w-auto">
                <label className="text-xs font-bold uppercase tracking-widest">Role</label>
                <select 
                    value={roleFilter} 
                    onChange={e => setRoleFilter(e.target.value)}
                    className="border-2 border-black rounded-lg px-4 py-2 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-teal"
                >
                    <option value="all">All Roles</option>
                    {Object.values(PlayerPosition).map(p => (
                        <option key={p} value={p}>{p.replace('_', ' ').toUpperCase()}</option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col gap-1 w-full md:w-auto">
                <label className="text-xs font-bold uppercase tracking-widest">Region</label>
                <select 
                    value={regionFilter} 
                    onChange={e => setRegionFilter(e.target.value)}
                    className="border-2 border-black rounded-lg px-4 py-2 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-teal"
                >
                    <option value="all">All Regions</option>
                    <option value="Lombardia">Lombardia</option>
                    <option value="Veneto">Veneto</option>
                    <option value="Calabria">Calabria</option>
                </select>
            </div>
        </div>

        {/* Leaderboard List */}
        <div className="max-w-4xl mx-auto space-y-4">
            {loading ? (
                <div className="text-center font-display text-3xl py-12 animate-pulse">Updating Rankings...</div>
            ) : (
                players.map((player, index) => (
                    <div 
                        key={player.id} 
                        className="bg-white border-2 border-black rounded-xl p-4 flex items-center gap-4 md:gap-6 shadow-sm hover:shadow-cartoon hover:-translate-x-1 transition-all"
                    >
                        {/* Rank */}
                        <div className={`
                            w-12 h-12 md:w-16 md:h-16 flex items-center justify-center font-display text-3xl md:text-5xl border-r-2 border-gray-100 pr-4
                            ${index === 0 ? 'text-lime' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-terracotta' : 'text-black'}
                        `}>
                            #{index + 1}
                        </div>

                        {/* Player Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg md:text-xl truncate">{player.firstName} {player.lastName}</h3>
                                {index === 0 && <span className="text-xl">👑</span>}
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs font-bold uppercase text-gray-500">
                                <span className="bg-gray-100 px-2 py-1 rounded border border-black/10">{player.position.replace('_', ' ')}</span>
                                <span className="bg-gray-100 px-2 py-1 rounded border border-black/10">{player.region}</span>
                                <span>{player.matchesPlayed} Matches</span>
                            </div>
                        </div>

                        {/* Trend */}
                        <div className="hidden md:flex flex-col items-center px-4">
                            {player.trend === 'up' && <span className="text-lime text-2xl">▲</span>}
                            {player.trend === 'down' && <span className="text-terracotta text-2xl">▼</span>}
                            {player.trend === 'stable' && <span className="text-gray-300 text-2xl">−</span>}
                        </div>

                        {/* Rating */}
                        <div className="bg-teal text-cream rounded-lg px-4 py-2 border-2 border-black text-center min-w-[80px]">
                            <div className="font-display text-3xl md:text-4xl leading-none">{player.averageRating}</div>
                            <div className="text-[10px] uppercase font-bold">AVG</div>
                        </div>
                    </div>
                ))
            )}
            
            {players.length === 0 && !loading && (
                <div className="text-center py-12 font-bold text-gray-500">No players found matching filters.</div>
            )}
        </div>
    </div>
  );
};