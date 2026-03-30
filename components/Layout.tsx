import React, { ReactNode } from 'react';
import { User } from '../types';
import { Button } from './ui/Buttons';

interface LayoutProps {
  children: ReactNode;
  user?: User;
  onLogout?: () => void;
  onNavigate: (path: string) => void;
  currentPath: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, onNavigate, currentPath }) => {
  return (
    <div className="min-h-screen flex flex-col font-sans text-black">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-teal text-cream border-b-4 border-black shadow-md">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center cursor-pointer" onClick={() => onNavigate('/')}>
              <span className="font-display text-4xl tracking-tight leading-none pt-1">VOLLEY<span className="text-lime">RANK</span></span>
            </div>
            
            <div className="hidden md:flex space-x-8 items-center">
              {user && (
                <>
                  <NavButton active={currentPath === '/dashboard'} onClick={() => onNavigate('/dashboard')}>Dashboard</NavButton>
                  <NavButton active={currentPath === '/teams'} onClick={() => onNavigate('/teams')}>Teams</NavButton>
                  <NavButton active={currentPath === '/leaderboards'} onClick={() => onNavigate('/leaderboards')}>Leaderboards</NavButton>
                </>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                   <div className="hidden sm:block text-right">
                      <div className="text-xs opacity-80 uppercase tracking-widest">{user.role}</div>
                      <div className="font-bold leading-none">{user.name}</div>
                   </div>
                   <Button variant="danger" size="sm" onClick={onLogout}>Logout</Button>
                </>
              ) : (
                <Button variant="primary" size="sm" onClick={() => onNavigate('/login')}>Login</Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu (simplified) */}
      <div className="md:hidden bg-teal text-cream flex justify-around p-2 border-b-2 border-black">
          {user && (
            <>
              <MobileNavButton active={currentPath === '/dashboard'} onClick={() => onNavigate('/dashboard')}>Dash</MobileNavButton>
              <MobileNavButton active={currentPath === '/teams'} onClick={() => onNavigate('/teams')}>Teams</MobileNavButton>
              <MobileNavButton active={currentPath === '/leaderboards'} onClick={() => onNavigate('/leaderboards')}>Ranks</MobileNavButton>
            </>
          )}
      </div>

      {/* Main Content */}
      <main className="flex-grow max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-black text-cream py-8 mt-12">
        <div className="max-w-[1600px] mx-auto px-4 text-center">
          <p className="font-display text-2xl uppercase text-lime mb-2">VolleyRank MVP</p>
          <p className="text-sm opacity-60">Scout. Rate. Dominate.</p>
        </div>
      </footer>
    </div>
  );
};

interface NavButtonProps {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ children, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`uppercase font-bold tracking-wide text-sm transition-colors ${active ? 'text-lime border-b-2 border-lime' : 'text-cream hover:text-lime'}`}
  >
    {children}
  </button>
);

const MobileNavButton: React.FC<NavButtonProps> = ({ children, active, onClick }) => (
    <button 
      onClick={onClick}
      className={`uppercase font-bold text-xs p-2 ${active ? 'text-lime' : 'text-cream'}`}
    >
      {children}
    </button>
  );