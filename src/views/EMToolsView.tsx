import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  Radio,
  Wifi,
  Waves,
  Cpu,
  RefreshCw,
  Send
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
  Legend
} from 'recharts';

import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

import { usePlaneWave } from '../hooks/usePlaneWave';
import { useBoundaryConditions } from '../hooks/useBoundaryConditions';

type TabId = 'planewave' | 'boundary' | 'vectorsolver';

export default function EMToolsView() {
  const [activeTab, setActiveTab] = useState<TabId>('planewave');

  // --- Hook: Plane Wave ---
  const { inputs: pwInputs, setInputs: setPwInputs, outputs: pwOutputs } = usePlaneWave({
    f_MHz: 1000,
    eps_r: 4.5,
    mu_r: 1,
    sigma: 0.01
  });

  // --- Hook: Boundary Conditions ---
  const { inputs: bInputs, setInputs: setBInputs, outputs: bOutputs } = useBoundaryConditions({
    eps_r1: 1,
    eps_r2: 4,
    polarization: 'TM'
  });

  // --- Vector Solver State ---
  const [vectorField, setVectorField] = useState('y*z ax + x*z ay + x*y az');
  const [vectorOp, setVectorOp] = useState('Divergence');
  const [solverResult, setSolverResult] = useState('');
  const [solverLoading, setSolverLoading] = useState(false);

  const handleVectorSolve = async () => {
    if (!vectorField) return;
    setSolverLoading(true);
    setSolverResult('');
    try {
      const res = await fetch('/api/solve-vector-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: vectorField, operation: vectorOp })
      });
      const data = await res.json();
      setSolverResult(data.reply);
    } catch (e) {
      setSolverResult('Error reaching solver API.');
    } finally {
      setSolverLoading(false);
    }
  };

  const formatSci = (val: number) => {
    if (val === 0 || !isFinite(val)) return '0';
    if (val < 0.01 || val > 10000) return val.toExponential(2).replace('e+', ' × 10^').replace('e', ' × 10^');
    return val.toFixed(2);
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
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-indigo-500/5 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-violet-500/5 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <Radio className="h-4 w-4 animate-pulse" /> EEE 2107 Electromagnetic Fields and Waves
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
              Electromagnetics <span className="text-indigo-400">Analysis</span> Suite
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
              Explore plane wave propagation, analyze dielectric boundary reflections, and utilize AI for advanced vector calculus operations.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-navy-light/60 pb-px">
          <button onClick={() => setActiveTab('planewave')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'planewave' ? 'border-indigo-400 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Wifi className="h-4 w-4" /> Plane Waves</div>
          </button>
          <button onClick={() => setActiveTab('boundary')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'boundary' ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Waves className="h-4 w-4" /> Boundary Conditions</div>
          </button>
          <button onClick={() => setActiveTab('vectorsolver')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'vectorsolver' ? 'border-emerald-accent text-emerald-accent bg-emerald-accent/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Activity className="h-4 w-4" /> Vector Solver</div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          
          {/* TAB 1: PLANE WAVE */}
          {activeTab === 'planewave' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Wifi className="h-5 w-5 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Wave & Material Specs</h3>
                </div>
                
                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Frequency (MHz)</label>
                    <input type="number" value={pwInputs.f_MHz} onChange={e => setPwInputs({...pwInputs, f_MHz: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Relative Permittivity (ε_r)</label>
                    <input type="number" value={pwInputs.eps_r} onChange={e => setPwInputs({...pwInputs, eps_r: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Relative Permeability (μ_r)</label>
                    <input type="number" value={pwInputs.mu_r} onChange={e => setPwInputs({...pwInputs, mu_r: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                  <div className="space-y-1.5 border-t border-navy-light/40 pt-4">
                    <label className="text-slate-400 block">Conductivity σ (S/m)</label>
                    <input type="number" value={pwInputs.sigma} onChange={e => setPwInputs({...pwInputs, sigma: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-6">
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b border-navy-light/40">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">Propagation Characteristics</h4>
                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {pwOutputs.classification}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block mb-1">Attenuation (α)</span>
                      <span className="text-sm font-bold text-white font-mono block">{formatSci(pwOutputs.alpha)} <span className="text-[10px] text-slate-400">Np/m</span></span>
                    </div>
                    <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block mb-1">Phase Const (β)</span>
                      <span className="text-sm font-bold text-white font-mono block">{formatSci(pwOutputs.beta)} <span className="text-[10px] text-slate-400">rad/m</span></span>
                    </div>
                    <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block mb-1">Skin Depth (δ)</span>
                      <span className="text-sm font-bold text-white font-mono block">{formatSci(pwOutputs.delta)} <span className="text-[10px] text-slate-400">m</span></span>
                    </div>
                    <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block mb-1">Impedance (η)</span>
                      <span className="text-sm font-bold text-white font-mono block">{formatSci(pwOutputs.eta_mag)}∠{pwOutputs.eta_angle.toFixed(1)}° <span className="text-[10px] text-slate-400">Ω</span></span>
                    </div>
                  </div>

                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider border-b border-navy-light/40 pb-2 mt-6">Electric Field Attenuation E(z)</h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={pwOutputs.plotData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <defs>
                          <linearGradient id="colorE" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis 
                          dataKey="z" 
                          type="number" 
                          stroke="#64748b" 
                          style={{ fontSize: '11px' }} 
                          tickFormatter={(v)=> v.toExponential(1)} 
                          label={{ value: 'Distance z (m)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} 
                        />
                        <YAxis stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Normalized E-Field Amplitude', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} 
                          formatter={(value: number) => value.toFixed(4)} 
                          labelFormatter={(label: number) => `z = ${label.toExponential(2)} m`} 
                        />
                        <Area type="monotone" dataKey="E" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorE)" name="Amplitude" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BOUNDARY CONDITIONS */}
          {activeTab === 'boundary' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Waves className="h-5 w-5 text-cyan-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Dielectric Interface</h3>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Polarization</label>
                    <select value={bInputs.polarization} onChange={e => setBInputs({...bInputs, polarization: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white">
                      <option value="TM">Parallel (TM)</option>
                      <option value="TE">Perpendicular (TE)</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Medium 1 (ε_r1)</label>
                      <input type="number" value={bInputs.eps_r1} onChange={e => setBInputs({...bInputs, eps_r1: parseFloat(e.target.value)||1})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Medium 2 (ε_r2)</label>
                      <input type="number" value={bInputs.eps_r2} onChange={e => setBInputs({...bInputs, eps_r2: parseFloat(e.target.value)||1})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-navy-dark border border-navy-light rounded-xl p-4 mt-6">
                  <h4 className="text-[10px] font-mono font-bold uppercase text-slate-500 mb-2">Special Angles</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 text-xs font-mono">Brewster Angle (θb)</span>
                      <span className="text-sm font-bold text-cyan-400 font-mono">{bOutputs.theta_b.toFixed(2)}°</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-navy-light/40 pt-2">
                      <span className="text-slate-300 text-xs font-mono">Critical Angle (θc)</span>
                      <span className="text-sm font-bold text-rose-400 font-mono">{bOutputs.theta_c !== undefined ? bOutputs.theta_c.toFixed(2) + '°' : 'None'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-6">
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider border-b border-navy-light/40 pb-2">Reflection Coefficient vs. Incident Angle</h4>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={bOutputs.plotData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis 
                          dataKey="theta_i" 
                          type="number" 
                          stroke="#64748b" 
                          style={{ fontSize: '11px' }} 
                          domain={[0, 90]}
                          ticks={[0, 15, 30, 45, 60, 75, 90]}
                          label={{ value: 'Incident Angle θi (Degrees)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} 
                        />
                        <YAxis stroke="#64748b" style={{ fontSize: '11px' }} domain={[-1, 1]} label={{ value: 'Reflection Coefficient (Γ)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} 
                          formatter={(value: number) => value.toFixed(4)} 
                          labelFormatter={(label: number) => `θi = ${label}°`} 
                        />
                        {/* Reference lines for Brewster and Critical angles */}
                        <Line type="monotone" dataKey="gamma" stroke="#22d3ee" strokeWidth={2} dot={false} name="Γ (Gamma)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VECTOR SOLVER */}
          {activeTab === 'vectorsolver' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-12 space-y-6">
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                    <Activity className="h-5 w-5 text-emerald-accent" />
                    <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Agentic Vector Calculus Solver</h3>
                  </div>

                  <p className="text-sm text-slate-400">
                    Input a spatial vector field (in Cartesian coordinates using x, y, z) and select an operation. The AI engine will provide a step-by-step derivation.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-1.5">
                      <label className="text-xs text-slate-400 font-mono block">Vector Field Expression (E)</label>
                      <input 
                        type="text" 
                        value={vectorField} 
                        onChange={(e) => setVectorField(e.target.value)}
                        placeholder="e.g., y*z ax + x*z ay + x*y az"
                        className="w-full bg-navy-dark border border-navy-light rounded px-4 py-3 text-white font-mono text-sm focus:border-emerald-accent/50 focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="w-full sm:w-48 space-y-1.5">
                      <label className="text-xs text-slate-400 font-mono block">Operation</label>
                      <select 
                        value={vectorOp} 
                        onChange={(e) => setVectorOp(e.target.value)}
                        className="w-full bg-navy-dark border border-navy-light rounded px-4 py-3 text-white font-mono text-sm focus:border-emerald-accent/50 focus:outline-none transition-colors"
                      >
                        <option value="Divergence">Divergence (∇·E)</option>
                        <option value="Curl">Curl (∇×E)</option>
                        <option value="Gradient">Gradient (∇E)</option>
                        <option value="Laplacian">Laplacian (∇²E)</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button 
                        onClick={handleVectorSolve}
                        disabled={solverLoading || !vectorField}
                        className="h-[46px] px-6 bg-emerald-accent hover:bg-emerald-accent/90 text-navy-dark font-bold rounded flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {solverLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        SOLVE
                      </button>
                    </div>
                  </div>
                </div>

                {/* Solver Result Area */}
                {solverResult && (
                  <div className="bg-navy-dark border border-emerald-accent/20 rounded-2xl p-6 md:p-8 animate-fadeIn max-h-[500px] overflow-y-auto">
                    <div className="prose prose-invert prose-emerald max-w-none prose-sm font-sans">
                      <Markdown>
                        {solverResult}
                      </Markdown>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
