import React, { useState } from 'react';
import { Radio, Activity, Grid, Shuffle, ArrowRight, Shield, Layers, LayoutGrid } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, ReferenceLine } from 'recharts';

import { useAdvancedModulation } from '../hooks/useAdvancedModulation';
import { useCoding } from '../hooks/useCoding';
import { useDiversity } from '../hooks/useDiversity';

export default function AdvancedCommView() {
  const [activeTab, setActiveTab] = useState<'constellation' | 'coding' | 'diversity'>('constellation');
  
  const mod = useAdvancedModulation();
  const cod = useCoding();
  const div = useDiversity();

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Radio className="h-6 w-6 text-sky-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Advanced Comm Suite</h1>
          </div>
          <p className="text-slate-400 max-w-2xl text-sm">
            High-Order Modulation, Error Correcting Codes, and Diversity Combining.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-navy-light/60 pb-px">
        <button onClick={() => setActiveTab('constellation')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'constellation' ? 'border-sky-400 text-sky-400 bg-sky-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
          <div className="flex items-center gap-2"><Grid className="h-4 w-4" /> Constellation & Noise</div>
        </button>
        <button onClick={() => setActiveTab('coding')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'coding' ? 'border-amber-400 text-amber-400 bg-amber-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
          <div className="flex items-center gap-2"><Shield className="h-4 w-4" /> Linear Block Codes</div>
        </button>
        <button onClick={() => setActiveTab('diversity')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'diversity' ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
          <div className="flex items-center gap-2"><Layers className="h-4 w-4" /> Diversity Combining</div>
        </button>
      </div>

      {/* TAB: Constellation */}
      {activeTab === 'constellation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Grid className="h-5 w-5 text-sky-400" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Modulation Setup</h3>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Scheme</label>
                <div className="grid grid-cols-2 gap-2">
                  {['QPSK', '8-PSK', '16-QAM', '64-QAM'].map((s) => (
                    <button
                      key={s}
                      onClick={() => mod.setScheme(s as any)}
                      className={`py-2 text-xs font-bold rounded-lg transition-colors border ${
                        mod.scheme === s 
                          ? 'bg-sky-500/20 text-sky-400 border-sky-500/50' 
                          : 'bg-navy-dark text-slate-400 border-transparent hover:bg-navy-light/40'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-400">Channel SNR (dB)</label>
                  <span className="text-xs text-sky-400 font-mono font-bold">{mod.snrDb} dB</span>
                </div>
                <input 
                  type="range" min="-5" max="30" step="1" 
                  value={mod.snrDb} 
                  onChange={e => mod.setSnrDb(Number(e.target.value))} 
                  className="w-full accent-sky-500" 
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>-5 dB (High Noise)</span>
                  <span>30 dB (Clean)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visualization */}
          <div className="lg:col-span-8 bg-navy-card border border-navy-light/60 p-6 rounded-2xl">
            <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono mb-6 flex items-center gap-2">
              <Activity className="h-4 w-4 text-sky-400" /> Scatter Constellation
            </h3>
            
            <div className="h-[400px] w-full bg-navy-dark rounded-xl border border-navy-light/50 relative">
               <ResponsiveContainer width="100%" height="100%">
                 <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                   <XAxis type="number" dataKey="i" name="In-Phase" domain={[-1.5, 1.5]} stroke="#64748b" style={{ fontSize: '10px' }} />
                   <YAxis type="number" dataKey="q" name="Quadrature" domain={[-1.5, 1.5]} stroke="#64748b" style={{ fontSize: '10px' }} />
                   <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} itemStyle={{ color: '#38bdf8' }} />
                   <ReferenceLine x={0} stroke="#334155" />
                   <ReferenceLine y={0} stroke="#334155" />
                   {/* Noisy cloud */}
                   <Scatter name="Received" data={mod.results.noisyPoints} fill="#38bdf8" fillOpacity={0.4} shape="circle" line={false} />
                   {/* Ideal points */}
                   <Scatter name="Ideal" data={mod.results.idealPoints} fill="#f43f5e" shape="cross" line={false} />
                 </ScatterChart>
               </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Coding */}
      {activeTab === 'coding' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <LayoutGrid className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Encoder Setup</h3>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Data Word (k={cod.results.k})</label>
                <input 
                  type="text" 
                  value={cod.dataWord} 
                  onChange={e => cod.setDataWord(e.target.value.replace(/[^01]/g, ''))}
                  maxLength={cod.results.k}
                  className="w-full bg-navy-dark text-amber-400 font-mono font-bold text-lg tracking-widest text-center rounded-lg px-3 py-3 border border-navy-light focus:border-amber-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Generator Matrix G (k x n)</label>
                <div className="grid grid-cols-7 gap-1">
                  {cod.G.map((row, i) => (
                    row.map((val, j) => (
                      <button 
                        key={`${i}-${j}`}
                        onClick={() => {
                          const newG = [...cod.G];
                          newG[i][j] = val === 1 ? 0 : 1;
                          cod.setG(newG);
                        }}
                        className={`aspect-square flex items-center justify-center text-xs font-mono font-bold rounded ${val === 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'bg-navy-dark text-slate-500 border border-navy-light hover:bg-navy-light'}`}
                      >
                        {val}
                      </button>
                    ))
                  ))}
                </div>
                <div className="text-[10px] text-slate-500 mt-2 italic">Click cells to toggle bits. Standard (7,4) Hamming loaded.</div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-8 bg-navy-card border border-navy-light/60 p-6 rounded-2xl flex flex-col gap-6">
             <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
              <Shield className="h-5 w-5 text-amber-400" />
              <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Transmission & Decoding</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Codeword */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider">Generated Codeword (c = d &times; G)</h4>
                <div className="flex gap-1">
                  {cod.results.codeword.map((bit, idx) => (
                    <div key={idx} className={`flex-1 text-center py-3 rounded text-lg font-mono font-bold ${idx < cod.results.k ? 'bg-navy-light/50 text-slate-300' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                      {bit}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>Data Bits</span>
                  <span>Parity Bits</span>
                </div>
              </div>
              
              {/* Received Word */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider">Received Word (Click to Inject Error)</h4>
                <div className="flex gap-1">
                  {cod.results.rx.map((bit, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => cod.setErrorIndex(cod.errorIndex === idx ? -1 : idx)}
                      className={`flex-1 text-center py-3 rounded text-lg font-mono font-bold transition-colors ${cod.errorIndex === idx ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-navy-dark text-slate-300 hover:bg-navy-light border border-navy-light/50'}`}
                    >
                      {bit}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-navy-light/60 pt-6 mt-2 grid grid-cols-1 md:grid-cols-2 gap-8">
               <div>
                  <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-3">Parity Check Matrix (H)</h4>
                  <div className="grid grid-cols-7 gap-1 max-w-[200px]">
                    {cod.results.H.map((row, i) => (
                      row.map((val, j) => (
                        <div key={`${i}-${j}`} className={`aspect-square flex items-center justify-center text-[10px] font-mono rounded ${val === 1 ? 'bg-slate-700 text-slate-200' : 'bg-navy-dark text-slate-600 border border-navy-light'}`}>
                          {val}
                        </div>
                      ))
                    ))}
                  </div>
               </div>
               
               <div className="space-y-4">
                  <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider">Decoder Status</h4>
                  <div className="bg-navy-dark p-4 rounded-xl border border-navy-light/50 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Syndrome (s = rx &times; H<sup>T</sup>)</span>
                      <span className={`font-mono font-bold tracking-widest ${cod.results.isError ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {cod.results.syndromeStr}
                      </span>
                    </div>
                    {cod.results.isError && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-rose-400">Error Detected at bit:</span>
                        <span className="font-mono font-bold text-white">Index {cod.results.detectedErrorIndex}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-3 border-t border-navy-light/50">
                      <span className="text-slate-400 text-sm">Corrected Data</span>
                      <span className="font-mono font-bold tracking-widest text-amber-400">
                        {cod.results.correctedRx.slice(0, cod.results.k).join('')}
                      </span>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Diversity */}
      {activeTab === 'diversity' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Layers className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Diversity Setup</h3>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Combining Technique</label>
                <select 
                  value={div.technique}
                  onChange={(e) => div.setTechnique(e.target.value as any)}
                  className="w-full bg-navy-dark text-emerald-400 font-bold text-sm rounded-lg px-3 py-2 border border-emerald-500/30 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="SC">Selection Combining (SC)</option>
                  <option value="MRC">Maximal Ratio Combining (MRC)</option>
                  <option value="EGC">Equal Gain Combining (EGC)</option>
                </select>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-medium text-slate-400 border-b border-navy-light/50 pb-2">Branch Parameters</label>
                {div.branches.map((b, idx) => (
                  <div key={b.id} className="bg-navy-dark p-3 rounded-lg border border-navy-light/50 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono text-emerald-400">
                      <span>BRANCH {idx + 1}</span>
                      <span>SNR: {(10 * Math.log10((b.gain*b.gain)/b.noise)).toFixed(1)} dB</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1">Gain (h)</label>
                        <input type="number" step="0.1" value={b.gain} onChange={e => {
                          const newB = [...div.branches];
                          newB[idx].gain = Number(e.target.value);
                          div.setBranches(newB);
                        }} className="w-full bg-navy-light text-white text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1">Noise Var (N)</label>
                        <input type="number" step="0.05" value={b.noise} onChange={e => {
                          const newB = [...div.branches];
                          newB[idx].noise = Number(e.target.value);
                          div.setBranches(newB);
                        }} className="w-full bg-navy-light text-white text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-8 bg-navy-card border border-navy-light/60 p-6 rounded-2xl flex flex-col">
             <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60 mb-6">
              <Activity className="h-5 w-5 text-emerald-400" />
              <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Performance Comparison</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-navy-dark p-4 rounded-xl border border-navy-light/50 flex flex-col justify-center items-center">
                <div className="text-xs text-slate-500 mb-1 font-mono uppercase tracking-wider">Best Single Branch SNR</div>
                <div className="text-2xl font-bold text-slate-300">{Math.max(...div.results.branchSnrs.map(s => 10*Math.log10(s))).toFixed(2)} dB</div>
              </div>
              <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/30 flex flex-col justify-center items-center shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <div className="text-xs text-emerald-500/80 mb-1 font-mono uppercase tracking-wider">Combined Output SNR ({div.technique})</div>
                <div className="text-3xl font-bold text-emerald-400">{ (10 * Math.log10(div.results.snrOut)).toFixed(2) } dB</div>
              </div>
            </div>

            <div className="flex-1 min-h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={div.results.plotData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} style={{ fontSize: '12px', fontFamily: 'monospace' }} />
                  <YAxis stroke="#64748b" tickLine={false} axisLine={false} style={{ fontSize: '11px' }} unit=" dB" />
                  <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} formatter={(val: number) => [val.toFixed(2) + ' dB', 'SNR']} />
                  <Bar dataKey="snrDb" radius={[4, 4, 0, 0]}>
                    {div.results.plotData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Combined' ? '#10b981' : '#475569'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-[10px] text-slate-500 mt-4 font-mono">
              SNR (dB) = 10 * log10(h² / N). MRC maximizes SNR by weighting branches proportional to their channel gain.
            </div>

            {/* Zero Forcing Equalizer */}
            <div className="mt-8 border-t border-navy-light/60 pt-8">
              <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono mb-6 flex items-center gap-2">
                <Shuffle className="h-4 w-4 text-emerald-400" /> Zero-Forcing Equalizer
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-navy-dark p-5 rounded-xl border border-navy-light/50">
                  <label className="block text-xs font-medium text-slate-400 mb-2">Channel Impulse Response h[n] (comma separated)</label>
                  <input type="text" value={div.hChannelStr} onChange={e => div.setHChannelStr(e.target.value)} className="w-full bg-navy-light text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono" />
                  <div className="text-[10px] text-slate-500 mt-2">Example: 0.8, -0.4, 0.2</div>
                </div>
                <div className="bg-navy-dark p-5 rounded-xl border border-emerald-500/30">
                  <label className="block text-xs font-medium text-emerald-400/80 mb-2 uppercase tracking-wider font-mono">Equalizer Taps e[n]</label>
                  <div className="flex flex-wrap gap-2">
                    {div.results.eCoeffs.map((coeff, idx) => (
                      <div key={idx} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-2 rounded-lg font-mono text-sm shadow-[0_0_10px_rgba(16,185,129,0.05)]">
                        <span className="text-[10px] text-emerald-500/60 mr-1">e[{idx}]</span> {coeff.toFixed(4)}
                      </div>
                    ))}
                    {div.results.eCoeffs.length === 0 && <span className="text-slate-500 text-sm">Invalid input</span>}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-3 font-mono">E(z) = 1 / H(z)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
