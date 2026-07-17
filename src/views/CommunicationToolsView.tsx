import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Radio, Activity, Waves, Signal, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

import { useLineCoding } from '../hooks/useLineCoding';
import { useModulation } from '../hooks/useModulation';
import { useReceiverCascade } from '../hooks/useReceiverCascade';

export default function CommunicationToolsView() {
  const [activeTab, setActiveTab] = useState<'line' | 'mod' | 'rx'>('line');

  const { dataStr, setDataStr, outputs: lineOutputs } = useLineCoding('10110100');

  const { inputs: modInputs, setInputs: setModInputs, outputs: modOutputs } = useModulation({
    type: 'AM', fc: 1000, fm: 100, index: 0.8
  });

  const { inputs: rxInputs, setInputs: setRxInputs, outputs: rxOutputs, addStage, updateStage, removeStage } = useReceiverCascade({
    frf: 100, fif: 10.7, injection: 'High',
    stages: [
      { id: '1', name: 'LNA', gainDb: 15, nfDb: 2 },
      { id: '2', name: 'Mixer', gainDb: -5, nfDb: 8 },
      { id: '3', name: 'IF Amp', gainDb: 20, nfDb: 4 }
    ]
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
            <div className="flex items-center gap-2 text-fuchsia-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <Radio className="h-4 w-4 animate-pulse" /> EEE 3117 Communication Engineering I
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
              Communication <span className="text-fuchsia-400">Systems</span> Suite
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
              Digital Line Coding, AM/FM Modulation Spectrum Analysis, and Receiver Noise Cascade.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-navy-light/60 pb-px">
          <button onClick={() => setActiveTab('line')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'line' ? 'border-fuchsia-400 text-fuchsia-400 bg-fuchsia-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Activity className="h-4 w-4" /> Line Coding</div>
          </button>
          <button onClick={() => setActiveTab('mod')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'mod' ? 'border-amber-400 text-amber-400 bg-amber-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Waves className="h-4 w-4" /> AM & FM Mod</div>
          </button>
          <button onClick={() => setActiveTab('rx')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'rx' ? 'border-blue-400 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Signal className="h-4 w-4" /> Superheterodyne Rx</div>
          </button>
        </div>

        {/* TAB 1: Line Coding */}
        {activeTab === 'line' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl max-w-xl">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60 mb-4">
                <Activity className="h-5 w-5 text-fuchsia-400" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Binary Sequence</h3>
              </div>
              <div className="space-y-1.5 font-mono text-xs">
                <label className="text-slate-400 block">Enter 1s and 0s</label>
                <input 
                  type="text" 
                  value={dataStr} 
                  onChange={e => setDataStr(e.target.value.replace(/[^01]/g, ''))} 
                  className="w-full bg-navy-dark border border-fuchsia-500/50 rounded px-3 py-2 text-fuchsia-100 text-lg tracking-[0.5em]" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { title: 'Unipolar NRZ', data: lineOutputs.unipolarNRZ, color: '#ec4899' },
                { title: 'Polar NRZ', data: lineOutputs.polarNRZ, color: '#8b5cf6' },
                { title: 'Polar RZ', data: lineOutputs.polarRZ, color: '#3b82f6' },
                { title: 'Manchester', data: lineOutputs.manchester, color: '#10b981' },
                { title: 'AMI (Bipolar)', data: lineOutputs.ami, color: '#f59e0b' }
              ].map(chart => (
                <div key={chart.title} className="bg-navy-card border border-navy-light/60 p-4 rounded-xl flex items-center">
                  <div className="w-40 flex-shrink-0">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400">{chart.title}</h4>
                  </div>
                  <div className="flex-1 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={true} horizontal={true} />
                        <XAxis dataKey="t" type="number" domain={[0, lineOutputs.endT]} tickCount={lineOutputs.endT + 1} stroke="#64748b" style={{ fontSize: '10px' }} />
                        <YAxis domain={[-1.2, 1.2]} ticks={[-1, 0, 1]} stroke="#64748b" style={{ fontSize: '10px' }} />
                        <Line type="stepAfter" dataKey="val" stroke={chart.color} strokeWidth={3} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: AM & FM Modulation */}
        {activeTab === 'mod' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Waves className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Modulation Settings</h3>
              </div>
              <div className="space-y-4 text-xs font-mono">
                <div className="flex rounded overflow-hidden border border-amber-500/30">
                  <button onClick={() => setModInputs({...modInputs, type: 'AM', index: Math.min(modInputs.index, 1.5)})} className={`flex-1 py-2 font-bold ${modInputs.type === 'AM' ? 'bg-amber-500/20 text-amber-400' : 'bg-navy-dark text-slate-500 hover:bg-navy-light/40'}`}>AM</button>
                  <button onClick={() => setModInputs({...modInputs, type: 'FM'})} className={`flex-1 py-2 font-bold border-l border-amber-500/30 ${modInputs.type === 'FM' ? 'bg-amber-500/20 text-amber-400' : 'bg-navy-dark text-slate-500 hover:bg-navy-light/40'}`}>FM</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Carrier fc (Hz)</label>
                    <input type="number" value={modInputs.fc} onChange={e => setModInputs({...modInputs, fc: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Message fm (Hz)</label>
                    <input type="number" value={modInputs.fm} onChange={e => setModInputs({...modInputs, fm: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-navy-light/40 pt-4">
                  <label className="text-slate-400 block">{modInputs.type === 'AM' ? 'Modulation Index (m)' : 'Modulation Index (β)'}</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min="0" max={modInputs.type === 'AM' ? "1.5" : "10"} step="0.1" value={modInputs.index} onChange={e => setModInputs({...modInputs, index: parseFloat(e.target.value)})} className="flex-1 accent-amber-500" />
                    <span className="text-amber-400 font-bold w-8">{modInputs.index.toFixed(1)}</span>
                  </div>
                </div>

                <div className="bg-navy-dark border border-amber-500/30 rounded-xl p-4 mt-6">
                  <div className="flex justify-between items-center"><span className="text-slate-300">Bandwidth (BW)</span><span className="text-amber-400 font-bold text-lg">{modOutputs.bw.toFixed(0)} Hz</span></div>
                  {modInputs.type === 'FM' && <div className="text-[10px] text-slate-500 text-right mt-1">*Using Carson's Rule</div>}
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl min-h-[250px] flex flex-col">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-navy-light/40 pb-2">Time Domain Waveform</h4>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={modOutputs.timeData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Time (ms)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '11px' }} domain={[-2, 2]} />
                      <Line type="monotone" dataKey="val" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                      {modInputs.type === 'AM' && <Line type="monotone" dataKey="env" stroke="#38bdf8" strokeWidth={1} strokeDasharray="3 3" dot={false} isAnimationActive={false} />}
                      {modInputs.type === 'AM' && <Line type="monotone" dataKey="negEnv" stroke="#38bdf8" strokeWidth={1} strokeDasharray="3 3" dot={false} isAnimationActive={false} />}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl min-h-[250px] flex flex-col">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-navy-light/40 pb-2">Frequency Spectrum (Normalized)</h4>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={modOutputs.specData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }} barCategoryGap={1}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="f" stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '11px' }} domain={[0, 1.1]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} formatter={(val: number) => val.toFixed(3)} />
                      <Bar dataKey="amp" fill="#f59e0b" radius={[2, 2, 0, 0]} maxBarSize={10} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Superhet Rx */}
        {activeTab === 'rx' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Signal className="h-5 w-5 text-blue-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Frequencies (MHz)</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">RF (f_rf)</label>
                    <input type="number" value={rxInputs.frf} onChange={e => setRxInputs({...rxInputs, frf: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">IF (f_if)</label>
                    <input type="number" value={rxInputs.fif} onChange={e => setRxInputs({...rxInputs, fif: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                </div>
                <div className="space-y-1.5 text-xs font-mono border-t border-navy-light/40 pt-3">
                  <label className="text-slate-400 block">LO Injection</label>
                  <select value={rxInputs.injection} onChange={e => setRxInputs({...rxInputs, injection: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white">
                    <option value="High">High-Side (f_lo &gt; f_rf)</option>
                    <option value="Low">Low-Side (f_lo &lt; f_rf)</option>
                  </select>
                </div>
              </div>

              <div className="lg:col-span-2 bg-navy-card border border-blue-500/30 p-6 rounded-2xl grid grid-cols-2 gap-6 items-center">
                <div className="space-y-2">
                  <div className="text-xs font-mono text-slate-400 uppercase">Local Oscillator (LO)</div>
                  <div className="text-3xl font-black text-white font-display">{rxOutputs.flo.toFixed(2)} <span className="text-lg text-slate-500">MHz</span></div>
                </div>
                <div className="space-y-2 border-l border-navy-light/40 pl-6">
                  <div className="text-xs font-mono text-rose-400 flex items-center gap-1 uppercase"><AlertTriangle className="h-3 w-3" /> Image Frequency</div>
                  <div className="text-3xl font-black text-rose-400 font-display">{rxOutputs.fim.toFixed(2)} <span className="text-lg text-rose-500/50">MHz</span></div>
                </div>
              </div>
            </div>

            <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-navy-light/60">
                <div className="flex items-center gap-2">
                  <Signal className="h-5 w-5 text-blue-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Receiver Cascade (Friis Formula)</h3>
                </div>
                <button onClick={addStage} className="text-xs font-mono bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-3 py-1.5 rounded flex items-center gap-1 transition-colors">
                  <Plus className="h-3 w-3" /> ADD STAGE
                </button>
              </div>

              <div className="flex items-stretch overflow-x-auto gap-4 pb-4 custom-scrollbar">
                {rxInputs.stages.map((stage, i) => (
                  <div key={stage.id} className="min-w-[200px] bg-navy-dark border border-navy-light/60 rounded-xl p-4 flex flex-col relative group">
                    <button onClick={() => removeStage(stage.id)} className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <input 
                      type="text" 
                      value={stage.name} 
                      onChange={e => updateStage(stage.id, 'name', e.target.value)}
                      className="bg-transparent border-b border-navy-light/40 text-white font-bold text-sm mb-4 focus:outline-none focus:border-blue-400 px-1"
                    />
                    <div className="space-y-3 text-xs font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Gain (dB)</span>
                        <input type="number" value={stage.gainDb} onChange={e => updateStage(stage.id, 'gainDb', parseFloat(e.target.value)||0)} className="w-16 bg-navy-light/20 border border-navy-light rounded px-1.5 py-1 text-right text-white" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">NF (dB)</span>
                        <input type="number" step="0.1" value={stage.nfDb} onChange={e => updateStage(stage.id, 'nfDb', parseFloat(e.target.value)||0)} className="w-16 bg-navy-light/20 border border-navy-light rounded px-1.5 py-1 text-right text-white" />
                      </div>
                    </div>
                    {i < rxInputs.stages.length - 1 && (
                      <div className="absolute -right-3 top-1/2 -translate-y-1/2 text-slate-600 font-bold">→</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-navy-dark border border-blue-500/30 rounded-xl p-5 flex flex-wrap gap-8 items-center mt-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Total System Gain</div>
                  <div className="text-2xl font-bold text-white">{rxOutputs.totalGainDb.toFixed(2)} <span className="text-sm text-slate-500">dB</span></div>
                </div>
                <div className="w-px h-12 bg-navy-light/40 hidden md:block"></div>
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Total Noise Figure (Friis)</div>
                  <div className="text-2xl font-bold text-blue-400">{rxOutputs.totalNfDb.toFixed(2)} <span className="text-sm text-blue-500/50">dB</span></div>
                </div>
                <div className="w-px h-12 bg-navy-light/40 hidden md:block"></div>
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Linear Noise Factor (F)</div>
                  <div className="text-xl font-bold text-slate-300">{rxOutputs.fTotalLinear.toFixed(3)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
