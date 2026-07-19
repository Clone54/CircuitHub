import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Zap, Cpu, Settings2, Activity, BarChart3 } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import { useDCDCConverter } from '../hooks/useDCDCConverter';
import { useRectifier } from '../hooks/useRectifier';
import { useSPWM } from '../hooks/useSPWM';

export default function PowerElectronicsView() {
  const [activeTab, setActiveTab] = useState<'dcdc' | 'scr' | 'spwm'>('dcdc');

  const { inputs: dcInputs, setInputs: setDcInputs, outputs: dcOutputs } = useDCDCConverter({
    topology: 'Buck', Vin: 24, Vout: 12, Iout: 5, fs: 50, deltaIL_pct: 20, deltaVc_pct: 1
  });

  const { inputs: scrInputs, setInputs: setScrInputs, outputs: scrOutputs } = useRectifier({
    config: '1-Ph Full-Wave', load: 'RL', Vrms: 230, freq: 50, alpha: 45
  });

  const { inputs: pwmInputs, setInputs: setPwmInputs, outputs: pwmOutputs } = useSPWM({
    strategy: 'Bipolar SPWM', ma: 0.8, mf: 15, Vdc: 400
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
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <Cpu className="h-4 w-4 animate-pulse" /> EEE 3203 Power Electronics
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
              Power <span className="text-rose-400">Electronics</span> Suite
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
              Switching DC-DC Converters, SCR Phase Control, and SPWM Inverter Harmonics.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-navy-light/60 pb-px">
          <button onClick={() => setActiveTab('dcdc')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'dcdc' ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Zap className="h-4 w-4" /> DC-DC Choppers</div>
          </button>
          <button onClick={() => setActiveTab('scr')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'scr' ? 'border-amber-400 text-amber-400 bg-amber-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Settings2 className="h-4 w-4" /> SCR Rectifiers</div>
          </button>
          <button onClick={() => setActiveTab('spwm')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'spwm' ? 'border-rose-400 text-rose-400 bg-rose-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Activity className="h-4 w-4" /> SPWM Inverters</div>
          </button>
        </div>

        {/* TAB 1: DC-DC Chopper */}
        {activeTab === 'dcdc' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Zap className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Converter Specs</h3>
              </div>
              <div className="space-y-4 text-xs font-mono">
                <div className="space-y-1.5">
                  <label className="text-slate-400 block">Topology</label>
                  <select value={dcInputs.topology} onChange={e => setDcInputs({...dcInputs, topology: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white">
                    <option value="Buck">Buck (Step-Down)</option>
                    <option value="Boost">Boost (Step-Up)</option>
                    <option value="Buck-Boost">Buck-Boost (Inverting)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">V_in (V)</label>
                    <input type="number" value={dcInputs.Vin} onChange={e => setDcInputs({...dcInputs, Vin: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Target V_out (V)</label>
                    <input type="number" value={dcInputs.Vout} onChange={e => setDcInputs({...dcInputs, Vout: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-navy-light/40 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">I_out (A)</label>
                    <input type="number" value={dcInputs.Iout} onChange={e => setDcInputs({...dcInputs, Iout: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Sw. Freq (kHz)</label>
                    <input type="number" value={dcInputs.fs} onChange={e => setDcInputs({...dcInputs, fs: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">ΔI_L Ripple (%)</label>
                    <input type="number" value={dcInputs.deltaIL_pct} onChange={e => setDcInputs({...dcInputs, deltaIL_pct: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">ΔV_c Ripple (%)</label>
                    <input type="number" step="0.1" value={dcInputs.deltaVc_pct} onChange={e => setDcInputs({...dcInputs, deltaVc_pct: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                </div>

                {dcOutputs.errorStr ? (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-rose-400 text-xs font-mono">
                    {dcOutputs.errorStr}
                  </div>
                ) : (
                  <div className="bg-navy-dark border border-emerald-500/30 rounded-xl p-4 mt-6 space-y-2">
                    <div className="flex justify-between items-center"><span className="text-slate-300">Duty Cycle (D)</span><span className="text-emerald-400 font-bold">{(dcOutputs.D * 100).toFixed(1)} %</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-300">Minimum L</span><span className="text-emerald-400">{(dcOutputs.L * 1e6).toFixed(1)} μH</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-300">Minimum C</span><span className="text-emerald-400">{(dcOutputs.C * 1e6).toFixed(1)} μF</span></div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-8 bg-navy-card border border-navy-light/60 p-6 rounded-2xl min-h-[400px] flex flex-col">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-navy-light/40 pb-2">Inductor Current I_L (CCM)</h4>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dcOutputs.plotData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="t" type="number" stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Time (μs)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '11px' }} domain={['auto', 'auto']} label={{ value: 'Current (A)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} formatter={(val: number) => val.toFixed(3)} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="linear" dataKey="iL" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={3} name="Inductor Current" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SCR Rectifier */}
        {activeTab === 'scr' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Settings2 className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Firing Control</h3>
              </div>
              <div className="space-y-4 text-xs font-mono">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Configuration</label>
                    <select value={scrInputs.config} onChange={e => setScrInputs({...scrInputs, config: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white">
                      <option value="1-Ph Half-Wave">Half-Wave</option>
                      <option value="1-Ph Full-Wave">Full-Wave</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Load Type</label>
                    <select value={scrInputs.load} onChange={e => setScrInputs({...scrInputs, load: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white">
                      <option value="R">R (Resistive)</option>
                      <option value="RL">RL (Highly Inductive)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-navy-light/40 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">V_in (RMS)</label>
                    <input type="number" value={scrInputs.Vrms} onChange={e => setScrInputs({...scrInputs, Vrms: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Frequency (Hz)</label>
                    <input type="number" value={scrInputs.freq} onChange={e => setScrInputs({...scrInputs, freq: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-navy-light/40 pt-4">
                  <label className="text-slate-400 block">Firing Angle α (Degrees)</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min="0" max="180" step="1" value={scrInputs.alpha} onChange={e => setScrInputs({...scrInputs, alpha: parseFloat(e.target.value)})} className="flex-1 accent-amber-500" />
                    <span className="text-amber-400 font-bold w-10 text-right">{scrInputs.alpha}°</span>
                  </div>
                </div>

                <div className="bg-navy-dark border border-amber-500/30 rounded-xl p-4 mt-6 space-y-2">
                  <div className="flex justify-between items-center"><span className="text-slate-300">Avg Output (V_dc)</span><span className="text-amber-400 font-bold">{scrOutputs.Vdc.toFixed(2)} V</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-300">RMS Output</span><span className="text-amber-400">{scrOutputs.Vrms_out.toFixed(2)} V</span></div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 bg-navy-card border border-navy-light/60 p-6 rounded-2xl min-h-[400px] flex flex-col">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-navy-light/40 pb-2">Output Voltage Waveform</h4>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={scrOutputs.plotData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="thetaDeg" type="number" domain={[0, 720]} tickCount={9} stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'ωt (Degrees)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} formatter={(val: number) => val.toFixed(1)} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="vIn" stroke="#64748b" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Input Sine Wave" isAnimationActive={false} />
                    <Line type="monotone" dataKey="vOut" stroke="#f59e0b" strokeWidth={3} dot={false} name="Chopped Output" isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SPWM Inverter */}
        {activeTab === 'spwm' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Activity className="h-5 w-5 text-rose-400" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Inverter Strategy</h3>
              </div>
              <div className="space-y-4 text-xs font-mono">
                <div className="space-y-1.5">
                  <label className="text-slate-400 block">Modulation Strategy</label>
                  <select value={pwmInputs.strategy} onChange={e => setPwmInputs({...pwmInputs, strategy: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white">
                    <option value="Square Wave">Square Wave</option>
                    <option value="Bipolar SPWM">Bipolar SPWM</option>
                    <option value="Unipolar SPWM">Unipolar SPWM</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">DC Link (V_dc)</label>
                    <input type="number" value={pwmInputs.Vdc} onChange={e => setPwmInputs({...pwmInputs, Vdc: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-navy-light/40 pt-4">
                  <label className="text-slate-400 block">Amplitude Ratio (m_a)</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min="0.1" max="1.0" step="0.05" value={pwmInputs.ma} onChange={e => setPwmInputs({...pwmInputs, ma: parseFloat(e.target.value)})} className="flex-1 accent-rose-500" disabled={pwmInputs.strategy === 'Square Wave'} />
                    <span className="text-rose-400 font-bold w-8">{pwmInputs.ma.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 block">Frequency Ratio (m_f)</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min="9" max="39" step="2" value={pwmInputs.mf} onChange={e => setPwmInputs({...pwmInputs, mf: parseInt(e.target.value)})} className="flex-1 accent-rose-500" disabled={pwmInputs.strategy === 'Square Wave'} />
                    <span className="text-rose-400 font-bold w-8">{pwmInputs.mf}</span>
                  </div>
                </div>

                <div className="bg-navy-dark border border-rose-500/30 rounded-xl p-4 mt-6 space-y-2">
                  <div className="flex justify-between items-center"><span className="text-slate-300">Fundamental Amp (V1)</span><span className="text-rose-400 font-bold">{pwmOutputs.fundAmp.toFixed(1)} V</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-300">Voltage THD</span><span className="text-rose-400 font-bold">{pwmOutputs.THD.toFixed(1)} %</span></div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl min-h-[250px] flex flex-col">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-navy-light/40 pb-2">Time Domain Pulse Train</h4>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pwmOutputs.timeData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="t_ms" type="number" domain={['dataMin', 'dataMax']} stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Time (ms)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
                      <Line type="stepAfter" dataKey="vOut" stroke="#fb7185" strokeWidth={2} dot={false} isAnimationActive={false} name="Output Voltage" />
                      {pwmInputs.strategy !== 'Square Wave' && <Line type="monotone" dataKey="vRef" stroke="#38bdf8" strokeWidth={1} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="Reference Sine" />}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl min-h-[250px] flex flex-col">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-navy-light/40 pb-2">Harmonic Spectrum</h4>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pwmOutputs.specData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }} barCategoryGap={1}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="h" stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Harmonic Order (h)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Amplitude (V)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} formatter={(val: number) => val.toFixed(2)} />
                      <Bar dataKey="amp" fill="#fb7185" radius={[2, 2, 0, 0]} maxBarSize={15} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
