import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Book, Plus, Loader2, Save, Trash2, Clock } from 'lucide-react';
import { format } from 'date-fns';

export function JournalWorkspace() {
  const [user] = useAuthState(auth);
  const [journals, setJournals] = useState<any[]>([]);
  const [activeJournal, setActiveJournal] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setJournals([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'journals'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJournals(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreate = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'journals'), {
        userId: user.uid,
        title: 'New Entry',
        content: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setActiveJournal({ id: docRef.id, title: 'New Entry', content: '' });
      setTitle('New Entry');
      setContent('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!user || !activeJournal) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'journals', activeJournal.id), {
        title,
        content,
        updatedAt: serverTimestamp()
      });
      setActiveJournal({ ...activeJournal, title, content });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (confirm('Are you sure you want to delete this entry?')) {
      await deleteDoc(doc(db, 'journals', id));
      if (activeJournal?.id === id) {
        setActiveJournal(null);
      }
    }
  };

  const handleSelect = (j: any) => {
    setActiveJournal(j);
    setTitle(j.title);
    setContent(j.content);
  };

  return (
    <div className="flex h-full bg-[#111619] text-[#A4ACA6] overflow-hidden">
      {/* Sidebar for Journals */}
      <div className="w-64 border-r border-[#2F3A3E] flex flex-col bg-[#161C20] h-full shrink-0">
        <div className="p-4 border-b border-[#2F3A3E] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#CBD3CC] font-serif text-sm">
            <Book size={16} className="text-[#D89A3A]" />
            <span>Journal Entries</span>
          </div>
          <button 
            onClick={handleCreate}
            disabled={!user || isSaving}
            className="p-1.5 hover:bg-[#1A2126] rounded text-[#D8B27A] disabled:opacity-50 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 size={16} className="animate-spin text-[#6E7A78]" />
            </div>
          ) : !user ? (
            <div className="p-4 text-xs text-[#6E7A78] text-center">Sign in to sync entries.</div>
          ) : journals.length === 0 ? (
            <div className="p-4 text-xs text-[#6E7A78] text-center">No entries found.</div>
          ) : (
            journals.map(j => (
              <div 
                key={j.id} 
                onClick={() => handleSelect(j)}
                className={`p-3 rounded-lg cursor-pointer flex items-center justify-between group transition-colors ${activeJournal?.id === j.id ? 'bg-[#1A2126] border border-[#2F3A3E]/50' : 'hover:bg-[#1A2126]/50 border border-transparent'}`}
              >
                <div className="flex flex-col min-w-0">
                  <span className={`text-sm truncate ${activeJournal?.id === j.id ? 'text-[#CBD3CC]' : 'text-[#7E8A88]'}`}>{j.title || 'Untitled'}</span>
                  <span className="text-[10px] text-[#4F5A58] mt-1 flex items-center gap-1">
                    <Clock size={10} />
                    {j.updatedAt ? format(j.updatedAt.toDate(), 'MMM d, h:mm a') : 'Now'}
                  </span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(j.id); }}
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
        {activeJournal ? (
          <>
            <header className="flex-shrink-0 h-16 border-b border-[#2F3A3E] px-6 flex items-center justify-between z-10 bg-[#111619]/90 backdrop-blur-sm">
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="bg-transparent text-[#CBD3CC] font-serif text-lg outline-none placeholder-[#4F5A58] w-full"
                placeholder="Entry Title"
              />
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className="text-xs text-[#4F5A58] font-mono tracking-widest uppercase">
                  {isSaving ? 'Saving...' : 'Saved'}
                </span>
                <button 
                  onClick={handleSave}
                  disabled={isSaving || (title === activeJournal.title && content === activeJournal.content)}
                  className="flex items-center gap-2 bg-[#D89A3A] hover:bg-[#D8B27A] text-[#111619] px-4 py-2 rounded transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  <Save size={16} />
                  Save
                </button>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-6 md:p-12">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your entry here... (Markdown supported)"
                className="w-full h-full bg-transparent text-[#A4ACA6] font-serif leading-relaxed outline-none placeholder-[#4F5A58] resize-none"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#4F5A58]">
            <Book size={32} className="mb-4 opacity-50" />
            <span className="text-xs uppercase tracking-widest">Select or create an entry</span>
          </div>
        )}
      </div>
    </div>
  );
}
