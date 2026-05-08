
import React, { useState, useEffect } from 'react';
import { Player, PlayerPosition, User, Team } from '../types';
import { generateId } from '../services/dbService';
import { playerRepository, teamRepository } from '../lib/repositories';
import { Button } from '../components/ui/Buttons';

interface TeamsProps {
  user: User;
  showToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onNavigate: (path: string) => void;
}

export const Teams: React.FC<TeamsProps> = ({ user, showToast, onNavigate }) => {
    const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isAddingNew, setIsAddingNew] = useState(false);

    // Sync State
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [officialSeasons, setOfficialSeasons] = useState<any[]>([]);
    const [officialCompetitions, setOfficialCompetitions] = useState<any[]>([]);
    const [officialTeams, setOfficialTeams] = useState<any[]>([]);
    const [selectedSyncSeason, setSelectedSyncSeason] = useState('');
    const [selectedSyncComp, setSelectedSyncComp] = useState('');

    useEffect(() => {
        if (showSyncModal && officialSeasons.length === 0) {
            fetch('/api/official/seasons')
                .then(res => res.json())
                .then(data => {
                    setOfficialSeasons(data);
                    if (data.length > 0) setSelectedSyncSeason(data[0].id);
                });
        }
    }, [showSyncModal]);

    useEffect(() => {
        if (selectedSyncSeason) {
            fetch(`/api/official/competitions?season_id=${selectedSyncSeason}`)
                .then(res => res.json())
                .then(data => setOfficialCompetitions(data));
        }
    }, [selectedSyncSeason]);

    useEffect(() => {
        if (selectedSyncComp) {
            fetch(`/api/official/competitions/${selectedSyncComp}/teams`)
                .then(res => res.json())
                .then(data => setOfficialTeams(data));
        }
    }, [selectedSyncComp]);

    const handleImportTeam = async (offTeam: any) => {
        if (!user.clubId) return;
        try {
            const newTeam = await teamRepository.createTeam({
                id: generateId(),
                clubId: user.clubId,
                name: offTeam.name,
                category: officialCompetitions.find(c => c.id === selectedSyncComp)?.category || 'General',
                gender: 'M' // Default
            });
            setTeams(prev => [...prev, newTeam]);
            setSelectedTeamId(newTeam.id);
            setShowSyncModal(false);
            showToast('success', 'Team Imported', `Added ${offTeam.name} to your club.`);
        } catch (e) {
            showToast('error', 'Sync Failed', 'Could not import team.');
        }
    };
  
    useEffect(() => {
      const loadData = async () => {
          if (user.clubId) {
              const clubTeams = await teamRepository.getTeams(user.clubId);
              setTeams(clubTeams);
              if (!selectedTeamId && clubTeams.length > 0) {
                  setSelectedTeamId(clubTeams[0].id);
              }
          }
      };
      loadData();
    }, [user.clubId]);

    useEffect(() => {
        const loadPlayers = async () => {
            if (selectedTeamId && user.clubId) {
                const players = await playerRepository.getTeamPlayers(selectedTeamId, user.clubId);
                setTeamPlayers(players);
            }
        };
        loadPlayers();
    }, [selectedTeamId, user.clubId]);
  
    const handleEditChange = (field: keyof Player, value: string) => {
      if (!editingPlayer) return;
      let updated: Player = { ...editingPlayer };
  
      if (field === 'shirtNumber') {
        updated.shirtNumber = parseInt(value || '0', 10);
      } else if (field === 'position') {
        updated.position = value as PlayerPosition;
      } else {
        (updated as any)[field] = value;
      }
  
      setEditingPlayer(updated);
    };

    const handleCreateNewClick = () => {
        if (!user.clubId || !selectedTeamId) return;
        const newP: Player = {
            id: generateId(), // temp
            teamId: selectedTeamId,
            clubId: user.clubId,
            firstName: '',
            lastName: '',
            position: PlayerPosition.OUTSIDE_HITTER,
            shirtNumber: 0,
            averageRating: 6.0,
            matchesPlayed: 0,
            region: 'Lombardia',
            category: 'U19'
        };
        setEditingPlayer(newP);
        setIsAddingNew(true);
    };
  
    const handleSavePlayer = async () => {
      if (!editingPlayer) return;
      setIsSaving(true);
      try {
        if (isAddingNew) {
            const created = await playerRepository.createPlayer(editingPlayer);
            setTeamPlayers(prev => [...prev, created]);
            showToast('success', 'Player Added', `${created.firstName} joined the team.`);
        } else {
            const saved = await playerRepository.updatePlayer(editingPlayer);
            setTeamPlayers((prev) =>
            prev.map((p) => (p.id === saved.id ? saved : p))
            );
            showToast('success', 'Player Updated', `${saved.firstName} updated.`);
        }
        setEditingPlayer(null);
        setIsAddingNew(false);
      } catch (e) {
        showToast('error', 'Error', 'Failed to save player');
      } finally {
        setIsSaving(false);
      }
    };
  
    const groupedPlayers = {
        [PlayerPosition.SETTER]: teamPlayers.filter(p => p.position === PlayerPosition.SETTER),
        [PlayerPosition.OUTSIDE_HITTER]: teamPlayers.filter(p => p.position === PlayerPosition.OUTSIDE_HITTER),
        [PlayerPosition.OPPOSITE]: teamPlayers.filter(p => p.position === PlayerPosition.OPPOSITE),
        [PlayerPosition.MIDDLE_BLOCKER]: teamPlayers.filter(p => p.position === PlayerPosition.MIDDLE_BLOCKER),
        [PlayerPosition.LIBERO]: teamPlayers.filter(p => p.position === PlayerPosition.LIBERO),
    };

    const roleColors: Record<string, string> = {
        [PlayerPosition.SETTER]: 'bg-pink',
        [PlayerPosition.OUTSIDE_HITTER]: 'bg-teal text-white',
        [PlayerPosition.OPPOSITE]: 'bg-terracotta text-white',
        [PlayerPosition.MIDDLE_BLOCKER]: 'bg-lime',
        [PlayerPosition.LIBERO]: 'bg-cream-dark',
    };

    return (
      <div className="flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6 border-b-2 border-black/10 pb-4">
             <div>
                 <h1 className="font-title text-5xl uppercase text-teal leading-none">
                    Team Roster
                 </h1>
                 <p className="text-terracotta font-bold mt-1">{teamPlayers.length} Players Active</p>
             </div>
             <div className="flex gap-4 items-center">
                <select
                    className="border-2 border-black rounded-lg px-3 py-1 bg-white font-bold"
                    value={selectedTeamId || ''}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                >
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setShowSyncModal(true)}>🌐 Sync FIPAV</Button>
                    <Button onClick={handleCreateNewClick}>+ Add Player</Button>
                </div>
             </div>
          </div>
          
          <div className="space-y-10">
            {Object.entries(groupedPlayers).map(([role, players]) => {
                if (players.length === 0) return null;
                return (
                    <div key={role}>
                        <h2 className="font-title text-3xl uppercase mb-4 flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-lg border-2 border-black text-sm ${roleColors[role] || 'bg-gray-200'}`}>
                                {role.replace('_', ' ')}
                            </span>
                            <span className="text-black/30 text-xl">({players.length})</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {players.map((p) => (
                            <div
                                key={p.id}
                                className="bg-white p-4 border-2 border-black rounded-card shadow-cartoon flex flex-col gap-3 hover:-translate-y-1 hover:shadow-cartoon-hover transition-all duration-300"
                            >
                                <div className="flex items-center gap-3">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-display text-2xl border-2 border-black ${roleColors[role] || 'bg-gray-200'}`}>
                                    {p.shirtNumber}
                                </div>
                                <div>
                                    <div className="font-title text-2xl leading-none">
                                    {p.firstName} {p.lastName}
                                    </div>
                                    <div className="text-xs uppercase text-black/50 font-soft font-bold mt-1">
                                    {p.category} • {p.region}
                                    </div>
                                </div>
                                </div>
                
                                {typeof p.averageRating === 'number' && (
                                <div className="flex items-center justify-between text-xs font-soft bg-cream-light p-2 rounded border border-black/10 mt-2">
                                    <span className="text-black/70 font-bold uppercase tracking-wider">Season Avg</span>
                                    <span className={`border-2 border-black rounded-lg px-2 py-[2px] font-title text-lg ${p.averageRating >= 7.5 ? 'bg-lime' : 'bg-white'}`}>
                                    {p.averageRating.toFixed(1)}
                                    </span>
                                </div>
                                )}
                
                                <div className="mt-2 flex gap-2">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => {
                                    onNavigate(`/players/${p.id}`);
                                    }}
                                >
                                    Stats
                                </Button>
                                <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => { setIsAddingNew(false); setEditingPlayer(p); }}
                                >
                                    Edit
                                </Button>
                                </div>
                            </div>
                            ))}
                        </div>
                    </div>
                );
            })}
          </div>
        </div>

        {/* EDIT SIDEBAR */}
        {editingPlayer && (
            <div className="w-full md:w-1/3 bg-white border-l-2 border-black p-6 fixed right-0 top-0 bottom-0 shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="font-title text-4xl text-teal">{isAddingNew ? 'NEW PLAYER' : 'EDIT PLAYER'}</h2>
                    <button onClick={() => setEditingPlayer(null)} className="text-4xl hover:text-terracotta leading-none">&times;</button>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-black/70">First Name</label>
                        <input 
                            className="w-full border-2 border-black rounded-lg p-3 font-soft focus:outline-none focus:ring-2 focus:ring-lime"
                            value={editingPlayer.firstName}
                            onChange={(e) => handleEditChange('firstName', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-black/70">Last Name</label>
                        <input 
                            className="w-full border-2 border-black rounded-lg p-3 font-soft focus:outline-none focus:ring-2 focus:ring-lime"
                            value={editingPlayer.lastName}
                            onChange={(e) => handleEditChange('lastName', e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-black/70">Number</label>
                            <input 
                                type="number"
                                className="w-full border-2 border-black rounded-lg p-3 font-soft focus:outline-none focus:ring-2 focus:ring-lime"
                                value={editingPlayer.shirtNumber}
                                onChange={(e) => handleEditChange('shirtNumber', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-black/70">Position</label>
                            <select 
                                className="w-full border-2 border-black rounded-lg p-3 font-soft focus:outline-none focus:ring-2 focus:ring-lime bg-white"
                                value={editingPlayer.position}
                                onChange={(e) => handleEditChange('position', e.target.value)}
                            >
                                {Object.values(PlayerPosition).map(pos => (
                                    <option key={pos} value={pos}>{pos.replace('_', ' ')}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="pt-8 flex gap-3">
                        <Button className="flex-1" size="lg" onClick={handleSavePlayer} disabled={isSaving}>
                            {isSaving ? 'SAVING...' : 'SAVE PLAYER'}
                        </Button>
                        <Button variant="secondary" size="lg" onClick={() => setEditingPlayer(null)}>
                            CANCEL
                        </Button>
                    </div>
                </div>
            </div>
        )}

        {/* SYNC MODAL */}
        {showSyncModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-cream border-4 border-black rounded-card shadow-cartoon p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-title text-4xl text-teal">SYNC FIPAV TRENTINO</h2>
                        <button onClick={() => setShowSyncModal(false)} className="text-4xl hover:text-terracotta leading-none">&times;</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-1">Season</label>
                            <select
                                className="w-full border-2 border-black rounded-lg p-3 bg-white"
                                value={selectedSyncSeason}
                                onChange={(e) => setSelectedSyncSeason(e.target.value)}
                            >
                                {officialSeasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-1">Competition</label>
                            <select
                                className="w-full border-2 border-black rounded-lg p-3 bg-white"
                                value={selectedSyncComp}
                                onChange={(e) => setSelectedSyncComp(e.target.value)}
                            >
                                <option value="">Select Competition...</option>
                                {officialCompetitions.map(c => <option key={c.id} value={c.id}>[{c.category}] {c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-bold uppercase text-sm border-b-2 border-black/10 pb-2">Teams in Competition</h3>
                        {officialTeams.length === 0 && <div className="text-gray-400 italic">Select a competition to see teams.</div>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {officialTeams.map(offTeam => (
                                <div key={offTeam.id} className="flex justify-between items-center p-3 bg-white border-2 border-black rounded-lg">
                                    <span className="font-bold">{offTeam.name}</span>
                                    <Button size="sm" onClick={() => handleImportTeam(offTeam)}>Import</Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
};
