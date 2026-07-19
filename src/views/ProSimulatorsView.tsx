import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import {
  Activity,
  Cpu,
  Zap,
  Radio,
  Sliders,
  Play,
  RotateCcw,
  Binary,
  Compass,
  AlertTriangle,
  FileText,
  ArrowLeft
} from 'lucide-react';
import {
  designFilter,
  generatePwmWaveform,
  calculateYBusAndFault,
  generateConstellation,
  FilterDesignResult,
  PwmWaveformPoint,
  ConstellationPoint,
  YBusResult
} from '../utils/simulatorMath';
import { IEEEReportButton } from '../components/IEEEReportButton';

export default function ProSimulatorsView() {
  const [activeTab, setActiveTab] = useState<'dsp' | 'pwm' | 'ybus' | 'modulation'>('dsp');

  // --- DSP FILTER DESIGNER STATE ---
  const [filterType, setFilterType] = useState<'lowpass' | 'highpass'>('lowpass');
  const [filterMethod, setFilterMethod] = useState<'FIR' | 'IIR'>('FIR');
  const [cutoffFreq, setCutoffFreq] = useState<number>(1000);
  const [samplingFreq, setSamplingFreq] = useState<number>(8000);
  const [dspResult, setDspResult] = useState<FilterDesignResult | null>(null);

  useEffect(() => {
    if (cutoffFreq >= samplingFreq / 2) {
      setCutoffFreq(Math.floor(samplingFreq / 2 - 10));
    }
    const res = designFilter(filterType, filterMethod, cutoffFreq, samplingFreq);
    setDspResult(res);
  }, [filterType, filterMethod, cutoffFreq, samplingFreq]);

  // --- PWM INVERTER VISUALIZER STATE ---
  const [dcVoltage, setDcVoltage] = useState<number>(311);
  const [modulationIndex, setModulationIndex] = useState<number>(0.9);
  const [carrierFreq, setCarrierFreq] = useState<number>(2000);
  const [pwmResult, setPwmResult] = useState<{
    points: PwmWaveformPoint[];
    rmsVoltage: number;
    thdEstimate: number;
  } | null>(null);

  useEffect(() => {
    const res = generatePwmWaveform(dcVoltage, modulationIndex, carrierFreq, 50);
    setPwmResult(res);
  }, [dcVoltage, modulationIndex, carrierFreq]);

  // --- Y-BUS & FAULT CALCULATOR STATE ---
  const [r12, setR12] = useState<number>(0.02);
  const [x12, setX12] = useState<number>(0.08);
  const [r23, setR23] = useState<number>(0.03);
  const [x23, setX23] = useState<number>(0.12);
  const [r13, setR13] = useState<number>(0.025);
  const [x13, setX13] = useState<number>(0.10);
  const [faultBus, setFaultBus] = useState<number>(2);
  const [rfault, setRfault] = useState<number>(0.0);
  const [xfault, setXfault] = useState<number>(0.0);
  const [ybusResult, setYbusResult] = useState<YBusResult | null>(null);

  useEffect(() => {
    const res = calculateYBusAndFault(
      { r: r12, x: x12 },
      { r: r23, x: x23 },
      { r: r13, x: x13 },
      faultBus,
      { r: rfault, x: xfault }
    );
    setYbusResult(res);
  }, [r12, x12, r23, x23, r13, x13, faultBus, rfault, xfault]);

  // --- MODULATION CONSTELLATION VIEWER STATE ---
  const [modScheme, setModScheme] = useState<'BPSK' | 'QPSK' | '16-QAM'>('QPSK');
  const [binaryData, setBinaryData] = useState<string>('1011010011000110');
  const [constellationPoints, setConstellationPoints] = useState<ConstellationPoint[]>([]);

  useEffect(() => {
    const pts = generateConstellation(modScheme, binaryData);
    setConstellationPoints(pts);
  }, [modScheme, binaryData]);

  const handleRandomBinary = () => {
    const len = modScheme === '16-QAM' ? 16 : modScheme === 'QPSK' ? 16 : 12;
    let rand = '';
    for (let i = 0; i < len; i++) {
      rand += Math.random() > 0.5 ? '1' : '0';
    }
    setBinaryData(rand);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 font-sans text-slate-100 bg-navy-dark min-h-screen space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO TOOLS CATALOG
        </Link>
      </div>

      {/* Header section */}
      <div className="border-b border-navy-light pb-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8 text-emerald-accent" />
            Advanced Signal & Power Simulators
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Core analytical simulators calibrated for DSP, Power Systems, Power Electronics, and Modulation theory courses.
          </p>
        </div>
        <div className="flex bg-navy-light/40 p-1 rounded-xl border border-navy-light/60 self-start md:self-center">
          <button
            onClick={() => setActiveTab('dsp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'dsp' ? 'bg-emerald-accent text-navy-dark shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            DSP (EEE 3207)
          </button>
          <button
            onClick={() => setActiveTab('pwm')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'pwm' ? 'bg-emerald-accent text-navy-dark shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            Power Electronics (3203)
          </button>
          <button
            onClick={() => setActiveTab('ybus')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'ybus' ? 'bg-emerald-accent text-navy-dark shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            Power Systems II (3211)
          </button>
          <button
            onClick={() => setActiveTab('modulation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'modulation' ? 'bg-emerald-accent text-navy-dark shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            Comm II (3217)
          </button>
        </div>
      </div>

      {/* TABS CONTAINER */}
      <div>
        {/* TAB 1: DSP FILTER DESIGNER */}
        {activeTab === 'dsp' && dspResult && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input card */}
            <div className="rounded-2xl border border-navy-light bg-navy-card p-6 space-y-6 h-fit">
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-1.5">
                <Sliders className="h-5 w-5 text-emerald-accent" />
                Filter Specifications
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Filter Response Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setFilterType('lowpass')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        filterType === 'lowpass'
                          ? 'border-emerald-accent/40 bg-emerald-accent/10 text-emerald-accent'
                          : 'border-navy-light bg-navy-dark hover:border-slate-500 text-slate-300'
                      }`}
                    >
                      Low-Pass (LPF)
                    </button>
                    <button
                      onClick={() => setFilterType('highpass')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        filterType === 'highpass'
                          ? 'border-emerald-accent/40 bg-emerald-accent/10 text-emerald-accent'
                          : 'border-navy-light bg-navy-dark hover:border-slate-500 text-slate-300'
                      }`}
                    >
                      High-Pass (HPF)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Design Implementation</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setFilterMethod('FIR')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        filterMethod === 'FIR'
                          ? 'border-emerald-accent/40 bg-emerald-accent/10 text-emerald-accent'
                          : 'border-navy-light bg-navy-dark hover:border-slate-500 text-slate-300'
                      }`}
                    >
                      FIR (Window Method)
                    </button>
                    <button
                      onClick={() => setFilterMethod('IIR')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        filterMethod === 'IIR'
                          ? 'border-emerald-accent/40 bg-emerald-accent/10 text-emerald-accent'
                          : 'border-navy-light bg-navy-dark hover:border-slate-500 text-slate-300'
                      }`}
                    >
                      IIR (Bilinear transform)
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold uppercase text-slate-400">Cut-off Frequency (fc)</label>
                    <span className="text-xs font-mono font-bold text-emerald-accent">{cutoffFreq} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max={Math.floor(samplingFreq / 2 - 10)}
                    step="50"
                    value={cutoffFreq}
                    onChange={(e) => setCutoffFreq(Number(e.target.value))}
                    className="w-full accent-emerald-accent"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>100 Hz</span>
                    <span>Nyquist Limit ({Math.floor(samplingFreq / 2)} Hz)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold uppercase text-slate-400">Sampling Frequency (fs)</label>
                    <span className="text-xs font-mono font-bold text-emerald-accent">{samplingFreq} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="2000"
                    max="16000"
                    step="1000"
                    value={samplingFreq}
                    onChange={(e) => setSamplingFreq(Number(e.target.value))}
                    className="w-full accent-emerald-accent"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>2 kHz</span>
                    <span>16 kHz</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-navy-dark/60 border border-navy-light p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Normalized cutoff (ωc):</span>
                  <span className="font-mono font-bold text-slate-200">
                    {((2 * Math.PI * cutoffFreq) / samplingFreq).toFixed(4)} rad/s
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Order:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {filterMethod === 'FIR' ? '20 (21 taps)' : '2nd Order Butterworth'}
                  </span>
                </div>
              </div>
            </div>

            {/* Frequency Response Plots & coefficients */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-end">
                <IEEEReportButton
                  experimentName="Digital Signal Processing: Filter Design"
                  inputData={{
                    'Filter Type': filterType,
                    'Design Method': filterMethod,
                    'Cutoff Frequency (Hz)': cutoffFreq,
                    'Sampling Frequency (Hz)': samplingFreq
                  }}
                  outputData={{
                    'Filter Order': filterMethod === 'FIR' ? '20 (21 taps)' : '2nd Order',
                    'Normalized Cutoff (rad/s)': ((2 * Math.PI * cutoffFreq) / samplingFreq).toFixed(4),
                    'Max Magnitude (dB)': Math.max(...dspResult.freqResponse.map(r => r.magnitudeDb)).toFixed(2)
                  }}
                  chartSelectors={['#dsp-mag-chart']}
                />
              </div>
              {/* Plot */}
              <div className="rounded-2xl border border-navy-light bg-navy-card p-6" id="dsp-mag-chart">
                <h3 className="font-display text-sm font-bold text-white mb-4 uppercase tracking-wider text-slate-300">
                  Magnitude Response (H(e^jω) dB)
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dspResult.freqResponse}>
                      <defs>
                        <linearGradient id="magGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="frequency" stroke="#9ca3af" label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -5, fill: '#9ca3af' }} />
                      <YAxis stroke="#9ca3af" domain={[-60, 5]} label={{ value: 'Gain (dB)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0b1329', borderColor: '#1f2937', borderRadius: '10px' }}
                        labelFormatter={(label) => `Freq: ${label} Hz`}
                      />
                      <Area type="monotone" dataKey="magnitudeDb" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#magGrad)" name="Magnitude (dB)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Coefficients list */}
              <div className="rounded-2xl border border-navy-light bg-navy-card p-6">
                <h3 className="font-display text-sm font-bold text-white mb-3 uppercase tracking-wider text-slate-300">
                  Computed Filter Coefficients
                </h3>
                {Array.isArray(dspResult.coefficients) ? (
                  <div className="max-h-48 overflow-y-auto border border-navy-light rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-navy-dark text-slate-400 uppercase font-mono sticky top-0">
                        <tr>
                          <th className="px-4 py-2">Tap (n)</th>
                          <th className="px-4 py-2">Coefficient h[n]</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy-light font-mono text-slate-300 bg-navy-dark/40">
                        {(dspResult.coefficients as number[]).map((coeff, idx) => (
                          <tr key={idx} className="hover:bg-navy-light/20">
                            <td className="px-4 py-1.5 font-bold">h[{idx}]</td>
                            <td className="px-4 py-1.5">{coeff.toFixed(8)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-navy-light bg-navy-dark/60 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-emerald-accent uppercase mb-2">Numerator (b coefficients)</h4>
                      <div className="space-y-1.5 font-mono text-xs text-slate-300">
                        <div className="flex justify-between">
                          <span>b0 (Gain):</span>
                          <span className="font-bold">{(dspResult.coefficients as any).b[0].toFixed(8)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>b1:</span>
                          <span className="font-bold">{(dspResult.coefficients as any).b[1].toFixed(8)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>b2:</span>
                          <span className="font-bold">{(dspResult.coefficients as any).b[2].toFixed(8)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="border border-navy-light bg-navy-dark/60 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-emerald-accent uppercase mb-2">Denominator (a coefficients)</h4>
                      <div className="space-y-1.5 font-mono text-xs text-slate-300">
                        <div className="flex justify-between">
                          <span>a0 (fixed):</span>
                          <span className="font-bold">1.00000000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>a1:</span>
                          <span className="font-bold">{(dspResult.coefficients as any).a[1].toFixed(8)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>a2:</span>
                          <span className="font-bold">{(dspResult.coefficients as any).a[2].toFixed(8)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: POWER ELECTRONICS PWM */}
        {activeTab === 'pwm' && pwmResult && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Specifications */}
            <div className="rounded-2xl border border-navy-light bg-navy-card p-6 space-y-6 h-fit">
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-1.5">
                <Sliders className="h-5 w-5 text-emerald-accent" />
                Inverter Parameters
              </h2>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold uppercase text-slate-400">DC Link Voltage (Vdc)</label>
                    <span className="text-xs font-mono font-bold text-emerald-accent">{dcVoltage} V</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="600"
                    step="10"
                    value={dcVoltage}
                    onChange={(e) => setDcVoltage(Number(e.target.value))}
                    className="w-full accent-emerald-accent"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>50 V</span>
                    <span>600 V</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold uppercase text-slate-400">Modulation Index (ma)</label>
                    <span className="text-xs font-mono font-bold text-emerald-accent">{modulationIndex.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.2"
                    step="0.05"
                    value={modulationIndex}
                    onChange={(e) => setModulationIndex(Number(e.target.value))}
                    className="w-full accent-emerald-accent"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>0.1 (Under-modulated)</span>
                    <span>1.2 (Over-modulated)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold uppercase text-slate-400">Carrier Frequency (fc)</label>
                    <span className="text-xs font-mono font-bold text-emerald-accent">{carrierFreq} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="250"
                    value={carrierFreq}
                    onChange={(e) => setCarrierFreq(Number(e.target.value))}
                    className="w-full accent-emerald-accent"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>500 Hz</span>
                    <span>5000 Hz</span>
                  </div>
                </div>
              </div>

              {/* PWM Outputs info */}
              <div className="rounded-xl bg-navy-dark/60 border border-navy-light p-4 space-y-3 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>RMS Fundamental Peak:</span>
                  <span className="font-mono font-bold text-emerald-accent text-sm">
                    {pwmResult.rmsVoltage} V
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Total Harm. Distortion:</span>
                  <span className="font-mono font-bold text-red-400 text-sm">
                    {pwmResult.thdEstimate}%
                  </span>
                </div>
                <div className="flex justify-between text-slate-300 border-t border-navy-light/40 pt-2">
                  <span>Modulation Status:</span>
                  <span className={`font-mono font-bold text-xs ${modulationIndex > 1.0 ? 'text-amber-400' : 'text-green-400'}`}>
                    {modulationIndex > 1.0 ? 'OVERMODULATION (Nonlinear)' : 'LINEAR SWITCHING'}
                  </span>
                </div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-end">
                <IEEEReportButton
                  experimentName="Power Electronics: PWM Inverter Analysis"
                  inputData={{
                    'DC Link Voltage (V)': dcVoltage,
                    'Modulation Index (m_a)': modulationIndex,
                    'Carrier Frequency (Hz)': carrierFreq,
                    'Fundamental Frequency (Hz)': 50
                  }}
                  outputData={{
                    'RMS Fundamental Peak (V)': pwmResult.rmsVoltage,
                    'THD Estimate (%)': pwmResult.thdEstimate,
                    'Modulation Status': modulationIndex > 1.0 ? 'OVERMODULATION' : 'LINEAR SWITCHING'
                  }}
                  chartSelectors={['#pwm-chart']}
                />
              </div>
              <div className="rounded-2xl border border-navy-light bg-navy-card p-6" id="pwm-chart">
                <h3 className="font-display text-sm font-bold text-white mb-4 uppercase tracking-wider text-slate-300">
                  PWM Switching Output & Carrier Waves (Fundamental: 50 Hz)
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pwmResult.points} margin={{ bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="timeMs" stroke="#9ca3af" label={{ value: 'Time (milliseconds)', position: 'insideBottom', offset: -2, fill: '#9ca3af' }} />
                      <YAxis stroke="#9ca3af" domain={[-dcVoltage * 0.8, dcVoltage * 0.8]} label={{ value: 'Amplitude (V)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0b1329', borderColor: '#1f2937', borderRadius: '10px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="voltage" stroke="#10b981" strokeWidth={2} dot={false} name="Inverter Output (V)" />
                      <Line type="monotone" dataKey="reference" stroke="#3b82f6" strokeWidth={2.5} dot={false} strokeDasharray="5 5" name="Modulating Sine" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-navy-light bg-navy-card p-6 flex flex-col md:flex-row gap-6 items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">Power electronics design reminder</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Higher carrier frequencies (<span className="text-emerald-accent">fc</span>) reduce THD and shift harmonics to higher spectrums, allowing smaller filters. However, this dramatically increases switching losses in silicon power MOSFETs / IGBTs (EEE 3203).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Y-BUS & FAULT CALCULATOR */}
        {activeTab === 'ybus' && ybusResult && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Imepedance inputs */}
            <div className="rounded-2xl border border-navy-light bg-navy-card p-6 space-y-6 h-fit">
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-1.5">
                <Sliders className="h-5 w-5 text-emerald-accent" />
                System Impedances
              </h2>

              <div className="space-y-4">
                <div className="border-b border-navy-light/40 pb-3">
                  <h3 className="text-xs font-bold text-emerald-accent uppercase mb-2">Line 1 - 2 (Z12)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase text-slate-400">R (p.u.)</label>
                      <input
                        type="number"
                        step="0.005"
                        min="0.001"
                        value={r12}
                        onChange={(e) => setR12(Number(e.target.value))}
                        className="w-full bg-navy-dark border border-navy-light rounded-xl px-3 py-1.5 text-xs font-mono focus:border-emerald-accent focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-slate-400">X (p.u.)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={x12}
                        onChange={(e) => setX12(Number(e.target.value))}
                        className="w-full bg-navy-dark border border-navy-light rounded-xl px-3 py-1.5 text-xs font-mono focus:border-emerald-accent focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-b border-navy-light/40 pb-3">
                  <h3 className="text-xs font-bold text-emerald-accent uppercase mb-2">Line 2 - 3 (Z23)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase text-slate-400">R (p.u.)</label>
                      <input
                        type="number"
                        step="0.005"
                        min="0.001"
                        value={r23}
                        onChange={(e) => setR23(Number(e.target.value))}
                        className="w-full bg-navy-dark border border-navy-light rounded-xl px-3 py-1.5 text-xs font-mono focus:border-emerald-accent focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-slate-400">X (p.u.)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={x23}
                        onChange={(e) => setX23(Number(e.target.value))}
                        className="w-full bg-navy-dark border border-navy-light rounded-xl px-3 py-1.5 text-xs font-mono focus:border-emerald-accent focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-emerald-accent uppercase mb-2">Line 1 - 3 (Z13)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase text-slate-400">R (p.u.)</label>
                      <input
                        type="number"
                        step="0.005"
                        min="0.001"
                        value={r13}
                        onChange={(e) => setR13(Number(e.target.value))}
                        className="w-full bg-navy-dark border border-navy-light rounded-xl px-3 py-1.5 text-xs font-mono focus:border-emerald-accent focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-slate-400">X (p.u.)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={x13}
                        onChange={(e) => setX13(Number(e.target.value))}
                        className="w-full bg-navy-dark border border-navy-light rounded-xl px-3 py-1.5 text-xs font-mono focus:border-emerald-accent focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Calculations results */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-end mb-4">
                <IEEEReportButton
                  experimentName="Power Systems: Y-Bus Admittance and Fault Analysis"
                  inputData={{
                    'Z12': `${r12} + j${x12}`,
                    'Z23': `${r23} + j${x23}`,
                    'Z13': `${r13} + j${x13}`,
                    'Fault Bus Location': faultBus,
                    'Fault Impedance (Zf)': `${rfault} + j${xfault}`
                  }}
                  outputData={{
                    'Fault Current (If) Magnitude': ybusResult.faultCurrent + ' p.u.',
                    'Fault Current (If) Complex': ybusResult.faultCurrentComplex + ' p.u.',
                    'Y-Bus Trace': ybusResult.matrix.map((row, r) => `[ ${row.join(', ')} ]`).join(' ; ')
                  }}
                  chartSelectors={['#ybus-chart']}
                />
              </div>
              {/* YBus grid */}
              <div className="rounded-2xl border border-navy-light bg-navy-card p-6" id="ybus-chart">
                <h3 className="font-display text-sm font-bold text-white mb-4 uppercase tracking-wider text-slate-300">
                  Computed 3-Bus Y-Bus Admittance Matrix [p.u.]
                </h3>
                <div className="grid grid-cols-3 gap-3 border border-navy-light bg-navy-dark/40 p-4 rounded-2xl font-mono text-center text-xs md:text-sm">
                  {ybusResult.matrix.map((row, rIdx) =>
                    row.map((val, cIdx) => (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        className="bg-navy-dark border border-navy-light/60 rounded-xl p-3 flex flex-col justify-center items-center shadow-inner hover:border-emerald-accent/50 transition-colors"
                      >
                        <span className="text-[9px] text-slate-500 uppercase font-bold mb-1">
                          Y{rIdx + 1}{cIdx + 1}
                        </span>
                        <span className="font-semibold text-emerald-accent truncate max-w-full">
                          {val}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Fault current calculator */}
              <div className="rounded-2xl border border-navy-light bg-navy-card p-6 space-y-4">
                <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider text-slate-300">
                  Symmetrical 3-Phase Fault Current Calculator
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Fault Bus Location</label>
                    <select
                      value={faultBus}
                      onChange={(e) => setFaultBus(Number(e.target.value))}
                      className="w-full bg-navy-dark border border-navy-light rounded-xl px-3 py-2 text-xs focus:border-emerald-accent focus:outline-none font-bold"
                    >
                      <option value={1}>Bus 1</option>
                      <option value={2}>Bus 2</option>
                      <option value={3}>Bus 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Fault Resistance Rf (p.u.)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={rfault}
                      onChange={(e) => setRfault(Number(e.target.value))}
                      className="w-full bg-navy-dark border border-navy-light rounded-xl px-3 py-1.5 text-xs font-mono focus:border-emerald-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Fault Reactance Xf (p.u.)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={xfault}
                      onChange={(e) => setXfault(Number(e.target.value))}
                      className="w-full bg-navy-dark border border-navy-light rounded-xl px-3 py-1.5 text-xs font-mono focus:border-emerald-accent focus:outline-none"
                    />
                  </div>
                </div>

                <div className="bg-navy-dark/70 border border-navy-light p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest font-mono">
                      Calculated Fault Current (If) at Bus {faultBus}
                    </div>
                    <div className="text-2xl font-extrabold text-emerald-accent mt-1">
                      {ybusResult.faultCurrent} p.u.
                    </div>
                  </div>
                  <div className="text-xs font-mono text-slate-300">
                    <div>Complex representation:</div>
                    <div className="text-emerald-accent font-bold mt-1 text-sm bg-navy-dark p-2 rounded-lg border border-navy-light/40">
                      If = {ybusResult.faultCurrentComplex} p.u.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DIGITAL MODULATION CONSTELLATION */}
        {activeTab === 'modulation' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input specifications */}
            <div className="rounded-2xl border border-navy-light bg-navy-card p-6 space-y-6 h-fit">
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-1.5">
                <Sliders className="h-5 w-5 text-emerald-accent" />
                Modulation Config
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Modulation Scheme</label>
                  <div className="flex flex-col gap-2">
                    {['BPSK', 'QPSK', '16-QAM'].map((scheme) => (
                      <button
                        key={scheme}
                        onClick={() => {
                          setModScheme(scheme as any);
                          // Resize binaryData to fit bit constraints elegantly
                          setBinaryData(scheme === '16-QAM' ? '1011010011000110' : scheme === 'QPSK' ? '10110100' : '101100');
                        }}
                        className={`py-2 px-3 text-left rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          modScheme === scheme
                            ? 'border-emerald-accent/40 bg-emerald-accent/10 text-emerald-accent'
                            : 'border-navy-light bg-navy-dark hover:border-slate-500 text-slate-300'
                        }`}
                      >
                        {scheme} {scheme === 'BPSK' ? '(1 bit/sym)' : scheme === 'QPSK' ? '(2 bits/sym)' : '(4 bits/sym)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold uppercase text-slate-400">Binary Bitstream</label>
                    <button
                      onClick={handleRandomBinary}
                      className="text-[10px] text-emerald-accent font-bold hover:underline bg-transparent border-0 cursor-pointer"
                    >
                      Regen Random
                    </button>
                  </div>
                  <input
                    type="text"
                    value={binaryData}
                    onChange={(e) => setBinaryData(e.target.value.replace(/[^01]/g, ''))}
                    placeholder="Enter 0 or 1 sequence"
                    className="w-full bg-navy-dark border border-navy-light rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-accent focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 font-mono mt-1 leading-normal">
                    Symbols to transmit:{' '}
                    {modScheme === '16-QAM'
                      ? Math.floor(binaryData.length / 4)
                      : modScheme === 'QPSK'
                      ? Math.floor(binaryData.length / 2)
                      : binaryData.length}
                  </p>
                </div>
              </div>

              {/* Status details card */}
              <div className="rounded-xl bg-navy-dark/60 border border-navy-light p-4 text-xs space-y-2 leading-relaxed">
                <div className="flex justify-between">
                  <span>Modulation order (M):</span>
                  <span className="font-mono font-bold text-slate-300">
                    {modScheme === '16-QAM' ? '16' : modScheme === 'QPSK' ? '4' : '2'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Decision Boundaries:</span>
                  <span className="font-mono text-slate-300">
                    {modScheme === '16-QAM' ? 'I,Q ∈ {-2, 0, 2}' : modScheme === 'QPSK' ? 'Axes I=0, Q=0' : 'Axis I=0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Constellation Plot */}
            <div className="lg:col-span-2">
              <div className="flex justify-end mb-4">
                <IEEEReportButton
                  experimentName="Telecommunications: Digital Modulation Constellation"
                  inputData={{
                    'Modulation Scheme': modScheme,
                    'Binary Bitstream Length': binaryData.length,
                  }}
                  outputData={{
                    'Transmitted Symbols': Math.floor(binaryData.length / (modScheme === '16-QAM' ? 4 : modScheme === 'QPSK' ? 2 : 1)),
                    'Modulation Order (M)': modScheme === '16-QAM' ? '16' : modScheme === 'QPSK' ? '4' : '2'
                  }}
                  chartSelectors={['#modulation-chart']}
                />
              </div>
              <div className="rounded-2xl border border-navy-light bg-navy-card p-6" id="modulation-chart">
                <h3 className="font-display text-sm font-bold text-white mb-4 uppercase tracking-wider text-slate-300">
                  Symbol Constellation Diagram (IQ Complex Plane)
                </h3>
                <div className="h-80 w-full flex items-center justify-center bg-navy-dark/30 rounded-2xl p-4 border border-navy-light/30">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid stroke="#1f2937" />
                      <XAxis type="number" dataKey="i" name="In-Phase (I)" domain={[-1.5, 1.5]} stroke="#9ca3af" tickCount={7} />
                      <YAxis type="number" dataKey="q" name="Quadrature (Q)" domain={[-1.5, 1.5]} stroke="#9ca3af" tickCount={7} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0b1329', borderColor: '#1f2937', borderRadius: '10px' }} />
                      <Scatter name="Symbols" data={constellationPoints} fill="#10b981" line={false} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 justify-center text-[11px] text-slate-400 font-mono">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-accent inline-block" />
                    Green dots: Transmitted active symbol coordinates
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-0.5 w-3 bg-slate-600 inline-block" />
                    Grid axes represent optimal demodulator decision boundaries
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
