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
  Info,
  RefreshCw,
  AlertTriangle,
  Calendar,
  DollarSign,
  Maximize2
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
  Legend,
  ReferenceLine
} from 'recharts';

import { useReactorCore } from '../hooks/useReactorCore';
import { useNuclearEconomics } from '../hooks/useNuclearEconomics';
import { useDisasterTimeline } from '../hooks/useDisasterTimeline';

export default function NuclearToolsView() {
  const [activeTab, setActiveTab] = useState<'core' | 'economics' | 'disaster'>('core');

  // ==========================================
  // MODULE 1: REACTOR CORE DYNAMICS & SCRAM
  // ==========================================
  const {
    controlRodPosition,
    setControlRodPosition,
    coolantFlow,
    setCoolantFlow,
    power,
    temperature,
    keff,
    isScrammed,
    scramReason,
    history,
    triggerManualScram,
    resetReactor,
  } = useReactorCore();

  // Color alerts for k_eff
  const getKeffStatus = (k: number) => {
    if (isScrammed) return { label: 'SHUTDOWN (SUB-CRITICAL)', color: 'text-red-500 bg-red-500/10 border-red-500/20' };
    if (Math.abs(k - 1.0) < 0.0005) return { label: 'CRITICAL (STEADY STATE)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (k > 1.0) return { label: 'SUPER-CRITICAL (POWER SURGING)', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20 animate-pulse' };
    return { label: 'SUB-CRITICAL (POWER DECAYING)', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
  };

  const keffStatus = getKeffStatus(keff);

  // ==========================================
  // MODULE 2: LCOE ECONOMIC ANALYZER
  // ==========================================
  const {
    discountRate,
    setDiscountRate,
    plantSizeMW,
    setPlantSizeMW,
    nucCapital,
    setNucCapital,
    nucOM,
    setNucOM,
    nucFuel,
    setNucFuel,
    nucLifespan,
    setNucLifespan,
    nucCF,
    setNucCF,
    fosCapital,
    setFosCapital,
    fosOM,
    setFosOM,
    fosFuel,
    setFosFuel,
    fosLifespan,
    setFosLifespan,
    fosCF,
    setFosCF,
    nucLCOE,
    fosLCOE,
    breakevenYear,
    lifetimeSavingsMillions,
    chartData: econChartData,
  } = useNuclearEconomics();

  // ==========================================
  // MODULE 3: REACTOR DISASTER TIMELINE
  // ==========================================
  const {
    selectedDisaster,
    setSelectedDisaster,
    currentStepIndex,
    setCurrentStepIndex,
    currentStep,
    timelineSteps,
  } = useDisasterTimeline();

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 pb-12 font-sans selection:bg-emerald-500/30 selection:text-white">
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
        <div className="relative rounded-2xl border border-red-500/20 bg-slate-950/40 p-6 md:p-8 overflow-hidden">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-red-500/5 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-red-400 font-semibold text-xs tracking-wider uppercase mb-2">
                <Shield className="h-4 w-4 animate-pulse" /> EEE 4245 Nuclear Power Engineering Suite
              </div>
              <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
                Nuclear Reactor Dynamics & <span className="text-red-400">Risk Simulator</span>
              </h1>
              <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed font-sans">
                Analyze reactor physics & commercial trade-offs. Model PWR Point Kinetics with moderator and temperature feedback coefficients, compute Levelized Cost of Energy (LCOE) over 60-year life-cycles, and interactively dissect historical meltdown sequences.
              </p>
            </div>
            
            <div className="bg-[#111827]/80 border border-slate-800 px-4 py-3 rounded-xl flex items-center gap-3 shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20">
                <Zap className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-500 tracking-wider uppercase">CORE STATE</div>
                <div className="text-xs font-mono font-bold text-red-400">
                  {isScrammed ? 'SCRAM REACTOR TRIPPED' : 'SOLVER ENGAGED: CRITICAL'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-1 border-b border-slate-800 pb-px">
          <button
            onClick={() => setActiveTab('core')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'core'
                ? 'border-red-400 text-red-400 bg-red-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
            }`}
            id="tab-reactor-core"
          >
            <Activity className="h-4 w-4" />
            PWR Core Dynamics
          </button>
          <button
            onClick={() => setActiveTab('economics')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'economics'
                ? 'border-blue-400 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
            }`}
            id="tab-lcoe-economics"
          >
            <TrendingUp className="h-4 w-4" />
            LCOE Economic Analyzer
          </button>
          <button
            onClick={() => setActiveTab('disaster')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'disaster'
                ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
            }`}
            id="tab-disaster-timeline"
          >
            <AlertTriangle className="h-4 w-4" />
            Safety Disaster Timeline
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'core' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Control Panel */}
            <div className="lg:col-span-4 space-y-6">
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/70 p-5 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-mono text-sm font-bold text-slate-300 uppercase tracking-wider">
                    Reactor Operator Inputs
                  </h3>
                  <Sliders className="h-4 w-4 text-slate-500" />
                </div>

                {/* Control Rod Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Control Rod Withdrawal</span>
                    <span className={`font-bold ${isScrammed ? 'text-red-500' : 'text-blue-400'}`}>
                      {isScrammed ? '0% (SCRAM)' : `${controlRodPosition}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    disabled={isScrammed}
                    value={isScrammed ? 0 : controlRodPosition}
                    onChange={(e) => setControlRodPosition(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    id="slider-control-rods"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0% (Full Absorber)</span>
                    <span>100% (Full Flux)</span>
                  </div>
                </div>

                {/* Coolant Pump Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Primary Coolant Pump Speed</span>
                    <span className="font-bold text-teal-400">{coolantFlow}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={coolantFlow}
                    onChange={(e) => setCoolantFlow(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    id="slider-coolant-pump"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0% (Natural Conv.)</span>
                    <span>100% (Max Forced Flow)</span>
                  </div>
                </div>

                {/* Emergency Push-Buttons */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={triggerManualScram}
                    disabled={isScrammed}
                    className="w-full py-3 px-4 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-900/30 border border-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    id="btn-scram-reactor"
                  >
                    <AlertTriangle className="h-4 w-4 animate-bounce" />
                    PUSH TO EMERGENCY SCRAM
                  </button>

                  {isScrammed && (
                    <div className="rounded-lg bg-red-950/20 border border-red-800/30 p-3 text-xs space-y-2">
                      <div className="text-red-400 font-semibold uppercase tracking-wide">
                        TRIP ALARM ACTIVATED:
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed font-mono">
                        {scramReason}
                      </p>
                      <button
                        onClick={resetReactor}
                        disabled={temperature > 220}
                        className="w-full py-2 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:text-slate-600 disabled:hover:bg-slate-800 text-[11px] font-mono border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-2 transition-all"
                        id="btn-reset-reactor"
                      >
                        <RefreshCw className="h-3 w-3" />
                        {temperature > 220 ? `Cooling Core to Reset (${Math.round(temperature)}°C / 220°C)` : 'Reset SCRAM & Power Up'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Reactor Physics Parameters */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/70 p-5 space-y-4">
                <h4 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Kinetics Feedback Factors
                </h4>
                <div className="space-y-3 text-xs font-mono">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
                    <span className="text-slate-400">Doppler Temp Coeff (α_T)</span>
                    <span className="text-red-400 font-bold">-0.00038 Δk/°C</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
                    <span className="text-slate-400">Delayed Group Fraction (β)</span>
                    <span className="text-blue-400 font-bold">0.0065 (0.65%)</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
                    <span className="text-slate-400">Neutron Lifetime (Λ)</span>
                    <span className="text-teal-400 font-bold">0.0001 s</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-slate-400">Overpower Trip Limit</span>
                    <span className="text-red-400 font-bold">3520 MWth</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Display Area */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Core Parameters Bar Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Parameter 1: keff */}
                <div className="rounded-xl border border-slate-800 bg-[#0f172a]/50 p-4 space-y-2">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    Neutron Multiplication (k_eff)
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-mono font-bold tracking-tight text-white">
                      {keff.toFixed(4)}
                    </span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${keffStatus.color}`}>
                      {keffStatus.label}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        keff > 1.0 ? 'bg-amber-500' : keff === 1.0 ? 'bg-emerald-400' : 'bg-blue-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, (keff - 0.85) / 0.3 * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Parameter 2: Thermal Power */}
                <div className="rounded-xl border border-slate-800 bg-[#0f172a]/50 p-4 space-y-2">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    Thermal Core Power
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-mono font-bold tracking-tight text-white">
                      {Math.round(power).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">MWth</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        power > 3200 ? 'bg-red-500 animate-pulse' : 'bg-red-400'
                      }`}
                      style={{ width: `${Math.min(100, (power / 4000) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Parameter 3: Core Outlet Temperature */}
                <div className="rounded-xl border border-slate-800 bg-[#0f172a]/50 p-4 space-y-2">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    Core Outlet Temp
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-mono font-bold tracking-tight text-white">
                      {Math.round(temperature)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">°C</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        temperature > 325 ? 'bg-amber-500 animate-pulse' : 'bg-teal-400'
                      }`}
                      style={{ width: `${Math.min(100, (temperature / 360) * 100)}%` }}
                    />
                  </div>
                </div>

              </div>

              {/* Chart Grid */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/40 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-mono text-sm font-bold text-slate-200">
                      Real-time Core Transient Profile
                    </h3>
                    <p className="text-xs text-slate-500">
                      Euler integration rate: 4Hz. Primary loop cooling feedback simulation.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] font-mono">
                    <span className="flex items-center gap-1.5 text-red-400">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Thermal Power (MWth)
                    </span>
                    <span className="flex items-center gap-1.5 text-teal-400">
                      <span className="h-2 w-2 rounded-full bg-teal-400" />
                      Outlet Temp (°C)
                    </span>
                  </div>
                </div>

                <div className="h-[320px] w-full" id="reactor-transient-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history} margin={{ top: 10, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={10} fontStyle="italic" />
                      <YAxis yAxisId="left" stroke="#ef4444" domain={[0, 4000]} fontSize={10} />
                      <YAxis yAxisId="right" orientation="right" stroke="#14b8a6" domain={[240, 360]} fontSize={10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}
                        itemStyle={{ fontFamily: 'monospace', fontSize: '11px' }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="power"
                        stroke="#f87171"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="temperature"
                        stroke="#2dd4bf"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Dynamic Warning Message */}
              {power > 3200 && !isScrammed && (
                <div className="rounded-lg bg-yellow-950/20 border border-yellow-800/30 p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h5 className="text-yellow-400 text-xs font-bold uppercase tracking-wider font-mono">
                      CORE DEPARTURE FROM NUCLEATE BOILING (DNB) RISK
                    </h5>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      Core temperature is crossing safety lines. Moderator density is plunging, reducing the coolant&apos;s heat capacity. Pull rods or boost cooling pumps instantly to avoid structural alloy creep deformation!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Economic LCOE Analyzer */}
        {activeTab === 'economics' && (
          <div className="space-y-8">
            
            {/* Grid of inputs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Inputs */}
              <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-[#0f172a]/70 p-5 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-mono text-sm font-bold text-slate-300 uppercase tracking-wider">
                    LCOE Model Parameters
                  </h3>
                  <Sliders className="h-4 w-4 text-slate-500" />
                </div>

                {/* Common parameters */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-800/60">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      Discount Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="20"
                      value={discountRate}
                      onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#0a0f1d] border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded px-3 py-1.5 text-sm font-mono text-white"
                      id="input-discount-rate"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      Plant Size (MWe)
                    </label>
                    <input
                      type="number"
                      step="100"
                      min="100"
                      max="3000"
                      value={plantSizeMW}
                      onChange={(e) => setPlantSizeMW(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#0a0f1d] border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded px-3 py-1.5 text-sm font-mono text-white"
                      id="input-plant-size"
                    />
                  </div>
                </div>

                {/* Nuclear Parameters */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
                    Nuclear (SMR / PWR Gen III+)
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-500 font-mono">Overnight Cap ($/kW)</span>
                      <input
                        type="number"
                        step="100"
                        value={nucCapital}
                        onChange={(e) => setNucCapital(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#0a0f1d] border border-slate-800 rounded px-2 py-1 font-mono text-white"
                        id="input-nuc-capital"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 font-mono">Fuel Cycles ($/MWh)</span>
                      <input
                        type="number"
                        step="0.5"
                        value={nucFuel}
                        onChange={(e) => setNucFuel(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#0a0f1d] border border-slate-800 rounded px-2 py-1 font-mono text-white"
                        id="input-nuc-fuel"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 font-mono">Fixed O&M ($/MWh)</span>
                      <input
                        type="number"
                        step="0.5"
                        value={nucOM}
                        onChange={(e) => setNucOM(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#0a0f1d] border border-slate-800 rounded px-2 py-1 font-mono text-white"
                        id="input-nuc-om"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 font-mono">Capacity Factor (%)</span>
                      <input
                        type="number"
                        max="100"
                        value={nucCF}
                        onChange={(e) => setNucCF(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#0a0f1d] border border-slate-800 rounded px-2 py-1 font-mono text-white"
                        id="input-nuc-cf"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono text-slate-500 bg-slate-900/40 p-2 rounded border border-slate-800/50">
                    <span>Operating License</span>
                    <span className="text-blue-400 font-bold">{nucLifespan} Years</span>
                  </div>
                </div>

                {/* Fossil parameters */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-wider">
                    Fossil Alternative (Coal / Gas CCS)
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-500 font-mono">Overnight Cap ($/kW)</span>
                      <input
                        type="number"
                        step="100"
                        value={fosCapital}
                        onChange={(e) => setFosCapital(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#0a0f1d] border border-slate-800 rounded px-2 py-1 font-mono text-white"
                        id="input-fos-capital"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 font-mono">Fuel Supply ($/MWh)</span>
                      <input
                        type="number"
                        step="0.5"
                        value={fosFuel}
                        onChange={(e) => setFosFuel(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#0a0f1d] border border-slate-800 rounded px-2 py-1 font-mono text-white"
                        id="input-fos-fuel"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 font-mono">Operating O&M ($/MWh)</span>
                      <input
                        type="number"
                        step="0.5"
                        value={fosOM}
                        onChange={(e) => setFosOM(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#0a0f1d] border border-slate-800 rounded px-2 py-1 font-mono text-white"
                        id="input-fos-om"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 font-mono">Capacity Factor (%)</span>
                      <input
                        type="number"
                        max="100"
                        value={fosCF}
                        onChange={(e) => setFosCF(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#0a0f1d] border border-slate-800 rounded px-2 py-1 font-mono text-white"
                        id="input-fos-cf"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono text-slate-500 bg-slate-900/40 p-2 rounded border border-slate-800/50">
                    <span>Operational Lifespan</span>
                    <span className="text-amber-500 font-bold">{fosLifespan} Years (Requires rebuild)</span>
                  </div>
                </div>

              </div>

              {/* Economics Outputs & Cumulative plot */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Stats row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  
                  {/* Stat 1: Nuclear LCOE */}
                  <div className="rounded-xl border border-slate-800 bg-[#0f172a]/50 p-4 space-y-1">
                    <div className="text-[10px] font-mono text-blue-400 uppercase tracking-wider">
                      Nuclear LCOE
                    </div>
                    <div className="text-xl font-mono font-bold text-white flex items-baseline">
                      ${nucLCOE}
                      <span className="text-[10px] text-slate-500 font-normal ml-1">/MWh</span>
                    </div>
                  </div>

                  {/* Stat 2: Fossil LCOE */}
                  <div className="rounded-xl border border-slate-800 bg-[#0f172a]/50 p-4 space-y-1">
                    <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">
                      Fossil LCOE
                    </div>
                    <div className="text-xl font-mono font-bold text-white flex items-baseline">
                      ${fosLCOE}
                      <span className="text-[10px] text-slate-500 font-normal ml-1">/MWh</span>
                    </div>
                  </div>

                  {/* Stat 3: Breakeven Year */}
                  <div className="rounded-xl border border-slate-800 bg-[#0f172a]/50 p-4 space-y-1">
                    <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                      Breakeven Year
                    </div>
                    <div className="text-xl font-mono font-bold text-emerald-400">
                      {breakevenYear ? `Year ${breakevenYear}` : 'Never'}
                    </div>
                  </div>

                  {/* Stat 4: 60-Yr Cumulative Savings */}
                  <div className="rounded-xl border border-slate-800 bg-[#0f172a]/50 p-4 space-y-1">
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      Total Savings
                    </div>
                    <div className="text-xl font-mono font-bold text-emerald-400">
                      ${(lifetimeSavingsMillions / 1000).toFixed(2)}B
                    </div>
                  </div>

                </div>

                {/* Composed Chart representing cumulative expenses */}
                <div className="rounded-xl border border-slate-800 bg-[#0f172a]/40 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="font-display text-sm font-bold text-slate-200">
                        60-Year Cumulative Project Expenditures
                      </h3>
                      <p className="text-xs text-slate-500">
                        Includes overnight capital injection + compounding fuel & O&M. Notice the Fossil rebuild step.
                      </p>
                    </div>
                  </div>

                  <div className="h-[310px] w-full" id="lcoe-composed-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={econChartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="year" stroke="#64748b" fontSize={10} name="Year" />
                        <YAxis stroke="#64748b" fontSize={10} label={{ value: 'Millions USD ($)', angle: -90, position: 'insideLeft', offset: 0, fill: '#64748b', fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                          labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}
                          itemStyle={{ fontFamily: 'monospace', fontSize: '11px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                        
                        {/* Area for Nuclear */}
                        <Area
                          type="monotone"
                          name="Nuclear Cumulative Cost"
                          dataKey="nuclearCumulative"
                          fill="rgba(37, 99, 235, 0.05)"
                          stroke="#3b82f6"
                          strokeWidth={2}
                        />

                        {/* Line for Fossil */}
                        <Area
                          type="monotone"
                          name="Fossil Cumulative Cost"
                          dataKey="fossilCumulative"
                          fill="rgba(245, 158, 11, 0.02)"
                          stroke="#f59e0b"
                          strokeWidth={2}
                        />

                        {breakevenYear && (
                          <ReferenceLine
                            x={breakevenYear}
                            stroke="#10b981"
                            strokeDasharray="3 3"
                            label={{ value: `Breakeven Yr ${breakevenYear}`, fill: '#10b981', fontSize: 10, position: 'top' }}
                          />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Physics Note */}
                <div className="rounded-lg bg-slate-900 border border-slate-800 p-4 space-y-1 text-xs leading-relaxed text-slate-400">
                  <div className="flex items-center gap-1.5 text-slate-200 font-bold uppercase tracking-wider font-mono mb-1">
                    <Info className="h-4 w-4 text-blue-400" />
                    Nuclear Economic Physics Note
                  </div>
                  <p>
                    Nuclear plants have high upfront capital requirements but incredibly stable fuel cycles (uranium fuel assemblies are replaced once every 18-24 months and represent only ~10% of LCOE). Conversely, fossil-fuel generation has lower initial capital but is highly sensitive to commodity market fuel supply chains, which comprise up to 75% of fossil LCOE. Over long lifespans (such as 60 years), nuclear&apos;s asset durability offsets initial financing hurdles.
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* Tab 3: Disaster Timeline & SVG Visualizer */}
        {activeTab === 'disaster' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left SVG Visualizer */}
            <div className="lg:col-span-6 space-y-4">
              
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/50 p-4 flex items-center justify-between">
                <h4 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Interactive Reactor Visualizer
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedDisaster('fukushima')}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded transition-all ${
                      selectedDisaster === 'fukushima'
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                    }`}
                    id="btn-select-fukushima"
                  >
                    Fukushima (BWR)
                  </button>
                  <button
                    onClick={() => setSelectedDisaster('chernobyl')}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded transition-all ${
                      selectedDisaster === 'chernobyl'
                        ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                    }`}
                    id="btn-select-chernobyl"
                  >
                    Chernobyl (RBMK)
                  </button>
                </div>
              </div>

              {/* 2D SVG Schematic representation of reactor cross section */}
              <div className="relative rounded-xl border border-slate-800 bg-[#070b14] overflow-hidden flex items-center justify-center p-6 min-h-[400px]">
                
                {/* SVG starts here */}
                <svg viewBox="0 0 400 400" className="w-full max-w-[360px] h-auto">
                  <defs>
                    <linearGradient id="coolantGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.4" />
                    </linearGradient>
                    <radialGradient id="radiationGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={currentStep.visuals.coreTemperatureColor} stopOpacity="0.6" />
                      <stop offset="100%" stopColor={currentStep.visuals.coreTemperatureColor} stopOpacity="0.0" />
                    </radialGradient>
                  </defs>

                  {/* Outer Dome Containment Vessel */}
                  <path
                    d="M 60 380 L 60 180 A 140 140 0 0 1 340 180 L 340 380 Z"
                    fill="none"
                    stroke={currentStep.visuals.isExploded ? '#ef4444' : '#475569'}
                    strokeWidth={4}
                    strokeDasharray={currentStep.visuals.isExploded ? '15,5,10,5' : 'none'}
                    className={currentStep.visuals.isExploded ? 'animate-pulse' : ''}
                  />

                  {/* Exploded cracks in Dome */}
                  {currentStep.visuals.isExploded && (
                    <>
                      <path d="M 200 40 L 180 15 L 195 0" stroke="#ef4444" strokeWidth={3} fill="none" />
                      <path d="M 200 40 L 225 10 L 210 0" stroke="#ef4444" strokeWidth={3} fill="none" />
                      <path d="M 120 80 L 90 60 L 70 70" stroke="#ef4444" strokeWidth={2} fill="none" />
                      {/* Exploding particle points */}
                      <circle cx="200" cy="30" r="15" fill="#f97316" className="animate-ping" opacity="0.4" />
                      <circle cx="180" cy="15" r="8" fill="#ef4444" opacity="0.8" />
                      <circle cx="225" cy="10" r="10" fill="#f59e0b" opacity="0.8" />
                    </>
                  )}

                  {/* Reactor Pressure Vessel (RPV) */}
                  <rect
                    x="130"
                    y="140"
                    width="140"
                    height="210"
                    rx="15"
                    fill="#1e293b"
                    stroke={currentStep.visuals.containmentPressure > 6.0 ? '#ef4444' : '#64748b'}
                    strokeWidth={currentStep.visuals.containmentPressure > 6.0 ? 3 : 2}
                  />

                  {/* Active Core Reactor Blocks (Base Glow under temperature) */}
                  <rect
                    x="150"
                    y="220"
                    width="100"
                    height="100"
                    rx="4"
                    fill="url(#radiationGlow)"
                    className={currentStep.visuals.glowPulse ? 'animate-pulse' : ''}
                  />

                  {/* Liquid Coolant Level */}
                  {currentStep.visuals.coolantLevel > 0 && (
                    <rect
                      x="132"
                      y={140 + (210 - (210 * (currentStep.visuals.coolantLevel / 100)))}
                      width="136"
                      height={210 * (currentStep.visuals.coolantLevel / 100) - 2}
                      rx="2"
                      fill="url(#coolantGradient)"
                      opacity="0.65"
                    />
                  )}

                  {/* Control Rods (Vertical sliders sliding downwards) */}
                  {/* position = 0% is withdrawn (fully up at y=100), position = 100% is inserted (fully down in core at y=200) */}
                  <g>
                    {/* Rod 1 */}
                    <line
                      x1="170"
                      y1="90"
                      x2="170"
                      y2={110 + (110 * (currentStep.visuals.controlRodPosition / 100))}
                      stroke="#94a3b8"
                      strokeWidth={3}
                    />
                    <rect
                      x="166"
                      y={110 + (110 * (currentStep.visuals.controlRodPosition / 100))}
                      width="8"
                      height="70"
                      fill={selectedDisaster === 'chernobyl' && currentStep.step >= 3 ? '#15803d' : '#ef4444'} // RBMK graphite tips are colored green
                      rx="1"
                    />

                    {/* Rod 2 */}
                    <line
                      x1="200"
                      y1="90"
                      x2="200"
                      y2={110 + (110 * (currentStep.visuals.controlRodPosition / 100))}
                      stroke="#94a3b8"
                      strokeWidth={3}
                    />
                    <rect
                      x="196"
                      y={110 + (110 * (currentStep.visuals.controlRodPosition / 100))}
                      width="8"
                      height="70"
                      fill={selectedDisaster === 'chernobyl' && currentStep.step >= 3 ? '#15803d' : '#ef4444'}
                      rx="1"
                    />

                    {/* Rod 3 */}
                    <line
                      x1="230"
                      y1="90"
                      x2="230"
                      y2={110 + (110 * (currentStep.visuals.controlRodPosition / 100))}
                      stroke="#94a3b8"
                      strokeWidth={3}
                    />
                    <rect
                      x="226"
                      y={110 + (110 * (currentStep.visuals.controlRodPosition / 100))}
                      width="8"
                      height="70"
                      fill={selectedDisaster === 'chernobyl' && currentStep.step >= 3 ? '#15803d' : '#ef4444'}
                      rx="1"
                    />
                  </g>

                  {/* Fuel Assemblies (Static Vertical Core Elements) */}
                  <g stroke="#000" strokeWidth={1} opacity="0.8">
                    {/* Fuel Bundle Left */}
                    <rect x="155" y="230" width="10" height="80" fill="#334155" />
                    <line x1="160" y1="230" x2="160" y2="310" stroke="#f87171" strokeWidth={1.5} className={currentStep.visuals.glowPulse ? 'animate-pulse' : ''} />
                    
                    {/* Fuel Bundle Mid */}
                    <rect x="185" y="230" width="10" height="80" fill="#334155" />
                    <line x1="190" y1="230" x2="190" y2="310" stroke="#f87171" strokeWidth={1.5} className={currentStep.visuals.glowPulse ? 'animate-pulse' : ''} />

                    {/* Fuel Bundle Right */}
                    <rect x="215" y="230" width="10" height="80" fill="#334155" />
                    <line x1="220" y1="230" x2="220" y2="310" stroke="#f87171" strokeWidth={1.5} className={currentStep.visuals.glowPulse ? 'animate-pulse' : ''} />
                  </g>

                  {/* Primary Coolant loop pipes */}
                  <g fill="none" strokeWidth={4}>
                    {/* Outlet Loop */}
                    <path
                      d="M 270 170 L 310 170 L 310 320 L 270 320"
                      stroke={currentStep.visuals.isLoopCirculating ? '#3b82f6' : '#475569'}
                      strokeDasharray={currentStep.visuals.isLoopCirculating ? '8,6' : 'none'}
                      className={currentStep.visuals.isLoopCirculating ? 'animate-[dash_2s_linear_infinite]' : ''}
                      id="coolant-outlet-pipe"
                    />
                    {/* Inlet Loop with emergency pump */}
                    <path
                      d="M 130 320 L 90 320 L 90 170 L 130 170"
                      stroke={currentStep.visuals.isLoopCirculating ? '#3b82f6' : '#475569'}
                      strokeDasharray={currentStep.visuals.isLoopCirculating ? '8,6' : 'none'}
                      className={currentStep.visuals.isLoopCirculating ? 'animate-[dash_2s_linear_infinite]' : ''}
                      id="coolant-inlet-pipe"
                    />
                  </g>

                  {/* Coolant Pump circle indicator */}
                  <circle
                    cx="90"
                    cy="245"
                    r="12"
                    fill="#1e293b"
                    stroke={currentStep.visuals.isLoopCirculating ? '#3b82f6' : '#475569'}
                    strokeWidth={2}
                  />
                  <polygon
                    points="87,240 95,245 87,250"
                    fill={currentStep.visuals.isLoopCirculating ? '#60a5fa' : '#475569'}
                    className={currentStep.visuals.isLoopCirculating ? 'origin-center animate-spin' : ''}
                    style={{ transformOrigin: '90px 245px' }}
                  />

                  {/* Gas clouds / Hydrogen leaks */}
                  {currentStep.visuals.isHydrogenLeaking && (
                    <g fill="#eab308" opacity="0.5" className="animate-bounce">
                      <circle cx="280" cy="120" r="15" />
                      <circle cx="295" cy="110" r="10" />
                      <circle cx="265" cy="125" r="8" />
                      <text x="250" y="95" fill="#eab308" fontSize={10} fontFamily="monospace" fontWeight="bold">H₂ CLOUD</text>
                    </g>
                  )}
                </svg>

                {/* Legend overlay inside SVG container */}
                <div className="absolute bottom-3 left-3 bg-[#0a0f1d]/90 border border-slate-800 rounded px-2.5 py-1.5 text-[9px] font-mono space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    Coolant (Water)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded bg-red-500" />
                    Control Rods (Absorber)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded bg-green-600" />
                    RBMK Graphite Tips
                  </div>
                </div>

              </div>

              {/* Status bar */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/50 p-4 grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-500">Coolant Level:</span>
                  <span className="ml-1.5 font-bold text-blue-400">
                    {currentStep.visuals.coolantLevel}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Containment Press:</span>
                  <span className="ml-1.5 font-bold text-amber-500">
                    {currentStep.visuals.containmentPressure} bar
                  </span>
                </div>
              </div>

            </div>

            {/* Right Detailed Narrative Panel */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Stepper timeline control */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/70 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    {selectedDisaster === 'fukushima' ? 'Fukushima Sequence' : 'Chernobyl Sequence'}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    Step {currentStepIndex + 1} of {timelineSteps.length}
                  </span>
                </div>

                {/* Interactive Slider */}
                <input
                  type="range"
                  min="0"
                  max={timelineSteps.length - 1}
                  value={currentStepIndex}
                  onChange={(e) => setCurrentStepIndex(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  id="slider-disaster-stepper"
                />

                <div className="flex justify-between gap-2">
                  <button
                    onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentStepIndex === 0}
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-xs font-mono font-bold border border-slate-700"
                    id="btn-disaster-prev"
                  >
                    PREV STEP
                  </button>
                  <button
                    onClick={() => setCurrentStepIndex((prev) => Math.min(timelineSteps.length - 1, prev + 1))}
                    disabled={currentStepIndex === timelineSteps.length - 1}
                    className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-xs font-mono font-bold text-white shadow-lg shadow-emerald-900/10"
                    id="btn-disaster-next"
                  >
                    NEXT STEP
                  </button>
                </div>
              </div>

              {/* Event description */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/70 p-5 space-y-4">
                <div className="flex items-baseline gap-2 border-b border-slate-800/80 pb-3">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    {currentStep.time}
                  </span>
                  <h3 className="font-display font-bold text-white text-base">
                    {currentStep.title}
                  </h3>
                </div>

                <div className="space-y-4 text-sm leading-relaxed">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                      CHRONOLOGICAL EVENT SEQUENCE
                    </span>
                    <p className="text-slate-300 font-sans">
                      {currentStep.description}
                    </p>
                  </div>

                  <div className="rounded-lg bg-red-950/10 border border-red-900/20 p-4 space-y-1">
                    <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider font-bold block">
                      PHYSICS & NUCLEAR SAFETY DEFECT
                    </span>
                    <p className="text-slate-400 font-mono text-xs leading-relaxed">
                      {currentStep.physicsExplain}
                    </p>
                  </div>
                </div>
              </div>

              {/* Syllabus reference card */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/40 p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs font-mono uppercase tracking-wider">
                  <Info className="h-4 w-4 text-emerald-400" />
                  Syllabus Mapping: EEE 4245
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  The disaster sequence demonstrates how structural reactor configurations interact under stress. BWR failures (Fukushima) involve decay heat removal logistics (station blackouts), whereas RBMK failures (Chernobyl) involve neutron design instabilities (strong positive void coefficients combined with unfavorable control rod graphite follower geometries).
                </p>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
