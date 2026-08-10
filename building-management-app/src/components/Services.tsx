import React from 'react';
import { ViewState } from '../types';
import { UserRole } from './Auth';
import { 
  Building, 
  Calendar, 
  Wrench, 
  Phone,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Zap,
  Flame,
  Activity,
  PartyPopper,
  Car,
  CircleDot,
  FileDown
} from 'lucide-react';
import { mockAmenities, mockComplaints, mockContacts, mockExpenses } from '../mockData';

interface ServicesProps {
  currentView: ViewState;
  navigate: (view: ViewState) => void;
  userRole: UserRole | null;
}

export default function Services({ currentView, navigate, userRole }: ServicesProps) {
  
  if (currentView === 'amenities') return <AmenitiesView onBack={() => navigate('services')} />;
  if (currentView === 'complaints') return <ComplaintsView onBack={() => navigate('services')} />;
  if (currentView === 'directory') return <DirectoryView onBack={() => navigate('services')} />;
  if (currentView === 'expenses') return <ExpensesView onBack={() => navigate('services')} userRole={userRole} />;

  // Main Services Menu
  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      <Header title="Services" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-24">
        
        <ServiceCard 
          icon={<Calendar className="w-6 h-6 text-blue-600" />}
          bg="bg-blue-50"
          title="Book Amenities"
          description="Pool, Hall, Parking, etc."
          onClick={() => navigate('amenities')}
        />
        <ServiceCard 
          icon={<Wrench className="w-6 h-6 text-amber-600" />}
          bg="bg-amber-50"
          title="Complaints & Fixes"
          description="Raise maintenance tickets"
          onClick={() => navigate('complaints')}
        />
        <ServiceCard 
          icon={<Building className="w-6 h-6 text-emerald-600" />}
          bg="bg-emerald-50"
          title="Society Expenses"
          description="Monthly breakdown & reports"
          onClick={() => navigate('expenses')}
        />
        <ServiceCard 
          icon={<Phone className="w-6 h-6 text-rose-600" />}
          bg="bg-rose-50"
          title="Emergency Directory"
          description="Important contacts & helplines"
          onClick={() => navigate('directory')}
        />

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

function ServiceCard({ icon, bg, title, description, onClick }: any) {
  return (
    <button onClick={onClick} className="w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 active:bg-slate-50 transition text-left">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-300" />
    </button>
  );
}

// --- Sub Views ---

function AmenitiesView({ onBack }: { onBack: () => void }) {
  const getIcon = (name: string) => {
    switch(name) {
      case 'Swimming Pool': return <Droplets className="w-6 h-6 text-blue-500" />;
      case 'Guest Parking': return <Car className="w-6 h-6 text-slate-500" />;
      case 'Community Hall': return <PartyPopper className="w-6 h-6 text-fuchsia-500" />;
      case 'Table Tennis': return <Activity className="w-6 h-6 text-emerald-500" />;
      default: return <CircleDot className="w-6 h-6 text-indigo-500" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <Header title="Book Amenity" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {mockAmenities.map(amenity => (
          <div key={amenity.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                {getIcon(amenity.name)}
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">{amenity.name}</h3>
                <p className={`text-sm ${amenity.availableSlots > 0 ? 'text-emerald-600 font-medium' : 'text-rose-500'}`}>
                  {amenity.availableSlots > 0 ? `${amenity.availableSlots} slots available` : 'Fully booked'}
                </p>
              </div>
            </div>
            <button 
              disabled={amenity.availableSlots === 0}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                amenity.availableSlots > 0 
                  ? 'bg-indigo-50 text-indigo-600 active:bg-indigo-100' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Book
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComplaintsView({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <Header title="Complaints & Fixes" onBack={onBack} />
      <div className="p-4">
        <button className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold shadow-md active:bg-indigo-700 transition">
          + Raise New Ticket
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-24">
        {mockComplaints.map(complaint => (
          <div key={complaint.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-slate-800">{complaint.title}</h3>
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                complaint.status === 'open' ? 'bg-amber-100 text-amber-700' :
                complaint.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {complaint.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm text-slate-500">
              <span className="flex items-center gap-1"><Wrench className="w-3.5 h-3.5" /> {complaint.category}</span>
              <span>{complaint.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DirectoryView({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <Header title="Directory" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {mockContacts.map(contact => (
          <div key={contact.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800">{contact.name}</h3>
              <p className="text-sm text-slate-500">{contact.role}</p>
            </div>
            <a href={`tel:${contact.phone}`} className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center active:bg-emerald-100">
              <Phone className="w-4 h-4 fill-current" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExpensesView({ onBack, userRole }: { onBack: () => void, userRole: UserRole | null }) {
  const total = mockExpenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <Header title="Society Expenses" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="bg-indigo-600 rounded-3xl p-6 text-white text-center mb-6 shadow-lg shadow-indigo-200">
          <p className="text-indigo-100 text-sm font-medium mb-1">Total Expenses (Oct)</p>
          <h2 className="text-4xl font-bold">${total.toLocaleString()}</h2>
        </div>
        
        {(userRole === 'treasurer' || userRole === 'manager') && (
          <div className="mb-4">
            <button className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-semibold shadow-md active:bg-emerald-700 transition">
              + Add New Expense
            </button>
          </div>
        )}

        {(userRole === 'manager' || userRole === 'resident' || userRole === 'treasurer') && (
          <div className="mb-6">
            <button className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-semibold shadow-sm active:bg-slate-50 transition flex items-center justify-center gap-2">
              <FileDown className="w-5 h-5" /> Download Calculation Sheet
            </button>
          </div>
        )}

        <h3 className="font-bold text-slate-800 mb-4 px-1">Expense Breakdown</h3>
        <div className="space-y-4">
          {mockExpenses.map(expense => (
            <div key={expense.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${expense.color}`}></div>
                  <span className="font-medium text-slate-700">{expense.name}</span>
                </div>
                <span className="font-bold text-slate-900">${expense.amount.toLocaleString()}</span>
              </div>
              {/* Progress bar visual */}
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${expense.color} rounded-full`} 
                  style={{ width: `${(expense.amount / total) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
