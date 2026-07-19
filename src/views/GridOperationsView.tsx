import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  TrendingUp,
  AlertTriangle,
  Sliders,
  Zap,
  Shield,
  Info,
  RefreshCw,
  Server,
  TrendingDown,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import {
  LineChart,
  Line as RechartsLine,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Legend,
  ReferenceLine
} from 'recharts';

import { useLFCDynamics } from '../hooks/useLFCDynamics';
import { useUnitCommitment, LoadProfileType } from '../hooks/useUnitCommitment';
import { useContingencyAnalysis } from '../hooks/useContingencyAnalysis';

export default function GridOperationsView() {
  const [activeTab, setActiveTab] = useState<'lfc' | 'commitment' | 'contingency'>('lfc');

  // ==========================================
  // MODULE 1: AGC & LFC SIMULATOR
  // ==========================================
  const {
    stepLoad,
    setStepLoad,
    inertia,
    setInertia,
    damping,
    setDamping,
    droop,
    setDroop,
    secondaryControl,
    setSecondaryControl,
    chartData: lfcChartData,
    nadir,
    nadirDeviation,
    steadyStateFreq,
    settlingTimeSec,
    rocof
  } = useLFCDynamics();

  // ==========================================
  // MODULE 2: DYNAMIC UNIT COMMITMENT
  // ==========================================
  const {
    selectedProfile,
    setSelectedProfile,
    profilesList,
    u1Min, setU1Min,
    u1Max, setU1Max,
    u1Startup, setU1Startup,
    u1Cost, setU1Cost,
    u2Min, setU2Min,
    u2Max, setU2Max,
    u2Startup, setU2Startup,
    u2Cost, setU2Cost,
    u3Min, setU3Min,
    u3Max, setU3Max,
    u3Startup, setU3Startup,
    u3Cost, setU3Cost,
    units,
    schedule: ucSchedule,
    totalOptimizedCost,
    totalStartupCost
  } = useUnitCommitment();

  // Helper for profile names
  const getProfileLabel = (p: string) => {
    switch (p) {
      case 'summer_peak': return 'Summer Peak (High Evening Load)';
      case 'winter_low': return 'Winter Low (Double-Peak Load)';
      case 'industrial_flat': return 'Industrial Flat (Continuous High Load)';
      default: return p;
    }
  };

  // ==========================================
  // MODULE 3: N-1 CONTINGENCY & SECURITY
  // ==========================================
  const {
    lines,
    trippedLineId,
    setTrippedLineId,
    securityRanking,
    systemState,
    resetContingency
  } = useContingencyAnalysis();

  // Render node positions for the 5-bus network SVG
  // Grid layout helper coordinates for a nice 5-bus ring
  const busCoordinates: Record<number, { x: number; y: number; name: string }> = {
    1: { x: 200, y: 50, name: 'Bus 1 (Gen 1)' },
    2: { x: 380, y: 120, name: 'Bus 2 (Gen 2)' },
    3: { x: 80, y: 160, name: 'Bus 3 (Load)' },
    4: { x: 320, y: 280, name: 'Bus 4 (Load)' },
    5: { x: 140, y: 280, name: 'Bus 5 (Load)' }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 pb-12 font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Breadcrumbs */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
          id="back-to-catalog"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO DEPT CATALOG
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6 space-y-8">
        
        {/* Header Banner */}
        <div className="relative rounded-2xl border border-indigo-500/20 bg-slate-950/40 p-6 md:p-8 overflow-hidden">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-indigo-500/5 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-emerald-500/5 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase mb-2">
                <Shield className="h-4 w-4 animate-pulse" /> EEE 4249 Power System Operation & Control
              </div>
              <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
                Grid Operation & <span className="text-indigo-400">Control Suite</span>
              </h1>
              <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed font-sans">
                Model real-time SCADA transients, optimal scheduling, and grid protection criteria. Simulate primary governor droop vs. secondary LFC loops, solve dynamic programming Unit Commitments, and evaluate network N-1 contingency line loading with performance indexes.
              </p>
            </div>
            
            <div className="bg-[#111827]/80 border border-slate-800 px-4 py-3 rounded-xl flex items-center gap-3 shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <Activity className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-500 tracking-wider uppercase">SCADA STATE</div>
                <div className="text-xs font-mono font-bold text-indigo-400">
                  SYSTEM READY: ACTIVE
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-1 border-b border-slate-800 pb-px">
          <button
            onClick={() => setActiveTab('lfc')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'lfc'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
            }`}
            id="tab-lfc-sim"
          >
            <Activity className="h-4 w-4" />
            AGC & LFC Simulator
          </button>
          <button
            onClick={() => setActiveTab('commitment')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'commitment'
                ? 'border-indigo-400 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
            }`}
            id="tab-unit-commitment"
          >
            <Server className="h-4 w-4" />
            Unit Commitment (DP)
          </button>
          <button
            onClick={() => setActiveTab('contingency')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'contingency'
                ? 'border-red-400 text-red-400 bg-red-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
            }`}
            id="tab-contingency-analysis"
          >
            <AlertTriangle className="h-4 w-4" />
            N-1 Security Ranking
          </button>
        </div>

        {/* Tab Content: LFC SIMULATOR */}
        {activeTab === 'lfc' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn" id="lfc-module-content">
            {/* Left Control Panel */}
            <div className="lg:col-span-4 space-y-6">
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/70 p-5 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-mono text-sm font-bold text-slate-300 uppercase tracking-wider">
                    Grid Dynamics Inputs
                  </h3>
                  <Sliders className="h-4 w-4 text-slate-500" />
                </div>

                {/* Step Load Change */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Step Load (ΔP_L)</span>
                    <span className="text-emerald-400 font-bold">{(stepLoad * 100).toFixed(1)}% p.u.</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.15"
                    step="0.01"
                    value={stepLoad}
                    onChange={(e) => setStepLoad(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                    id="input-lfc-load"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>1% load step</span>
                    <span>15% load step</span>
                  </div>
                </div>

                {/* Generator Inertia */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Generator Inertia (H)</span>
                    <span className="text-emerald-400 font-bold">{inertia.toFixed(1)} s</span>
                  </div>
                  <input
                    type="range"
                    min="2.0"
                    max="8.0"
                    step="0.2"
                    value={inertia}
                    onChange={(e) => setInertia(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                    id="input-lfc-inertia"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>2.0s (Fast RoCoF)</span>
                    <span>8.0s (Slow RoCoF)</span>
                  </div>
                </div>

                {/* Damping Constant */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Damping Factor (D)</span>
                    <span className="text-emerald-400 font-bold">{damping.toFixed(2)} p.u.</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={damping}
                    onChange={(e) => setDamping(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                    id="input-lfc-damping"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0.5 (Underdamped)</span>
                    <span>3.0 (Highly damped)</span>
                  </div>
                </div>

                {/* Speed Droop Regulation R */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Governor Droop (R)</span>
                    <span className="text-emerald-400 font-bold">{(droop * 100).toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.02"
                    max="0.08"
                    step="0.002"
                    value={droop}
                    onChange={(e) => setDroop(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                    id="input-lfc-droop"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>2.0% (Stiff droop)</span>
                    <span>8.0% (Soft droop)</span>
                  </div>
                </div>

                {/* Secondary Control Toggle */}
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-300 block font-mono">AGC SECONDARY CONTROL</span>
                      <span className="text-[10px] text-slate-500 font-sans block">Automatic Generation Control integral feedback</span>
                    </div>
                    <button
                      onClick={() => setSecondaryControl(!secondaryControl)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        secondaryControl ? 'bg-emerald-500' : 'bg-slate-800'
                      }`}
                      id="toggle-agc-control"
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          secondaryControl ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Theory Information Card */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/40 p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold font-mono uppercase">
                  <Info className="h-4 w-4 shrink-0" />
                  Operator Quick Guide
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  The LFC transfer function simulates rotor dynamics ($M = 2H$, $D$) under load-balancing forces.
                </p>
                <div className="rounded bg-slate-950/80 p-2 border border-slate-900 font-mono text-[11px] text-slate-300 space-y-1">
                  <div>• <b className="text-emerald-400">Primary (Droop)</b> is proportional. It acts in 2-10s but has steady-state offset:</div>
                  <div className="text-center py-1 font-bold text-white">Δf_ss = -ΔP_L / (D + 1/R)</div>
                  <div>• <b className="text-emerald-400">Secondary (AGC)</b> adds integral action, driving steady-state frequency error to <b>zero</b>.</div>
                </div>
              </div>
            </div>

            {/* Right Display Panel */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Monospace digital SCADA readout cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 font-mono">
                  <div className="text-[10px] text-slate-500 uppercase">Settled Frequency</div>
                  <div className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight mt-1">
                    {steadyStateFreq.toFixed(3)} <span className="text-xs text-slate-400">Hz</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    {secondaryControl ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                        <CheckCircle className="h-3 w-3" /> Nominal
                      </span>
                    ) : (
                      <span className="text-amber-500 font-semibold">
                        Offset: {(steadyStateFreq - 50).toFixed(3)} Hz
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 font-mono">
                  <div className="text-[10px] text-slate-500 uppercase">Frequency Nadir</div>
                  <div className="text-xl md:text-2xl font-bold text-red-400 tracking-tight mt-1">
                    {nadir.toFixed(3)} <span className="text-xs text-slate-400">Hz</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Dip: {nadirDeviation.toFixed(3)} Hz
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 font-mono">
                  <div className="text-[10px] text-slate-500 uppercase">Initial RoCoF</div>
                  <div className="text-xl md:text-2xl font-bold text-amber-400 tracking-tight mt-1">
                    {rocof.toFixed(3)} <span className="text-xs text-slate-400">Hz/s</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Rate at t=0s
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 font-mono">
                  <div className="text-[10px] text-slate-500 uppercase">Settling Time</div>
                  <div className="text-xl md:text-2xl font-bold text-blue-400 tracking-tight mt-1">
                    {settlingTimeSec.toFixed(1)} <span className="text-xs text-slate-400">s</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Within ±0.02 Hz
                  </div>
                </div>

              </div>

              {/* Step Response Plot Card */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/50 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-mono text-sm font-bold text-slate-200 uppercase tracking-wider">
                      Grid Frequency Transient Step Response
                    </h3>
                    <p className="text-xs text-slate-500 font-sans mt-0.5">
                      Base frequency 50.00 Hz. Step disturbance applied at t = 0s.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" /> Active Profile
                    </span>
                    {!secondaryControl && (
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-slate-600 border border-dashed border-slate-400" /> Uncontrolled Limit
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-80 w-full" id="lfc-step-response-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lfcChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="time"
                        stroke="#64748b"
                        fontSize={10}
                        fontFamily="monospace"
                        tickFormatter={(v) => `${v}s`}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={10}
                        fontFamily="monospace"
                        domain={[49.0, 50.2]}
                        tickFormatter={(v) => `${v.toFixed(2)}Hz`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}
                        itemStyle={{ color: '#f1f5f9', fontFamily: 'monospace', fontSize: '12px' }}
                        formatter={(value: any, name: string) => {
                          if (name === 'frequency') return [`${value} Hz`, 'Grid Frequency'];
                          if (name === 'primarySettle') return [`${value} Hz`, 'Primary Settle Limit'];
                          return [value, name];
                        }}
                      />
                      <ReferenceLine y={50.0} stroke="#475569" strokeDasharray="5 5" label={{ value: '50.00 Hz Ref', fill: '#94a3b8', fontSize: 10, position: 'top', fontFamily: 'monospace' }} />
                      
                      {!secondaryControl && (
                        <ReferenceLine y={lfcChartData[lfcChartData.length - 1].primarySettle} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: `Steady-State Error`, fill: '#f43f5e', fontSize: 9, position: 'bottom', fontFamily: 'monospace' }} />
                      )}

                      <RechartsLine
                        type="monotone"
                        dataKey="frequency"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 6 }}
                        name="frequency"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab Content: DYNAMIC UNIT COMMITMENT */}
        {activeTab === 'commitment' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn" id="uc-module-content">
            
            {/* Left Column - Parameters Editor */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Profile Selector */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/70 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-mono text-sm font-bold text-slate-300 uppercase tracking-wider">
                    Load Curve Scenario
                  </h3>
                  <Sliders className="h-4 w-4 text-indigo-400" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Select 24h Profile</label>
                  <select
                    value={selectedProfile}
                    onChange={(e) => setSelectedProfile(e.target.value as LoadProfileType)}
                    className="w-full bg-slate-950 text-slate-100 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                    id="select-load-profile"
                  >
                    {profilesList.map(profileKey => (
                      <option key={profileKey} value={profileKey}>
                        {getProfileLabel(profileKey)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Generator Parameter Editors */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/70 p-5 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-mono text-sm font-bold text-slate-300 uppercase tracking-wider">
                    Generator Parameters
                  </h3>
                  <Server className="h-4 w-4 text-slate-500" />
                </div>

                {/* Unit 1 Coal Base */}
                <div className="space-y-3 pb-4 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold text-slate-200 font-mono">Unit 1: Coal Base (Cheapest)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px]">P_min / P_max</span>
                      <div className="flex gap-1 mt-1">
                        <input
                          type="number"
                          value={u1Min}
                          onChange={(e) => setU1Min(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full bg-slate-950 text-white border border-slate-800 rounded px-1.5 py-0.5 text-xs text-center"
                        />
                        <span className="text-slate-500">-</span>
                        <input
                          type="number"
                          value={u1Max}
                          onChange={(e) => setU1Max(Math.max(u1Min, parseInt(e.target.value) || 0))}
                          className="w-full bg-slate-950 text-white border border-slate-800 rounded px-1.5 py-0.5 text-xs text-center"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Startup Cost ($)</span>
                      <input
                        type="number"
                        value={u1Startup}
                        onChange={(e) => setU1Startup(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-slate-950 text-white border border-slate-800 rounded px-1.5 py-0.5 text-xs mt-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Incremental Fuel Cost:</span>
                      <span className="text-blue-400 font-bold">${u1Cost.toFixed(2)}/MWh</span>
                    </div>
                    <input
                      type="range"
                      min="10.0"
                      max="30.0"
                      step="0.5"
                      value={u1Cost}
                      onChange={(e) => setU1Cost(parseFloat(e.target.value))}
                      className="w-full accent-blue-500 bg-slate-950 h-1 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Unit 2 CCGT Gas */}
                <div className="space-y-3 pb-4 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold text-slate-200 font-mono">Unit 2: Gas CCGT (Medium)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px]">P_min / P_max</span>
                      <div className="flex gap-1 mt-1">
                        <input
                          type="number"
                          value={u2Min}
                          onChange={(e) => setU2Min(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full bg-slate-950 text-white border border-slate-800 rounded px-1.5 py-0.5 text-xs text-center"
                        />
                        <span className="text-slate-500">-</span>
                        <input
                          type="number"
                          value={u2Max}
                          onChange={(e) => setU2Max(Math.max(u2Min, parseInt(e.target.value) || 0))}
                          className="w-full bg-slate-950 text-white border border-slate-800 rounded px-1.5 py-0.5 text-xs text-center"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Startup Cost ($)</span>
                      <input
                        type="number"
                        value={u2Startup}
                        onChange={(e) => setU2Startup(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-slate-950 text-white border border-slate-800 rounded px-1.5 py-0.5 text-xs mt-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Incremental Fuel Cost:</span>
                      <span className="text-emerald-400 font-bold">${u2Cost.toFixed(2)}/MWh</span>
                    </div>
                    <input
                      type="range"
                      min="20.0"
                      max="55.0"
                      step="0.5"
                      value={u2Cost}
                      onChange={(e) => setU2Cost(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 bg-slate-950 h-1 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Unit 3 Gas Peaker */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    <span className="text-xs font-bold text-slate-200 font-mono">Unit 3: Peaker Diesel (Expensive)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px]">P_min / P_max</span>
                      <div className="flex gap-1 mt-1">
                        <input
                          type="number"
                          value={u3Min}
                          onChange={(e) => setU3Min(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full bg-slate-950 text-white border border-slate-800 rounded px-1.5 py-0.5 text-xs text-center"
                        />
                        <span className="text-slate-500">-</span>
                        <input
                          type="number"
                          value={u3Max}
                          onChange={(e) => setU3Max(Math.max(u3Min, parseInt(e.target.value) || 0))}
                          className="w-full bg-slate-950 text-white border border-slate-800 rounded px-1.5 py-0.5 text-xs text-center"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Startup Cost ($)</span>
                      <input
                        type="number"
                        value={u3Startup}
                        onChange={(e) => setU3Startup(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-slate-950 text-white border border-slate-800 rounded px-1.5 py-0.5 text-xs mt-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Incremental Fuel Cost:</span>
                      <span className="text-amber-400 font-bold">${u3Cost.toFixed(2)}/MWh</span>
                    </div>
                    <input
                      type="range"
                      min="50.0"
                      max="95.0"
                      step="1.0"
                      value={u3Cost}
                      onChange={(e) => setU3Cost(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 bg-slate-950 h-1 cursor-pointer"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column - Results Display */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Monospace KPI Metrics Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="rounded-xl border border-slate-800 bg-[#0f172a]/60 p-4 font-mono">
                  <div className="text-[10px] text-slate-500 uppercase">Total Optimized Cost</div>
                  <div className="text-2xl font-bold text-indigo-400 tracking-tight mt-1">
                    ${totalOptimizedCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Cumulative for 24-hour cycle
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#0f172a]/60 p-4 font-mono">
                  <div className="text-[10px] text-slate-500 uppercase">Operating Fuel Cost</div>
                  <div className="text-2xl font-bold text-emerald-400 tracking-tight mt-1">
                    ${(totalOptimizedCost - totalStartupCost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    P_i * C_i fuel usage
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#0f172a]/60 p-4 font-mono">
                  <div className="text-[10px] text-slate-500 uppercase">Start-up Transition Cost</div>
                  <div className="text-2xl font-bold text-amber-400 tracking-tight mt-1">
                    ${totalStartupCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Triggered during unit sync
                  </div>
                </div>

              </div>

              {/* Stacked BarChart + Demand Line Overlay */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/50 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-mono text-sm font-bold text-slate-200 uppercase tracking-wider">
                      24-Hour Commitment Schedule & Economic Dispatch
                    </h3>
                    <p className="text-xs text-slate-500 font-sans mt-0.5">
                      Optimization algorithm: Dynamic Programming with linear incremental costs and startup penalties.
                    </p>
                  </div>
                </div>

                <div className="h-80 w-full" id="uc-dispatch-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={ucSchedule} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="hour"
                        stroke="#64748b"
                        fontSize={10}
                        fontFamily="monospace"
                        tickFormatter={(v) => `${v}h`}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={10}
                        fontFamily="monospace"
                        tickFormatter={(v) => `${v} MW`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}
                        itemStyle={{ color: '#f1f5f9', fontFamily: 'monospace', fontSize: '12px' }}
                        formatter={(value: any, name: string) => {
                          if (name === 'load') return [`${value} MW`, 'Demand (Load)'];
                          if (name === 'unit1Power') return [`${value} MW`, 'Unit 1 Coal Base'];
                          if (name === 'unit2Power') return [`${value} MW`, 'Unit 2 CCGT Gas'];
                          if (name === 'unit3Power') return [`${value} MW`, 'Unit 3 Gas Peaker'];
                          return [value, name];
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconSize={10}
                        fontFamily="monospace"
                        wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                      />
                      
                      <Bar dataKey="unit1Power" stackId="mw" fill="#3b82f6" name="unit1Power" />
                      <Bar dataKey="unit2Power" stackId="mw" fill="#10b981" name="unit2Power" />
                      <Bar dataKey="unit3Power" stackId="mw" fill="#f59e0b" name="unit3Power" />
                      
                      <RechartsLine
                        type="monotone"
                        dataKey="load"
                        stroke="#ffffff"
                        strokeWidth={2.5}
                        strokeDasharray="4 4"
                        dot={true}
                        name="load"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Hourly Logs Panel */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 space-y-3">
                <h4 className="font-mono text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Hourly Commitment SCADA Log
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500">
                        <th className="py-2">HOUR</th>
                        <th>DEMAND</th>
                        <th>UNIT 1 (COAL)</th>
                        <th>UNIT 2 (GAS)</th>
                        <th>UNIT 3 (PEAKER)</th>
                        <th>OPER COST</th>
                        <th>START COST</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-300">
                      {ucSchedule.slice(0, 12).map((item) => (
                        <tr key={item.hour} className="hover:bg-slate-900/30">
                          <td className="py-1.5 font-bold">{item.hour}h</td>
                          <td>{item.load} MW</td>
                          <td className={item.unit1Power > 0 ? 'text-blue-400 font-semibold' : 'text-slate-600'}>
                            {item.unit1Power > 0 ? `${item.unit1Power} MW` : 'OFF'}
                          </td>
                          <td className={item.unit2Power > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-600'}>
                            {item.unit2Power > 0 ? `${item.unit2Power} MW` : 'OFF'}
                          </td>
                          <td className={item.unit3Power > 0 ? 'text-amber-400 font-semibold' : 'text-slate-600'}>
                            {item.unit3Power > 0 ? `${item.unit3Power} MW` : 'OFF'}
                          </td>
                          <td>${item.operatingCost.toFixed(0)}</td>
                          <td className={item.startupCostThisHour > 0 ? 'text-amber-500 font-bold' : ''}>
                            {item.startupCostThisHour > 0 ? `$${item.startupCostThisHour}` : '-'}
                          </td>
                          <td>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              (item.unit1Power + item.unit2Power + item.unit3Power) >= item.load
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              OK
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-slate-500 text-right">Showing hours 0h - 11h. Solver operates perfectly on all 24h intervals.</p>
              </div>

            </div>

          </div>
        )}

        {/* Tab Content: N-1 CONTINGENCY */}
        {activeTab === 'contingency' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn" id="contingency-module-content">
            
            {/* Left Column - Network & Outage Control */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Interactive Network Map Card */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/50 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-mono text-sm font-bold text-slate-200 uppercase tracking-wider">
                      Interactive 5-Bus SCADA Mimic
                    </h3>
                    <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                      Click transmission lines to trigger an N-1 Trip (Outage) contingency.
                    </p>
                  </div>
                  {trippedLineId && (
                    <button
                      onClick={resetContingency}
                      className="px-2.5 py-1 text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded transition-all flex items-center gap-1 shrink-0"
                      id="btn-scada-reset"
                    >
                      <RefreshCw className="h-3 w-3" /> RESTORE BASE CASE
                    </button>
                  )}
                </div>

                {/* SVG Ring Network Mimic */}
                <div className="relative w-full border border-slate-900/80 bg-slate-950/80 rounded-xl py-6 flex items-center justify-center overflow-hidden">
                  
                  <svg width="460" height="340" className="max-w-full block select-none">
                    {/* Definitions for Glow/Marker effects */}
                    <defs>
                      <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 2 L 10 5 L 0 8 z" fill="#64748b" />
                      </marker>
                    </defs>

                    {/* Draw Lines */}
                    {lines.map((line) => {
                      const from = busCoordinates[line.fromBus];
                      const to = busCoordinates[line.toBus];
                      if (!from || !to) return null;

                      // Decide color
                      let lineColor = 'stroke-emerald-400';
                      let isOverloaded = false;
                      let isWarning = false;

                      if (line.status === 'tripped') {
                        lineColor = 'stroke-slate-800';
                      } else if (line.loadingPercent >= 100) {
                        lineColor = 'stroke-red-500';
                        isOverloaded = true;
                      } else if (line.loadingPercent >= 85) {
                        lineColor = 'stroke-amber-400';
                        isWarning = true;
                      }

                      // Line style
                      const isSelected = trippedLineId === line.id;
                      const strokeWidth = isSelected ? 6 : (line.status === 'tripped' ? 3 : 5);
                      const isDashed = line.status === 'tripped';

                      // Find midpoint to render label
                      const midX = (from.x + to.x) / 2;
                      const midY = (from.y + to.y) / 2;

                      return (
                        <g key={line.id} className="cursor-pointer group">
                          {/* Invisible fat line to make hover easier */}
                          <line
                            x1={from.x}
                            y1={from.y}
                            x2={to.x}
                            y2={to.y}
                            className="stroke-transparent"
                            strokeWidth={16}
                            onClick={() => {
                              if (trippedLineId === line.id) {
                                resetContingency();
                              } else {
                                setTrippedLineId(line.id);
                              }
                            }}
                          />
                          
                          {/* Flow line */}
                          <line
                            x1={from.x}
                            y1={from.y}
                            x2={to.x}
                            y2={to.y}
                            className={`transition-all duration-300 ${lineColor} ${
                              isOverloaded ? 'animate-pulse' : ''
                            }`}
                            strokeWidth={strokeWidth}
                            strokeDasharray={isDashed ? '6,6' : 'none'}
                            onClick={() => {
                              if (trippedLineId === line.id) {
                                resetContingency();
                              } else {
                                setTrippedLineId(line.id);
                              }
                            }}
                          />

                          {/* MW Flow Label bubble */}
                          {line.status === 'active' && (
                            <g transform={`translate(${midX}, ${midY})`}>
                              <rect
                                x="-32"
                                y="-10"
                                width="64"
                                height="20"
                                rx="4"
                                className="fill-slate-900 stroke-slate-800"
                                strokeWidth="1"
                              />
                              <text
                                fill={isOverloaded ? '#f43f5e' : (isWarning ? '#f59e0b' : '#34d399')}
                                fontSize="9"
                                fontFamily="monospace"
                                fontWeight="bold"
                                textAnchor="middle"
                                dy="3"
                              >
                                {line.currentFlow > 0 ? '+' : ''}{line.currentFlow} MW
                              </text>
                            </g>
                          )}
                          
                          {/* Tripped Badge */}
                          {line.status === 'tripped' && (
                            <g transform={`translate(${midX}, ${midY})`}>
                              <rect
                                x="-24"
                                y="-10"
                                width="48"
                                height="20"
                                rx="4"
                                className="fill-slate-950 stroke-red-500/40"
                                strokeWidth="1"
                              />
                              <text
                                fill="#f43f5e"
                                fontSize="8"
                                fontFamily="monospace"
                                fontWeight="black"
                                textAnchor="middle"
                                dy="2"
                              >
                                TRIPPED
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}

                    {/* Draw Nodes (Buses) */}
                    {Object.entries(busCoordinates).map(([idStr, coord]) => {
                      const id = parseInt(idStr);
                      // Is a generator bus?
                      const isGen = id === 1 || id === 2;

                      return (
                        <g key={id} transform={`translate(${coord.x}, ${coord.y})`}>
                          <circle
                            r={isGen ? "16" : "12"}
                            className={`${
                              isGen 
                                ? 'fill-[#1e1b4b] stroke-indigo-400' 
                                : 'fill-[#0f172a] stroke-slate-600'
                            }`}
                            strokeWidth="2"
                          />
                          <text
                            fill="#f1f5f9"
                            fontSize="9"
                            fontWeight="bold"
                            fontFamily="monospace"
                            textAnchor="middle"
                            dy="3"
                          >
                            B{id}
                          </text>
                          {/* Node tooltip text underneath */}
                          <text
                            fill="#94a3b8"
                            fontSize="8"
                            fontFamily="sans-serif"
                            textAnchor="middle"
                            y={isGen ? "28" : "24"}
                          >
                            {coord.name}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="text-[10px] text-slate-500 flex items-center justify-between px-1">
                  <span>Legend: 🟢 Safe (&lt;85%)</span>
                  <span>🟡 Near Capacity (85%-100%)</span>
                  <span>🔴 Overloaded (≥100%)</span>
                </div>
              </div>

              {/* System Security Alarm Card */}
              <div className={`rounded-xl border p-5 flex gap-4 transition-all duration-300 ${
                systemState.status === 'critical'
                  ? 'bg-red-500/10 border-red-500/20 text-red-200'
                  : (systemState.status === 'alert'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200')
              }`}>
                <div className="shrink-0">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${
                    systemState.status === 'critical'
                      ? 'bg-red-500/10 border-red-500/20 text-red-400'
                      : (systemState.status === 'alert'
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400')
                  }`}>
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-mono tracking-wider uppercase opacity-60">System Security State</div>
                  <div className="text-sm font-mono font-bold uppercase tracking-tight">
                    {systemState.status === 'critical' ? 'CRITICAL - STABILITY ALERT' : (systemState.status === 'alert' ? 'WARNING - HIGH LOAD' : 'GRID STABLE')}
                  </div>
                  <p className="text-xs opacity-80 leading-relaxed font-sans">{systemState.message}</p>
                </div>
              </div>

            </div>

            {/* Right Column - Security Ranking & Active Flow details */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Live Flow & Dynamic Loading Table */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/50 p-5 space-y-3">
                <h3 className="font-mono text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Post-Contingency Line Flows & Limits
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500">
                        <th className="py-2">LINE</th>
                        <th>FROM-TO</th>
                        <th>THERMAL CAPACITY</th>
                        <th>POST-FLOW</th>
                        <th>LOADING %</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-300">
                      {lines.map((line) => {
                        const isOverloaded = line.loadingPercent >= 100;
                        const isWarning = line.loadingPercent >= 85 && line.loadingPercent < 100;
                        const isTripped = line.status === 'tripped';

                        return (
                          <tr key={line.id} className={`hover:bg-slate-900/30 ${isTripped ? 'bg-red-950/10 text-slate-500' : ''}`}>
                            <td className="py-2 font-bold">{line.id}</td>
                            <td>Bus {line.fromBus} → {line.toBus}</td>
                            <td>{line.capacity} MW</td>
                            <td className={isOverloaded ? 'text-red-400 font-bold' : (isWarning ? 'text-amber-400 font-semibold' : 'text-emerald-400')}>
                              {isTripped ? '0.0 MW' : `${line.currentFlow} MW`}
                            </td>
                            <td className="font-bold">
                              {isTripped ? (
                                <span className="text-red-500/80">OUTAGE</span>
                              ) : (
                                <span className={isOverloaded ? 'text-red-400 animate-pulse' : (isWarning ? 'text-amber-400' : 'text-emerald-400')}>
                                  {line.loadingPercent}%
                                </span>
                              )}
                            </td>
                            <td>
                              {isTripped ? (
                                <button
                                  onClick={resetContingency}
                                  className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded"
                                >
                                  RESTORE
                                </button>
                              ) : (
                                <button
                                  onClick={() => setTrippedLineId(line.id)}
                                  className="px-1.5 py-0.5 text-[9px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded"
                                >
                                  TRIP
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Security Ranking Table (LODF & Performance Index) */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/50 p-5 space-y-4">
                <div>
                  <h3 className="font-mono text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Contingency Security Ranking (PI)
                  </h3>
                  <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                    Ranks all possible line outages by their active-power <b>Performance Index (PI)</b>. Click a row to simulate.
                  </p>
                </div>

                <div className="overflow-x-auto border border-slate-900 rounded-lg">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-400">
                        <th className="py-2.5 px-3">RANK</th>
                        <th>OUTAGE COMPONENT</th>
                        <th>SEVERITY PI SCORE</th>
                        <th>WORST POST-LOADING</th>
                        <th>OVERLOADS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-300 bg-[#0f172a]/20">
                      {securityRanking.map((rank, idx) => {
                        const isSimulatingThis = trippedLineId === rank.lineId;
                        const hasOverloads = rank.overloadedLinesCount > 0;
                        const hasWarnings = rank.maxPostContingencyLoading >= 85 && rank.maxPostContingencyLoading < 100;

                        return (
                          <tr
                            key={rank.lineId}
                            onClick={() => setTrippedLineId(rank.lineId)}
                            className={`cursor-pointer hover:bg-slate-850 transition-all ${
                              isSimulatingThis 
                                ? 'bg-indigo-500/10 text-indigo-300 font-semibold border-l-2 border-indigo-400' 
                                : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 font-bold text-slate-500">
                              #{idx + 1}
                            </td>
                            <td>
                              <span className="block font-bold">{rank.trippedLineName}</span>
                              <span className="text-[9px] text-slate-500 font-sans">Critical limit: {rank.criticalLine}</span>
                            </td>
                            <td className="text-slate-100 font-bold">
                              {rank.performanceIndex.toFixed(3)}
                            </td>
                            <td>
                              <span className={hasOverloads ? 'text-red-400' : (hasWarnings ? 'text-amber-400' : 'text-emerald-400')}>
                                {rank.maxPostContingencyLoading.toFixed(1)}%
                              </span>
                            </td>
                            <td>
                              {hasOverloads ? (
                                <span className="inline-block px-1 py-0.2 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[9px] font-bold">
                                  {rank.overloadedLinesCount} OVERLOAD
                                </span>
                              ) : (
                                <span className="text-slate-500">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="rounded border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex gap-2 text-[10px] font-mono text-slate-400 leading-relaxed">
                    <HelpCircle className="h-4 w-4 shrink-0 text-slate-500" />
                    <span>
                      <b>Performance Index Formula:</b> PI = Σ (P_l_post / P_max_l)^4. High exponent (n=2) penalizes overloads severely, providing instant system sorting of outage vulnerabilities.
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
