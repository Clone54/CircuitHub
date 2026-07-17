import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Radio,
  Sliders,
  HelpCircle,
  TrendingUp,
  Settings,
  ShieldCheck,
  CheckCircle,
  Hash,
  Activity,
  Zap,
  Info
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
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';

interface ArrayPoint {
  angle: number; // -180 to 180 degrees
  af: number; // normalized array factor (0 to 1)
  afDb: number; // array factor in dB (-40 to 0)
}

export default function TelecomRadarView() {
  // --- Antenna Array State ---
  const [elements, setElements] = useState<number>(4); // N
  const [spacing, setSpacing] = useState<number>(0.5); // d/lambda (spacing in wavelengths)
  const [phaseDiff, setPhaseDiff] = useState<number>(0); // beta in degrees
  const [steerAngle, setSteerAngle] = useState<number>(0); // steering angle (degrees) override
  const [steerEnabled, setSteerEnabled] = useState<boolean>(false);
  const [arrayPattern, setArrayPattern] = useState<ArrayPoint[]>([]);

  // --- Radar Range Calculator State ---
  const [txPower, setTxPower] = useState<number>(1000); // Pt in Watts (or kW)
  const [antennaGainDbi, setAntennaGainDbi] = useState<number>(20); // G in dBi
  const [rcs, setRcs] = useState<number>(10); // Sigma (RCS) in m^2
  const [sensitivityDbm, setSensitivityDbm] = useState<number>(-90); // Smin in dBm
  const [frequencyGhz, setFrequencyGhz] = useState<number>(3.0); // f in GHz

  // --- Calculated Outputs ---
  const [radarOutputs, setRadarOutputs] = useState<{
    wavelength: number;
    gainLinear: number;
    sensitivityWatts: number;
    maxRange: number;
  }>({
    wavelength: 0.1,
    gainLinear: 100,
    sensitivityWatts: 1e-12,
    maxRange: 15.3
  });

  // Calculate Array Pattern: AF(theta)
  useEffect(() => {
    const points: ArrayPoint[] = [];
    const N = elements;
    const dOverLambda = spacing;
    
    // Determine beta: either manually selected or auto-calculated to steer beam to steerAngle
    let betaRad = (phaseDiff * Math.PI) / 180;
    if (steerEnabled) {
      // For broadside steering at angle theta_0: beta = - k * d * cos(theta_0)
      // k*d = 2 * PI * dOverLambda
      const steerRad = (steerAngle * Math.PI) / 180;
      betaRad = -2 * Math.PI * dOverLambda * Math.cos(steerRad);
    }

    const kTimesD = 2 * Math.PI * dOverLambda;

    // Evaluate theta from -180 to 180 in steps of 2 degrees
    for (let thetaDeg = -180; thetaDeg <= 180; thetaDeg += 2) {
      const thetaRad = (thetaDeg * Math.PI) / 180;
      
      // psi = k * d * cos(theta) + beta
      // (Using classical array setup relative to the array axis cos(theta))
      const psi = kTimesD * Math.cos(thetaRad) + betaRad;
      
      let af = 1.0;
      if (Math.abs(Math.sin(psi / 2)) > 1e-5) {
        af = Math.sin((N * psi) / 2) / (N * Math.sin(psi / 2));
      } else {
        af = 1.0; // limit case
      }

      const afAbs = Math.abs(af);
      
      // Convert to decibels with -40dB lower clamp limit to avoid negative infinity
      let afDb = 20 * Math.log10(afAbs);
      if (afDb < -40 || isNaN(afDb)) {
        afDb = -40;
      }

      points.push({
        angle: thetaDeg,
        af: parseFloat(afAbs.toFixed(4)),
        afDb: parseFloat(afDb.toFixed(2))
      });
    }

    setArrayPattern(points);
  }, [elements, spacing, phaseDiff, steerAngle, steerEnabled]);

  // Calculate Radar Range Equation
  useEffect(() => {
    const Pt = txPower;
    const G_dbi = antennaGainDbi;
    const sigma = rcs;
    const Smin_dbm = sensitivityDbm;
    const f_ghz = frequencyGhz;

    // 1. Wavelength (lambda = c/f)
    const c = 3e8; // m/s
    const f_hz = f_ghz * 1e9;
    const lambda = c / f_hz;

    // 2. Linear Antenna Gain (G = 10^(G_dbi/10))
    const gainLinear = Math.pow(10, G_dbi / 10);

    // 3. Minimum detectable signal in Watts (Smin = 10^((Smin_dbm - 30)/10))
    const sensitivityWatts = Math.pow(10, (Smin_dbm - 30) / 10);

    // 4. Radar Range Formula: Rmax = [ (Pt * G^2 * lambda^2 * sigma) / ((4*pi)^3 * Smin) ] ^ (1/4)
    const numerator = Pt * Math.pow(gainLinear, 2) * Math.pow(lambda, 2) * sigma;
    const denominator = Math.pow(4 * Math.PI, 3) * sensitivityWatts;
    
    let maxRange = 0;
    if (denominator > 0) {
      maxRange = Math.pow(numerator / denominator, 0.25); // in meters
    }

    setRadarOutputs({
      wavelength: parseFloat(lambda.toFixed(4)), // in meters
      gainLinear: parseFloat(gainLinear.toFixed(1)),
      sensitivityWatts,
      maxRange: parseFloat((maxRange / 1000).toFixed(2)) // convert to kilometers
    });

  }, [txPower, antennaGainDbi, rcs, sensitivityDbm, frequencyGhz]);

  return (
    <div id="telecom-radar-view" className="min-h-screen bg-navy-dark text-slate-100 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-6">
          <Link to="/" className="hover:text-emerald-accent transition-colors">HOME</Link>
          <span>/</span>
          <Link to="/tools" className="hover:text-emerald-accent transition-colors">TOOLS</Link>
          <span>/</span>
          <span className="text-slate-200">TELECOM & RADAR SUITE</span>
        </div>

        {/* Dashboard Header */}
        <div className="relative mb-8 rounded-2xl border border-navy-light/60 bg-navy-light/20 p-6 md:p-8 overflow-hidden">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-cyan-400/5 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-emerald-accent/5 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-start justify-between gap-6" id="radar-chart">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs tracking-wider uppercase mb-2">
                <Radio className="h-4 w-4 animate-pulse" /> EEE 4281 / EEE 4283 Telecomms & Radar
              </div>
              <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
                Telecom & <span className="text-cyan-400">Radar Design</span> Suite
              </h1>
              <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
                Explore electromagnetic field pattern simulations. Analyze standard linear Antenna Array Factors, model radiation side lobes, and compute extreme radar boundary envelopes utilizing physical formulas.
              </p>
            </div>
            <div className="shrink-0">
              <IEEEReportButton
                experimentName="Telecommunications & Radar Design Suite"
                inputData={{
                  'Array Elements (N)': elements.toString(),
                  'Element Spacing (d/λ)': spacing.toFixed(2),
                  'Phase Difference (β)': phaseDiff + '°',
                  'Radar TX Power': txPower + ' W',
                  'Antenna Gain': antennaGainDbi + ' dBi',
                  'Radar Cross Section': rcs + ' m²',
                  'Radar Frequency': frequencyGhz + ' GHz'
                }}
                outputData={{
                  'Calculated Max Range': radarOutputs.maxRange + ' km',
                  'Radar Wavelength': radarOutputs.wavelength + ' m',
                  'Gain (Linear)': radarOutputs.gainLinear + 'x',
                  'Sensitivity (Watts)': radarOutputs.sensitivityWatts.toExponential(3) + ' W'
                }}
                chartSelectors={['#radar-chart']}
              />
            </div>
          </div>
        </div>

        {/* Major Grid: Section 1 (Antenna Array) & Section 2 (Radar Equation) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN: ANTENNA ARRAY VISUALIZER */}
          <div className="rounded-2xl border border-navy-light/60 bg-navy-light/10 p-6 space-y-6">
            
            <div className="flex items-center gap-2.5 pb-4 border-b border-navy-light/60">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <Radio className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-display font-black text-white text-base">
                  Linear Antenna Array Factor (AF)
                </h3>
                <p className="text-xs text-slate-400">
                  Model 2D polar array interference of N-element isotropic antennas.
                </p>
              </div>
            </div>

            {/* Recharts chart representation */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={arrayPattern}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorAF" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                  <XAxis
                    dataKey="angle"
                    stroke="#64748b"
                    tickFormatter={(ang) => `${ang}°`}
                    style={{ fontSize: '10px', fontFamily: 'monospace' }}
                  />
                  <YAxis
                    domain={[0, 1.0]}
                    stroke="#64748b"
                    label={{ value: 'Normalized AF', angle: -90, position: 'insideLeft', fill: '#64748b', style: {fontSize: '11px'} }}
                    style={{ fontSize: '10px', fontFamily: 'monospace' }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0b1329', borderColor: '#1e293b', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}
                    itemStyle={{ fontSize: '12px' }}
                    formatter={(value: any) => [`${value}`, 'Array Factor Magnitude']}
                    labelFormatter={(label) => `Angle: ${label}°`}
                  />
                  <ReferenceLine x={0} stroke="#475569" strokeDasharray="3 3" />
                  <Area
                    type="monotone"
                    dataKey="af"
                    stroke="#22d3ee"
                    fillOpacity={1}
                    fill="url(#colorAF)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Inputs & Parameters sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Elements N slider */}
              <div className="p-4 rounded-xl bg-navy-dark/60 border border-navy-light/60 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Elements (N):</span>
                  <span className="text-white font-bold">{elements} units</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="16"
                  step="1"
                  value={elements}
                  onChange={(e) => setElements(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">
                  Total discrete phase-fed isotropic antenna transmitters.
                </p>
              </div>

              {/* Spacing d slider */}
              <div className="p-4 rounded-xl bg-navy-dark/60 border border-navy-light/60 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Spacing (d):</span>
                  <span className="text-white font-bold">{spacing} λ</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.05"
                  value={spacing}
                  onChange={(e) => setSpacing(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">
                  Inter-element spatial distance in terms of signal wavelength.
                </p>
              </div>

              {/* Manual Phase Difference */}
              <div className="p-4 rounded-xl bg-navy-dark/60 border border-navy-light/60 space-y-2 sm:col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex justify-between text-xs font-mono w-full">
                    <span className="text-slate-400">Phase Offset (β):</span>
                    <span className="text-cyan-400 font-bold">{phaseDiff}°</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={phaseDiff}
                  disabled={steerEnabled}
                  onChange={(e) => setPhaseDiff(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer disabled:opacity-30"
                />
                
                {/* Steer toggle check */}
                <div className="flex items-center gap-2 pt-2 border-t border-navy-light/40 mt-1">
                  <input
                    type="checkbox"
                    id="steer_toggle"
                    checked={steerEnabled}
                    onChange={(e) => setSteerEnabled(e.target.checked)}
                    className="accent-cyan-400 cursor-pointer"
                  />
                  <label htmlFor="steer_toggle" className="text-[11px] text-slate-300 font-medium cursor-pointer">
                    Enable Active Main Lobe Steering
                  </label>
                </div>

                {steerEnabled && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Target Steering (θ₀):</span>
                      <span className="text-emerald-accent font-bold">{steerAngle}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="180"
                      step="5"
                      value={steerAngle}
                      onChange={(e) => setSteerAngle(parseInt(e.target.value))}
                      className="w-full accent-emerald-accent cursor-pointer"
                    />
                  </div>
                )}
              </div>

            </div>

            {/* Info help box */}
            <div className="p-4 rounded-xl bg-navy-dark/40 border border-navy-light/60 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-1 font-bold text-slate-300 uppercase font-mono text-[10px]">
                <Info className="h-3.5 w-3.5 text-indigo-400" /> Electromagnetic Principles
              </div>
              <p className="leading-relaxed">
                The Normalized Array Factor formulation isolates array configurations from discrete antenna elements. Maxima lobes represent phase reinforcement, whereas zero crossings signify perfect phase cancellation (spatial nulls).
              </p>
            </div>

          </div>

          {/* RIGHT COLUMN: RADAR RANGE CALCULATOR */}
          <div className="rounded-2xl border border-navy-light/60 bg-navy-light/10 p-6 space-y-6 flex flex-col justify-between">
            
            <div className="space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-navy-light/60">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-display font-black text-white text-base">
                    Maximum Radar Detection Range
                  </h3>
                  <p className="text-xs text-slate-400">
                    Solve spatial detection boundaries using the standard fourth-power radar equation.
                  </p>
                </div>
              </div>

              {/* Output Billboard */}
              <div className="p-6 rounded-2xl border border-emerald-accent/20 bg-emerald-accent/5 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Calculated Maximum Search Range (Rmax)
                </span>
                <div className="text-4xl font-black text-emerald-accent font-mono mt-2 flex items-baseline gap-1">
                  {radarOutputs.maxRange}
                  <span className="text-base font-normal text-slate-400"> km</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  Assuming electromagnetic propagation through free space (attenuation scaling is 1/R⁴).
                </div>
              </div>

              {/* Input Adjusters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Tx Power */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 block">
                    Transmit Peak Power (Pt):
                  </label>
                  <div className="flex items-center bg-navy-dark border border-navy-light/80 rounded-xl px-3 py-2">
                    <input
                      type="number"
                      value={txPower}
                      onChange={(e) => setTxPower(Math.max(1, Number(e.target.value)))}
                      className="bg-transparent w-full text-white font-mono text-sm focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-mono">W</span>
                  </div>
                </div>

                {/* Antenna Gain dBi */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 block">
                    Antenna Gain (G):
                  </label>
                  <div className="flex items-center bg-navy-dark border border-navy-light/80 rounded-xl px-3 py-2">
                    <input
                      type="number"
                      value={antennaGainDbi}
                      onChange={(e) => setAntennaGainDbi(Number(e.target.value))}
                      className="bg-transparent w-full text-white font-mono text-sm focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-mono">dBi</span>
                  </div>
                </div>

                {/* Target Cross Section */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 block">
                    Radar Cross Section (RCS, σ):
                  </label>
                  <div className="flex items-center bg-navy-dark border border-navy-light/80 rounded-xl px-3 py-2">
                    <input
                      type="number"
                      value={rcs}
                      onChange={(e) => setRcs(Math.max(0.1, Number(e.target.value)))}
                      className="bg-transparent w-full text-white font-mono text-sm focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-mono">m²</span>
                  </div>
                </div>

                {/* Sensitivity dBm */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 block">
                    Receiver Sensitivity (S_min):
                  </label>
                  <div className="flex items-center bg-navy-dark border border-navy-light/80 rounded-xl px-3 py-2">
                    <input
                      type="number"
                      value={sensitivityDbm}
                      onChange={(e) => setSensitivityDbm(Number(e.target.value))}
                      className="bg-transparent w-full text-white font-mono text-sm focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-mono">dBm</span>
                  </div>
                </div>

                {/* Operating Frequency */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-mono text-slate-400 block">
                    Carrier Frequency (f):
                  </label>
                  <div className="flex items-center bg-navy-dark border border-navy-light/80 rounded-xl px-3 py-2">
                    <input
                      type="number"
                      step="0.1"
                      value={frequencyGhz}
                      onChange={(e) => setFrequencyGhz(Math.max(0.1, Number(e.target.value)))}
                      className="bg-transparent w-full text-white font-mono text-sm focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-mono">GHz</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="p-4 rounded-xl bg-navy-dark/60 border border-navy-light/60 space-y-2 mt-6">
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Intermediate Multi-Stage Conversions
              </h4>
              <div className="space-y-2 font-mono text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>Wavelength (λ):</span>
                  <span className="text-slate-200">{radarOutputs.wavelength} m</span>
                </div>
                <div className="flex justify-between">
                  <span>Linear Gain (G_linear):</span>
                  <span className="text-slate-200">{radarOutputs.gainLinear}x ratio</span>
                </div>
                <div className="flex justify-between">
                  <span>Sensitivity (S_min):</span>
                  <span className="text-slate-200">{radarOutputs.sensitivityWatts.toExponential(3)} Watts</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
