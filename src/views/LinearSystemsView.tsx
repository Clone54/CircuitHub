import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  MoveRight,
  TrendingUp,
  CircleDot
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ReferenceArea,
  ZAxis,
  ComposedChart
} from 'recharts';

import { useConvolution } from '../hooks/useConvolution';
import { usePoleZero } from '../hooks/usePoleZero';
import { useSampling } from '../hooks/useSampling';

type TabId = 'convolution' | 'polezero' | 'sampling';

export default function LinearSystemsView() {
  const [activeTab, setActiveTab] = useState<TabId>('convolution');

  // --- Hook: Convolution ---
  const { inputs: cInputs, setInputs: setCInputs, outputs: cOutputs } = useConvolution({
    xType: 'Rectangular',
    hType: 'Exponential',
    tShift: 1
  });

  // --- Hook: Pole Zero ---
  const { inputs: pzInputs, setInputs: setPzInputs, outputs: pzOutputs } = usePoleZero({
    domain: 's',
    numStr: '1',
    denStr: '1, 3, 2' // (s+1)(s+2) = s^2 + 3s + 2 => poles at -1, -2
  });

  // --- Hook: Sampling ---
  const { inputs: sInputs, setInputs: setSInputs, outputs: sOutputs } = useSampling({
    f_m: 10,
    f_s: 15
  });

  // helper for Unit Circle
  const unitCircleData = [];
  for (let i = 0; i <= 60; i++) {
    const angle = (i / 60) * 2 * Math.PI;
    unitCircleData.push({ re: Math.cos(angle), im: Math.sin(angle) });
  }

  return (
    <div className="min-h-screen bg-navy-dark text-slate-100 pb-12 font-sans selection:bg-indigo-500/30 selection:text-white">
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
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-indigo-500/5 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-cyan-500/5 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <Activity className="h-4 w-4 animate-pulse" /> EEE 2201 Signals & Linear Systems
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
              Linear Systems <span className="text-indigo-400">Analysis</span> Suite
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
              Visualize LTI convolution, perform stability analysis via Pole-Zero plotting, and demonstrate Nyquist sampling and aliasing.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-navy-light/60 pb-px">
          <button onClick={() => setActiveTab('convolution')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'convolution' ? 'border-indigo-400 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><MoveRight className="h-4 w-4" /> LTI Convolution</div>
          </button>
          <button onClick={() => setActiveTab('polezero')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'polezero' ? 'border-emerald-accent text-emerald-accent bg-emerald-accent/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><CircleDot className="h-4 w-4" /> Pole-Zero Plotter</div>
          </button>
          <button onClick={() => setActiveTab('sampling')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'sampling' ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Activity className="h-4 w-4" /> Nyquist Sampling</div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          
          {/* TAB 1: CONVOLUTION */}
          {activeTab === 'convolution' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <MoveRight className="h-5 w-5 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Convolution Setup</h3>
                </div>
                
                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Input Signal x(t)</label>
                    <select value={cInputs.xType} onChange={e => setCInputs({...cInputs, xType: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white">
                      <option value="Rectangular">Rectangular Pulse</option>
                      <option value="Step">Unit Step</option>
                      <option value="Exponential">Exponential Decay</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Impulse Response h(t)</label>
                    <select value={cInputs.hType} onChange={e => setCInputs({...cInputs, hType: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white">
                      <option value="Rectangular">Rectangular Pulse</option>
                      <option value="Step">Unit Step</option>
                      <option value="Exponential">Exponential Decay</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 border-t border-navy-light/40 pt-4">
                    <div className="flex justify-between">
                      <label className="text-slate-400 block">Time Shift (t)</label>
                      <span className="text-indigo-400 font-bold">{cInputs.tShift.toFixed(2)}s</span>
                    </div>
                    <input 
                      type="range" 
                      min="-2" 
                      max="8" 
                      step="0.1" 
                      value={cInputs.tShift} 
                      onChange={e => setCInputs({...cInputs, tShift: parseFloat(e.target.value)})} 
                      className="w-full accent-indigo-400 h-2 bg-navy-light/40 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-6">
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">Overlap: x(τ) and h(t - τ)</h4>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cOutputs.tauData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="tau" type="number" stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Time τ', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} formatter={(val: number) => val.toFixed(2)} />
                        
                        {/* Overlap area */}
                        <Area type="monotone" dataKey="overlap" stroke="none" fill="#818cf8" fillOpacity={0.3} name="Overlap Area" />
                        <Line type="stepAfter" dataKey="x" stroke="#38bdf8" strokeWidth={2} dot={false} name="x(τ)" />
                        <Line type="stepAfter" dataKey="h_shifted" stroke="#a78bfa" strokeWidth={2} dot={false} name="h(t-τ)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mt-4">Resulting Convolution y(t)</h4>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cOutputs.yData.filter(d => d.t <= cInputs.tShift)} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="t" type="number" domain={[-2, 8]} stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Time t', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis stroke="#64748b" style={{ fontSize: '11px' }} domain={[0, 'auto']} />
                        <Area type="monotone" dataKey="y" stroke="#818cf8" strokeWidth={2} fillOpacity={0.4} fill="#818cf8" name="y(t)" isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: POLE ZERO PLOTTER */}
          {activeTab === 'polezero' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <CircleDot className="h-5 w-5 text-emerald-accent" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">System Function</h3>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Domain</label>
                    <select value={pzInputs.domain} onChange={e => setPzInputs({...pzInputs, domain: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white">
                      <option value="s">Continuous (s-domain)</option>
                      <option value="z">Discrete (z-domain)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Numerator Coefficients (Highest Degree First)</label>
                    <input type="text" value={pzInputs.numStr} onChange={e => setPzInputs({...pzInputs, numStr: e.target.value})} placeholder="e.g., 1, 2 for s + 2" className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Denominator Coefficients (Highest Degree First)</label>
                    <input type="text" value={pzInputs.denStr} onChange={e => setPzInputs({...pzInputs, denStr: e.target.value})} placeholder="e.g., 1, 3, 2 for s^2 + 3s + 2" className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                </div>

                {pzOutputs.error ? (
                  <div className="text-rose-400 text-xs font-mono mt-4">Error: {pzOutputs.error}</div>
                ) : (
                  <div className="bg-navy-dark border border-navy-light rounded-xl p-4 mt-6">
                    <h4 className="text-[10px] font-mono font-bold uppercase text-slate-500 mb-2">Stability Check</h4>
                    <div className="text-sm font-bold text-emerald-accent font-mono">
                      {pzOutputs.stability}
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-8 space-y-6">
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6 flex flex-col items-center">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider self-start pb-2 border-b border-navy-light/40 w-full">Complex Plane</h4>
                  <div className="h-96 w-full max-w-md">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis 
                          type="number" 
                          dataKey="re" 
                          domain={[-5, 5]} 
                          stroke="#64748b" 
                          name="Real" 
                          style={{ fontSize: '11px' }} 
                          tickCount={11}
                        />
                        <YAxis 
                          type="number" 
                          dataKey="im" 
                          domain={[-5, 5]} 
                          stroke="#64748b" 
                          name="Imaginary" 
                          style={{ fontSize: '11px' }} 
                          tickCount={11}
                        />
                        <ZAxis type="number" range={[100, 100]} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} formatter={(val: number) => val.toFixed(2)} />
                        
                        {/* Reference lines for axes */}
                        <ReferenceArea x1={-0.02} x2={0.02} fill="#64748b" fillOpacity={0.5} />
                        <ReferenceArea y1={-0.02} y2={0.02} fill="#64748b" fillOpacity={0.5} />

                        {/* Unit circle for z-domain */}
                        {pzInputs.domain === 'z' && (
                          <Scatter data={unitCircleData} fill="none" stroke="#64748b" line={{ strokeDasharray: '4 4' }} shape={() => <circle r={0} />} name="Unit Circle" />
                        )}

                        <Scatter 
                          name="Zeros" 
                          data={pzOutputs.plotData.filter(d => d.type === 'Zero')} 
                          fill="#38bdf8" 
                          shape="circle" 
                        />
                        <Scatter 
                          name="Poles" 
                          data={pzOutputs.plotData.filter(d => d.type === 'Pole')} 
                          fill="#f43f5e" 
                          shape="cross" 
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-4 text-xs font-mono text-slate-400">
                    <div className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-[#38bdf8] inline-block"></span> Zeros (O)</div>
                    <div className="flex items-center gap-1"><span className="text-[#f43f5e] font-bold text-lg leading-none">×</span> Poles (X)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NYQUIST SAMPLING */}
          {activeTab === 'sampling' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Activity className="h-5 w-5 text-cyan-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Sampling Parameters</h3>
                </div>
                
                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Analog Signal Frequency f_m (Hz)</label>
                    <input type="number" value={sInputs.f_m} onChange={e => setSInputs({...sInputs, f_m: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                  <div className="space-y-1.5 border-t border-navy-light/40 pt-4">
                    <label className="text-slate-400 block">Sampling Frequency f_s (Hz)</label>
                    <input type="number" value={sInputs.f_s} onChange={e => setSInputs({...sInputs, f_s: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                </div>

                <div className="bg-navy-dark border border-navy-light rounded-xl p-4 mt-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-[10px] font-mono uppercase font-bold">Nyquist Rate</span>
                    <span className="text-sm font-bold text-white font-mono">{sOutputs.nyquistRate} Hz</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-navy-light/40 pt-2">
                    <span className="text-slate-300 text-[10px] font-mono uppercase font-bold">Aliased Frequency</span>
                    <span className={`text-sm font-bold font-mono ${sOutputs.aliasedFreq !== null ? 'text-rose-400' : 'text-slate-500'}`}>
                      {sOutputs.aliasedFreq !== null ? `${sOutputs.aliasedFreq.toFixed(1)} Hz` : 'None (No Aliasing)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-6">
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider border-b border-navy-light/40 pb-2">Original vs. Reconstructed Signal</h4>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={sOutputs.plotData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis 
                          dataKey="t" 
                          type="number" 
                          stroke="#64748b" 
                          style={{ fontSize: '11px' }} 
                          tickFormatter={val => val.toFixed(2)}
                          label={{ value: 'Time (s)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} 
                        />
                        <YAxis stroke="#64748b" style={{ fontSize: '11px' }} domain={[-1.2, 1.2]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} 
                          formatter={(value: number) => value ? value.toFixed(3) : ''}
                          labelFormatter={(label: number) => `t = ${label.toFixed(3)}s`} 
                        />
                        <Line type="monotone" dataKey="original" stroke="#64748b" strokeWidth={1} dot={false} name="Original Signal" />
                        <Line type="monotone" dataKey="reconstructed" stroke="#22d3ee" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Reconstructed" />
                        <Scatter dataKey="sampled" fill="#38bdf8" name="Samples" />
                      </ComposedChart>
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
