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
  Flame,
  BarChart,
  Radio
} from 'lucide-react';
import { IEEEReportButton } from '../components/IEEEReportButton';
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

import { usePowerAmp } from '../hooks/usePowerAmp';
import { useBodePlot } from '../hooks/useBodePlot';
import { useOscillator } from '../hooks/useOscillator';

type TabId = 'poweramp' | 'bode' | 'oscillator';

export default function ElectronicsIIToolsView() {
  const [activeTab, setActiveTab] = useState<TabId>('poweramp');

  // --- Hook: Power Amplifier ---
  const { inputs: pInputs, setInputs: setPInputs, outputs: pOutputs } = usePowerAmp({
    classType: 'B-pushpull',
    Vcc: 24,
    Vp: 20,
    RL: 8,
    Tj_max: 150,
    Ta: 25,
    Theta_jc: 1.5
  });

  // --- Hook: Bode Plot ---
  const { inputs: bInputs, setInputs: setBInputs, outputs: bOutputs } = useBodePlot({
    Amid: 100, // 40 dB
    fL: 20,
    fH: 20000
  });

  // --- Hook: Oscillator ---
  const { inputs: oInputs, setInputs: setOInputs, outputs: oOutputs } = useOscillator({
    topology: 'Wien',
    fo: 1, // kHz
    C: 10 // nF
  });

  const formatUnit = (val: number, unit: string) => {
    if (val === undefined || isNaN(val)) return '-';
    if (val >= 1e6) return `${(val / 1e6).toFixed(2)} M${unit}`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(2)} k${unit}`;
    return `${val.toFixed(2)} ${unit}`;
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
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-rose-500/5 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-orange-500/5 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <Cpu className="h-4 w-4 animate-pulse" /> EEE 2103 Advanced Analog Electronics
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
              Electronics II <span className="text-rose-400">Analysis</span> Suite
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
              Design power amplifiers and heat sinks, visualize high/low frequency responses with Bode plots, and calculate sinusoidal oscillator networks.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-navy-light/60 pb-px">
          <button onClick={() => setActiveTab('poweramp')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'poweramp' ? 'border-rose-400 text-rose-400 bg-rose-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Flame className="h-4 w-4" /> Power Amps & Thermal</div>
          </button>
          <button onClick={() => setActiveTab('bode')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'bode' ? 'border-blue-400 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><BarChart className="h-4 w-4" /> Frequency Response</div>
          </button>
          <button onClick={() => setActiveTab('oscillator')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'oscillator' ? 'border-emerald-accent text-emerald-accent bg-emerald-accent/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Radio className="h-4 w-4" /> Oscillators</div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          
          {/* TAB 1: POWER AMPLIFIER */}
          {activeTab === 'poweramp' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Flame className="h-5 w-5 text-rose-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Amplifier Specifications</h3>
                </div>
                
                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Class & Topology</label>
                    <select value={pInputs.classType} onChange={e => setPInputs({...pInputs, classType: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white">
                      <option value="A-series">Class A (Series-Fed)</option>
                      <option value="A-transformer">Class A (Transformer-Coupled)</option>
                      <option value="B-pushpull">Class B (Push-Pull)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Vcc (V)</label>
                      <input type="number" value={pInputs.Vcc} onChange={e => setPInputs({...pInputs, Vcc: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Vp (V)</label>
                      <input type="number" value={pInputs.Vp} onChange={e => setPInputs({...pInputs, Vp: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">RL (Ω)</label>
                      <input type="number" value={pInputs.RL} onChange={e => setPInputs({...pInputs, RL: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-2 text-white" />
                    </div>
                  </div>

                  <div className="border-t border-navy-light/40 pt-4 grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block" title="Max Junction Temp">Tj_max (°C)</label>
                      <input type="number" value={pInputs.Tj_max} onChange={e => setPInputs({...pInputs, Tj_max: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block" title="Ambient Temp">Ta (°C)</label>
                      <input type="number" value={pInputs.Ta} onChange={e => setPInputs({...pInputs, Ta: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block" title="Thermal Res JC">Θjc (°C/W)</label>
                      <input type="number" step="0.1" value={pInputs.Theta_jc} onChange={e => setPInputs({...pInputs, Theta_jc: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-2 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div className="flex justify-end" id="amp-chart">
                  <IEEEReportButton experimentName={`Power Amplifier: ${pInputs.classType}`} inputData={{'Vcc': pInputs.Vcc+'V', 'RL': pInputs.RL+'Ω'}} outputData={{'Efficiency': pOutputs.efficiency.toFixed(1)+'%'}} chartSelectors={['#amp-chart']} />
                </div>
                
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider border-b border-navy-light/40 pb-2">Power Flow & Thermal Results</h4>
                  
                  {pOutputs.error ? (
                    <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex gap-3 text-red-400">
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      <div className="text-xs">
                        <span className="font-bold block">Physical Constraint Violation</span>
                        <p>{pOutputs.error}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40 text-center">
                          <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block mb-1">DC Input (P_DC)</span>
                          <span className="text-lg font-bold text-white font-mono block">{pOutputs.P_DC.toFixed(2)} <span className="text-xs text-slate-400">W</span></span>
                        </div>
                        <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40 text-center">
                          <span className="text-[10px] text-emerald-accent font-mono uppercase font-bold block mb-1">AC Output (P_AC)</span>
                          <span className="text-lg font-bold text-emerald-accent font-mono block">{pOutputs.P_AC.toFixed(2)} <span className="text-xs text-emerald-accent/60">W</span></span>
                        </div>
                        <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40 text-center">
                          <span className="text-[10px] text-rose-400 font-mono uppercase font-bold block mb-1">Dissipated (P_D)</span>
                          <span className="text-lg font-bold text-rose-400 font-mono block">{pOutputs.P_D_total.toFixed(2)} <span className="text-xs text-rose-400/60">W</span></span>
                        </div>
                        <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/30 text-center">
                          <span className="text-[10px] text-rose-400 font-mono uppercase font-bold block mb-1">Efficiency (η)</span>
                          <span className="text-xl font-black text-rose-400 font-mono block">{pOutputs.efficiency.toFixed(1)} <span className="text-xs text-rose-400/60">%</span></span>
                        </div>
                      </div>

                      <div className="bg-navy-dark p-4 rounded-xl border border-navy-light mt-4 flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block mb-1">Required Heat Sink (Θca)</span>
                          <span className="text-sm text-slate-300 font-mono">For {pInputs.classType === 'B-pushpull' ? 'each transistor (2 total)' : 'the transistor'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-white font-mono">
                            {pOutputs.Theta_ca < 0 ? 'FAIL' : (pOutputs.Theta_ca === Infinity ? 'NONE' : pOutputs.Theta_ca.toFixed(2))}
                            {pOutputs.Theta_ca > 0 && pOutputs.Theta_ca !== Infinity && <span className="text-sm text-slate-400 ml-1">°C/W</span>}
                          </span>
                          {pOutputs.Theta_ca < 0 && <span className="block text-[10px] text-red-400 mt-1">Exceeds Tj_max!</span>}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BODE PLOT */}
          {activeTab === 'bode' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <BarChart className="h-5 w-5 text-blue-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Frequency Spec</h3>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Midband Gain (A_mid) [V/V]</label>
                    <input type="number" value={bInputs.Amid} onChange={e => setBInputs({...bInputs, Amid: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    <span className="text-[10px] text-blue-400 block text-right mt-1">≈ {bOutputs.Amid_dB.toFixed(1)} dB</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Low Cutoff (fL) [Hz]</label>
                      <input type="number" value={bInputs.fL} onChange={e => setBInputs({...bInputs, fL: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">High Cutoff (fH) [Hz]</label>
                      <input type="number" value={bInputs.fH} onChange={e => setBInputs({...bInputs, fH: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-6">
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider border-b border-navy-light/40 pb-2">Magnitude Plot (dB)</h4>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={bOutputs.plotData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis 
                          dataKey="f" 
                          scale="log" 
                          domain={['auto', 'auto']}
                          type="number" 
                          stroke="#64748b" 
                          style={{ fontSize: '11px' }} 
                          tickFormatter={(v)=> v >= 1000 ? `${v/1000}k` : v.toString()} 
                          label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} 
                        />
                        <YAxis stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Gain (dB)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} 
                          formatter={(value: number) => value.toFixed(1) + ' dB'} 
                          labelFormatter={(label: number) => `f = ${label.toFixed(0)} Hz`} 
                        />
                        <Line type="monotone" dataKey="mag" stroke="#3b82f6" strokeWidth={2} dot={false} name="Magnitude" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider border-b border-navy-light/40 pb-2 mt-4">Phase Plot (Degrees)</h4>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={bOutputs.plotData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis 
                          dataKey="f" 
                          scale="log" 
                          domain={['auto', 'auto']}
                          type="number" 
                          stroke="#64748b" 
                          style={{ fontSize: '11px' }} 
                          tickFormatter={(v)=> v >= 1000 ? `${v/1000}k` : v.toString()} 
                          label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} 
                        />
                        <YAxis stroke="#64748b" style={{ fontSize: '11px' }} domain={[-90, 90]} tickCount={7} label={{ value: 'Phase (°)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} 
                          formatter={(value: number) => value.toFixed(1) + '°'} 
                          labelFormatter={(label: number) => `f = ${label.toFixed(0)} Hz`} 
                        />
                        <Line type="monotone" dataKey="phase" stroke="#10b981" strokeWidth={2} dot={false} name="Phase" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OSCILLATORS */}
          {activeTab === 'oscillator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Radio className="h-5 w-5 text-emerald-accent" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Oscillator Specs</h3>
                </div>
                
                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Oscillator Topology</label>
                    <select value={oInputs.topology} onChange={e => setOInputs({...oInputs, topology: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded-lg px-3 py-2 text-white">
                      <option value="Wien">Wien Bridge (RC)</option>
                      <option value="RC-PhaseShift">RC Phase Shift</option>
                      <option value="Hartley">Hartley (LC)</option>
                      <option value="Colpitts">Colpitts (LC)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Target f_o (kHz)</label>
                      <input type="number" value={oInputs.fo} onChange={e => setOInputs({...oInputs, fo: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Known C (nF)</label>
                      <input type="number" value={oInputs.C} onChange={e => setOInputs({...oInputs, C: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                      <span className="text-[10px] text-slate-500 block mt-1">
                        {oInputs.topology === 'Colpitts' ? '(Equivalent Ceq)' : '(For each network stage)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b border-navy-light/40">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">Design Results</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                      <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold block mb-1">
                        {oOutputs.R !== undefined ? 'Required Resistance (R)' : 'Required Inductance (L)'}
                      </span>
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        {oOutputs.R !== undefined ? formatUnit(oOutputs.R, 'Ω') : formatUnit(oOutputs.L || 0, 'H')}
                      </span>
                    </div>
                    
                    <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block mb-1">Barkhausen Minimum Gain (Av)</span>
                      <span className="text-2xl font-black text-white font-mono">≥ {oOutputs.Av_min}</span>
                      <span className="block text-[9px] text-slate-400 mt-1">
                        {oInputs.topology === 'Wien' && 'Non-inverting configuration.'}
                        {oInputs.topology === 'RC-PhaseShift' && 'Inverting configuration.'}
                        {(oInputs.topology === 'Hartley' || oInputs.topology === 'Colpitts') && 'Depends on LC split ratio.'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 bg-navy-dark rounded-xl border border-navy-light p-4 flex flex-col items-center justify-center min-h-[200px] text-slate-400">
                    {/* Placeholder for actual topology schematic */}
                    <Activity className="h-12 w-12 text-slate-600 mb-4 opacity-50" />
                    <span className="text-sm font-mono">{oInputs.topology} Oscillator Schematic</span>
                    <span className="text-[10px] mt-2 text-slate-500 text-center max-w-sm">
                      For detailed schematic wiring, ensure the amplifier provides the necessary phase shift (0° or 180°) corresponding to the selected feedback network.
                    </span>
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
