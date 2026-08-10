import React from 'react';
import { ViewState } from '../types';
import { UserRole } from './Auth';
import { 
  Bell, 
  Calendar, 
  Wrench, 
  UserCheck, 
  ChevronRight,
  Droplets,
  Zap,
  ShieldAlert,
  Users,
  Shield,
  Briefcase,
  Calculator,
  MessageSquare,
  Building
} from 'lucide-react';
import { mockNotices, mockGuests } from '../mockData';

interface HomeProps {
  navigate: (view: ViewState) => void;
  userRole: UserRole | null;
}

export default function Home({ navigate, userRole }: HomeProps) {
  const pendingGuests = mockGuests.filter(g => g.status === 'pending');
  const recentNotices = mockNotices.slice(0, 2);

  const getRoleDisplayName = () => {
    switch (userRole) {
      case 'guard': return 'Security Guard • Main Gate';
      case 'manager': return 'Admin • Management';
      case 'treasurer': return 'Treasurer • Finance';
      default: return 'Robert Fox • B-402';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-white">
      {/* Header */}
      <div className="px-6 py-4 pt-6 flex justify-between items-center">
        <div>
          <p className="text-slate-400 text-xs font-medium">Welcome back,</p>
          <h2 className="text-lg font-bold text-slate-900">
            {userRole === 'resident' ? 'Robert Fox' : userRole === 'guard' ? 'Security' : userRole === 'treasurer' ? 'Treasurer' : 'Manager'} 
            <span className="text-blue-600"> • {userRole === 'resident' ? 'B-402' : userRole === 'guard' ? 'Gate' : userRole === 'treasurer' ? 'Finance' : 'Admin'}</span>
          </h2>
        </div>
        <button onClick={() => navigate('profile')} className="relative active:scale-95 transition-transform">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden">
            {userRole === 'resident' ? (
              <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-full h-full object-cover" />
            ) : userRole === 'guard' ? (
              <Shield className="w-5 h-5 text-slate-600" />
            ) : userRole === 'treasurer' ? (
              <Calculator className="w-5 h-5 text-slate-600" />
            ) : (
              <Briefcase className="w-5 h-5 text-slate-600" />
            )}
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
        </button>
      </div>

      {/* Quick Summary Cards (Vary by role) */}
      <div className="px-6 py-2 grid grid-cols-2 gap-3">
        {userRole === 'guard' ? (
          <>
            <button onClick={() => navigate('guests')} className="bg-amber-600 rounded-2xl p-4 text-white shadow-lg shadow-amber-100 text-left active:scale-95 transition-transform">
              <p className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">Pending Guests</p>
              <p className="text-xl font-bold mt-1">{pendingGuests.length}</p>
              <p className="text-[9px] mt-2 bg-amber-500 rounded px-1.5 py-0.5 inline-block">Require Approval</p>
            </button>
            <button onClick={() => navigate('directory')} className="bg-slate-800 rounded-2xl p-4 text-white shadow-lg shadow-slate-200 text-left active:scale-95 transition-transform">
              <p className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">Directory</p>
              <p className="text-xl font-bold mt-1">SOS</p>
              <p className="text-[9px] mt-2 bg-slate-700 rounded px-1.5 py-0.5 inline-block">Emergency Contacts</p>
            </button>
          </>
        ) : userRole === 'manager' ? (
          <>
            <button onClick={() => navigate('expenses')} className="bg-emerald-600 rounded-2xl p-4 text-white shadow-lg shadow-emerald-100 text-left active:scale-95 transition-transform">
              <p className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">Society Funds</p>
              <p className="text-xl font-bold mt-1">$45.2k</p>
              <p className="text-[9px] mt-2 bg-emerald-500 rounded px-1.5 py-0.5 inline-block">Available Balance</p>
            </button>
            <button onClick={() => navigate('complaints')} className="bg-indigo-600 rounded-2xl p-4 text-white shadow-lg shadow-indigo-100 text-left active:scale-95 transition-transform">
              <p className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">Complaints</p>
              <p className="text-xl font-bold mt-1">3</p>
              <p className="text-[9px] mt-2 bg-indigo-500 rounded px-1.5 py-0.5 inline-block">Open Tickets</p>
            </button>
          </>
        ) : userRole === 'treasurer' ? (
          <>
            <button onClick={() => navigate('expenses')} className="bg-sky-600 rounded-2xl p-4 text-white shadow-lg shadow-sky-100 text-left active:scale-95 transition-transform">
              <p className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">Total Revenue</p>
              <p className="text-xl font-bold mt-1">$45.2k</p>
              <p className="text-[9px] mt-2 bg-sky-500 rounded px-1.5 py-0.5 inline-block">This Month</p>
            </button>
            <button onClick={() => navigate('expenses')} className="bg-emerald-500 rounded-2xl p-4 text-white shadow-lg shadow-emerald-100 text-left active:scale-95 transition-transform">
              <p className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">Pending Dues</p>
              <p className="text-xl font-bold mt-1">$1.5k</p>
              <p className="text-[9px] mt-2 bg-emerald-400 rounded px-1.5 py-0.5 inline-block">Review Needed</p>
            </button>
          </>
        ) : (
          <>
            <button onClick={() => navigate('expenses')} className="bg-rose-500 rounded-2xl p-4 text-white shadow-lg shadow-rose-100 text-left active:scale-95 transition-transform relative">
              <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-red-400 rounded-full animate-ping opacity-75"></div>
              <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-red-600 rounded-full"></div>
              <p className="text-[10px] opacity-90 uppercase tracking-wider font-semibold">Monthly Bill (Due)</p>
              <p className="text-xl font-bold mt-1">$142.50</p>
              <p className="text-[9px] mt-2 bg-rose-600 rounded px-1.5 py-0.5 inline-block">Due in 4 days</p>
            </button>
            <button onClick={() => navigate('amenities')} className="bg-emerald-500 rounded-2xl p-4 text-white shadow-lg shadow-emerald-100 text-left active:scale-95 transition-transform">
              <p className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">Amenity Slot</p>
              <p className="text-xl font-bold mt-1">14:00</p>
              <p className="text-[9px] mt-2 bg-emerald-400 rounded px-1.5 py-0.5 inline-block">Swimming Pool</p>
            </button>
          </>
        )}
      </div>

      {/* Guest Approval Alert (Show for residents or guards) */}
      {(userRole === 'resident' || userRole === 'guard') && pendingGuests.length > 0 && (
        <div className="mx-6 mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center space-x-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-900 uppercase tracking-tighter">Guest at Main Gate</p>
            <p className="text-sm text-amber-800 line-clamp-1">{pendingGuests[0].name} ({pendingGuests[0].purpose})</p>
          </div>
          <button onClick={() => navigate('guests')} className="bg-white px-3 py-1.5 rounded-lg text-xs font-bold text-amber-600 shadow-sm active:bg-amber-100 transition-colors">
            {userRole === 'guard' ? 'Manage' : 'Approve'}
          </button>
        </div>
      )}

      {/* Main Navigation Icons */}
      <div className="px-6 mt-6 grid grid-cols-4 gap-y-6 gap-x-4 text-center">
        {userRole === 'guard' ? (
          <>
            <ActionItem icon={<UserCheck className="w-6 h-6" />} label="Guests" onClick={() => navigate('guests')} />
            <ActionItem icon={<Bell className="w-6 h-6" />} label="Notices" onClick={() => navigate('notices')} />
            <ActionItem icon={<ShieldAlert className="w-6 h-6" />} label="SOS" onClick={() => navigate('directory')} />
            <ActionItem icon={<Users className="w-6 h-6" />} label="Community" onClick={() => navigate('community')} />
          </>
        ) : userRole === 'manager' ? (
          <>
            <ActionItem icon={<Building className="w-6 h-6" />} label="Rentals" onClick={() => navigate('rentals')} />
            <ActionItem icon={<Wrench className="w-6 h-6" />} label="Support" onClick={() => navigate('complaints')} />
            <ActionItem icon={<Bell className="w-6 h-6" />} label="Notices" onClick={() => navigate('notices')} />
            <ActionItem icon={<Users className="w-6 h-6" />} label="Community" onClick={() => navigate('community')} />
          </>
        ) : userRole === 'treasurer' ? (
          <>
            <ActionItem icon={<Bell className="w-6 h-6" />} label="Notices" onClick={() => navigate('notices')} />
            <ActionItem icon={<Users className="w-6 h-6" />} label="Community" onClick={() => navigate('community')} />
          </>
        ) : (
          <>
            <ActionItem icon={<Calendar className="w-6 h-6" />} label="Booking" onClick={() => navigate('amenities')} />
            <ActionItem icon={<Bell className="w-6 h-6" />} label="Notices" onClick={() => navigate('notices')} />
            <ActionItem icon={<Users className="w-6 h-6" />} label="Community" onClick={() => navigate('community')} />
            <ActionItem icon={<Wrench className="w-6 h-6" />} label="Support" onClick={() => navigate('complaints')} />
          </>
        )}
      </div>

      {/* Featured Notices */}
      <div className="px-6 mt-6 flex-1">
        <div className="flex justify-between items-end mb-3">
          <h3 className="text-sm font-bold text-slate-900">Recent Notices</h3>
          <button onClick={() => navigate('notices')} className="text-xs text-indigo-600 font-semibold active:text-indigo-800">View All</button>
        </div>
        <div className="space-y-3">
          {recentNotices.map((notice, i) => (
            <button 
              key={notice.id}
              onClick={() => navigate('notices')}
              className={`w-full p-4 border border-slate-100 rounded-2xl flex space-x-3 items-center text-left active:bg-slate-50 transition-colors ${i > 0 ? 'opacity-60' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                i === 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {notice.title.slice(0, 3)}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-900 line-clamp-1">{notice.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{notice.date} • {notice.author}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActionItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <div className="space-y-1.5">
      <button 
        onClick={onClick} 
        className="w-full aspect-square bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700 active:scale-95 transition-transform"
      >
        {icon}
      </button>
      <p className="text-[10px] font-bold text-slate-600">{label}</p>
    </div>
  );
}
