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
  Network,
  Cpu,
  HelpCircle
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
  ScatterChart,
  Scatter,
  ReferenceLine,
  Cell,
  Legend
} from 'recharts';

// Custom simulation hooks
import { useSMIBEigenvalues } from '../hooks/useSMIBEigenvalues';
import { useSwingEquationRK4 } from '../hooks/useSwingEquationRK4';
import { useVoltageStability } from '../hooks/useVoltageStability';

type TabId = 'eigenvalue' | 'swing' | 'voltage';

export default function PowerStabilityView() {
  const [activeTab, setActiveTab] = useState<TabId>('eigenvalue');

  // =========================================================
  // Tab 1: SMIB Eigenvalue Plotter & PSS Tuner
  // =========================================================
  const {
    D: dampingD,
    setD: setDampingD,
    K1: syncK1,
    setK1: setSyncK1,
    H: inertiaH,
    setH: setInertiaH,
    K5: voltK5,
    setK5: setVoltK5,
    Ka: gainKa,
    setKa: setGainKa,
    pssEnabled,
    setPssEnabled,
    Kpss: gainKpss,
    setKpss: setGainKpss,
    result: eigenResult
  } = useSMIBEigenvalues();

  const eigenScatterData = useMemo(() => {
    return eigenResult.eigenvalues.map((ev, index) => ({
      x: ev.real,
      y: ev.imag,
      name: `${ev.label} (λ${index + 1})`,
      realStr: ev.real.toFixed(3),
      imagStr: ev.imag >= 0 ? `+${ev.imag.toFixed(3)}j` : `${ev.imag.toFixed(3)}j`,
      isStable: ev.isStable
    }));
  }, [eigenResult.eigenvalues]);

  // Determine dynamic axis bounds for s-plane
  const sPlaneXDomain = useMemo(() => {
    const reals = eigenScatterData.map(d => d.x);
    const minReal = Math.min(...reals, -6);
    const maxReal = Math.max(...reals, 2);
    return [Math.floor(minReal - 1), Math.ceil(maxReal + 1)];
  }, [eigenScatterData]);

  const sPlaneYDomain = useMemo(() => {
    const imags = eigenScatterData.map(d => Math.abs(d.y));
    const maxImag = Math.max(...imags, 10);
    return [-Math.ceil(maxImag + 2), Math.ceil(maxImag + 2)];
  }, [eigenScatterData]);

  // Custom tooltips for complex plane
  const ComplexPlaneTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-navy-dark border border-navy-light/60 p-3 rounded-xl text-xs font-mono space-y-1 text-left">
          <p className="text-emerald-accent font-bold">{data.name}</p>
          <p className="text-white">Real (σ): <span className="font-bold">{data.realStr}</span></p>
          <p className="text-white">Imag (ωd): <span className="font-bold">{data.imagStr}</span></p>
          <p className={data.isStable ? 'text-emerald-accent' : 'text-red-400'}>
            Status: {data.isStable ? '● Stable (LHP)' : '● Unstable (RHP)'}
          </p>
        </div>
      );
    }
    return null;
  };

  // =========================================================
  // Tab 2: Swing Equation Solver & RK4 Transient Simulator
  // =========================================================
  const {
    pm: swingPm,
    setPm: setSwingPm,
    pmax1: swingPmax1,
    setPmax1: setSwingPmax1,
    pmax2: swingPmax2,
    setPmax2: setSwingPmax2,
    pmax3: swingPmax3,
    setPmax3: setSwingPmax3,
    H: swingH,
    setH: setSwingH,
    D: swingD,
    setD: setSwingD,
    tf: swingTf,
    setTf: setSwingTf,
    tc: swingTc,
    setTc: setSwingTc,
    f0: swingF0,
    setF0: setSwingF0,
    simulationResult: swingResult
  } = useSwingEquationRK4();

  // =========================================================
  // Tab 3: Voltage Stability & P-V Nose Curve
  // =========================================================
  const {
    R: voltR,
    setR: setVoltR,
    X: voltX,
    setX: setVoltX,
    pf: voltPf,
    setPf: setVoltPf,
    pfType: voltPfType,
    setPfType: setVoltPfType,
    Vs: voltVs,
    setVs: setVoltVs,
    voltageMetrics: voltResult
  } = useVoltageStability();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-h-screen text-slate-100">
      {/* Back button & Academic Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO TOOLS CATALOG
        </Link>
        <span className="text-[10px] font-mono text-emerald-accent/80 tracking-widest uppercase bg-emerald-accent/5 border border-emerald-accent/20 px-3 py-1 rounded-md">
          4th Year Odd Semester / EEE 4141
        </span>
      </div>

      {/* Hero Title Section */}
      <div className="bg-gradient-to-r from-navy-card/90 via-navy-light/40 to-navy-card border border-navy-light/60 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-accent/10 border border-emerald-accent/30 text-xs font-bold text-emerald-accent uppercase tracking-wider">
            <Zap className="h-4.5 w-4.5 text-emerald-accent" /> Grid Dynamics Laboratory
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-black tracking-tight text-white">
            Power System <span className="text-emerald-accent">Stability & Control</span>
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            Simulate grid behavior for EEE 4141. Analyze Small Signal rotor angle oscillations via Heffron-Phillips eigenvalues, calculate Transient Stability swing profiles numerically using Runge-Kutta 4 (RK4), and chart load P-V curves to locate voltage collapse boundaries.
          </p>
        </div>
        {/* Decorative background grid */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none"></div>
      </div>

      {/* Tab Switcher */}
      <div className="flex flex-wrap gap-2 border-b border-navy-light/40 pb-1">
        {[
          { id: 'eigenvalue', label: 'Small Signal (Eigenvalues & PSS)', icon: Network },
          { id: 'swing', label: 'Transient Stability (Swing & RK4)', icon: Activity },
          { id: 'voltage', label: 'Voltage Stability (P-V Nose Curves)', icon: TrendingUp }
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

      {/* Active Tab Viewport */}
      <div className="animate-fadeIn">
        
        {/* ========================================================= */}
        {/* TAB 1: SMIB EIGENVALUES & PSS COMPENSATOR */}
        {/* ========================================================= */}
        {activeTab === 'eigenvalue' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Input Controls */}
            <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Settings className="h-5 w-5 text-emerald-accent" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">
                  Machine Parameters
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                {/* Inertia constant */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium flex justify-between">
                    <span>Inertia Constant (H)</span>
                    <span className="text-emerald-accent font-mono font-bold">{inertiaH} s</span>
                  </label>
                  <input
                    type="range"
                    min={1.5}
                    max={8.0}
                    step={0.1}
                    value={inertiaH}
                    onChange={(e) => setInertiaH(parseFloat(e.target.value))}
                    className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                  <p className="text-[10px] text-slate-500 font-mono">
                    Rotor kinetic storage capability in seconds
                  </p>
                </div>

                {/* Natural damping coefficient */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium flex justify-between">
                    <span>Damping Coefficient (D)</span>
                    <span className="text-emerald-accent font-mono font-bold">{dampingD} pu</span>
                  </label>
                  <input
                    type="range"
                    min={0.0}
                    max={4.0}
                    step={0.1}
                    value={dampingD}
                    onChange={(e) => setDampingD(parseFloat(e.target.value))}
                    className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                  <p className="text-[10px] text-slate-500 font-mono">
                    Frictional & damper winding grid damping factor
                  </p>
                </div>

                {/* Synchronizing coefficient */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium flex justify-between">
                    <span>Synchronizing Power (K1)</span>
                    <span className="text-emerald-accent font-mono font-bold">{syncK1} pu</span>
                  </label>
                  <input
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.05}
                    value={syncK1}
                    onChange={(e) => setSyncK1(parseFloat(e.target.value))}
                    className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                </div>

                {/* Voltage coefficient K5 (Critical for negative damping) */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium flex justify-between">
                    <span>Voltage Coefficient (K5)</span>
                    <span className={`font-mono font-bold ${voltK5 < 0 ? 'text-red-400 animate-pulse' : 'text-emerald-accent'}`}>
                      {voltK5} pu
                    </span>
                  </label>
                  <input
                    type="range"
                    min={-0.20}
                    max={0.20}
                    step={0.01}
                    value={voltK5}
                    onChange={(e) => setVoltK5(parseFloat(e.target.value))}
                    className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                  <p className="text-[10px] text-slate-500 font-mono">
                    K5 &lt; 0 with high excitation gain Ka can trigger unstable growing oscillations!
                  </p>
                </div>

                {/* Excitation amplifier gain Ka */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium flex justify-between">
                    <span>Exciter Gain (Ka)</span>
                    <span className="text-emerald-accent font-mono font-bold">{gainKa}</span>
                  </label>
                  <input
                    type="range"
                    min={10.0}
                    max={100.0}
                    step={1.0}
                    value={gainKa}
                    onChange={(e) => setGainKa(parseFloat(e.target.value))}
                    className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                </div>

                {/* PSS SWITCH and Gain */}
                <div className="pt-4 border-t border-navy-light/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-bold uppercase tracking-wider font-mono text-[10px]">
                      Power System Stabilizer (PSS)
                    </span>
                    <button
                      type="button"
                      onClick={() => setPssEnabled(!pssEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        pssEnabled ? 'bg-emerald-accent' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-navy-dark shadow ring-0 transition duration-200 ease-in-out ${
                          pssEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {pssEnabled && (
                    <div className="space-y-1.5 animate-fadeIn">
                      <label className="text-slate-400 font-medium flex justify-between">
                        <span>PSS Feedback Gain (Kpss)</span>
                        <span className="text-emerald-accent font-mono font-bold">{gainKpss}</span>
                      </label>
                      <input
                        type="range"
                        min={0.0}
                        max={15.0}
                        step={0.5}
                        value={gainKpss}
                        onChange={(e) => setGainKpss(parseFloat(e.target.value))}
                        className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                      />
                      <p className="text-[10px] text-slate-500 font-mono">
                        Supports local rotor oscillations cancellation
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Calculations and Plotting */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex justify-end">
                <IEEEReportButton
                  experimentName="EEE 4141: Small Signal Power System Stability via Heffron-Phillips"
                  inputData={{
                    'Inertia H': inertiaH + ' s',
                    'Damping D': dampingD + ' pu',
                    'Sync Coefficient K1': syncK1,
                    'Voltage Coefficient K5': voltK5,
                    'Exciter Gain Ka': gainKa,
                    'PSS Status': pssEnabled ? 'ENABLED' : 'DISABLED',
                    'PSS Feedback Kpss': pssEnabled ? gainKpss : 'N/A'
                  }}
                  outputData={{
                    'Linear System State Matrix [A]': JSON.stringify(eigenResult.matrixA),
                    'Stability Status': eigenResult.isSystemStable ? 'STABLE' : 'UNSTABLE / OSCILLATORY',
                    'Electromechanical Frequency': eigenResult.naturalFreqHz + ' Hz',
                    'Oscillatory Damping Ratio (ζ)': eigenResult.dampingRatio
                  }}
                  chartSelectors={['#eigenvalue-s-plane-pane']}
                />
              </div>

              {/* Outputs Panel */}
              <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6" id="eigenvalue-s-plane-pane">
                <div className="flex flex-wrap justify-between items-center pb-2 border-b border-navy-light/40 gap-2">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                    Linearized Heffron-Phillips Metrics
                  </h4>
                  <span className={`text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full border ${
                    eigenResult.isSystemStable
                      ? 'bg-emerald-accent/10 border-emerald-accent/30 text-emerald-accent'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                    {eigenResult.isSystemStable ? 'SYSTEM STABLE (LHP SECURED)' : 'SYSTEM UNSTABLE (DIVERGENT OSCILLATIONS)'}
                  </span>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Oscillation Freq</span>
                    <span className="text-base font-bold text-white tracking-tight mt-1 font-mono">
                      {eigenResult.naturalFreqHz > 0 ? `${eigenResult.naturalFreqHz} Hz` : 'Non-osc'}
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1 font-mono">
                      Electromechanical frequency
                    </span>
                  </div>

                  <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Damping Ratio (ζ)</span>
                    <span className={`text-base font-bold tracking-tight mt-1 font-mono ${
                      eigenResult.dampingRatio >= 0.05
                        ? 'text-emerald-accent'
                        : eigenResult.dampingRatio > 0
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}>
                      {eigenResult.dampingRatio}
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1 font-mono">
                      Target: ζ ≥ 0.05
                    </span>
                  </div>

                  <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Trace of A</span>
                    <span className="text-base font-bold text-white tracking-tight mt-1 font-mono">
                      {eigenResult.matrixA ? (eigenResult.matrixA[0][0] + eigenResult.matrixA[1][1] + eigenResult.matrixA[2][2]).toFixed(4) : ''}
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1 font-mono">
                      Sum of diagonal elements
                    </span>
                  </div>

                  <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Dominant Real</span>
                    <span className={`text-base font-bold tracking-tight mt-1 font-mono ${
                      eigenResult.isSystemStable ? 'text-emerald-accent' : 'text-red-400 animate-pulse'
                    }`}>
                      {Math.max(...eigenResult.eigenvalues.map(ev => ev.real)).toFixed(4)}
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1 font-mono">
                      Must be negative for stability
                    </span>
                  </div>
                </div>

                {/* S-Plane Scatter Chart and LaTeX Bracket Representation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  
                  {/* State Matrix A Presentation */}
                  <div className="space-y-3 text-left">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">
                      Linearized State Space A-Matrix [3x3]
                    </span>
                    <div className="bg-navy-dark border border-navy-light/40 p-4 rounded-xl flex items-center justify-center font-mono text-[11px] leading-relaxed relative">
                      {/* Matrix Bracket left */}
                      <div className="absolute left-3 top-3 bottom-3 w-2 border-t-2 border-b-2 border-l-2 border-slate-500"></div>
                      
                      <div className="space-y-2 text-center select-all">
                        <div>
                          {eigenResult.matrixA[0][0].toFixed(2)} &nbsp;&nbsp;&nbsp; {eigenResult.matrixA[0][1].toFixed(2)} &nbsp;&nbsp;&nbsp; {eigenResult.matrixA[0][2].toFixed(2)}
                        </div>
                        <div>
                          {eigenResult.matrixA[1][0].toFixed(4)} &nbsp;&nbsp;&nbsp; {eigenResult.matrixA[1][1].toFixed(4)} &nbsp;&nbsp;&nbsp; {eigenResult.matrixA[1][2].toFixed(4)}
                        </div>
                        <div>
                          {eigenResult.matrixA[2][0].toFixed(4)} &nbsp;&nbsp;&nbsp; {eigenResult.matrixA[2][1].toFixed(4)} &nbsp;&nbsp;&nbsp; {eigenResult.matrixA[2][2].toFixed(4)}
                        </div>
                      </div>

                      {/* Matrix Bracket right */}
                      <div className="absolute right-3 top-3 bottom-3 w-2 border-t-2 border-b-2 border-r-2 border-slate-500"></div>
                    </div>
                    
                    <div className="bg-navy-dark/40 border border-navy-light/40 p-4 rounded-xl text-[10px] text-slate-400 space-y-1 font-mono">
                      <span className="text-slate-300 font-bold block uppercase tracking-wide text-[9px]">
                        Dynamic Stability Assessment
                      </span>
                      {voltK5 < 0 && !pssEnabled ? (
                        <p className="text-red-400 leading-normal">
                          ⚠️ <strong>Critical Negative Damping:</strong> Due to a negative voltage feedback parameter K5 ({voltK5}) combined with highly tuned excitation gain Ka ({gainKa}), a pair of electromechanical eigenvalues has crossed the imaginary axis into the right-half plane (RHP). Enable the PSS to restore damping!
                        </p>
                      ) : pssEnabled ? (
                        <p className="text-emerald-accent leading-normal">
                          ✔ <strong>PSS Compensator Restored:</strong> The Power System Stabilizer adds speed-proportional feedback Kpss ({gainKpss}), shifting the system eigenvalues further to the left (stable Left-Half Plane). Local rotor angle oscillations will be damped out rapidly.
                        </p>
                      ) : (
                        <p className="text-slate-400 leading-normal">
                          The system eigenvalues remain inside the Left-Half Plane. System is small-signal stable, but damping ratio is currently {eigenResult.dampingRatio}. Consider optimizing parameters to improve margin.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Complex s-Plane Plot */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">
                      Complex s-Plane Plot (Real vs Imaginary)
                    </span>
                    <div className="h-[250px] w-full bg-navy-dark/50 border border-navy-light/60 rounded-xl p-2 font-mono text-[9px] relative">
                      
                      {/* Stable vs Unstable background labels */}
                      <div className="absolute left-4 top-4 text-emerald-accent/20 font-bold tracking-widest text-[9px] select-none pointer-events-none">
                        STABLE LHP (σ &lt; 0)
                      </div>
                      <div className="absolute right-4 top-4 text-red-500/10 font-bold tracking-widest text-[9px] select-none pointer-events-none">
                        UNSTABLE RHP (σ &gt; 0)
                      </div>

                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -25 }}>
                          <CartesianGrid stroke="#1e293b" />
                          <XAxis
                            type="number"
                            dataKey="x"
                            name="Real (σ)"
                            domain={sPlaneXDomain}
                            stroke="#64748b"
                            tickCount={7}
                          />
                          <YAxis
                            type="number"
                            dataKey="y"
                            name="Imaginary (jω)"
                            domain={sPlaneYDomain}
                            stroke="#64748b"
                          />
                          <Tooltip content={<ComplexPlaneTooltip />} />
                          
                          {/* Y-axis crossing (Imaginary Axis) */}
                          <ReferenceLine x={0} stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="3 3" />
                          {/* X-axis crossing (Real Axis) */}
                          <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
                          
                          <Scatter name="Eigenvalues" data={eigenScatterData}>
                            {eigenScatterData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.isStable ? '#10b981' : '#f43f5e'}
                                stroke="#ffffff"
                                strokeWidth={1.5}
                                r={8}
                              />
                            ))}
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: TRANSIENT STABILITY SIMULATOR */}
        {/* ========================================================= */}
        {activeTab === 'swing' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left controls column */}
            <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Settings className="h-5 w-5 text-emerald-accent" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">
                  Fault Sequence Inputs
                </h3>
              </div>

              <div className="space-y-4 text-xs text-left">
                {/* Mechanical Power */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium flex justify-between">
                    <span>Mechanical Power (Pm)</span>
                    <span className="text-emerald-accent font-mono font-bold">{swingPm} pu</span>
                  </label>
                  <input
                    type="range"
                    min={0.1}
                    max={1.5}
                    step={0.05}
                    value={swingPm}
                    onChange={(e) => setSwingPm(parseFloat(e.target.value))}
                    className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                  <p className="text-[10px] text-slate-500 font-mono">
                    Initial constant mechanical torque input
                  </p>
                </div>

                {/* Inertia Constant */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium flex justify-between">
                    <span>Inertia Constant (H)</span>
                    <span className="text-emerald-accent font-mono font-bold">{swingH} s</span>
                  </label>
                  <input
                    type="range"
                    min={1.5}
                    max={10.0}
                    step={0.5}
                    value={swingH}
                    onChange={(e) => setSwingH(parseFloat(e.target.value))}
                    className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                </div>

                {/* Damping */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium flex justify-between">
                    <span>Damping Coefficient (D)</span>
                    <span className="text-emerald-accent font-mono font-bold">{swingD} pu</span>
                  </label>
                  <input
                    type="range"
                    min={0.0}
                    max={0.25}
                    step={0.01}
                    value={swingD}
                    onChange={(e) => setSwingD(parseFloat(e.target.value))}
                    className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                </div>

                {/* Pre-fault, During, Post-fault power limits */}
                <div className="grid grid-cols-1 gap-4 pt-3 border-t border-navy-light/30">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                    Transmission Limits (Pmax * sin(δ))
                  </span>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-mono">Pre-Fault</label>
                      <input
                        type="number"
                        step={0.1}
                        value={swingPmax1}
                        onChange={(e) => setSwingPmax1(parseFloat(e.target.value) || 1.0)}
                        className="w-full bg-navy-dark border border-navy-light/60 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-accent font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-mono">During-Fault</label>
                      <input
                        type="number"
                        step={0.1}
                        value={swingPmax2}
                        onChange={(e) => setSwingPmax2(parseFloat(e.target.value) || 0.0)}
                        className="w-full bg-navy-dark border border-navy-light/60 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-accent font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-mono">Post-Fault</label>
                      <input
                        type="number"
                        step={0.1}
                        value={swingPmax3}
                        onChange={(e) => setSwingPmax3(parseFloat(e.target.value) || 1.0)}
                        className="w-full bg-navy-dark border border-navy-light/60 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-accent font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Timings */}
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-navy-light/30">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">Fault Start (tf)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step={0.05}
                        value={swingTf}
                        onChange={(e) => setSwingTf(parseFloat(e.target.value) || 0.0)}
                        className="w-full bg-navy-dark border border-navy-light/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent font-mono"
                      />
                      <span className="absolute right-3 top-2 text-slate-500 font-mono">s</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">Clearing Time (tc)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step={0.05}
                        value={swingTc}
                        onChange={(e) => setSwingTc(parseFloat(e.target.value) || 0.05)}
                        className="w-full bg-navy-dark border border-navy-light/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent font-mono"
                      />
                      <span className="absolute right-3 top-2 text-slate-500 font-mono">s</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Simulation plots column */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex justify-end">
                <IEEEReportButton
                  experimentName="EEE 4141: Transient Power System Stability RK4 swing solver"
                  inputData={{
                    'Mechanical Pm': swingPm + ' pu',
                    'Inertia Constant H': swingH + ' s',
                    'Damping constant D': swingD + ' pu',
                    'Pre-fault Pmax1': swingPmax1 + ' pu',
                    'During-fault Pmax2': swingPmax2 + ' pu',
                    'Post-fault Pmax3': swingPmax3 + ' pu',
                    'Fault Time tf': swingTf + ' s',
                    'Clearing Time tc': swingTc + ' s'
                  }}
                  outputData={{
                    'Initial Angle (delta_0)': swingResult.delta0Deg + '°',
                    'Theoretical Max Swing Limit': swingResult.deltaMaxDeg + '°',
                    'Critical Clearing Angle': swingResult.deltaCrDeg ? swingResult.deltaCrDeg + '°' : 'N/A',
                    'Stability Outcome': swingResult.isUnstable ? `UNSTABLE (Out of synchronism at ${swingResult.instabilityTime} s)` : 'STABLE (Transient Secure)'
                  }}
                  chartSelectors={['#transient-swing-plot-pane']}
                />
              </div>

              {/* Chart container */}
              <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6" id="transient-swing-plot-pane">
                <div className="flex flex-wrap justify-between items-center pb-2 border-b border-navy-light/40 gap-2">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                    RK4 Numerical Integration Waveform (0 - 5 seconds)
                  </h4>
                  <span className={`text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full border ${
                    swingResult.isUnstable
                      ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
                      : 'bg-emerald-accent/10 border-emerald-accent/30 text-emerald-accent'
                  }`}>
                    {swingResult.isUnstable
                      ? `SYSTEM UNSTABLE (Loss of Synchronism at ${swingResult.instabilityTime}s)`
                      : 'SYSTEM STABLE (Transiently Secure)'}
                  </span>
                </div>

                {/* Plot */}
                <div className="h-[280px] w-full bg-navy-dark/40 border border-navy-light/60 rounded-xl p-2 font-mono text-[9px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={swingResult.points}
                      margin={{ top: 10, right: 10, left: -20, bottom: -5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5 }} />
                      <YAxis stroke="#64748b" domain={[0, 200]} label={{ value: 'Rotor Angle δ (Degrees)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                      <Legend />
                      
                      {/* Critical boundaries */}
                      <ReferenceLine y={180} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Out of step limit (180°)', fill: '#ef4444', position: 'right', fontSize: 9 }} />
                      <ReferenceLine x={swingTf} stroke="#eab308" label={{ value: 'Fault Start', fill: '#eab308', position: 'top', fontSize: 9 }} />
                      <ReferenceLine x={swingTc} stroke="#10b981" label={{ value: 'Fault Cleared', fill: '#10b981', position: 'top', fontSize: 9 }} />

                      <Line
                        type="monotone"
                        dataKey="deltaDeg"
                        name="Rotor Angle (δ)"
                        stroke={swingResult.isUnstable ? '#ef4444' : '#10b981'}
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Mathematical context cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start text-xs text-left">
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">
                      Equal Area Criterion & Angles
                    </span>
                    <div className="bg-navy-dark/60 border border-navy-light/40 p-4 rounded-xl space-y-2.5 font-mono text-[11px] text-slate-300">
                      <div className="flex justify-between border-b border-navy-light/20 pb-1.5">
                        <span>Initial Load Angle (δ0):</span>
                        <span className="font-bold text-white">{swingResult.delta0Deg}°</span>
                      </div>
                      <div className="flex justify-between border-b border-navy-light/20 pb-1.5">
                        <span>Theoretical Max Angle (δmax):</span>
                        <span className="font-bold text-white">{swingResult.deltaMaxDeg}°</span>
                      </div>
                      <div className="flex justify-between border-b border-navy-light/20 pb-1.5">
                        <span>Critical Clearing Angle (δcr):</span>
                        <span className="font-bold text-yellow-400">
                          {swingResult.deltaCrDeg ? `${swingResult.deltaCrDeg}°` : 'Infinite Limit'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Actual Cleared Angle (δc):</span>
                        <span className="font-bold text-emerald-accent">
                          {swingResult.points.find(p => p.time >= swingTc)?.deltaDeg?.toFixed(1) || 'N/A'}°
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 font-mono text-[10px] text-slate-400 leading-normal">
                    <span className="text-[10px] font-bold uppercase text-slate-300 tracking-wide block">
                      RK4 Numerical Solver Math
                    </span>
                    <p>
                      The swing equation is solved at each 10 ms time step (dt = 0.01 s) using:
                    </p>
                    <div className="bg-navy-dark border border-navy-light/40 p-3 rounded-lg text-[9px] text-slate-300 space-y-1">
                      <p>• <strong>dδ/dt = Δω</strong></p>
                      <p>• <strong>dΔω/dt = (π * f0 / H) * (Pm - Pe - D*Δω)</strong></p>
                    </div>
                    <p>
                      The Runge-Kutta 4th order method evaluates four derivative approximations (k1, k2, k3, k4) across each step to avoid local truncation errors.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: VOLTAGE STABILITY & P-V NOSE CURVE */}
        {/* ========================================================= */}
        {activeTab === 'voltage' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Control Column */}
            <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Settings className="h-5 w-5 text-emerald-accent" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">
                  Line & Load Settings
                </h3>
              </div>

              <div className="space-y-4 text-xs text-left">
                {/* Transmission Line Resistance */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium flex justify-between">
                    <span>Line Resistance (R)</span>
                    <span className="text-emerald-accent font-mono font-bold">{voltR} pu</span>
                  </label>
                  <input
                    type="range"
                    min={0.0}
                    max={0.25}
                    step={0.01}
                    value={voltR}
                    onChange={(e) => setVoltR(parseFloat(e.target.value))}
                    className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                  <p className="text-[10px] text-slate-500 font-mono">
                    Per-unit resistance of radial transmission corridor
                  </p>
                </div>

                {/* Transmission Line Reactance */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium flex justify-between">
                    <span>Line Reactance (X)</span>
                    <span className="text-emerald-accent font-mono font-bold">{voltX} pu</span>
                  </label>
                  <input
                    type="range"
                    min={0.05}
                    max={0.80}
                    step={0.01}
                    value={voltX}
                    onChange={(e) => setVoltX(parseFloat(e.target.value))}
                    className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                </div>

                {/* Infinite Bus sending end voltage Vs */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium flex justify-between">
                    <span>Sending End Voltage (Vs)</span>
                    <span className="text-emerald-accent font-mono font-bold">{voltVs} pu</span>
                  </label>
                  <input
                    type="range"
                    min={0.85}
                    max={1.15}
                    step={0.01}
                    value={voltVs}
                    onChange={(e) => setVoltVs(parseFloat(e.target.value))}
                    className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                </div>

                {/* Power Factor Toggle between Lagging & Leading */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Load Power Factor Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'lagging', label: 'Lagging (Inductive)' },
                      { id: 'leading', label: 'Leading (Capacitive)' }
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setVoltPfType(type.id as 'lagging' | 'leading')}
                        className={`py-2 px-3 rounded-xl border text-center font-bold tracking-wide transition-all text-[11px] cursor-pointer ${
                          voltPfType === type.id
                            ? 'bg-emerald-accent/15 border-emerald-accent/60 text-emerald-accent'
                            : 'bg-navy-dark border-navy-light/40 text-slate-400'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Power Factor Value */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium flex justify-between">
                    <span>Power Factor Magnitude (cos φ)</span>
                    <span className="text-emerald-accent font-mono font-bold">{voltPf.toFixed(2)}</span>
                  </label>
                  <input
                    type="range"
                    min={0.50}
                    max={1.0}
                    step={0.01}
                    value={voltPf}
                    onChange={(e) => setVoltPf(parseFloat(e.target.value))}
                    className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                  <p className="text-[10px] text-slate-500 font-mono">
                    Leading power factor dynamically supports the voltage profile via line charging!
                  </p>
                </div>

              </div>
            </div>

            {/* Nose Curve Plot & Data Grid */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex justify-end">
                <IEEEReportButton
                  experimentName="EEE 4141: Voltage Stability Limit & P-V Nose Curves"
                  inputData={{
                    'Line resistance R': voltR + ' pu',
                    'Line reactance X': voltX + ' pu',
                    'Infinite bus voltage Vs': voltVs + ' pu',
                    'Load Power Factor PF': voltPf,
                    'Power Factor Direction': voltPfType
                  }}
                  outputData={{
                    'Max Active Power Limit Pmax': voltResult.pMax + ' pu',
                    'Critical Voltage V_critical': voltResult.vCritical + ' pu',
                    'Line Impedance |Z|': voltResult.impedance + ' pu',
                    'Nose Angle': Math.atan2(voltX, voltR) * 180 / Math.PI + '°'
                  }}
                  chartSelectors={['#pv-nose-curve-pane']}
                />
              </div>

              {/* Outputs display */}
              <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6" id="pv-nose-curve-pane">
                <div className="flex flex-wrap justify-between items-center pb-2 border-b border-navy-light/40 gap-2">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                    Load Flow Boundary (Nose Curve)
                  </h4>
                  <span className="text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full border border-yellow-400/30 text-yellow-400">
                    Collapse Boundary: Pmax = {voltResult.pMax} pu
                  </span>
                </div>

                {/* Analytical summary card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Max Real Power (Pmax)</span>
                    <span className="text-xl font-bold text-emerald-accent tracking-tight mt-1 font-mono">
                      {voltResult.pMax} <span className="text-xs text-slate-400">pu</span>
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1 font-mono">
                      Maximum deliverable active power
                    </span>
                  </div>

                  <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Critical Voltage (Vcrit)</span>
                    <span className="text-xl font-bold text-white tracking-tight mt-1 font-mono">
                      {voltResult.vCritical} <span className="text-xs text-slate-400">pu</span>
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1 font-mono">
                      Voltage at the nose/critical point
                    </span>
                  </div>

                  <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Line Impedance |Z|</span>
                    <span className="text-xl font-bold text-white tracking-tight mt-1 font-mono">
                      {voltResult.impedance} <span className="text-xs text-slate-400">pu</span>
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1 font-mono">
                      Equivalent series line impedance
                    </span>
                  </div>
                </div>

                {/* PV Nose Curve line plotting */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  
                  {/* Nose Curve Plot */}
                  <div className="space-y-2 text-left">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">
                      P-V Nose Curve (Voltage vs Power)
                    </span>
                    <div className="h-[250px] w-full bg-navy-dark/50 border border-navy-light/60 rounded-xl p-2 font-mono text-[9px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={voltResult.noseCurvePoints}
                          margin={{ top: 15, right: 15, left: -25, bottom: -5 }}
                        >
                          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                          <XAxis
                            type="number"
                            dataKey="pPlot"
                            stroke="#64748b"
                            domain={[0, parseFloat((voltResult.pMax * 1.1).toFixed(2))]}
                            label={{ value: 'Active Power P (pu)', position: 'insideBottom', offset: -5 }}
                          />
                          <YAxis
                            type="number"
                            dataKey="vPlot"
                            stroke="#64748b"
                            domain={[0, 1.2]}
                            label={{ value: 'Receiving Voltage Vr (pu)', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                          
                          {/* Highlight Nose critical coordinate */}
                          <ReferenceLine x={voltResult.pMax} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Collapse Boundary', fill: '#f59e0b', fontSize: 8, position: 'top' }} />
                          <ReferenceLine y={voltResult.vCritical} stroke="#f59e0b" strokeDasharray="3 3" />

                          <Line
                            type="monotone"
                            dataKey="vPlot"
                            name="Receiving End Voltage"
                            stroke="#10b981"
                            strokeWidth={2.5}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Physics & Engineering Advice */}
                  <div className="space-y-4 text-xs text-left">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">
                      Grid Dynamics Explanation
                    </span>
                    <div className="bg-navy-dark/60 border border-navy-light/40 p-4 rounded-xl space-y-3 font-sans leading-relaxed text-slate-300">
                      <p>
                        The <strong>P-V Nose Curve</strong> demonstrates how the receiving end voltage drops as we demand more active power over an inductive transmission line.
                      </p>
                      <p>
                        • <strong>Upper Branch (Stable):</strong> Power flow solutions are self-stabilizing. Normal power grids always operate near the top of the curve ($V_r \ge 0.95$ pu).
                      </p>
                      <p>
                        • <strong>Lower Branch (Unstable):</strong> If the operating point dips below the critical nose point, requiring more power causes voltage to crash ($dV/dP = \infty$), triggering a cascade voltage collapse.
                      </p>
                      {voltPfType === 'leading' ? (
                        <p className="text-emerald-accent">
                          💡 <strong>Leading PF Advantage:</strong> Operating with a leading power factor (capacitive load support) increases the critical power transfer boundary Pmax from typical lagging limits, serving as a dynamic voltage supporter.
                        </p>
                      ) : (
                        <p className="text-yellow-400">
                          ⚠️ <strong>Lagging PF Disadvantage:</strong> Lagging power factors (inductive load) deplete the reactive power reserves of the system, dragging down the critical nose point and restricting Pmax.
                        </p>
                      )}
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
