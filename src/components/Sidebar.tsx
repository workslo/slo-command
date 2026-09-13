import React from 'react';
import { AppMode } from '../types';
import { MessageSquare, Image, Edit, Search, MapPin, Settings, Archive, Book, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { auth, signInWithGoogle, logout } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

interface SidebarProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export function Sidebar({ currentMode, onModeChange }: SidebarProps) {
  const [user] = useAuthState(auth);

  const navItems: { mode: AppMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'chat', icon: <MessageSquare size={18} />, label: 'Terminal' },
    { mode: 'image-gen', icon: <Image size={18} />, label: 'Vision' },
    { mode: 'image-edit', icon: <Edit size={18} />, label: 'Alter' },
    { mode: 'search', icon: <Search size={18} />, label: 'Nexus' },
    { mode: 'maps', icon: <MapPin size={18} />, label: 'Atlas' },
    { mode: 'archive', icon: <Archive size={18} />, label: 'Archive' },
    { mode: 'journal', icon: <Book size={18} />, label: 'Journal' },
    { mode: 'prompts', icon: <Sparkles size={18} />, label: 'Prompts' },
  ];

  return (
    <div className="w-64 border-r border-[#2F3A3E] bg-[#111619] flex flex-col h-full shrink-0">
      <div className="p-6 pb-4">
        <h1 className="text-[#D89A3A] uppercase tracking-[0.38em] text-[10px] font-semibold">The Fleet</h1>
        <div className="mt-2 text-[#6E7A78] text-xs font-mono tracking-widest">v4.7.0</div>
      </div>
      
      <nav className="flex-1 px-4 mt-6 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.mode}
            onClick={() => onModeChange(item.mode)}
            className={clsx(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors text-left",
              currentMode === item.mode 
                ? "bg-[#1A2126] text-[#D8B27A] border border-[#2F3A3E]/50" 
                : "text-[#7E8A88] hover:text-[#CBD3CC] hover:bg-[#1A2126]/50 border border-transparent"
            )}
          >
            {item.icon}
            <span className="tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-[#2F3A3E] mt-auto">
        {user ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 px-3 py-2 text-xs text-[#CBD3CC] truncate">
              <img src={user.photoURL || ''} alt="Avatar" className="w-6 h-6 rounded-full" />
              <span className="truncate">{user.email}</span>
            </div>
            <button onClick={logout} className="flex items-center gap-3 px-3 py-2 text-xs text-[#6E7A78] hover:text-[#CBD3CC] uppercase tracking-[0.24em] transition-colors">
              <Settings size={14} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <button onClick={signInWithGoogle} className="w-full flex items-center justify-center gap-3 px-3 py-2 bg-[#D89A3A] hover:bg-[#D8B27A] text-[#111619] rounded transition-colors text-sm font-medium">
            Sign in with Google
          </button>
        )}
      </div>
    </div>
  );
}
