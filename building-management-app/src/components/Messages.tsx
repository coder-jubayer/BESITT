import React, { useState } from 'react';
import { ArrowLeft, Search, User, Shield, Briefcase } from 'lucide-react';
import { UserRole } from './Auth';

export default function Messages({ onBack, userRole }: { onBack: () => void, userRole: UserRole | null }) {
  const [activeChat, setActiveChat] = useState<string | null>(null);

  const mockChats = [
    { id: '1', name: 'Security Gate', role: 'Guard', lastMsg: 'Your visitor has arrived.', time: '10:02 AM', icon: Shield, unread: 2 },
    { id: '2', name: 'Building Manager', role: 'Manager', lastMsg: 'The maintenance is scheduled.', time: 'Yesterday', icon: Briefcase, unread: 0 },
    { id: '3', name: 'Alice (A-201)', role: 'Resident', lastMsg: 'Thanks for the package!', time: 'Tue', icon: User, unread: 0 },
    { id: '4', name: 'John (C-104)', role: 'Resident', lastMsg: 'Are we still on for the meeting?', time: 'Mon', icon: User, unread: 0 },
  ];

  // Simple active chat view
  if (activeChat) {
    const chat = mockChats.find(c => c.id === activeChat);
    return (
      <div className="flex-1 flex flex-col bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
          <button onClick={() => setActiveChat(null)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 active:bg-slate-200">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
            {chat && <chat.icon className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="font-bold text-slate-900">{chat?.name}</h1>
            <p className="text-xs text-slate-500">{chat?.role}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col justify-end">
          <div className="self-start max-w-[80%] bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-3 shadow-sm">
            <p className="text-slate-800 text-sm">Hello, this is {chat?.name}.</p>
            <p className="text-[10px] text-slate-400 mt-1">09:45 AM</p>
          </div>
          <div className="self-end max-w-[80%] bg-indigo-600 text-white rounded-2xl rounded-tr-sm p-3 shadow-sm">
            <p className="text-sm">Hi! Noted, thank you.</p>
            <p className="text-[10px] text-indigo-200 mt-1 text-right">09:48 AM</p>
          </div>
          <div className="self-start max-w-[80%] bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-3 shadow-sm">
            <p className="text-slate-800 text-sm">{chat?.lastMsg}</p>
            <p className="text-[10px] text-slate-400 mt-1">10:02 AM</p>
          </div>
        </div>
        <div className="p-4 bg-white border-t border-slate-200 sticky bottom-0 z-20">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Type a message..." 
              className="flex-1 bg-slate-100 border-none rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button className="bg-indigo-600 text-white w-11 h-11 rounded-full flex items-center justify-center font-bold active:bg-indigo-700 transition">
              →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <div className="bg-white px-4 pt-12 pb-4 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 active:bg-slate-200">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Messages</h1>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search residents, guards, manager..." 
            className="w-full pl-10 pr-4 py-3 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-24">
        {mockChats.map(chat => (
          <div 
            key={chat.id} 
            onClick={() => setActiveChat(chat.id)}
            className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center flex-shrink-0 text-slate-500 border border-slate-200">
              <chat.icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <h3 className="font-bold text-slate-900 truncate">{chat.name}</h3>
                <span className="text-xs font-medium text-slate-400">{chat.time}</span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500 truncate pr-2">{chat.lastMsg}</p>
                {chat.unread > 0 && (
                  <span className="w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
