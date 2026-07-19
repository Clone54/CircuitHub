import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Grid,
  Cpu,
  Activity,
  Zap,
  Code2,
  RefreshCw,
  Send,
  Table,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { IEEEReportButton } from '../components/IEEEReportButton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { useKMap } from '../hooks/useKMap';
import { useDataConverter } from '../hooks/useDataConverter';

type TabId = 'kmap' | 'fsm' | 'converter';

export default function DigitalToolsView() {
  const [activeTab, setActiveTab] = useState<TabId>('kmap');

  // --- Hook: K-Map ---
  const { inputs: kInputs, setInputs: setKInputs, outputs: kOutputs } = useKMap({
    variables: 4,
    minterms: '0, 1, 2, 4, 5, 6, 8, 9, 12, 13, 14',
    dontcares: ''
  });

  // --- Hook: Converter ---
  const { inputs: cInputs, setInputs: setCInputs, outputs: cOutputs } = useDataConverter({
    type: 'ADC-Flash',
    resolution: 8,
    Vref: 5.0
  });

  // --- FSM Architect State ---
  const [fsmPrompt, setFsmPrompt] = useState('Design a sequence detector for "1011" using a Mealy machine.');
  const [fsmResult, setFsmResult] = useState<any>(null);
  const [fsmLoading, setFsmLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFsmSolve = async () => {
    if (!fsmPrompt) return;
    setFsmLoading(true);
    setFsmResult(null);
    try {
      const res = await fetch('/api/fsm-architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fsmPrompt })
      });
      const data = await res.json();
      setFsmResult(data);
    } catch (e) {
      setFsmResult({
        stateTableMarkdown: 'Error reaching solver API.',
        booleanEquationsMarkdown: '',
        verilogCode: '// Error'
      });
    } finally {
      setFsmLoading(false);
    }
  };

  const handleCopy = () => {
    if (fsmResult?.verilogCode) {
      navigator.clipboard.writeText(fsmResult.verilogCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getColLabels = (vars: number) => {
    if (vars === 2) return ['B=0', 'B=1'];
    if (vars === 3) return ['BC=00', '01', '11', '10'];
    return ['CD=00', '01', '11', '10'];
  };

  const getRowLabels = (vars: number) => {
    if (vars === 2) return ['A=0', 'A=1'];
    if (vars === 3) return ['A=0', 'A=1'];
    return ['AB=00', '01', '11', '10'];
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
            <div className="flex items-center gap-2 text-emerald-accent font-semibold text-xs tracking-wider uppercase mb-2">
              <Cpu className="h-4 w-4 animate-pulse" /> EEE 2113 Digital Electronics I
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
              Digital Design <span className="text-emerald-accent">Analysis</span> Suite
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
              Minimize logic with K-Maps, dynamically generate Verilog FSMs, and visualize ADC/DAC quantization errors.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-navy-light/60 pb-px">
          <button onClick={() => setActiveTab('kmap')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'kmap' ? 'border-emerald-accent text-emerald-accent bg-emerald-accent/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Grid className="h-4 w-4" /> K-Map Minimizer</div>
          </button>
          <button onClick={() => setActiveTab('fsm')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'fsm' ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Code2 className="h-4 w-4" /> FSM Architect</div>
          </button>
          <button onClick={() => setActiveTab('converter')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'converter' ? 'border-indigo-400 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Activity className="h-4 w-4" /> ADC/DAC Quantization</div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          
          {/* TAB 1: K-MAP */}
          {activeTab === 'kmap' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Grid className="h-5 w-5 text-emerald-accent" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Minimization Engine</h3>
                </div>
                
                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Number of Variables</label>
                    <select value={kInputs.variables} onChange={e => setKInputs({...kInputs, variables: parseInt(e.target.value) as any})} className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white">
                      <option value={2}>2 Variables (A, B)</option>
                      <option value={3}>3 Variables (A, B, C)</option>
                      <option value={4}>4 Variables (A, B, C, D)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Minterms (comma separated)</label>
                    <input type="text" value={kInputs.minterms} onChange={e => setKInputs({...kInputs, minterms: e.target.value})} placeholder="e.g., 0, 1, 2, 4" className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Don't Cares (comma separated)</label>
                    <input type="text" value={kInputs.dontcares} onChange={e => setKInputs({...kInputs, dontcares: e.target.value})} placeholder="e.g., 8, 9, 10" className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                </div>

                {kOutputs.error && (
                  <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl flex gap-2 text-red-400 text-xs">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <p>{kOutputs.error}</p>
                  </div>
                )}
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b border-navy-light/40">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">Minimized Boolean Expression</h4>
                    <IEEEReportButton experimentName={`K-Map Minimization (${kInputs.variables} variables)`} inputData={{'Minterms': kInputs.minterms, 'Dont Cares': kInputs.dontcares}} outputData={{'Expression': kOutputs.minimizedExpression}} chartSelectors={[]} />
                  </div>
                  
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                    <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold block mb-1">Sum of Products (SOP)</span>
                    <span className="text-xl font-bold text-emerald-400 font-mono block">F = {kOutputs.minimizedExpression || '0'}</span>
                  </div>

                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider border-b border-navy-light/40 pb-2 mt-6">Karnaugh Map Grid</h4>
                  <div className="overflow-x-auto pb-4">
                    <table className="w-full text-center border-collapse">
                      <thead>
                        <tr>
                          <th className="border border-navy-light/40 p-2 text-slate-500 font-mono text-[10px]"></th>
                          {getColLabels(kInputs.variables).map(l => (
                            <th key={l} className="border border-navy-light/40 p-2 text-slate-300 font-mono text-[10px]">{l}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {kOutputs.grid.map((row, rIdx) => (
                          <tr key={rIdx}>
                            <th className="border border-navy-light/40 p-2 text-slate-300 font-mono text-[10px]">{getRowLabels(kInputs.variables)[rIdx]}</th>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className={`border border-navy-light/40 p-3 font-mono text-lg font-bold ${cell === 1 ? 'text-emerald-400 bg-emerald-500/5' : cell === 'X' ? 'text-amber-400/70' : 'text-slate-600'}`}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FSM ARCHITECT */}
          {activeTab === 'fsm' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-12 space-y-6">
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                    <Code2 className="h-5 w-5 text-cyan-400" />
                    <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Agentic Verilog FSM Generator</h3>
                  </div>

                  <p className="text-sm text-slate-400">
                    Describe your finite state machine requirements. The AI will generate a state transition table, Boolean equations, and synthesizable Verilog code.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-1.5">
                      <input 
                        type="text" 
                        value={fsmPrompt} 
                        onChange={(e) => setFsmPrompt(e.target.value)}
                        placeholder="e.g., Design a sequence detector for '1011' using a Mealy machine."
                        className="w-full bg-navy-dark border border-navy-light rounded px-4 py-3 text-white font-mono text-sm focus:border-cyan-400/50 focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="flex items-end">
                      <button 
                        onClick={handleFsmSolve}
                        disabled={fsmLoading || !fsmPrompt}
                        className="h-[46px] px-6 bg-cyan-500 hover:bg-cyan-400 text-navy-dark font-bold rounded flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {fsmLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        GENERATE HDL
                      </button>
                    </div>
                  </div>
                </div>

                {/* Solver Result Area */}
                {fsmResult && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
                    <div className="bg-navy-card border border-cyan-500/20 rounded-2xl p-6 max-h-[500px] overflow-y-auto">
                      <div className="flex items-center gap-2 mb-4">
                        <Table className="h-4 w-4 text-cyan-400" />
                        <h4 className="text-xs font-mono font-bold uppercase text-white tracking-wider">State Transition & Equations</h4>
                      </div>
                      <div className="prose prose-invert prose-cyan max-w-none prose-sm font-sans markdown-body">
                        <Markdown>{fsmResult.stateTableMarkdown}</Markdown>
                        <hr className="border-navy-light/40 my-4" />
                        <Markdown>{fsmResult.booleanEquationsMarkdown}</Markdown>
                      </div>
                    </div>

                    <div className="bg-navy-card border border-cyan-500/20 rounded-2xl p-6 relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Code2 className="h-4 w-4 text-cyan-400" />
                          <h4 className="text-xs font-mono font-bold uppercase text-white tracking-wider">Verilog HDL Code</h4>
                        </div>
                        <button 
                          onClick={handleCopy}
                          className="px-3 py-1 bg-navy-dark hover:bg-navy-light text-cyan-400 border border-cyan-500/30 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-colors"
                        >
                          {copied ? <CheckCircle2 className="h-3 w-3" /> : 'COPY CODE'}
                        </button>
                      </div>
                      
                      <div className="rounded-xl overflow-hidden text-xs">
                        <SyntaxHighlighter
                          language="verilog"
                          style={vscDarkPlus}
                          customStyle={{ margin: 0, padding: '1rem', background: '#0a0f1c' }}
                        >
                          {fsmResult.verilogCode}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ADC/DAC CONVERTER */}
          {activeTab === 'converter' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Activity className="h-5 w-5 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Converter Architecture</h3>
                </div>
                
                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Architecture</label>
                    <select value={cInputs.type} onChange={e => setCInputs({...cInputs, type: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white">
                      <option value="ADC-Flash">Flash ADC</option>
                      <option value="ADC-SAR">SAR ADC</option>
                      <option value="DAC-BinaryWeighted">Binary Weighted DAC</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Resolution N (Bits)</label>
                    <input type="number" value={cInputs.resolution} onChange={e => setCInputs({...cInputs, resolution: parseInt(e.target.value)||1})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Reference Voltage V_ref (V)</label>
                    <input type="number" value={cInputs.Vref} onChange={e => setCInputs({...cInputs, Vref: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-6">
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b border-navy-light/40">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">Quantization Parameters</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block mb-1">LSB Voltage (Step Size)</span>
                      <span className="text-xl font-bold text-white font-mono">{cOutputs.LSB.toExponential(3)} <span className="text-xs text-slate-400">V</span></span>
                    </div>
                    <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block mb-1">Max Quantization Error</span>
                      <span className="text-xl font-bold text-indigo-400 font-mono">±{cOutputs.Q_error.toExponential(3)} <span className="text-xs text-indigo-400/60">V</span></span>
                    </div>
                  </div>

                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider border-b border-navy-light/40 pb-2 mt-6">
                    {cInputs.type.startsWith('ADC') ? 'ADC Staircase Transfer Function' : 'DAC Output Transfer Function'}
                  </h4>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cOutputs.plotData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis 
                          dataKey={cInputs.type.startsWith('ADC') ? 'v_in' : 'code'} 
                          type="number" 
                          stroke="#64748b" 
                          style={{ fontSize: '11px' }} 
                          domain={['dataMin', 'dataMax']}
                          label={{ value: cInputs.type.startsWith('ADC') ? 'Analog Input (V)' : 'Digital Code (Decimal)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} 
                        />
                        <YAxis 
                          dataKey={cInputs.type.startsWith('ADC') ? 'code' : 'v_out'} 
                          stroke="#64748b" 
                          style={{ fontSize: '11px' }} 
                          label={{ value: cInputs.type.startsWith('ADC') ? 'Digital Output Code' : 'Analog Output (V)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} 
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} 
                          formatter={(value: number, name: string) => name === 'code' ? value : value.toExponential(3) + ' V'} 
                        />
                        <Line type="stepAfter" dataKey={cInputs.type.startsWith('ADC') ? 'code' : 'v_out'} stroke="#818cf8" strokeWidth={2} dot={false} name={cInputs.type.startsWith('ADC') ? 'Code' : 'V_out'} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="text-center mt-2 text-xs text-slate-500 font-mono">
                      Showing up to 64 steps for visualization clarity.
                    </div>
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
