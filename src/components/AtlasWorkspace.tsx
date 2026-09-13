import React, { useState } from 'react';
import { MapPin, Loader2, Map as MapIcon, ArrowUpRight } from 'lucide-react';
import Markdown from 'react-markdown';

export function AtlasWorkspace() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; chunks: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Atlas query failed');
      setResult({ text: data.text, chunks: data.groundingChunks || [] });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while querying Atlas.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111619] text-[#A4ACA6] overflow-hidden">
      <header className="flex-shrink-0 h-16 border-b border-[#2F3A3E] px-6 flex items-center justify-between z-10 bg-[#111619]/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <MapIcon size={18} className="text-[#D89A3A]" />
          <h2 className="text-[#CBD3CC] font-serif tracking-wide text-sm">Atlas Grounding</h2>
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-[#4F5A58]">gemini-3.5-flash + Google Maps</div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 lg:p-12 flex flex-col items-center">
        <div className="w-full max-w-3xl space-y-8">
          
          <form onSubmit={handleSearch} className="relative group">
            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-[#4F5A58] group-focus-within:text-[#D89A3A] transition-colors" size={20} />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Query geographical coordinates or locations..."
              className="w-full bg-[#1A2126] border border-[#2F3A3E] group-focus-within:border-[#D89A3A]/40 rounded-xl pl-14 pr-16 py-4 text-base text-[#CBD3CC] placeholder-[#4F5A58] focus:outline-none transition-colors shadow-lg"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-[#D8B27A] hover:bg-[#D89A3A]/10 disabled:opacity-30 transition-colors"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowUpRight size={18} />}
            </button>
          </form>

          {error && (
            <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-lg text-[#D85C30] text-sm font-mono">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-a:text-[#D8B27A] marker:text-[#D89A3A]">
                <Markdown>{result.text}</Markdown>
              </div>

              {result.chunks.length > 0 && (
                <div className="border-t border-[#2F3A3E] pt-6 space-y-4">
                  <h3 className="text-xs uppercase tracking-widest text-[#6E7A78] flex items-center gap-2">
                    <MapPin size={14} />
                    Locations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.chunks.map((chunk, i) => (
                      chunk.web && (
                        <a 
                          key={i} 
                          href={chunk.web.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-3 bg-[#1A2126] border border-[#2F3A3E] hover:border-[#D89A3A]/40 rounded-lg text-sm flex flex-col gap-1 transition-colors group"
                        >
                          <span className="text-[#CBD3CC] font-medium line-clamp-1 group-hover:text-[#D8B27A] transition-colors">{chunk.web.title}</span>
                          <span className="text-[#4F5A58] text-xs truncate">{chunk.web.uri}</span>
                        </a>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
