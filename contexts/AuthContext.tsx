import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../supabase';
import { authRepository, useSupabase } from '../lib/repositories';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription: any;
    const initAuth = async () => {
      if (useSupabase) {
        // Supabase Auth
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const dbUser = await authRepository.getUser(session.user.id);
          setUser(dbUser);
        }
        
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            const dbUser = await authRepository.getUser(session.user.id);
            setUser(dbUser);
          } else {
            setUser(null);
          }
          setLoading(false);
        });
        subscription = data.subscription;
        
        setLoading(false);
      } else {
        // Mock Auth
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
      }
    };

    initAuth();
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const login = async (email?: string, password?: string) => {
    if (useSupabase) {
      if (email && password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          const dbUser = await authRepository.getUser(data.user.id);
          setUser(dbUser);
        }
      } else {
        // Default to Google OAuth if no email/password provided
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
        });
        if (error) throw error;
      }
    } else {
      // Mock Auth
      const mockUser: User = {
        id: 'mock-user-1',
        name: 'Demo Coach',
        email: 'coach@volleyrank.com',
        role: UserRole.STAFF,
        clubId: 'c1',
      };
      localStorage.setItem('volleyrank_user', JSON.stringify(mockUser));
      setUser(mockUser);
    }
  };

  const logout = async () => {
    if (useSupabase) {
      await supabase.auth.signOut();
      setUser(null);
    } else {
      localStorage.removeItem('volleyrank_user');
      setUser(null);
    }
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
