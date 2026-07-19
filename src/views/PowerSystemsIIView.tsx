import React, { useState } from 'react';
import { Zap, Activity, AlertTriangle, Shield, Table, LayoutGrid, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, Legend, ReferenceLine } from 'recharts';
import { usePowerFlow } from '../hooks/usePowerFlow';
import { useFaultAnalysis, FaultType } from '../hooks/useFaultAnalysis';
import { useStability } from '../hooks/useStability';

export default function PowerSystemsIIView() {
  const [activeTab, setActiveTab] = useState<'powerflow' | 'faults' | 'stability'>('powerflow');
  
  const pf = usePowerFlow();
  const fa = useFaultAnalysis();
  const st = useStability();

  const handleCsvImport = () => {
    // Mock import for UI completeness
    alert("CSV Imported Successfully! (Mock implementation)");
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-6 w-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Power Systems II Suite</h1>
          </div>
          <p className="text-slate-400 max-w-2xl text-sm">
            Interactive solvers for Load Flow Analysis, Symmetrical & Unsymmetrical Faults, and Transient Stability.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-navy-light/60 pb-px">
        <button onClick={() => setActiveTab('powerflow')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'powerflow' ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
          <div className="flex items-center gap-2"><LayoutGrid className="h-4 w-4" /> Load Flow (GS/NR)</div>
        </button>
        <button onClick={() => setActiveTab('faults')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'faults' ? 'border-amber-400 text-amber-400 bg-amber-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
          <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Fault Analysis</div>
        </button>
        <button onClick={() => setActiveTab('stability')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'stability' ? 'border-rose-400 text-rose-400 bg-rose-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
          <div className="flex items-center gap-2"><Activity className="h-4 w-4" /> Transient Stability</div>
        </button>
      </div>

      {/* TAB: Power Flow */}
      {activeTab === 'powerflow' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-navy-light/60">
                <div className="flex items-center gap-2">
                  <Table className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Input Data</h3>
                </div>
                <button onClick={handleCsvImport} className="text-xs bg-navy-light text-slate-300 px-3 py-1 rounded hover:bg-navy-light/80 transition-colors">Import CSV</button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Method</label>
                  <select 
                    value={pf.method}
                    onChange={(e) => pf.setMethod(e.target.value as any)}
                    className="w-full bg-navy-dark text-white text-sm rounded-lg px-3 py-2 border border-navy-light focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="gs">Gauss-Seidel</option>
                    <option value="nr">Newton-Raphson</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Max Iterations</label>
                  <input type="number" value={pf.maxIter} onChange={e => pf.setMaxIter(Number(e.target.value))} className="w-full bg-navy-dark text-white text-sm rounded-lg px-3 py-2 border border-navy-light focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tolerance (pu)</label>
                  <input type="number" step="0.0001" value={pf.tolerance} onChange={e => pf.setTolerance(Number(e.target.value))} className="w-full bg-navy-dark text-white text-sm rounded-lg px-3 py-2 border border-navy-light focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>

              <button 
                onClick={pf.solvePowerFlow}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-navy-900 font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
              >
                Execute Load Flow
              </button>
            </div>
          </div>

          {/* Visualization / Results */}
          <div className="lg:col-span-8 bg-navy-card border border-navy-light/60 p-6 rounded-2xl flex flex-col">
            <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60 mb-6">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Convergence Results</h3>
            </div>
            
            {pf.error && (
               <div className="p-4 bg-rose-500/20 border border-rose-500/50 rounded-lg text-rose-400 text-sm mb-4">
                 {pf.error}
               </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
               <div className="bg-navy-dark p-4 rounded-xl border border-navy-light/50">
                  <div className="text-xs text-slate-500 mb-1 font-mono uppercase tracking-wider">Method</div>
                  <div className="text-xl font-bold text-white">{pf.method === 'gs' ? 'Gauss-Seidel' : 'Newton-Raphson'}</div>
               </div>
               <div className="bg-navy-dark p-4 rounded-xl border border-navy-light/50">
                  <div className="text-xs text-slate-500 mb-1 font-mono uppercase tracking-wider">Iterations</div>
                  <div className="text-xl font-bold text-emerald-400">{pf.iterations}</div>
               </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-navy-dark/50 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Bus No.</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">|V| (pu)</th>
                    <th className="px-4 py-3 rounded-tr-lg">Angle (deg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-light/30">
                  {pf.results.length > 0 ? pf.results.map((r, i) => (
                    <tr key={i} className="hover:bg-navy-light/10 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-300">{pf.buses[i].id}</td>
                      <td className="px-4 py-3 text-slate-400">{pf.buses[i].type.toUpperCase()}</td>
                      <td className={`px-4 py-3 font-mono font-bold ${Math.abs(r.vMag - 1) > 0.05 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {r.vMag.toFixed(4)}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">{r.vAng.toFixed(4)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">No results yet. Click Execute Load Flow.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="mt-8 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                <h4 className="text-emerald-400 font-bold text-sm mb-2 font-mono flex items-center gap-2"><LayoutGrid className="w-4 h-4"/> SLD Visualization</h4>
                <div className="h-32 flex items-center justify-center border border-dashed border-emerald-500/30 rounded-lg text-slate-500 text-xs">
                    [Single Line Diagram Canvas - Active Voltages Highlighted]
                </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Fault Analysis */}
      {activeTab === 'faults' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Fault Settings</h3>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Fault Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {['L-G', 'L-L', 'L-L-G', '3-Phase'].map((t) => (
                    <button
                      key={t}
                      onClick={() => fa.setFaultType(t as any)}
                      className={`py-2 text-xs font-bold rounded-lg transition-colors border ${
                        fa.faultType === t 
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' 
                          : 'bg-navy-dark text-slate-400 border-transparent hover:bg-navy-light/40'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-400 border-b border-navy-light/50 pb-2">Sequence Impedances (pu)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Z1 (Positive) X</label>
                    <input type="number" step="0.01" value={fa.seq.z1_x} onChange={e => fa.setSeq({...fa.seq, z1_x: Number(e.target.value)})} className="w-full bg-navy-dark text-white text-sm rounded-lg px-3 py-2 border border-navy-light focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Z2 (Negative) X</label>
                    <input type="number" step="0.01" value={fa.seq.z2_x} onChange={e => fa.setSeq({...fa.seq, z2_x: Number(e.target.value)})} className="w-full bg-navy-dark text-white text-sm rounded-lg px-3 py-2 border border-navy-light focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Z0 (Zero) X</label>
                    <input type="number" step="0.01" value={fa.seq.z0_x} onChange={e => fa.setSeq({...fa.seq, z0_x: Number(e.target.value)})} className="w-full bg-navy-dark text-white text-sm rounded-lg px-3 py-2 border border-navy-light focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Zf (Fault) X</label>
                    <input type="number" step="0.01" value={fa.seq.zf_x} onChange={e => fa.setSeq({...fa.seq, zf_x: Number(e.target.value)})} className="w-full bg-navy-dark text-white text-sm rounded-lg px-3 py-2 border border-navy-light focus:border-amber-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-8 bg-navy-card border border-navy-light/60 p-6 rounded-2xl">
             <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60 mb-6">
              <Shield className="h-5 w-5 text-amber-400" />
              <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Analysis Results</h3>
            </div>

            <p className="text-sm text-amber-200/70 mb-6 italic">{fa.results.desc}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-xs font-mono uppercase text-slate-500 tracking-wider">Sequence Currents</h4>
                <div className="bg-navy-dark rounded-xl border border-navy-light/50 p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">I<sub className="text-[10px]">0</sub> (Zero)</span>
                    <span className="font-mono font-bold text-amber-400">{fa.results.I0.toPolar().r.toFixed(4)} &ang; {fa.results.I0.toPolar().phi * 180 / Math.PI | 0}&deg;</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">I<sub className="text-[10px]">1</sub> (Positive)</span>
                    <span className="font-mono font-bold text-amber-400">{fa.results.I1.toPolar().r.toFixed(4)} &ang; {fa.results.I1.toPolar().phi * 180 / Math.PI | 0}&deg;</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">I<sub className="text-[10px]">2</sub> (Negative)</span>
                    <span className="font-mono font-bold text-amber-400">{fa.results.I2.toPolar().r.toFixed(4)} &ang; {fa.results.I2.toPolar().phi * 180 / Math.PI | 0}&deg;</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-mono uppercase text-slate-500 tracking-wider">Phase Currents</h4>
                <div className="bg-navy-dark rounded-xl border border-navy-light/50 p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">I<sub className="text-[10px]">a</sub></span>
                    <span className="font-mono font-bold text-rose-400">{fa.results.Ia.toPolar().r.toFixed(4)} &ang; {fa.results.Ia.toPolar().phi * 180 / Math.PI | 0}&deg;</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">I<sub className="text-[10px]">b</sub></span>
                    <span className="font-mono font-bold text-emerald-400">{fa.results.Ib.toPolar().r.toFixed(4)} &ang; {fa.results.Ib.toPolar().phi * 180 / Math.PI | 0}&deg;</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">I<sub className="text-[10px]">c</sub></span>
                    <span className="font-mono font-bold text-sky-400">{fa.results.Ic.toPolar().r.toFixed(4)} &ang; {fa.results.Ic.toPolar().phi * 180 / Math.PI | 0}&deg;</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <h4 className="text-amber-400 font-bold text-sm mb-2 font-mono flex items-center gap-2"><LayoutGrid className="w-4 h-4"/> Sequence Network Diagram</h4>
                <div className="h-32 flex items-center justify-center border border-dashed border-amber-500/30 rounded-lg text-slate-500 text-xs">
                    [Network Interconnection for {fa.faultType} Fault]
                </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Stability */}
      {activeTab === 'stability' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Activity className="h-5 w-5 text-rose-400" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Swing Equation</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Mechanical Power (Pm)</label>
                  <input type="number" step="0.1" value={st.Pm} onChange={e => st.setPm(Number(e.target.value))} className="w-full bg-navy-dark text-white text-sm rounded-lg px-3 py-2 border border-navy-light focus:border-rose-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Pe_max (Pre-fault)</label>
                  <input type="number" step="0.1" value={st.PeMax} onChange={e => st.setPeMax(Number(e.target.value))} className="w-full bg-navy-dark text-white text-sm rounded-lg px-3 py-2 border border-navy-light focus:border-rose-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Pe_max (During-fault)</label>
                  <input type="number" step="0.1" value={st.PeMaxFault} onChange={e => st.setPeMaxFault(Number(e.target.value))} className="w-full bg-navy-dark text-white text-sm rounded-lg px-3 py-2 border border-navy-light focus:border-rose-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Pe_max (Post-fault)</label>
                  <input type="number" step="0.1" value={st.PeMaxPost} onChange={e => st.setPeMaxPost(Number(e.target.value))} className="w-full bg-navy-dark text-white text-sm rounded-lg px-3 py-2 border border-navy-light focus:border-rose-500" />
                </div>
                <div className="pt-2 border-t border-navy-light/50">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Clearing Angle (&delta;c)</label>
                  <input type="range" min={Math.max(0, st.results.d0 | 0)} max={180} value={st.deltaC} onChange={e => st.setDeltaC(Number(e.target.value))} className="w-full accent-rose-500" />
                  <div className="text-right text-xs text-rose-400 font-mono mt-1">{st.deltaC}&deg;</div>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-8 bg-navy-card border border-navy-light/60 p-6 rounded-2xl">
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-navy-dark p-4 rounded-xl border border-navy-light/50">
                <div className="text-[10px] text-slate-500 mb-1 font-mono uppercase tracking-wider">A1 (Accel)</div>
                <div className="text-lg font-bold text-rose-400">{st.results.A1.toFixed(3)}</div>
              </div>
              <div className="bg-navy-dark p-4 rounded-xl border border-navy-light/50">
                <div className="text-[10px] text-slate-500 mb-1 font-mono uppercase tracking-wider">A2 (Decel)</div>
                <div className="text-lg font-bold text-emerald-400">{st.results.A2.toFixed(3)}</div>
              </div>
              <div className="bg-navy-dark p-4 rounded-xl border border-navy-light/50">
                <div className="text-[10px] text-slate-500 mb-1 font-mono uppercase tracking-wider">Stability</div>
                <div className={`text-lg font-bold ${st.results.isStable ? 'text-emerald-400' : 'text-rose-500'}`}>{st.results.isStable ? 'STABLE' : 'UNSTABLE'}</div>
              </div>
              <div className="bg-navy-dark p-4 rounded-xl border border-navy-light/50">
                <div className="text-[10px] text-slate-500 mb-1 font-mono uppercase tracking-wider">Critical &delta;</div>
                <div className="text-lg font-bold text-amber-400">{isNaN(st.results.dcr) ? 'N/A' : `${st.results.dcr.toFixed(1)}°`}</div>
              </div>
            </div>

            <div className="h-[400px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={st.results.plotData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis 
                      dataKey="delta" 
                      stroke="#64748b" 
                      style={{ fontSize: '11px' }} 
                      type="number"
                      domain={[0, 180]}
                      ticks={[0, 30, 60, 90, 120, 150, 180]}
                    />
                    <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                      itemStyle={{ color: '#94a3b8' }}
                      formatter={(val: number) => val.toFixed(2)}
                      labelFormatter={(label) => `Angle: ${label}°`}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }}/>
                    
                    <ReferenceLine y={st.Pm} stroke="#f43f5e" strokeDasharray="3 3" label={{ position: 'top', value: 'Pm', fill: '#f43f5e', fontSize: 10 }} />
                    <ReferenceLine x={st.results.d0} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'bottom', value: 'δ0', fill: '#94a3b8', fontSize: 10 }} />
                    <ReferenceLine x={st.deltaC} stroke="#fbbf24" strokeWidth={2} label={{ position: 'bottom', value: 'δc', fill: '#fbbf24', fontSize: 10 }} />
                    
                    <Line type="monotone" dataKey="pre" name="Pre-Fault Pe" stroke="#94a3b8" strokeWidth={1} dot={false} />
                    <Line type="monotone" dataKey="during" name="During-Fault Pe" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="post" name="Post-Fault Pe" stroke="#10b981" strokeWidth={2} dot={false} />
                  </ComposedChart>
               </ResponsiveContainer>
            </div>
            <div className="text-center text-xs text-slate-500 mt-4">
              Equal Area Criterion (EAC): A1 must be less than or equal to A2 to maintain stability.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
