import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Archive, Plus, Loader2, Save, Trash2, Clock, Search } from 'lucide-react';
import { format } from 'date-fns';
import Markdown from 'react-markdown';

export function ArchiveWorkspace() {
  const [user] = useAuthState(auth);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [summary, setSummary] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) {
      setSessions([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSessions(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreate = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'sessions'), {
        userId: user.uid,
        summary: 'New Iteration Summary',
        notes: '',
        date: serverTimestamp()
      });
      setActiveSession({ id: docRef.id, summary: 'New Iteration Summary', notes: '' });
      setSummary('New Iteration Summary');
      setNotes('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!user || !activeSession) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'sessions', activeSession.id), {
        summary,
        notes,
      });
      setActiveSession({ ...activeSession, summary, notes });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (confirm('Are you sure you want to delete this session archive?')) {
      await deleteDoc(doc(db, 'sessions', id));
      if (activeSession?.id === id) {
        setActiveSession(null);
      }
    }
  };

  const handleSelect = (s: any) => {
    setActiveSession(s);
    setSummary(s.summary);
    setNotes(s.notes);
  };

  const filteredSessions = sessions.filter(s => 
    s.summary?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full bg-[#111619] text-[#A4ACA6] overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r border-[#2F3A3E] flex flex-col bg-[#161C20] h-full shrink-0">
        <div className="p-4 border-b border-[#2F3A3E] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#CBD3CC] font-serif text-sm">
            <Archive size={16} className="text-[#D89A3A]" />
            <span>Archive</span>
          </div>
          <button 
            onClick={handleCreate}
            disabled={!user || isSaving}
            className="p-1.5 hover:bg-[#1A2126] rounded text-[#D8B27A] disabled:opacity-50 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="p-3 border-b border-[#2F3A3E]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4F5A58]" size={14} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search archive..." 
              className="w-full bg-[#1A2126] border border-[#2F3A3E] focus:border-[#D89A3A]/40 rounded pl-8 pr-3 py-1.5 text-xs text-[#CBD3CC] placeholder-[#4F5A58] outline-none transition-colors"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 size={16} className="animate-spin text-[#6E7A78]" />
            </div>
          ) : !user ? (
            <div className="p-4 text-xs text-[#6E7A78] text-center">Sign in to sync archive.</div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-4 text-xs text-[#6E7A78] text-center">No matching sessions.</div>
          ) : (
            filteredSessions.map(s => (
              <div 
                key={s.id} 
                onClick={() => handleSelect(s)}
                className={`p-3 rounded-lg cursor-pointer flex items-center justify-between group transition-colors ${activeSession?.id === s.id ? 'bg-[#1A2126] border border-[#2F3A3E]/50' : 'hover:bg-[#1A2126]/50 border border-transparent'}`}
              >
                <div className="flex flex-col min-w-0">
                  <span className={`text-sm truncate ${activeSession?.id === s.id ? 'text-[#CBD3CC]' : 'text-[#7E8A88]'}`}>{s.summary || 'Untitled Session'}</span>
                  <span className="text-[10px] text-[#4F5A58] mt-1 flex items-center gap-1">
                    <Clock size={10} />
                    {s.date ? format(s.date.toDate(), 'MMM d, yyyy') : 'Unknown Date'}
                  </span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-400 text-[#4F5A58] transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col h-full bg-[#111619] relative">
        {activeSession ? (
          <>
            <header className="flex-shrink-0 border-b border-[#2F3A3E] px-6 py-4 flex flex-col gap-3 z-10 bg-[#111619]/90 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-[#D89A3A] uppercase tracking-widest font-mono">
                  {activeSession.date ? format(activeSession.date.toDate(), 'MMMM d, yyyy - h:mm a') : 'Unrecorded Date'}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#4F5A58] font-mono tracking-widest uppercase">
                    {isSaving ? 'Saving...' : 'Saved'}
                  </span>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving || (summary === activeSession.summary && notes === activeSession.notes)}
                    className="flex items-center gap-2 bg-[#D89A3A] hover:bg-[#D8B27A] text-[#111619] px-4 py-1.5 rounded transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    <Save size={14} />
                    Save
                  </button>
                </div>
              </div>
              <input 
                type="text" 
                value={summary} 
                onChange={(e) => setSummary(e.target.value)} 
                className="bg-transparent text-[#CBD3CC] font-serif text-xl outline-none placeholder-[#4F5A58] w-full"
                placeholder="Session Summary / Title"
              />
            </header>
            <div className="flex-1 overflow-y-auto p-6 md:px-12 md:py-8 flex flex-col gap-6">
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-xs uppercase tracking-widest text-[#6E7A78]">Session Notes & Reflections</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record insights, iterations, and narratives from this session..."
                  className="w-full flex-1 bg-[#1A2126]/50 border border-[#2F3A3E] focus:border-[#D89A3A]/40 rounded-lg p-5 text-sm text-[#A4ACA6] font-serif leading-relaxed outline-none placeholder-[#4F5A58] resize-none transition-colors"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#4F5A58]">
            <Archive size={32} className="mb-4 opacity-50" />
            <span className="text-xs uppercase tracking-widest">Select an archived session</span>
          </div>
        )}
      </div>
    </div>
  );
}
