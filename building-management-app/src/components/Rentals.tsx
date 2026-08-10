import React from 'react';
import { ArrowLeft, User, MapPin, Search } from 'lucide-react';
import { UserRole } from './Auth';

export default function Rentals({ onBack, userRole }: { onBack: () => void, userRole: UserRole | null }) {
  const rentals = [
    { id: '1', unit: 'A-101', tenant: 'Sarah Jenkins', leaseEnd: '2027-05-31', status: 'Active', rent: '$1,200' },
    { id: '2', unit: 'B-402', tenant: 'Robert Fox', leaseEnd: '2026-12-31', status: 'Active', rent: '$1,450' },
    { id: '3', unit: 'C-205', tenant: 'Vacant', leaseEnd: '-', status: 'Available', rent: '$1,500' },
    { id: '4', unit: 'A-304', tenant: 'Michael Chen', leaseEnd: '2026-08-15', status: 'Expiring Soon', rent: '$1,300' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <div className="bg-white px-4 pt-12 pb-4 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 active:bg-slate-200">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Rental Records</h1>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search unit or tenant..." 
            className="w-full pl-10 pr-4 py-3 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        <div className="grid grid-cols-2 gap-4 mb-2">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
            <p className="text-xs text-slate-500 font-medium mb-1">Total Units</p>
            <p className="text-2xl font-bold text-slate-900">45</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
            <p className="text-xs text-slate-500 font-medium mb-1">Occupancy</p>
            <p className="text-2xl font-bold text-indigo-600">92%</p>
          </div>
        </div>

        <h2 className="font-bold text-slate-800 px-1 mt-6 mb-2">Properties</h2>
        
        {rentals.map(rental => (
          <div key={rental.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Unit {rental.unit}</h3>
                  <p className="text-xs font-medium text-slate-500">{rental.rent} / month</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                rental.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                rental.status === 'Available' ? 'bg-indigo-50 text-indigo-700' :
                'bg-amber-50 text-amber-700'
              }`}>
                {rental.status}
              </span>
            </div>
            
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <User className="w-3 h-3" />
                </div>
                <span className="text-sm font-medium text-slate-700">{rental.tenant}</span>
              </div>
              <span className="text-xs text-slate-500">Lease: {rental.leaseEnd}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
