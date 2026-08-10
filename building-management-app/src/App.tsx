import React, { useState } from 'react';
import { ViewState } from './types';
import Auth, { UserRole } from './components/Auth';
import Home from './components/Home';
import Services from './components/Services';
import Community from './components/Community';
import Guests from './components/Guests';
import Profile from './components/Profile';
import BottomNav from './components/BottomNav';
import Messages from './components/Messages';
import Rentals from './components/Rentals';
import { MessageSquare } from 'lucide-react';

export default function App() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('home');

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    setCurrentView('home');
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentView('login');
  };

  // The outer div acts as a device frame on desktop and full screen on mobile.
  return (
    <div className="min-h-[100dvh] bg-slate-50 flex justify-center font-sans">
      <div className="w-full max-w-md bg-white shadow-2xl overflow-hidden flex flex-col relative min-h-[100dvh]">
        
        {/* Dynamic content rendering based on view state */}
        {!userRole ? (
          <Auth onLogin={handleLogin} />
        ) : (
          <>
            {currentView === 'home' && <Home navigate={setCurrentView} userRole={userRole} />}
            
            {/* Community tab handles notices, marketplace, voting internally via subviews */}
            {(currentView === 'community' || currentView === 'notices' || currentView === 'marketplace' || currentView === 'voting') && (
              <Community currentView={currentView} navigate={setCurrentView} userRole={userRole} />
            )}
            
            {/* Services tab handles amenities, complaints, directory, expenses */}
            {(currentView === 'services' || currentView === 'amenities' || currentView === 'complaints' || currentView === 'directory' || currentView === 'expenses') && (
              <Services currentView={currentView} navigate={setCurrentView} userRole={userRole} />
            )}
            
            {currentView === 'guests' && <Guests userRole={userRole} />}
            {currentView === 'profile' && <Profile onLogout={handleLogout} userRole={userRole} />}
            
            {currentView === 'messages' && <Messages onBack={() => setCurrentView('home')} userRole={userRole} />}
            {currentView === 'rentals' && <Rentals onBack={() => setCurrentView('home')} userRole={userRole} />}

            {/* Render Bottom Navigation unless in full-screen flow (if any) */}
            {!(currentView === 'notices' || currentView === 'marketplace' || currentView === 'voting' || currentView === 'amenities' || currentView === 'complaints' || currentView === 'directory' || currentView === 'expenses' || currentView === 'messages' || currentView === 'rentals') && (
              <BottomNav currentView={currentView} navigate={setCurrentView} />
            )}

            {/* Floating Chat Button */}
            {currentView !== 'messages' && (
              <button
                onClick={() => setCurrentView('messages')}
                className="absolute bottom-24 right-6 w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-200 active:scale-95 transition-transform z-50"
              >
                <MessageSquare className="w-6 h-6" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
