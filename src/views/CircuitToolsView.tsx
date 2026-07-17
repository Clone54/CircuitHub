import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Zap,
  Activity,
  TrendingUp,
  Cpu,
  Info,
  CheckCircle2,
  Settings,
  HelpCircle,
  Network
} from 'lucide-react';
import { IEEEReportButton } from '../components/IEEEReportButton';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot
} from 'recharts';

import { usePowerFactor } from '../hooks/usePowerFactor';
import { useResonance } from '../hooks/useResonance';
import { useMaxPowerTransfer } from '../hooks/useMaxPowerTransfer';

type TabId = 'pf' | 'resonance' | 'maxPower';

export default function CircuitToolsView() {
  const [activeTab, setActiveTab] = useState<TabId>('pf');

  // --- Hook: Power Factor Correction ---
  const { inputs: pfInputs, setInputs: setPfInputs, outputs: pfOutputs } = usePowerFactor({
    realPowerKW: 100,
    currentPF: 0.75,
    targetPF: 0.95,
    voltageRms: 480,
    frequency: 60
  });

  // Triangle representation: (0,0) -> (P,0) -> (P,Q)
  const pfChartData = [
    { p: 0, q1: 0, q2: 0 },
    { p: pfInputs.realPowerKW, q1: 0, q2: 0 },
    { p: pfInputs.realPowerKW, q1: pfOutputs.q1, q2: pfOutputs.q2 }
  ];

  // --- Hook: RLC Resonance ---
  const { inputs: resInputs, setInputs: setResInputs, outputs: resOutputs } = useResonance({
    resistance: 10,
    inductance: 50,
    capacitance: 20,
    type: 'series'
  });

  // --- Hook: Maximum Power Transfer ---
  const { inputs: mptInputs, setInputs: setMptInputs, outputs: mptOutputs } = useMaxPowerTransfer({
    vTh: 12,
    rTh: 8
  });

  return (
    <div className="min-h-screen bg-navy-dark text-slate-100 pb-12 font-sans selection:bg-emerald-accent/30 selection:text-white">
      {/* Top Navigation */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO HOME
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Header Billboard */}
        <div className="relative rounded-2xl border border-navy-light/60 bg-navy-light/20 p-6 md:p-8 overflow-hidden">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-emerald-accent/5 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-indigo-500/5 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2 text-emerald-accent font-semibold text-xs tracking-wider uppercase mb-2">
              <Zap className="h-4 w-4 animate-pulse" /> EEE 1101 Circuit Fundamentals
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
              Circuit & <span className="text-emerald-accent">AC Power</span> Suite
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
              Analyze AC power dynamics, RLC resonance behavior, and fundamental network theorems with interactive, mathematically exact graphing tools.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-navy-light/60 pb-px">
          <button
            onClick={() => setActiveTab('pf')}
            className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'pf'
                ? 'border-emerald-accent text-emerald-accent bg-emerald-accent/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" /> Power Factor
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('resonance')}
            className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'resonance'
                ? 'border-indigo-400 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4" /> RLC Resonance
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('maxPower')}
            className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'maxPower'
                ? 'border-rose-400 text-rose-400 bg-rose-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Max Power Transfer
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          
          {/* ======================= */}
          {/* TAB 1: POWER FACTOR     */}
          {/* ======================= */}
          {activeTab === 'pf' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Controls */}
              <div className="lg:col-span-5 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Settings className="h-5 w-5 text-emerald-accent" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">
                    System Parameters
                  </h3>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Real Power (P) [kW]</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={pfInputs.realPowerKW}
                      onChange={e => setPfInputs({...pfInputs, realPowerKW: parseFloat(e.target.value) || 0})}
                      className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-accent"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Current PF (Lag)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        max="0.99"
                        value={pfInputs.currentPF}
                        onChange={e => setPfInputs({...pfInputs, currentPF: parseFloat(e.target.value) || 0.1})}
                        className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-accent"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Target PF (Lag)</label>
                      <input
                        type="number"
                        step="0.01"
                        min={pfInputs.currentPF}
                        max="1.0"
                        value={pfInputs.targetPF}
                        onChange={e => setPfInputs({...pfInputs, targetPF: parseFloat(e.target.value) || 0.95})}
                        className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">System Voltage (Vrms)</label>
                      <input
                        type="number"
                        step="10"
                        min="10"
                        value={pfInputs.voltageRms}
                        onChange={e => setPfInputs({...pfInputs, voltageRms: parseFloat(e.target.value) || 120})}
                        className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-accent"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Frequency (Hz)</label>
                      <select
                        value={pfInputs.frequency}
                        onChange={e => setPfInputs({...pfInputs, frequency: parseFloat(e.target.value)})}
                        className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-accent"
                      >
                        <option value={50}>50 Hz</option>
                        <option value={60}>60 Hz</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Outputs & Charts */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex justify-end" id="pf-chart">
                  <IEEEReportButton
                    experimentName="AC Power: Power Factor Correction"
                    inputData={{
                      'Real Power (P)': pfInputs.realPowerKW + ' kW',
                      'Current PF': pfInputs.currentPF.toString(),
                      'Target PF': pfInputs.targetPF.toString(),
                      'Voltage': pfInputs.voltageRms + ' Vrms',
                      'Frequency': pfInputs.frequency + ' Hz'
                    }}
                    outputData={{
                      'Initial Reactive (Q1)': pfOutputs.q1.toFixed(2) + ' kVAR',
                      'Final Reactive (Q2)': pfOutputs.q2.toFixed(2) + ' kVAR',
                      'Compensation (Qc)': pfOutputs.qc.toFixed(2) + ' kVAR',
                      'Required Capacitor': pfOutputs.capacitance.toFixed(2) + ' μF'
                    }}
                    chartSelectors={['#pf-chart']}
                  />
                </div>

                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b border-navy-light/40">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                      Power Triangle Metrics
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Initial Q1</span>
                      <span className="block text-lg font-bold text-white mt-1 font-mono">{pfOutputs.q1.toFixed(1)} <span className="text-[10px] text-slate-400">kVAR</span></span>
                    </div>
                    <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Final Q2</span>
                      <span className="block text-lg font-bold text-white mt-1 font-mono">{pfOutputs.q2.toFixed(1)} <span className="text-[10px] text-slate-400">kVAR</span></span>
                    </div>
                    <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Comp. Qc</span>
                      <span className="block text-lg font-bold text-emerald-accent mt-1 font-mono">{pfOutputs.qc.toFixed(1)} <span className="text-[10px] text-slate-400">kVAR</span></span>
                    </div>
                    <div className="bg-navy-dark/60 p-4 rounded-xl border border-emerald-accent/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                      <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Capacitor C</span>
                      <span className="block text-lg font-black text-emerald-accent mt-1 font-mono">{pfOutputs.capacitance.toFixed(1)} <span className="text-[10px] text-emerald-accent/60">μF</span></span>
                    </div>
                  </div>

                  <div className="h-64 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={pfChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorQ" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="p" type="number" stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Real Power (kW)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Reactive Power (kVAR)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }}
                          formatter={(value: number) => value.toFixed(1)}
                        />
                        <Area type="linear" dataKey="q1" stroke="#3b82f6" fillOpacity={1} fill="url(#colorQ)" name="Initial Q (kVAR)" />
                        <Area type="linear" dataKey="q2" stroke="#10b981" fillOpacity={0} strokeWidth={2} name="Corrected Q (kVAR)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================= */}
          {/* TAB 2: RLC RESONANCE    */}
          {/* ======================= */}
          {activeTab === 'resonance' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Controls */}
              <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Network className="h-5 w-5 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">
                    RLC Configuration
                  </h3>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Circuit Topology</label>
                    <select
                      value={resInputs.type}
                      onChange={e => setResInputs({...resInputs, type: e.target.value as 'series' | 'parallel'})}
                      className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-400"
                    >
                      <option value="series">Series RLC</option>
                      <option value="parallel">Parallel RLC</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Resistance (R) [Ohms]</label>
                    <input
                      type="number"
                      step="1"
                      min="0.1"
                      value={resInputs.resistance}
                      onChange={e => setResInputs({...resInputs, resistance: parseFloat(e.target.value) || 0.1})}
                      className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Inductance (L) [mH]</label>
                    <input
                      type="number"
                      step="1"
                      min="0.01"
                      value={resInputs.inductance}
                      onChange={e => setResInputs({...resInputs, inductance: parseFloat(e.target.value) || 0.01})}
                      className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Capacitance (C) [μF]</label>
                    <input
                      type="number"
                      step="1"
                      min="0.01"
                      value={resInputs.capacitance}
                      onChange={e => setResInputs({...resInputs, capacitance: parseFloat(e.target.value) || 0.01})}
                      className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>
              </div>

              {/* Outputs & Charts */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex justify-end" id="res-chart">
                  <IEEEReportButton
                    experimentName={`RLC Resonance: ${resInputs.type} Circuit`}
                    inputData={{
                      'Resistance': resInputs.resistance + ' Ω',
                      'Inductance': resInputs.inductance + ' mH',
                      'Capacitance': resInputs.capacitance + ' μF'
                    }}
                    outputData={{
                      'Resonant Freq (f0)': resOutputs.f0.toFixed(2) + ' Hz',
                      'Quality Factor (Q)': resOutputs.qFactor.toFixed(2),
                      'Bandwidth (BW)': resOutputs.bandwidth.toFixed(2) + ' Hz',
                      'Cut-off f1': resOutputs.f1.toFixed(2) + ' Hz',
                      'Cut-off f2': resOutputs.f2.toFixed(2) + ' Hz'
                    }}
                    chartSelectors={['#res-chart']}
                  />
                </div>

                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40">
                      <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">f0 (Resonance)</span>
                      <span className="block text-sm font-bold text-white mt-1 font-mono">{resOutputs.f0.toFixed(1)} <span className="text-[9px] text-slate-400">Hz</span></span>
                    </div>
                    <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40">
                      <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">Q Factor</span>
                      <span className="block text-sm font-bold text-indigo-400 mt-1 font-mono">{resOutputs.qFactor.toFixed(2)}</span>
                    </div>
                    <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40">
                      <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">BW (Bandwidth)</span>
                      <span className="block text-sm font-bold text-white mt-1 font-mono">{resOutputs.bandwidth.toFixed(1)} <span className="text-[9px] text-slate-400">Hz</span></span>
                    </div>
                    <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40">
                      <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">f1 (Lower)</span>
                      <span className="block text-sm font-bold text-slate-300 mt-1 font-mono">{resOutputs.f1.toFixed(1)} <span className="text-[9px] text-slate-400">Hz</span></span>
                    </div>
                    <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40">
                      <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">f2 (Upper)</span>
                      <span className="block text-sm font-bold text-slate-300 mt-1 font-mono">{resOutputs.f2.toFixed(1)} <span className="text-[9px] text-slate-400">Hz</span></span>
                    </div>
                  </div>

                  <div className="h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={resOutputs.plotData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <defs>
                          <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis 
                          dataKey="frequency" 
                          stroke="#64748b" 
                          style={{ fontSize: '11px' }} 
                          tickFormatter={(val) => val.toFixed(0)}
                          label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }}
                        />
                        <YAxis 
                          stroke="#64748b" 
                          style={{ fontSize: '11px' }} 
                          tickFormatter={(val) => val.toExponential(1)}
                          label={{ value: resInputs.type === 'series' ? 'Admittance |Y|' : 'Impedance |Z|', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }}
                          formatter={(value: number) => value.toExponential(3)}
                          labelFormatter={(label: number) => `Freq: ${label.toFixed(1)} Hz`}
                        />
                        <ReferenceDot x={resOutputs.f0} y={resOutputs.plotData.find(d => Math.abs(d.frequency - resOutputs.f0) < (resOutputs.plotData[1]?.frequency - resOutputs.plotData[0]?.frequency))?.value || 0} r={4} fill="#818cf8" stroke="white" />
                        <Area type="monotone" dataKey="value" stroke="#818cf8" fillOpacity={1} fill="url(#colorRes)" name={resInputs.type === 'series' ? 'Admittance' : 'Impedance'} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================= */}
          {/* TAB 3: MAX POWER        */}
          {/* ======================= */}
          {activeTab === 'maxPower' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Controls */}
              <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <TrendingUp className="h-5 w-5 text-rose-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">
                    Thevenin Equivalent
                  </h3>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Thevenin Voltage (Vth) [V]</label>
                    <input
                      type="number"
                      step="1"
                      min="0.1"
                      value={mptInputs.vTh}
                      onChange={e => setMptInputs({...mptInputs, vTh: parseFloat(e.target.value) || 0.1})}
                      className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-400"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Thevenin Resistance (Rth) [Ω]</label>
                    <input
                      type="number"
                      step="1"
                      min="0.1"
                      value={mptInputs.rTh}
                      onChange={e => setMptInputs({...mptInputs, rTh: parseFloat(e.target.value) || 0.1})}
                      className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-400"
                    />
                  </div>
                </div>
              </div>

              {/* Outputs & Charts */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex justify-end" id="maxp-chart">
                  <IEEEReportButton
                    experimentName={`Max Power Transfer Theorem`}
                    inputData={{
                      'Vth': mptInputs.vTh + ' V',
                      'Rth': mptInputs.rTh + ' Ω'
                    }}
                    outputData={{
                      'Max Power (Pmax)': mptOutputs.pMax.toFixed(3) + ' W',
                      'Optimal RL': mptInputs.rTh + ' Ω'
                    }}
                    chartSelectors={['#maxp-chart']}
                  />
                </div>

                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Max Power (Pmax)</span>
                      <span className="block text-2xl font-black text-rose-400 mt-1 font-mono">{mptOutputs.pMax.toFixed(3)} <span className="text-[10px] text-slate-400">W</span></span>
                    </div>
                    <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40 flex items-center justify-center text-xs text-slate-400 font-mono text-center leading-relaxed">
                      Occurs when Load Resistance (RL) equals Thevenin Resistance (Rth) = <strong className="text-white ml-1">{mptInputs.rTh} Ω</strong>
                    </div>
                  </div>

                  <div className="h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mptOutputs.plotData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis 
                          dataKey="rLoad" 
                          stroke="#64748b" 
                          style={{ fontSize: '11px' }} 
                          tickFormatter={(val) => val.toFixed(1)}
                          label={{ value: 'Load Resistance (RL) [Ω]', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }}
                        />
                        <YAxis 
                          stroke="#64748b" 
                          style={{ fontSize: '11px' }} 
                          tickFormatter={(val) => val.toFixed(2)}
                          label={{ value: 'Power (W)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }}
                          formatter={(value: number) => value.toFixed(3) + ' W'}
                          labelFormatter={(label: number) => `RL: ${label.toFixed(2)} Ω`}
                        />
                        <ReferenceDot x={mptInputs.rTh} y={mptOutputs.pMax} r={5} fill="#fb7185" stroke="white" />
                        <Line type="monotone" dataKey="power" stroke="#fb7185" strokeWidth={2} dot={false} name="Load Power" />
                      </LineChart>
                    </ResponsiveContainer>
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
