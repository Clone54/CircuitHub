import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWaveguideMath } from '../hooks/useWaveguideMath';
import { useTransformerMath } from '../hooks/useTransformerMath';
import { useBridgeMath, BridgeType } from '../hooks/useBridgeMath';
import { useVLSIMath } from '../hooks/useVLSIMath';
import { IEEEReportButton } from '../components/IEEEReportButton';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  Zap,
  Activity,
  Cpu,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Info,
  BookOpen,
  RefreshCw,
  Layers,
  Settings,
  Flame,
  Binary,
  ArrowLeft
} from 'lucide-react';

type ToolTab = 'waveguide' | 'transformer' | 'bridge' | 'vlsi';

export default function CoreToolsLayout() {
  const [activeTab, setActiveTab] = useState<ToolTab>('waveguide');
  const [isChangingTab, setIsChangingTab] = useState<boolean>(false);

  // Trigger skeleton loader on tab change to feel premium and responsive
  const handleTabChange = (tab: ToolTab) => {
    setIsChangingTab(true);
    setActiveTab(tab);
    const timer = setTimeout(() => {
      setIsChangingTab(false);
    }, 450);
    return () => clearTimeout(timer);
  };

  // ==========================================
  // 1. RECTANGULAR WAVEGUIDE ANALYZER STATE
  // ==========================================
  const {
    inputs: waveguideIn,
    setInputs: setWaveguideIn,
    outputs: waveguideOut
  } = useWaveguideMath({
    a: 2.286, // cm (WR-90 standard)
    b: 1.016, // cm
    frequency: 10, // GHz
    m: 1,
    n: 0,
    modeType: 'TE'
  });

  // Calculate waveguide data points for phase constant (beta) plot
  const waveguidePlotData = useMemo(() => {
    const fc = waveguideOut.cutoffFrequency;
    if (fc <= 0) return [];

    const data = [];
    const minF = Math.max(0.1, fc * 0.5);
    const maxF = Math.max(20, fc * 2.0);
    const steps = 30;
    const stepSize = (maxF - minF) / steps;

    const c = 3.0e10; // speed of light in cm/s

    for (let i = 0; i <= steps; i++) {
      const f = minF + i * stepSize;
      const omega = 2 * Math.PI * f * 1e9; // in rad/s
      let beta = 0;

      if (f > fc) {
        // beta = (omega / c) * sqrt(1 - (fc/f)^2)
        const factor = Math.sqrt(1 - Math.pow(fc / f, 2));
        beta = (omega / 3e10) * factor; // rad/cm
      }

      data.push({
        frequency: parseFloat(f.toFixed(2)),
        'Phase Constant (β)': parseFloat(beta.toFixed(3))
      });
    }
    return data;
  }, [waveguideOut.cutoffFrequency]);

  // ==========================================
  // 2. TRANSFORMER EQUIVALENT CIRCUIT STATE
  // ==========================================
  const {
    inputs: transIn,
    setInputs: setTransIn,
    outputs: transOut
  } = useTransformerMath({
    voc: 220, // V
    ioc: 0.5, // A
    poc: 40,  // W
    vsc: 15,  // V
    isc: 4.0, // A
    psc: 35   // W
  });

  // ==========================================
  // 3. AC BRIDGE SOLVER STATE
  // ==========================================
  const {
    inputs: bridgeIn,
    setInputs: setBridgeIn,
    outputs: bridgeOut
  } = useBridgeMath({
    bridgeType: 'maxwell',
    frequency: 1000, // Hz
    maxwellR1: 1000, // Ohms
    maxwellR2: 500,  // Ohms
    maxwellR3: 200,  // Ohms
    maxwellC1: 0.1,  // uF
    scheringC2: 0.01, // uF
    scheringR3: 1000, // Ohms
    scheringR4: 2000, // Ohms
    scheringC4: 0.05  // uF
  });

  // ==========================================
  // 4. VLSI POWER ESTIMATOR STATE
  // ==========================================
  const {
    inputs: vlsiIn,
    setInputs: setVlsiIn,
    outputs: vlsiOut
  } = useVLSIMath({
    vdd: 1.2, // V
    frequency: 250, // MHz
    capacitance: 15, // pF
    ileak: 8.0 // uA
  });

  const vlsiPieData = useMemo(() => {
    if (vlsiOut.pTotal <= 0) return [];
    return [
      { name: 'Dynamic Power', value: parseFloat(vlsiOut.pDynamic.toFixed(2)), color: '#10B981' },
      { name: 'Static Power', value: parseFloat(vlsiOut.pStatic.toFixed(2)), color: '#3B82F6' }
    ];
  }, [vlsiOut]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      {/* Back button */}
      <div>
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO TOOLS CATALOG
        </Link>
      </div>

      {/* Upper header block */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-emerald-accent/10 border border-emerald-accent/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-accent uppercase tracking-wider">
          <Layers className="h-4 w-4" /> Core EEE Syllabus Cores
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
          Core Engineering Computation Suite
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-3xl leading-relaxed">
          Interactive design engines calibrated for Upper-level Electromagnetic Fields, Electrical Machines, Measurements & Instrumentation, and VLSI CMOS Circuits.
        </p>
      </div>

      {/* Main Layout Grid with Left Sidebar and Right View Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT SIDEBAR NAVIGATION */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-navy-card border border-navy-light rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block px-3 mb-2">
              Course Categories
            </span>
            {[
              { id: 'waveguide', name: 'Waveguide Analyzer', subtitle: 'Electromagnetics (EEE 2107)', icon: Layers },
              { id: 'transformer', name: 'Transformer Parameters', subtitle: 'Machines I (EEE 2207)', icon: Zap },
              { id: 'bridge', name: 'AC Bridge Solver', subtitle: 'Instrumentation (EEE 2211)', icon: Activity },
              { id: 'vlsi', name: 'CMOS Power Estimator', subtitle: 'VLSI Design I (EEE 2213)', icon: Cpu }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as ToolTab)}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3.5 group cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-accent/10 border-emerald-accent/30 text-emerald-accent'
                      : 'bg-transparent border-transparent text-slate-400 hover:bg-navy-light/40 hover:text-white'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-emerald-accent/10 text-emerald-accent' : 'bg-navy-dark border border-navy-light text-slate-400 group-hover:text-white'}`}>
                    <TabIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold font-display leading-tight">{tab.name}</div>
                    <div className="text-[9px] text-slate-500 truncate leading-tight mt-0.5">{tab.subtitle}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-navy-card/50 border border-navy-light/60 p-4 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <BookOpen className="h-4 w-4 text-emerald-accent shrink-0" />
              Syllabus Alignment
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              These solvers align mathematically with premier engineering curriculums, solving vector wave, magnetic core loss, impedance balancing, and dynamic clocking formulas directly.
            </p>
          </div>
        </div>

        {/* RIGHT CONTENT DISPLAY WINDOW */}
        <div className="lg:col-span-9">
          
          {/* Skeleton Loader Panel */}
          {isChangingTab ? (
            <div className="bg-navy-card border border-navy-light p-6 sm:p-8 rounded-3xl space-y-8 animate-pulse min-h-[520px]">
              <div className="space-y-2">
                <div className="h-5 bg-navy-light/50 rounded-lg w-1/4" />
                <div className="h-3 bg-navy-light/50 rounded-lg w-1/2" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-64 bg-navy-light/30 rounded-2xl border border-navy-light/50" />
                <div className="md:col-span-2 h-64 bg-navy-light/30 rounded-2xl border border-navy-light/50" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-navy-light/30 rounded-xl border border-navy-light/50" />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-navy-card border border-navy-light p-6 sm:p-8 rounded-3xl shadow-xl min-h-[520px]">
              
              {/* 1. RECTANGULAR WAVEGUIDE ANALYZER VIEW */}
              {activeTab === 'waveguide' && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="border-l-4 border-emerald-accent pl-4">
                    <h2 className="text-xl font-bold text-white font-display">Rectangular Waveguide Analyzer (EEE 2107)</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Computes electromagnetic cut-off frequencies and propagation properties under TE/TM modes in standard hollow waveguides.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Input Controls */}
                    <div className="lg:col-span-4 space-y-5 bg-navy-dark p-5 rounded-2xl border border-navy-light">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-navy-light pb-2">
                        <Sliders className="h-4 w-4 text-emerald-accent" /> Control Inputs
                      </h3>

                      <div className="space-y-4 text-xs">
                        {/* Mode Selection */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setWaveguideIn({ ...waveguideIn, modeType: 'TE' })}
                            className={`py-2 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                              waveguideIn.modeType === 'TE'
                                ? 'bg-emerald-accent/10 border-emerald-accent/30 text-emerald-accent'
                                : 'bg-navy-card border-navy-light text-slate-400 hover:text-white'
                            }`}
                          >
                            TE Mode
                          </button>
                          <button
                            type="button"
                            onClick={() => setWaveguideIn({ ...waveguideIn, modeType: 'TM', m: waveguideIn.m === 0 ? 1 : waveguideIn.m, n: waveguideIn.n === 0 ? 1 : waveguideIn.n })}
                            className={`py-2 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                              waveguideIn.modeType === 'TM'
                                ? 'bg-emerald-accent/10 border-emerald-accent/30 text-emerald-accent'
                                : 'bg-navy-card border-navy-light text-slate-400 hover:text-white'
                            }`}
                          >
                            TM Mode
                          </button>
                        </div>

                        {/* Mode Indices */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">Index m</label>
                            <select
                              value={waveguideIn.m}
                              onChange={(e) => setWaveguideIn({ ...waveguideIn, m: parseInt(e.target.value) })}
                              className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                            >
                              {[0, 1, 2, 3, 4].map((v) => (
                                <option key={v} value={v} disabled={waveguideIn.modeType === 'TM' && v === 0}>
                                  m = {v}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">Index n</label>
                            <select
                              value={waveguideIn.n}
                              onChange={(e) => setWaveguideIn({ ...waveguideIn, n: parseInt(e.target.value) })}
                              className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                            >
                              {[0, 1, 2, 3, 4].map((v) => (
                                <option key={v} value={v} disabled={waveguideIn.modeType === 'TM' && v === 0}>
                                  n = {v}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Dimensions */}
                        <div>
                          <label className="block font-semibold text-slate-300 mb-1.5">
                            Broad Wall Dimension (a)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              min="0.1"
                              value={waveguideIn.a}
                              onChange={(e) => setWaveguideIn({ ...waveguideIn, a: Math.max(0.1, parseFloat(e.target.value) || 0) })}
                              className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                            />
                            <span className="absolute right-3 top-2 text-[9px] text-slate-500 font-mono">cm</span>
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-300 mb-1.5">
                            Narrow Wall Dimension (b)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              min="0.1"
                              value={waveguideIn.b}
                              onChange={(e) => setWaveguideIn({ ...waveguideIn, b: Math.max(0.1, parseFloat(e.target.value) || 0) })}
                              className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                            />
                            <span className="absolute right-3 top-2 text-[9px] text-slate-500 font-mono">cm</span>
                          </div>
                        </div>

                        {/* Operating Frequency */}
                        <div>
                          <label className="block font-semibold text-slate-300 mb-1.5">
                            Operating Frequency (f)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={waveguideIn.frequency}
                              onChange={(e) => setWaveguideIn({ ...waveguideIn, frequency: Math.max(0.1, parseFloat(e.target.value) || 0) })}
                              className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                            />
                            <span className="absolute right-3 top-2 text-[9px] text-slate-500 font-mono">GHz</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Results / Visual Plot */}
                    <div className="lg:col-span-8 space-y-6">
                      <div className="flex justify-end mb-4">
                        <IEEEReportButton
                          experimentName="Microwave Engineering: Rectangular Waveguide Analysis"
                          inputData={{
                            'Waveguide Width (a)': waveguideIn.a + ' cm',
                            'Waveguide Height (b)': waveguideIn.b + ' cm',
                            'Mode': waveguideIn.modeType + '_' + waveguideIn.m + waveguideIn.n,
                            'Operating Frequency': waveguideIn.frequency + ' GHz'
                          }}
                          outputData={{
                            'Cut-off Frequency (fc)': waveguideOut.cutoffFrequency.toFixed(3) + ' GHz',
                            'Guide Wavelength (λg)': waveguideOut.guideWavelength ? waveguideOut.guideWavelength.toFixed(3) + ' cm' : 'N/A',
                            'Phase Velocity (vp)': waveguideOut.phaseVelocity ? (waveguideOut.phaseVelocity / 3e8).toFixed(3) + ' c' : 'N/A',
                            'Group Velocity (vg)': waveguideOut.groupVelocity ? (waveguideOut.groupVelocity / 3e8).toFixed(3) + ' c' : 'N/A'
                          }}
                          chartSelectors={['#waveguide-chart']}
                        />
                      </div>
                      
                      {/* Wave propagation indicator */}
                      {waveguideOut.error ? (
                        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex gap-3 text-red-400">
                          <AlertTriangle className="h-5 w-5 shrink-0" />
                          <div className="text-xs">
                            <span className="font-bold block">Input Boundary Error</span>
                            <p>{waveguideOut.error}</p>
                          </div>
                        </div>
                      ) : waveguideOut.propagates ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex gap-3 text-emerald-400">
                          <CheckCircle2 className="h-5 w-5 shrink-0" />
                          <div className="text-xs">
                            <span className="font-bold block">Wave Propagation Active</span>
                            <p>Operating frequency ({waveguideIn.frequency} GHz) is above the Cut-off threshold ({waveguideOut.cutoffFrequency.toFixed(3)} GHz).</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex gap-3 text-red-400 animate-pulse">
                          <AlertTriangle className="h-5 w-5 shrink-0" />
                          <div className="text-xs">
                            <span className="font-bold block">Propagation Failed (Cut-off active)</span>
                            <p>Operating frequency ({waveguideIn.frequency} GHz) is below the Cut-off threshold ({waveguideOut.cutoffFrequency.toFixed(3)} GHz). Electromagnetic fields decay exponentially (Evanescent behavior).</p>
                          </div>
                        </div>
                      )}

                      {/* Waveguide plot */}
                      {!waveguideOut.error && waveguideOut.cutoffFrequency > 0 && (
                        <div className="bg-navy-dark border border-navy-light p-4 rounded-2xl" id="waveguide-chart">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Binary className="h-4 w-4 text-emerald-accent" /> Dispersion Characteristics (β vs. f)
                          </h4>
                          <div className="h-52 w-full text-[10px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={waveguidePlotData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorBeta" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                                <XAxis dataKey="frequency" stroke="#64748B" label={{ value: 'Frequency (GHz)', position: 'insideBottomRight', offset: -5 }} />
                                <YAxis stroke="#64748B" label={{ value: 'β (rad/cm)', angle: -90, position: 'insideLeft', offset: 10 }} />
                                <RechartsTooltip contentStyle={{ backgroundColor: '#131A2C', borderColor: '#1E293B', color: '#F8FAFC' }} />
                                <Area type="monotone" dataKey="Phase Constant (β)" stroke="#10B981" fillOpacity={1} fill="url(#colorBeta)" strokeWidth={2} />
                                <ReferenceLine x={waveguideOut.cutoffFrequency} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'f_c Cutoff', fill: '#EF4444', position: 'top', fontSize: 9 }} />
                                <ReferenceLine x={waveguideIn.frequency} stroke="#10B981" strokeWidth={2} label={{ value: 'f Operating', fill: '#10B981', position: 'top', fontSize: 9 }} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {/* Display Outputs */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-navy-dark border border-navy-light p-4 rounded-xl space-y-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Cut-off f_c</span>
                          <span className="text-base font-mono font-extrabold text-white block">
                            {waveguideOut.cutoffFrequency.toFixed(3)} <span className="text-[10px] text-slate-400">GHz</span>
                          </span>
                        </div>

                        <div className="bg-navy-dark border border-navy-light p-4 rounded-xl space-y-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Guide λ_g</span>
                          <span className="text-base font-mono font-extrabold text-emerald-accent block">
                            {waveguideOut.guideWavelength ? `${waveguideOut.guideWavelength.toFixed(3)} cm` : 'N/A (Decay)'}
                          </span>
                        </div>

                        <div className="bg-navy-dark border border-navy-light p-4 rounded-xl space-y-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Phase Vel v_p</span>
                          <span className="text-base font-mono font-extrabold text-white block">
                            {waveguideOut.phaseVelocity ? `${(waveguideOut.phaseVelocity / 3e8).toFixed(3)} c` : 'N/A'}
                          </span>
                        </div>

                        <div className="bg-navy-dark border border-navy-light p-4 rounded-xl space-y-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Group Vel v_g</span>
                          <span className="text-base font-mono font-extrabold text-emerald-accent block">
                            {waveguideOut.groupVelocity ? `${(waveguideOut.groupVelocity / 3e8).toFixed(3)} c` : 'N/A'}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* 2. TRANSFORMER EQUIVALENT CIRCUIT EXTRACTOR VIEW */}
              {activeTab === 'transformer' && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="border-l-4 border-emerald-accent pl-4">
                    <h2 className="text-xl font-bold text-white font-display">Transformer Equivalent Circuit Extractor (EEE 2207)</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Extracts core loss resistance, magnetizing inductance, series equivalent copper losses, and leakage reactances from test logs.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Inputs panel */}
                    <div className="lg:col-span-4 space-y-6">
                      
                      {/* OC Test inputs */}
                      <div className="bg-navy-dark p-5 rounded-2xl border border-navy-light space-y-3.5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-navy-light pb-2">
                          <Zap className="h-4 w-4 text-emerald-accent" /> Open Circuit (OC) Test
                        </h3>
                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="block text-slate-300 mb-1">OC Voltage (V_oc)</label>
                            <div className="relative">
                              <input
                                type="number"
                                value={transIn.voc}
                                onChange={(e) => setTransIn({ ...transIn, voc: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                              />
                              <span className="absolute right-3 top-2 text-[9px] text-slate-500">V</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-slate-300 mb-1">OC Current (I_oc)</label>
                            <div className="relative">
                              <input
                                type="number"
                                value={transIn.ioc}
                                step="0.01"
                                onChange={(e) => setTransIn({ ...transIn, ioc: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                              />
                              <span className="absolute right-3 top-2 text-[9px] text-slate-500">A</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-slate-300 mb-1">OC Power (P_oc)</label>
                            <div className="relative">
                              <input
                                type="number"
                                value={transIn.poc}
                                onChange={(e) => setTransIn({ ...transIn, poc: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                              />
                              <span className="absolute right-3 top-2 text-[9px] text-slate-500">W</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SC Test inputs */}
                      <div className="bg-navy-dark p-5 rounded-2xl border border-navy-light space-y-3.5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-navy-light pb-2">
                          <Zap className="h-4 w-4 text-indigo-400" /> Short Circuit (SC) Test
                        </h3>
                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="block text-slate-300 mb-1">SC Voltage (V_sc)</label>
                            <div className="relative">
                              <input
                                type="number"
                                value={transIn.vsc}
                                onChange={(e) => setTransIn({ ...transIn, vsc: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                              />
                              <span className="absolute right-3 top-2 text-[9px] text-slate-500">V</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-slate-300 mb-1">SC Current (I_sc)</label>
                            <div className="relative">
                              <input
                                type="number"
                                value={transIn.isc}
                                step="0.1"
                                onChange={(e) => setTransIn({ ...transIn, isc: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                              />
                              <span className="absolute right-3 top-2 text-[9px] text-slate-500">A</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-slate-300 mb-1">SC Power (P_sc)</label>
                            <div className="relative">
                              <input
                                type="number"
                                value={transIn.psc}
                                onChange={(e) => setTransIn({ ...transIn, psc: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                              />
                              <span className="absolute right-3 top-2 text-[9px] text-slate-500">W</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Schematic Representation & Results */}
                    <div className="lg:col-span-8 space-y-6">
                      <div className="flex justify-end mb-4">
                        <IEEEReportButton
                          experimentName="Electrical Machines: Transformer Equivalent Circuit"
                          inputData={{
                            'OC Voltage (Voc)': transIn.voc + ' V',
                            'OC Current (Ioc)': transIn.ioc + ' A',
                            'OC Power (Poc)': transIn.poc + ' W',
                            'SC Voltage (Vsc)': transIn.vsc + ' V',
                            'SC Current (Isc)': transIn.isc + ' A',
                            'SC Power (Psc)': transIn.psc + ' W'
                          }}
                          outputData={{
                            'Core Loss Resistance (Rc)': transOut.rc ? transOut.rc.toFixed(2) + ' Ω' : 'N/A',
                            'Magnetizing Reactance (Xm)': transOut.xm ? transOut.xm.toFixed(2) + ' Ω' : 'N/A',
                            'Equivalent Resistance (Req)': transOut.req ? transOut.req.toFixed(4) + ' Ω' : 'N/A',
                            'Equivalent Reactance (Xeq)': transOut.xeq ? transOut.xeq.toFixed(4) + ' Ω' : 'N/A'
                          }}
                          chartSelectors={['#transformer-chart']}
                        />
                      </div>
                      
                      {transOut.error ? (
                        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex gap-3 text-red-400">
                          <AlertTriangle className="h-5 w-5 shrink-0" />
                          <div className="text-xs">
                            <span className="font-bold block">Feasibility Violation</span>
                            <p>{transOut.error}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex gap-3 text-emerald-400">
                          <CheckCircle2 className="h-5 w-5 shrink-0" />
                          <div className="text-xs flex-1">
                            <span className="font-bold block">System Solved Successfully</span>
                            <p>No-load power factor ({(transOut.pfOC * 100).toFixed(1)}%) and series copper power factors ({(transOut.pfSC * 100).toFixed(1)}%) are mathematically stable.</p>
                          </div>
                        </div>
                      )}

                      {/* Interactive SVG Schematic of Equivalent Circuit */}
                      {!transOut.error && (
                        <div className="bg-navy-dark border border-navy-light p-6 rounded-2xl flex flex-col items-center" id="transformer-chart">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 self-start flex items-center gap-1.5">
                            <Layers className="h-4 w-4 text-emerald-accent" /> Equivalent Circuit Diagram
                          </h4>
                          
                          <svg viewBox="0 0 540 200" className="w-full max-w-lg h-auto text-slate-300">
                            {/* Main circuit wires */}
                            <path d="M 20 40 L 80 40" stroke="#1E293B" strokeWidth="2.5" fill="none" />
                            <path d="M 140 40 L 220 40" stroke="#1E293B" strokeWidth="2.5" fill="none" />
                            <path d="M 280 40 L 520 40" stroke="#1E293B" strokeWidth="2.5" fill="none" />
                            <path d="M 20 160 L 520 160" stroke="#1E293B" strokeWidth="2.5" fill="none" />

                            {/* Series Req (Resistor wave) */}
                            <path d="M 80 40 L 90 40 L 95 30 L 105 50 L 115 30 L 125 50 L 130 40 L 140 40" stroke="#EF4444" strokeWidth="2" fill="none" />
                            {/* Series Xeq (Inductor coils) */}
                            <path d="M 220 40 Q 225 30 230 40 Q 235 30 240 40 Q 245 30 250 40 Q 255 30 260 40 Q 265 30 270 40 L 280 40" stroke="#3B82F6" strokeWidth="2" fill="none" />

                            {/* Shunt Branch downward wires */}
                            <path d="M 180 40 L 180 70 M 180 130 L 180 160" stroke="#1E293B" strokeWidth="2" fill="none" />
                            <path d="M 180 70 L 140 70 L 140 80 M 140 120 L 140 130" stroke="#1E293B" strokeWidth="2" fill="none" />
                            <path d="M 180 70 L 220 70 L 220 80 M 220 120 L 220 130" stroke="#1E293B" strokeWidth="2" fill="none" />
                            <path d="M 140 130 L 220 130 L 180 130" stroke="#1E293B" strokeWidth="2" fill="none" />

                            {/* Shunt Rc (Resistor) */}
                            <path d="M 140 80 L 140 85 L 130 90 L 150 95 L 130 100 L 150 105 L 140 110 L 140 120" stroke="#EF4444" strokeWidth="2" fill="none" />
                            {/* Shunt Xm (Inductor) */}
                            <path d="M 220 80 Q 210 85 220 90 Q 210 95 220 100 Q 210 105 220 110 Q 210 115 220 120" stroke="#3B82F6" strokeWidth="2" fill="none" />

                            {/* Labels on diagram */}
                            <text x="110" y="24" fill="#EF4444" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                              Req: {transOut.req.toFixed(2)} Ω
                            </text>
                            <text x="250" y="24" fill="#3B82F6" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                              Xeq: {transOut.xeq.toFixed(2)} Ω
                            </text>
                            <text x="85" y="105" fill="#EF4444" fontSize="10" fontWeight="bold" fontFamily="monospace">
                              Rc: {transOut.rc.toFixed(1)} Ω
                            </text>
                            <text x="235" y="105" fill="#3B82F6" fontSize="10" fontWeight="bold" fontFamily="monospace">
                              Xm: {transOut.xm.toFixed(1)} Ω
                            </text>

                            <text x="350" y="95" fill="#64748B" fontSize="9" fontWeight="medium" fontStyle="italic">
                              Referred to Test Terminals
                            </text>

                            {/* Ideal Transformer Symbol (Parallel Coils) */}
                            <path d="M 440 60 Q 430 70 440 80 Q 430 90 440 100 Q 430 110 440 120 Q 430 130 440 140" stroke="#10B981" strokeWidth="2.5" fill="none" />
                            <path d="M 452 50 L 452 150 M 456 50 L 456 150" stroke="#64748B" strokeWidth="1.5" />
                            <path d="M 468 60 Q 478 70 468 80 Q 478 90 468 100 Q 478 110 468 120 Q 478 130 468 140" stroke="#10B981" strokeWidth="2.5" fill="none" />
                            <path d="M 400 40 L 440 40 M 400 160 L 440 160 M 468 40 L 510 40 M 468 160 L 510 160" stroke="#1E293B" strokeWidth="2" fill="none" />

                            <text x="454" y="30" fill="#10B981" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                              Ideal Ratio
                            </text>
                          </svg>
                        </div>
                      )}

                      {/* Display Outputs */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-navy-dark border border-navy-light p-4 rounded-xl space-y-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Core Loss R_c</span>
                          <span className="text-sm font-mono font-extrabold text-white block">
                            {transOut.rc ? `${transOut.rc.toFixed(1)} Ω` : '0 Ω'}
                          </span>
                        </div>

                        <div className="bg-navy-dark border border-navy-light p-4 rounded-xl space-y-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Magnetizing X_m</span>
                          <span className="text-sm font-mono font-extrabold text-emerald-accent block">
                            {transOut.xm ? `${transOut.xm.toFixed(1)} Ω` : '0 Ω'}
                          </span>
                        </div>

                        <div className="bg-navy-dark border border-navy-light p-4 rounded-xl space-y-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Equiv Series R_eq</span>
                          <span className="text-sm font-mono font-extrabold text-white block">
                            {transOut.req ? `${transOut.req.toFixed(2)} Ω` : '0 Ω'}
                          </span>
                        </div>

                        <div className="bg-navy-dark border border-navy-light p-4 rounded-xl space-y-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Equiv Series X_eq</span>
                          <span className="text-sm font-mono font-extrabold text-emerald-accent block">
                            {transOut.xeq ? `${transOut.xeq.toFixed(2)} Ω` : '0 Ω'}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* 3. AC BRIDGE SOLVER VIEW */}
              {activeTab === 'bridge' && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="border-l-4 border-emerald-accent pl-4">
                    <h2 className="text-xl font-bold text-white font-display">AC Bridge Measurement Solver (EEE 2211)</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Solves Maxwell-Wien or Schering bridge balance topologies to calculate unknown reactive components (L or C) and quality/dissipation margins.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Input Controls */}
                    <div className="lg:col-span-4 space-y-5 bg-navy-dark p-5 rounded-2xl border border-navy-light">
                      <div className="flex justify-between items-center border-b border-navy-light pb-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Sliders className="h-4 w-4 text-emerald-accent" /> Bridge Inputs
                        </h3>
                        <select
                          value={bridgeIn.bridgeType}
                          onChange={(e) => setBridgeIn({ ...bridgeIn, bridgeType: e.target.value as BridgeType })}
                          className="bg-navy-card border border-navy-light text-slate-300 text-[10px] font-bold rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-accent"
                        >
                          <option value="maxwell">Maxwell (L)</option>
                          <option value="schering">Schering (C)</option>
                        </select>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">Operating Frequency</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={bridgeIn.frequency}
                              onChange={(e) => setBridgeIn({ ...bridgeIn, frequency: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                            />
                            <span className="absolute right-3 top-2 text-[9px] text-slate-500 font-mono">Hz</span>
                          </div>
                        </div>

                        {bridgeIn.bridgeType === 'maxwell' ? (
                          <>
                            {/* Maxwell Specific Inputs */}
                            <div>
                              <label className="block font-semibold text-slate-300 mb-1">Parallel Resistor (R1)</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={bridgeIn.maxwellR1}
                                  onChange={(e) => setBridgeIn({ ...bridgeIn, maxwellR1: parseFloat(e.target.value) || 0 })}
                                  className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                                />
                                <span className="absolute right-3 top-2 text-[9px] text-slate-500 font-mono">Ω</span>
                              </div>
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-300 mb-1">Arm 2 Resistor (R2)</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={bridgeIn.maxwellR2}
                                  onChange={(e) => setBridgeIn({ ...bridgeIn, maxwellR2: parseFloat(e.target.value) || 0 })}
                                  className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                                />
                                <span className="absolute right-3 top-2 text-[9px] text-slate-500 font-mono">Ω</span>
                              </div>
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-300 mb-1">Arm 3 Resistor (R3)</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={bridgeIn.maxwellR3}
                                  onChange={(e) => setBridgeIn({ ...bridgeIn, maxwellR3: parseFloat(e.target.value) || 0 })}
                                  className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                                />
                                <span className="absolute right-3 top-2 text-[9px] text-slate-500 font-mono">Ω</span>
                              </div>
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-300 mb-1">Parallel Capacitor (C1)</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={bridgeIn.maxwellC1}
                                  onChange={(e) => setBridgeIn({ ...bridgeIn, maxwellC1: parseFloat(e.target.value) || 0 })}
                                  className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                                />
                                <span className="absolute right-3 top-2 text-[9px] text-slate-500 font-mono">μF</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Schering Specific Inputs */}
                            <div>
                              <label className="block font-semibold text-slate-300 mb-1">Standard Capacitor (C2)</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.001"
                                  value={bridgeIn.scheringC2}
                                  onChange={(e) => setBridgeIn({ ...bridgeIn, scheringC2: parseFloat(e.target.value) || 0 })}
                                  className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                                />
                                <span className="absolute right-3 top-2 text-[9px] text-slate-500 font-mono">μF</span>
                              </div>
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-300 mb-1">Arm 3 Resistor (R3)</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={bridgeIn.scheringR3}
                                  onChange={(e) => setBridgeIn({ ...bridgeIn, scheringR3: parseFloat(e.target.value) || 0 })}
                                  className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                                />
                                <span className="absolute right-3 top-2 text-[9px] text-slate-500 font-mono">Ω</span>
                              </div>
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-300 mb-1">Arm 4 Parallel Resistor (R4)</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={bridgeIn.scheringR4}
                                  onChange={(e) => setBridgeIn({ ...bridgeIn, scheringR4: parseFloat(e.target.value) || 0 })}
                                  className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                                />
                                <span className="absolute right-3 top-2 text-[9px] text-slate-500 font-mono">Ω</span>
                              </div>
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-300 mb-1">Arm 4 Parallel Capacitor (C4)</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={bridgeIn.scheringC4}
                                  onChange={(e) => setBridgeIn({ ...bridgeIn, scheringC4: parseFloat(e.target.value) || 0 })}
                                  className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                                />
                                <span className="absolute right-3 top-2 text-[9px] text-slate-500 font-mono">μF</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Results / Diagrams */}
                    <div className="lg:col-span-8 space-y-6">
                      <div className="flex justify-end mb-4">
                        <IEEEReportButton
                          experimentName={`Electrical Measurements: ${bridgeIn.bridgeType === 'maxwell' ? 'Maxwell' : 'Schering'} Bridge`}
                          inputData={{
                            'Bridge Type': bridgeIn.bridgeType === 'maxwell' ? 'Maxwell' : 'Schering',
                            'Frequency (Hz)': bridgeIn.frequency,
                            ...(bridgeIn.bridgeType === 'maxwell' ? {
                              'R1 (Ω)': bridgeIn.maxwellR1,
                              'R2 (Ω)': bridgeIn.maxwellR2,
                              'R3 (Ω)': bridgeIn.maxwellR3,
                              'C1 (μF)': bridgeIn.maxwellC1
                            } : {
                              'C2 (μF)': bridgeIn.scheringC2,
                              'R3 (Ω)': bridgeIn.scheringR3,
                              'R4 (Ω)': bridgeIn.scheringR4,
                              'C4 (μF)': bridgeIn.scheringC4
                            })
                          }}
                          outputData={
                            bridgeIn.bridgeType === 'maxwell' ? {
                              'Unknown Inductance (Lx)': bridgeOut.lx ? (bridgeOut.lx * 1000).toFixed(4) + ' mH' : 'N/A',
                              'Unknown Resistance (Rx)': bridgeOut.rxMaxwell ? bridgeOut.rxMaxwell.toFixed(2) + ' Ω' : 'N/A',
                              'Quality Factor (Q)': bridgeOut.qFactor ? bridgeOut.qFactor.toFixed(3) : 'N/A'
                            } : {
                              'Unknown Capacitance (Cx)': bridgeOut.cx ? bridgeOut.cx.toFixed(4) + ' μF' : 'N/A',
                              'Unknown Resistance (Rx)': bridgeOut.rxSchering ? bridgeOut.rxSchering.toFixed(2) + ' Ω' : 'N/A',
                              'Dissipation Factor (D)': bridgeOut.dissipationFactor ? bridgeOut.dissipationFactor.toFixed(3) : 'N/A'
                            }
                          }
                          chartSelectors={['#bridge-chart']}
                        />
                      </div>
                      
                      {bridgeOut.error ? (
                        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex gap-3 text-red-400">
                          <AlertTriangle className="h-5 w-5 shrink-0" />
                          <div className="text-xs">
                            <span className="font-bold block">Calculation Offset</span>
                            <p>{bridgeOut.error}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex gap-3 text-emerald-400">
                          <CheckCircle2 className="h-5 w-5 shrink-0" />
                          <div className="text-xs flex-1">
                            <span className="font-bold block">AC Bridge Balanced</span>
                            <p>Phasor ratios balanced. Detector voltage nullified at exactly {bridgeIn.frequency} Hz.</p>
                          </div>
                        </div>
                      )}

                      {/* Bridge Schematic representation */}
                      {!bridgeOut.error && (
                        <div className="bg-navy-dark border border-navy-light p-6 rounded-2xl flex flex-col items-center" id="bridge-chart">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 self-start flex items-center gap-1.5">
                            <Layers className="h-4 w-4 text-emerald-accent" /> {bridgeIn.bridgeType === 'maxwell' ? 'Maxwell Inductance-Capacitance' : 'Schering Capacitance'} Bridge Schematic
                          </h4>

                          <svg viewBox="0 0 400 240" className="w-full max-w-sm h-auto text-slate-300">
                            {/* Outer Bridge Diamond wires */}
                            <path d="M 200 20 L 100 110 L 200 200 L 300 110 Z" stroke="#1E293B" strokeWidth="2" fill="none" />
                            
                            {/* Detector (D) in center */}
                            <circle cx="200" cy="110" r="16" fill="#131A2C" stroke="#10B981" strokeWidth="2" />
                            <text x="200" y="114" fill="#10B981" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">D</text>
                            
                            {/* Detector horizontal wires */}
                            <line x1="100" y1="110" x2="184" y2="110" stroke="#1E293B" strokeWidth="1.5" />
                            <line x1="216" y1="110" x2="300" y2="110" stroke="#1E293B" strokeWidth="1.5" />

                            {/* Node markers */}
                            <circle cx="200" cy="20" r="4" fill="#64748B" />
                            <circle cx="200" cy="200" r="4" fill="#64748B" />
                            <circle cx="100" cy="110" r="4" fill="#64748B" />
                            <circle cx="300" cy="110" r="4" fill="#64748B" />

                            {/* Node labels */}
                            <text x="200" y="12" fill="#64748B" fontSize="9" textAnchor="middle">A</text>
                            <text x="88" y="113" fill="#64748B" fontSize="9" textAnchor="middle">B</text>
                            <text x="312" y="113" fill="#64748B" fontSize="9" textAnchor="middle">C</text>
                            <text x="200" y="212" fill="#64748B" fontSize="9" textAnchor="middle">D</text>

                            {/* Labels on four arms */}
                            {bridgeIn.bridgeType === 'maxwell' ? (
                              <>
                                {/* Arm AB: R1 || C1 */}
                                <rect x="110" y="35" width="45" height="18" fill="#131A2C" stroke="#EF4444" strokeWidth="1.5" rx="3" />
                                <text x="132.5" y="47" fill="#EF4444" fontSize="8" textAnchor="middle" fontFamily="monospace">R1 || C1</text>
                                
                                {/* Arm BC: R3 */}
                                <rect x="110" y="145" width="40" height="15" fill="#131A2C" stroke="#3B82F6" strokeWidth="1.5" rx="3" />
                                <text x="130" y="156" fill="#3B82F6" fontSize="8" textAnchor="middle" fontFamily="monospace">R3</text>

                                {/* Arm AD: R2 */}
                                <rect x="250" y="35" width="40" height="15" fill="#131A2C" stroke="#3B82F6" strokeWidth="1.5" rx="3" />
                                <text x="270" y="46" fill="#3B82F6" fontSize="8" textAnchor="middle" fontFamily="monospace">R2</text>

                                {/* Arm DC: Lx + Rx */}
                                <rect x="240" y="145" width="55" height="18" fill="#131A2C" stroke="#10B981" strokeWidth="1.5" rx="3" />
                                <text x="267.5" y="157" fill="#10B981" fontSize="8" textAnchor="middle" fontFamily="monospace">Lx + Rx</text>
                              </>
                            ) : (
                              <>
                                {/* Arm AB: Cx + Rx */}
                                <rect x="110" y="35" width="55" height="18" fill="#131A2C" stroke="#10B981" strokeWidth="1.5" rx="3" />
                                <text x="137.5" y="47" fill="#10B981" fontSize="8" textAnchor="middle" fontFamily="monospace">Cx + Rx</text>

                                {/* Arm BC: R3 */}
                                <rect x="110" y="145" width="40" height="15" fill="#131A2C" stroke="#3B82F6" strokeWidth="1.5" rx="3" />
                                <text x="130" y="156" fill="#3B82F6" fontSize="8" textAnchor="middle" fontFamily="monospace">R3</text>

                                {/* Arm AD: C2 (Standard) */}
                                <rect x="250" y="35" width="40" height="15" fill="#131A2C" stroke="#EF4444" strokeWidth="1.5" rx="3" />
                                <text x="270" y="46" fill="#EF4444" fontSize="8" textAnchor="middle" fontFamily="monospace">C2</text>

                                {/* Arm DC: R4 || C4 */}
                                <rect x="240" y="145" width="50" height="18" fill="#131A2C" stroke="#3B82F6" strokeWidth="1.5" rx="3" />
                                <text x="265" y="157" fill="#3B82F6" fontSize="8" textAnchor="middle" fontFamily="monospace">R4 || C4</text>
                              </>
                            )}
                          </svg>
                        </div>
                      )}

                      {/* Display Outputs */}
                      {bridgeIn.bridgeType === 'maxwell' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-navy-dark border border-navy-light p-4 rounded-xl space-y-1">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Unknown Inductance (Lx)</span>
                            <span className="text-base font-mono font-extrabold text-emerald-accent block">
                              {bridgeOut.lx ? `${(bridgeOut.lx * 1000).toFixed(2)} mH` : '0 mH'}
                            </span>
                            <span className="text-[9px] text-slate-400 block mt-1">({bridgeOut.lx?.toFixed(4)} Henries)</span>
                          </div>

                          <div className="bg-navy-dark border border-navy-light p-4 rounded-xl space-y-1">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Internal resistance (Rx)</span>
                            <span className="text-base font-mono font-extrabold text-white block">
                              {bridgeOut.rxMaxwell ? `${bridgeOut.rxMaxwell.toFixed(2)} Ω` : '0 Ω'}
                            </span>
                          </div>

                          <div className="bg-navy-dark border border-navy-light p-4 rounded-xl space-y-1">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Quality Factor (Q)</span>
                            <span className="text-base font-mono font-extrabold text-emerald-accent block">
                              {bridgeOut.qFactor?.toFixed(3)}
                            </span>
                            <span className="text-[9px] text-slate-400 block mt-1">
                              {bridgeOut.qFactor && bridgeOut.qFactor > 10 ? 'High-Q Inductor (>10)' : 'Medium/Low-Q Inductor'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-navy-dark border border-navy-light p-4 rounded-xl space-y-1">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Unknown Capacitance (Cx)</span>
                            <span className="text-base font-mono font-extrabold text-emerald-accent block">
                              {bridgeOut.cx?.toFixed(4)} <span className="text-[10px] text-slate-400">μF</span>
                            </span>
                            <span className="text-[9px] text-slate-400 block mt-1">({(bridgeOut.cx ? bridgeOut.cx * 1000 : 0).toFixed(1)} nF)</span>
                          </div>

                          <div className="bg-navy-dark border border-navy-light p-4 rounded-xl space-y-1">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Series resistance (Rx)</span>
                            <span className="text-base font-mono font-extrabold text-white block">
                              {bridgeOut.rxSchering?.toFixed(2)} <span className="text-[10px] text-slate-400">Ω</span>
                            </span>
                          </div>

                          <div className="bg-navy-dark border border-navy-light p-4 rounded-xl space-y-1">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Dissipation Factor (D)</span>
                            <span className="text-base font-mono font-extrabold text-emerald-accent block">
                              {bridgeOut.dissipationFactor?.toFixed(5)}
                            </span>
                            <span className="text-[9px] text-slate-400 block mt-1">
                              {bridgeOut.dissipationFactor && bridgeOut.dissipationFactor < 0.05 ? 'High quality capacitor' : 'Lossy capacitor'}
                            </span>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              )}

              {/* 4. VLSI CMOS POWER ESTIMATOR VIEW */}
              {activeTab === 'vlsi' && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="border-l-4 border-emerald-accent pl-4">
                    <h2 className="text-xl font-bold text-white font-display">VLSI CMOS Power Estimator (EEE 2213)</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Estimates the dynamic capacitive charging power dissipation versus sub-threshold/junction static leakage power in silicon digital gates.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Inputs panel */}
                    <div className="lg:col-span-4 space-y-5 bg-navy-dark p-5 rounded-2xl border border-navy-light">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-navy-light pb-2">
                        <Sliders className="h-4 w-4 text-emerald-accent" /> CMOS Parameters
                      </h3>

                      <div className="space-y-4 text-xs">
                        <div>
                          <label className="block font-semibold text-slate-300 mb-1.5">
                            Supply Voltage (V_dd)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.05"
                              min="0"
                              value={vlsiIn.vdd}
                              onChange={(e) => setVlsiIn({ ...vlsiIn, vdd: Math.max(0, parseFloat(e.target.value) || 0) })}
                              className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                            />
                            <span className="absolute right-3 top-2 text-[9px] text-slate-500">V</span>
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-300 mb-1.5">
                            Clock Frequency (f)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              value={vlsiIn.frequency}
                              onChange={(e) => setVlsiIn({ ...vlsiIn, frequency: Math.max(0, parseFloat(e.target.value) || 0) })}
                              className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                            />
                            <span className="absolute right-3 top-2 text-[9px] text-slate-500 font-mono">MHz</span>
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-300 mb-1.5">
                            Average Load Capacitance (C)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={vlsiIn.capacitance}
                              onChange={(e) => setVlsiIn({ ...vlsiIn, capacitance: Math.max(0, parseFloat(e.target.value) || 0) })}
                              className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                            />
                            <span className="absolute right-3 top-2 text-[9px] text-slate-500 font-mono">pF</span>
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-300 mb-1.5">
                            Sub-threshold Leakage Current (I_leak)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={vlsiIn.ileak}
                              onChange={(e) => setVlsiIn({ ...vlsiIn, ileak: Math.max(0, parseFloat(e.target.value) || 0) })}
                              className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                            />
                            <span className="absolute right-3 top-2 text-[9px] text-slate-500 font-mono">μA</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pie Chart / Results */}
                    <div className="lg:col-span-8 space-y-6">
                      <div className="flex justify-end mb-4">
                        <IEEEReportButton
                          experimentName="VLSI Design: CMOS Power Estimation"
                          inputData={{
                            'Supply Voltage (Vdd)': vlsiIn.vdd + ' V',
                            'Clock Frequency (f)': vlsiIn.frequency + ' MHz',
                            'Load Capacitance (Cload)': vlsiIn.capacitance + ' pF',
                            'Leakage Current (I_leak)': vlsiIn.ileak + ' nA'
                          }}
                          outputData={{
                            'Total Power': vlsiOut.pTotal.toFixed(2) + ' μW',
                            'Dynamic Power': vlsiOut.pDynamic.toFixed(2) + ' μW',
                            'Static Power': vlsiOut.pStatic.toFixed(2) + ' μW'
                          }}
                          chartSelectors={['#vlsi-chart']}
                        />
                      </div>
                      
                      {vlsiOut.error ? (
                        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex gap-3 text-red-400">
                          <AlertTriangle className="h-5 w-5 shrink-0" />
                          <div className="text-xs">
                            <span className="font-bold block">Feasibility Error</span>
                            <p>{vlsiOut.error}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex gap-3 text-emerald-400">
                          <CheckCircle2 className="h-5 w-5 shrink-0" />
                          <div className="text-xs flex-1">
                            <span className="font-bold block">Power Profile Synthesized</span>
                            <p>Quadratic dependency of supply voltage on Dynamic Power analyzed correctly.</p>
                          </div>
                        </div>
                      )}

                      {/* Pie chart representing breakdown of power */}
                      {!vlsiOut.error && vlsiOut.pTotal > 0 && (
                        <div className="bg-navy-dark border border-navy-light p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between" id="vlsi-chart">
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Flame className="h-4 w-4 text-emerald-accent" /> CMOS Power Dissipation Ratio
                            </h4>
                            <div className="space-y-1.5 text-xs text-slate-300">
                              <div className="flex items-center gap-2">
                                <span className="h-3 w-3 bg-[#10B981] rounded-full inline-block" />
                                <span>Dynamic Power: <strong className="text-white font-mono">{vlsiOut.pDynamic.toFixed(1)} μW</strong> ({vlsiOut.dynamicPercentage.toFixed(1)}%)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="h-3 w-3 bg-[#3B82F6] rounded-full inline-block" />
                                <span>Static Leakage: <strong className="text-white font-mono">{vlsiOut.pStatic.toFixed(1)} μW</strong> ({vlsiOut.staticPercentage.toFixed(1)}%)</span>
                              </div>
                            </div>
                          </div>

                          <div className="h-40 w-40 text-xs shrink-0 mt-4 md:mt-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={vlsiPieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={50}
                                  outerRadius={70}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {vlsiPieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <RechartsTooltip formatter={(value) => [`${value} μW`]} contentStyle={{ backgroundColor: '#131A2C', borderColor: '#1E293B', color: '#F8FAFC' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {/* Power Metrics display */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-navy-dark border border-navy-light p-4 rounded-xl space-y-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Dynamic Power (P_dynamic)</span>
                          <span className="text-base font-mono font-extrabold text-white block">
                            {vlsiOut.pDynamic.toFixed(2)} <span className="text-[10px] text-slate-400">μW</span>
                          </span>
                          <span className="text-[9px] text-slate-400 block mt-1">Capacitive switching load.</span>
                        </div>

                        <div className="bg-navy-dark border border-navy-light p-4 rounded-xl space-y-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Static Power (P_static)</span>
                          <span className="text-base font-mono font-extrabold text-emerald-accent block">
                            {vlsiOut.pStatic.toFixed(2)} <span className="text-[10px] text-slate-400">μW</span>
                          </span>
                          <span className="text-[9px] text-slate-400 block mt-1">Leakage subthreshold current.</span>
                        </div>

                        <div className="bg-navy-dark border border-navy-light p-4 rounded-xl space-y-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Total Power Dissipated</span>
                          <span className="text-base font-mono font-extrabold text-white block">
                            {vlsiOut.pTotal.toFixed(2)} <span className="text-[10px] text-slate-400">μW</span>
                          </span>
                          <span className="text-[9px] text-slate-400 block mt-1">Combined thermal dissipation.</span>
                        </div>
                      </div>

                    </div>
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
