import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, Grid, Sliders, Play } from 'lucide-react';
import { ScatterChart, Scatter, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

import { useStateSpace } from '../hooks/useStateSpace';
import { useRootLocus } from '../hooks/useRootLocus';
import { useCompensator } from '../hooks/useCompensator';

export default function ControlToolsView() {
  const [activeTab, setActiveTab] = useState<'ss' | 'rl' | 'pid'>('ss');

  const { inputs: ssInputs, setInputs: setSsInputs, outputs: ssOutputs } = useStateSpace({ numStr: '1', denStr: '1, 3, 2' });
  const { inputs: rlInputs, setInputs: setRlInputs, outputs: rlOutputs } = useRootLocus('1', '1, 3, 2, 0');
  const { inputs: cInputs, setInputs: setCInputs, outputs: cOutputs } = useCompensator('1', '1, 3, 2');

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
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <Activity className="h-4 w-4 animate-pulse" /> EEE 3105 Control System Engineering
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
              Advanced Control <span className="text-rose-400">Systems</span> Suite
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
              State-Space modeling, Root Locus/Nyquist plotting, and Compensator/PID Design.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-navy-light/60 pb-px">
          <button onClick={() => setActiveTab('ss')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'ss' ? 'border-amber-400 text-amber-400 bg-amber-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Grid className="h-4 w-4" /> System Modeler</div>
          </button>
          <button onClick={() => setActiveTab('rl')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'rl' ? 'border-rose-400 text-rose-400 bg-rose-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Play className="h-4 w-4" /> Locus & Nyquist</div>
          </button>
          <button onClick={() => setActiveTab('pid')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'pid' ? 'border-blue-400 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Sliders className="h-4 w-4" /> PID Tuner</div>
          </button>
        </div>

        {/* TAB 1: System Modeler */}
        {activeTab === 'ss' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
             <div className="lg:col-span-5 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Grid className="h-5 w-5 text-amber-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Transfer Function (TF)</h3>
                </div>
                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Numerator Coefficients (e.g., 1, 2)</label>
                    <input type="text" value={ssInputs.numStr} onChange={e => setSsInputs({...ssInputs, numStr: e.target.value})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Denominator Coefficients (e.g., 1, 3, 2)</label>
                    <input type="text" value={ssInputs.denStr} onChange={e => setSsInputs({...ssInputs, denStr: e.target.value})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                </div>
             </div>
             <div className="lg:col-span-7 bg-navy-card border border-navy-light/60 p-6 rounded-2xl min-h-[400px]">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-navy-light/40 pb-2">State-Space Model</h4>
                <div className="prose prose-invert prose-amber max-w-none prose-sm font-sans markdown-body bg-navy-dark/50 p-6 rounded-xl border border-navy-light/50 overflow-x-auto custom-scrollbar">
                  <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {ssOutputs.markdown}
                  </Markdown>
                </div>
             </div>
          </div>
        )}

        {/* TAB 2: Root Locus */}
        {activeTab === 'rl' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6 max-w-3xl">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Play className="h-5 w-5 text-rose-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Open-Loop Transfer Function G(s)</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Numerator K*N(s)</label>
                    <input type="text" value={rlInputs.numStr} onChange={e => setRlInputs({...rlInputs, numStr: e.target.value})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Denominator D(s)</label>
                    <input type="text" value={rlInputs.denStr} onChange={e => setRlInputs({...rlInputs, denStr: e.target.value})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl min-h-[400px] flex flex-col">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-navy-light/40 pb-2">Root Locus Plot</h4>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis type="number" dataKey="re" name="Real" stroke="#64748b" style={{fontSize:'10px'}} label={{ value: 'Real Axis', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis type="number" dataKey="im" name="Imaginary" stroke="#64748b" style={{fontSize:'10px'}} label={{ value: 'Imaginary Axis', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} formatter={(val: number) => val.toFixed(3)} />
                      <Scatter name="Locus" data={rlOutputs.rlData} fill="#fb7185" shape="circle" line={false} />
                      <Scatter name="Poles" data={rlOutputs.openLoopPoles} fill="#ef4444" shape="cross" />
                      <Scatter name="Zeros" data={rlOutputs.openLoopZeros} fill="#38bdf8" shape="circle" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl min-h-[400px] flex flex-col">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-navy-light/40 pb-2">Nyquist Plot</h4>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis type="number" dataKey="re" name="Real" stroke="#64748b" style={{fontSize:'10px'}} />
                      <YAxis type="number" dataKey="im" name="Imaginary" stroke="#64748b" style={{fontSize:'10px'}} />
                      <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} formatter={(val: number) => val.toFixed(3)} />
                      <Scatter name="Nyquist" data={rlOutputs.nyqData} fill="#38bdf8" line={{stroke: '#38bdf8', strokeWidth: 2}} shape="circle" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PID Tuner */}
        {activeTab === 'pid' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Sliders className="h-5 w-5 text-blue-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Plant & PID Gains</h3>
                </div>
                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Plant Numerator</label>
                    <input type="text" value={cInputs.numStr} onChange={e => setCInputs({...cInputs, numStr: e.target.value})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Plant Denominator</label>
                    <input type="text" value={cInputs.denStr} onChange={e => setCInputs({...cInputs, denStr: e.target.value})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                  <div className="border-t border-navy-light/40 pt-4 space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block text-blue-400">Proportional (Kp)</label>
                      <input type="number" step="0.5" value={cInputs.Kp} onChange={e => setCInputs({...cInputs, Kp: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block text-blue-400">Integral (Ki)</label>
                      <input type="number" step="0.5" value={cInputs.Ki} onChange={e => setCInputs({...cInputs, Ki: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block text-blue-400">Derivative (Kd)</label>
                      <input type="number" step="0.1" value={cInputs.Kd} onChange={e => setCInputs({...cInputs, Kd: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                  </div>
                </div>
            </div>
            <div className="lg:col-span-8 bg-navy-card border border-navy-light/60 p-6 rounded-2xl min-h-[400px] flex flex-col">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-navy-light/40 pb-2">Time-Domain Step Response</h4>
              <div className="flex-1 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cOutputs.plotData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="t" type="number" stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Time (s)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Amplitude', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} formatter={(val: number) => val.toFixed(3)} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="uncomp" stroke="#64748b" strokeWidth={2} dot={false} name="Uncompensated" strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="comp" stroke="#3b82f6" strokeWidth={3} dot={false} name="PID Compensated" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
