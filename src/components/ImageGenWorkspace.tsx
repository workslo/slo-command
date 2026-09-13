import React, { useState } from 'react';
import { Image as ImageIcon, Loader2, Sparkles, Download } from 'lucide-react';

export function ImageGenWorkspace() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState('1K');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ url: string; text?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aspectRatio, imageSize })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.text || 'Failed to generate image');
      }
      
      if (data.imageUrl) {
        setResult({ url: data.imageUrl, text: data.text });
      } else if (data.text) {
        throw new Error(`The model provided text instead of an image: "${data.text}"`);
      } else {
        throw new Error('No image was returned by the generator. Please try refining your prompt.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during generation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111619] text-[#A4ACA6] overflow-hidden relative">
      <header className="flex-shrink-0 h-16 border-b border-[#2F3A3E] px-6 flex items-center justify-between z-10 bg-[#111619]/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <ImageIcon size={18} className="text-[#D89A3A]" />
          <h2 className="text-[#CBD3CC] font-serif tracking-wide text-sm">Vision Synthesizer</h2>
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-[#4F5A58]">gemini-3.1-flash-image</div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 lg:p-12 flex flex-col items-center">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls */}
          <div className="lg:col-span-4 space-y-6">
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-widest text-[#6E7A78]">Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-[#1A2126] border border-[#2F3A3E] focus:border-[#D89A3A]/40 rounded-lg p-4 text-sm text-[#CBD3CC] placeholder-[#4F5A58] focus:outline-none resize-none min-h-[120px] transition-colors"
                  placeholder="Describe a vision..."
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs uppercase tracking-widest text-[#6E7A78]">Aspect Ratio</label>
                <div className="grid grid-cols-3 gap-2">
                  {['1:1', '16:9', '9:16', '4:3', '3:4'].map(ratio => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-2 text-xs rounded border transition-colors ${aspectRatio === ratio ? 'bg-[#D89A3A]/10 border-[#D89A3A]/50 text-[#D8B27A]' : 'bg-[#1A2126] border-[#2F3A3E] text-[#6E7A78] hover:border-[#4F5A58]'}`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs uppercase tracking-widest text-[#6E7A78]">Resolution</label>
                <div className="grid grid-cols-3 gap-2">
                  {['1K', '2K', '4K'].map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setImageSize(size)}
                      className={`py-2 text-xs rounded border transition-colors ${imageSize === size ? 'bg-[#D89A3A]/10 border-[#D89A3A]/50 text-[#D8B27A]' : 'bg-[#1A2126] border-[#2F3A3E] text-[#6E7A78] hover:border-[#4F5A58]'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!prompt.trim() || isLoading}
                className="w-full flex items-center justify-center gap-2 bg-[#D89A3A] hover:bg-[#D8B27A] text-[#111619] font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-[#D89A3A]"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {isLoading ? 'Manifesting...' : 'Generate Image'}
              </button>
            </form>
          </div>

          {/* Canvas */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="flex-1 min-h-[400px] bg-[#1A2126] border border-[#2F3A3E] rounded-xl flex items-center justify-center relative overflow-hidden group">
              {isLoading ? (
                <div className="flex flex-col items-center gap-4 text-[#D8B27A] animate-pulse">
                  <div className="w-12 h-12 rounded-full border-2 border-t-[#D89A3A] border-r-transparent border-b-[#D89A3A]/30 border-l-transparent animate-spin" />
                  <span className="text-sm font-serif italic">Synthesizing pixels...</span>
                </div>
              ) : result ? (
                <>
                  <img src={result.url} alt="Generated" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  <a 
                    href={result.url} 
                    download={`vision-${Date.now()}.png`}
                    className="absolute bottom-4 right-4 bg-[#111619]/80 hover:bg-[#D89A3A] hover:text-[#111619] p-3 rounded-full text-[#CBD3CC] backdrop-blur opacity-0 group-hover:opacity-100 transition-all shadow-xl"
                  >
                    <Download size={18} />
                  </a>
                </>
              ) : error ? (
                <div className="text-[#D85C30] text-sm max-w-sm text-center px-4 font-mono">{error}</div>
              ) : (
                <div className="text-[#4F5A58] flex flex-col items-center gap-3">
                  <ImageIcon size={32} opacity={0.5} />
                  <span className="text-xs uppercase tracking-widest">Awaiting Prompt</span>
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
