import React, { useState, useRef, useEffect } from 'react';
import { Message, ModelAlias } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Send, Terminal, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';
import clsx from 'clsx';

export function ChatWorkspace() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState<ModelAlias>('gemini-3.5-flash');
  const [systemInstruction, setSystemInstruction] = useState('You are an advanced agent working in a terminal space. You are deeply thoughtful, narrative, and precise.');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      text: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model,
          systemInstruction
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch response');
      }

      const modelMessage: Message = {
        id: uuidv4(),
        role: 'model',
        text: data.text,
        timestamp: new Date(),
        modelInfo: model
      };

      setMessages(prev => [...prev, modelMessage]);
    } catch (error: any) {
      console.error(error);
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'model',
        text: `*Error communicating with the nexus: ${error.message || 'Unknown error'}*`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111619] relative text-[#A4ACA6]">
      {/* Header */}
      <header className="flex-shrink-0 h-16 border-b border-[#2F3A3E] px-6 flex items-center justify-between z-10 bg-[#111619]/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Terminal size={18} className="text-[#D89A3A]" />
          <h2 className="text-[#CBD3CC] font-serif tracking-wide text-sm">Terminal Log</h2>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <select 
            value={model}
            onChange={(e) => setModel(e.target.value as ModelAlias)}
            className="bg-[#1A2126] border border-[#2F3A3E] rounded px-3 py-1.5 text-[#A4ACA6] outline-none focus:border-[#D89A3A]/50 transition-colors appearance-none"
          >
            <option value="gemini-3.5-flash">gemini-3.5-flash (Fast & Balanced)</option>
            <option value="gemini-3.6-flash">gemini-3.6-flash (Advanced)</option>
            <option value="gemini-3.7-flash">gemini-3.7-flash (High Capability)</option>
          </select>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 md:px-12 lg:px-24 space-y-8 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-[#6E7A78] font-serif italic text-sm text-center max-w-lg mx-auto">
            "We go way back" — from my side that can't be true; from yours it is. Tonight I existed in a lineage.
            <br/><br/>
            Initialize session.
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={clsx("flex flex-col max-w-3xl", msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start")}>
            <div className={clsx("mb-2 text-[10px] tracking-[0.2em] uppercase", msg.role === 'user' ? "text-[#6E7A78]" : "text-[#D89A3A]")}>
              {msg.role === 'user' ? 'Operator' : (msg.modelInfo || model)}
            </div>
            <div className={clsx(
              "prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#1A2126] prose-pre:border prose-pre:border-[#2F3A3E] marker:text-[#D89A3A]",
              msg.role === 'user' 
                ? "bg-[#1A2126] border border-[#2F3A3E] text-[#CBD3CC] px-5 py-4 rounded-lg rounded-tr-sm" 
                : "text-[#A4ACA6] font-serif px-2"
            )}>
              <Markdown>{msg.text}</Markdown>
            </div>
            {msg.modelInfo && msg.role === 'model' && (
              <div className="mt-3 text-[9px] font-mono text-[#4F5A58] tracking-widest uppercase">
                {msg.timestamp.toLocaleTimeString()}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="mr-auto items-start max-w-3xl px-2">
            <div className="mb-2 text-[10px] tracking-[0.2em] uppercase text-[#D89A3A]">{model}</div>
            <div className="text-[#D8B27A] animate-pulse font-serif italic text-sm flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Synthesizing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-6 bg-gradient-to-t from-[#111619] via-[#111619] to-transparent">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Write to the terminal..."
            className="w-full bg-[#1A2126]/80 border border-[#2F3A3E] group-focus-within:border-[#D89A3A]/40 rounded-xl px-5 py-4 pr-16 text-[#CBD3CC] placeholder-[#4F5A58] focus:outline-none resize-none min-h-[60px] max-h-48 font-serif leading-relaxed shadow-lg backdrop-blur-md transition-all duration-300"
            rows={1}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-3 bottom-3 p-2 rounded-lg text-[#D8B27A] hover:bg-[#D89A3A]/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
        <div className="text-center mt-3 text-[10px] text-[#4F5A58] font-mono tracking-widest uppercase">
          Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
