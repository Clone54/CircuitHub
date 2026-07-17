import React, { useState, useEffect } from 'react';
import { Sparkles, HelpCircle, AlertCircle, RefreshCw } from 'lucide-react';

type Mode = 'astable' | 'monostable';
type ResistorUnit = 'ohms' | 'kohms' | 'mohms';
type CapacitorUnit = 'pf' | 'nf' | 'uf' | 'mf';

const RESISTOR_MULTIPLIERS = {
  ohms: 1,
  kohms: 1000,
  mohms: 1000000,
};

const CAPACITOR_MULTIPLIERS = {
  pf: 1e-12,
  nf: 1e-9,
  uf: 1e-6,
  mf: 1e-3,
};

export default function Timer555Calc() {
  const [mode, setMode] = useState<Mode>('astable');
  
  // Inputs
  const [r1, setR1] = useState<number>(10);
  const [r1Unit, setR1Unit] = useState<ResistorUnit>('kohms');
  const [r2, setR2] = useState<number>(4.7);
  const [r2Unit, setR2Unit] = useState<ResistorUnit>('kohms');
  const [c, setC] = useState<number>(10);
  const [cUnit, setCUnit] = useState<CapacitorUnit>('uf');

  // Outputs
  const [freq, setFreq] = useState<number>(0);
  const [duty, setDuty] = useState<number>(0);
  const [th, setTh] = useState<number>(0);
  const [tl, setTl] = useState<number>(0);
  const [period, setPeriod] = useState<number>(0);

  useEffect(() => {
    const r1Base = r1 * RESISTOR_MULTIPLIERS[r1Unit];
    const r2Base = r2 * RESISTOR_MULTIPLIERS[r2Unit];
    const cBase = c * CAPACITOR_MULTIPLIERS[cUnit];

    if (isNaN(r1Base) || isNaN(r2Base) || isNaN(cBase) || r1Base <= 0 || cBase <= 0) {
      return;
    }

    if (mode === 'astable') {
      if (r2Base <= 0) return;
      // Astable equations:
      // Th = 0.693 * (R1 + R2) * C
      // Tl = 0.693 * R2 * C
      // T = Th + Tl = 0.693 * (R1 + 2*R2) * C
      // Freq = 1.44 / ((R1 + 2*R2) * C)
      const calculatedTh = 0.693147 * (r1Base + r2Base) * cBase;
      const calculatedTl = 0.693147 * r2Base * cBase;
      const calculatedPeriod = calculatedTh + calculatedTl;
      const calculatedFreq = calculatedPeriod > 0 ? 1 / calculatedPeriod : 0;
      const calculatedDuty = calculatedPeriod > 0 ? (calculatedTh / calculatedPeriod) * 100 : 0;

      setTh(calculatedTh);
      setTl(calculatedTl);
      setPeriod(calculatedPeriod);
      setFreq(calculatedFreq);
      setDuty(calculatedDuty);
    } else {
      // Monostable equations:
      // Th = 1.1 * R1 * C
      // Tl = 0 (it is a one-shot delay trigger)
      const calculatedTh = 1.1 * r1Base * cBase;
      setTh(calculatedTh);
      setTl(0);
      setPeriod(calculatedTh);
      setFreq(0);
      setDuty(100);
    }
  }, [mode, r1, r1Unit, r2, r2Unit, c, cUnit]);

  // Format time beautifully
  const formatTime = (seconds: number) => {
    if (seconds === 0) return '0 s';
    if (seconds < 1e-6) return `${(seconds * 1e9).toFixed(2)} ns`;
    if (seconds < 1e-3) return `${(seconds * 1e6).toFixed(2)} μs`;
    if (seconds < 1) return `${(seconds * 1000).toFixed(2)} ms`;
    return `${seconds.toFixed(3)} s`;
  };

  const formatFreq = (hertz: number) => {
    if (hertz === 0) return 'N/A (One-shot)';
    if (hertz >= 1e6) return `${(hertz / 1e6).toFixed(3)} MHz`;
    if (hertz >= 1000) return `${(hertz / 1000).toFixed(3)} kHz`;
    return `${hertz.toFixed(2)} Hz`;
  };

  // Generate responsive wave path for preview
  const getWaveformPath = () => {
    if (mode === 'monostable') {
      // Monostable one-shot: Low -> Trigger -> High for TW -> Low
      return "M 10,70 L 40,70 L 40,20 L 120,20 L 120,70 L 190,70";
    } else {
      // Astable: Repeating high and low proportional to Th and Tl
      const totalWidth = 180;
      const thRatio = th / (th + tl || 1);
      const tlRatio = tl / (th + tl || 1);
      
      const widthHigh = Math.max(15, Math.min(130, totalWidth * thRatio));
      const widthLow = Math.max(15, Math.min(130, totalWidth * tlRatio));

      let path = `M 10,70 L 10,20 L ${10 + widthHigh},20 L ${10 + widthHigh},70 L ${10 + widthHigh + widthLow},70`;
      path += ` L ${10 + widthHigh + widthLow},20 L ${10 + widthHigh * 2 + widthLow},20 L ${10 + widthHigh * 2 + widthLow},70 L ${10 + (widthHigh + widthLow) * 2},70`;
      return path;
    }
  };

  return (
    <div id="timer-555-calc" className="space-y-6">
      {/* Tab Selectors */}
      <div className="flex rounded-lg bg-navy-light/40 p-1 border border-navy-light max-w-xs">
        <button
          onClick={() => setMode('astable')}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold tracking-wider transition-all cursor-pointer ${
            mode === 'astable'
              ? 'bg-emerald-accent text-navy-dark shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          ASTABLE MODE (OSCILLATOR)
        </button>
        <button
          onClick={() => setMode('monostable')}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold tracking-wider transition-all cursor-pointer ${
            mode === 'monostable'
              ? 'bg-emerald-accent text-navy-dark shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          MONOSTABLE (ONE-SHOT)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Inputs */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase border-b border-navy-light pb-2">
            Circuit Parameters
          </h3>

          {/* R1 input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Timing Resistor R₁
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0.1"
                step="any"
                value={r1}
                onChange={(e) => setR1(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                className="flex-1 rounded-lg bg-navy-light/30 border border-navy-light px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-accent/50 transition-colors"
              />
              <select
                value={r1Unit}
                onChange={(e) => setR1Unit(e.target.value as ResistorUnit)}
                className="rounded-lg bg-navy-light/60 border border-navy-light px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none"
              >
                <option value="ohms">Ω</option>
                <option value="kohms">kΩ</option>
                <option value="mohms">MΩ</option>
              </select>
            </div>
          </div>

          {/* R2 input (Astable Only) */}
          {mode === 'astable' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Timing Resistor R₂
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={r2}
                  onChange={(e) => setR2(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                  className="flex-1 rounded-lg bg-navy-light/30 border border-navy-light px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-accent/50 transition-colors"
                />
                <select
                  value={r2Unit}
                  onChange={(e) => setR2Unit(e.target.value as ResistorUnit)}
                  className="rounded-lg bg-navy-light/60 border border-navy-light px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none"
                >
                  <option value="ohms">Ω</option>
                  <option value="kohms">kΩ</option>
                  <option value="mohms">MΩ</option>
                </select>
              </div>
            </div>
          )}

          {/* C input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Timing Capacitor C
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0.001"
                step="any"
                value={c}
                onChange={(e) => setC(Math.max(0.001, parseFloat(e.target.value) || 0.001))}
                className="flex-1 rounded-lg bg-navy-light/30 border border-navy-light px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-accent/50 transition-colors"
              />
              <select
                value={cUnit}
                onChange={(e) => setCUnit(e.target.value as CapacitorUnit)}
                className="rounded-lg bg-navy-light/60 border border-navy-light px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none"
              >
                <option value="pf">pF</option>
                <option value="nf">nF</option>
                <option value="uf">μF</option>
                <option value="mf">mF</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-navy-light/20 border border-navy-light/50 flex gap-2.5">
            <HelpCircle className="h-4.5 w-4.5 text-emerald-accent shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {mode === 'astable' ? (
                <span>
                  <strong>Astable Multivibrator</strong> charges C through (R₁ + R₂) and discharges it through R₂. The capacitor oscillates between 1/3 and 2/3 of Vcc continually.
                </span>
              ) : (
                <span>
                  <strong>Monostable Multivibrator</strong> acts as a one-shot delay timer. A negative input trigger pulse starts the output pulse high for a width of T = 1.1 × R₁ × C.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Outputs */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase border-b border-navy-light pb-2">
            Calculated Outputs
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {mode === 'astable' && (
              <>
                <div className="p-3.5 rounded-xl bg-navy-light/20 border border-navy-light/40 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-emerald-accent uppercase tracking-widest">Frequency</span>
                  <span className="text-lg font-bold text-white mt-1">{formatFreq(freq)}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-navy-light/20 border border-navy-light/40 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-emerald-accent uppercase tracking-widest">Duty Cycle</span>
                  <span className="text-lg font-bold text-white mt-1">{duty.toFixed(1)}%</span>
                </div>
              </>
            )}
            <div className="p-3.5 rounded-xl bg-navy-light/20 border border-navy-light/40 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-emerald-accent uppercase tracking-widest">Time High (T_H)</span>
              <span className="text-lg font-bold text-white mt-1">{formatTime(th)}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-navy-light/20 border border-navy-light/40 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-emerald-accent uppercase tracking-widest">
                {mode === 'astable' ? 'Time Low (T_L)' : 'Pulse Width'}
              </span>
              <span className="text-lg font-bold text-white mt-1">
                {mode === 'astable' ? formatTime(tl) : formatTime(th)}
              </span>
            </div>
          </div>

          {/* Oscilloscope View */}
          <div className="rounded-xl border border-navy-light bg-black/80 overflow-hidden font-mono p-4">
            <div className="flex justify-between items-center text-[10px] text-slate-500 border-b border-navy-light pb-2 mb-3">
              <span>OSCILLOSCOPE WAVEFORM PREVIEW</span>
              <span className="text-emerald-accent animate-pulse">● SWEEP RUNNING</span>
            </div>
            
            {/* SVG Wave */}
            <div className="relative h-24 w-full bg-[#050f09] rounded border border-emerald-accent/10 flex items-center justify-center">
              {/* Scope grid lines */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.04)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
              
              <svg className="w-full h-full max-w-[280px]" viewBox="0 0 200 90">
                <path
                  d={getWaveformPath()}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="miter"
                  className="drop-shadow-[0_0_4px_#10b981]"
                />
              </svg>
            </div>

            <div className="flex justify-between mt-3 text-[9px] text-slate-400">
              <div>V_out (max) = V_cc</div>
              <div>Period (T) = {formatTime(period)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
