import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import {
  Cpu,
  Zap,
  Activity,
  Award,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Plus,
  Minus,
  Sliders,
  Send,
  MessageSquare,
  Calculator
} from 'lucide-react';
import { ComponentItem, PlatformStat, FAQItem, TestimonialItem } from '../types';

interface HomeViewProps {
  components: ComponentItem[];
  stats: PlatformStat[];
  faqs: FAQItem[];
  testimonials: TestimonialItem[];
}

export default function HomeView({ components, stats, faqs, testimonials }: HomeViewProps) {
  // Newsletter state
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // FAQ Accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Circuit Tool state (555 Timer Astable)
  const [rA, setRA] = useState(10); // kOhms
  const [rB, setRB] = useState(47); // kOhms
  const [cap, setCap] = useState(0.1); // uF

  // Circuit Tool state (Op-Amp Gain)
  const [r1, setR1] = useState(10); // kOhms
  const [rf, setRf] = useState(100); // kOhms

  // Calculations
  const calculatedFreq = 1.44 / (((rA + 2 * rB) * 1000) * (cap * 0.000001));
  const calculatedDuty = ((rA + rB) / (rA + 2 * rB)) * 100;
  const opAmpGain = 1 + (rf / r1);

  // Platform Stats Data (Recharts)
  const statsData = stats && stats.length > 0 ? stats : [
    { month: 'Jan', ActiveUsers: 320, ComponentScans: 450, Queries: 1200 },
    { month: 'Feb', ActiveUsers: 480, ComponentScans: 680, Queries: 1800 },
    { month: 'Mar', ActiveUsers: 640, ComponentScans: 950, Queries: 2500 },
    { month: 'Apr', ActiveUsers: 890, ComponentScans: 1400, Queries: 3600 },
    { month: 'May', ActiveUsers: 1100, ComponentScans: 1950, Queries: 4900 },
    { month: 'Jun', ActiveUsers: 1450, ComponentScans: 2600, Queries: 6800 },
    { month: 'Jul', ActiveUsers: 1850, ComponentScans: 3500, Queries: 9400 },
  ];

  // Popular components (LM358, NE555, ATmega328P)
  const popularComponents = components.slice(0, 3);

  const lastStat = statsData[statsData.length - 1];
  const activeUsersDisplay = lastStat ? `${lastStat.ActiveUsers.toLocaleString()}+` : '1,850+';
  const scansDisplay = lastStat ? `${lastStat.ComponentScans.toLocaleString()}+` : '450+';

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <div className="font-sans space-y-16 sm:space-y-24 bg-navy-dark text-slate-100">
      
      {/* SECTION 1: HERO (60-70% viewport height) */}
      <section className="relative overflow-hidden border-b border-navy-light/40 flex items-center justify-center min-h-[70vh] px-4">
        {/* Abstract grid background with gradient glow */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#131a2c_1px,transparent_1px),linear-gradient(to_bottom,#131a2c_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-accent/5 rounded-full blur-3xl z-0" />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-accent/10 border border-emerald-accent/20 px-3.5 py-1.5 text-xs font-semibold text-emerald-accent tracking-wide uppercase">
            <Zap className="h-3.5 w-3.5" /> Next-Gen Electrical Engineering Hub
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
<<<<<<< HEAD
            Master the Entire EEE Curriculum <br />
            With <span className="text-emerald-accent bg-emerald-accent/5 px-2 py-0.5 rounded border border-emerald-accent/20">Agentic AI</span> & Live Solvers
          </h1>

          <p className="text-sm sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            The premium workspace featuring comprehensive tools for Control Systems, DSP, Power Systems, Telecommunications, VLSI, and interactive circuit simulations.
=======
            Accelerate Your Circuit Design <br />
            With <span className="text-emerald-accent bg-emerald-accent/5 px-2 py-0.5 rounded border border-emerald-accent/20">Agentic AI</span> specifications
          </h1>

          <p className="text-sm sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            The premium workspace for operational amplifiers, 555 precision timing, active filter simulations, and instant PDF datasheet intelligence.
>>>>>>> 6183e3e30f0dad1b928ff0629653d32a42b17d0c
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link
              to="/explore"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-accent px-6 py-3 text-sm font-bold text-navy-dark hover:bg-emerald-hover shadow-lg shadow-emerald-accent/15 transition-all"
            >
              Explore Components
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/about"
              className="flex items-center gap-1.5 rounded-xl border border-navy-light bg-navy-light/30 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-light/60 transition-colors"
            >
              Our Mission
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2: FEATURES OVERVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-white">
            Designed for University Scholars & Maker Pros
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Packed with advanced full-stack capabilities, analytical calculations, and intelligent engineering guides.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-2xl border border-navy-light/60 bg-navy-card p-6 space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-accent/10 border border-emerald-accent/20">
              <BookOpen className="h-6 w-6 text-emerald-accent" />
            </div>
            <h3 className="font-display text-lg font-bold text-white">Datasheet Extraction</h3>
            <p className="text-xs leading-relaxed text-slate-400">
              Instantly analyze technical datasheets using Google Gemini. Extract pinouts, thermal boundaries, and operating currents in seconds.
            </p>
          </div>

          <div className="rounded-2xl border border-navy-light/60 bg-navy-card p-6 space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-accent/10 border border-emerald-accent/20">
              <Activity className="h-6 w-6 text-emerald-accent" />
            </div>
            <h3 className="font-display text-lg font-bold text-white">Circuit Calculations</h3>
            <p className="text-xs leading-relaxed text-slate-400">
              Perform immediate AC gain and timer frequency computations. Avoid configuration mistakes in passive Butterworth and active feedback grids.
            </p>
          </div>

          <div className="rounded-2xl border border-navy-light/60 bg-navy-card p-6 space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-accent/10 border border-emerald-accent/20">
              <Award className="h-6 w-6 text-emerald-accent" />
            </div>
<<<<<<< HEAD
            <h3 className="font-display text-lg font-bold text-white">Entire EEE Curriculum Aligned</h3>
=======
            <h3 className="font-display text-lg font-bold text-white">EEE-2104 Lab Aligned</h3>
>>>>>>> 6183e3e30f0dad1b928ff0629653d32a42b17d0c
            <p className="text-xs leading-relaxed text-slate-400">
              All tools, equations, and interactive prompts are calibrated specifically to standard laboratory curriculum of major engineering colleges.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: INTERACTIVE CIRCUIT ANALYSIS TOOLS (Premium Lab Calculator!) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-navy-card/40 rounded-3xl border border-navy-light p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1 bg-emerald-accent/10 text-emerald-accent border border-emerald-accent/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <Sliders className="h-3 w-3" /> Live Engineering Sandboxes
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-white leading-tight">
              Instant Simulation & Lab Equation Checkers
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              University scholars can input theoretical resistor and capacitor values to calculate accurate, simulated oscillations and gain ratios. Perfect for cross-checking multi-stage circuit configurations!
            </p>
            
            <div className="flex gap-4 border-l-2 border-emerald-accent/30 pl-4 py-1">
              <div className="text-xs text-slate-400">
                <span className="font-semibold text-emerald-accent block">555 Timer Mode:</span>
                Astable pulse width generator
              </div>
              <div className="text-xs text-slate-400">
                <span className="font-semibold text-emerald-accent block">Op-Amp Mode:</span>
                Non-Inverting closed-loop voltage gain
              </div>
            </div>
          </div>

          {/* Interactive Calculator Block */}
          <div className="space-y-6 bg-navy-dark p-6 rounded-2xl border border-navy-light">
            <div className="border-b border-navy-light pb-4 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Cpu className="h-4 w-4 text-emerald-accent" /> Lab Workspace
              </span>
              <span className="text-[10px] font-mono text-emerald-accent bg-emerald-accent/10 px-2.5 py-0.5 rounded-full">
                Interactive Calculations
              </span>
            </div>

            {/* Split calculators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 555 Timer */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-white border-l border-emerald-accent pl-2">555 Timer Astable Osc.</h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 flex justify-between">
                      <span>Resistor RA (kΩ)</span>
                      <span className="font-mono text-emerald-accent">{rA} kΩ</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={rA}
                      onChange={(e) => setRA(Number(e.target.value))}
                      className="w-full accent-emerald-accent h-1 bg-navy-light rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 flex justify-between">
                      <span>Resistor RB (kΩ)</span>
                      <span className="font-mono text-emerald-accent">{rB} kΩ</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={rB}
                      onChange={(e) => setRB(Number(e.target.value))}
                      className="w-full accent-emerald-accent h-1 bg-navy-light rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 flex justify-between">
                      <span>Capacitor C (μF)</span>
                      <span className="font-mono text-emerald-accent">{cap} μF</span>
                    </label>
                    <input
                      type="range"
                      min="0.01"
                      max="10"
                      step="0.01"
                      value={cap}
                      onChange={(e) => setCap(Number(e.target.value))}
                      className="w-full accent-emerald-accent h-1 bg-navy-light rounded-lg"
                    />
                  </div>
                </div>

                <div className="bg-navy-light/40 p-3 rounded-lg border border-navy-light space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Frequency (Hz):</span>
                    <span className="font-mono font-bold text-emerald-accent">
                      {calculatedFreq > 1000 ? `${(calculatedFreq / 1000).toFixed(2)} kHz` : `${calculatedFreq.toFixed(1)} Hz`}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Duty Cycle:</span>
                    <span className="font-mono font-bold text-emerald-accent">{calculatedDuty.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Non-Inverting Op-Amp */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-white border-l border-emerald-accent pl-2">Op-Amp Non-Inverting</h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 flex justify-between">
                      <span>Input R1 (kΩ)</span>
                      <span className="font-mono text-emerald-accent">{r1} kΩ</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={r1}
                      onChange={(e) => setR1(Number(e.target.value))}
                      className="w-full accent-emerald-accent h-1 bg-navy-light rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 flex justify-between">
                      <span>Feedback Rf (kΩ)</span>
                      <span className="font-mono text-emerald-accent">{rf} kΩ</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="200"
                      value={rf}
                      onChange={(e) => setRf(Number(e.target.value))}
                      className="w-full accent-emerald-accent h-1 bg-navy-light rounded-lg"
                    />
                  </div>
                </div>

                <div className="bg-navy-light/40 p-3 rounded-lg border border-navy-light space-y-1 md:mt-11">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Closed-Loop Gain:</span>
                    <span className="font-mono font-bold text-emerald-accent">{opAmpGain.toFixed(1)} V/V</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Gain in Decibels:</span>
                    <span className="font-mono font-bold text-emerald-accent">{(20 * Math.log10(opAmpGain)).toFixed(1)} dB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: PLATFORM STATISTICS (Recharts Graphic) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-1 space-y-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Verified Platform Growth & Trends
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Our open analytical hub tracks active components, verified datasheets, and user queries queried globally.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-navy-card border border-navy-light p-3.5 rounded-xl text-center">
                <span className="block font-display text-xl font-bold text-emerald-accent">{activeUsersDisplay}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide">Scholars</span>
              </div>
              <div className="bg-navy-card border border-navy-light p-3.5 rounded-xl text-center">
                <span className="block font-display text-xl font-bold text-emerald-accent">{scansDisplay}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide">Component Models</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-navy-card border border-navy-light p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1">
                <Activity className="h-4 w-4 text-emerald-accent" /> Monthly Interaction Volume
              </h3>
              <div className="flex gap-3 text-[10px] font-semibold">
                <span className="flex items-center gap-1 text-emerald-accent">
                  <span className="h-2 w-2 rounded-full bg-emerald-accent" /> Active Users
                </span>
                <span className="flex items-center gap-1 text-indigo-400">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" /> API Queries
                </span>
              </div>
            </div>

            <div className="h-64 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={statsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#475569" />
                  <YAxis stroke="#475569" />
                  <Tooltip contentStyle={{ backgroundColor: '#131A2C', borderColor: '#1E293B', color: '#F8FAFC' }} />
                  <Area type="monotone" dataKey="ActiveUsers" name="Active Users" stroke="#10B981" fillOpacity={1} fill="url(#colorUsers)" />
                  <Area type="monotone" dataKey="Queries" name="API Queries" stroke="#6366F1" fillOpacity={1} fill="url(#colorQueries)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: POPULAR COMPONENTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10">
          <div className="space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">Popular Circuit Modules</h2>
            <p className="text-xs text-slate-400 max-w-lg">
              Check out the most frequent semiconductor elements analysed in EEE university departments.
            </p>
          </div>
          <Link
            to="/explore"
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-accent hover:text-white transition-colors"
          >
            Browse Full Catalog
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {popularComponents.map((comp) => (
            <div key={comp.id} className="rounded-2xl border border-navy-light bg-navy-card overflow-hidden flex flex-col h-[380px] circuit-card-glow">
              <div className="h-44 relative bg-slate-900 overflow-hidden">
                <img
                  src={comp.imageUrl}
                  alt={comp.title}
                  className="w-full h-full object-cover opacity-80"
                />
                <span className="absolute top-3 left-3 bg-navy-dark/95 border border-navy-light text-emerald-accent text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {comp.category}
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="font-display text-base font-bold text-white truncate">{comp.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{comp.description}</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-navy-light/60 mt-4">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono font-bold text-slate-300">Rating:</span>
                    <span className="text-xs font-bold text-emerald-accent">{comp.rating} ★</span>
                  </div>
                  <Link
                    to={`/component/${comp.id}`}
                    className="text-xs font-bold text-emerald-accent hover:text-white transition-colors"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5.5: ADVANCED SYLLABUS ENGINEERING CORES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-indigo-950/20 to-emerald-950/10 border border-emerald-500/20 rounded-3xl p-8 sm:p-12 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl z-0" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl z-0" />

          <div className="relative z-10 max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-accent/10 border border-emerald-accent/20 px-3 py-1 text-[10px] font-mono font-bold text-emerald-accent uppercase tracking-wider">
              <Cpu className="h-3 w-3" /> EEE Syllabus Track Expansion (Advanced Cores)
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-white">
              Advanced Machines, VLSI Design & Power Cores
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Explore advanced engineering tools, mathematical solvers, and generative firmware/HDL models aligned directly with standard undergraduate course syllabi.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            {/* Calculator suite card */}
            <div className="bg-navy-dark/90 border border-navy-light p-6 rounded-2xl flex flex-col justify-between hover:border-emerald-accent/40 transition-all group">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-accent/10 border border-emerald-accent/20 group-hover:bg-emerald-accent/20 transition-all">
                  <Calculator className="h-6 w-6 text-emerald-accent" />
                </div>
                <h3 className="font-display text-lg font-bold text-white group-hover:text-emerald-accent transition-colors">
                  Advanced Calculators Suite
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Analyze 3-Phase Induction Motors, design high-efficiency Buck/Boost Power Converters, visualize closed-loop PID control systems, and calculate Short Transmission Line regulations.
                </p>
              </div>
              <div className="pt-6">
                <Link
                  to="/advanced-tools"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-accent hover:text-white transition-colors"
                >
                  Launch Advanced Suite
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Hardware AI assistant card */}
            <div className="bg-navy-dark/90 border border-navy-light p-6 rounded-2xl flex flex-col justify-between hover:border-indigo-400/40 transition-all group">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-all">
                  <Cpu className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="font-display text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                  Embedded Code & HDL Assistant
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generative AI specialized in microprocessor firmware and silicon logic designs. Outputs fully annotated Arduino, STM32 C registers, ARM assembly, or Verilog HDL templates.
                </p>
              </div>
              <div className="pt-6">
                <Link
                  to="/hardware-ai"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-white transition-colors"
                >
                  Open Code Assistant
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">Engineering Reviews</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            See what actual university lab assistants and research scholars think of our analytical platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(testimonials && testimonials.length > 0 ? testimonials : [
            {
              id: 'test1',
<<<<<<< HEAD
              quote: '"CircuitHub has completely saved my EEE university exams. The op-amp gain and active filter calculations are accurate and help us double-check physical lab board parameters."',
=======
              quote: '"CircuitHub has completely saved my EEE-2104 university exams. The op-amp gain and active filter calculations are accurate and help us double-check physical lab board parameters."',
>>>>>>> 6183e3e30f0dad1b928ff0629653d32a42b17d0c
              authorName: 'Ananya Rao',
              authorRole: 'EEE Student, Section B',
              initials: 'AR'
            },
            {
              id: 'test2',
              quote: '"The Datasheet Analyzer works beautifully. Uploading complex manufacturer specification sheets and immediately receiving pin-out summary tables saves immense time in our prototyping stages."',
              authorName: 'David Harrison',
              authorRole: 'Embedded Engineer, MakerLab',
              initials: 'DH'
            },
            {
              id: 'test3',
              quote: '"The AI Chat Assistant provides excellent mathematical derivations. I asked it to explain Astable multivibrators, and it step-by-step analyzed the duty cycle resistors. Highly accurate teaching assistant."',
              authorName: 'Dr. Sarah Jenkins',
              authorRole: 'Associate Professor, Department of EEE',
              initials: 'DR'
            }
          ]).map((testimonial) => (
            <div key={testimonial.id} className="bg-navy-card/60 border border-navy-light p-6 rounded-2xl relative">
              <MessageSquare className="h-10 w-10 text-emerald-accent/5 absolute top-4 right-4" />
              <p className="text-xs text-slate-300 leading-relaxed italic mb-4">
                {testimonial.quote}
              </p>
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-emerald-accent/10 border border-emerald-accent/30 flex items-center justify-center font-display font-bold text-xs text-emerald-accent">
                  {testimonial.initials}
                </div>
                <div>
                  <span className="block text-xs font-bold text-white">{testimonial.authorName}</span>
                  <span className="block text-[10px] text-slate-500">{testimonial.authorRole}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 7: FAQ (Accordion Style) */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-3 mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-400">
            Answers to common queries regarding circuit analysis calculations and AI capabilities.
          </p>
        </div>

        <div className="space-y-4">
          {(faqs && faqs.length > 0 ? faqs : [
            {
              id: 'faq1',
              q: 'How does the Gemini Datasheet Analyzer process PDF files?',
              a: 'Our backend uses the Google Gemini 3.5 API. When you upload a datasheet or copy raw technical specification text, our system reads and processes the text parameters. It extracts structured fields, including exact pin configurations, thermal parameters, and typical application setups, rendering them in neat bullet points and tables.'
            },
            {
              id: 'faq2',
              q: 'Are the interactive calculations calibrated for real physical hardware?',
              a: 'Yes! The calculations for the 555 Astable timer frequency (f = 1.44 / ((Ra + 2Rb) * C)) and Non-Inverting Op-Amp Closed-Loop Gain (Av = 1 + Rf/R1) are fully aligned with standard physics equations and active laboratory manuals. Note that physical components have tolerance values (e.g. 5% or 10% tolerance resistors) which may slightly drift from mathematical theory in real life.'
            },
            {
              id: 'faq3',
              q: 'Can I add my own customized circuits and components to the explore directory?',
              a: 'Absolutely! Once registered and logged in, you can navigate to your Developer Dashboard, click on "Add Component Spec" and input names, specifications (table style), category details, and images. They will immediately become part of the central explore directory and can be analyzed by other engineers.'
            },
            {
              id: 'faq4',
              q: 'Who maintains this electronics engineering repository?',
              a: 'This application is built, tested, and actively managed by Firoz Ahmed, specifically formatted to support researchers and scholars seeking rapid reference tools.'
            }
          ]).map((item, idx) => (
            <div key={item.id || idx} className="bg-navy-card border border-navy-light rounded-xl overflow-hidden transition-all">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between p-4 text-xs sm:text-sm font-bold text-white hover:text-emerald-accent transition-colors text-left"
              >
                <span>{item.q}</span>
                <span className="text-slate-400">{openFaq === idx ? '−' : '+'}</span>
              </button>
              {openFaq === idx && (
                <div className="p-4 pt-0 border-t border-navy-light/40 text-xs text-slate-300 leading-relaxed bg-navy-dark/40">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 8: NEWSLETTER SUBSCRIPTION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        <div className="bg-gradient-to-r from-navy-card to-navy-light/40 border border-navy-light p-8 rounded-3xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-accent/5 rounded-full blur-3xl z-0" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="font-display text-xl sm:text-3xl font-bold text-white">Join the CircuitHub Newsletter</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Subscribe to receive weekly lab manuals, active high-pass filter calculations, and updates on newly added semiconductor components. No spam, unsubscribe anytime.
            </p>

            {subscribed ? (
              <div className="flex items-center justify-center gap-2 text-emerald-accent bg-emerald-accent/10 border border-emerald-accent/20 px-4 py-3 rounded-xl text-xs font-semibold max-w-md mx-auto">
                <CheckCircle className="h-4.5 w-4.5" />
                Thank you! You are now subscribed to technical updates.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your student or company email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-navy-dark border border-navy-light rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-accent transition-colors"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-accent hover:bg-emerald-hover text-navy-dark px-6 py-3 text-xs font-bold transition-all shadow-lg shadow-emerald-accent/10 cursor-pointer"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
      
    </div>
  );
}
