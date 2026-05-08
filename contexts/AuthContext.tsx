import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { authRepository } from '../lib/repositories';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('volleyrank_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Invalid user data in localStorage", e);
          localStorage.removeItem('volleyrank_user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (role: UserRole = UserRole.STAFF) => {
    let mockUser: User;

    if (role === UserRole.PLAYER) {
      mockUser = {
        id: 'mock-player-1',
        name: 'Marco Rossi',
        email: 'player@volleyrank.com',
        role: UserRole.PLAYER,
        playerId: 'p1', // Should match some player in DB
        clubId: 'c1',
      };
    } else if (role === UserRole.CLUB_ADMIN) {
      mockUser = {
        id: 'mock-admin-1',
        name: 'Admin Volley',
        email: 'admin@volleyrank.com',
        role: UserRole.CLUB_ADMIN,
        clubId: 'c1',
      };
    } else {
      mockUser = {
        id: 'mock-staff-1',
        name: 'Coach Demo',
        email: 'coach@volleyrank.com',
        role: UserRole.STAFF,
        clubId: 'c1',
      };
    }

    localStorage.setItem('volleyrank_user', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const logout = async () => {
    localStorage.removeItem('volleyrank_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
