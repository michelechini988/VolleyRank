
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Scouting } from './pages/Scouting';
import { PlayerProfile } from './pages/PlayerProfile';
import { Leaderboard } from './pages/Leaderboard';
import { Teams } from './pages/Teams';
import { Button } from './components/ui/Buttons';
import { ToastContainer, ToastMessage, ToastType } from './components/ui/Toast';
import { User, UserRole, Player } from './types';

// Simple Hash Router Implementation
const App: React.FC = () => {
  const [route, setRoute] = useState<string>(window.location.hash.slice(1) || '/');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  // Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('volleyrank_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Invalid user data in localStorage", e);
          localStorage.removeItem('volleyrank_user');
        }
      }
      setIsAuthReady(true);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((path: string) => {
    window.location.hash = path;
  }, []);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleLogin = async () => {
    try {
        // Mock login for prototype
        const mockUser: User = {
          id: 'mock-user-1',
          name: 'Demo Coach',
          email: 'coach@volleyrank.com',
          role: UserRole.STAFF,
          clubId: 'c1',
        };
        localStorage.setItem('volleyrank_user', JSON.stringify(mockUser));
        setUser(mockUser);
        addToast('success', 'Logged In', 'Welcome to VolleyRank (Demo Mode)!');
        navigate('/dashboard');
    } catch (error) {
        console.error("Login failed", error);
        addToast('error', 'Login Failed', 'Could not sign in.');
    }
  };

  const handleLogout = async () => {
    try {
        localStorage.removeItem('volleyrank_user');
        setUser(null);
        navigate('/');
        addToast('info', 'Logged Out', 'See you next time!');
    } catch (error) {
        console.error("Logout failed", error);
    }
  };

  const handleResetData = () => {
      if(confirm('Are you sure you want to reset all data? This cannot be undone.')) {
          try {
              localStorage.clear();
          } catch (e) {
              console.error('Failed to clear localStorage', e);
          }
          window.location.reload();
      }
  };

  // --- Views ---

  const LandingPage = () => {
    return (
      <div className="space-y-24 pb-12">
        {/* Hero Section */}
        <section className="text-center pt-16 md:pt-24 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div>
            <h1 className="font-title text-8xl md:text-9xl text-teal mb-2 uppercase tracking-tighter leading-[0.85]">
              Volley<span className="text-lime">Rank</span>
            </h1>
            <p className="text-xl md:text-2xl font-medium max-w-2xl mx-auto text-black/80">
              Scout like a pro. Rate like a fan. Dominate the league.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="xl" onClick={handleLogin}>
              Login with Google
            </Button>
          </div>
        </section>

        {/* Player Cards Showcase */}
        <section className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center mb-12">
            <h2 className="font-title text-5xl uppercase text-black mb-2">
              Top Performers
            </h2>
            <div className="h-2 w-24 bg-terracotta rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-cream-dark border-2 border-black rounded-card shadow-cartoon p-4 hover:translate-y-[-4px] hover:shadow-cartoon-hover transition-all duration-300">
              <div className="aspect-[4/3] bg-teal rounded-lg border-2 border-black mb-4 flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1592656094267-764a45160876?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80')] bg-cover bg-center opacity-80 mix-blend-multiply" />
                <span className="font-title text-9xl text-cream opacity-50 relative z-10">
                  10
                </span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs font-soft font-bold uppercase tracking-wider text-terracotta mb-1">
                    Outside Hitter
                  </div>
                  <div className="font-title text-4xl leading-none">
                    MICHIELETTO
                  </div>
                </div>
                <div className="bg-lime border-2 border-black rounded-lg px-2 py-1 transform rotate-[-3deg]">
                  <span className="font-title text-3xl">8.3</span>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-cream-dark border-2 border-black rounded-card shadow-cartoon p-4 hover:translate-y-[-4px] hover:shadow-cartoon-hover transition-all duration-300 md:-mt-8">
              <div className="aspect-[4/3] bg-pink rounded-lg border-2 border-black mb-4 flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1612872087720-48ca556cd077?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80')] bg-cover bg-center opacity-80 mix-blend-multiply" />
                <span className="font-title text-9xl text-white opacity-50 relative z-10">
                  9
                </span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs font-soft font-bold uppercase tracking-wider text-terracotta mb-1">
                    Setter
                  </div>
                  <div className="font-title text-4xl leading-none">
                    GIANNELLI
                  </div>
                </div>
                <div className="bg-white border-2 border-black rounded-lg px-2 py-1 transform rotate-[2deg]">
                  <span className="font-title text-3xl">9.1</span>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-cream-dark border-2 border-black rounded-card shadow-cartoon p-4 hover:translate-y-[-4px] hover:shadow-cartoon-hover transition-all duration-300">
              <div className="aspect-[4/3] bg-terracotta rounded-lg border-2 border-black mb-4 flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1593787406536-3676a152d913?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80')] bg-cover bg-center opacity-80 mix-blend-multiply" />
                <span className="font-title text-9xl text-cream opacity-50 relative z-10">
                  13
                </span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs font-soft font-bold uppercase tracking-wider text-black mb-1">
                    Libero
                  </div>
                  <div className="font-title text-4xl leading-none">
                    BALASO
                  </div>
                </div>
                <div className="bg-lime border-2 border-black rounded-lg px-2 py-1 transform rotate-[-1deg]">
                  <span className="font-title text-3xl">7.8</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer in layout handles the rest */}
      </div>
    );
  };

  // --- Router Logic ---

  const renderContent = () => {
    if (!user) return <LandingPage />;

    // Handle dynamic routes
    if (route.startsWith('/players/')) {
        const playerId = route.split('/')[2];
        return <PlayerProfile user={user} playerId={playerId} onNavigate={navigate} />;
    }
    
    if (route.startsWith('/scout/')) {
        const matchId = route.split('/')[2];
        return <Scouting 
            matchId={matchId} 
            user={user} 
            onFinished={() => navigate('/dashboard')} 
            showToast={addToast}
        />;
    }

    switch (route) {
      case '/dashboard':
        return <Dashboard user={user} onNavigate={navigate} />;
      case '/teams':
        return <Teams user={user} showToast={addToast} onNavigate={navigate} />;
      case '/leaderboards':
        return <Leaderboard user={user} />;
      default:
        return <Dashboard user={user} onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Layout 
        user={user} 
        onLogout={handleLogout} 
        currentPath={route} 
        onNavigate={navigate}
      >
        {renderContent()}
      </Layout>
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Dev Tool: Reset Data */}
      <div className="fixed bottom-2 right-2 opacity-20 hover:opacity-100 transition-opacity">
          <button onClick={handleResetData} className="text-[10px] bg-red-500 text-white px-2 py-1 rounded">
              Reset Data
          </button>
      </div>
    </div>
  );
};

export default App;
