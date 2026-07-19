import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  Cpu,
  Settings,
  Zap,
  Layers,
  Repeat,
  Radio
} from 'lucide-react';
import { IEEEReportButton } from '../components/IEEEReportButton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import * as math from 'mathjs';

import { usePolyphase } from '../hooks/usePolyphase';
import { useTransient } from '../hooks/useTransient';
import { useTwoPort } from '../hooks/useTwoPort';
import { usePassiveFilter, ComponentVal } from '../hooks/usePassiveFilter';

type TabId = 'polyphase' | 'transient' | 'twoport' | 'filter';

export default function AdvancedCircuitToolsView() {
  const [activeTab, setActiveTab] = useState<TabId>('polyphase');

  // --- Hook: Polyphase ---
  const { inputs: pInputs, setInputs: setPInputs, outputs: pOutputs } = usePolyphase({
    config: 'YY',
    isBalanced: true,
    vMag: 220,
    vPhase: 0,
    vType: 'phase',
    za: { r: 10, x: 5 },
    zb: { r: 10, x: 5 },
    zc: { r: 10, x: 5 }
  });

  // --- Hook: Transient ---
  const { inputs: tInputs, setInputs: setTInputs, outputs: tOutputs } = useTransient({
    type: 'series-rlc',
    R: 10,
    L: 50,
    C: 10,
    Vs: 12,
    v0: 0,
    i0: 0
  });

  // --- Hook: Two-Port ---
  const { inputs: tpInputs, setInputs: setTpInputs, outputs: tpOutputs } = useTwoPort({
    type: 'Z',
    m11: { r: 10, x: 0 },
    m12: { r: 5, x: 0 },
    m21: { r: 5, x: 0 },
    m22: { r: 20, x: 0 }
  });

  // --- Hook: Passive Filter ---
  const { inputs: fInputs, setInputs: setFInputs, outputs: fOutputs } = usePassiveFilter({
    type: 'LP',
    proto: 'constant-k',
    R0: 50,
    fc: 10,
    m: 0.6,
    Km: 1,
    Kf: 1
  });

  const renderComplex = (c: math.Complex) => {
    const sign = c.im >= 0 ? '+' : '-';
    return `${c.re.toFixed(2)} ${sign} j${Math.abs(c.im).toFixed(2)}`;
  };

  const renderMatrix = (m?: [[math.Complex, math.Complex], [math.Complex, math.Complex]]) => {
    if (!m) return <div className="text-slate-500 italic text-center p-4">Not Available</div>;
    return (
      <div className="flex flex-col gap-2 p-3 bg-navy-dark border border-navy-light/60 rounded-lg font-mono text-xs overflow-x-auto">
        <div className="flex justify-between gap-4">
          <span className="w-1/2 text-center text-emerald-accent">{renderComplex(m[0][0])}</span>
          <span className="w-1/2 text-center text-emerald-accent">{renderComplex(m[0][1])}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="w-1/2 text-center text-emerald-accent">{renderComplex(m[1][0])}</span>
          <span className="w-1/2 text-center text-emerald-accent">{renderComplex(m[1][1])}</span>
        </div>
      </div>
    );
  };

  const formatUnit = (val: number, isInductor: boolean) => {
    if (isInductor) {
      if (val >= 1) return `${val.toFixed(2)} H`;
      if (val >= 1e-3) return `${(val * 1e3).toFixed(2)} mH`;
      if (val >= 1e-6) return `${(val * 1e6).toFixed(2)} μH`;
      return `${(val * 1e9).toFixed(2)} nH`;
    } else {
      if (val >= 1) return `${val.toFixed(2)} F`;
      if (val >= 1e-3) return `${(val * 1e3).toFixed(2)} mF`;
      if (val >= 1e-6) return `${(val * 1e6).toFixed(2)} μF`;
      if (val >= 1e-9) return `${(val * 1e9).toFixed(2)} nF`;
      return `${(val * 1e12).toFixed(2)} pF`;
    }
  };

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
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <Layers className="h-4 w-4 animate-pulse" /> EEE 1201 Advanced Circuit Tools
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
              Advanced Circuit <span className="text-indigo-400">Analysis</span> Suite
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
              Analyze polyphase networks, simulate time-domain transients, convert two-port parameters, and design passive analog filters.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-navy-light/60 pb-px">
          <button onClick={() => setActiveTab('polyphase')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'polyphase' ? 'border-emerald-accent text-emerald-accent bg-emerald-accent/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Activity className="h-4 w-4" /> Polyphase</div>
          </button>
          <button onClick={() => setActiveTab('transient')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'transient' ? 'border-indigo-400 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Zap className="h-4 w-4" /> Transients</div>
          </button>
          <button onClick={() => setActiveTab('twoport')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'twoport' ? 'border-rose-400 text-rose-400 bg-rose-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Repeat className="h-4 w-4" /> Two-Port</div>
          </button>
          <button onClick={() => setActiveTab('filter')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'filter' ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Radio className="h-4 w-4" /> Filters</div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          
          {/* TAB 1: POLYPHASE */}
          {activeTab === 'polyphase' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Settings className="h-5 w-5 text-emerald-accent" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Polyphase Config</h3>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Configuration</label>
                      <select value={pInputs.config} onChange={e => setPInputs({...pInputs, config: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white">
                        <option value="YY">Y-Y</option>
                        <option value="YD">Y-Δ</option>
                        <option value="DY">Δ-Y</option>
                        <option value="DD">Δ-Δ</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer h-9 px-3 bg-navy-dark border border-navy-light rounded-lg">
                        <input type="checkbox" checked={pInputs.isBalanced} onChange={e => setPInputs({...pInputs, isBalanced: e.target.checked})} className="accent-emerald-accent" />
                        Balanced Load
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Voltage Mag (V)</label>
                      <input type="number" value={pInputs.vMag} onChange={e => setPInputs({...pInputs, vMag: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Type & Angle</label>
                      <div className="flex gap-2">
                        <select value={pInputs.vType} onChange={e => setPInputs({...pInputs, vType: e.target.value as any})} className="w-1/2 bg-navy-dark border border-navy-light rounded-lg px-2 py-2 text-white">
                          <option value="phase">Phase</option>
                          <option value="line">Line</option>
                        </select>
                        <input type="number" placeholder="Deg" value={pInputs.vPhase} onChange={e => setPInputs({...pInputs, vPhase: parseFloat(e.target.value)||0})} className="w-1/2 bg-navy-dark border border-navy-light rounded-lg px-2 py-2 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-400 block border-b border-navy-light/40 pb-1">Load Impedances (Ω)</label>
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-emerald-accent">Za:</span>
                      <input type="number" placeholder="R" value={pInputs.za.r} onChange={e => setPInputs({...pInputs, za: {...pInputs.za, r: parseFloat(e.target.value)||0}})} className="w-20 bg-navy-dark border border-navy-light rounded px-2 py-1 text-white" />
                      <span>+ j</span>
                      <input type="number" placeholder="X" value={pInputs.za.x} onChange={e => setPInputs({...pInputs, za: {...pInputs.za, x: parseFloat(e.target.value)||0}})} className="w-20 bg-navy-dark border border-navy-light rounded px-2 py-1 text-white" />
                    </div>
                    {!pInputs.isBalanced && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="w-6 text-emerald-accent">Zb:</span>
                          <input type="number" value={pInputs.zb.r} onChange={e => setPInputs({...pInputs, zb: {...pInputs.zb, r: parseFloat(e.target.value)||0}})} className="w-20 bg-navy-dark border border-navy-light rounded px-2 py-1 text-white" />
                          <span>+ j</span>
                          <input type="number" value={pInputs.zb.x} onChange={e => setPInputs({...pInputs, zb: {...pInputs.zb, x: parseFloat(e.target.value)||0}})} className="w-20 bg-navy-dark border border-navy-light rounded px-2 py-1 text-white" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-6 text-emerald-accent">Zc:</span>
                          <input type="number" value={pInputs.zc.r} onChange={e => setPInputs({...pInputs, zc: {...pInputs.zc, r: parseFloat(e.target.value)||0}})} className="w-20 bg-navy-dark border border-navy-light rounded px-2 py-1 text-white" />
                          <span>+ j</span>
                          <input type="number" value={pInputs.zc.x} onChange={e => setPInputs({...pInputs, zc: {...pInputs.zc, x: parseFloat(e.target.value)||0}})} className="w-20 bg-navy-dark border border-navy-light rounded px-2 py-1 text-white" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div className="flex justify-end" id="poly-chart">
                  <IEEEReportButton experimentName="3-Phase Network Analysis" inputData={{Config: pInputs.config}} outputData={{P: pOutputs.P.toFixed(2), Q: pOutputs.Q.toFixed(2)}} chartSelectors={['#poly-chart']} />
                </div>
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider border-b border-navy-light/40 pb-2">Results & Currents</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Real (P)</span>
                      <span className="block text-sm font-bold text-white mt-1 font-mono">{pOutputs.P.toFixed(1)} <span className="text-[9px] text-slate-400">W</span></span>
                    </div>
                    <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Reactive (Q)</span>
                      <span className="block text-sm font-bold text-white mt-1 font-mono">{pOutputs.Q.toFixed(1)} <span className="text-[9px] text-slate-400">VAR</span></span>
                    </div>
                    <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Apparent (S)</span>
                      <span className="block text-sm font-bold text-emerald-accent mt-1 font-mono">{pOutputs.S.toFixed(1)} <span className="text-[9px] text-slate-400">VA</span></span>
                    </div>
                    <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Power Factor</span>
                      <span className="block text-sm font-bold text-white mt-1 font-mono">{pOutputs.pf.toFixed(3)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-[10px] text-emerald-accent font-bold uppercase mb-2">Line Currents</h5>
                      <ul className="space-y-2 text-xs font-mono text-slate-300">
                        <li className="flex justify-between bg-navy-dark p-2 rounded"><span>Ia:</span> <span>{pOutputs.iLineA.mag.toFixed(2)} A ∠ {pOutputs.iLineA.ang.toFixed(1)}°</span></li>
                        <li className="flex justify-between bg-navy-dark p-2 rounded"><span>Ib:</span> <span>{pOutputs.iLineB.mag.toFixed(2)} A ∠ {pOutputs.iLineB.ang.toFixed(1)}°</span></li>
                        <li className="flex justify-between bg-navy-dark p-2 rounded"><span>Ic:</span> <span>{pOutputs.iLineC.mag.toFixed(2)} A ∠ {pOutputs.iLineC.ang.toFixed(1)}°</span></li>
                      </ul>
                    </div>
                    
                    <div>
                      {pOutputs.iPhaseA && (
                        <>
                          <h5 className="text-[10px] text-emerald-accent font-bold uppercase mb-2">Phase Currents (Delta)</h5>
                          <ul className="space-y-2 text-xs font-mono text-slate-300">
                            <li className="flex justify-between bg-navy-dark p-2 rounded"><span>Iab:</span> <span>{pOutputs.iPhaseA.mag.toFixed(2)} A ∠ {pOutputs.iPhaseA.ang.toFixed(1)}°</span></li>
                            <li className="flex justify-between bg-navy-dark p-2 rounded"><span>Ibc:</span> <span>{pOutputs.iPhaseB?.mag?.toFixed(2) ?? '0.00'} A ∠ {pOutputs.iPhaseB?.ang?.toFixed(1) ?? '0.0'}°</span></li>
                            <li className="flex justify-between bg-navy-dark p-2 rounded"><span>Ica:</span> <span>{pOutputs.iPhaseC?.mag?.toFixed(2) ?? '0.00'} A ∠ {pOutputs.iPhaseC?.ang?.toFixed(1) ?? '0.0'}°</span></li>
                          </ul>
                        </>
                      )}
                      {pOutputs.iNeutral && (
                        <>
                          <h5 className="text-[10px] text-indigo-400 font-bold uppercase mb-2">Neutral Current</h5>
                          <ul className="space-y-2 text-xs font-mono text-slate-300">
                            <li className="flex justify-between bg-navy-dark p-2 rounded border border-indigo-500/30">
                              <span>In:</span> <span>{pOutputs.iNeutral.mag.toFixed(3)} A ∠ {pOutputs.iNeutral.ang.toFixed(1)}°</span>
                            </li>
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRANSIENT */}
          {activeTab === 'transient' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Zap className="h-5 w-5 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Transient Setup</h3>
                </div>
                
                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Circuit Type</label>
                    <select value={tInputs.type} onChange={e => setTInputs({...tInputs, type: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white">
                      <option value="series-rl">Series RL (Step)</option>
                      <option value="series-rc">Series RC (Step)</option>
                      <option value="series-rlc">Series RLC</option>
                      <option value="parallel-rlc">Parallel RLC</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block text-[9px]">R (Ω)</label>
                      <input type="number" value={tInputs.R} onChange={e => setTInputs({...tInputs, R: parseFloat(e.target.value)||1})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block text-[9px]">L (mH)</label>
                      <input type="number" value={tInputs.L} disabled={tInputs.type==='series-rc'} onChange={e => setTInputs({...tInputs, L: parseFloat(e.target.value)||1})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white disabled:opacity-30" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block text-[9px]">C (μF)</label>
                      <input type="number" value={tInputs.C} disabled={tInputs.type==='series-rl'} onChange={e => setTInputs({...tInputs, C: parseFloat(e.target.value)||1})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white disabled:opacity-30" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-navy-light/40 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block text-[9px]">Vs / Is</label>
                      <input type="number" value={tInputs.Vs} onChange={e => setTInputs({...tInputs, Vs: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block text-[9px]">vC(0)</label>
                      <input type="number" value={tInputs.v0} disabled={tInputs.type==='series-rl'} onChange={e => setTInputs({...tInputs, v0: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white disabled:opacity-30" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block text-[9px]">iL(0)</label>
                      <input type="number" value={tInputs.i0} disabled={tInputs.type==='series-rc'} onChange={e => setTInputs({...tInputs, i0: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white disabled:opacity-30" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-6">
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b border-navy-light/40">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">Dynamic Response</h4>
                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-mono rounded-full border border-indigo-500/20">{tOutputs.dampingType}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Damping (α)</span>
                      <span className="block text-lg font-bold text-white mt-1 font-mono">{tOutputs.alpha.toExponential(2)} <span className="text-[10px] text-slate-400">rad/s</span></span>
                    </div>
                    <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Resonance (ω0)</span>
                      <span className="block text-lg font-bold text-white mt-1 font-mono">{tOutputs.omega0 ? tOutputs.omega0.toExponential(2) : '-'} <span className="text-[10px] text-slate-400">rad/s</span></span>
                    </div>
                  </div>

                  <div className="h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={tOutputs.plotData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="t" type="number" stroke="#64748b" style={{ fontSize: '11px' }} tickFormatter={(v)=>v.toFixed(1)} label={{ value: 'Time (ms)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis stroke="#64748b" style={{ fontSize: '11px' }} tickFormatter={(v)=>v.toFixed(2)} label={{ value: tOutputs.yLabel, angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} formatter={(value: number) => value.toFixed(4)} labelFormatter={(label: number) => `t = ${label.toFixed(2)} ms`} />
                        <Line type="monotone" dataKey="value" stroke="#818cf8" strokeWidth={2} dot={false} name="Response" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TWO PORT */}
          {activeTab === 'twoport' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Repeat className="h-5 w-5 text-rose-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Matrix Input</h3>
                </div>
                
                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Source Parameter Type</label>
                    <select value={tpInputs.type} onChange={e => setTpInputs({...tpInputs, type: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white">
                      <option value="Z">Z Parameters (Impedance)</option>
                      <option value="Y">Y Parameters (Admittance)</option>
                      <option value="ABCD">ABCD (Transmission)</option>
                      <option value="h">h Parameters (Hybrid)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 bg-navy-dark p-3 rounded border border-navy-light">
                      <span className="text-emerald-accent font-bold block mb-1">Row 1, Col 1</span>
                      <div className="flex items-center gap-1">
                        <input type="number" value={tpInputs.m11.r} onChange={e => setTpInputs({...tpInputs, m11: {...tpInputs.m11, r: parseFloat(e.target.value)||0}})} className="w-1/2 bg-navy-card border border-navy-light rounded px-2 py-1 text-white" />
                        <span className="text-slate-500">+j</span>
                        <input type="number" value={tpInputs.m11.x} onChange={e => setTpInputs({...tpInputs, m11: {...tpInputs.m11, x: parseFloat(e.target.value)||0}})} className="w-1/2 bg-navy-card border border-navy-light rounded px-2 py-1 text-white" />
                      </div>
                    </div>
                    <div className="space-y-2 bg-navy-dark p-3 rounded border border-navy-light">
                      <span className="text-emerald-accent font-bold block mb-1">Row 1, Col 2</span>
                      <div className="flex items-center gap-1">
                        <input type="number" value={tpInputs.m12.r} onChange={e => setTpInputs({...tpInputs, m12: {...tpInputs.m12, r: parseFloat(e.target.value)||0}})} className="w-1/2 bg-navy-card border border-navy-light rounded px-2 py-1 text-white" />
                        <span className="text-slate-500">+j</span>
                        <input type="number" value={tpInputs.m12.x} onChange={e => setTpInputs({...tpInputs, m12: {...tpInputs.m12, x: parseFloat(e.target.value)||0}})} className="w-1/2 bg-navy-card border border-navy-light rounded px-2 py-1 text-white" />
                      </div>
                    </div>
                    <div className="space-y-2 bg-navy-dark p-3 rounded border border-navy-light">
                      <span className="text-emerald-accent font-bold block mb-1">Row 2, Col 1</span>
                      <div className="flex items-center gap-1">
                        <input type="number" value={tpInputs.m21.r} onChange={e => setTpInputs({...tpInputs, m21: {...tpInputs.m21, r: parseFloat(e.target.value)||0}})} className="w-1/2 bg-navy-card border border-navy-light rounded px-2 py-1 text-white" />
                        <span className="text-slate-500">+j</span>
                        <input type="number" value={tpInputs.m21.x} onChange={e => setTpInputs({...tpInputs, m21: {...tpInputs.m21, x: parseFloat(e.target.value)||0}})} className="w-1/2 bg-navy-card border border-navy-light rounded px-2 py-1 text-white" />
                      </div>
                    </div>
                    <div className="space-y-2 bg-navy-dark p-3 rounded border border-navy-light">
                      <span className="text-emerald-accent font-bold block mb-1">Row 2, Col 2</span>
                      <div className="flex items-center gap-1">
                        <input type="number" value={tpInputs.m22.r} onChange={e => setTpInputs({...tpInputs, m22: {...tpInputs.m22, r: parseFloat(e.target.value)||0}})} className="w-1/2 bg-navy-card border border-navy-light rounded px-2 py-1 text-white" />
                        <span className="text-slate-500">+j</span>
                        <input type="number" value={tpInputs.m22.x} onChange={e => setTpInputs({...tpInputs, m22: {...tpInputs.m22, x: parseFloat(e.target.value)||0}})} className="w-1/2 bg-navy-card border border-navy-light rounded px-2 py-1 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider border-b border-navy-light/40 pb-2">Converted Parameters</h4>
                  
                  {tpOutputs.error ? (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-mono rounded">
                      {tpOutputs.error}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block">Z Matrix (Ω)</span>
                        {renderMatrix(tpOutputs.Z)}
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block">Y Matrix (S)</span>
                        {renderMatrix(tpOutputs.Y)}
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block">ABCD Matrix</span>
                        {renderMatrix(tpOutputs.ABCD)}
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block">h Matrix</span>
                        {renderMatrix(tpOutputs.h)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FILTER DESIGN */}
          {activeTab === 'filter' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Radio className="h-5 w-5 text-cyan-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Analog Filter Spec</h3>
                </div>
                
                <div className="space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Type</label>
                      <select value={fInputs.type} onChange={e => setFInputs({...fInputs, type: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white">
                        <option value="LP">Low Pass</option>
                        <option value="HP">High Pass</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Prototype</label>
                      <select value={fInputs.proto} onChange={e => setFInputs({...fInputs, proto: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white">
                        <option value="constant-k">Constant-k</option>
                        <option value="m-derived">m-Derived</option>
                      </select>
                    </div>
                  </div>

                  {fInputs.proto === 'm-derived' && (
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">m Factor (0 &lt; m &lt; 1)</label>
                      <input type="number" step="0.05" min="0.01" max="0.99" value={fInputs.m} onChange={e => setFInputs({...fInputs, m: parseFloat(e.target.value)||0.5})} className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white" />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Z0 (Ω)</label>
                      <input type="number" value={fInputs.R0} onChange={e => setFInputs({...fInputs, R0: parseFloat(e.target.value)||50})} className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">fc (kHz)</label>
                      <input type="number" value={fInputs.fc} onChange={e => setFInputs({...fInputs, fc: parseFloat(e.target.value)||10})} className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-navy-light/40 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Mag Scale (Km)</label>
                      <input type="number" value={fInputs.Km} onChange={e => setFInputs({...fInputs, Km: parseFloat(e.target.value)||1})} className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Freq Scale (Kf)</label>
                      <input type="number" value={fInputs.Kf} onChange={e => setFInputs({...fInputs, Kf: parseFloat(e.target.value)||1})} className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-6">
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider border-b border-navy-light/40 pb-2">Filter Network Specifications</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Scaled Inductance (L')</span>
                      <span className="block text-xl font-bold text-cyan-400 mt-1 font-mono">{formatUnit(fOutputs.scaledL, true)}</span>
                      <span className="block text-[9px] text-slate-500 mt-1">Base L: {formatUnit(fOutputs.baseL, true)}</span>
                    </div>
                    <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Scaled Capacitance (C')</span>
                      <span className="block text-xl font-bold text-cyan-400 mt-1 font-mono">{formatUnit(fOutputs.scaledC, false)}</span>
                      <span className="block text-[9px] text-slate-500 mt-1">Base C: {formatUnit(fOutputs.baseC, false)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 border-t border-navy-light/30 pt-6">
                    {/* T Section */}
                    <div>
                      <h5 className="text-[10px] text-white font-bold uppercase tracking-widest mb-3 bg-navy-dark p-2 rounded text-center border border-navy-light">T-Section Design</h5>
                      <div className="space-y-4 text-xs font-mono">
                        <div className="bg-navy-dark/40 p-3 rounded">
                          <span className="text-slate-500 block mb-1">Series Arm 1</span>
                          {fOutputs.tSection.series1.map((c, i) => (
                            <div key={i} className="flex justify-between border-b border-navy-light/20 last:border-0 py-1">
                              <span className="text-cyan-400">{c.label}</span>
                              <span className="text-white">{formatUnit(c.value, c.label.includes('L'))}</span>
                            </div>
                          ))}
                        </div>
                        <div className="bg-navy-dark/40 p-3 rounded">
                          <span className="text-slate-500 block mb-1">Series Arm 2</span>
                          {fOutputs.tSection.series2.map((c, i) => (
                            <div key={i} className="flex justify-between border-b border-navy-light/20 last:border-0 py-1">
                              <span className="text-cyan-400">{c.label}</span>
                              <span className="text-white">{formatUnit(c.value, c.label.includes('L'))}</span>
                            </div>
                          ))}
                        </div>
                        <div className="bg-navy-dark/40 p-3 rounded">
                          <span className="text-slate-500 block mb-1">Shunt Arm</span>
                          {fOutputs.tSection.shunt1.map((c, i) => (
                            <div key={i} className="flex justify-between border-b border-navy-light/20 last:border-0 py-1">
                              <span className="text-cyan-400">{c.label}</span>
                              <span className="text-white">{formatUnit(c.value, c.label.includes('L'))}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Pi Section */}
                    <div>
                      <h5 className="text-[10px] text-white font-bold uppercase tracking-widest mb-3 bg-navy-dark p-2 rounded text-center border border-navy-light">Pi-Section (π) Design</h5>
                      <div className="space-y-4 text-xs font-mono">
                        <div className="bg-navy-dark/40 p-3 rounded">
                          <span className="text-slate-500 block mb-1">Series Arm</span>
                          {fOutputs.piSection.series1.map((c, i) => (
                            <div key={i} className="flex justify-between border-b border-navy-light/20 last:border-0 py-1">
                              <span className="text-cyan-400">{c.label}</span>
                              <span className="text-white">{formatUnit(c.value, c.label.includes('L'))}</span>
                            </div>
                          ))}
                        </div>
                        <div className="bg-navy-dark/40 p-3 rounded">
                          <span className="text-slate-500 block mb-1">Shunt Arm 1</span>
                          {fOutputs.piSection.shunt1.map((c, i) => (
                            <div key={i} className="flex justify-between border-b border-navy-light/20 last:border-0 py-1">
                              <span className="text-cyan-400">{c.label}</span>
                              <span className="text-white">{formatUnit(c.value, c.label.includes('L'))}</span>
                            </div>
                          ))}
                        </div>
                        <div className="bg-navy-dark/40 p-3 rounded">
                          <span className="text-slate-500 block mb-1">Shunt Arm 2</span>
                          {fOutputs.piSection.shunt2.map((c, i) => (
                            <div key={i} className="flex justify-between border-b border-navy-light/20 last:border-0 py-1">
                              <span className="text-cyan-400">{c.label}</span>
                              <span className="text-white">{formatUnit(c.value, c.label.includes('L'))}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
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
