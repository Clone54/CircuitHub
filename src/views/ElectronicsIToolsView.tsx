import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  Cpu,
  Settings,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2
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

import { useDiodeWaveforms } from '../hooks/useDiodeWaveforms';
import { useSmallSignalAC } from '../hooks/useSmallSignalAC';
import { useZenerRegulator } from '../hooks/useZenerRegulator';

type TabId = 'diode' | 'smallsignal' | 'zener';

export default function ElectronicsIToolsView() {
  const [activeTab, setActiveTab] = useState<TabId>('diode');

  // --- Hook: Diode Wave-Shaping ---
  const { inputs: dInputs, setInputs: setDInputs, outputs: dOutputs } = useDiodeWaveforms({
    type: 'half-wave',
    vp: 10,
    f: 50,
    model: 'practical',
    vref: 2
  });

  // --- Hook: Small Signal AC ---
  const { inputs: sInputs, setInputs: setSInputs, outputs: sOutputs } = useSmallSignalAC({
    transistorType: 'BJT',
    config: 'CE-Divider',
    beta: 100,
    ro: 50,
    gm: 2,
    rd: 40,
    Rs: 1,
    R1: 39,
    R2: 3.9,
    Rc: 4.7,
    Re: 1.2,
    RL: 10,
    IE: 2,
    reBypassed: true
  });

  // --- Hook: Zener Regulator ---
  const { inputs: zInputs, setInputs: setZInputs, outputs: zOutputs } = useZenerRegulator({
    VinMin: 16,
    VinMax: 24,
    Vz: 10,
    IzT: 20,
    IzM: 100,
    ILMin: 10,
    ILMax: 50
  });

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
          <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <Cpu className="h-4 w-4 animate-pulse" /> EEE 1203 Analog Electronics
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
              Electronics I <span className="text-blue-400">Analysis</span> Suite
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
              Visualize diode wave-shaping, perform small-signal AC modeling for BJTs/FETs, and design Zener voltage regulators.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-navy-light/60 pb-px">
          <button onClick={() => setActiveTab('diode')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'diode' ? 'border-emerald-accent text-emerald-accent bg-emerald-accent/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Activity className="h-4 w-4" /> Diode Visualizer</div>
          </button>
          <button onClick={() => setActiveTab('smallsignal')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'smallsignal' ? 'border-blue-400 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Small-Signal AC</div>
          </button>
          <button onClick={() => setActiveTab('zener')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'zener' ? 'border-rose-400 text-rose-400 bg-rose-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Zap className="h-4 w-4" /> Zener Regulator</div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          
          {/* TAB 1: DIODE WAVE-SHAPING */}
          {activeTab === 'diode' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Settings className="h-5 w-5 text-emerald-accent" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Circuit Setup</h3>
                </div>
                
                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Circuit Type</label>
                    <select value={dInputs.type} onChange={e => setDInputs({...dInputs, type: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white">
                      <option value="half-wave">Half-Wave Rectifier</option>
                      <option value="full-wave">Full-Wave Rectifier (Bridge)</option>
                      <option value="series-clipper">Series Clipper</option>
                      <option value="parallel-clipper">Parallel Clipper</option>
                      <option value="clamper">Positive Clamper</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Vp (Peak Volts)</label>
                      <input type="number" value={dInputs.vp} onChange={e => setDInputs({...dInputs, vp: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Freq (Hz)</label>
                      <input type="number" value={dInputs.f} onChange={e => setDInputs({...dInputs, f: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t border-navy-light/40 pt-4">
                    <label className="text-slate-400 block">Diode Model</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-white">
                        <input type="radio" name="dmodel" checked={dInputs.model === 'ideal'} onChange={() => setDInputs({...dInputs, model: 'ideal'})} className="accent-emerald-accent" />
                        Ideal (0V)
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-white">
                        <input type="radio" name="dmodel" checked={dInputs.model === 'practical'} onChange={() => setDInputs({...dInputs, model: 'practical'})} className="accent-emerald-accent" />
                        Practical (0.7V)
                      </label>
                    </div>
                  </div>

                  {(dInputs.type === 'series-clipper' || dInputs.type === 'parallel-clipper' || dInputs.type === 'clamper') && (
                    <div className="space-y-1.5 border-t border-navy-light/40 pt-4">
                      <label className="text-slate-400 block">DC Reference (V_ref)</label>
                      <input type="number" value={dInputs.vref} onChange={e => setDInputs({...dInputs, vref: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-8 space-y-6">
                <div className="flex justify-end" id="diode-chart">
                  <IEEEReportButton experimentName={`Diode Analysis: ${dInputs.type}`} inputData={{'Peak Voltage': dInputs.vp+'V', 'Frequency': dInputs.f+'Hz', 'Model': dInputs.model}} outputData={{}} chartSelectors={['#diode-chart']} />
                </div>
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider border-b border-navy-light/40 pb-2">Time-Domain Response</h4>
                  
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dOutputs.plotData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="t" type="number" stroke="#64748b" style={{ fontSize: '11px' }} tickFormatter={(v)=>v.toFixed(1)} label={{ value: 'Time (ms)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis stroke="#64748b" style={{ fontSize: '11px' }} tickFormatter={(v)=>v.toFixed(1)} label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} formatter={(value: number) => value.toFixed(2) + ' V'} labelFormatter={(label: number) => `t = ${label.toFixed(2)} ms`} />
                        <Legend verticalAlign="top" height={36} iconType="plainline" />
                        <Line type="monotone" dataKey="vin" stroke="#64748b" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Input (Vin)" />
                        <Line type="monotone" dataKey="vout" stroke="#10b981" strokeWidth={3} dot={false} name="Output (Vout)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SMALL SIGNAL AC */}
          {activeTab === 'smallsignal' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">AC Modeling Setup</h3>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Type</label>
                      <select value={sInputs.transistorType} onChange={e => setSInputs({...sInputs, transistorType: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white">
                        <option value="BJT">BJT (NPN/PNP)</option>
                        <option value="FET">FET (JFET/MOSFET)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Configuration</label>
                      <select value={sInputs.config} onChange={e => setSInputs({...sInputs, config: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white">
                        {sInputs.transistorType === 'BJT' ? (
                          <>
                            <option value="CE-Fixed">CE Fixed-Bias</option>
                            <option value="CE-Divider">CE Voltage-Divider</option>
                            <option value="CC-Follower">CC Emitter-Follower</option>
                          </>
                        ) : (
                          <option value="CS">CS (Common-Source)</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-navy-light/40 pt-4">
                    <label className="text-blue-400 font-bold block mb-3 uppercase tracking-widest">Device Parameters</label>
                    {sInputs.transistorType === 'BJT' ? (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-slate-400 block">β (hfe)</label>
                          <input type="number" value={sInputs.beta} onChange={e => setSInputs({...sInputs, beta: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-slate-400 block">ro (kΩ)</label>
                          <input type="number" value={sInputs.ro} onChange={e => setSInputs({...sInputs, ro: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-slate-400 block">I_E (mA)</label>
                          <input type="number" value={sInputs.IE} onChange={e => setSInputs({...sInputs, IE: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-slate-400 block">gm (mS)</label>
                          <input type="number" value={sInputs.gm} onChange={e => setSInputs({...sInputs, gm: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-slate-400 block">rd (kΩ)</label>
                          <input type="number" value={sInputs.rd} onChange={e => setSInputs({...sInputs, rd: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-navy-light/40 pt-4">
                    <label className="text-blue-400 font-bold block mb-3 uppercase tracking-widest">Network Resistors (kΩ)</label>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="space-y-1.5">
                        <label className="text-slate-400 block">Rs</label>
                        <input type="number" value={sInputs.Rs} onChange={e => setSInputs({...sInputs, Rs: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-400 block">R1 / RB</label>
                        <input type="number" value={sInputs.R1} onChange={e => setSInputs({...sInputs, R1: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-400 block">R2</label>
                        <input type="number" value={sInputs.R2} disabled={sInputs.config!=='CE-Divider'} onChange={e => setSInputs({...sInputs, R2: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white disabled:opacity-30" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-slate-400 block">Rc / Rd</label>
                        <input type="number" value={sInputs.Rc} onChange={e => setSInputs({...sInputs, Rc: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-400 block">Re / Rs</label>
                        <input type="number" value={sInputs.Re} onChange={e => setSInputs({...sInputs, Re: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-400 block">RL</label>
                        <input type="number" value={sInputs.RL} onChange={e => setSInputs({...sInputs, RL: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                      </div>
                    </div>
                    {sInputs.transistorType === 'BJT' && (
                      <div className="mt-4">
                        <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                          <input type="checkbox" checked={sInputs.reBypassed} onChange={e => setSInputs({...sInputs, reBypassed: e.target.checked})} className="accent-blue-400" />
                          Re is Bypassed (CE bypass capacitor)
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider border-b border-navy-light/40 pb-2">Analysis Results</h4>
                  
                  {sInputs.transistorType === 'BJT' && (
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-center justify-between">
                      <span className="text-xs text-blue-400 font-mono font-bold uppercase tracking-widest">Dynamic Resistance (re)</span>
                      <span className="text-xl font-bold text-white font-mono">{sOutputs.re.toFixed(2)} Ω</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block mb-1">Input Impedance (Zi)</span>
                      <span className="text-xl font-bold text-white font-mono">{sOutputs.Zi.toFixed(2)} <span className="text-xs text-slate-400">kΩ</span></span>
                    </div>
                    <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block mb-1">Output Impedance (Zo)</span>
                      <span className="text-xl font-bold text-white font-mono">{sOutputs.Zo.toFixed(2)} <span className="text-xs text-slate-400">kΩ</span></span>
                    </div>
                    <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block mb-1">Voltage Gain (Av, no load)</span>
                      <span className="text-xl font-bold text-white font-mono">{sOutputs.AvNL.toFixed(2)}</span>
                    </div>
                    <div className="bg-navy-dark/60 p-4 rounded-xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                      <span className="text-[10px] text-blue-400 font-mono uppercase font-bold block mb-1">Loaded Voltage Gain (Av)</span>
                      <span className="text-2xl font-black text-blue-400 font-mono">{sOutputs.Av.toFixed(2)}</span>
                    </div>
                    <div className="col-span-2 bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40 flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Current Gain (Ai)</span>
                      <span className="text-xl font-bold text-white font-mono">{sOutputs.Ai.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ZENER REGULATOR */}
          {activeTab === 'zener' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Zap className="h-5 w-5 text-rose-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Regulator Specs</h3>
                </div>
                
                <div className="space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Vin (min) [V]</label>
                      <input type="number" value={zInputs.VinMin} onChange={e => setZInputs({...zInputs, VinMin: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Vin (max) [V]</label>
                      <input type="number" value={zInputs.VinMax} onChange={e => setZInputs({...zInputs, VinMax: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                  </div>

                  <div className="border-t border-navy-light/40 pt-4 grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Vz [V]</label>
                      <input type="number" value={zInputs.Vz} onChange={e => setZInputs({...zInputs, Vz: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">IzT [mA]</label>
                      <input type="number" value={zInputs.IzT} onChange={e => setZInputs({...zInputs, IzT: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">IzM [mA]</label>
                      <input type="number" value={zInputs.IzM} onChange={e => setZInputs({...zInputs, IzM: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-2 text-white" />
                    </div>
                  </div>

                  <div className="border-t border-navy-light/40 pt-4 grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">IL (min) [mA]</label>
                      <input type="number" value={zInputs.ILMin} onChange={e => setZInputs({...zInputs, ILMin: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">IL (max) [mA]</label>
                      <input type="number" value={zInputs.ILMax} onChange={e => setZInputs({...zInputs, ILMax: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider border-b border-navy-light/40 pb-2">Design Constraints</h4>
                  
                  {zOutputs.error ? (
                    <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex gap-3 text-red-400">
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      <div className="text-xs">
                        <span className="font-bold block">Design Error</span>
                        <p>{zOutputs.error}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex gap-3 text-emerald-400 mb-6">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <div className="text-xs flex-1">
                          <span className="font-bold block">Feasible Design</span>
                          <p>The regulator can maintain Vz across the specified input and load ranges.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40">
                          <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block mb-1">Rs (Max) Limit</span>
                          <span className="text-2xl font-black text-rose-400 font-mono">{zOutputs.RsMax.toFixed(1)} <span className="text-xs text-slate-400">Ω</span></span>
                          <span className="block text-[9px] text-slate-500 mt-2">To maintain regulation at Vin(min) & IL(max)</span>
                        </div>
                        <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40">
                          <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block mb-1">Rs (Min) Limit</span>
                          <span className="text-2xl font-black text-rose-400 font-mono">{zOutputs.RsMin.toFixed(1)} <span className="text-xs text-slate-400">Ω</span></span>
                          <span className="block text-[9px] text-slate-500 mt-2">To prevent Iz exceeding IzM at Vin(max)</span>
                        </div>
                        
                        <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40">
                          <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block mb-1">Zener Max Power</span>
                          <span className="text-lg font-bold text-white font-mono">{zOutputs.PzMax.toFixed(2)} <span className="text-xs text-slate-400">W</span></span>
                        </div>
                        <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40">
                          <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block mb-1">Rs Max Power</span>
                          <span className="text-lg font-bold text-white font-mono">{zOutputs.PRsMax.toFixed(2)} <span className="text-xs text-slate-400">W</span></span>
                        </div>
                      </div>
                    </>
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
