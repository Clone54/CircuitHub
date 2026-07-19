import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Repeat, Activity, Zap, Activity as Wave } from 'lucide-react';
import { LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart } from 'recharts';

import { useInductionMotor } from '../hooks/useInductionMotor';
import { useParallelGenerators } from '../hooks/useParallelGenerators';
import { useSynchronousMachine } from '../hooks/useSynchronousMachine';

export default function ACMachinesView() {
  const [activeTab, setActiveTab] = useState<'im' | 'parallel' | 'sync'>('im');

  const { inputs: imInputs, setInputs: setImInputs, outputs: imOutputs } = useInductionMotor({
    V_nl: 400, I_nl: 5, P_nl: 350,
    V_br: 100, I_br: 15, P_br: 1200,
    R1: 1.5, P: 4, f: 50, R_ext: 0
  });

  const { inputs: pgInputs, setInputs: setPgInputs, outputs: pgOutputs } = useParallelGenerators({
    fnl1: 51, sp1: 1, fnl2: 51.5, sp2: 1.5, Ptotal: 4
  });

  const { inputs: smInputs, setInputs: setSmInputs, outputs: smOutputs } = useSynchronousMachine({
    type: 'Generator', V_term: 415, S_rated: 100, Ra: 0.1, Xs: 1.5, PF: 0.8, pfType: 'Lagging'
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
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <Repeat className="h-4 w-4 animate-pulse" /> EEE 3107 Electrical Machines II
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
              AC Machines <span className="text-emerald-400">&</span> Analysis Suite
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
              3-Phase Induction Motors, Synchronous Generators (Alternators), and V-Curve Analysis for Synchronous Motors.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-navy-light/60 pb-px">
          <button onClick={() => setActiveTab('im')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'im' ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Repeat className="h-4 w-4" /> Induction Motor</div>
          </button>
          <button onClick={() => setActiveTab('parallel')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'parallel' ? 'border-rose-400 text-rose-400 bg-rose-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Activity className="h-4 w-4" /> Parallel Alternators</div>
          </button>
          <button onClick={() => setActiveTab('sync')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'sync' ? 'border-blue-400 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Zap className="h-4 w-4" /> Synchronous Machine</div>
          </button>
        </div>

        {/* TAB 1: Induction Motor */}
        {activeTab === 'im' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Repeat className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Test Parameters</h3>
              </div>
              <div className="space-y-4 text-xs font-mono">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-slate-400 block text-[10px]">V_nl (V)</label>
                    <input type="number" value={imInputs.V_nl} onChange={e => setImInputs({...imInputs, V_nl: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 block text-[10px]">I_nl (A)</label>
                    <input type="number" value={imInputs.I_nl} onChange={e => setImInputs({...imInputs, I_nl: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 block text-[10px]">P_nl (W)</label>
                    <input type="number" value={imInputs.P_nl} onChange={e => setImInputs({...imInputs, P_nl: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-navy-light/40 pt-2">
                  <div className="space-y-1">
                    <label className="text-slate-400 block text-[10px]">V_br (V)</label>
                    <input type="number" value={imInputs.V_br} onChange={e => setImInputs({...imInputs, V_br: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 block text-[10px]">I_br (A)</label>
                    <input type="number" value={imInputs.I_br} onChange={e => setImInputs({...imInputs, I_br: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 block text-[10px]">P_br (W)</label>
                    <input type="number" value={imInputs.P_br} onChange={e => setImInputs({...imInputs, P_br: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-navy-light/40 pt-2">
                   <div className="space-y-1">
                    <label className="text-slate-400 block text-[10px]">Stator R1 (Ω)</label>
                    <input type="number" step="0.1" value={imInputs.R1} onChange={e => setImInputs({...imInputs, R1: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 block text-[10px]">Poles (P)</label>
                    <input type="number" value={imInputs.P} onChange={e => setImInputs({...imInputs, P: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                </div>
                
                <div className="bg-navy-dark border border-emerald-500/30 rounded-xl p-4 mt-6 space-y-2">
                  <h4 className="text-[10px] font-mono font-bold uppercase text-slate-500 mb-2">Equivalent Circuit</h4>
                  <div className="flex justify-between items-center"><span className="text-slate-300">Rc</span><span className="text-emerald-400">{imOutputs.Rc.toFixed(2)} Ω</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-300">Xm</span><span className="text-emerald-400">{imOutputs.Xm.toFixed(2)} Ω</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-300">R2'</span><span className="text-emerald-400">{imOutputs.R2.toFixed(2)} Ω</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-300">X1 = X2'</span><span className="text-emerald-400">{imOutputs.X2.toFixed(2)} Ω</span></div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-8 bg-navy-card border border-navy-light/60 p-6 rounded-2xl min-h-[400px] flex flex-col">
              <div className="flex justify-between items-center mb-4 border-b border-navy-light/40 pb-2">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">Torque-Speed Characteristic</h4>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-mono text-slate-400">Add External Rotor R (Ω):</label>
                  <input type="range" min="0" max="10" step="0.5" value={imInputs.R_ext} onChange={e => setImInputs({...imInputs, R_ext: parseFloat(e.target.value)})} className="w-24 accent-emerald-500" />
                  <span className="text-xs font-mono text-emerald-400">{imInputs.R_ext.toFixed(1)} Ω</span>
                </div>
              </div>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={imOutputs.plotData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="N" type="number" stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Speed (RPM)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Torque (Nm)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} formatter={(val: number) => val.toFixed(2)} />
                    <Line type="monotone" dataKey="Torque" stroke="#34d399" strokeWidth={3} dot={false} name="Torque" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Parallel Alternators */}
        {activeTab === 'parallel' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Activity className="h-5 w-5 text-rose-400" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Alternator Settings</h3>
              </div>
              <div className="space-y-4 text-xs font-mono">
                <div className="space-y-2 border border-navy-light/40 p-3 rounded bg-navy-dark">
                  <h4 className="text-rose-400 font-bold">Generator 1</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 block text-[10px]">No-load Freq (Hz)</label>
                      <input type="number" step="0.1" value={pgInputs.fnl1} onChange={e => setPgInputs({...pgInputs, fnl1: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                    </div>
                    <div>
                      <label className="text-slate-400 block text-[10px]">Droop (MW/Hz)</label>
                      <input type="number" step="0.1" value={pgInputs.sp1} onChange={e => setPgInputs({...pgInputs, sp1: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border border-navy-light/40 p-3 rounded bg-navy-dark">
                  <h4 className="text-rose-400 font-bold">Generator 2</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 block text-[10px]">No-load Freq (Hz)</label>
                      <input type="number" step="0.1" value={pgInputs.fnl2} onChange={e => setPgInputs({...pgInputs, fnl2: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                    </div>
                    <div>
                      <label className="text-slate-400 block text-[10px]">Droop (MW/Hz)</label>
                      <input type="number" step="0.1" value={pgInputs.sp2} onChange={e => setPgInputs({...pgInputs, sp2: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-navy-light/40">
                  <label className="text-slate-400 block">Total System Load (MW)</label>
                  <input type="number" step="0.5" value={pgInputs.Ptotal} onChange={e => setPgInputs({...pgInputs, Ptotal: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white text-base" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 bg-navy-card border border-navy-light/60 p-6 rounded-2xl min-h-[400px] flex flex-col">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-navy-light/40 pb-2">House Diagram (Frequency vs Power)</h4>
              
              <div className="flex gap-6 mb-4 text-xs font-mono">
                <div className="bg-navy-dark border border-rose-500/30 px-4 py-2 rounded">
                  <span className="text-slate-400 block text-[10px]">System Freq</span>
                  <span className="text-rose-400 font-bold text-lg">{pgOutputs.fsys.toFixed(2)} Hz</span>
                </div>
                <div className="bg-navy-dark border border-blue-500/30 px-4 py-2 rounded">
                  <span className="text-slate-400 block text-[10px]">Gen 1 Load</span>
                  <span className="text-blue-400 font-bold text-lg">{pgOutputs.P1.toFixed(2)} MW</span>
                </div>
                <div className="bg-navy-dark border border-emerald-500/30 px-4 py-2 rounded">
                  <span className="text-slate-400 block text-[10px]">Gen 2 Load</span>
                  <span className="text-emerald-400 font-bold text-lg">{pgOutputs.P2.toFixed(2)} MW</span>
                </div>
              </div>

              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={pgOutputs.plotData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="P" type="number" domain={[0, 'dataMax']} stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Power (MW)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis domain={['auto', 'auto']} stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Frequency (Hz)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} formatter={(val: number) => val.toFixed(2)} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="Gen1_Freq" stroke="#3b82f6" strokeWidth={2} dot={false} name="Gen 1 (from left)" />
                    <Line type="monotone" dataKey="Gen2_Freq" stroke="#10b981" strokeWidth={2} dot={false} name="Gen 2 (from right)" />
                    {/* Intersection Point marker */}
                    <Scatter data={[{ P: pgOutputs.P1, Freq: pgOutputs.fsys }]} fill="#fb7185" name="Operating Point" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Synchronous Machine */}
        {activeTab === 'sync' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Zap className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Machine Ratings</h3>
              </div>
              <div className="space-y-4 text-xs font-mono">
                <div className="space-y-1.5">
                  <label className="text-slate-400 block">Machine Type</label>
                  <select value={smInputs.type} onChange={e => setSmInputs({...smInputs, type: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white">
                    <option value="Generator">Alternator (Generator)</option>
                    <option value="Motor">Synchronous Motor</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block text-[10px]">V_term (V_LL)</label>
                    <input type="number" value={smInputs.V_term} onChange={e => setSmInputs({...smInputs, V_term: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block text-[10px]">Rated Power (MVA)</label>
                    <input type="number" value={smInputs.S_rated} onChange={e => setSmInputs({...smInputs, S_rated: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block text-[10px]">Ra (Ω)</label>
                    <input type="number" step="0.01" value={smInputs.Ra} onChange={e => setSmInputs({...smInputs, Ra: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block text-[10px]">Xs (Ω)</label>
                    <input type="number" step="0.1" value={smInputs.Xs} onChange={e => setSmInputs({...smInputs, Xs: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-navy-light/40 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block text-[10px]">Power Factor</label>
                    <input type="number" step="0.05" min="0" max="1" value={smInputs.PF} onChange={e => setSmInputs({...smInputs, PF: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block text-[10px]">Type</label>
                    <select value={smInputs.pfType} onChange={e => setSmInputs({...smInputs, pfType: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white">
                      <option value="Lagging">Lagging</option>
                      <option value="Leading">Leading</option>
                      <option value="Unity">Unity</option>
                    </select>
                  </div>
                </div>

                <div className="bg-navy-dark border border-blue-500/30 rounded-xl p-4 mt-6 space-y-2">
                  <div className="flex justify-between items-center"><span className="text-slate-300">Phase Voltage</span><span className="text-blue-400">{smOutputs.Vphase.toFixed(1)} V</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-300">Armature Current</span><span className="text-blue-400">{smOutputs.Ia_mag.toFixed(1)} A</span></div>
                  <div className="flex justify-between items-center border-t border-navy-light/40 pt-2"><span className="text-slate-300">Induced EMF (Ea)</span><span className="text-blue-400 font-bold">{smOutputs.Ea_mag.toFixed(1)} V</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-300">Voltage Regulation</span><span className="text-blue-400 font-bold">{smOutputs.Reg.toFixed(2)} %</span></div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 bg-navy-card border border-navy-light/60 p-6 rounded-2xl min-h-[400px] flex flex-col">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-navy-light/40 pb-2">
                {smInputs.type === 'Motor' ? 'V-Curves & Inverted V-Curves' : 'Synchronous Impedance Diagram Preview'}
              </h4>
              
              {smInputs.type === 'Motor' ? (
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={smOutputs.vCurveData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="Ea" type="number" domain={['dataMin', 'dataMax']} stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Excitation Voltage Ea (V)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis yAxisId="left" stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Armature Current Ia (A)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Power Factor', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} formatter={(val: number) => val.toFixed(2)} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                      <Line yAxisId="left" type="monotone" dataKey="Ia" stroke="#3b82f6" strokeWidth={3} dot={false} name="V-Curve (Ia)" />
                      <Line yAxisId="right" type="monotone" dataKey="PF" stroke="#f59e0b" strokeWidth={3} dot={false} name="Inv V-Curve (PF)" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 font-mono text-sm border border-dashed border-navy-light/50 rounded-xl p-8 text-center space-y-4">
                  <p>V-Curves are typically plotted for Synchronous Motors.</p>
                  <p>For an Alternator (Generator), observe the Voltage Regulation in the panel on the left.</p>
                  <p className="text-blue-400">Lagging PF → Positive Regulation</p>
                  <p className="text-amber-400">Leading PF → Negative Regulation</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
