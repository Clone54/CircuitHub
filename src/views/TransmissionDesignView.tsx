import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cable, TrendingDown, Zap, Search } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

import { useSagTension } from '../hooks/useSagTension';
import { useStringEfficiency } from '../hooks/useStringEfficiency';
import { useCableStress } from '../hooks/useCableStress';

export default function TransmissionDesignView() {
  const [activeTab, setActiveTab] = useState<'sag' | 'insulator' | 'cable'>('sag');

  const { inputs: sagInputs, setInputs: setSagInputs, outputs: sagOutputs } = useSagTension({
    L: 200, Wc: 1.5, Ww: 0.5, Wi: 0.2, UTS: 5000, SF: 2
  });

  const { inputs: strInputs, setInputs: setStrInputs, outputs: strOutputs } = useStringEfficiency({
    n: 5, k: 0.1, Vph: 38.1 // (66kV / sqrt(3) is approx 38.1kV)
  });

  const { inputs: cabInputs, setInputs: setCabInputs, outputs: cabOutputs } = useCableStress({
    r: 5, R: 15, V: 33, eps_r: 3.5
  });

  return (
    <div className="min-h-screen bg-navy-dark text-slate-100 pb-12 font-sans selection:bg-rose-500/30 selection:text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all">
          <ArrowLeft className="h-4 w-4" /> BACK TO HOME
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        <div className="relative rounded-2xl border border-navy-light/60 bg-navy-light/20 p-6 md:p-8 overflow-hidden">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-rose-500/10 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <Zap className="h-4 w-4 animate-pulse" /> EEE 3111 Power Systems I
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
              Transmission <span className="text-amber-400">Design</span> Suite
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
              Overhead Line Sag & Tension, Insulator String Efficiency, and Underground Cable Dielectric Stress.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-navy-light/60 pb-px">
          <button onClick={() => setActiveTab('sag')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'sag' ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Cable className="h-4 w-4" /> Sag & Tension</div>
          </button>
          <button onClick={() => setActiveTab('insulator')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'insulator' ? 'border-amber-400 text-amber-400 bg-amber-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Zap className="h-4 w-4" /> String Efficiency</div>
          </button>
          <button onClick={() => setActiveTab('cable')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'cable' ? 'border-rose-400 text-rose-400 bg-rose-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><TrendingDown className="h-4 w-4" /> Cable Stress</div>
          </button>
        </div>

        {/* TAB 1: Sag & Tension */}
        {activeTab === 'sag' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Cable className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Line Parameters</h3>
              </div>
              <div className="space-y-4 text-xs font-mono">
                <div className="space-y-1.5">
                  <label className="text-slate-400 block">Span Length L (m)</label>
                  <input type="number" value={sagInputs.L} onChange={e => setSagInputs({...sagInputs, L: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block text-[10px]">W_c (kg/m)</label>
                    <input type="number" step="0.1" value={sagInputs.Wc} onChange={e => setSagInputs({...sagInputs, Wc: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block text-[10px]">W_wind (kg/m)</label>
                    <input type="number" step="0.1" value={sagInputs.Ww} onChange={e => setSagInputs({...sagInputs, Ww: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block text-[10px]">W_ice (kg/m)</label>
                    <input type="number" step="0.1" value={sagInputs.Wi} onChange={e => setSagInputs({...sagInputs, Wi: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-navy-light/40 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">UTS (kg)</label>
                    <input type="number" value={sagInputs.UTS} onChange={e => setSagInputs({...sagInputs, UTS: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Safety Factor</label>
                    <input type="number" step="0.5" value={sagInputs.SF} onChange={e => setSagInputs({...sagInputs, SF: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                </div>

                <div className="bg-navy-dark border border-emerald-500/30 rounded-xl p-4 mt-6 space-y-2">
                  <div className="flex justify-between items-center"><span className="text-slate-300">Effective W_e</span><span className="text-emerald-400">{sagOutputs.We.toFixed(3)} kg/m</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-300">Working Tension T</span><span className="text-emerald-400">{sagOutputs.T.toFixed(1)} kg</span></div>
                  <div className="flex justify-between items-center border-t border-navy-light/40 pt-2"><span className="text-slate-300">Maximum Sag</span><span className="text-emerald-400 font-bold">{sagOutputs.Sag.toFixed(2)} m</span></div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 bg-navy-card border border-navy-light/60 p-6 rounded-2xl min-h-[400px] flex flex-col">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-navy-light/40 pb-2">Line Profile</h4>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sagOutputs.plotData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="x" type="number" domain={[-sagInputs.L/2, sagInputs.L/2]} stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Distance from center (m)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Elevation (m) relative to supports', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} formatter={(val: number) => val.toFixed(2)} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" dataKey="y" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={3} name="Conductor Curve" />
                    {/* Tower markers */}
                    <ReferenceLine x={-sagInputs.L/2} stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 3" />
                    <ReferenceLine x={sagInputs.L/2} stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: String Efficiency */}
        {activeTab === 'insulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Zap className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Insulator Config</h3>
              </div>
              <div className="space-y-4 text-xs font-mono">
                <div className="space-y-1.5">
                  <label className="text-slate-400 block">Number of Discs (n)</label>
                  <input type="number" min="2" max="20" value={strInputs.n} onChange={e => setStrInputs({...strInputs, n: parseInt(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 block">Capacitance Ratio (k)</label>
                  <input type="number" step="0.05" value={strInputs.k} onChange={e => setStrInputs({...strInputs, k: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 block">Phase Voltage (kV)</label>
                  <input type="number" value={strInputs.Vph} onChange={e => setStrInputs({...strInputs, Vph: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                </div>

                <div className="bg-navy-dark border border-amber-500/30 rounded-xl p-4 mt-6 space-y-2">
                  <div className="flex justify-between items-center"><span className="text-slate-300">String Efficiency</span><span className="text-amber-400 font-bold">{strOutputs.efficiency.toFixed(2)} %</span></div>
                  {strOutputs.V_discs.length > 0 && (
                    <div className="flex justify-between items-center"><span className="text-slate-300">Max Stress (Bottom Disc)</span><span className="text-amber-400">{strOutputs.V_discs[strOutputs.V_discs.length - 1].toFixed(2)} kV</span></div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 bg-navy-card border border-navy-light/60 p-6 rounded-2xl min-h-[400px] flex flex-col">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-navy-light/40 pb-2">Voltage Distribution Across Discs</h4>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={strOutputs.plotData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="disc" stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Top (Cross-arm) → Bottom (Line Conductor)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Voltage across Disc (kV)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} formatter={(val: number) => val.toFixed(2)} cursor={{ fill: '#1e293b' }} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="voltage" name="Voltage (kV)" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Cable Stress */}
        {activeTab === 'cable' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <TrendingDown className="h-5 w-5 text-rose-400" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Cable Geometry</h3>
              </div>
              <div className="space-y-4 text-xs font-mono">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block text-[10px]">Core Radius r (mm)</label>
                    <input type="number" step="0.5" value={cabInputs.r} onChange={e => setCabInputs({...cabInputs, r: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block text-[10px]">Sheath Radius R (mm)</label>
                    <input type="number" step="0.5" value={cabInputs.R} onChange={e => setCabInputs({...cabInputs, R: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-navy-light/40 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block text-[10px]">Phase Voltage (kV)</label>
                    <input type="number" value={cabInputs.V} onChange={e => setCabInputs({...cabInputs, V: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block text-[10px]">Relative Perm (εr)</label>
                    <input type="number" step="0.1" value={cabInputs.eps_r} onChange={e => setCabInputs({...cabInputs, eps_r: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                </div>
                
                <div className="bg-navy-dark border border-rose-500/30 rounded-xl p-4 mt-6 space-y-2">
                  <div className="flex justify-between items-center"><span className="text-slate-300">Max Stress (g_max)</span><span className="text-rose-400 font-bold">{cabOutputs.g_max.toFixed(2)} kV/mm</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-300">Min Stress (g_min)</span><span className="text-rose-400">{cabOutputs.g_min.toFixed(2)} kV/mm</span></div>
                  <div className="flex justify-between items-center border-t border-navy-light/40 pt-2 mt-2"><span className="text-slate-300">Capacitance</span><span className="text-rose-400">{cabOutputs.C_km.toFixed(4)} μF/km</span></div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 bg-navy-card border border-navy-light/60 p-6 rounded-2xl min-h-[400px] flex flex-col">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-navy-light/40 pb-2">Dielectric Stress Distribution</h4>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cabOutputs.plotData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="x" type="number" domain={['dataMin', 'dataMax']} stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Distance from center x (mm)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Stress g(x) [kV/mm]', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} formatter={(val: number) => val.toFixed(3)} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" dataKey="g" stroke="#fb7185" fill="#fb7185" fillOpacity={0.2} strokeWidth={3} name="Dielectric Stress Gradient" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
