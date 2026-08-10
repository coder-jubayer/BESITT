import React from 'react';
import { Building2, User, Shield, Briefcase, Calculator } from 'lucide-react';

export type UserRole = 'resident' | 'guard' | 'manager' | 'treasurer';

interface AuthProps {
  onLogin: (role: UserRole) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  return (
    <div className="flex-1 bg-slate-50 flex flex-col justify-center px-6 min-h-full">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Building2 className="text-white w-10 h-10" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-2">
          Select Role
        </h2>
        <p className="text-slate-500 text-center mb-8">
          Choose a profile to preview the app
        </p>

        <div className="space-y-4">
          <button 
            onClick={() => onLogin('manager')}
            className="w-full p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-bold text-slate-900">Admin / Committee</h3>
              <p className="text-xs text-slate-500">Manage notices, expenses, amenity</p>
            </div>
          </button>

          <button 
            onClick={() => onLogin('treasurer')}
            className="w-full p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
              <Calculator className="w-6 h-6" />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-bold text-slate-900">Treasurer</h3>
              <p className="text-xs text-slate-500">Add and update expenses</p>
            </div>
          </button>

          <button 
            onClick={() => onLogin('guard')}
            className="w-full p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-bold text-slate-900">Security Guard</h3>
              <p className="text-xs text-slate-500">Register visitors, view approval</p>
            </div>
          </button>

          <button 
            onClick={() => onLogin('resident')}
            className="w-full p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-bold text-slate-900">Resident</h3>
              <p className="text-xs text-slate-500">Notices, expenses, amenities</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
