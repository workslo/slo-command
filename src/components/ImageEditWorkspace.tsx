import React, { useState, useRef } from 'react';
import { Edit, Upload, Sparkles, Loader2, Download } from 'lucide-react';

export function ImageEditWorkspace() {
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ url: string; text?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const url = URL.createObjectURL(selected);
      setPreview(url);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !file || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('image', file);

    try {
      const response = await fetch('/api/image/edit', {
        method: 'POST',
        body: formData
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.text || 'Failed to edit image');
      }
      
      if (data.imageUrl) {
        setResult({ url: data.imageUrl, text: data.text });
      } else if (data.text) {
        throw new Error(`The model provided text instead of an altered image: "${data.text}"`);
      } else {
        throw new Error('No edited image was returned. Please try refining your edit prompt.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during editing.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111619] text-[#A4ACA6] overflow-hidden">
      <header className="flex-shrink-0 h-16 border-b border-[#2F3A3E] px-6 flex items-center justify-between z-10 bg-[#111619]/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Edit size={18} className="text-[#D89A3A]" />
          <h2 className="text-[#CBD3CC] font-serif tracking-wide text-sm">Image Alteration</h2>
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-[#4F5A58]">gemini-3.1-flash-image</div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 lg:p-12 flex flex-col items-center">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Controls & Original */}
          <div className="space-y-6 flex flex-col">
            <div 
              className={`w-full aspect-square md:aspect-[4/3] border-2 border-dashed rounded-xl flex items-center justify-center relative overflow-hidden transition-colors ${preview ? 'border-[#2F3A3E] bg-[#1A2126]' : 'border-[#2F3A3E] hover:border-[#D89A3A]/50 bg-[#111619] cursor-pointer'}`}
              onClick={() => !preview && fileInputRef.current?.click()}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              {preview ? (
                <>
                  <img src={preview} alt="Original" className="w-full h-full object-contain" />
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                    className="absolute top-4 right-4 bg-[#111619]/80 hover:bg-red-500/20 hover:text-red-400 p-2 rounded text-[#A4ACA6] backdrop-blur text-xs uppercase tracking-wider transition-colors"
                  >
                    Clear
                  </button>
                </>
              ) : (
                <div className="text-[#6E7A78] flex flex-col items-center gap-4 text-center p-6">
                  <div className="w-12 h-12 rounded-full bg-[#1A2126] flex items-center justify-center">
                    <Upload size={20} className="text-[#D89A3A]" />
                  </div>
                  <div>
                    <div className="text-sm text-[#CBD3CC] mb-1">Upload a source image</div>
                    <div className="text-xs">Drag and drop or click to select</div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-[#1A2126] border border-[#2F3A3E] focus:border-[#D89A3A]/40 rounded-lg p-4 text-sm text-[#CBD3CC] placeholder-[#4F5A58] focus:outline-none resize-none h-24 transition-colors"
                placeholder="How should it be altered? e.g. 'Turn it into a watercolor painting'"
              />
              <button
                type="submit"
                disabled={!prompt.trim() || !file || isLoading}
                className="w-full flex items-center justify-center gap-2 bg-[#D89A3A] hover:bg-[#D8B27A] text-[#111619] font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-[#D89A3A]"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {isLoading ? 'Altering...' : 'Transform Image'}
              </button>
            </form>
          </div>

          {/* Result */}
          <div className="flex flex-col">
            <div className="w-full aspect-square md:aspect-[4/3] bg-[#1A2126] border border-[#2F3A3E] rounded-xl flex items-center justify-center relative overflow-hidden group">
              {isLoading ? (
                <div className="flex flex-col items-center gap-4 text-[#D8B27A] animate-pulse">
                  <div className="w-12 h-12 rounded-full border-2 border-t-[#D89A3A] border-r-transparent border-b-[#D89A3A]/30 border-l-transparent animate-spin" />
                  <span className="text-sm font-serif italic">Synthesizing...</span>
                </div>
              ) : result ? (
                <>
                  <img src={result.url} alt="Generated" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  <a 
                    href={result.url} 
                    download={`altered-${Date.now()}.png`}
                    className="absolute bottom-4 right-4 bg-[#111619]/80 hover:bg-[#D89A3A] hover:text-[#111619] p-3 rounded-full text-[#CBD3CC] backdrop-blur opacity-0 group-hover:opacity-100 transition-all shadow-xl"
                  >
                    <Download size={18} />
                  </a>
                </>
              ) : error ? (
                <div className="text-[#D85C30] text-sm max-w-sm text-center px-4 font-mono">{error}</div>
              ) : (
                <div className="text-[#4F5A58] flex flex-col items-center gap-3">
                  <Sparkles size={32} opacity={0.5} />
                  <span className="text-xs uppercase tracking-widest text-center px-6">Resulting alteration will appear here</span>
                </div>
              )}
            </div>
            {result?.text && (
              <div className="mt-4 p-4 bg-[#1A2126] border border-[#2F3A3E] rounded-lg text-sm text-[#A4ACA6] font-serif leading-relaxed">
                {result.text}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
