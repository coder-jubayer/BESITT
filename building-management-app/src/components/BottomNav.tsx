import React from 'react';
import { ViewState } from '../types';
import { 
  Home as HomeIcon, 
  Users, 
  Grid, 
  User, 
  ShieldCheck 
} from 'lucide-react';

interface BottomNavProps {
  currentView: ViewState;
  navigate: (view: ViewState) => void;
}

export default function BottomNav({ currentView, navigate }: BottomNavProps) {
  // Map subviews to main tabs
  const getTab = (view: ViewState) => {
    switch (view) {
      case 'home': return 'home';
      case 'notices':
      case 'marketplace':
      case 'voting':
      case 'community': return 'community';
      case 'amenities':
      case 'complaints':
      case 'directory':
      case 'expenses':
      case 'services': return 'services';
      case 'guests': return 'guests';
      case 'profile': return 'profile';
      default: return 'home';
    }
  };

  const activeTab = getTab(currentView);

  const tabs = [
    { id: 'home', icon: HomeIcon, label: 'Home' },
    { id: 'community', icon: Users, label: 'Community' },
    { id: 'services', icon: Grid, label: 'Services' },
    { id: 'guests', icon: ShieldCheck, label: 'Guests' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 h-20 border-t border-slate-100 bg-white/80 backdrop-blur-md flex justify-around items-center px-4 pb-2 z-50">
      {tabs.map((tab, index) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        // Make the 3rd tab (index 2 - Services) the central floating button
        if (index === 2) {
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.id as ViewState)}
              className="w-16 h-16 bg-indigo-600 rounded-full -mt-12 border-[6px] border-white flex items-center justify-center text-white shadow-xl shadow-indigo-200 transition-transform active:scale-95"
            >
              <Icon className="w-8 h-8" />
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.id as ViewState)}
            className={`flex flex-col items-center transition-colors ${
              isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icon className={`w-6 h-6 ${isActive ? 'fill-indigo-100 stroke-indigo-600 stroke-[1.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold mt-1">
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
