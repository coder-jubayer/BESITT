import React, { useState } from 'react';
import { ShieldCheck, QrCode, Check, X, Clock, UserPlus, FileDown } from 'lucide-react';
import { mockGuests } from '../mockData';
import { UserRole } from './Auth';

interface GuestsProps {
  userRole: UserRole | null;
}

export default function Guests({ userRole }: GuestsProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  const pending = mockGuests.filter(g => g.status === 'pending');
  const history = mockGuests.filter(g => g.status !== 'pending');

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      <div className="bg-white pt-4 pb-2 px-4 border-b border-slate-100 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-800 mb-4">Guest Approvals</h1>
        
        {/* Custom Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Pending ({pending.length})
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Entry Records
          </button>
        </div>
      </div>

      <div className="p-4 bg-white border-b border-slate-100">
        <button className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white font-semibold rounded-xl active:bg-slate-800 transition shadow-sm">
          {userRole === 'guard' ? (
            <><UserPlus className="w-5 h-5" /> Register Visitor</>
          ) : (
            <><QrCode className="w-5 h-5" /> Pre-approve Guest</>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {activeTab === 'pending' ? (
          pending.length > 0 ? (
            pending.map(guest => (
              <div key={guest.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 leading-tight mb-1">{guest.name}</h3>
                    <p className="text-slate-500 text-sm flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> {guest.time}</p>
                  </div>
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">
                    Waiting
                  </span>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-xl mb-4 border border-slate-100">
                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Purpose</span>
                      <span className="font-medium text-slate-700">{guest.purpose}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phone</span>
                      <span className="font-medium text-slate-700">{guest.phone}</span>
                    </div>
                  </div>
                </div>

                {userRole === 'guard' ? (
                  <div className="flex gap-3">
                    <button className="flex-1 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-semibold active:bg-slate-200 transition">
                      Cancel Request
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-semibold active:bg-emerald-100 transition border border-emerald-100">
                      <Check className="w-4 h-4" /> Allow
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-rose-50 text-rose-700 rounded-xl font-semibold active:bg-rose-100 transition border border-rose-100">
                      <X className="w-4 h-4" /> Deny
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">No pending approvals</p>
            </div>
          )
        ) : (
          <>
            {(userRole === 'manager' || userRole === 'guard') && (
              <div className="mb-4">
                <button className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-semibold shadow-sm active:bg-slate-50 transition flex items-center justify-center gap-2">
                  <FileDown className="w-5 h-5" /> Download Entry Logs
                </button>
              </div>
            )}
            {history.map(guest => (
              <div key={guest.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center opacity-75">
                <div>
                  <h3 className="font-bold text-slate-800">{guest.name}</h3>
                  <p className="text-slate-400 text-xs mt-0.5">{guest.time} • {guest.purpose}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide ${
                  guest.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {guest.status}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
