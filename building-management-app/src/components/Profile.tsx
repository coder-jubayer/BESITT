import React from 'react';
import { UserRole } from './Auth';
import { LogOut, User, Settings, HelpCircle, FileText, Shield, Briefcase, Calculator } from 'lucide-react';

interface ProfileProps {
  onLogout: () => void;
  userRole: UserRole | null;
}

export default function Profile({ onLogout, userRole }: ProfileProps) {
  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      <div className="bg-white px-4 py-4 flex items-center border-b border-slate-100 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-800">Profile</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        
        {/* Profile Header */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
          <div className="w-24 h-24 rounded-full bg-slate-100 mx-auto mb-4 p-1 border-2 border-indigo-100 flex items-center justify-center">
            {userRole === 'resident' ? (
              <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-full h-full rounded-full object-cover" />
            ) : userRole === 'guard' ? (
              <Shield className="w-10 h-10 text-slate-400" />
            ) : userRole === 'treasurer' ? (
              <Calculator className="w-10 h-10 text-slate-400" />
            ) : (
              <Briefcase className="w-10 h-10 text-slate-400" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            {userRole === 'resident' ? 'Robert Fox' : userRole === 'guard' ? 'Security' : userRole === 'treasurer' ? 'Treasurer' : 'Admin'}
          </h2>
          <p className="text-slate-500 font-medium">
            {userRole === 'resident' ? 'Apt B-402 • Resident' : userRole === 'guard' ? 'Main Gate • Security' : userRole === 'treasurer' ? 'Finance • Treasurer' : 'Management • Admin'}
          </p>
          <div className="mt-4 inline-block px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold border border-emerald-100">
            Verified Account
          </div>
        </div>

        {/* Settings List */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <MenuRow icon={<User />} label="Personal Information" />
          <div className="h-px bg-slate-100 ml-12"></div>
          <MenuRow icon={<Settings />} label="Preferences" />
          <div className="h-px bg-slate-100 ml-12"></div>
          <MenuRow icon={<FileText />} label={userRole === 'resident' ? "My Leases & Documents" : "System Documents"} />
          <div className="h-px bg-slate-100 ml-12"></div>
          <MenuRow icon={<HelpCircle />} label="Help & Support" />
        </div>

        {/* Logout */}
        <button 
          onClick={onLogout}
          className="w-full bg-white p-4 rounded-3xl border border-rose-100 shadow-sm flex items-center gap-4 text-rose-600 active:bg-rose-50 transition"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="font-semibold">Switch Role (Log Out)</span>
        </button>

        <p className="text-center text-xs text-slate-400 mt-8 mb-4">Version 1.0.0</p>
      </div>
    </div>
  );
}

function MenuRow({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 active:bg-slate-100 transition text-left">
      <div className="text-slate-400">
        {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
      </div>
      <span className="flex-1 font-medium text-slate-700">{label}</span>
      <ChevronRightIcon className="w-5 h-5 text-slate-300" />
    </button>
  );
}

function ChevronRightIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
