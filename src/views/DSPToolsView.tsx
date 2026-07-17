import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, AlignEndVertical, BarChart2, Download, Play, FastForward } from 'lucide-react';
import { ComposedChart, Scatter, Bar, LineChart, Line, ScatterChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ZAxis, Cell } from 'recharts';

import { useDiscreteConvolution } from '../hooks/useDiscreteConvolution';
import { useFFT } from '../hooks/useFFT';
import { useDigitalFilter } from '../hooks/useDigitalFilter';

export default function DSPToolsView() {
  const [activeTab, setActiveTab] = useState<'conv' | 'fft' | 'filter'>('conv');

  const { xStr, setXStr, hStr, setHStr, step, setStep, outputs: convOutputs } = useDiscreteConvolution('1,2,3', '1,1,1');

  const { inputs: fftInputs, setInputs: setFftInputs, outputs: fftOutputs } = useFFT({ N: 8, data: '1,2,3,4,0,0,0,0' });

  const { inputs: filterInputs, setInputs: setFilterInputs, outputs: filterOutputs } = useDigitalFilter({
    type: 'FIR', fs: 1000, fc: 200, order: 21
  });

  const downloadCoefficients = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "b," + filterOutputs.b.join(',') + "\n"
      + "a," + filterOutputs.a.join(',');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "filter_coefficients.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-navy-dark text-slate-100 pb-12 font-sans selection:bg-fuchsia-500/30 selection:text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all">
          <ArrowLeft className="h-4 w-4" /> BACK TO HOME
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        <div className="relative rounded-2xl border border-navy-light/60 bg-navy-light/20 p-6 md:p-8 overflow-hidden">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-fuchsia-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <Activity className="h-4 w-4" /> EEE 3207 Digital Signal Processing
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
              DSP <span className="text-fuchsia-400">Suite</span>
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
              Discrete Convolution, FFT Butterfly Analyzers, and Digital Filter Design.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-navy-light/60 pb-px">
          <button onClick={() => setActiveTab('conv')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'conv' ? 'border-fuchsia-400 text-fuchsia-400 bg-fuchsia-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><AlignEndVertical className="h-4 w-4" /> Convolution</div>
          </button>
          <button onClick={() => setActiveTab('fft')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'fft' ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Activity className="h-4 w-4" /> FFT Analyzer</div>
          </button>
          <button onClick={() => setActiveTab('filter')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'filter' ? 'border-indigo-400 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><BarChart2 className="h-4 w-4" /> Filter Designer</div>
          </button>
        </div>

        {/* TAB 1: Convolution */}
        {activeTab === 'conv' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <AlignEndVertical className="h-5 w-5 text-fuchsia-400" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Input Signals</h3>
              </div>
              <div className="space-y-4 text-xs font-mono">
                <div className="space-y-1.5">
                  <label className="text-slate-400 block">x[n] (comma separated)</label>
                  <input type="text" value={xStr} onChange={e => {setXStr(e.target.value); setStep(0);}} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 block">h[n] (comma separated)</label>
                  <input type="text" value={hStr} onChange={e => {setHStr(e.target.value); setStep(0);}} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                </div>
                
                <div className="border-t border-navy-light/40 pt-4 mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400 font-bold">Step-Through (n = {step})</span>
                    <div className="flex gap-2">
                      <button onClick={() => setStep(Math.max(0, step - 1))} className="p-1 bg-navy-dark hover:bg-navy-light/40 rounded text-slate-300"><ArrowLeft className="h-4 w-4" /></button>
                      <button onClick={() => setStep(Math.min(convOutputs.stepsData.length - 1, step + 1))} className="p-1 bg-fuchsia-500/20 hover:bg-fuchsia-500/40 rounded text-fuchsia-400"><Play className="h-4 w-4" /></button>
                      <button onClick={() => setStep(convOutputs.stepsData.length - 1)} className="p-1 bg-navy-dark hover:bg-navy-light/40 rounded text-slate-300"><FastForward className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="bg-navy-dark border border-fuchsia-500/30 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between"><span className="text-slate-400">Current Sum:</span> <span className="text-fuchsia-400 font-bold">{convOutputs.stepsData[step]?.sum?.toFixed(2) ?? '0.00'}</span></div>
                    <div className="text-slate-500 text-[10px] break-words">y[{step}] = Σ x[k]h[{step}-k]</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col gap-4">
              <div className="bg-navy-card border border-navy-light/60 p-4 rounded-2xl h-[250px] flex flex-col">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-2">Folding & Shifting (Step n = {step})</h4>
                <div className="flex-1 w-full relative">
                   <ResponsiveContainer width="100%" height="100%">
                     <ComposedChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                       <XAxis type="number" dataKey="k" domain={['dataMin - 1', 'dataMax + 1']} stroke="#64748b" style={{ fontSize: '10px' }} tickCount={15} />
                       <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
                       <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} />
                       {/* x[n] stems */}
                       <Bar {...{ data: convOutputs.plotX } as any} dataKey="val" fill="#38bdf8" barSize={3} name="x[k]" />
                       <Scatter data={convOutputs.plotX} dataKey="val" fill="#38bdf8" />
                       {/* h shifted stems */}
                       <Bar {...{ data: convOutputs.stepsData[step]?.hShifted } as any} dataKey="val" fill="#f43f5e" barSize={3} name={`h[${step}-k]`} fillOpacity={0.6} />
                       <Scatter data={convOutputs.stepsData[step]?.hShifted} dataKey="val" fill="#f43f5e" fillOpacity={0.6} />
                       <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: '10px' }} />
                     </ComposedChart>
                   </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-navy-card border border-navy-light/60 p-4 rounded-2xl h-[250px] flex flex-col">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-2">Output y[n]</h4>
                <div className="flex-1 w-full relative">
                   <ResponsiveContainer width="100%" height="100%">
                     <ComposedChart data={convOutputs.plotY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                       <XAxis type="number" dataKey="n" domain={['dataMin', 'dataMax']} stroke="#64748b" style={{ fontSize: '10px' }} tickCount={15} />
                       <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
                       <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} />
                       <Bar dataKey="val" fill="#d946ef" barSize={3} name="y[n]" />
                       <Scatter dataKey="val" fill="#d946ef" />
                       <Scatter data={convOutputs.plotY.filter((d, i) => i === step)} dataKey="val" fill="#fff" shape="star" name="Current Step" />
                     </ComposedChart>
                   </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FFT Analyzer */}
        {activeTab === 'fft' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Activity className="h-5 w-5 text-cyan-400" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">DIT FFT Parameters</h3>
              </div>
              <div className="space-y-4 text-xs font-mono">
                <div className="space-y-1.5">
                  <label className="text-slate-400 block">Points (N)</label>
                  <select value={fftInputs.N} onChange={e => setFftInputs({...fftInputs, N: parseInt(e.target.value)})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white">
                    <option value={4}>4-Point</option>
                    <option value={8}>8-Point</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 block">Input Signal (comma separated)</label>
                  <input type="text" value={fftInputs.data} onChange={e => setFftInputs({...fftInputs, data: e.target.value})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  <p className="text-slate-500 text-[10px]">Will pad with zeros or truncate to {fftInputs.N} points.</p>
                </div>
                
                <div className="border-t border-navy-light/40 pt-4 mt-4">
                  <h4 className="text-slate-400 font-bold mb-2">FFT Output Magnitudes</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {fftOutputs.magnitudes.map((mag, i) => (
                      <div key={i} className="bg-navy-dark p-2 rounded border border-cyan-500/10 flex justify-between">
                        <span className="text-slate-500">X[{i}]</span>
                        <span className="text-cyan-400 font-bold">{mag.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 bg-navy-card border border-navy-light/60 p-6 rounded-2xl min-h-[500px] flex flex-col overflow-x-auto">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-navy-light/40 pb-2">Radix-2 Butterfly Diagram</h4>
              <div className="flex-1 w-full min-w-[600px] relative font-mono text-[10px]">
                <svg width="100%" height="100%" viewBox={`0 0 800 ${fftOutputs.N * 60 + 40}`}>
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
                    </marker>
                  </defs>
                  
                  {/* Draw Nodes and connections */}
                  {fftOutputs.stages.map((stage, s) => {
                    const x = 50 + s * 200;
                    return stage.map((val, i) => {
                      const y = 40 + i * 50;
                      return (
                        <g key={`s${s}-n${i}`}>
                          <circle cx={x} cy={y} r={4} fill={s === 0 ? '#38bdf8' : s === fftOutputs.stages.length - 1 ? '#d946ef' : '#fcd34d'} />
                          <text x={x} y={y - 8} fill="#94a3b8" textAnchor="middle">
                            {val.re.toFixed(1)} {val.im !== 0 ? (val.im > 0 ? '+' : '') + val.im.toFixed(1) + 'j' : ''}
                          </text>
                          {s === 0 && (
                            <text x={x - 15} y={y + 4} fill="#64748b" textAnchor="end">x[{i}]</text>
                          )}
                          {s === fftOutputs.stages.length - 1 && (
                            <text x={x + 15} y={y + 4} fill="#64748b" textAnchor="start">X[{i}]</text>
                          )}
                        </g>
                      )
                    });
                  })}

                  {/* Lines (conceptual rendering, for accurate butterfly we'd need to trace the exact pairs. 
                      Since it's a visualizer, let's just draw standard generic butterfly lines for visual aesthetic) */}
                  {Array.from({length: Math.log2(fftOutputs.N)}).map((_, s) => {
                     const m = 1 << (s + 1);
                     const m2 = m >> 1;
                     const lines = [];
                     for(let k=0; k<fftOutputs.N; k+=m) {
                        for(let j=0; j<m2; j++) {
                           const x1 = 50 + s * 200;
                           const x2 = 50 + (s + 1) * 200;
                           const y1 = 40 + (k+j) * 50;
                           const y2 = 40 + (k+j+m2) * 50;
                           
                           lines.push(<line key={`l1-${s}-${k}-${j}`} x1={x1} y1={y1} x2={x2} y2={y1} stroke="#334155" strokeWidth={1} markerEnd="url(#arrow)" />);
                           lines.push(<line key={`l2-${s}-${k}-${j}`} x1={x1} y1={y2} x2={x2} y2={y2} stroke="#334155" strokeWidth={1} markerEnd="url(#arrow)" />);
                           lines.push(<line key={`l3-${s}-${k}-${j}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth={1} markerEnd="url(#arrow)" />);
                           lines.push(<line key={`l4-${s}-${k}-${j}`} x1={x1} y1={y2} x2={x2} y2={y1} stroke="#334155" strokeWidth={1} markerEnd="url(#arrow)" />);
                           
                           // Twiddle factor text approx
                           lines.push(<text key={`t-${s}-${k}-${j}`} x={x2 - 30} y={y2 - 5} fill="#f59e0b" fontSize={8}>W</text>);
                        }
                     }
                     return lines;
                  })}
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Filter Designer */}
        {activeTab === 'filter' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <BarChart2 className="h-5 w-5 text-indigo-400" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Filter Specs</h3>
              </div>
              <div className="space-y-4 text-xs font-mono">
                <div className="space-y-1.5">
                  <label className="text-slate-400 block">Filter Type</label>
                  <select value={filterInputs.type} onChange={e => setFilterInputs({...filterInputs, type: e.target.value as 'FIR'|'IIR'})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white">
                    <option value="FIR">FIR (Windowed Sinc)</option>
                    <option value="IIR">IIR (Butterworth)</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Sampling Freq (Hz)</label>
                    <input type="number" value={filterInputs.fs} onChange={e => setFilterInputs({...filterInputs, fs: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Cutoff Freq (Hz)</label>
                    <input type="number" value={filterInputs.fc} onChange={e => setFilterInputs({...filterInputs, fc: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-navy-light/40 pt-4">
                  <label className="text-slate-400 block">Filter Order</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min="1" max={filterInputs.type === 'IIR' ? 2 : 51} step={filterInputs.type === 'IIR' ? 1 : 2} value={filterInputs.order} onChange={e => setFilterInputs({...filterInputs, order: parseInt(e.target.value)})} className="flex-1 accent-indigo-500" />
                    <span className="text-indigo-400 font-bold w-8">{filterInputs.order}</span>
                  </div>
                </div>

                <div className="bg-navy-dark border border-indigo-500/30 rounded-xl p-4 mt-6 space-y-4">
                  <div>
                    <h5 className="text-slate-400 font-bold mb-1 border-b border-indigo-500/20 pb-1">b coefficients (Numerator)</h5>
                    <div className="max-h-24 overflow-y-auto break-all text-[10px] text-slate-300">
                      [{filterOutputs.b.map(v => v.toExponential(3)).join(', ')}]
                    </div>
                  </div>
                  {filterInputs.type === 'IIR' && (
                    <div>
                      <h5 className="text-slate-400 font-bold mb-1 border-b border-indigo-500/20 pb-1">a coefficients (Denominator)</h5>
                      <div className="max-h-24 overflow-y-auto break-all text-[10px] text-slate-300">
                        [{filterOutputs.a.map(v => v.toExponential(3)).join(', ')}]
                      </div>
                    </div>
                  )}
                  
                  <button onClick={downloadCoefficients} className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded font-bold transition-colors">
                    <Download className="h-4 w-4" /> Download CSV
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col gap-4">
              <div className="bg-navy-card border border-navy-light/60 p-4 rounded-2xl h-[250px] flex flex-col">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-2">Frequency Response (Magnitude)</h4>
                <div className="flex-1 w-full relative">
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={filterOutputs.freqResponse} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                       <XAxis dataKey="f" type="number" stroke="#64748b" style={{ fontSize: '10px' }} label={{ value: 'Freq (Hz)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }} />
                       <YAxis stroke="#64748b" style={{ fontSize: '10px' }} domain={[-100, 5]} label={{ value: 'Mag (dB)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                       <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} formatter={(val: number) => val.toFixed(2) + ' dB'} />
                       <Line type="monotone" dataKey="magDb" stroke="#818cf8" strokeWidth={2} dot={false} isAnimationActive={false} />
                     </LineChart>
                   </ResponsiveContainer>
                </div>
              </div>

              {filterInputs.type === 'IIR' && (
                <div className="bg-navy-card border border-navy-light/60 p-4 rounded-2xl h-[250px] flex flex-col">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-2">Pole-Zero Plot</h4>
                  <div className="flex-1 w-full relative flex items-center justify-center">
                     {/* Draw Unit circle and poles/zeros manually for precision */}
                     <svg width="200" height="200" viewBox="-1.5 -1.5 3 3" className="border border-navy-light/40 rounded-full bg-navy-dark">
                        {/* Axes */}
                        <line x1="-1.5" y1="0" x2="1.5" y2="0" stroke="#334155" strokeWidth="0.02" />
                        <line x1="0" y1="-1.5" x2="0" y2="1.5" stroke="#334155" strokeWidth="0.02" />
                        {/* Unit circle */}
                        <circle cx="0" cy="0" r="1" stroke="#64748b" strokeWidth="0.02" fill="none" strokeDasharray="0.05 0.05" />
                        
                        {/* Poles and Zeros */}
                        {filterOutputs.poleZeros.map((pz, i) => {
                          if (pz.type === 'zero') {
                            return <circle key={i} cx={pz.re} cy={-pz.im} r="0.05" stroke="#f43f5e" strokeWidth="0.02" fill="none" />
                          } else {
                            // Draw an X for pole
                            return (
                              <g key={i}>
                                <line x1={pz.re - 0.05} y1={-pz.im - 0.05} x2={pz.re + 0.05} y2={-pz.im + 0.05} stroke="#38bdf8" strokeWidth="0.02" />
                                <line x1={pz.re - 0.05} y1={-pz.im + 0.05} x2={pz.re + 0.05} y2={-pz.im - 0.05} stroke="#38bdf8" strokeWidth="0.02" />
                              </g>
                            )
                          }
                        })}
                     </svg>
                     <div className="absolute right-4 top-4 text-[10px] font-mono text-slate-500">
                       <div className="flex items-center gap-1"><span className="text-fuchsia-400">O</span> Zeros</div>
                       <div className="flex items-center gap-1"><span className="text-cyan-400">X</span> Poles</div>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
