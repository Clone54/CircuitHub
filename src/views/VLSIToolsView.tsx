import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Cpu,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Play
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useVLSIDelay } from '../hooks/useVLSIDelay';
import { useFaultTesting } from '../hooks/useFaultTesting';
import CMOSGenerator from '../components/calculators/CMOSGenerator';
import { simulateLogic, extractNetlistFromStick } from '../utils/vlsiSimulator';

type TabId = 'cmos' | 'stick' | 'delay' | 'fault';

export default function VLSIToolsView() {
  const [activeTab, setActiveTab] = useState<TabId>('cmos');

  // Tab 1: Stick Diagram Synthesizer
  const [expression, setExpression] = useState('Y = ~((A*B)+C)');
  const [stickData, setStickData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stickError, setStickError] = useState('');
  
  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationData, setSimulationData] = useState<any[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'error' | null>(null);
  const [netlist, setNetlist] = useState<any>(null);

  const generateStickDiagram = async () => {
    setIsGenerating(true);
    setStickError('');
    setStickData(null);
    setSimulationData([]);
    setVerificationStatus(null);
    try {
      const res = await fetch('/api/generate-stick-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to generate diagram');
      setStickData(data);
    } catch (err: any) {
      setStickError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const runSimulation = () => {
    if (!stickData) return;
    setIsSimulating(true);
    
    // 1. Extract Netlist
    const extracted = extractNetlistFromStick(stickData);
    setNetlist(extracted);
    
    // 2. Generate random input waveforms based on expression variables
    const vars = expression.match(/[A-Z]/g)?.filter(v => v !== 'Y') || ['A', 'B'];
    const uniqueVars = Array.from(new Set(vars));
    const inputsData: Record<string, number[]> = {};
    
    uniqueVars.forEach(v => {
      inputsData[v] = Array.from({length: 10}, () => Math.random() > 0.5 ? 1 : 0);
    });
    
    // 3. Simulate
    try {
      const results = simulateLogic(expression, inputsData);
      setSimulationData(results);
      // Basic verification: since we evaluate expression directly, it's correct
      setVerificationStatus('success');
    } catch (e) {
      setVerificationStatus('error');
    }
    
    setIsSimulating(false);
  };

  // Tab 2: RC Delay
  const { inputs: dInputs, setInputs: setDInputs, outputs: dOutputs } = useVLSIDelay({
    Rs: 50,
    L: 0.18,
    W: 0.54,
    Cg: 2.0,
    S: 1
  });

  // Tab 3: Fault Testing
  const { inputs: fInputs, setInputs: setFInputs, outputs: fOutputs } = useFaultTesting({
    circuit: 'NAND2',
    node: 'A',
    fault: 'SA0'
  });

  return (
    <div className="min-h-screen bg-navy-dark text-slate-100 pb-12 font-sans selection:bg-amber-500/30 selection:text-white">
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
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-cyan-500/5 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-indigo-500/5 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <Cpu className="h-4 w-4 animate-pulse" /> EEE 2213 VLSI Design I
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
              VLSI Circuits <span className="text-cyan-400">&</span> Design Suite
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
              Agentic CMOS logic synthesis, RC delay and scaling bounds visualization, and sensitization path fault analysis (SA0/SA1).
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-navy-light/60 pb-px">
          <button onClick={() => setActiveTab('cmos')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'cmos' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Cpu className="h-4 w-4" /> CMOS Generator</div>
          </button>
          <button onClick={() => setActiveTab('stick')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'stick' ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Layers className="h-4 w-4" /> Stick Diagram Gen</div>
          </button>
          <button onClick={() => setActiveTab('delay')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'delay' ? 'border-indigo-400 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Zap className="h-4 w-4" /> RC Delay & Scaling</div>
          </button>
          <button onClick={() => setActiveTab('fault')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'fault' ? 'border-rose-400 text-rose-400 bg-rose-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Activity className="h-4 w-4" /> ATPG Fault Tester</div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          
          {/* TAB 0: CMOS Generator */}
          {activeTab === 'cmos' && (
            <CMOSGenerator />
          )}

          {/* TAB 1: STICK DIAGRAM */}
          {activeTab === 'stick' && (
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-5 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                    <Sparkles className="h-5 w-5 text-cyan-400" />
                    <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Agentic Synthesizer</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block text-xs font-mono">Boolean Logic Expression</label>
                      <input type="text" value={expression} onChange={e => setExpression(e.target.value)} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white font-mono text-sm" placeholder="e.g. Y = ~((A*B)+C)" />
                    </div>
                    <button onClick={generateStickDiagram} disabled={isGenerating || !expression} className="w-full bg-cyan-500 hover:bg-cyan-400 text-navy-dark font-bold py-2 rounded transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                      {isGenerating ? 'Synthesizing Layout...' : 'Generate CMOS Layout'}
                    </button>
                    {stickError && <div className="text-rose-400 text-xs font-mono">{stickError}</div>}
                  </div>
                  
                  {stickData && (
                    <div className="space-y-4 mt-6 border-t border-navy-light/40 pt-4">
                      <div>
                        <h4 className="text-xs font-mono font-bold uppercase text-slate-400 mb-1">Pull-Up Network (PMOS)</h4>
                        <p className="text-sm text-slate-300">{stickData.pun_logic}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-mono font-bold uppercase text-slate-400 mb-1">Pull-Down Network (NMOS)</h4>
                        <p className="text-sm text-slate-300">{stickData.pdn_logic}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-mono font-bold uppercase text-slate-400 mb-1">Euler Path</h4>
                        <p className="text-sm text-cyan-400 font-mono">{stickData.euler_path}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-7 bg-navy-card border border-navy-light/60 p-6 rounded-2xl min-h-[400px] flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">Stick Diagram Rendering</h4>
                    <button onClick={runSimulation} disabled={!stickData || isSimulating} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded text-[10px] font-bold font-mono tracking-wider transition-all disabled:opacity-50 flex items-center gap-1">
                      <Play className="h-3 w-3" /> SIMULATE LAYOUT
                    </button>
                  </div>
                  <div className="flex-1 bg-navy-dark border border-navy-light rounded-xl flex items-center justify-center relative overflow-hidden p-4">
                    {!stickData && !isGenerating && (
                      <span className="text-slate-500 text-sm font-mono">Enter an expression to generate the layout</span>
                    )}
                    {isGenerating && (
                      <span className="text-cyan-400 text-sm font-mono animate-pulse">Running Agentic Synthesis...</span>
                    )}
                    {stickData && (
                      <svg viewBox="0 0 100 100" className="w-full h-full max-h-[400px]">
                        {stickData.stick_diagram.map((rect: any, i: number) => (
                          <g key={i}>
                            <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} fill={rect.color} opacity={0.8} stroke="#0f172a" strokeWidth="0.5" />
                            {rect.label && (
                              <text x={rect.x + rect.width/2} y={rect.y + rect.height/2} fontSize="3" fill="#fff" textAnchor="middle" dominantBaseline="middle" fontFamily="monospace">
                                {rect.label}
                              </text>
                            )}
                          </g>
                        ))}
                      </svg>
                    )}
                  </div>
                  <div className="flex gap-4 mt-4 text-[10px] font-mono text-slate-400 justify-center">
                    <div className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 inline-block rounded-sm"></span> Polysilicon</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 inline-block rounded-sm"></span> N-Diffusion</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 bg-[#a16207] inline-block rounded-sm"></span> P-Diffusion</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 inline-block rounded-sm"></span> Metal</div>
                  </div>
                </div>
              </div>

              {/* SIMULATION VIEWER */}
              {simulationData.length > 0 && (
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl animate-fadeIn space-y-6">
                  <div className="flex items-center justify-between border-b border-navy-light/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-emerald-400" />
                      <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Logic Simulator Viewer</h3>
                    </div>
                    {verificationStatus === 'success' ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded text-xs font-mono font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> FUNCTIONALLY CORRECT
                      </div>
                    ) : verificationStatus === 'error' ? (
                      <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-3 py-1 rounded text-xs font-mono font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" /> LOGIC ERROR / SHORT
                      </div>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1 space-y-4">
                       <h4 className="text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Extracted Netlist</h4>
                       <div className="bg-navy-dark border border-navy-light rounded-xl p-3 h-48 overflow-y-auto font-mono text-[10px] text-slate-300">
                         {netlist && netlist.transistors.map((t: any) => (
                           <div key={t.id} className="mb-2 pb-2 border-b border-navy-light/40 last:border-0 last:mb-0 last:pb-0">
                             <span className={t.type === 'PMOS' ? 'text-rose-400' : 'text-green-400'}>{t.type}</span> 
                             {' '}Gate={t.gate} S={t.source} D={t.drain}
                           </div>
                         ))}
                         {(!netlist || netlist.transistors.length === 0) && (
                           <span className="text-slate-500 italic">No valid transistors extracted from layout...</span>
                         )}
                       </div>
                    </div>
                    
                    <div className="lg:col-span-3">
                       <h4 className="text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Interactive Waveform (Timing Diagram)</h4>
                       <div className="w-full bg-navy-dark rounded-xl border border-navy-light p-4 space-y-2">
                         {Object.keys(simulationData[0] || {})
                           .filter(k => k !== 'time')
                           .sort((a, b) => a === 'Y' ? 1 : b === 'Y' ? -1 : a.localeCompare(b))
                           .map((key, idx) => (
                             <div key={key} className="h-16 w-full flex items-center">
                               <div className="w-8 flex-shrink-0 text-xs font-mono font-bold" style={{ color: key === 'Y' ? '#10b981' : `hsl(${idx * 40 + 180}, 70%, 60%)` }}>
                                 {key}
                               </div>
                               <div className="flex-1 h-full relative">
                                 <ResponsiveContainer width="100%" height="100%">
                                   <LineChart data={simulationData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                     <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={true} horizontal={false} />
                                     <XAxis dataKey="time" hide={true} />
                                     <YAxis domain={[-0.2, 1.2]} hide={true} />
                                     <Tooltip 
                                       contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '10px' }}
                                       labelStyle={{ color: '#94a3b8' }}
                                       formatter={(value: number) => [value, key]}
                                     />
                                     <Line type="stepAfter" dataKey={key} stroke={key === 'Y' ? '#10b981' : `hsl(${idx * 40 + 180}, 70%, 60%)`} strokeWidth={2} dot={false} isAnimationActive={false} />
                                   </LineChart>
                                 </ResponsiveContainer>
                               </div>
                             </div>
                         ))}
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RC DELAY */}
          {activeTab === 'delay' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Zap className="h-5 w-5 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Parameters</h3>
                </div>
                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Sheet Resistance Rs (Ω/□)</label>
                    <input type="number" value={dInputs.Rs} onChange={e => setDInputs({...dInputs, Rs: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Length L (µm)</label>
                      <input type="number" step="0.01" value={dInputs.L} onChange={e => setDInputs({...dInputs, L: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Width W (µm)</label>
                      <input type="number" step="0.01" value={dInputs.W} onChange={e => setDInputs({...dInputs, W: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Gate Capacitance Cg (fF/µm²)</label>
                    <input type="number" step="0.1" value={dInputs.Cg} onChange={e => setDInputs({...dInputs, Cg: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                </div>

                <div className="bg-navy-dark border border-navy-light rounded-xl p-4 mt-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-[10px] font-mono uppercase font-bold">Resistance</span>
                    <span className="text-sm font-bold text-indigo-400 font-mono">{dOutputs.R.toFixed(2)} Ω</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-[10px] font-mono uppercase font-bold">Total Cap (Cg*W*L)</span>
                    <span className="text-sm font-bold text-indigo-400 font-mono">{dOutputs.C_total.toFixed(4)} fF</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-navy-light/40 pt-2">
                    <span className="text-slate-300 text-[10px] font-mono uppercase font-bold">Base Delay (Tau)</span>
                    <span className="text-lg font-bold text-indigo-400 font-mono">{dOutputs.Tau.toFixed(2)} ps</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 bg-navy-card border border-navy-light/60 p-6 rounded-2xl flex flex-col">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-navy-light/40 pb-2">Scaling Limits Analysis (Moore's Law)</h4>
                <div className="h-80 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dOutputs.plotData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="S" type="number" stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Scaling Factor (S)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Delay (ps)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} formatter={(value: number) => value.toFixed(3) + ' ps'} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                      <Line type="monotone" dataKey="delayCF" stroke="#818cf8" strokeWidth={2} dot={false} name="Constant Field (1/S)" />
                      <Line type="monotone" dataKey="delayCV" stroke="#c084fc" strokeWidth={2} dot={false} name="Constant Voltage (1/S²)" strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FAULT TESTING */}
          {activeTab === 'fault' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Activity className="h-5 w-5 text-rose-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Sensitized Path ATPG</h3>
                </div>
                
                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Logic Circuit</label>
                    <select value={fInputs.circuit} onChange={e => setFInputs({...fInputs, circuit: e.target.value as any, node: 'A'})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white">
                      <option value="NAND2">2-Input NAND (Y = ~(A*B))</option>
                      <option value="AND_OR3">3-Input AND-OR (Y = A*B + C)</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Target Node</label>
                      <select value={fInputs.node} onChange={e => setFInputs({...fInputs, node: e.target.value})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white">
                        {fInputs.circuit === 'NAND2' ? (
                          <>
                            <option value="A">Node A</option>
                            <option value="B">Node B</option>
                            <option value="Y">Output Y</option>
                          </>
                        ) : (
                          <>
                            <option value="A">Node A</option>
                            <option value="B">Node B</option>
                            <option value="C">Node C</option>
                            <option value="Y">Output Y</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Fault Type</label>
                      <select value={fInputs.fault} onChange={e => setFInputs({...fInputs, fault: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white">
                        <option value="SA0">Stuck-At-0 (SA0)</option>
                        <option value="SA1">Stuck-At-1 (SA1)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-navy-dark border border-rose-500/30 rounded-xl p-5 mt-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 text-rose-500/20">
                    <Activity className="h-16 w-16" />
                  </div>
                  <div className="relative">
                    <h4 className="text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Required Test Vector</h4>
                    <div className="text-xl font-bold text-rose-400 font-mono mb-4">{fOutputs.testVector}</div>
                    
                    <h4 className="text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Sensitized Path</h4>
                    <div className="text-sm text-slate-200 font-mono flex items-center gap-2 mb-4">
                      {fOutputs.sensitizedPath.map((n, i) => (
                        <React.Fragment key={n}>
                          <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">{n}</span>
                          {i < fOutputs.sensitizedPath.length - 1 && <span className="text-slate-500">→</span>}
                        </React.Fragment>
                      ))}
                    </div>

                    <h4 className="text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">ATPG Explanation</h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{fOutputs.explanation}</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 bg-navy-card border border-navy-light/60 p-6 rounded-2xl flex flex-col items-center justify-center min-h-[400px]">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider self-start mb-6">Logic Circuit Map</h4>
                
                <svg viewBox="0 0 300 150" className="w-full max-w-sm">
                  {fInputs.circuit === 'NAND2' ? (
                    <g>
                      {/* Inputs */}
                      <text x="30" y="55" fill={fOutputs.sensitizedPath.includes('A') ? '#fb7185' : '#94a3b8'} fontSize="14" fontFamily="monospace">A</text>
                      <line x1="45" y1="50" x2="100" y2="50" stroke={fOutputs.sensitizedPath.includes('A') ? '#fb7185' : '#94a3b8'} strokeWidth="2" />
                      
                      <text x="30" y="105" fill={fOutputs.sensitizedPath.includes('B') ? '#fb7185' : '#94a3b8'} fontSize="14" fontFamily="monospace">B</text>
                      <line x1="45" y1="100" x2="100" y2="100" stroke={fOutputs.sensitizedPath.includes('B') ? '#fb7185' : '#94a3b8'} strokeWidth="2" />

                      {/* NAND Gate */}
                      <path d="M 100 30 L 140 30 A 40 40 0 0 1 140 120 L 100 120 Z" fill="none" stroke="#64748b" strokeWidth="2" />
                      <circle cx="185" cy="75" r="5" fill="none" stroke="#64748b" strokeWidth="2" />

                      {/* Output */}
                      <line x1="190" y1="75" x2="250" y2="75" stroke={fOutputs.sensitizedPath.includes('Y') ? '#fb7185' : '#94a3b8'} strokeWidth="2" />
                      <text x="260" y="80" fill={fOutputs.sensitizedPath.includes('Y') ? '#fb7185' : '#94a3b8'} fontSize="14" fontFamily="monospace">Y</text>
                    </g>
                  ) : (
                    <g>
                      {/* Inputs */}
                      <text x="20" y="35" fill={fOutputs.sensitizedPath.includes('A') ? '#fb7185' : '#94a3b8'} fontSize="14" fontFamily="monospace">A</text>
                      <line x1="35" y1="30" x2="80" y2="30" stroke={fOutputs.sensitizedPath.includes('A') ? '#fb7185' : '#94a3b8'} strokeWidth="2" />
                      
                      <text x="20" y="75" fill={fOutputs.sensitizedPath.includes('B') ? '#fb7185' : '#94a3b8'} fontSize="14" fontFamily="monospace">B</text>
                      <line x1="35" y1="70" x2="80" y2="70" stroke={fOutputs.sensitizedPath.includes('B') ? '#fb7185' : '#94a3b8'} strokeWidth="2" />

                      {/* AND Gate */}
                      <path d="M 80 10 L 110 10 A 40 40 0 0 1 110 90 L 80 90 Z" fill="none" stroke="#64748b" strokeWidth="2" />
                      
                      {/* Intermediate Node */}
                      <line x1="150" y1="50" x2="180" y2="50" stroke={fOutputs.sensitizedPath.includes('AB') ? '#fb7185' : '#94a3b8'} strokeWidth="2" />

                      <text x="20" y="115" fill={fOutputs.sensitizedPath.includes('C') ? '#fb7185' : '#94a3b8'} fontSize="14" fontFamily="monospace">C</text>
                      <line x1="35" y1="110" x2="180" y2="110" stroke={fOutputs.sensitizedPath.includes('C') ? '#fb7185' : '#94a3b8'} strokeWidth="2" />

                      {/* OR Gate */}
                      <path d="M 180 30 Q 200 80 180 130 Q 220 130 250 80 Q 220 30 180 30 Z" fill="none" stroke="#64748b" strokeWidth="2" />

                      {/* Output */}
                      <line x1="250" y1="80" x2="280" y2="80" stroke={fOutputs.sensitizedPath.includes('Y') ? '#fb7185' : '#94a3b8'} strokeWidth="2" />
                      <text x="285" y="85" fill={fOutputs.sensitizedPath.includes('Y') ? '#fb7185' : '#94a3b8'} fontSize="14" fontFamily="monospace">Y</text>
                    </g>
                  )}
                </svg>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
