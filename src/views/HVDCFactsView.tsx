import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Zap,
  Sliders,
  Activity,
  TrendingUp,
  Settings,
  HelpCircle,
  Shield,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
  Legend,
  AreaChart,
  Area
} from 'recharts';

import { useVoltageProfile } from '../hooks/useVoltageProfile';
import { useHVDCConverter } from '../hooks/useHVDCConverter';
import { useBreakevenAnalysis } from '../hooks/useBreakevenAnalysis';

export default function HVDCFactsView() {
  const [activeTab, setActiveTab] = useState<'facts' | 'hvdc' | 'breakeven'>('facts');

  // ==========================================
  // TAB 1: FACTS MID-POINT VOLTAGE PROFILE
  // ==========================================
  const {
    inputs: profileInputs,
    setInputs: setProfileInputs,
    profileData,
  } = useVoltageProfile({
    length: 500,
    silMultiplier: 1.5,
    statcomEnabled: true,
    qInjection: 150,
  });

  // Calculate midpoint uncompensated & compensated values for stats cards
  const midPointStats = React.useMemo(() => {
    const midIndex = Math.floor(profileData.length / 2);
    const midPoint = profileData[midIndex] || { uncompensated: 1.0, compensated: 1.0 };
    const improvement = (midPoint.compensated - midPoint.uncompensated);
    return {
      uncomp: midPoint.uncompensated,
      comp: midPoint.compensated,
      diff: parseFloat(improvement.toFixed(3)),
    };
  }, [profileData]);

  // ==========================================
  // TAB 2: 12-PULSE HVDC CONVERTER & HARMONICS
  // ==========================================
  const {
    inputs: hvdcInputs,
    setInputs: setHvdcInputs,
    stats: hvdcStats,
    waveformData: hvdcWaveform,
    harmonicsData: hvdcHarmonics,
  } = useHVDCConverter({
    acVoltage: 230, // kV RMS L-L
    frequency: 50,  // Hz
    alpha: 15,      // degrees
    mu: 8,          // degrees
  });

  // ==========================================
  // TAB 3: HVAC VS HVDC BREAKEVEN ECONOMICS
  // ==========================================
  const {
    inputs: breakevenInputs,
    setInputs: setBreakevenInputs,
    stats: breakevenStats,
    costPlotData: breakevenPlot,
  } = useBreakevenAnalysis({
    hvacTerminalCost: 120, // M$ (Substations)
    hvacLineCost: 2.2,     // M$ per km
    hvdcTerminalCost: 440, // M$ (Converter Stations)
    hvdcLineCost: 1.1,     // M$ per km
  });

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 pb-12 font-sans selection:bg-emerald-500/30 selection:text-white">
      {/* Breadcrumbs */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO DEPT CATALOG
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6 space-y-8">
        
        {/* Header Banner */}
        <div className="relative rounded-2xl border border-blue-500/20 bg-blue-950/10 p-6 md:p-8 overflow-hidden">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-blue-500/5 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-emerald-500/5 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase mb-2">
                <Zap className="h-4 w-4 animate-pulse" /> EEE 4243 High Voltage Transmission & FACTS Suite
              </div>
              <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
                HV Transmission & <span className="text-emerald-400">Grid Optimization</span>
              </h1>
              <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed font-sans">
                Analyze active power grid flow dynamics. Mathematically model reactive power mid-point compensation (STATCOM/SVC), investigate harmonic cancellation in 12-pulse HVDC thyristor bridges, and plot the capital cost trade-offs of HVAC vs. HVDC backhaul lines.
              </p>
            </div>
            
            <div className="bg-[#111827]/80 border border-slate-800 px-4 py-3 rounded-xl flex items-center gap-3 shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Layers className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-500 tracking-wider uppercase">LAB STATUS</div>
                <div className="text-xs font-mono font-bold text-emerald-400">HV SOLVER ENGINE ENGAGED</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-1 border-b border-slate-800 pb-px">
          <button
            onClick={() => setActiveTab('facts')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'facts'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
            }`}
          >
            <Activity className="h-4 w-4" />
            1. FACTS Voltage Profiler
          </button>
          <button
            onClick={() => setActiveTab('hvdc')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'hvdc'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
            }`}
          >
            <Sliders className="h-4 w-4" />
            2. 12-Pulse HVDC & Harmonics
          </button>
          <button
            onClick={() => setActiveTab('breakeven')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'breakeven'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            3. HVAC vs HVDC Breakeven Economics
          </button>
        </div>

        {/* Tab Contents */}
        <div className="space-y-6">
          {/* ========================================== */}
          {/* TAB 1: FACTS MID-POINT VOLTAGE COMPENSATOR */}
          {/* ========================================== */}
          {activeTab === 'facts' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Inputs Card */}
              <div className="lg:col-span-4 bg-[#111827] border border-slate-800 p-6 rounded-2xl space-y-6">
                <div>
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Sliders className="h-4.5 w-4.5 text-emerald-400" />
                    Transmission Parameters
                  </h3>
                </div>

                <div className="space-y-6 font-mono text-xs">
                  {/* Line Length */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase font-bold">Line Length (L)</span>
                      <span className="text-emerald-400 font-bold">{profileInputs.length} km</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="1000"
                      step="50"
                      value={profileInputs.length}
                      onChange={e => setProfileInputs(prev => ({ ...prev, length: parseInt(e.target.value) }))}
                      className="w-full accent-emerald-400 bg-slate-800 rounded-lg appearance-none h-1.5"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Determines physical wave propagation & voltage sag depth.
                    </span>
                  </div>

                  {/* SIL Multiplier */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase font-bold">Line Loading (SIL)</span>
                      <span className="text-emerald-400 font-bold">{profileInputs.silMultiplier}x SIL</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="2.5"
                      step="0.1"
                      value={profileInputs.silMultiplier}
                      onChange={e => setProfileInputs(prev => ({ ...prev, silMultiplier: parseFloat(e.target.value) }))}
                      className="w-full accent-emerald-400 bg-slate-800 rounded-lg appearance-none h-1.5"
                    />
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">&lt;1.0x (Light load)</span>
                      <span className="text-slate-500">&gt;1.0x (Heavy load)</span>
                    </div>
                  </div>

                  {/* Mid-point Compensation Switch */}
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 uppercase font-bold">Mid-point STATCOM / SVC</span>
                      <button
                        onClick={() => setProfileInputs(prev => ({ ...prev, statcomEnabled: !prev.statcomEnabled }))}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                          profileInputs.statcomEnabled
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {profileInputs.statcomEnabled ? 'ON / ACTIVE' : 'OFF / BYPASSED'}
                      </button>
                    </div>

                    {profileInputs.statcomEnabled && (
                      <div className="space-y-2 pt-2 animate-fadeIn">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Reactive Injection (Q)</span>
                          <span className="text-emerald-400 font-bold">{profileInputs.qInjection} MVAR</span>
                        </div>
                        <input
                          type="range"
                          min="-100"
                          max="400"
                          step="10"
                          value={profileInputs.qInjection}
                          onChange={e => setProfileInputs(prev => ({ ...prev, qInjection: parseInt(e.target.value) }))}
                          className="w-full accent-emerald-400 bg-slate-800 rounded-lg appearance-none h-1.5"
                        />
                        <div className="flex justify-between text-[9px] text-slate-500">
                          <span>Absorbing Q (Inductive)</span>
                          <span>Injecting Q (Capacitive)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Visualizer and Analytics Panel */}
              <div className="lg:col-span-8 space-y-6">
                {/* Stats Readout Header */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl font-mono">
                    <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Uncompensated Midpoint</div>
                    <div className="text-xl font-black text-slate-300">{midPointStats.uncomp.toFixed(3)} p.u.</div>
                    <span className="text-[9px] text-slate-500">Normal operating range: 0.95 - 1.05</span>
                  </div>

                  <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl font-mono">
                    <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Compensated Midpoint</div>
                    <div className={`text-xl font-black ${midPointStats.comp < 0.95 || midPointStats.comp > 1.05 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {midPointStats.comp.toFixed(3)} p.u.
                    </div>
                    <span className="text-[9px] text-slate-500">STATCOM stabilizes midpoint voltage</span>
                  </div>

                  <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl font-mono">
                    <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Voltage Profile Delta</div>
                    <div className="text-xl font-black text-blue-400">
                      {midPointStats.diff >= 0 ? `+${midPointStats.diff}` : midPointStats.diff} p.u.
                    </div>
                    <span className="text-[9px] text-slate-500">Mid-point enhancement boost</span>
                  </div>
                </div>

                {/* Voltage Profile Area / Line Chart */}
                <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                      <Activity className="h-4 w-4 text-emerald-400" />
                      Transmission Line Voltage Profile (V vs Distance)
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500">
                      L = {profileInputs.length} km | Symmetrical V_S = V_R = 1.0 p.u.
                    </span>
                  </div>

                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={profileData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="voltageImprovement" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis
                          dataKey="distance"
                          stroke="#4b5563"
                          style={{ fontSize: '10px', fontFamily: 'monospace' }}
                          label={{ value: 'Distance along Transmission Line (km)', position: 'bottom', offset: -10, fill: '#6b7280', fontSize: 10 }}
                        />
                        <YAxis
                          stroke="#4b5563"
                          domain={[0.8, 1.2]}
                          style={{ fontSize: '10px', fontFamily: 'monospace' }}
                          tickCount={9}
                          label={{ value: 'Voltage (p.u.)', angle: -90, position: 'insideLeft', offset: 10, fill: '#6b7280', fontSize: 10 }}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }} />
                        
                        {/* Shaded Area for Improvement */}
                        {profileInputs.statcomEnabled && (
                          <Area
                            type="monotone"
                            dataKey="maxVal"
                            stroke="transparent"
                            fill="url(#voltageImprovement)"
                            name="STATCOM Boost Region"
                            activeDot={false}
                          />
                        )}

                        <Line
                          type="monotone"
                          dataKey="uncompensated"
                          stroke="#6b7280"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={false}
                          name="Uncompensated Profile"
                        />
                        
                        <Line
                          type="monotone"
                          dataKey="compensated"
                          stroke="#10b981"
                          strokeWidth={3}
                          dot={false}
                          name="Compensated Profile"
                        />

                        {/* Mid-point Reference line */}
                        <ReferenceLine x={profileInputs.length / 2} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'STATCOM Mid-point', fill: '#60a5fa', fontSize: 9, position: 'top' }} />
                        
                        {/* Upper and Lower Nominal Limits */}
                        <ReferenceLine y={1.05} stroke="#ef4444" strokeDasharray="2 2" strokeOpacity={0.5} label={{ value: 'Overvoltage Limit (1.05 p.u.)', fill: '#f87171', fontSize: 8, position: 'right' }} />
                        <ReferenceLine y={0.95} stroke="#ef4444" strokeDasharray="2 2" strokeOpacity={0.5} label={{ value: 'Undervoltage Limit (0.95 p.u.)', fill: '#f87171', fontSize: 8, position: 'right' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Physics Explainer Card */}
                  <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-xs space-y-2 leading-relaxed">
                    <div className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                      <HelpCircle className="h-3.5 w-3.5" />
                      How FACTS Mid-point Compensation Works:
                    </div>
                    <p className="text-slate-400">
                      In a long transmission line, heavy load conditions (S.I.L. ratio &gt; 1.0) draw high amounts of inductive reactive power, causing a deep voltage sag at the midpoint. Placing a STATCOM or SVC (Static Var Compensator) at the midpoint injects capacitive reactive power (Q &gt; 0 MVAR), raising the local voltage. By forcing the midpoint voltage back to 1.0 p.u., the transmission line is split into two virtual halves, effectively doubling the maximum power transfer capability (P_max = 2 * V² / X).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 2: 12-PULSE HVDC & HARMONICS */}
          {/* ========================================== */}
          {activeTab === 'hvdc' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Inputs Column */}
              <div className="lg:col-span-4 bg-[#111827] border border-slate-800 p-6 rounded-2xl space-y-6">
                <div>
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Sliders className="h-4.5 w-4.5 text-emerald-400" />
                    Thyristor Bridge Config
                  </h3>
                </div>

                <div className="space-y-6 font-mono text-xs">
                  {/* AC Line Voltage */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase font-bold">AC Input Voltage</span>
                      <span className="text-emerald-400 font-bold">{hvdcInputs.acVoltage} kV RMS</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="500"
                      step="10"
                      value={hvdcInputs.acVoltage}
                      onChange={e => setHvdcInputs(prev => ({ ...prev, acVoltage: parseInt(e.target.value) }))}
                      className="w-full accent-emerald-400 bg-slate-800 rounded-lg appearance-none h-1.5"
                    />
                  </div>

                  {/* Frequency Toggle */}
                  <div className="space-y-2">
                    <label className="text-slate-400 uppercase font-bold block">Grid Frequency</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setHvdcInputs(prev => ({ ...prev, frequency: 50 }))}
                        className={`py-1.5 rounded-lg border text-center font-bold ${
                          hvdcInputs.frequency === 50
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        50 Hz (EU/Asia)
                      </button>
                      <button
                        onClick={() => setHvdcInputs(prev => ({ ...prev, frequency: 60 }))}
                        className={`py-1.5 rounded-lg border text-center font-bold ${
                          hvdcInputs.frequency === 60
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        60 Hz (US)
                      </button>
                    </div>
                  </div>

                  {/* Firing Angle (Alpha) */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase font-bold">Firing Angle (α)</span>
                      <span className="text-emerald-400 font-bold">{hvdcInputs.alpha}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="150"
                      step="5"
                      value={hvdcInputs.alpha}
                      onChange={e => setHvdcInputs(prev => ({ ...prev, alpha: parseInt(e.target.value) }))}
                      className="w-full accent-emerald-400 bg-slate-800 rounded-lg appearance-none h-1.5"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>Rectifier (0° to 90°)</span>
                      <span>Inverter (90° to 150°)</span>
                    </div>
                  </div>

                  {/* Overlap Angle (Mu) */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase font-bold">Overlap Angle (μ)</span>
                      <span className="text-emerald-400 font-bold">{hvdcInputs.mu}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="25"
                      step="1"
                      value={hvdcInputs.mu}
                      onChange={e => setHvdcInputs(prev => ({ ...prev, mu: parseInt(e.target.value) }))}
                      className="w-full accent-emerald-400 bg-slate-800 rounded-lg appearance-none h-1.5"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Represents thyristor commutation delay due to transformer leakage inductance.
                    </span>
                  </div>
                </div>
              </div>

              {/* Visualizer and Graphs Column */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Stats Readout Header */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl font-mono">
                    <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Theoretical Max V_do</div>
                    <div className="text-xl font-black text-slate-300">{hvdcStats.vDo} kV</div>
                    <span className="text-[9px] text-slate-500">No-load series DC Voltage</span>
                  </div>

                  <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl font-mono">
                    <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Calculated Average V_dc</div>
                    <div className="text-xl font-black text-emerald-400">{hvdcStats.vDc} kV</div>
                    <span className="text-[9px] text-slate-500">Reduced by α & commutation μ</span>
                  </div>

                  <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl font-mono">
                    <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Waveform Peak Ripple</div>
                    <div className="text-xs space-y-1 mt-1 font-semibold">
                      <div className="text-slate-400">12-Pulse: <span className="text-emerald-400">~{hvdcStats.ripple12PulsePercent}%</span></div>
                      <div className="text-slate-500">6-Pulse Ref: <span className="text-rose-400">~{hvdcStats.ripple6PulsePercent}%</span></div>
                    </div>
                  </div>
                </div>

                {/* Waveform Line Chart */}
                <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl space-y-4">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-400" />
                    DC Output Time Domain Waveform Comparison (1 AC Cycle)
                  </h4>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={hvdcWaveform} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis
                          dataKey="time"
                          stroke="#4b5563"
                          style={{ fontSize: '10px', fontFamily: 'monospace' }}
                          label={{ value: 'Time (ms)', position: 'bottom', offset: -5, fill: '#6b7280', fontSize: 10 }}
                        />
                        <YAxis
                          stroke="#4b5563"
                          style={{ fontSize: '10px', fontFamily: 'monospace' }}
                          label={{ value: 'Voltage (kV)', angle: -90, position: 'insideLeft', offset: 10, fill: '#6b7280', fontSize: 10 }}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }} />
                        
                        <Line
                          type="monotone"
                          dataKey="sixPulse"
                          stroke="#f87171"
                          strokeWidth={1.5}
                          dot={false}
                          name="6-Pulse DC Waveform"
                          strokeDasharray="4 4"
                        />
                        
                        <Line
                          type="monotone"
                          dataKey="twelvePulse"
                          stroke="#34d399"
                          strokeWidth={2.5}
                          dot={false}
                          name="12-Pulse DC Waveform"
                        />

                        <Line
                          type="monotone"
                          dataKey="acPhaseA"
                          stroke="#60a5fa"
                          strokeWidth={1}
                          strokeOpacity={0.3}
                          dot={false}
                          name="AC Input Ref (Scaled)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Harmonics Bar Chart */}
                <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl space-y-4">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-400" />
                    AC-Side Line Current Harmonics cancellation
                  </h4>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hvdcHarmonics} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis
                          dataKey="harmonic"
                          stroke="#4b5563"
                          style={{ fontSize: '10px', fontFamily: 'monospace' }}
                        />
                        <YAxis
                          stroke="#4b5563"
                          style={{ fontSize: '10px', fontFamily: 'monospace' }}
                          label={{ value: 'Magnitude (%)', angle: -90, position: 'insideLeft', offset: 10, fill: '#6b7280', fontSize: 10 }}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }} />
                        
                        <Bar
                          dataKey="6-Pulse Amplitude (%)"
                          fill="#ef4444"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={30}
                        />
                        <Bar
                          dataKey="12-Pulse Amplitude (%)"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={30}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-xs space-y-2 leading-relaxed">
                    <div className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5" />
                      12-Pulse Harmonics Elimination Rule:
                    </div>
                    <p className="text-slate-400">
                      In a 6-pulse bridge, the AC side current contains harmonics of the order of <code className="text-red-400 font-mono">6k ± 1</code> (5th, 7th, 11th, 13th, 17th, 19th, ...). By combining two 6-pulse bridges with a 30° phase shift transformer (Y-Y and Y-Δ), the <code className="text-amber-400 font-mono font-bold">5th, 7th, 17th, and 19th</code> harmonics are entirely cancelled out on the primary side of the converter transformer. The remaining harmonics in a 12-pulse converter current are limited to <code className="text-emerald-400 font-mono">12k ± 1</code> (11th, 13th, 23rd, 25th, ...). This heavily reduces sizing constraints for shunt filter banks.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 3: HVAC VS HVDC BREAKEVEN DISTANCE */}
          {/* ========================================== */}
          {activeTab === 'breakeven' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Inputs Column */}
              <div className="lg:col-span-4 bg-[#111827] border border-slate-800 p-6 rounded-2xl space-y-6">
                <div>
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Sliders className="h-4.5 w-4.5 text-emerald-400" />
                    Capital Cost Estimates
                  </h3>
                </div>

                <div className="space-y-6 font-mono text-xs">
                  {/* HVAC Subsection */}
                  <div className="space-y-4 border-b border-slate-800 pb-4">
                    <div className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-red-400" />
                      HVAC System Costs
                    </div>

                    {/* HVAC Terminals */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Terminal Cost (Substations)</span>
                        <span className="text-slate-200 font-bold">${breakevenInputs.hvacTerminalCost} M</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="300"
                        step="10"
                        value={breakevenInputs.hvacTerminalCost}
                        onChange={e => setBreakevenInputs(prev => ({ ...prev, hvacTerminalCost: parseInt(e.target.value) }))}
                        className="w-full accent-red-400 bg-slate-800 rounded-lg appearance-none h-1.5"
                      />
                    </div>

                    {/* HVAC Line Cost per km */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Line Cost per km</span>
                        <span className="text-slate-200 font-bold">${breakevenInputs.hvacLineCost} M / km</span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="4.0"
                        step="0.1"
                        value={breakevenInputs.hvacLineCost}
                        onChange={e => setBreakevenInputs(prev => ({ ...prev, hvacLineCost: parseFloat(e.target.value) }))}
                        className="w-full accent-red-400 bg-slate-800 rounded-lg appearance-none h-1.5"
                      />
                    </div>
                  </div>

                  {/* HVDC Subsection */}
                  <div className="space-y-4 pt-2">
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-emerald-400" />
                      HVDC System Costs
                    </div>

                    {/* HVDC Terminals */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Terminal Cost (Converters)</span>
                        <span className="text-slate-200 font-bold">${breakevenInputs.hvdcTerminalCost} M</span>
                      </div>
                      <input
                        type="range"
                        min="150"
                        max="800"
                        step="20"
                        value={breakevenInputs.hvdcTerminalCost}
                        onChange={e => setBreakevenInputs(prev => ({ ...prev, hvdcTerminalCost: parseInt(e.target.value) }))}
                        className="w-full accent-emerald-400 bg-slate-800 rounded-lg appearance-none h-1.5"
                      />
                    </div>

                    {/* HVDC Line Cost per km */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Line Cost per km</span>
                        <span className="text-slate-200 font-bold">${breakevenInputs.hvdcLineCost} M / km</span>
                      </div>
                      <input
                        type="range"
                        min="0.4"
                        max="2.0"
                        step="0.1"
                        value={breakevenInputs.hvdcLineCost}
                        onChange={e => setBreakevenInputs(prev => ({ ...prev, hvdcLineCost: parseFloat(e.target.value) }))}
                        className="w-full accent-emerald-400 bg-slate-800 rounded-lg appearance-none h-1.5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Visualizer Plot Column */}
              <div className="lg:col-span-8 space-y-6 font-mono">
                
                {/* Breakeven Result Banner */}
                <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Economic Crossover Point</span>
                    <h4 className="text-3xl font-black text-white mt-1">
                      {breakevenStats.hasBreakeven ? `${breakevenStats.breakevenDistance} km` : 'No Breakeven Point'}
                    </h4>
                    <p className="text-xs text-slate-400 font-sans mt-1">
                      {breakevenStats.hasBreakeven 
                        ? 'Distances longer than this make HVDC cheaper than HVAC due to lower line costs.' 
                        : 'Review line costs: HVAC cost per km must exceed HVDC line cost per km to have a breakeven distance.'}
                    </p>
                  </div>

                  {breakevenStats.hasBreakeven && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-right shrink-0">
                      <div className="text-[9px] text-slate-400 uppercase font-bold">Terminal Difference</div>
                      <div className="text-sm font-bold text-emerald-400">+${breakevenStats.costDiffTerminals} M</div>
                      <div className="text-[9px] text-slate-400 uppercase font-bold mt-1">Line Savings / km</div>
                      <div className="text-sm font-bold text-blue-400">${breakevenStats.costDiffLines.toFixed(2)} M/km</div>
                    </div>
                  )}
                </div>

                {/* Breakeven Chart */}
                <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl space-y-4">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-400" />
                    HVAC vs HVDC Total Capital Cost Comparison
                  </h4>

                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={breakevenPlot} margin={{ top: 10, right: 20, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis
                          dataKey="distance"
                          stroke="#4b5563"
                          style={{ fontSize: '10px', fontFamily: 'monospace' }}
                          label={{ value: 'Transmission Distance (km)', position: 'bottom', offset: -10, fill: '#6b7280', fontSize: 10 }}
                        />
                        <YAxis
                          stroke="#4b5563"
                          style={{ fontSize: '10px', fontFamily: 'monospace' }}
                          label={{ value: 'Total Cost ($ Million)', angle: -90, position: 'insideLeft', offset: 10, fill: '#6b7280', fontSize: 10 }}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }} />
                        
                        <Line
                          type="monotone"
                          dataKey="hvacCost"
                          stroke="#f87171"
                          strokeWidth={2.5}
                          dot={false}
                          name="HVAC Overall Cost"
                        />
                        
                        <Line
                          type="monotone"
                          dataKey="hvdcCost"
                          stroke="#34d399"
                          strokeWidth={2.5}
                          dot={false}
                          name="HVDC Overall Cost"
                        />

                        {breakevenStats.hasBreakeven && (
                          <ReferenceLine
                            x={breakevenStats.breakevenDistance}
                            stroke="#ef4444"
                            strokeDasharray="4 4"
                            label={{ value: `Breakeven (${breakevenStats.breakevenDistance} km)`, fill: '#f87171', fontSize: 10, position: 'top' }}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-xs space-y-2 leading-relaxed">
                    <div className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      HVAC vs HVDC Economic Context:
                    </div>
                    <p className="text-slate-400 font-sans">
                      HVAC substation terminals are relatively simple and cheap. However, HVAC overhead line costs are high because they require 3 distinct phases, larger structural towers, and suffer from high cable charging capacitance losses (requiring intermediate shunt reactors).
                    </p>
                    <p className="text-slate-400 font-sans">
                      HVDC converters are extremely expensive (requiring complex thyristor/IGBT valves, smoothing reactors, and filtering equipment). However, HVDC line costs are much cheaper as they only require 2 poles (bipolar) or 1 pole (monopolar), use smaller towers, and have zero capacitive reactive losses. Thus, for long distances, the saved line costs override the higher terminal costs, rendering HVDC more economical.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
