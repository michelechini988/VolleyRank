import { Player, Match, Club, Team, PlayerPosition, UserRole, User } from '../types';

export const mockUsers: User[] = [
  {
    id: 'mock-user-1',
    name: 'Demo Coach',
    email: 'coach@volleyrank.com',
    role: UserRole.STAFF,
    clubId: 'c1',
  }
];

export const mockClubs: Club[] = [
  {
    id: 'c1',
    name: 'Volley Milano',
    city: 'Milano'
  }
];

export const mockTeams: Team[] = [
  {
    id: 't1',
    clubId: 'c1',
    name: 'Milano Pro',
    category: 'Serie A',
    gender: 'M'
  }
];

export const mockPlayers: Player[] = [
  {
    id: 'p1',
    teamId: 't1',
    clubId: 'c1',
    firstName: 'Alessandro',
    lastName: 'Michieletto',
    position: PlayerPosition.OUTSIDE_HITTER,
    shirtNumber: 5,
    height: 211,
    averageRating: 8.5,
    region: 'Lombardia',
    category: 'Serie A',
    matchesPlayed: 12,
    trend: 'up'
  },
  {
    id: 'p2',
    teamId: 't1',
    clubId: 'c1',
    firstName: 'Simone',
    lastName: 'Giannelli',
    position: PlayerPosition.SETTER,
    shirtNumber: 6,
    height: 199,
    averageRating: 9.1,
    region: 'Lombardia',
    category: 'Serie A',
    matchesPlayed: 12,
    trend: 'stable'
  },
  {
    id: 'p3',
    teamId: 't1',
    clubId: 'c1',
    firstName: 'Fabio',
    lastName: 'Balaso',
    position: PlayerPosition.LIBERO,
    shirtNumber: 7,
    height: 178,
    averageRating: 7.8,
    region: 'Lombardia',
    category: 'Serie A',
    matchesPlayed: 12,
    trend: 'up'
  },
  {
    id: 'p4',
    teamId: 't1',
    clubId: 'c1',
    firstName: 'Yuri',
    lastName: 'Romanò',
    position: PlayerPosition.OPPOSITE,
    shirtNumber: 16,
    height: 203,
    averageRating: 8.2,
    region: 'Lombardia',
    category: 'Serie A',
    matchesPlayed: 12,
    trend: 'down'
  },
  {
    id: 'p5',
    teamId: 't1',
    clubId: 'c1',
    firstName: 'Gianluca',
    lastName: 'Galassi',
    position: PlayerPosition.MIDDLE_BLOCKER,
    shirtNumber: 14,
    height: 201,
    averageRating: 7.5,
    region: 'Lombardia',
    category: 'Serie A',
    matchesPlayed: 12,
    trend: 'stable'
  },
  {
    id: 'p6',
    teamId: 't1',
    clubId: 'c1',
    firstName: 'Roberto',
    lastName: 'Russo',
    position: PlayerPosition.MIDDLE_BLOCKER,
    shirtNumber: 19,
    height: 207,
    averageRating: 8.0,
    region: 'Lombardia',
    category: 'Serie A',
    matchesPlayed: 12,
    trend: 'up'
  },
  {
    id: 'p7',
    teamId: 't1',
    clubId: 'c1',
    firstName: 'Daniele',
    lastName: 'Lavia',
    position: PlayerPosition.OUTSIDE_HITTER,
    shirtNumber: 15,
    height: 198,
    averageRating: 8.4,
    region: 'Lombardia',
    category: 'Serie A',
    matchesPlayed: 12,
    trend: 'stable'
  }
];

export const mockMatches: Match[] = [
  {
    id: 'm1',
    teamId: 't1',
    clubId: 'c1',
    opponentName: 'Trentino Volley',
    date: new Date().toISOString(),
    location: 'Milano Arena',
    isHome: true,
    competition: 'SuperLega',
    status: 'scheduled'
  },
  {
    id: 'm2',
    teamId: 't1',
    clubId: 'c1',
    opponentName: 'Sir Safety Perugia',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'PalaBarton',
    isHome: false,
    competition: 'SuperLega',
    status: 'completed',
    result: '3-1'
  }
];
