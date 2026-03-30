
import React, { useEffect, useState } from 'react';
import { User, UserRole, Match } from '../types';
import { Button } from '../components/ui/Buttons';
import { getMatches, createMatch, generateId } from '../services/dbService';

interface DashboardProps {
  user: User;
  onNavigate: (path: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // New Match Modal State
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [newMatchData, setNewMatchData] = useState({
      opponentName: '',
      date: new Date().toISOString().split('T')[0],
      competition: 'Friendly',
      isHome: true,
      location: 'Home Court'
  });

  useEffect(() => {
    if (user.clubId) {
        getMatches('t1', user.clubId).then(data => {
            setMatches(data);
            setLoading(false);
        });
    } else {
        setLoading(false);
    }
  }, [user.clubId]);

  const handleCreateMatch = async () => {
      if (!newMatchData.opponentName || !user.clubId) return;
      try {
          const match = await createMatch({
              id: generateId(),
              teamId: 't1',
              clubId: user.clubId,
              opponentName: newMatchData.opponentName,
              date: newMatchData.date,
              competition: newMatchData.competition,
              isHome: newMatchData.isHome,
              location: newMatchData.location,
              status: 'scheduled'
          });
          setMatches(prev => [match, ...prev]); // Add to top
          setShowCreateMatch(false);
          // Reset form
          setNewMatchData({ opponentName: '', date: new Date().toISOString().split('T')[0], competition: 'Friendly', isHome: true, location: 'Home Court' });
      } catch (e) {
          alert('Errore durante la creazione del match. Riprova.');
          console.error(e);
      }
  };

  const nextMatch = matches.find(m => m.status === 'scheduled');
  const pastMatches = matches.filter(m => m.status === 'completed');

  // PLAYER VIEW (Unchanged basically)
  if (user.role === UserRole.PLAYER) {
      return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="border-b-2 border-black/10 pb-6">
                <h1 className="font-display text-6xl text-teal leading-none mb-2">PLAYER HUB</h1>
                <p className="text-lg text-terracotta font-medium">Hello, {user.name}</p>
            </header>
            
             {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                     <h2 className="font-display text-3xl">YOUR CAREER</h2>
                     <div 
                        className="bg-white border-2 border-black rounded-xl p-8 shadow-cartoon hover:shadow-cartoon-hover hover:-translate-y-1 transition-all cursor-pointer group"
                        onClick={() => onNavigate(`/players/${user.playerId || 'p1'}`)}
                     >
                         <span className="text-4xl mb-4 block">👤</span>
                         <h3 className="font-bold text-2xl group-hover:text-teal transition-colors">View Full Profile</h3>
                         <p className="opacity-60 text-sm mt-2">Check your stat progression and match history details.</p>
                     </div>
                 </div>

                 <div className="space-y-4">
                     <h2 className="font-display text-3xl">COMPETITION</h2>
                     <div 
                        className="bg-teal text-cream border-2 border-black rounded-xl p-8 shadow-cartoon hover:shadow-cartoon-hover hover:-translate-y-1 transition-all cursor-pointer group mb-4"
                        onClick={() => onNavigate('/leaderboards')}
                     >
                         <span className="text-4xl mb-4 block">🏆</span>
                         <h3 className="font-bold text-2xl group-hover:text-lime transition-colors">Global Leaderboards</h3>
                         <p className="opacity-80 text-sm mt-2">See how you rank against other players in your region.</p>
                     </div>

                     <div 
                        className="bg-white border-2 border-black rounded-xl p-8 shadow-cartoon hover:shadow-cartoon-hover hover:-translate-y-1 transition-all cursor-pointer group"
                        onClick={() => onNavigate('/teams')}
                     >
                         <span className="text-4xl mb-4 block">🏐</span>
                         <h3 className="font-bold text-2xl group-hover:text-teal transition-colors">My Team</h3>
                         <p className="opacity-60 text-sm mt-2">View your teammates and squad details.</p>
                     </div>
                 </div>
            </div>
        </div>
      );
  }

  // ADMIN / STAFF VIEW
  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-black/10 pb-6">
        <div>
          <h1 className="font-display text-6xl text-teal leading-none mb-2">DASHBOARD</h1>
          <p className="text-lg text-terracotta font-medium">Welcome back, {user.name}</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex gap-4">
            <Button variant="primary" onClick={() => setShowCreateMatch(true)}>+ New Match</Button>
            <Button variant="secondary" onClick={() => onNavigate('/teams')}>Manage Teams</Button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Next Match & Actions */}
        <div className="lg:col-span-2 space-y-8">
            <section className="bg-white border-2 border-black rounded-xl p-6 shadow-cartoon relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-lime px-4 py-1 border-b-2 border-l-2 border-black font-bold uppercase text-xs">
                    Next Match
                </div>
                {nextMatch ? (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-4">
                        <div className="text-center md:text-left">
                            <div className="text-sm uppercase tracking-widest text-gray-500 mb-1">{nextMatch.competition}</div>
                            <div className="font-display text-5xl mb-2">{nextMatch.opponentName}</div>
                            <div className="flex items-center gap-2 justify-center md:justify-start">
                                <span className={`px-2 py-1 text-xs font-bold rounded border border-black ${nextMatch.isHome ? 'bg-pink' : 'bg-gray-200'}`}>
                                    {nextMatch.isHome ? 'HOME' : 'AWAY'}
                                </span>
                                <span className="text-lg font-bold">{new Date(nextMatch.date).toLocaleDateString()}</span>
                            </div>
                        </div>
                        
                        {(user.role === UserRole.STAFF || user.role === UserRole.CLUB_ADMIN) && (
                            <Button size="lg" onClick={() => onNavigate(`/scout/${nextMatch.id}`)}>
                                Start Scouting
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="py-8 text-center flex flex-col items-center">
                        <div className="text-gray-500 italic mb-4">No upcoming matches scheduled.</div>
                        <Button variant="secondary" size="sm" onClick={() => setShowCreateMatch(true)}>Create One Now</Button>
                    </div>
                )}
            </section>

            <section>
                <div className="flex items-center justify-between mb-4">
                     <h2 className="font-display text-4xl text-black">RECENT RESULTS</h2>
                </div>
                <div className="space-y-4">
                    {pastMatches.length === 0 && <div className="text-gray-400 italic">No completed matches yet.</div>}
                    {pastMatches.map(match => (
                        <div key={match.id} className="bg-cream-dark border border-black p-4 rounded-lg flex justify-between items-center hover:bg-white transition-colors cursor-pointer" onClick={() => onNavigate(`/scout/${match.id}`)}>
                            <div className="flex flex-col">
                                <span className="font-bold text-lg">{match.opponentName}</span>
                                <span className="text-xs uppercase opacity-70">{new Date(match.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className={`px-3 py-1 font-display text-xl border border-black rounded ${match.result?.startsWith('3') ? 'bg-lime' : 'bg-pink'}`}>
                                    {match.result || '-'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>

        {/* Right Col: Quick Stats */}
        <div className="space-y-6">
            <div className="bg-teal text-cream p-6 rounded-xl border-2 border-black shadow-cartoon">
                <h3 className="font-display text-3xl mb-4">CLUB STATUS</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-cream/20 pb-2">
                        <span>Total Matches</span>
                        <span className="font-bold text-xl">{matches.length}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-cream/20 pb-2">
                        <span>Scheduled</span>
                        <span className="font-bold text-xl">{matches.filter(m => m.status === 'scheduled').length}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* CREATE MATCH MODAL */}
      {showCreateMatch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-cream border-4 border-black rounded-card shadow-cartoon p-6 max-w-md w-full">
                <h2 className="font-display text-4xl mb-4">New Match</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs uppercase font-bold mb-1">Opponent Name</label>
                        <input 
                            className="w-full border-2 border-black rounded-lg px-3 py-2" 
                            placeholder="e.g. Modena Volley"
                            value={newMatchData.opponentName}
                            onChange={(e) => setNewMatchData({...newMatchData, opponentName: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs uppercase font-bold mb-1">Date</label>
                            <input 
                                type="date"
                                className="w-full border-2 border-black rounded-lg px-3 py-2" 
                                value={newMatchData.date}
                                onChange={(e) => setNewMatchData({...newMatchData, date: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase font-bold mb-1">Location</label>
                            <select 
                                className="w-full border-2 border-black rounded-lg px-3 py-2 bg-white" 
                                value={newMatchData.isHome ? 'home' : 'away'}
                                onChange={(e) => setNewMatchData({...newMatchData, isHome: e.target.value === 'home'})}
                            >
                                <option value="home">Home</option>
                                <option value="away">Away</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs uppercase font-bold mb-1">Competition</label>
                        <input 
                            className="w-full border-2 border-black rounded-lg px-3 py-2" 
                            value={newMatchData.competition}
                            onChange={(e) => setNewMatchData({...newMatchData, competition: e.target.value})}
                        />
                    </div>
                </div>
                <div className="flex gap-4 mt-8">
                    <Button variant="secondary" className="flex-1" onClick={() => setShowCreateMatch(false)}>Cancel</Button>
                    <Button variant="primary" className="flex-1" onClick={handleCreateMatch}>Create Match</Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
