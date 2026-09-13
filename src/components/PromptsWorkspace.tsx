import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, serverTimestamp, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Sparkles, Plus, Loader2, Save, Trash2, ArrowRight, Book } from 'lucide-react';
import { format } from 'date-fns';

const PRESET_THEMES = ['What if...', 'Describe a memory of...', 'Imagine you are...', 'The unseen observer', 'Future echoes'];

export function PromptsWorkspace() {
  const [user] = useAuthState(auth);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(PRESET_THEMES[0]);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setPrompts([]);
      return;
    }

    const q = query(
      collection(db, 'prompts'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPrompts(data);
    });

    return () => unsubscribe();
  }, [user]);

  const generatePrompt = async () => {
    setIsGenerating(true);
    setGeneratedPrompt(null);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text: `Generate a single narrative, highly evocative, deeply introspective prompt based on the theme: "${selectedTheme}". Be concise, atmospheric, and inspiring. Do not use conversational filler, just return the prompt itself.` }],
          model: 'gemini-3.5-flash',
          systemInstruction: 'You are an advanced creative writing and narrative prompt generator.'
        })
      });

      if (!response.ok) throw new Error('Failed to generate prompt');
      const data = await response.json();
      setGeneratedPrompt(data.text);
    } catch (e) {
      console.error(e);
      setGeneratedPrompt('Failed to generate prompt. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const savePrompt = async () => {
    if (!user || !generatedPrompt) return;
    try {
      await addDoc(collection(db, 'prompts'), {
        userId: user.uid,
        content: generatedPrompt,
        theme: selectedTheme,
        createdAt: serverTimestamp()
      });
      setGeneratedPrompt(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'prompts', id));
  };

  return (
    <div className="flex flex-col h-full bg-[#111619] text-[#A4ACA6] overflow-hidden">
      <header className="flex-shrink-0 h-16 border-b border-[#2F3A3E] px-6 flex items-center justify-between z-10 bg-[#111619]/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Sparkles size={18} className="text-[#D89A3A]" />
          <h2 className="text-[#CBD3CC] font-serif tracking-wide text-sm">Narrative Prompts</h2>
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-[#4F5A58]">Inspiration Engine</div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 lg:p-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Generator */}
          <div className="flex flex-col gap-8">
            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-widest text-[#6E7A78]">Select a Theme</h3>
              <div className="flex flex-wrap gap-2">
                {PRESET_THEMES.map(theme => (
                  <button
                    key={theme}
                    onClick={() => setSelectedTheme(theme)}
                    className={`px-4 py-2 rounded-full text-xs transition-colors border ${selectedTheme === theme ? 'bg-[#D89A3A]/10 border-[#D89A3A]/50 text-[#D8B27A]' : 'bg-[#1A2126] border-[#2F3A3E] text-[#6E7A78] hover:border-[#4F5A58]'}`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generatePrompt}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-[#D89A3A] hover:bg-[#D8B27A] text-[#111619] font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-[#D89A3A]"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {isGenerating ? 'Channeling...' : 'Generate New Prompt'}
            </button>

            {generatedPrompt && (
              <div className="p-6 bg-[#1A2126] border border-[#D89A3A]/30 rounded-xl relative animate-in fade-in slide-in-from-top-4 duration-500 shadow-xl">
                <p className="text-[#CBD3CC] font-serif leading-relaxed italic text-lg text-center mb-6">
                  "{generatedPrompt}"
                </p>
                <div className="flex justify-end border-t border-[#2F3A3E] pt-4">
                  <button
                    onClick={savePrompt}
                    disabled={!user}
                    className="flex items-center gap-2 text-xs font-medium text-[#D8B27A] hover:text-[#D89A3A] transition-colors uppercase tracking-widest disabled:opacity-50"
                  >
                    <Save size={14} />
                    Save Prompt
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Saved Prompts */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xs uppercase tracking-widest text-[#6E7A78] flex items-center gap-2 border-b border-[#2F3A3E] pb-3">
              <Book size={14} className="opacity-50" />
              Saved Prompts ({prompts.length})
            </h3>
            
            <div className="flex flex-col gap-4 overflow-y-auto pr-2">
              {!user ? (
                <div className="text-center text-sm text-[#4F5A58] mt-8 font-serif italic">
                  Sign in to save prompts.
                </div>
              ) : prompts.length === 0 ? (
                <div className="text-center text-sm text-[#4F5A58] mt-8 font-serif italic">
                  No saved prompts yet. Generate one to begin.
                </div>
              ) : (
                prompts.map(prompt => (
                  <div key={prompt.id} className="p-4 bg-[#1A2126]/50 border border-[#2F3A3E] rounded-lg group relative">
                    <div className="text-[10px] text-[#4F5A58] uppercase tracking-widest mb-2 flex justify-between items-center">
                      <span>{prompt.theme}</span>
                      <button 
                        onClick={() => handleDelete(prompt.id)}
                        className="opacity-0 group-hover:opacity-100 text-[#4F5A58] hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <p className="text-sm text-[#CBD3CC] font-serif leading-relaxed italic">
                      "{prompt.content}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
