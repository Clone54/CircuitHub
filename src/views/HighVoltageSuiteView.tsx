import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Settings,
  Zap,
  TrendingUp,
  Activity,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  Flame,
  FileText
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
  ReferenceDot,
  Legend,
  AreaChart,
  Area
} from 'recharts';

import { usePaschenLaw, GAS_CONSTANTS, GasType } from '../hooks/usePaschenLaw';
import { useImpulseWave } from '../hooks/useImpulseWave';
import { useInsulationCoord } from '../hooks/useInsulationCoord';

type TabId = 'paschen' | 'marx' | 'coordination';

export default function HighVoltageSuiteView() {
  const [activeTab, setActiveTab] = useState<TabId>('paschen');

  // =========================================================
  // Hooks Integration
  // =========================================================
  const {
    gasType,
    setGasType,
    pressure,
    setPressure,
    distance,
    setDistance,
    gamma,
    setGamma,
    paschenResults
  } = usePaschenLaw();

  const {
    stages,
    setStages,
    v0,
    setV0,
    C1,
    setC1,
    C2,
    setC2,
    R1,
    setR1,
    R2,
    setR2,
    impulseResult
  } = useImpulseWave();

  const {
    bil,
    setBil,
    arresterLevel,
    setArresterLevel,
    surgeVoltage,
    setSurgeVoltage,
    coordinationResult
  } = useInsulationCoord();

  // Custom tooltips for graphs
  const PaschenTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-navy-dark border border-navy-light/60 p-3 rounded-xl text-xs font-mono space-y-1 text-left">
          <p className="text-emerald-accent font-bold">Gas State Point</p>
          <p className="text-white">pd Product: <span className="font-bold">{data.pd} Torr·cm</span></p>
          <p className="text-white">Breakdown V_b: <span className="font-bold text-amber-400">{data.vb} V</span></p>
        </div>
      );
    }
    return null;
  };

  const ImpulseTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-navy-dark border border-navy-light/60 p-3 rounded-xl text-xs font-mono space-y-1 text-left">
          <p className="text-emerald-accent font-bold">Time Point</p>
          <p className="text-white">Time (t): <span className="font-bold">{data.timeUs} μs</span></p>
          <p className="text-white">Voltage: <span className="font-bold text-emerald-accent">{data.voltageKv} kV</span></p>
        </div>
      );
    }
    return null;
  };

  const VtTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-navy-dark border border-navy-light/60 p-3 rounded-xl text-xs font-mono space-y-1 text-left">
          <p className="text-emerald-accent font-bold">Volt-Time Intersection</p>
          <p className="text-white">Time (t): <span className="font-bold">{data.timeUs} μs</span></p>
          <p className="text-amber-400">Insulation BIL Withstand: <span className="font-bold">{data.equipmentWithstandKv} kV</span></p>
          <p className="text-emerald-accent">Arrester Protection Level: <span className="font-bold">{data.arresterProtectionKv} kV</span></p>
          <p className="text-slate-300 font-semibold border-t border-navy-light/40 mt-1 pt-1">
            Safety Margin Gap: <span className="text-green-400 font-bold">{data.marginKv} kV</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Generate Report Data based on Active Tab
  const reportData = useMemo(() => {
    if (activeTab === 'paschen') {
      return {
        experimentName: 'Gas Dielectric Strength & Paschen Breakdown',
        inputData: {
          'Gas Under Test': GAS_CONSTANTS[gasType].name,
          'Empirical Constant A (Torr⁻¹cm⁻¹)': GAS_CONSTANTS[gasType].A,
          'Empirical Constant B (V·Torr⁻¹cm⁻¹)': GAS_CONSTANTS[gasType].B,
          'Pressure (p)': `${pressure} Torr`,
          'Gap Distance (d)': `${distance} cm`,
          'Secondary Ionization Coeff (γ)': gamma,
          'pd Product': `${paschenResults.userPd} Torr·cm`
        },
        outputData: {
          'Calculated Breakdown Voltage (V_b)': paschenResults.userVb ? `${paschenResults.userVb} V` : 'Invalid / Field is too small for avalanche',
          'Minimum pd Product (pd_min)': `${paschenResults.pdMin} Torr·cm`,
          'Minimum Breakdown Voltage (V_b,min)': `${paschenResults.vbMin} V`,
          'Status': paschenResults.isValid ? 'Breakdown point safely simulated' : 'Point is within non-avalanche region'
        }
      };
    } else if (activeTab === 'marx') {
      return {
        experimentName: 'Marx Impulse Generator & Wave Shaping Analysis',
        inputData: {
          'Generator Stages (n)': stages,
          'Charging Voltage V₀ (per stage)': `${v0} kV`,
          'Theoretical V_total': `${vTotal => stages * v0} kV`,
          'Generator Capacitance (C1)': `${C1} nF`,
          'Load Capacitance (C2)': `${C2} nF`,
          'Front Resistor (R1)': `${R1} Ω`,
          'Tail Resistor (R2)': `${R2} Ω`
        },
        outputData: {
          'Waveform Alpha (Decay)': `${impulseResult.alpha} s⁻¹`,
          'Waveform Beta (Rise)': `${impulseResult.beta} s⁻¹`,
          'Peak Output Voltage (V_peak)': `${impulseResult.vPeak} kV`,
          'Voltage Efficiency (%)': `${impulseResult.efficiency}%`,
          'Calculated Front Time (T₁)': `${impulseResult.tFrontUs} μs`,
          'Calculated Tail Time (T₂)': `${impulseResult.tTailUs} μs`,
          'IEC 1.2/50 Compliance': impulseResult.isStandard12_50 ? 'Compliant' : 'Non-Compliant'
        }
      };
    } else {
      return {
        experimentName: 'Insulation Coordination & Substation BIL Safety Assessment',
        inputData: {
          'Equipment BIL Withstand': `${bil} kV`,
          'Arrester Protective Level': `${arresterLevel} kV`,
          'Expected System Surge Voltage': `${surgeVoltage} kV`
        },
        outputData: {
          'Calculated Protective Margin': `${coordinationResult.protectiveMargin}%`,
          'Margin Status': coordinationResult.isMarginLow ? 'UNSAFE (Margin < 20%)' : 'SAFE (Margin >= 20%)',
          'Equipment Dielectric Survival': coordinationResult.isEquipmentSafe ? 'Equipment fully protected' : 'Arrester clamping voltage exceeds equipment BIL!'
        }
      };
    }
  }, [
    activeTab, gasType, pressure, distance, gamma, paschenResults,
    stages, v0, C1, C2, R1, R2, impulseResult,
    bil, arresterLevel, surgeVoltage, coordinationResult
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-h-screen text-slate-100">
      {/* Back button & Academic Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO CATALOG
        </Link>
        <span className="text-[10px] font-mono text-emerald-accent/80 tracking-widest uppercase bg-emerald-accent/5 border border-emerald-accent/20 px-3 py-1 rounded-md">
          4th Year Odd Semester / EEE 4143
        </span>
      </div>

      {/* Hero Title Section */}
      <div className="bg-gradient-to-r from-navy-card/90 via-navy-light/40 to-navy-card border border-navy-light/60 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-accent/10 border border-emerald-accent/30 text-xs font-bold text-emerald-accent uppercase tracking-wider">
            <Sparkles className="h-4 w-4 text-emerald-accent" /> High Voltage Lab
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-black tracking-tight text-white">
            High Voltage Engineering <span className="text-emerald-accent">Suite</span>
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            Analyze key phenomena of EEE 4143. Simulate gas dielectric breakdown curves using Paschen's Law, model multi-stage Marx Impulse generators for standard 1.2/50 μs waveforms, and structure substation insulation coordination profiles against steep impulse surges.
          </p>
          <div className="pt-2 flex flex-wrap gap-4 items-center">
            <IEEEReportButton
              experimentName={reportData.experimentName}
              inputData={reportData.inputData}
              outputData={reportData.outputData}
              chartSelectors={['#active-chart-container']}
            />
          </div>
        </div>
        {/* Decorative background grid */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none"></div>
      </div>

      {/* Tab Switcher */}
      <div className="flex flex-wrap gap-2 border-b border-navy-light/40 pb-1">
        {[
          { id: 'paschen', label: "Paschen's Gas Breakdown", icon: Flame },
          { id: 'marx', label: 'Marx Impulse Generator', icon: Activity },
          { id: 'coordination', label: 'Insulation Coordination (BIL)', icon: ShieldCheck }
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
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Tab Viewport */}
      <div className="animate-fadeIn">

        {/* ========================================================= */}
        {/* TAB 1: PASCHEN'S GAS BREAKDOWN SIMULATOR */}
        {/* ========================================================= */}
        {activeTab === 'paschen' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Input Panel */}
            <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Settings className="h-5 w-5 text-emerald-accent" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">
                  Gas & Gap Parameters
                </h3>
              </div>

              {/* Gas Type Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Gas Insulation Type</label>
                <select
                  value={gasType}
                  onChange={(e) => setGasType(e.target.value as GasType)}
                  className="w-full bg-navy-dark border border-navy-light/80 text-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-accent"
                >
                  <option value="air">Air (Standard Dielectric)</option>
                  <option value="nitrogen">Nitrogen (N₂ Blanket)</option>
                  <option value="sf6">SF₆ (Electronegative Arc Quencher)</option>
                </select>
                <p className="text-[10px] text-slate-500 leading-normal pt-1 italic font-mono">
                  {GAS_CONSTANTS[gasType].description}
                </p>
              </div>

              {/* Pressure Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-slate-400">Gas Pressure (p)</span>
                  <span className="font-mono text-emerald-accent font-bold">{pressure} Torr</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={1000}
                  step={5}
                  value={pressure}
                  onChange={(e) => setPressure(parseInt(e.target.value))}
                  className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1 Torr (Vacuum)</span>
                  <span>760 Torr (1 atm)</span>
                  <span>1000 Torr</span>
                </div>
              </div>

              {/* Distance Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-slate-400">Gap Distance (d)</span>
                  <span className="font-mono text-emerald-accent font-bold">{distance} cm</span>
                </div>
                <input
                  type="range"
                  min={0.01}
                  max={2.00}
                  step={0.01}
                  value={distance}
                  onChange={(e) => setDistance(parseFloat(e.target.value))}
                  className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.1 mm (0.01 cm)</span>
                  <span>10 mm (1.0 cm)</span>
                  <span>20 mm (2.0 cm)</span>
                </div>
              </div>

              {/* Gamma (Secondary Ionization Coefficient) */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-slate-400">Sec. Ionization Coeff (γ)</span>
                  <span className="font-mono text-emerald-accent font-bold">{gamma}</span>
                </div>
                <input
                  type="range"
                  min={0.001}
                  max={0.05}
                  step={0.001}
                  value={gamma}
                  onChange={(e) => setGamma(parseFloat(e.target.value))}
                  className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.001 (Highly Attached)</span>
                  <span>0.05 (Easier Spark)</span>
                </div>
              </div>

              {/* Analytical Formulas Card */}
              <div className="bg-navy-dark/60 border border-navy-light/30 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-1 text-slate-300 font-bold text-xs font-mono uppercase">
                  <Info className="h-4 w-4 text-emerald-accent" /> Formulation Notes
                </div>
                <p className="text-[11px] text-slate-400 leading-normal leading-relaxed">
                  Paschen's equation models the breakdown voltage <span className="font-mono text-white">V_b</span> under uniform fields as:
                </p>
                <div className="bg-navy-dark/80 p-2.5 rounded-lg border border-navy-light/40 text-center font-mono text-xs text-amber-400">
                  V_b = B·pd / [ln(A·pd) - K]<br/>
                  <span className="text-[9px] text-slate-500">where K = ln(ln(1 + 1/γ))</span>
                </div>
              </div>
            </div>

            {/* Output & Visualization Panel */}
            <div className="lg:col-span-8 space-y-6">
              {/* Numerical Metrics Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-navy-card border border-navy-light/60 p-4 rounded-xl text-left space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Current pd State</span>
                  <p className="text-xl font-bold text-white font-mono">
                    {paschenResults.userPd} <span className="text-xs text-slate-400">Torr·cm</span>
                  </p>
                </div>
                <div className="bg-navy-card border border-navy-light/60 p-4 rounded-xl text-left space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Breakdown Voltage (V_b)</span>
                  <p className="text-xl font-bold text-amber-400 font-mono">
                    {paschenResults.isValid ? `${paschenResults.userVb} V` : '∞ (No Spark)'}
                  </p>
                </div>
                <div className="bg-navy-card border border-navy-light/60 p-4 rounded-xl text-left space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Minimal Dielectric Point</span>
                  <p className="text-xl font-bold text-emerald-accent font-mono">
                    {paschenResults.vbMin} <span className="text-xs text-emerald-accent">V</span>
                  </p>
                  <p className="text-[9px] text-slate-500 font-mono">at {paschenResults.pdMin} Torr·cm</p>
                </div>
              </div>

              {/* Chart Card */}
              <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">
                      Paschen Breakdown Curve (U-Shape)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Breakdown voltage V_b (V) versus the product of pressure and gap distance pd (Torr·cm)
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-accent"></span>
                      <span className="text-slate-300">Your State</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                      <span className="text-slate-300">Paschen Min</span>
                    </div>
                  </div>
                </div>

                <div id="active-chart-container" className="h-[360px] w-full bg-navy-dark/40 rounded-xl border border-navy-light/30 p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={paschenResults.points} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                      <XAxis
                        dataKey="pd"
                        type="number"
                        domain={['auto', 'auto']}
                        stroke="#94a3b8"
                        fontSize={11}
                        fontFamily="monospace"
                        tickFormatter={(v) => `${v}`}
                        label={{ value: 'Pressure × Distance (p·d) [Torr·cm]', position: 'bottom', offset: 5, fill: '#94a3b8', fontSize: 11 }}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        fontFamily="monospace"
                        label={{ value: 'Breakdown Voltage (V_b) [Volts]', angle: -90, position: 'insideLeft', offset: 10, fill: '#94a3b8', fontSize: 11 }}
                      />
                      <Tooltip content={<PaschenTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="vb"
                        stroke="#38bdf8"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      {/* Highlight user state on the curve */}
                      {paschenResults.isValid && (
                        <ReferenceDot
                          x={paschenResults.userPd}
                          y={paschenResults.userVb || 0}
                          r={7}
                          fill="#10b981"
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      )}
                      {/* Highlight minimum voltage coordinate */}
                      <ReferenceDot
                        x={paschenResults.pdMin}
                        y={paschenResults.vbMin}
                        r={6}
                        fill="#f59e0b"
                        stroke="#ffffff"
                        strokeWidth={1.5}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-start gap-2.5 bg-navy-dark/40 border border-navy-light/20 p-4 rounded-xl text-xs text-slate-300 leading-normal">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-400">Academic Insight:</strong> Notice the classical asymmetric U-shape. To the left of the minimum, the gas is highly evacuated; fewer gas molecules are present, so electrons travel farther without colliding (high mean free path). Higher voltages are needed to spark the discharge. To the right of the minimum, density is so high that electrons experience frequent non-ionizing collisions, losing kinetic energy before causing an avalanche, also raising the necessary breakdown voltage.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: MARX GENERATOR & IMPULSE WAVEFORM PLOTTER */}
        {/* ========================================================= */}
        {activeTab === 'marx' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Controls Panel */}
            <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Settings className="h-5 w-5 text-emerald-accent" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">
                  Marx Generator Specs
                </h3>
              </div>

              {/* Number of stages & charging voltage */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Stages (n)</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={stages}
                    onChange={(e) => setStages(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-navy-dark border border-navy-light/80 text-white rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-emerald-accent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Charging V₀</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={120}
                      step={0.5}
                      value={v0}
                      onChange={(e) => setV0(Math.max(0.1, parseFloat(e.target.value) || 0))}
                      className="w-full bg-navy-dark border border-navy-light/80 text-white rounded-xl pl-3 pr-8 py-2 text-xs font-mono font-bold focus:outline-none focus:border-emerald-accent"
                    />
                    <span className="absolute right-3 top-2 text-[10px] text-slate-500 font-mono font-bold">kV</span>
                  </div>
                </div>
              </div>

              {/* Capacitances */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Gen Cap C₁</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={5}
                      max={2000}
                      value={C1}
                      onChange={(e) => setC1(Math.max(1, parseFloat(e.target.value) || 1))}
                      className="w-full bg-navy-dark border border-navy-light/80 text-white rounded-xl pl-3 pr-8 py-2 text-xs font-mono font-bold focus:outline-none focus:border-emerald-accent"
                    />
                    <span className="absolute right-3 top-2 text-[10px] text-slate-500 font-mono">nF</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Load Cap C₂</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0.1}
                      max={500}
                      step={0.1}
                      value={C2}
                      onChange={(e) => setC2(Math.max(0.01, parseFloat(e.target.value) || 0.1))}
                      className="w-full bg-navy-dark border border-navy-light/80 text-white rounded-xl pl-3 pr-8 py-2 text-xs font-mono font-bold focus:outline-none focus:border-emerald-accent"
                    />
                    <span className="absolute right-3 top-2 text-[10px] text-slate-500 font-mono">nF</span>
                  </div>
                </div>
              </div>

              {/* Resistances */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-slate-400">Front Resistor R₁</span>
                    <span className="font-mono text-emerald-accent font-bold">{R1} Ω</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={1200}
                    step={5}
                    value={R1}
                    onChange={(e) => setR1(parseInt(e.target.value))}
                    className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>10 Ω</span>
                    <span>1200 Ω</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-slate-400">Tail Resistor R₂</span>
                    <span className="font-mono text-emerald-accent font-bold">{R2} Ω</span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={8000}
                    step={50}
                    value={R2}
                    onChange={(e) => setR2(parseInt(e.target.value))}
                    className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>100 Ω</span>
                    <span>8000 Ω</span>
                  </div>
                </div>
              </div>

              {/* Standard Tuning Guide */}
              <div className="bg-navy-dark/60 border border-navy-light/30 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-accent font-bold font-mono uppercase text-[10px]">
                  <Sliders className="h-4 w-4" /> Tuning QuickPresets
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Adjust components to tune the wave to the standard <strong className="text-white">1.2 / 50 μs</strong> waveform.
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <button
                    onClick={() => {
                      setStages(4);
                      setV0(25);
                      setC1(200);
                      setC2(4);
                      setR1(160);
                      setR2(1800);
                    }}
                    className="bg-navy-dark hover:bg-navy-light/40 border border-navy-light/50 text-slate-300 py-1.5 rounded-lg font-mono"
                  >
                    Preset A (1.2/50 μs)
                  </button>
                  <button
                    onClick={() => {
                      setStages(6);
                      setV0(20);
                      setC1(400);
                      setC2(8);
                      setR1(110);
                      setR2(1500);
                    }}
                    className="bg-navy-dark hover:bg-navy-light/40 border border-navy-light/50 text-slate-300 py-1.5 rounded-lg font-mono"
                  >
                    Preset B (1.2/50 μs)
                  </button>
                </div>
              </div>
            </div>

            {/* Right Output Panel */}
            <div className="lg:col-span-8 space-y-6">
              {/* Performance Indicator Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-navy-card border border-navy-light/60 p-4 rounded-xl text-left space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Charged</span>
                  <p className="text-lg font-bold text-white font-mono">
                    {stages * v0} <span className="text-xs text-slate-400">kV</span>
                  </p>
                  <p className="text-[9px] text-slate-500 font-mono">n × V₀</p>
                </div>
                <div className="bg-navy-card border border-navy-light/60 p-4 rounded-xl text-left space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Impulse Peak V_peak</span>
                  <p className="text-lg font-bold text-emerald-accent font-mono">
                    {impulseResult.vPeak} <span className="text-xs text-emerald-accent">kV</span>
                  </p>
                  <p className="text-[9px] text-slate-500 font-mono">Efficiency: {impulseResult.efficiency}%</p>
                </div>
                <div className="bg-navy-card border border-navy-light/60 p-4 rounded-xl text-left space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Front Time (T₁)</span>
                  <p className="text-lg font-bold text-white font-mono">
                    {impulseResult.tFrontUs} <span className="text-xs text-slate-400">μs</span>
                  </p>
                  <p className="text-[9px] text-slate-500 font-mono">Target: 1.2 μs ± 30%</p>
                </div>
                <div className="bg-navy-card border border-navy-light/60 p-4 rounded-xl text-left space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tail Time (T₂)</span>
                  <p className="text-lg font-bold text-white font-mono">
                    {impulseResult.tTailUs} <span className="text-xs text-slate-400">μs</span>
                  </p>
                  <p className="text-[9px] text-slate-500 font-mono">Target: 50 μs ± 20%</p>
                </div>
              </div>

              {/* Status Compliance Bar */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                impulseResult.isStandard12_50 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
              }`}>
                <div className="flex items-center gap-3">
                  {impulseResult.isStandard12_50 ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-yellow-400 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider font-mono">
                      {impulseResult.isStandard12_50 ? 'Standard 1.2/50 μs Lightning Waveform Achieved!' : 'Non-Standard Impulse Waveform'}
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      {impulseResult.isStandard12_50 
                        ? 'Your circuit parameters perfectly match the standard lightning test requirements defined by IEC 60060-1.'
                        : 'Adjust Front Resistor (R₁) to control T₁ rise, and Tail Resistor (R₂) to stretch T₂ decay.'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono shrink-0 uppercase bg-black/20 px-3 py-1 rounded-md">
                  T₁/T₂ = {impulseResult.tFrontUs} / {impulseResult.tTailUs} μs
                </span>
              </div>

              {/* Impulse Waveform Plotter */}
              <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">
                      Double Exponential Impulse Discharge Curve
                    </h3>
                    <p className="text-xs text-slate-400">
                      Voltage transient (kV) from 0 to 100 microseconds
                    </p>
                  </div>
                </div>

                <div id="active-chart-container" className="h-[320px] w-full bg-navy-dark/40 rounded-xl border border-navy-light/30 p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={impulseResult.points} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="impulseGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
                      <XAxis
                        dataKey="timeUs"
                        stroke="#94a3b8"
                        fontSize={11}
                        fontFamily="monospace"
                        label={{ value: 'Time (t) [μs]', position: 'bottom', offset: -2, fill: '#94a3b8', fontSize: 11 }}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        fontFamily="monospace"
                        label={{ value: 'Transient Output [kV]', angle: -90, position: 'insideLeft', offset: 12, fill: '#94a3b8', fontSize: 11 }}
                      />
                      <Tooltip content={<ImpulseTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="voltageKv"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#impulseGrad)"
                      />
                      {/* Critical IEC Reference Lines */}
                      <ReferenceLine x={1.2} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '1.2 μs (Peak)', fill: '#f59e0b', fontSize: 10, position: 'top' }} />
                      <ReferenceLine x={50.0} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '50 μs (Tail)', fill: '#ef4444', fontSize: 10, position: 'top' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-navy-dark/40 p-4 rounded-xl space-y-2 text-xs font-mono border border-navy-light/20 text-slate-300">
                  <div className="flex items-center gap-1 text-emerald-accent font-bold uppercase text-[10px]">
                    <Info className="h-4 w-4" /> Mathematical Core
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-normal">
                    The wave conforms to the dual decay function: <span className="text-white font-mono">v(t) = V_peak * (exp(-α·t) - exp(-β·t))</span> where:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-300 text-[11px] font-sans">
                    <li><strong className="text-white font-mono">α (Decay Constant):</strong> {impulseResult.alpha} rad/s — governs the slow discharge of capacitor storage through the tail resistor R₂.</li>
                    <li><strong className="text-white font-mono">β (Rise Constant):</strong> {impulseResult.beta} rad/s — governs the extremely rapid initial charge redistribution through front resistor R₁.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: INSULATION COORDINATION & BIL VISUALIZER */}
        {/* ========================================================= */}
        {activeTab === 'coordination' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Input Controls */}
            <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Settings className="h-5 w-5 text-emerald-accent" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">
                  Insulation Parameters
                </h3>
              </div>

              {/* Equipment BIL */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-slate-400">Equipment BIL Withstand</span>
                  <span className="font-mono text-emerald-accent font-bold">{bil} kV</span>
                </div>
                <input
                  type="range"
                  min={200}
                  max={1200}
                  step={25}
                  value={bil}
                  onChange={(e) => setBil(parseInt(e.target.value))}
                  className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>200 kV (Distribution)</span>
                  <span>1200 kV (Extra-HV)</span>
                </div>
              </div>

              {/* Arrester Protective Level */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-slate-400">Arrester Protective Level</span>
                  <span className="font-mono text-emerald-accent font-bold">{arresterLevel} kV</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={1000}
                  step={10}
                  value={arresterLevel}
                  onChange={(e) => setArresterLevel(parseInt(e.target.value))}
                  className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>100 kV</span>
                  <span>1000 kV</span>
                </div>
              </div>

              {/* Surge Voltage Magnitude */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-slate-400">Expected Lightning Surge</span>
                  <span className="font-mono text-emerald-accent font-bold">{surgeVoltage} kV</span>
                </div>
                <input
                  type="range"
                  min={300}
                  max={1500}
                  step={50}
                  value={surgeVoltage}
                  onChange={(e) => setSurgeVoltage(parseInt(e.target.value))}
                  className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>300 kV</span>
                  <span>1500 kV</span>
                </div>
              </div>

              {/* Substation Standards */}
              <div className="bg-navy-dark/60 border border-navy-light/30 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 text-slate-300 font-bold text-xs uppercase font-mono">
                  <Info className="h-4.5 w-4.5 text-emerald-accent" /> IEC 60071-1 Rules
                </div>
                <p className="text-[11px] text-slate-400 leading-normal leading-relaxed">
                  Basic Insulation Level (BIL) defines the lightning impulse withstand of substation transformers and bushings.
                </p>
                <div className="text-[10px] text-slate-300 font-mono space-y-1 bg-navy-dark/80 p-2 rounded-lg">
                  <div className="flex justify-between border-b border-navy-light/30 pb-1">
                    <span>Min Recommended Margin:</span>
                    <span className="text-emerald-accent font-bold">≥ 20.0%</span>
                  </div>
                  <div className="flex justify-between pt-1 text-[9px] text-slate-400">
                    <span>Formula:</span>
                    <span>((BIL - Level) / Level) × 100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Viewport Visualizations */}
            <div className="lg:col-span-8 space-y-6">
              {/* Coordination Calculations metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-navy-card border border-navy-light/60 p-4 rounded-xl text-left space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Protective Margin</span>
                  <p className={`text-xl font-bold font-mono ${
                    coordinationResult.isMarginLow ? 'text-red-400' : 'text-emerald-accent'
                  }`}>
                    {coordinationResult.protectiveMargin}%
                  </p>
                  <p className="text-[9px] text-slate-500 font-mono">Standard Target &gt; 20%</p>
                </div>
                <div className="bg-navy-card border border-navy-light/60 p-4 rounded-xl text-left space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Equipment Integrity</span>
                  <p className={`text-lg font-bold font-mono ${
                    coordinationResult.isEquipmentSafe ? 'text-green-400' : 'text-red-500'
                  }`}>
                    {coordinationResult.isEquipmentSafe ? '● SECURE' : '● EXPOSED TO FLASH'}
                  </p>
                  <p className="text-[9px] text-slate-500 font-mono">Withstand &gt; Clamp voltage</p>
                </div>
                <div className="bg-navy-card border border-navy-light/60 p-4 rounded-xl text-left space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Arrester Protective Ratio</span>
                  <p className="text-xl font-bold text-white font-mono">
                    {arresterLevel > 0 ? (bil / arresterLevel).toFixed(2) : '0.00'}
                  </p>
                  <p className="text-[9px] text-slate-500 font-mono">BIL / Arrester Level</p>
                </div>
              </div>

              {/* Warnings and critical Alerts */}
              {coordinationResult.isMarginLow ? (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-start gap-3 text-red-400">
                  <AlertTriangle className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider font-mono">
                      Critical Coordination Warning!
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      The protective margin between your Equipment BIL and the Arrester Protective Level is only <strong>{coordinationResult.protectiveMargin}%</strong>, which is below the industry standard threshold of <strong>20.0%</strong>. This high-risk gap increases the probability of internal winding flashovers during transient surges. Consider specifying a higher BIL rating or selecting an arrester with a lower discharge level.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-start gap-3 text-emerald-400">
                  <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider font-mono">
                      Substation Coordination Confirmed
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Protective safety margin is robust at <strong>{coordinationResult.protectiveMargin}%</strong>. The surge arrester will trigger and divert impulse lightning and switching waves safely to the grounding grid, clamping the voltage well below the equipment's drooping withstand capability.
                    </p>
                  </div>
                </div>
              )}

              {/* Volt-Time Characteristics Graph */}
              <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">
                    Volt-Time (V-t) Coordination Profile
                  </h3>
                  <p className="text-xs text-slate-400">
                    Comparing Equipment Withstand insulation envelope with Arrester Clamping level
                  </p>
                </div>

                <div id="active-chart-container" className="h-[320px] w-full bg-navy-dark/40 rounded-xl border border-navy-light/30 p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={coordinationResult.points} margin={{ top: 15, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
                      <XAxis
                        dataKey="timeUs"
                        stroke="#94a3b8"
                        fontSize={11}
                        fontFamily="monospace"
                        label={{ value: 'Time (t) [μs]', position: 'bottom', offset: -2, fill: '#94a3b8', fontSize: 11 }}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        fontFamily="monospace"
                        label={{ value: 'Insulation Level [kV]', angle: -90, position: 'insideLeft', offset: 12, fill: '#94a3b8', fontSize: 11 }}
                      />
                      <Tooltip content={<VtTooltip />} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11, fontFamily: 'monospace' }} />
                      
                      {/* Equipment insulation withstand curve */}
                      <Line
                        name="Equipment BIL Withstand Curve"
                        type="monotone"
                        dataKey="equipmentWithstandKv"
                        stroke="#fbbf24"
                        strokeWidth={3}
                        dot={false}
                      />
                      {/* Arrester protective curve */}
                      <Line
                        name="Arrester Protection Level"
                        type="monotone"
                        dataKey="arresterProtectionKv"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-navy-dark/40 p-4 rounded-xl border border-navy-light/20 text-xs text-slate-300 leading-relaxed">
                  <strong className="text-emerald-accent">Substation Design Practice:</strong> In high-voltage insulation coordination, both insulation withstand and protective device thresholds are time-dependent. Gaseous and liquid insulation can withstand higher voltages for very short transient pulses than for power frequency surges. The lightning arrester's characteristic must always lie safely below the equipment withstand curve across the entire time spectrum to guarantee complete dielectric safety.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
