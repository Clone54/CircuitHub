import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Radio,
  Zap,
  TrendingUp,
  Cpu,
  Wrench,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Settings,
  HelpCircle,
  Network,
  Activity,
  Sliders,
  Compass
} from 'lucide-react';
import { IEEEReportButton } from '../components/IEEEReportButton';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

// Custom hooks
import { useSmithChart } from '../hooks/useSmithChart';
import { useFriisEquation, AntennaType } from '../hooks/useFriisEquation';
import { useSParameters, MatrixSize } from '../hooks/useSParameters';

// Custom visualizer
import { SmithChartVisualizer } from '../components/SmithChartVisualizer';

type TabId = 'smith' | 'friis' | 'sparams';

export default function MicrowaveToolsView() {
  const [activeTab, setActiveTab] = useState<TabId>('smith');

  // ==========================================
  // TAB 1: Smith Chart & Impedance Matcher
  // ==========================================
  const {
    zReal,
    setZReal,
    zImag,
    setZImag,
    z0,
    setZ0,
    smithMetrics
  } = useSmithChart();

  // Match rating / VSWR rating
  const matchQuality = useMemo(() => {
    const v = smithMetrics.vswrNum;
    if (v === 1.0) return { label: 'Perfect Match (Lossless)', color: 'text-emerald-accent bg-emerald-accent/5 border-emerald-accent/20' };
    if (v < 1.3) return { label: 'Excellent Match (Low Reflections)', color: 'text-emerald-accent bg-emerald-accent/5 border-emerald-accent/20' };
    if (v < 2.0) return { label: 'Acceptable Match (Standard)', color: 'text-yellow-400 bg-yellow-400/5 border-yellow-400/20' };
    return { label: 'Poor Match (High Reflections / Mismatch)', color: 'text-red-400 bg-red-400/5 border-red-400/20' };
  }, [smithMetrics.vswrNum]);


  // ==========================================
  // TAB 2: Antenna Radiation & Friis Link
  // ==========================================
  const {
    pt,
    setPt,
    gt,
    setGt,
    gr,
    setGr,
    frequency,
    setFrequency,
    distance,
    setDistance,
    antennaType,
    setAntennaType,
    friisMetrics,
    radiationPatternData
  } = useFriisEquation();

  // Sensitivity threshold constant for fade margin calculation
  const sensitivity = -85; // dBm receiver sensitivity threshold
  const margin = parseFloat((friisMetrics.pr - sensitivity).toFixed(2));
  const isViable = friisMetrics.pr >= sensitivity;

  // Received power profile with distance
  const linkProfileData = useMemo(() => {
    if (frequency <= 0) return [];
    const maxDist = Math.max(5, distance * 2);
    const steps = 15;
    const stepVal = maxDist / steps;
    const data = [];

    // Exact speed of light
    const c = 299792458;
    const fHz = frequency * 1e9;

    for (let i = 1; i <= steps; i++) {
      const d = i * stepVal;
      const dMeters = d * 1000;
      const fspl = 20 * Math.log10(dMeters) + 20 * Math.log10(fHz) + 20 * Math.log10((4 * Math.PI) / c);
      const rxPwr = pt + gt + gr - fspl;

      data.push({
        distKm: parseFloat(d.toFixed(2)),
        "Received Power": parseFloat(rxPwr.toFixed(2)),
        "Sensitivity Threshold": sensitivity
      });
    }
    return data;
  }, [pt, gt, gr, frequency, distance]);


  // ==========================================
  // TAB 3: S-Parameter Matrix Analyzer
  // ==========================================
  const {
    size: matrixSize,
    setSize: setMatrixSize,
    matrix: sMatrix,
    updateCell,
    sMetrics
  } = useSParameters();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-h-screen text-slate-100">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO TOOLS CATALOG
        </Link>
        <span className="text-[10px] font-mono text-emerald-accent/80 tracking-widest uppercase bg-emerald-accent/5 border border-emerald-accent/20 px-3 py-1 rounded-md">
          4th Year Even Semester / EEE 4217
        </span>
      </div>

      {/* Hero Title Section */}
      <div className="bg-gradient-to-r from-navy-card/90 via-navy-light/40 to-navy-card border border-navy-light/60 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-accent/10 border border-emerald-accent/30 text-xs font-bold text-emerald-accent uppercase tracking-wider">
            <Radio className="h-4.5 w-4.5 text-emerald-accent" /> Microwave & RF Design Suite
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-black tracking-tight text-white">
            Microwave Engineering <span className="text-emerald-accent">Analysis Lab</span>
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            Simulate high-frequency electromagnetic propagation using the exact Friis link equations, plot complex loads on an interactive Smith Chart, and analyze scattering parameters of multi-port microwave networks.
          </p>
        </div>
        {/* Abstract pattern background */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none"></div>
      </div>

      {/* Tab Switcher */}
      <div className="flex flex-wrap gap-2 border-b border-navy-light/40 pb-1">
        {[
          { id: 'smith', label: 'Smith Chart & Impedance Matcher', icon: Compass },
          { id: 'friis', label: 'Antenna Radiation & Friis Link', icon: Radio },
          { id: 'sparams', label: 'S-Parameter Matrix Analyzer', icon: Network }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer border ${
                isActive
                  ? 'bg-emerald-accent text-navy-dark border-emerald-accent shadow-lg shadow-emerald-accent/10'
                  : 'bg-navy-card/50 border-navy-light/40 text-slate-400 hover:bg-navy-light/25 hover:text-slate-200'
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="animate-fadeIn">

        {/* ========================================== */}
        {/* TAB 1: SMITH CHART & IMPEDANCE MATCHER */}
        {/* ========================================== */}
        {activeTab === 'smith' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Input Controls */}
            <div className="lg:col-span-5 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Settings className="h-5 w-5 text-emerald-accent" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">
                  Line & Load Parameters
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                {/* Characteristic Impedance */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Characteristic Impedance (Z0)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={z0}
                      onChange={(e) => setZ0(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-navy-dark border border-navy-light/60 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-accent/80 font-mono"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-500 font-mono">Ω</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Common coax system reference (default 50 Ω)
                  </p>
                </div>

                {/* Real load impedance */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium flex justify-between">
                    <span>Load Resistance (R_L)</span>
                    <span className="text-emerald-accent font-mono font-bold">{zReal} Ω</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={250}
                    step={1}
                    value={zReal}
                    onChange={(e) => setZReal(Number(e.target.value))}
                    className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0 Ω (Short)</span>
                    <span>250 Ω</span>
                  </div>
                </div>

                {/* Imaginary load impedance */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium flex justify-between">
                    <span>Load Reactance (X_L)</span>
                    <span className="text-emerald-accent font-mono font-bold">{zImag >= 0 ? '+' : ''}{zImag} jΩ</span>
                  </label>
                  <input
                    type="range"
                    min={-150}
                    max={150}
                    step={1}
                    value={zImag}
                    onChange={(e) => setZImag(Number(e.target.value))}
                    className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>-150 Ω (Capacitive)</span>
                    <span>+150 Ω (Inductive)</span>
                  </div>
                </div>
              </div>

              {/* Math decomposition summary */}
              <div className="bg-navy-dark p-4 rounded-xl border border-navy-light/40 text-[10px] text-slate-400 space-y-2 font-mono">
                <div className="text-slate-300 font-bold uppercase tracking-wider text-[9px]">
                  Impedance Math Guidelines
                </div>
                <p className="leading-relaxed">
                  Reflection Coefficient (Γ) maps complex load disparities:
                  <br/>
                  <strong>Γ = (Z_L - Z_0) / (Z_L + Z_0)</strong>
                </p>
                <p className="leading-relaxed">
                  Voltage Standing Wave Ratio is derived from magnitude:
                  <br/>
                  <strong>VSWR = (1 + |Γ|) / (1 - |Γ|)</strong>
                </p>
              </div>
            </div>

            {/* Visual plot right column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex justify-end">
                <IEEEReportButton
                  experimentName="Microwave Engineering: Smith Chart & Impedance Match"
                  inputData={{
                    'Characteristic Impedance (Z0)': z0 + ' Ω',
                    'Load Resistance (R_L)': zReal + ' Ω',
                    'Load Reactance (X_L)': zImag + ' Ω'
                  }}
                  outputData={{
                    'Normalized Resistance': smithMetrics.rn,
                    'Normalized Reactance': smithMetrics.xn,
                    'Reflection Magnitude (|Γ|)': smithMetrics.gammaMag,
                    'Reflection Phase (∠Γ)': smithMetrics.gammaAngleDeg + '°',
                    'VSWR': smithMetrics.vswr.toString(),
                    'Return Loss': smithMetrics.returnLoss + ' dB'
                  }}
                  chartSelectors={['#smith-chart-pane']}
                />
              </div>

              {/* Outputs Card */}
              <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6" id="smith-chart-pane">
                <div className="flex justify-between items-center pb-2 border-b border-navy-light/40">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                    Calculated Scattering & VSWR Metrics
                  </h4>
                  <span className={`text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-md border ${matchQuality.color}`}>
                    {matchQuality.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Normalized z</span>
                    <span className="text-base font-bold text-white tracking-tight mt-1 font-mono">
                      {smithMetrics.rn} {smithMetrics.xn >= 0 ? '+' : ''}{smithMetrics.xn}j
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1 font-mono">
                      Normalized Z_L / Z0
                    </span>
                  </div>

                  <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Reflection |Γ|</span>
                    <span className="text-base font-bold text-white tracking-tight mt-1 font-mono animate-pulse">
                      {smithMetrics.gammaMag}
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1 font-mono">
                      Magnitude coefficient
                    </span>
                  </div>

                  <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Phase Angle ∠θ</span>
                    <span className="text-base font-bold text-white tracking-tight mt-1 font-mono">
                      {smithMetrics.gammaAngleDeg}°
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1 font-mono">
                      Reflection angle
                    </span>
                  </div>

                  <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">VSWR Ratio</span>
                    <span className="text-base font-bold text-emerald-accent tracking-tight mt-1 font-mono">
                      {smithMetrics.vswr}
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1 font-mono">
                      Standing wave ratio
                    </span>
                  </div>
                </div>

                {/* S-matrix metrics inside Smith tab */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <SmithChartVisualizer
                    zReal={zReal}
                    zImag={zImag}
                    z0={z0}
                    gammaReal={smithMetrics.gammaReal}
                    gammaImag={smithMetrics.gammaImag}
                    gammaMag={smithMetrics.gammaMag}
                    vswrNum={smithMetrics.vswrNum}
                  />

                  <div className="space-y-4 text-xs">
                    <span className="font-bold text-slate-300 block uppercase font-mono tracking-wider text-[10px]">
                      Impedance Matching Advice
                    </span>
                    <div className="bg-navy-dark border border-navy-light/40 p-4 rounded-xl space-y-3 font-sans">
                      {smithMetrics.vswrNum <= 1.15 ? (
                        <div className="flex gap-2 text-emerald-accent">
                          <CheckCircle2 className="h-5 w-5 shrink-0" />
                          <p>
                            <strong>Optimal Impedance Match:</strong> No stub-tuning or matching circuit is required. The transmission line power delivery is highly efficient with negligible return reflections.
                          </p>
                        </div>
                      ) : (
                        <div className="flex gap-2 text-yellow-400">
                          <AlertTriangle className="h-5 w-5 shrink-0" />
                          <p>
                            <strong>Mismatch reflections detected:</strong> VSWR is {smithMetrics.vswr}. To match this load back to {z0} Ω:
                            <br />
                            • Insert a <strong>Quarter-Wave Transformer</strong> with characteristic impedance Z = sqrt({z0} * {zReal}) = <strong>{Math.sqrt(z0 * zReal).toFixed(1)} Ω</strong>.
                            <br />
                            • Or model a <strong>Single-Stub Tuner</strong> shunt circuit to cancel out the inductive susceptance.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: ANTENNA RADIATION & FRIIS LINK */}
        {/* ========================================== */}
        {activeTab === 'friis' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Control Panel */}
            <div className="lg:col-span-5 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Settings className="h-5 w-5 text-emerald-accent" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">
                  Link Budget Configuration
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                {/* Antenna Type Selection */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Antenna Type (Radiation Pattern)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'isotropic', label: 'Isotropic (Omni)' },
                      { id: 'dipole', label: 'Half-Wave Dipole' },
                      { id: 'patch', label: 'Microstrip Patch' },
                      { id: 'dish', label: 'Parabolic Dish' }
                    ].map((ant) => (
                      <button
                        key={ant.id}
                        type="button"
                        onClick={() => setAntennaType(ant.id as AntennaType)}
                        className={`py-2 px-3 rounded-xl border text-center font-bold tracking-wide transition-all text-[11px] ${
                          antennaType === ant.id
                            ? 'bg-emerald-accent/15 border-emerald-accent/60 text-emerald-accent'
                            : 'bg-navy-dark border-navy-light/40 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {ant.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transmit Power */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium flex justify-between">
                    <span>Tx Transmitter Power (P_t)</span>
                    <span className="text-emerald-accent font-mono font-bold">{pt} dBm</span>
                  </label>
                  <input
                    type="range"
                    min={-10}
                    max={43}
                    step={1}
                    value={pt}
                    onChange={(e) => setPt(Number(e.target.value))}
                    className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>-10 dBm</span>
                    <span>43 dBm (20W)</span>
                  </div>
                </div>

                {/* Antenna Gains */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">Tx Antenna Gain (G_t)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={gt}
                        onChange={(e) => setGt(Number(e.target.value))}
                        className="w-full bg-navy-dark border border-navy-light/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent/80 font-mono"
                      />
                      <span className="absolute right-3 top-2 text-slate-500 font-mono">dBi</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">Rx Antenna Gain (G_r)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={gr}
                        onChange={(e) => setGr(Number(e.target.value))}
                        className="w-full bg-navy-dark border border-navy-light/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent/80 font-mono"
                      />
                      <span className="absolute right-3 top-2 text-slate-500 font-mono">dBi</span>
                    </div>
                  </div>
                </div>

                {/* Carrier Frequency */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium flex justify-between">
                    <span>Carrier Frequency (f)</span>
                    <span className="text-emerald-accent font-mono font-bold">{frequency.toFixed(2)} GHz</span>
                  </label>
                  <input
                    type="range"
                    min={0.5}
                    max={12.0}
                    step={0.1}
                    value={frequency}
                    onChange={(e) => setFrequency(Number(e.target.value))}
                    className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>500 MHz (UHF)</span>
                    <span>12.0 GHz (Ku-Band)</span>
                  </div>
                </div>

                {/* Link Distance */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium flex justify-between">
                    <span>Link Range Distance (R)</span>
                    <span className="text-emerald-accent font-mono font-bold">{distance.toFixed(1)} km</span>
                  </label>
                  <input
                    type="range"
                    min={0.1}
                    max={25.0}
                    step={0.1}
                    value={distance}
                    onChange={(e) => setDistance(Number(e.target.value))}
                    className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0.1 km</span>
                    <span>25.0 km</span>
                  </div>
                </div>
              </div>

              {/* Friis path loss theory */}
              <div className="bg-navy-dark p-4 rounded-xl border border-navy-light/40 text-[10px] text-slate-400 space-y-1.5 font-mono">
                <div className="text-slate-300 font-bold uppercase tracking-wider text-[9px]">
                  Friis Physics Equation Reference
                </div>
                <p className="leading-relaxed">
                  Pr = Pt + Gt + Gr - FSPL
                </p>
                <p className="text-[9px] text-slate-500 leading-normal">
                  Where FSPL (Free Space Path Loss) is:
                  <br/>
                  FSPL (dB) = 20 log10(R_m) + 20 log10(f_Hz) + 20 log10(4*pi/c)
                </p>
              </div>
            </div>

            {/* Calculations & Charts */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex justify-end">
                <IEEEReportButton
                  experimentName="Microwave Engineering: Antenna Pattern & Friis Propagation"
                  inputData={{
                    'Transmit Power (Pt)': pt + ' dBm',
                    'TX Antenna Gain (Gt)': gt + ' dBi',
                    'RX Antenna Gain (Gr)': gr + ' dBi',
                    'Frequency (f)': frequency + ' GHz',
                    'Distance (d)': distance + ' km',
                    'Antenna Type Selection': antennaType
                  }}
                  outputData={{
                    'Free Space Path Loss (FSPL)': friisMetrics.fspl + ' dB',
                    'Received Power (Pr)': friisMetrics.pr + ' dBm',
                    'Fade Margin': margin + ' dB',
                    'Link Status': isViable ? 'VIABLE' : 'OUTAGE'
                  }}
                  chartSelectors={['#antenna-radar-chart']}
                />
              </div>

              {/* Outputs Card */}
              <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6" id="antenna-radar-chart">
                <div className="flex justify-between items-center pb-2 border-b border-navy-light/40">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                    Calculated Propagation Metrics
                  </h4>
                  <span className={`text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full border ${
                    isViable
                      ? 'bg-emerald-accent/10 border-emerald-accent/30 text-emerald-accent'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                    {isViable ? 'LINK VIABLE' : 'LINK OUTAGE'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Path Loss (FSPL)</span>
                    <span className="text-xl font-bold text-white tracking-tight mt-1 font-mono">
                      {friisMetrics.fspl} <span className="text-xs text-slate-400">dB</span>
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1 font-mono">
                      Total geometric vacuum attenuation
                    </span>
                  </div>

                  <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Rx Recv Power (Pr)</span>
                    <span className={`text-xl font-bold tracking-tight mt-1 font-mono ${
                      isViable ? 'text-emerald-accent' : 'text-red-400'
                    }`}>
                      {friisMetrics.pr} <span className="text-xs text-slate-400">dBm</span>
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1 font-mono">
                      Power incident at receiver
                    </span>
                  </div>

                  <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Fade Link Margin</span>
                    <span className={`text-xl font-bold tracking-tight mt-1 font-mono ${
                      isViable ? 'text-emerald-accent' : 'text-red-400'
                    }`}>
                      {margin >= 0 ? `+${margin}` : margin} <span className="text-xs text-slate-400">dB</span>
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1 font-mono">
                      Threshold Margin (S_rx = -85 dBm)
                    </span>
                  </div>
                </div>

                {/* Radar antenna pattern visualization & Area propagation profile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-3">
                    <span className="text-[9px] font-mono font-bold uppercase text-slate-500">
                      2D Polar Radiation Pattern
                    </span>
                    <div className="h-[220px] w-full font-mono text-[9px] flex items-center justify-center bg-navy-dark/40 border border-navy-light/60 rounded-xl p-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radiationPatternData}>
                          <PolarGrid stroke="#334155" />
                          <PolarAngleAxis dataKey="angle" stroke="#94a3b8" />
                          <PolarRadiusAxis angle={45} domain={[0, 1.0]} stroke="#475569" />
                          <Radar name="Normalized Gain" dataKey="gain" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[9px] font-mono font-bold uppercase text-slate-500">
                      Propagation Margin Profile
                    </span>
                    <div className="h-[220px] w-full font-mono text-[9px] bg-navy-dark/40 border border-navy-light/60 rounded-xl p-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={linkProfileData}
                          margin={{ top: 10, right: 10, left: -25, bottom: -5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="distKm" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" domain={[-120, 20]} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                          <Area
                            type="monotone"
                            dataKey="Received Power"
                            stroke="#10b981"
                            fill="rgba(16, 185, 129, 0.08)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 3: S-PARAMETER MATRIX ANALYZER */}
        {/* ========================================== */}
        {activeTab === 'sparams' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Inputs Controls */}
            <div className="lg:col-span-6 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-navy-light/60">
                <div className="flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-emerald-accent" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">
                    Multi-Port S-Parameters
                  </h3>
                </div>
                {/* Size toggle */}
                <div className="flex bg-navy-dark border border-navy-light/60 rounded-xl p-1">
                  {[2, 3].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setMatrixSize(sz as MatrixSize)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold tracking-wide transition-all ${
                        matrixSize === sz
                          ? 'bg-emerald-accent text-navy-dark'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sz}x{sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Complex S-parameter matrix grid */}
              <div className="space-y-4 text-xs text-left">
                <span className="font-bold text-slate-300 block uppercase font-mono tracking-wider text-[10px]">
                  Scattering Matrix Entry (S_ij = Mag ∠ Phase)
                </span>

                <div className={`grid gap-4 ${matrixSize === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {Array.from({ length: matrixSize }).map((_, rIdx) => (
                    Array.from({ length: matrixSize }).map((_, cIdx) => (
                      <div
                        key={`cell-${rIdx}-${cIdx}`}
                        className="bg-navy-dark border border-navy-light/40 p-3 rounded-xl space-y-2 relative"
                      >
                        <div className="absolute top-1 right-2 text-[9px] font-mono text-slate-500 font-bold">
                          S{rIdx + 1}{cIdx + 1}
                        </div>

                        {/* Mag Input */}
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 font-mono">Magnitude (|S|)</label>
                          <input
                            type="number"
                            min={0}
                            max={1}
                            step={0.01}
                            value={sMatrix[rIdx][cIdx].mag}
                            onChange={(e) => updateCell(rIdx, cIdx, 'mag', parseFloat(e.target.value) || 0)}
                            className="w-full bg-navy-card border border-navy-light/60 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-accent font-mono"
                          />
                        </div>

                        {/* Phase Input */}
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 font-mono">Phase (∠°)</label>
                          <input
                            type="number"
                            min={-180}
                            max={360}
                            step={1}
                            value={sMatrix[rIdx][cIdx].phase}
                            onChange={(e) => updateCell(rIdx, cIdx, 'phase', parseFloat(e.target.value) || 0)}
                            className="w-full bg-navy-card border border-navy-light/60 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-accent font-mono"
                          />
                        </div>
                      </div>
                    ))
                  ))}
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="pt-4 border-t border-navy-light/30 space-y-2 text-left">
                <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">
                  Load Standard Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMatrixSize(2);
                      // 3dB attenuator (Reciprocal, Lossy)
                      updateCell(0, 0, 'mag', 0.05); updateCell(0, 0, 'phase', 0);
                      updateCell(0, 1, 'mag', 0.707); updateCell(0, 1, 'phase', -90);
                      updateCell(1, 0, 'mag', 0.707); updateCell(1, 0, 'phase', -90);
                      updateCell(1, 1, 'mag', 0.05); updateCell(1, 1, 'phase', 0);
                    }}
                    className="bg-navy-dark hover:bg-navy-light/35 border border-navy-light/60 text-slate-300 font-mono text-[9px] px-2.5 py-1.5 rounded-lg"
                  >
                    3dB Attenuator (2x2)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMatrixSize(2);
                      // Ideal Match Isolator (Non-reciprocal, lossy)
                      updateCell(0, 0, 'mag', 0.0); updateCell(0, 0, 'phase', 0);
                      updateCell(0, 1, 'mag', 0.0); updateCell(0, 1, 'phase', 0);
                      updateCell(1, 0, 'mag', 1.0); updateCell(1, 0, 'phase', -180);
                      updateCell(1, 1, 'mag', 0.0); updateCell(1, 1, 'phase', 0);
                    }}
                    className="bg-navy-dark hover:bg-navy-light/35 border border-navy-light/60 text-slate-300 font-mono text-[9px] px-2.5 py-1.5 rounded-lg"
                  >
                    Isolator (2x2)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMatrixSize(3);
                      // Wilkinson Power Divider (Reciprocal, Lossless ports, isolated)
                      // Row 0
                      updateCell(0, 0, 'mag', 0.0); updateCell(0, 0, 'phase', 0);
                      updateCell(0, 1, 'mag', 0.707); updateCell(0, 1, 'phase', -90);
                      updateCell(0, 2, 'mag', 0.707); updateCell(0, 2, 'phase', -90);
                      // Row 1
                      updateCell(1, 0, 'mag', 0.707); updateCell(1, 0, 'phase', -90);
                      updateCell(1, 1, 'mag', 0.0); updateCell(1, 1, 'phase', 0);
                      updateCell(1, 2, 'mag', 0.0); updateCell(1, 2, 'phase', 0);
                      // Row 2
                      updateCell(2, 0, 'mag', 0.707); updateCell(2, 0, 'phase', -90);
                      updateCell(2, 1, 'mag', 0.0); updateCell(2, 1, 'phase', 0);
                      updateCell(2, 2, 'mag', 0.0); updateCell(2, 2, 'phase', 0);
                    }}
                    className="bg-navy-dark hover:bg-navy-light/35 border border-navy-light/60 text-slate-300 font-mono text-[9px] px-2.5 py-1.5 rounded-lg"
                  >
                    Wilkinson Splitter (3x3)
                  </button>
                </div>
              </div>
            </div>

            {/* Calculations & Properties on the Right */}
            <div className="lg:col-span-6 space-y-6">
              <div className="flex justify-end">
                <IEEEReportButton
                  experimentName="Microwave Engineering: Scattering Parameter Matrix"
                  inputData={{
                    'Matrix Dimension': `${matrixSize} x ${matrixSize}`,
                    'S11 mag/phase': `${sMatrix[0][0].mag} ∠ ${sMatrix[0][0].phase}°`,
                    'S12 mag/phase': `${sMatrix[0][1].mag} ∠ ${sMatrix[0][1].phase}°`,
                    'S21 mag/phase': `${sMatrix[1][0].mag} ∠ ${sMatrix[1][0].phase}°`,
                    'S22 mag/phase': `${sMatrix[1][1].mag} ∠ ${sMatrix[1][1].phase}°`
                  }}
                  outputData={{
                    'Return Loss S11 (dB)': sMetrics.returnLoss + ' dB',
                    'Insertion Loss S21 (dB)': sMetrics.insertionLoss + ' dB',
                    'Isolation S12 (dB)': sMetrics.isolationS12 + ' dB',
                    'Reciprocal System Status': sMetrics.isReciprocal ? 'YES' : 'NO',
                    'Lossless System Status': sMetrics.isLossless ? 'YES' : 'NO'
                  }}
                  chartSelectors={['#sparams-analyzer-pane']}
                />
              </div>

              {/* S-parameter Output Card */}
              <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6" id="sparams-analyzer-pane">
                <div className="flex justify-between items-center pb-2 border-b border-navy-light/40">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                    Scattering Properties & Metrics
                  </h4>
                  <div className="flex gap-2">
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-1 rounded border ${
                      sMetrics.isReciprocal
                        ? 'bg-emerald-accent/10 border-emerald-accent/30 text-emerald-accent'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                      {sMetrics.isReciprocal ? 'Reciprocal' : 'Non-Reciprocal'}
                    </span>
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-1 rounded border ${
                      sMetrics.isLossless
                        ? 'bg-emerald-accent/10 border-emerald-accent/30 text-emerald-accent'
                        : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                    }`}>
                      {sMetrics.isLossless ? 'Lossless' : 'Lossy'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Port 1 Return Loss</span>
                    <span className="text-xl font-bold text-white tracking-tight mt-1 font-mono">
                      {sMetrics.returnLoss} <span className="text-xs text-slate-400">dB</span>
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1 font-mono">
                      -20 * log10(|S11|)
                    </span>
                  </div>

                  <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Insertion Loss (IL)</span>
                    <span className="text-xl font-bold text-emerald-accent tracking-tight mt-1 font-mono">
                      {sMetrics.insertionLoss} <span className="text-xs text-slate-400">dB</span>
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1 font-mono">
                      -20 * log10(|S21|)
                    </span>
                  </div>

                  <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Port Isolation</span>
                    <span className="text-xl font-bold text-emerald-accent tracking-tight mt-1 font-mono">
                      {matrixSize === 3 ? sMetrics.isolationS31 : sMetrics.isolationS12} <span className="text-xs text-slate-400">dB</span>
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1 font-mono">
                      {matrixSize === 3 ? '-20 * log10(|S31|)' : '-20 * log10(|S12|)'}
                    </span>
                  </div>
                </div>

                {/* S-parameter properties description explanation */}
                <div className="bg-navy-dark/60 border border-navy-light/40 p-5 rounded-xl space-y-4 font-sans text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">
                    Scattering Properties Proofs
                  </span>

                  <div className="space-y-3 text-slate-300">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded bg-emerald-accent/10 text-emerald-accent mt-0.5">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold font-mono text-[11px] block">Reciprocity Property:</span>
                        <p className="text-slate-400 mt-0.5 text-[11px] leading-relaxed">
                          A microwave device is <strong>Reciprocal</strong> if electromagnetic transmissions behave identically regardless of port directions (i.e. $S_{12} = S_{21}$). Passive multi-port structures like cables, attenuators, and couplers are reciprocal, whereas active amplifiers and magnetic circulators are non-reciprocal.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 border-t border-navy-light/20 pt-3">
                      <div className="p-1 rounded bg-emerald-accent/10 text-emerald-accent mt-0.5">
                        <Cpu className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold font-mono text-[11px] block">Lossless (Unitary) Property:</span>
                        <p className="text-slate-400 mt-0.5 text-[11px] leading-relaxed">
                          A microwave network is <strong>Lossless</strong> if total power is perfectly conserved within the ports without resistive heat dissipation (i.e. the S-parameter matrix is unitary: $S^\dagger S = I$). This requires each column to have a squared-magnitude sum of 1.0, and columns to be mutually orthogonal.
                        </p>
                      </div>
                    </div>
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
