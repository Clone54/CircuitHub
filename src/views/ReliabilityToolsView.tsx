import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  Sliders,
  Activity,
  Info,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Plus,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Server,
  Zap
} from 'lucide-react';
import {
  LineChart,
  Line as RechartsLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
  ReferenceLine,
  Legend
} from 'recharts';

import { useSystemReliability } from '../hooks/useSystemReliability';
import { useMarkovProcess } from '../hooks/useMarkovProcess';
import { useLOLP } from '../hooks/useLOLP';

export default function ReliabilityToolsView() {
  const [activeTab, setActiveTab] = useState<'mttf' | 'markov' | 'lolp'>('mttf');

  // ==========================================
  // MODULE 1: SYSTEM RELIABILITY (MTTF)
  // ==========================================
  const {
    components: srComponents,
    connectionType,
    setConnectionType,
    addComponent: srAddComponent,
    removeComponent: srRemoveComponent,
    updateComponentLambda: srUpdateLambda,
    updateComponentName: srUpdateName,
    systemLambda,
    systemMTTF,
    chartData: srChartData
  } = useSystemReliability();

  const [newCompName, setNewCompName] = useState('');
  const [newCompLambda, setNewCompLambda] = useState(0.1);

  const handleAddSrComponent = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCompName.trim() || `Component ${srComponents.length + 1}`;
    srAddComponent(name, newCompLambda);
    setNewCompName('');
    setNewCompLambda(0.1);
  };

  // ==========================================
  // MODULE 2: MARKOV CHAIN STATE TRANSITION
  // ==========================================
  const {
    lambda: mkLambda,
    setLambda: mkSetLambda,
    mu: mkMu,
    setMu: mkSetMu,
    availability,
    unavailability,
    mttf: mkMttf,
    mttr: mkMttr,
    mttfDays,
    mttrDays,
    frequencyOfOutage,
    transientData
  } = useMarkovProcess();

  // ==========================================
  // MODULE 3: LOLP & LOEP ANALYSIS
  // ==========================================
  const {
    generators,
    addGenerator,
    removeGenerator,
    updateGenerator,
    peakLoad,
    setPeakLoad,
    totalCapacity,
    copt,
    lolp,
    lolpDaysPerYear,
    expectedEnergyNotServedMW,
    loep
  } = useLOLP();

  const [newGenName, setNewGenName] = useState('');
  const [newGenCap, setNewGenCap] = useState(50);
  const [newGenFor, setNewGenFor] = useState(0.05);

  const handleAddGenerator = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newGenName.trim() || `Generator G${generators.length + 1}`;
    addGenerator(name, newGenCap, newGenFor);
    setNewGenName('');
    setNewGenCap(50);
    setNewGenFor(0.05);
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
                <Shield className="h-4 w-4 animate-pulse" /> EEE 4251 Power System Reliability
              </div>
              <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
                Power System <span className="text-indigo-400">Reliability Suite</span>
              </h1>
              <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed font-sans">
                Evaluate system redundancy parameters and blackout risk criteria. Model multi-component series or parallel configurations, simulate transient state probabilities of generator UP/DOWN Markov processes, and construct Capacity Outage Probability Tables (COPT) for LOLP and LOEP risk calculations.
              </p>
            </div>
            
            <div className="bg-[#111827]/80 border border-slate-800 px-4 py-3 rounded-xl flex items-center gap-3 shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <Shield className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-500 tracking-wider uppercase">RELIABILITY METRIC</div>
                <div className="text-xs font-mono font-bold text-indigo-400">
                  SYSTEM AVAILABILITY ACTIVE
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-1 border-b border-slate-800 pb-px">
          <button
            onClick={() => setActiveTab('mttf')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'mttf'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
            }`}
            id="tab-mttf-modeler"
          >
            <Activity className="h-4 w-4" />
            System MTTF Modeler (Series/Parallel)
          </button>
          <button
            onClick={() => setActiveTab('markov')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'markov'
                ? 'border-indigo-400 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
            }`}
            id="tab-markov-chain"
          >
            <RefreshCw className="h-4 w-4" />
            Markov Chain Transitions
          </button>
          <button
            onClick={() => setActiveTab('lolp')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'lolp'
                ? 'border-red-400 text-red-400 bg-red-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
            }`}
            id="tab-lolp-analyzer"
          >
            <AlertTriangle className="h-4 w-4" />
            LOLP & LOEP Blackout Risk
          </button>
        </div>

        {/* Tab Content 1: System MTTF Modeler */}
        {activeTab === 'mttf' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn" id="mttf-module-content">
            
            {/* Left Controls */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Configuration Settings */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/70 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-mono text-sm font-bold text-slate-300 uppercase tracking-wider">
                    Reliability Configuration
                  </h3>
                  <Sliders className="h-4 w-4 text-emerald-400" />
                </div>

                {/* Series/Parallel Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Connection Topology</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setConnectionType('series')}
                      className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase border tracking-wider transition-all ${
                        connectionType === 'series'
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                      id="btn-topology-series"
                    >
                      Series Configuration
                    </button>
                    <button
                      onClick={() => setConnectionType('parallel')}
                      className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase border tracking-wider transition-all ${
                        connectionType === 'parallel'
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                      id="btn-topology-parallel"
                    >
                      Parallel Redundancy
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Components List */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/70 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-mono text-sm font-bold text-slate-300 uppercase tracking-wider">
                    Grid Components
                  </h3>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    {srComponents.length} Components
                  </span>
                </div>

                {/* List */}
                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                  {srComponents.map((comp) => (
                    <div key={comp.id} className="p-3 bg-slate-950/80 border border-slate-900 rounded-lg space-y-2 relative group">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={comp.name}
                          onChange={(e) => srUpdateName(comp.id, e.target.value)}
                          className="bg-transparent font-mono text-xs font-bold text-slate-200 border-b border-transparent hover:border-slate-700 focus:border-emerald-500 focus:outline-none"
                        />
                        <button
                          onClick={() => srRemoveComponent(comp.id)}
                          className="text-slate-500 hover:text-red-400 transition-all p-1"
                          title="Remove Component"
                          disabled={srComponents.length <= 1}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-slate-400">Failure Rate (λ)</span>
                          <span className="text-emerald-400 font-bold">{comp.lambda.toFixed(3)} failures/year</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0.01"
                            max="2.0"
                            step="0.01"
                            value={comp.lambda}
                            onChange={(e) => srUpdateLambda(comp.id, parseFloat(e.target.value))}
                            className="w-full accent-emerald-500 bg-slate-900 h-1 rounded cursor-pointer"
                          />
                          <span className="text-[10px] text-slate-500 font-mono w-16 text-right">
                            MTTF: {(1 / comp.lambda).toFixed(1)}y
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Component Form */}
                <form onSubmit={handleAddSrComponent} className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Generator 1"
                      value={newCompName}
                      onChange={(e) => setNewCompName(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                    />
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono">
                      <span className="text-slate-500">λ:</span>
                      <input
                        type="number"
                        min="0.01"
                        max="2.0"
                        step="0.01"
                        value={newCompLambda}
                        onChange={(e) => setNewCompLambda(parseFloat(e.target.value) || 0.1)}
                        className="bg-transparent text-slate-200 focus:outline-none w-full"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase py-2 rounded-lg tracking-wider transition-all"
                  >
                    <Plus className="h-4 w-4" /> ADD COMPONENT
                  </button>
                </form>

              </div>

            </div>

            {/* Right Display Area */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Monospace KPI metrics cards */}
              <div className="grid grid-cols-2 gap-4">
                
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 font-mono">
                  <div className="text-[10px] text-slate-500 uppercase">System Equivalent λ</div>
                  <div className="text-2xl font-bold text-emerald-400 tracking-tight mt-1">
                    {systemLambda.toFixed(4)} <span className="text-xs text-slate-400">failures/yr</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {connectionType === 'series' ? 'Sum of component failures' : 'Combined parallel equivalent'}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 font-mono">
                  <div className="text-[10px] text-slate-500 uppercase">System Overall MTTF</div>
                  <div className="text-2xl font-bold text-blue-400 tracking-tight mt-1">
                    {systemMTTF.toFixed(2)} <span className="text-xs text-slate-400">years</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Mean Time To failure = {(systemMTTF * 365).toFixed(0)} days
                  </div>
                </div>

              </div>

              {/* Dynamic Connection SVG Block Diagram */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/40 p-5 space-y-3">
                <h4 className="font-mono text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
                  Logical Network Topology Diagram
                </h4>
                <div className="relative w-full border border-slate-950 bg-slate-950 rounded-xl py-6 flex items-center justify-center overflow-x-auto min-h-[160px]">
                  
                  {connectionType === 'series' ? (
                    /* SERIES VIEW */
                    <div className="flex items-center gap-2 p-4 font-mono text-xs select-none">
                      <div className="px-2.5 py-1.5 border border-slate-800 bg-slate-900 text-slate-400 rounded">
                        System Input
                      </div>
                      
                      {srComponents.map((comp, idx) => (
                        <React.Fragment key={comp.id}>
                          <ArrowRight className="h-4 w-4 text-emerald-500 shrink-0" />
                          <div className="px-4 py-3 border border-emerald-500/30 bg-emerald-500/5 rounded-lg flex flex-col items-center shrink-0 min-w-[120px]">
                            <span className="font-bold text-slate-100">{comp.name}</span>
                            <span className="text-[9px] text-emerald-400 mt-0.5">λ = {comp.lambda.toFixed(2)}</span>
                          </div>
                        </React.Fragment>
                      ))}

                      <ArrowRight className="h-4 w-4 text-emerald-500 shrink-0" />
                      <div className="px-2.5 py-1.5 border border-slate-800 bg-slate-900 text-slate-400 rounded">
                        Load Delivered
                      </div>
                    </div>
                  ) : (
                    /* PARALLEL VIEW */
                    <div className="flex items-center gap-6 p-4 font-mono text-xs select-none">
                      <div className="px-2.5 py-1.5 border border-slate-800 bg-slate-900 text-slate-400 rounded">
                        Input
                      </div>

                      {/* SVG bracket lines around vertical stack */}
                      <div className="flex items-center gap-1">
                        {/* Braces placeholder using simple flex alignment */}
                        <div className="w-1.5 h-32 border-l-2 border-t-2 border-b-2 border-emerald-500 rounded-l shrink-0" />
                        
                        <div className="flex flex-col gap-3 py-1">
                          {srComponents.map((comp) => (
                            <div key={comp.id} className="px-4 py-2 border border-indigo-500/30 bg-indigo-500/5 rounded-lg flex flex-col items-center min-w-[140px]">
                              <span className="font-bold text-slate-100">{comp.name}</span>
                              <span className="text-[9px] text-indigo-400 mt-0.5">λ = {comp.lambda.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="w-1.5 h-32 border-r-2 border-t-2 border-b-2 border-emerald-500 rounded-r shrink-0" />
                      </div>

                      <div className="px-2.5 py-1.5 border border-slate-800 bg-slate-900 text-slate-400 rounded">
                        Output
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Decay Chart Card */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/50 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <h3 className="font-mono text-sm font-bold text-slate-200 uppercase tracking-wider">
                      Reliability Decay Curve R(t)
                    </h3>
                    <p className="text-xs text-slate-500 font-sans mt-0.5">
                      R(t) = e^(-λ * t). Shows survival probability over 10 years of operations.
                    </p>
                  </div>
                </div>

                <div className="h-64 w-full" id="mttf-decay-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={srChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="time"
                        stroke="#64748b"
                        fontSize={10}
                        fontFamily="monospace"
                        tickFormatter={(v) => `${v} yrs`}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={10}
                        fontFamily="monospace"
                        domain={[0, 1]}
                        tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}
                        itemStyle={{ color: '#f1f5f9', fontFamily: 'monospace', fontSize: '12px' }}
                        formatter={(value: any, name: string) => [`${(parseFloat(value) * 100).toFixed(2)}%`, name]}
                      />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                      
                      {/* Plot System Overall reliability */}
                      <RechartsLine
                        type="monotone"
                        dataKey="System"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6 }}
                        name="System Overall"
                      />

                      {/* Plot individual component reliabilities using subtle dashed lines */}
                      {srComponents.map((comp, idx) => {
                        const colors = ['#3b82f6', '#f59e0b', '#ec4899', '#a855f7', '#06b6d4'];
                        const strokeColor = colors[idx % colors.length];
                        return (
                          <RechartsLine
                            key={comp.id}
                            type="monotone"
                            dataKey={comp.name}
                            stroke={strokeColor}
                            strokeDasharray="4 4"
                            strokeWidth={1.2}
                            dot={false}
                            name={comp.name}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab Content 2: Markov Chain State Transitions */}
        {activeTab === 'markov' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn" id="markov-module-content">
            
            {/* Left Control Panel */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Transition Parameters Sliders */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/70 p-5 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-mono text-sm font-bold text-slate-300 uppercase tracking-wider">
                    Generator Rates
                  </h3>
                  <Sliders className="h-4 w-4 text-indigo-400" />
                </div>

                {/* Failure Rate Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Failure Rate (λ)</span>
                    <span className="text-red-400 font-bold">{mkLambda.toFixed(3)} / year</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="2.5"
                    step="0.05"
                    value={mkLambda}
                    onChange={(e) => mkSetLambda(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                    id="input-markov-lambda"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0.05 failures/yr</span>
                    <span>2.5 failures/yr</span>
                  </div>
                </div>

                {/* Repair Rate Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Repair Rate (μ)</span>
                    <span className="text-emerald-400 font-bold">{mkMu.toFixed(1)} / year</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="50.0"
                    step="0.5"
                    value={mkMu}
                    onChange={(e) => mkSetMu(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                    id="input-markov-mu"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>1.0 repair/yr</span>
                    <span>50.0 repairs/yr</span>
                  </div>
                </div>
              </div>

              {/* Theory Quick Card */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/40 p-5 space-y-3 font-mono text-xs">
                <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase">
                  <Info className="h-4 w-4 shrink-0" />
                  Steady-State Formula
                </div>
                <div className="rounded bg-slate-950/80 p-3 border border-slate-900 text-[11px] text-slate-300 space-y-2">
                  <div>• <b>Availability (A)</b> is the fraction of time the generator is operational:</div>
                  <div className="text-center py-1 font-bold text-emerald-400">A = μ / (λ + μ)</div>
                  <div>• <b>FOR (U)</b> is the Unavailability or forced outage rate:</div>
                  <div className="text-center py-1 font-bold text-red-400">U = λ / (λ + μ)</div>
                  <div>• Outage Cycle Frequency = <span className="text-indigo-400 font-semibold">A × λ</span></div>
                </div>
              </div>

            </div>

            {/* Right Display Panel */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Digital SCADA Readout Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 font-mono">
                  <div className="text-[10px] text-slate-500 uppercase">Availability (A)</div>
                  <div className="text-xl md:text-2xl font-bold text-emerald-400 tracking-tight mt-1">
                    {(availability * 100).toFixed(4)}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Uptime fraction
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 font-mono">
                  <div className="text-[10px] text-slate-500 uppercase">Forced Outage Rate</div>
                  <div className="text-xl md:text-2xl font-bold text-red-400 tracking-tight mt-1">
                    {(unavailability * 100).toFixed(4)}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Unavailability (U)
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 font-mono">
                  <div className="text-[10px] text-slate-500 uppercase">MTTF (1/λ)</div>
                  <div className="text-xl md:text-2xl font-bold text-blue-400 tracking-tight mt-1">
                    {mttfDays.toFixed(1)} <span className="text-xs text-slate-400">days</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {mkMttf.toFixed(3)} years mean uptime
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 font-mono">
                  <div className="text-[10px] text-slate-500 uppercase">MTTR (1/μ)</div>
                  <div className="text-xl md:text-2xl font-bold text-amber-500 tracking-tight mt-1">
                    {mttrDays.toFixed(1)} <span className="text-xs text-slate-400">days</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {(mkMttr * 8760).toFixed(1)} hours mean repair
                  </div>
                </div>

              </div>

              {/* Interactive SVG Markov State Transition Diagram */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/50 p-5 space-y-4">
                <h3 className="font-mono text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
                  2-State Generator Markov Diagram
                </h3>
                
                <div className="relative w-full border border-slate-950 bg-slate-950 rounded-xl py-8 flex items-center justify-center overflow-hidden">
                  
                  <svg width="450" height="150" className="max-w-full block select-none">
                    <defs>
                      <marker id="arrow-indigo" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#6366f1" />
                      </marker>
                      <marker id="arrow-emerald" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#10b981" />
                      </marker>
                    </defs>

                    {/* Transition Arc: UP -> DOWN */}
                    {/* Path coordinates curve downwards from UP node (x=100, y=75) to DOWN node (x=350, y=75) */}
                    <path
                      d="M 140,65 Q 225,25 310,65"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth={3}
                      markerEnd="url(#arrow-indigo)"
                    />
                    
                    {/* Transition Arc: DOWN -> UP */}
                    <path
                      d="M 310,85 Q 225,125 140,85"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth={3}
                      markerEnd="url(#arrow-emerald)"
                    />

                    {/* UP Node */}
                    <g transform="translate(100, 75)">
                      <circle r="36" className="fill-emerald-500/10 stroke-emerald-500" strokeWidth="2.5" />
                      <text fill="#10b981" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dy="-2">
                        STATE 0
                      </text>
                      <text fill="#ffffff" fontSize="12" fontWeight="black" fontFamily="monospace" textAnchor="middle" dy="12">
                        UP (Ok)
                      </text>
                    </g>

                    {/* DOWN Node */}
                    <g transform="translate(350, 75)">
                      <circle r="36" className="fill-red-500/10 stroke-red-500" strokeWidth="2.5" />
                      <text fill="#f43f5e" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dy="-2">
                        STATE 1
                      </text>
                      <text fill="#ffffff" fontSize="12" fontWeight="black" fontFamily="monospace" textAnchor="middle" dy="12">
                        DOWN
                      </text>
                    </g>

                    {/* Transition Value Labels */}
                    <g transform="translate(225, 20)">
                      <rect x="-35" y="-10" width="70" height="18" rx="4" className="fill-slate-900 stroke-indigo-500/20" />
                      <text fill="#818cf8" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle" dy="2">
                        λ = {mkLambda.toFixed(2)}
                      </text>
                    </g>

                    <g transform="translate(225, 130)">
                      <rect x="-35" y="-10" width="70" height="18" rx="4" className="fill-slate-900 stroke-emerald-500/20" />
                      <text fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle" dy="2">
                        μ = {mkMu.toFixed(1)}
                      </text>
                    </g>
                  </svg>

                </div>
              </div>

              {/* Transition Transient Response Curve */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/50 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <h3 className="font-mono text-sm font-bold text-slate-200 uppercase tracking-wider">
                      Transient Probability Convergence
                    </h3>
                    <p className="text-xs text-slate-500 font-sans mt-0.5">
                      Starting with P_up = 1.0 at t = 0. Curves converge to the steady state Availability limit.
                    </p>
                  </div>
                </div>

                <div className="h-60 w-full" id="markov-transient-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={transientData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="time"
                        stroke="#64748b"
                        fontSize={10}
                        fontFamily="monospace"
                        tickFormatter={(v) => `${v} yrs`}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={10}
                        fontFamily="monospace"
                        domain={[0, 1]}
                        tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}
                        itemStyle={{ color: '#f1f5f9', fontFamily: 'monospace', fontSize: '12px' }}
                        formatter={(value: any, name: string) => [`${(parseFloat(value) * 100).toFixed(2)}%`, name]}
                      />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                      
                      <RechartsLine
                        type="monotone"
                        dataKey="pUp"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={false}
                        name="P_UP (Operational)"
                      />

                      <RechartsLine
                        type="monotone"
                        dataKey="pDown"
                        stroke="#f43f5e"
                        strokeWidth={2.5}
                        dot={false}
                        name="P_DOWN (Forced Outage)"
                      />

                      <ReferenceLine
                        y={availability}
                        stroke="#475569"
                        strokeDasharray="4 4"
                        label={{ value: `Steady Availability: ${(availability * 100).toFixed(2)}%`, fill: '#94a3b8', fontSize: 10, position: 'top', fontFamily: 'monospace' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab Content 3: LOLP & LOEP Analysis */}
        {activeTab === 'lolp' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn" id="lolp-module-content">
            
            {/* Left Column - Generation Capacity & Peak Load */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Load Demand Settings */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/70 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-mono text-sm font-bold text-slate-300 uppercase tracking-wider">
                    Grid Demand (Load)
                  </h3>
                  <Sliders className="h-4 w-4 text-red-400" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Peak Load Demand</span>
                    <span className="text-red-400 font-bold">{peakLoad} MW</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max={Math.max(380, totalCapacity)}
                    step="10"
                    value={peakLoad}
                    onChange={(e) => setPeakLoad(parseInt(e.target.value) || 270)}
                    className="w-full accent-red-500 bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                    id="input-peak-load"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>50 MW</span>
                    <span>Max Capacity: {totalCapacity} MW</span>
                  </div>
                </div>
              </div>

              {/* Generator Fleet */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/70 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-mono text-sm font-bold text-slate-300 uppercase tracking-wider">
                    Generation Fleet
                  </h3>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    {generators.length} Generators
                  </span>
                </div>

                {/* List */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {generators.map((gen) => (
                    <div key={gen.id} className="p-3 bg-slate-950/80 border border-slate-900 rounded-lg space-y-3 relative group">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={gen.name}
                          onChange={(e) => {
                            const nameVal = e.target.value;
                            updateGenerator(gen.id, gen.capacity, gen.forRate);
                          }}
                          className="bg-transparent font-mono text-xs font-bold text-slate-200 border-b border-transparent focus:border-red-500 focus:outline-none"
                        />
                        <button
                          onClick={() => removeGenerator(gen.id)}
                          className="text-slate-500 hover:text-red-400 transition-all p-1"
                          title="Remove Generator"
                          disabled={generators.length <= 1}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                        <div className="space-y-1">
                          <span className="text-slate-500 block text-[9px]">CAPACITY (MW)</span>
                          <input
                            type="number"
                            value={gen.capacity}
                            onChange={(e) => updateGenerator(gen.id, Math.max(0, parseInt(e.target.value) || 0), gen.forRate)}
                            className="w-full bg-slate-900 text-slate-200 border border-slate-800 rounded px-2 py-0.5"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-500 block text-[9px]">FORCED OUTAGE RATE (FOR)</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max="0.5"
                            value={gen.forRate}
                            onChange={(e) => updateGenerator(gen.id, gen.capacity, parseFloat(e.target.value) || 0.05)}
                            className="w-full bg-slate-900 text-slate-200 border border-slate-800 rounded px-2 py-0.5"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Generator Form */}
                <form onSubmit={handleAddGenerator} className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Unit G5"
                      value={newGenName}
                      onChange={(e) => setNewGenName(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:border-red-500 focus:outline-none col-span-1"
                    />
                    <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono">
                      <span className="text-slate-500">MW:</span>
                      <input
                        type="number"
                        min="10"
                        max="500"
                        value={newGenCap}
                        onChange={(e) => setNewGenCap(parseInt(e.target.value) || 50)}
                        className="bg-transparent text-slate-200 focus:outline-none w-full text-center"
                      />
                    </div>
                    <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono">
                      <span className="text-slate-500">FOR:</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="0.5"
                        value={newGenFor}
                        onChange={(e) => setNewGenFor(parseFloat(e.target.value) || 0.05)}
                        className="bg-transparent text-slate-200 focus:outline-none w-full text-center"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-400 text-slate-950 font-mono font-bold text-xs uppercase py-2 rounded-lg tracking-wider transition-all"
                  >
                    <Plus className="h-4 w-4" /> ADD GENERATOR
                  </button>
                </form>

              </div>

            </div>

            {/* Right Column - COPT & Risk Outputs */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Output Readout Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div className="rounded-xl border border-slate-800 bg-[#0f172a]/60 p-4 font-mono">
                  <div className="text-[10px] text-slate-500 uppercase">LOLP Index</div>
                  <div className="text-xl font-bold text-red-400 tracking-tight mt-1">
                    {(lolp * 100).toFixed(4)}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {lolpDaysPerYear.toFixed(3)} days / year blackout
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#0f172a]/60 p-4 font-mono">
                  <div className="text-[10px] text-slate-500 uppercase">LOEP Index</div>
                  <div className="text-xl font-bold text-amber-500 tracking-tight mt-1">
                    {(loep * 100).toFixed(4)}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-sans">
                    Loss of Energy Probability
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#0f172a]/60 p-4 font-mono">
                  <div className="text-[10px] text-slate-500 uppercase">Expected EENS</div>
                  <div className="text-xl font-bold text-indigo-400 tracking-tight mt-1">
                    {expectedEnergyNotServedMW.toFixed(2)} <span className="text-xs">MW</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Energy Not Served risk
                  </div>
                </div>

              </div>

              {/* COPT Table Card */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/50 p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-mono text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Capacity Outage Probability Table (COPT)
                  </h3>
                  <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                    Recursive States Complete
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[220px] overflow-y-auto">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500">
                        <th className="py-2">OUTAGE CAPACITY (MW)</th>
                        <th>AVAILABLE CAPACITY (MW)</th>
                        <th>EXACT PROBABILITY</th>
                        <th>CUMULATIVE PROBABILITY</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-300">
                      {copt.map((entry, idx) => (
                        <tr
                          key={entry.outageMW}
                          className={`hover:bg-slate-900/40 ${
                            entry.isRiskState ? 'bg-red-500/5 text-red-300' : ''
                          }`}
                        >
                          <td className="py-1.5 font-bold">{entry.outageMW} MW</td>
                          <td>{entry.availableMW} MW</td>
                          <td>{entry.probability.toFixed(6)}</td>
                          <td className="font-semibold text-slate-100">
                            {entry.cumulativeProbability.toFixed(6)}
                          </td>
                          <td>
                            {entry.isRiskState ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/25 animate-pulse">
                                DEFICIT: {entry.deficiency}MW
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                                SECURE
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* COPT Chart Visualizer */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/50 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <h3 className="font-mono text-sm font-bold text-slate-200 uppercase tracking-wider">
                      Cumulative Outage Probability Distribution Curve
                    </h3>
                    <p className="text-xs text-slate-500 font-sans mt-0.5">
                      Shaded region represents capacity outage values resulting in a reserve deficit (Demand &gt; Supply).
                    </p>
                  </div>
                </div>

                <div className="h-64 w-full" id="lolp-probability-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={copt} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="outageMW"
                        stroke="#64748b"
                        fontSize={10}
                        fontFamily="monospace"
                        tickFormatter={(v) => `${v} MW`}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={10}
                        fontFamily="monospace"
                        domain={[0, 1.05]}
                        tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}
                        itemStyle={{ color: '#f1f5f9', fontFamily: 'monospace', fontSize: '12px' }}
                        formatter={(value: any, name: string) => {
                          if (name === 'cumulativeProbability') return [`${(parseFloat(value) * 100).toFixed(4)}%`, 'Cumulative Prob of Outage >= X'];
                          return [value, name];
                        }}
                      />
                      
                      <Area
                        type="stepAfter"
                        dataKey="cumulativeProbability"
                        fill="rgba(239, 68, 68, 0.15)"
                        stroke="#ef4444"
                        strokeWidth={2}
                        name="cumulativeProbability"
                      />

                      {/* Reference line for the reserve margin */}
                      {/* Reserve Margin = Installed Capacity - Peak Load */}
                      <ReferenceLine
                        x={totalCapacity - peakLoad}
                        stroke="#f43f5e"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        label={{ value: `Reserve Margin: ${totalCapacity - peakLoad} MW`, fill: '#f43f5e', fontSize: 10, position: 'top', fontFamily: 'monospace' }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
