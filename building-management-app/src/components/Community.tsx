import React from 'react';
import { ViewState } from '../types';
import { UserRole } from './Auth';
import { 
  Bell, 
  Store, 
  Vote, 
  ChevronLeft,
  MessageSquare
} from 'lucide-react';
import { mockNotices, mockMarketplace, mockCandidates } from '../mockData';

interface CommunityProps {
  currentView: ViewState;
  navigate: (view: ViewState) => void;
  userRole: UserRole | null;
}

export default function Community({ currentView, navigate, userRole }: CommunityProps) {
  
  if (currentView === 'notices') return <NoticesView onBack={() => navigate('community')} userRole={userRole} />;
  if (currentView === 'marketplace') return <MarketplaceView onBack={() => navigate('community')} userRole={userRole} />;
  if (currentView === 'voting') return <VotingView onBack={() => navigate('community')} userRole={userRole} />;

  // Main Community Menu
  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      <Header title="Community" />
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        
        {/* Notices Hero */}
        <div 
          onClick={() => navigate('notices')}
          className="bg-indigo-600 rounded-3xl p-6 text-white relative overflow-hidden active:scale-[0.98] transition cursor-pointer shadow-md shadow-indigo-200"
        >
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-md">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-1">Notice Board</h2>
            <p className="text-indigo-100 text-sm">3 new announcements</p>
          </div>
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div 
            onClick={() => navigate('marketplace')}
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm active:bg-slate-50 transition cursor-pointer"
          >
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
              <Store className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-bold text-slate-800">Marketplace</h3>
            <p className="text-xs text-slate-500 mt-1">Buy & Sell items</p>
          </div>
          <div 
            onClick={() => navigate('voting')}
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm active:bg-slate-50 transition cursor-pointer"
          >
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
              <Vote className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-800">Elections</h3>
            <p className="text-xs text-slate-500 mt-1">Active voting</p>
          </div>
        </div>

      </div>
    </div>
  );
}

function Header({ title, onBack }: { title: string, onBack?: () => void }) {
  return (
    <div className="bg-white px-4 py-4 flex items-center border-b border-slate-100 sticky top-0 z-10">
      {onBack && (
        <button onClick={onBack} className="p-2 -ml-2 mr-2 text-slate-600 hover:bg-slate-50 rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      <h1 className="text-xl font-bold text-slate-800">{title}</h1>
    </div>
  );
}

// --- Sub Views ---

function NoticesView({ onBack, userRole }: { onBack: () => void, userRole: UserRole | null }) {
  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <Header title="Notices" onBack={onBack} />
      {userRole === 'manager' && (
        <div className="p-4 bg-white border-b border-slate-100 sticky top-[61px] z-10">
          <button className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl active:bg-indigo-700 transition shadow-md">
            + New Notice
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {mockNotices.map(notice => (
          <div key={notice.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">{notice.author}</span>
              <span className="text-xs text-slate-400">{notice.date}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">{notice.title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{notice.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarketplaceView({ onBack, userRole }: { onBack: () => void, userRole: UserRole | null }) {
  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <Header title="Marketplace" onBack={onBack} />
      {(userRole === 'resident' || userRole === 'manager') && (
        <div className="p-4 bg-white border-b border-slate-100 sticky top-[61px] z-10">
          <button className="w-full py-3 bg-slate-900 text-white font-semibold rounded-xl active:bg-slate-800 transition">
            + Create Listing
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-4 pb-24">
        {mockMarketplace.map(item => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="h-32 bg-slate-200 relative">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-sm font-bold text-slate-900 shadow-sm">
                ${item.price}
              </div>
            </div>
            <div className="p-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2">{item.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{item.sellerName}</p>
              </div>
              <button className="w-full mt-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold active:bg-indigo-100 flex items-center justify-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" /> Contact
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VotingView({ onBack, userRole }: { onBack: () => void, userRole: UserRole | null }) {
  const [votedId, setVotedId] = React.useState<string | null>(null);

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <Header title="Elections" onBack={onBack} />
      {userRole === 'manager' && (
        <div className="p-4 bg-white border-b border-slate-100 sticky top-[61px] z-10">
          <button className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl active:bg-indigo-700 transition shadow-md">
            + Manage Elections
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6">
          <h3 className="font-bold text-emerald-800 mb-1">Committee Election 2026</h3>
          <p className="text-sm text-emerald-600">Select one candidate for President. Voting closes in 2 days.</p>
        </div>

        <div className="space-y-4">
          {mockCandidates.filter(c => c.position === 'President').map(candidate => (
            <div key={candidate.id} className={`bg-white p-4 rounded-2xl border ${votedId === candidate.id ? 'border-indigo-600 ring-1 ring-indigo-600 shadow-md' : 'border-slate-100 shadow-sm'} flex items-center gap-4 transition-all`}>
              <img src={candidate.image} alt={candidate.name} className="w-14 h-14 rounded-full object-cover border border-slate-200" />
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">{candidate.name}</h3>
                <p className="text-sm text-slate-500">Apt {candidate.id}04</p>
              </div>
              <button 
                onClick={() => setVotedId(candidate.id)}
                disabled={votedId !== null && votedId !== candidate.id}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  votedId === candidate.id 
                    ? 'bg-indigo-600 text-white' 
                    : votedId !== null 
                      ? 'bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed'
                      : 'bg-indigo-50 text-indigo-700 active:bg-indigo-100'
                }`}
              >
                {votedId === candidate.id ? 'Voted' : 'Vote'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
