import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, AlertCircle, RefreshCw, ChevronDown, BookOpen } from 'lucide-react';
import { ChatMessage } from '../types';

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      content: "Hello! I am your EEE-2104 Circuit Engineering Tutor. Ask me any questions about operational amplifiers, 555 timer frequencies, waveform calculations, or RLC bandpass filters!",
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "What are the golden rules of Op-Amps?",
    "How do I design a 555 timer for 1 kHz frequency?",
    "What is the gain formula of an inverting active filter?"
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Parse suggestions from reply text
  const parseSuggestions = (text: string): { cleanText: string; suggestionsList: string[] } => {
    const lines = text.split('\n');
    const suggestionsList: string[] = [];
    const filteredLines = lines.filter(line => {
      const match = line.match(/\[SUGGESTION:\s*(.*?)\]/i);
      if (match && match[1]) {
        suggestionsList.push(match[1].trim());
        return false;
      }
      return true;
    });

    return {
      cleanText: filteredLines.join('\n').trim(),
      suggestionsList: suggestionsList.length > 0 ? suggestionsList : [
        "How do I analyze active high-pass filters?",
        "What is the Q-factor in RLC resonance?",
        "Explain astable duty cycles."
      ]
    };
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      role: 'user',
      content: text,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setSuggestions([]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10), // send last 10 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error('Chat API returned an error');
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Expected JSON response from Chat API');
      }

      const data = await response.json();
      const parsed = parseSuggestions(data.reply);

      setMessages(prev => [
        ...prev,
        {
          id: 'msg_' + Math.random().toString(36).substr(2, 9),
          role: 'assistant',
          content: parsed.cleanText,
        },
      ]);
      setSuggestions(parsed.suggestionsList);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: 'msg_err',
          role: 'assistant',
          content: "I ran into a connection glitch. However, remember that for an ideal operational amplifier under negative feedback, V+ is always assumed equal to V-! How can I help you analyze your op-amp nodes?",
        },
      ]);
      setSuggestions([
        "Tell me about the Op-Amp virtual short circuit rule",
        "How do I compute gain for non-inverting op-amps?"
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'init',
        role: 'assistant',
        content: "Chat history cleared. What circuit calculation are we solving next?",
      }
    ]);
    setSuggestions([
      "What are the golden rules of Op-Amps?",
      "How do I design a 555 timer for 1 kHz frequency?",
      "What is the gain formula of an inverting active filter?"
    ]);
  };

  return (
    <div id="eee-chat-widget" className="fixed bottom-6 right-6 z-40 font-sans">
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-accent text-navy-dark shadow-lg shadow-emerald-accent/20 hover:scale-105 active:scale-95 transition-all cursor-pointer group border border-emerald-accent/40"
          title="Open EEE-2104 Chat Assistant"
        >
          <Sparkles className="h-6 w-6 animate-pulse group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-navy-dark text-[10px] font-bold text-emerald-accent border border-emerald-accent/50">
            AI
          </span>
        </button>
      )}

      {/* Expanded Chat Box */}
      {isOpen && (
        <div className="flex h-[500px] w-80 sm:w-96 flex-col rounded-2xl border border-navy-light bg-navy-card shadow-2xl shadow-emerald-accent/5 overflow-hidden transition-all duration-300">
          {/* Header */}
          <div className="flex items-center justify-between bg-navy-light/60 px-4 py-3 border-b border-navy-light">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-accent/10 border border-emerald-accent/20">
                <BookOpen className="h-4 w-4 text-emerald-accent" />
              </div>
              <div>
                <h4 className="text-sm font-bold font-display text-white">Circuit Tutor</h4>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-accent animate-ping" />
                  <span className="text-[10px] text-slate-400 font-medium">EEE-2104 Lab Expert</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearChat}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-navy-light/40 transition-colors"
                title="Clear Chat History"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-navy-light/40 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${
                  msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <span className="text-[10px] text-slate-500 mb-1 px-1">
                  {msg.role === 'user' ? 'You' : 'AI Assistant'}
                </span>
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-emerald-accent text-navy-dark font-medium rounded-tr-none'
                      : 'bg-navy-light/50 text-slate-200 border border-navy-light/60 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex flex-col max-w-[85%] mr-auto items-start">
                <span className="text-[10px] text-slate-500 mb-1 px-1">AI Assistant</span>
                <div className="rounded-2xl rounded-tl-none px-4 py-3 bg-navy-light/50 border border-navy-light/60">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 bg-emerald-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 bg-emerald-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 bg-emerald-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions Layer */}
          {suggestions.length > 0 && (
            <div className="px-4 py-2 border-t border-navy-light bg-navy-dark/40 space-y-1">
              <span className="text-[10px] font-bold text-emerald-accent tracking-wider uppercase flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Recommended Prompts
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(s)}
                    className="text-[10px] bg-navy-light/80 hover:bg-emerald-accent hover:text-navy-dark border border-navy-light text-slate-300 font-medium px-2.5 py-1 rounded-full transition-all text-left truncate max-w-full cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleFormSubmit} className="p-3 border-t border-navy-light bg-navy-dark flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about active filters, RLC grids..."
              className="flex-1 bg-navy-light/40 border border-navy-light rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-accent transition-colors"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-accent text-navy-dark hover:bg-emerald-hover disabled:bg-slate-700 disabled:text-slate-400 transition-colors cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
