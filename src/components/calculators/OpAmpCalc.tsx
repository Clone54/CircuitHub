import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { AlertCircle, HelpCircle } from 'lucide-react';

type Topology = 'inverting' | 'non-inverting' | 'differential';

export default function OpAmpCalc() {
  const [topology, setTopology] = useState<Topology>('inverting');
  
  // Inputs
  const [rf, setRf] = useState<number>(10); // kΩ
  const [rin, setRin] = useState<number>(2.2); // kΩ
  const [vin, setVin] = useState<number>(1.5); // V (single input)
  const [vin1, setVin1] = useState<number>(1.2); // V (inverting, for differential)
  const [vin2, setVin2] = useState<number>(2.5); // V (non-inverting, for differential)
  
  // Power Supply Rails (for real op-amp saturation limits)
  const [vpos, setVpos] = useState<number>(15); // Vcc+
  const [vneg, setVneg] = useState<number>(-15); // Vee-

  // Outputs
  const [gain, setGain] = useState<number>(0);
  const [vout, setVout] = useState<number>(0);
  const [isSaturated, setIsSaturated] = useState<boolean>(false);
  const [saturationType, setSaturationType] = useState<'positive' | 'negative' | 'none'>('none');
  
  // Graph data points
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (rin <= 0 || rf < 0) return;

    let calculatedGain = 0;
    let idealVout = 0;

    if (topology === 'inverting') {
      calculatedGain = -rf / rin;
      idealVout = calculatedGain * vin;
    } else if (topology === 'non-inverting') {
      calculatedGain = 1 + (rf / rin);
      idealVout = calculatedGain * vin;
    } else if (topology === 'differential') {
      calculatedGain = rf / rin;
      // Vout = (Rf/Rin) * (V2 - V1)
      idealVout = calculatedGain * (vin2 - vin1);
    }

    setGain(calculatedGain);

    // Apply saturation rails
    let finalVout = idealVout;
    let saturated = false;
    let satType: 'positive' | 'negative' | 'none' = 'none';

    if (idealVout >= vpos) {
      finalVout = vpos;
      saturated = true;
      satType = 'positive';
    } else if (idealVout <= vneg) {
      finalVout = vneg;
      saturated = true;
      satType = 'negative';
    }

    setVout(finalVout);
    setIsSaturated(saturated);
    setSaturationType(satType);

    // Generate sinusoidal wave points for Recharts visualization
    // We'll show a standard AC input and how it's amplified and clipped
    const points = [];
    const amplitudeInput = topology === 'differential' ? (vin2 - vin1) : vin;
    
    for (let i = 0; i <= 360; i += 12) {
      const radians = (i * Math.PI) / 180;
      const inputSin = amplitudeInput * Math.sin(radians);
      
      let outputSin = 0;
      if (topology === 'inverting') {
        outputSin = calculatedGain * inputSin;
      } else if (topology === 'non-inverting') {
        outputSin = calculatedGain * inputSin;
      } else if (topology === 'differential') {
        outputSin = calculatedGain * inputSin; // uses differential amplitude
      }

      // Clip the AC waveform on the graph according to Vcc and Vee
      let clippedOutputSin = outputSin;
      if (outputSin >= vpos) clippedOutputSin = vpos;
      if (outputSin <= vneg) clippedOutputSin = vneg;

      points.push({
        phase: `${i}°`,
        'Input Signal (V)': parseFloat(inputSin.toFixed(3)),
        'Output Signal (V)': parseFloat(clippedOutputSin.toFixed(3)),
      });
    }
    setChartData(points);

  }, [topology, rf, rin, vin, vin1, vin2, vpos, vneg]);

  return (
    <div id="opamp-calc" className="space-y-6">
      {/* Topology Selectors */}
      <div className="flex rounded-lg bg-navy-light/40 p-1 border border-navy-light max-w-sm">
        <button
          onClick={() => setTopology('inverting')}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold tracking-wider transition-all cursor-pointer ${
            topology === 'inverting'
              ? 'bg-emerald-accent text-navy-dark shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          INVERTING
        </button>
        <button
          onClick={() => setTopology('non-inverting')}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold tracking-wider transition-all cursor-pointer ${
            topology === 'non-inverting'
              ? 'bg-emerald-accent text-navy-dark shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          NON-INVERTING
        </button>
        <button
          onClick={() => setTopology('differential')}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold tracking-wider transition-all cursor-pointer ${
            topology === 'differential'
              ? 'bg-emerald-accent text-navy-dark shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          DIFFERENTIAL
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase border-b border-navy-light pb-2">
            Amplifier Parameters
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Input Resistor R_in (kΩ)</label>
              <input
                type="number"
                min="0.1"
                step="any"
                value={rin}
                onChange={(e) => setRin(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                className="w-full rounded-lg bg-navy-light/30 border border-navy-light px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-accent/50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Feedback Resistor R_f (kΩ)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={rf}
                onChange={(e) => setRf(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full rounded-lg bg-navy-light/30 border border-navy-light px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-accent/50 transition-colors"
              />
            </div>
          </div>

          <h3 className="text-sm font-semibold text-white tracking-wide uppercase border-b border-navy-light pt-2 pb-2">
            Voltages & Rails
          </h3>

          {/* Voltage inputs depending on topology */}
          {topology !== 'differential' ? (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Input Voltage V_in (V)</label>
              <input
                type="number"
                step="any"
                value={vin}
                onChange={(e) => setVin(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg bg-navy-light/30 border border-navy-light px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-accent/50 transition-colors"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">V_in1 (Inverting, V)</label>
                <input
                  type="number"
                  step="any"
                  value={vin1}
                  onChange={(e) => setVin1(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg bg-navy-light/30 border border-navy-light px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-accent/50 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">V_in2 (Non-Inverting, V)</label>
                <input
                  type="number"
                  step="any"
                  value={vin2}
                  onChange={(e) => setVin2(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg bg-navy-light/30 border border-navy-light px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-accent/50 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">V_CC+ (Upper Rail, V)</label>
              <input
                type="number"
                min="1"
                step="any"
                value={vpos}
                onChange={(e) => setVpos(Math.max(1, parseFloat(e.target.value) || 1))}
                className="w-full rounded-lg bg-navy-light/30 border border-navy-light px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-accent/50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">V_EE- (Lower Rail, V)</label>
              <input
                type="number"
                max="-1"
                step="any"
                value={vneg}
                onChange={(e) => setVneg(Math.min(-1, parseFloat(e.target.value) || -1))}
                className="w-full rounded-lg bg-navy-light/30 border border-navy-light px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-accent/50 transition-colors"
              />
            </div>
          </div>

          {isSaturated && (
            <div className="p-3 rounded-lg border border-red-500/15 bg-red-500/5 flex gap-2">
              <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[11px] text-red-300 block">OP-AMP SATURATED (CLIPPED)</span>
                <p className="text-[10px] text-red-200 mt-0.5 leading-relaxed">
                  Ideal output voltage calculated would exceed the physical {saturationType === 'positive' ? 'positive (+Vcc)' : 'negative (-Vee)'} power supply rail limit. The voltage is limited to {vout}V.
                </p>
              </div>
            </div>
          )}

          <div className="p-3.5 rounded-lg bg-navy-light/20 border border-navy-light/50 flex gap-2.5">
            <HelpCircle className="h-4.5 w-4.5 text-emerald-accent shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-300 leading-relaxed space-y-1">
              {topology === 'inverting' && (
                <span>
                  <strong>Inverting Gain</strong> equation: <em>A_v = -R_f / R_in</em>.<br />
                  The output signal is amplified and phase-shifted by 180° compared to the input.
                </span>
              )}
              {topology === 'non-inverting' && (
                <span>
                  <strong>Non-Inverting Gain</strong> equation: <em>A_v = 1 + R_f / R_in</em>.<br />
                  The output signal is amplified and in-phase (0° phase shift) with the input.
                </span>
              )}
              {topology === 'differential' && (
                <span>
                  <strong>Differential Amplifier Gain</strong> equation: <em>A_v = R_f / R_in</em>.<br />
                  Outputs the amplified difference: <em>V_out = (R_f / R_in) × (V_in2 - V_in1)</em>.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Outputs & Recharts Line Chart */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase border-b border-navy-light pb-2">
            Voltage Transfer Graph & Gain
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-navy-light/20 border border-navy-light/40 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-emerald-accent uppercase tracking-widest">Voltage Gain (Av)</span>
              <span className="text-xl font-bold text-white mt-1">{gain.toFixed(3)}</span>
            </div>
            <div className="p-3 rounded-xl bg-navy-light/20 border border-navy-light/40 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-emerald-accent uppercase tracking-widest">Output Voltage (V_out)</span>
              <span className="text-xl font-bold text-white mt-1">{vout.toFixed(3)} V</span>
            </div>
          </div>

          {/* Recharts Waveform Display */}
          <div className="rounded-xl border border-navy-light bg-black/40 p-4">
            <div className="text-[10px] font-mono text-slate-500 mb-3 uppercase tracking-widest text-center">
              AC Sine Wave Signal Simulation (Input vs Output)
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.05)" />
                  <XAxis dataKey="phase" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15,23,42,0.95)',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="Input Signal (V)"
                    stroke="#0284c7"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Output Signal (V)"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
