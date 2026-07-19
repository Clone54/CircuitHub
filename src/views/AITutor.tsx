import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { 
  GraduationCap, 
  Send, 
  Sparkles, 
  BookOpen, 
  Terminal, 
  AlertCircle, 
  User,
  Trash2,
  HelpCircle,
  Clock,
  ArrowLeft
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const SUGGESTED_PROMPTS = [
  {
    topic: 'Circuit Theory',
    prompt: 'How to find the Thevenin Equivalent of a multi-loop circuit?',
    short: 'Thevenin Equivalent Guide'
  },
  {
    topic: 'Analog Electronics',
    prompt: 'Explain the Miller Effect and how it impacts amplifier high-frequency gain.',
    short: 'Explain Miller Effect'
  },
  {
    topic: 'Digital Electronics',
    prompt: 'What is the structural difference between a Latch and a Flip-Flop?',
    short: 'Latch vs Flip-Flop'
  },
  {
    topic: 'Analog Electronics',
    prompt: 'Derive the voltage gain of an ideal Inverting Op-Amp circuit using the Virtual Short concept.',
    short: 'Op-Amp Gain Derivation'
  }
];

export default function AITutor() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('eee_tutor_history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved chat history');
      }
    } else {
      // Set initial greeting
      setMessages([
        {
          role: 'assistant',
          content: `### Welcome to your EEE Syllabus AI Tutor! 🎓

I am an expert University-level Electrical and Electronic Engineering Tutor, context-grounded in your syllabus:
1. **Circuit Theory**: KVL, KCL, Thevenin/Norton, Node/Mesh analysis, Phasors, and Resonance.
2. **Analog Electronics**: Diode circuits, BJT/MOSFET biasing/AC analysis, Op-Amps (Filters, Integrators), and Oscillators.
3. **Digital Electronics**: Boolean algebra, K-Maps, Combinational & Sequential logic (Flip-flops, Counters), ADC/DAC.

Feel free to ask me questions, request **step-by-step mathematical derivations**, or select one of the suggested syllabus prompts below to begin!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, []);

  // Save chat history to LocalStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('eee_tutor_history', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    setError('');
    const userMessage: Message = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Format history payload
      const historyPayload = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmed,
          history: historyPayload
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not OK');
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Expected JSON response from Chat API');
      }

      const data = await response.json();
      
      const tutorMessage: Message = {
        role: 'assistant',
        content: data.reply || "I'm sorry, I received an empty response. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, tutorMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setError('Connection failed. Please ensure the dev server is active and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear your tutoring conversation history?')) {
      localStorage.removeItem('eee_tutor_history');
      setMessages([
        {
          role: 'assistant',
          content: `Conversation history cleared. How can I help you with your Circuit Theory, Analog, or Digital Electronics syllabus studies today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  return (
    <div id="ai-tutor" className="min-h-screen bg-navy-dark text-slate-100 flex flex-col">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO TOOLS CATALOG
        </Link>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left column: Syllabus overview & Suggested prompts */}
        <aside className="lg:col-span-4 flex flex-col space-y-4">
          
          {/* Syllabus Grounding Card */}
          <div className="bg-navy-light/20 border border-navy-light/60 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2.5 text-emerald-accent mb-3 pb-2 border-b border-navy-light/40">
              <BookOpen className="h-5 w-5" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest">EEE Syllabus Bound</span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">Active Tutor Capabilities</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Strictly configured to support university-level electrical engineering, computing, and physics modules.
            </p>
            
            <ul className="mt-4 space-y-2.5 text-xs text-slate-300">
              <li className="flex gap-2">
                <span className="text-emerald-accent font-bold">Ⅰ.</span>
                <span><strong>Circuits I & II:</strong> Mesh/Node, Phasors, Impedance, Resonance.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-accent font-bold">Ⅱ.</span>
                <span><strong>Electronics I & II:</strong> BJTs, MOSFETs, Op-Amps, Wave generators.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-accent font-bold">Ⅲ.</span>
                <span><strong>Digital Logic:</strong> Boolean Algebra, Flip-flops, DACs/ADCs.</span>
              </li>
            </ul>
          </div>

          {/* Quick Syllabus Prompts */}
          <div className="bg-navy-light/20 border border-navy-light/60 rounded-2xl p-5 shadow-xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 text-emerald-accent mb-3 pb-2 border-b border-navy-light/40">
                <Sparkles className="h-5 w-5" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Suggested Questions</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Click any standard study topic below to automatically ask the AI Tutor for step-by-step explanations and math derivations:
              </p>

              <div className="space-y-2.5">
                {SUGGESTED_PROMPTS.map((sp, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(sp.prompt)}
                    className="w-full text-left p-3 rounded-xl bg-navy-light/30 hover:bg-emerald-accent/[0.04] border border-navy-light/60 hover:border-emerald-accent/30 text-xs transition-all duration-150 group cursor-pointer"
                  >
                    <span className="block text-[9px] font-mono text-emerald-accent uppercase tracking-wider mb-1">
                      {sp.topic}
                    </span>
                    <span className="font-semibold text-slate-200 group-hover:text-white leading-normal block">
                      {sp.short}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Clear History Button */}
            <button
              onClick={clearHistory}
              className="mt-6 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold text-red-400 bg-red-400/5 hover:bg-red-400/10 border border-red-500/10 hover:border-red-500/20 transition-all cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear Chat History</span>
            </button>
          </div>
        </aside>

        {/* Right column: Active Chat Interface */}
        <main className="lg:col-span-8 bg-navy-light/10 border border-navy-light/60 rounded-2xl shadow-xl flex flex-col h-[640px] overflow-hidden relative backdrop-blur-sm">
          
          {/* Chat Window Header */}
          <div className="px-6 py-4 bg-navy-light/30 border-b border-navy-light flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-accent/10 rounded-lg border border-emerald-accent/20">
                <GraduationCap className="h-5 w-5 text-emerald-accent" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Syllabus-Grounded AI Circuit Tutor</h2>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-accent animate-pulse"></span>
                  <span>Ready for Circuit, Analog & Digital logic queries</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              <span>UTC Sessions Active</span>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, idx) => {
              const isTutor = msg.role === 'assistant';
              return (
                <div
                  key={idx}
                  className={`flex gap-4 max-w-3xl ${isTutor ? 'mr-12' : 'ml-12 flex-row-reverse'}`}
                >
                  {/* Avatar */}
                  <div className={`h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 shadow-sm ${
                    isTutor 
                      ? 'bg-emerald-accent/10 border-emerald-accent/20 text-emerald-accent' 
                      : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  }`}>
                    {isTutor ? <GraduationCap className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`space-y-1 ${isTutor ? 'items-start' : 'items-end'}`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      isTutor 
                        ? 'bg-navy-light/40 border border-navy-light/60 text-slate-200' 
                        : 'bg-emerald-accent text-navy-dark font-medium'
                    }`}>
                      {isTutor ? (
                        <div className="markdown-body prose prose-invert prose-emerald max-w-none text-slate-200 prose-p:leading-relaxed prose-pre:bg-black/40 prose-pre:border prose-pre:border-navy-light">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                    <span className="block text-[9px] font-mono text-slate-500 px-2">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Thinking / Typing Loader */}
            {isLoading && (
              <div className="flex gap-4 max-w-3xl mr-12">
                <div className="h-8 w-8 rounded-lg border bg-emerald-accent/10 border-emerald-accent/20 text-emerald-accent flex items-center justify-center shrink-0">
                  <GraduationCap className="h-4.5 w-4.5 animate-bounce" />
                </div>
                <div className="bg-navy-light/40 border border-navy-light/60 rounded-2xl px-4 py-3 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-accent rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-accent rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-accent rounded-full animate-bounce"></div>
                  <span className="text-[10px] font-mono text-slate-400 ml-1.5 uppercase tracking-wider">DERIVING EQUATIONS...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-xl border border-red-500/10 bg-red-500/5 flex gap-2.5 max-w-2xl mx-auto">
                <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Message Input Box */}
          <div className="px-6 py-4 bg-navy-light/30 border-t border-navy-light shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputMessage);
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask your EEE Tutor (e.g., 'Derive the common emitter gain')"
                disabled={isLoading}
                className="flex-1 rounded-xl bg-navy-light/40 border border-navy-light px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-accent/50 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-3 rounded-xl bg-emerald-accent text-navy-dark hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed font-semibold shadow-md transition-all flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
            <div className="mt-2 text-[10px] text-slate-500 text-center flex items-center justify-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-slate-600" />
              <span>Equations are rendered in human-friendly professional plaintext and Unicode mathematical notation</span>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
