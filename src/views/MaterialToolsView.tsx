import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  Layers,
  Thermometer,
  Zap,
  Globe,
  Radio
} from 'lucide-react';
import { IEEEReportButton } from '../components/IEEEReportButton';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

import { useSemiconductorPhysics } from '../hooks/useSemiconductorPhysics';
import { useDielectrics } from '../hooks/useDielectrics';
import { useSuperconductor } from '../hooks/useSuperconductor';

type TabId = 'semi' | 'dielectric' | 'superconductor';

export default function MaterialToolsView() {
  const [activeTab, setActiveTab] = useState<TabId>('semi');

  // --- Hook: Semiconductor Physics ---
  const { inputs: sInputs, setInputs: setSInputs, outputs: sOutputs } = useSemiconductorPhysics({
    material: 'Si',
    temperature: 300,
    dopingType: 'N',
    dopingConcentration: 1e16
  });

  // --- Hook: Dielectric Relaxation ---
  const { inputs: dInputs, setInputs: setDInputs, outputs: dOutputs } = useDielectrics({
    eps_r: 80,
    eps_inf: 4,
    tau: 1e-10,
    N: 3e28
  });

  // --- Hook: Superconductor ---
  const { inputs: scInputs, setInputs: setScInputs, outputs: scOutputs } = useSuperconductor({
    Tc: 9.2,
    Hc0: 0.2, // Tesla (example for Niobium)
    Top: 4.2
  });

  const formatSci = (val: number) => {
    if (val === 0) return '0';
    return val.toExponential(2).replace('e+', ' × 10^').replace('e', ' × 10^');
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
          <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-cyan-500/5 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <Layers className="h-4 w-4 animate-pulse" /> EEE 1205 Electrical Engineering Materials
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
              Material Science <span className="text-cyan-400">Analysis</span> Suite
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
              Explore semiconductor carrier statistics, analyze dielectric polarization and relaxation, and visualize superconductor phase boundaries.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-navy-light/60 pb-px">
          <button onClick={() => setActiveTab('semi')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'semi' ? 'border-emerald-accent text-emerald-accent bg-emerald-accent/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Activity className="h-4 w-4" /> Semiconductors</div>
          </button>
          <button onClick={() => setActiveTab('dielectric')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'dielectric' ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Globe className="h-4 w-4" /> Dielectrics</div>
          </button>
          <button onClick={() => setActiveTab('superconductor')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'superconductor' ? 'border-indigo-400 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Thermometer className="h-4 w-4" /> Superconductors</div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          
          {/* TAB 1: SEMICONDUCTORS */}
          {activeTab === 'semi' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Layers className="h-5 w-5 text-emerald-accent" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Carrier & Fermi Level Engine</h3>
                </div>
                
                <div className="space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Material</label>
                      <select value={sInputs.material} onChange={e => setSInputs({...sInputs, material: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white">
                        <option value="Si">Silicon (Si)</option>
                        <option value="Ge">Germanium (Ge)</option>
                        <option value="GaAs">Gallium Arsenide (GaAs)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Temperature (K)</label>
                      <input type="number" value={sInputs.temperature} onChange={e => setSInputs({...sInputs, temperature: parseFloat(e.target.value)||300})} className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-navy-light/40 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Doping Type</label>
                      <select value={sInputs.dopingType} onChange={e => setSInputs({...sInputs, dopingType: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white">
                        <option value="Intrinsic">Intrinsic</option>
                        <option value="N">N-Type (Donor)</option>
                        <option value="P">P-Type (Acceptor)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Concentration (cm⁻³)</label>
                      <input type="number" value={sInputs.dopingConcentration} disabled={sInputs.dopingType === 'Intrinsic'} onChange={e => setSInputs({...sInputs, dopingConcentration: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white disabled:opacity-30" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b border-navy-light/40">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">Carrier Densities</h4>
                    <IEEEReportButton experimentName={`Semiconductor Analysis: ${sInputs.material}`} inputData={{'Temp': sInputs.temperature+'K', 'Doping': sInputs.dopingType}} outputData={{'ni': formatSci(sOutputs.ni)}} chartSelectors={[]} />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block mb-1">Intrinsic (ni)</span>
                      <span className="text-base font-bold text-white font-mono block">{formatSci(sOutputs.ni)}</span>
                      <span className="text-[10px] text-slate-400">cm⁻³</span>
                    </div>
                    <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-emerald-accent font-mono uppercase font-bold block mb-1">Electrons (n)</span>
                      <span className="text-base font-bold text-emerald-accent font-mono block">{formatSci(sOutputs.n)}</span>
                      <span className="text-[10px] text-emerald-accent/60">cm⁻³</span>
                    </div>
                    <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-indigo-400 font-mono uppercase font-bold block mb-1">Holes (p)</span>
                      <span className="text-base font-bold text-indigo-400 font-mono block">{formatSci(sOutputs.p)}</span>
                      <span className="text-[10px] text-indigo-400/60">cm⁻³</span>
                    </div>
                  </div>

                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider border-b border-navy-light/40 pb-2 mt-6">Energy Band Diagram</h4>
                  <div className="relative h-48 w-full bg-navy-dark rounded-xl border border-navy-light flex flex-col items-center justify-center py-4">
                    {/* SVG Band Diagram */}
                    <svg width="100%" height="100%" viewBox="0 0 400 160">
                      {/* Ec line */}
                      <line x1="50" y1="20" x2="350" y2="20" stroke="#94a3b8" strokeWidth="2" />
                      <text x="360" y="24" fill="#94a3b8" fontSize="12" fontFamily="monospace">Ec ({sOutputs.Ec.toFixed(2)} eV)</text>
                      
                      {/* Ei line */}
                      <line x1="50" y1="80" x2="350" y2="80" stroke="#475569" strokeWidth="1" strokeDasharray="5,5" />
                      <text x="360" y="84" fill="#475569" fontSize="12" fontFamily="monospace">Ei (0 eV)</text>
                      
                      {/* Ev line */}
                      <line x1="50" y1="140" x2="350" y2="140" stroke="#94a3b8" strokeWidth="2" />
                      <text x="360" y="144" fill="#94a3b8" fontSize="12" fontFamily="monospace">Ev ({sOutputs.Ev.toFixed(2)} eV)</text>
                      
                      {/* Ef line */}
                      {/* Map Ef relative to Ei (y=80). Eg is from y=20 to y=140, so 120 units total. */}
                      {/* Each eV is 120 / Eg units. */}
                      {(() => {
                        const eg = sOutputs.Ec - sOutputs.Ev;
                        const scale = 120 / eg;
                        const y_ef = 80 - (sOutputs.Ef_minus_Ei * scale);
                        return (
                          <>
                            <line x1="50" y1={y_ef} x2="350" y2={y_ef} stroke="#10b981" strokeWidth="2" strokeDasharray="8,4" />
                            <text x="10" y={y_ef + 4} fill="#10b981" fontSize="12" fontFamily="monospace" fontWeight="bold">Ef</text>
                            
                            {/* Ef-Ei indicator */}
                            <line x1="200" y1="80" x2="200" y2={y_ef} stroke="#10b981" strokeWidth="1" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
                            <text x="210" y={80 - (80 - y_ef)/2 + 4} fill="#10b981" fontSize="10" fontFamily="monospace">{Math.abs(sOutputs.Ef_minus_Ei).toFixed(3)} eV</text>
                          </>
                        );
                      })()}

                      <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                        </marker>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIELECTRICS */}
          {activeTab === 'dielectric' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Globe className="h-5 w-5 text-cyan-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Dielectric Properties</h3>
                </div>
                
                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Static Permittivity (ε_r)</label>
                    <input type="number" value={dInputs.eps_r} onChange={e => setDInputs({...dInputs, eps_r: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Optical Permittivity (ε_∞)</label>
                    <input type="number" value={dInputs.eps_inf} onChange={e => setDInputs({...dInputs, eps_inf: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Relaxation Time τ (s)</label>
                    <input type="number" value={dInputs.tau} onChange={e => setDInputs({...dInputs, tau: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                  <div className="space-y-1.5 border-t border-navy-light/40 pt-4">
                    <label className="text-slate-400 block">Number Density N (m⁻³)</label>
                    <input type="number" value={dInputs.N} onChange={e => setDInputs({...dInputs, N: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-6">
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b border-navy-light/40">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">Clausius-Mossotti Polarizability</h4>
                    <IEEEReportButton experimentName="Dielectric Relaxation" inputData={{'Static Eps': dInputs.eps_r}} outputData={{'Alpha': formatSci(dOutputs.alpha)}} chartSelectors={['#dielectric-chart']} />
                  </div>

                  <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-xl">
                    <span className="text-[10px] text-cyan-400 font-mono uppercase font-bold block mb-1">Electronic/Ionic Polarizability (α)</span>
                    <span className="text-2xl font-black text-cyan-400 font-mono">{formatSci(dOutputs.alpha)} <span className="text-xs text-cyan-400/60 font-sans">F·m²</span></span>
                  </div>

                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider border-b border-navy-light/40 pb-2 mt-6">Debye Relaxation Frequency Response</h4>
                  <div className="h-80 w-full" id="dielectric-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dOutputs.plotData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis 
                          dataKey="log_f" 
                          type="number" 
                          stroke="#64748b" 
                          style={{ fontSize: '11px' }} 
                          tickFormatter={(v)=> `10^${v.toFixed(0)}`} 
                          label={{ value: 'Frequency (Hz) [Log Scale]', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} 
                          domain={['dataMin', 'dataMax']}
                        />
                        <YAxis stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Permittivity', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} 
                          formatter={(value: number) => value.toFixed(2)} 
                          labelFormatter={(label: number) => `f = 10^${label.toFixed(2)} Hz`} 
                        />
                        <Legend verticalAlign="top" height={36} iconType="plainline" />
                        <Line type="monotone" dataKey="eps_real" stroke="#22d3ee" strokeWidth={2} dot={false} name="Real (ε')" />
                        <Line type="monotone" dataKey="eps_imag" stroke="#818cf8" strokeWidth={2} dot={false} name="Imaginary Loss (ε'')" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SUPERCONDUCTOR */}
          {activeTab === 'superconductor' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Thermometer className="h-5 w-5 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Superconductor Specs</h3>
                </div>
                
                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Critical Temp, Tc (K)</label>
                    <input type="number" value={scInputs.Tc} onChange={e => setScInputs({...scInputs, Tc: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Critical Field at 0K, Hc(0) [T]</label>
                    <input type="number" value={scInputs.Hc0} onChange={e => setScInputs({...scInputs, Hc0: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                  <div className="space-y-1.5 border-t border-navy-light/40 pt-4">
                    <label className="text-slate-400 block">Operating Temp, Top (K)</label>
                    <input type="number" value={scInputs.Top} onChange={e => setScInputs({...scInputs, Top: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-6">
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b border-navy-light/40">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">Phase Boundary & Operating Point</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block mb-1">State at Top</span>
                      <span className={`text-xl font-bold font-mono ${scInputs.Top < scInputs.Tc ? 'text-indigo-400' : 'text-slate-400'}`}>
                        {scInputs.Top < scInputs.Tc ? 'SUPERCONDUCTING' : 'NORMAL'}
                      </span>
                    </div>
                    <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block mb-1">Critical Field Hc(Top)</span>
                      <span className="text-xl font-bold text-white font-mono">{scOutputs.Hc_op.toFixed(4)} <span className="text-xs text-slate-400">T</span></span>
                    </div>
                  </div>

                  <div className="h-80 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={scOutputs.plotData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="T" type="number" stroke="#64748b" style={{ fontSize: '11px' }} tickFormatter={(v)=>v.toFixed(1)} label={{ value: 'Temperature (K)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Critical Field Hc (T)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} formatter={(value: number) => value.toFixed(4) + ' T'} labelFormatter={(label: number) => `T = ${label.toFixed(2)} K`} />
                        <defs>
                          <linearGradient id="colorHc" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="Hc" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorHc)" name="Phase Boundary" />
                        {/* Plot operating point as a reference dot if we could, but AreaChart is fine */}
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className="text-center mt-2 text-xs text-slate-500 font-mono">Shaded region = Superconducting State | Above curve = Normal State</div>
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
