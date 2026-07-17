import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  Zap,
  Gauge,
  Cpu,
  Power
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
  ComposedChart
} from 'recharts';

import { useDCMotor } from '../hooks/useDCMotor';
import { useTransformerAnalytics } from '../hooks/useTransformerAnalytics';
import { useDCStarter } from '../hooks/useDCStarter';

type TabId = 'dcmotor' | 'transformer' | 'dcstarter';

export default function MachineToolsView() {
  const [activeTab, setActiveTab] = useState<TabId>('dcmotor');

  // --- Hook: DC Motor ---
  const { inputs: dcInputs, setInputs: setDcInputs, outputs: dcOutputs } = useDCMotor({
    type: 'Shunt',
    V: 220,
    Ra: 0.5,
    Rf: 110,
    N_rated: 1500,
    I_rated: 20
  });

  // --- Hook: Transformer ---
  const { inputs: tInputs, setInputs: setTInputs, outputs: tOutputs } = useTransformerAnalytics({
    S: 50,
    V1: 2400,
    V2: 240,
    Pi: 300,
    Pcu: 600,
    Req: 0.015,
    Xeq: 0.035
  });

  // --- Hook: DC Starter ---
  const { inputs: sInputs, setInputs: setSInputs, outputs: sOutputs } = useDCStarter({
    V: 220,
    Ra: 0.4,
    I_max: 50,
    I_min: 30
  });

  return (
    <div className="min-h-screen bg-navy-dark text-slate-100 pb-12 font-sans selection:bg-rose-500/30 selection:text-white">
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
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-rose-500/5 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-amber-500/5 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <Zap className="h-4 w-4 animate-pulse" /> EEE 2207 Electrical Machines I
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
              Machines <span className="text-rose-400">Analysis</span> Suite
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
              Analyze DC motor characteristics, calculate transformer efficiency and regulation, and design DC motor starters.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-navy-light/60 pb-px">
          <button onClick={() => setActiveTab('dcmotor')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'dcmotor' ? 'border-rose-400 text-rose-400 bg-rose-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Gauge className="h-4 w-4" /> DC Motor Characteristics</div>
          </button>
          <button onClick={() => setActiveTab('transformer')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'transformer' ? 'border-amber-400 text-amber-400 bg-amber-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Cpu className="h-4 w-4" /> Transformer Analytics</div>
          </button>
          <button onClick={() => setActiveTab('dcstarter')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'dcstarter' ? 'border-indigo-400 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Power className="h-4 w-4" /> DC Starter Grader</div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          
          {/* TAB 1: DC MOTOR */}
          {activeTab === 'dcmotor' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Gauge className="h-5 w-5 text-rose-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Motor Parameters</h3>
                </div>
                
                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Motor Type</label>
                    <select value={dcInputs.type} onChange={e => setDcInputs({...dcInputs, type: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white">
                      <option value="Shunt">DC Shunt Motor</option>
                      <option value="Series">DC Series Motor</option>
                      <option value="Compound">DC Cumulative Compound</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Voltage (V)</label>
                      <input type="number" value={dcInputs.V} onChange={e => setDcInputs({...dcInputs, V: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">R_a (Ω)</label>
                      <input type="number" step="0.01" value={dcInputs.Ra} onChange={e => setDcInputs({...dcInputs, Ra: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">R_f (Ω)</label>
                      <input type="number" value={dcInputs.Rf} onChange={e => setDcInputs({...dcInputs, Rf: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Rated I (A)</label>
                      <input type="number" value={dcInputs.I_rated} onChange={e => setDcInputs({...dcInputs, I_rated: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                  </div>
                  <div className="space-y-1.5 border-t border-navy-light/40 pt-4">
                    <label className="text-slate-400 block">Rated Speed (RPM)</label>
                    <input type="number" value={dcInputs.N_rated} onChange={e => setDcInputs({...dcInputs, N_rated: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Speed-Torque Chart */}
                  <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">Speed vs Torque</h4>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dcOutputs.plotData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis 
                            dataKey="T" 
                            type="number" 
                            stroke="#64748b" 
                            style={{ fontSize: '11px' }} 
                            label={{ value: 'Torque (N·m)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} 
                          />
                          <YAxis 
                            dataKey="N" 
                            stroke="#64748b" 
                            style={{ fontSize: '11px' }} 
                            label={{ value: 'Speed (RPM)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} 
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} 
                            formatter={(val: number) => val.toFixed(1)}
                            labelFormatter={(label: number) => `Torque = ${label.toFixed(1)} N·m`}
                          />
                          <Line type="monotone" dataKey="N" stroke="#f43f5e" strokeWidth={2} dot={false} name="Speed (RPM)" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* N and T vs Ia Chart */}
                  <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">Performance vs Armature Current</h4>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={dcOutputs.plotData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis 
                            dataKey="Ia" 
                            type="number" 
                            stroke="#64748b" 
                            style={{ fontSize: '11px' }} 
                            label={{ value: 'Armature Current Ia (A)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} 
                          />
                          <YAxis yAxisId="left" stroke="#f43f5e" style={{ fontSize: '11px' }} />
                          <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" style={{ fontSize: '11px' }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} 
                            formatter={(val: number) => val.toFixed(1)}
                            labelFormatter={(label: number) => `Ia = ${label.toFixed(1)} A`}
                          />
                          <Line yAxisId="left" type="monotone" dataKey="N" stroke="#f43f5e" strokeWidth={2} dot={false} name="Speed (RPM)" />
                          <Line yAxisId="right" type="monotone" dataKey="T" stroke="#38bdf8" strokeWidth={2} dot={false} name="Torque (N·m)" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRANSFORMER */}
          {activeTab === 'transformer' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Cpu className="h-5 w-5 text-amber-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Transformer Ratings</h3>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">S (kVA)</label>
                      <input type="number" value={tInputs.S} onChange={e => setTInputs({...tInputs, S: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">V1 (V)</label>
                      <input type="number" value={tInputs.V1} onChange={e => setTInputs({...tInputs, V1: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">V2 (V)</label>
                      <input type="number" value={tInputs.V2} onChange={e => setTInputs({...tInputs, V2: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-navy-light/40 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Core Loss Pi (W)</label>
                      <input type="number" value={tInputs.Pi} onChange={e => setTInputs({...tInputs, Pi: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">FL Cu Loss Pcu (W)</label>
                      <input type="number" value={tInputs.Pcu} onChange={e => setTInputs({...tInputs, Pcu: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-navy-light/40 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Req (Ω)</label>
                      <input type="number" step="0.001" value={tInputs.Req} onChange={e => setTInputs({...tInputs, Req: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Xeq (Ω)</label>
                      <input type="number" step="0.001" value={tInputs.Xeq} onChange={e => setTInputs({...tInputs, Xeq: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-navy-dark border border-navy-light rounded-xl p-4 mt-6">
                  <h4 className="text-[10px] font-mono font-bold uppercase text-slate-500 mb-2">Maximum Efficiency</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 text-xs font-mono">Occurs at Load</span>
                      <span className="text-sm font-bold text-amber-400 font-mono">{(tOutputs.maxEffFraction * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-navy-light/40 pt-2">
                      <span className="text-slate-300 text-xs font-mono">Max Efficiency</span>
                      <span className="text-sm font-bold text-amber-400 font-mono">{tOutputs.maxEffValue.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Efficiency Chart */}
                  <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">Efficiency vs Load (0.8 PF Lag)</h4>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={tOutputs.effData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis 
                            dataKey="load" 
                            type="number" 
                            stroke="#64748b" 
                            style={{ fontSize: '11px' }} 
                            label={{ value: 'Load (%)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} 
                          />
                          <YAxis 
                            domain={['auto', 100]}
                            stroke="#64748b" 
                            style={{ fontSize: '11px' }} 
                            label={{ value: 'Efficiency (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} 
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} 
                            formatter={(val: number) => val.toFixed(2) + '%'}
                            labelFormatter={(label: number) => `Load = ${label}%`}
                          />
                          <Area type="monotone" dataKey="efficiency" stroke="#fbbf24" strokeWidth={2} fillOpacity={0.2} fill="#fbbf24" name="Efficiency" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Regulation Chart */}
                  <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">Voltage Regulation vs PF Angle</h4>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={tOutputs.regData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis 
                            dataKey="angle" 
                            type="number" 
                            stroke="#64748b" 
                            style={{ fontSize: '11px' }} 
                            tickFormatter={(val) => val === 0 ? '0°' : (val > 0 ? `+${val}°` : `${val}°`)}
                            label={{ value: 'Power Factor Angle (Lead -> Lag)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} 
                          />
                          <YAxis 
                            stroke="#64748b" 
                            style={{ fontSize: '11px' }} 
                            label={{ value: 'Regulation (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} 
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} 
                            formatter={(val: number) => val.toFixed(2) + '%'}
                            labelFormatter={(label: number, payload: any) => payload.length > 0 ? `PF: ${payload[0].payload.pfStr}` : `Angle: ${label}°`}
                          />
                          <Line type="monotone" dataKey="regulation" stroke="#38bdf8" strokeWidth={2} dot={false} name="Regulation" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DC STARTER */}
          {activeTab === 'dcstarter' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Power className="h-5 w-5 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Starter Parameters</h3>
                </div>
                
                <div className="space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Supply V (V)</label>
                      <input type="number" value={sInputs.V} onChange={e => setSInputs({...sInputs, V: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Armature Ra (Ω)</label>
                      <input type="number" step="0.01" value={sInputs.Ra} onChange={e => setSInputs({...sInputs, Ra: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-navy-light/40 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">I_max (A)</label>
                      <input type="number" value={sInputs.I_max} onChange={e => setSInputs({...sInputs, I_max: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">I_min (A)</label>
                      <input type="number" value={sInputs.I_min} onChange={e => setSInputs({...sInputs, I_min: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-navy-dark border border-navy-light rounded-xl p-4 mt-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-[10px] font-mono uppercase font-bold">Number of Studs (n)</span>
                    <span className="text-lg font-bold text-indigo-400 font-mono">{sOutputs.n}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-navy-light/40 pt-2">
                    <span className="text-slate-300 text-[10px] font-mono uppercase font-bold">Ratio (α)</span>
                    <span className="text-sm font-bold text-indigo-400 font-mono">{sOutputs.alpha.toFixed(3)}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-6">
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider border-b border-navy-light/40 pb-2">Grading of Starting Resistance</h4>
                  
                  {sOutputs.n > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                      {/* Diagram */}
                      <div className="bg-navy-dark/50 border border-navy-light/40 rounded-xl p-6 flex flex-col items-center justify-center">
                        <svg viewBox="0 0 400 150" className="w-full max-w-sm">
                          {/* Armature */}
                          <circle cx="340" cy="75" r="25" fill="none" stroke="#a78bfa" strokeWidth="2" />
                          <text x="340" y="80" fill="#a78bfa" fontSize="14" textAnchor="middle" fontFamily="monospace">Arm</text>
                          <line x1="340" y1="50" x2="340" y2="20" stroke="#a78bfa" strokeWidth="2" />
                          <line x1="340" y1="100" x2="340" y2="130" stroke="#a78bfa" strokeWidth="2" />

                          {/* Resistors */}
                          <path d="M 40 75 L 60 75 L 65 60 L 75 90 L 85 60 L 95 90 L 105 60 L 115 90 L 120 75 L 140 75" fill="none" stroke="#38bdf8" strokeWidth="2" />
                          <text x="80" y="45" fill="#38bdf8" fontSize="12" textAnchor="middle">r1</text>
                          
                          <path d="M 140 75 L 160 75 L 165 60 L 175 90 L 185 60 L 195 90 L 205 60 L 215 90 L 220 75 L 240 75" fill="none" stroke="#38bdf8" strokeWidth="2" />
                          <text x="180" y="45" fill="#38bdf8" fontSize="12" textAnchor="middle">r2</text>

                          <path d="M 240 75 L 260 75 L 265 60 L 275 90 L 285 60 L 295 90 L 305 60 L 315 90 L 315 75 L 315 75" fill="none" stroke="#38bdf8" strokeWidth="2" />
                          <text x="280" y="45" fill="#38bdf8" fontSize="12" textAnchor="middle">r3...</text>

                          {/* Connections */}
                          <line x1="20" y1="75" x2="40" y2="75" stroke="#94a3b8" strokeWidth="2" />
                          <line x1="315" y1="75" x2="315" y2="75" stroke="#94a3b8" strokeWidth="2" />
                        </svg>
                        <p className="text-xs text-slate-500 font-mono mt-4 text-center">
                          Sections (r1, r2, ...) are cut out sequentially as the motor accelerates.
                        </p>
                      </div>

                      {/* Table */}
                      <div className="overflow-hidden rounded-xl border border-navy-light/40">
                        <table className="w-full text-left border-collapse font-mono text-xs">
                          <thead>
                            <tr className="bg-navy-dark/80">
                              <th className="p-3 border-b border-navy-light/40 text-slate-400 font-bold">Stud (m)</th>
                              <th className="p-3 border-b border-navy-light/40 text-slate-400 font-bold">Section r (Ω)</th>
                              <th className="p-3 border-b border-navy-light/40 text-slate-400 font-bold">Total R_m (Ω)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sOutputs.sections.map((sec, idx) => (
                              <tr key={idx} className="hover:bg-navy-light/10 transition-colors">
                                <td className="p-3 border-b border-navy-light/20 text-indigo-300">
                                  {sec.step === sOutputs.n ? `${sec.step} (Final)` : sec.step}
                                </td>
                                <td className="p-3 border-b border-navy-light/20 text-slate-200">
                                  {sec.r > 0 ? sec.r.toFixed(3) : '-'}
                                </td>
                                <td className="p-3 border-b border-navy-light/20 text-slate-200 font-bold">
                                  {sec.R_total.toFixed(3)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8 text-slate-500 font-mono text-sm">
                      Invalid parameters. Ensure I_max &gt; I_min and Ra &gt; 0.
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
