import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Settings,
  Zap,
  TrendingUp,
  Activity,
  Sliders,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  Cpu,
  ChevronRight,
  RefreshCw,
  Gauge,
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

// ============================================================================
// Custom Interval Hook for Robust Real-Time Loops
// ============================================================================
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

// ============================================================================
// Main Component
// ============================================================================
export default function IndustrialAutomationView() {
  const [activeTab, setActiveTab] = useState<'pid' | 'vfd' | 'stepper'>('pid');

  // ==========================================================================
  // SIMULATOR 1: TANK LEVEL PID PROCESS CONTROL STATE & MATH
  // ==========================================================================
  const [setpoint, setSetpoint] = useState<number>(65); // %
  const [kp, setKp] = useState<number>(3.5);
  const [ki, setKi] = useState<number>(0.8);
  const [kd, setKd] = useState<number>(0.25);
  const [disturbance, setDisturbance] = useState<boolean>(false);
  const [pidSimRunning, setPidSimRunning] = useState<boolean>(true);

  // Physical simulation variables
  const [actualLevel, setActualLevel] = useState<number>(30); // %
  const [integral, setIntegral] = useState<number>(0);
  const [prevError, setPrevError] = useState<number>(0);
  const [controlOutput, setControlOutput] = useState<number>(0); // MV (%)
  const [outflowRate, setOutflowRate] = useState<number>(0);
  const [tick, setTick] = useState<number>(0);
  const [pidHistory, setPidHistory] = useState<Array<{ time: number; setpoint: number; actualLevel: number; controlOutput: number }>>([]);

  const resetPidSimulation = () => {
    setActualLevel(30);
    setIntegral(0);
    setPrevError(0);
    setControlOutput(0);
    setTick(0);
    setPidHistory([]);
  };

  // Run Simulation Loop (100ms interval)
  useInterval(
    () => {
      const dt = 0.1; // 100ms steps
      const currentError = setpoint - actualLevel;

      // 1. PID Formula Calculations
      // Accumulate integral with anti-windup clamping (integral term clamped to prevent excessive overshoot)
      const maxIntegral = 80;
      let nextIntegral = integral + currentError * dt;
      nextIntegral = Math.max(-maxIntegral, Math.min(maxIntegral, nextIntegral));

      // Derivative calculation (smoothed to handle rapid jumps)
      const derivative = (currentError - prevError) / dt;

      // Calculate MV
      let pTerm = kp * currentError;
      let iTerm = ki * nextIntegral;
      let dTerm = kd * derivative;
      let mv = pTerm + iTerm + dTerm;

      // Final clamping on Manipulated Variable (0-100% Valve Open)
      mv = Math.max(0, Math.min(100, mv));

      // 2. Physical Process Equations (First-Order Lag with Tank Gravity Drain + Disturbance Leak)
      const qInMax = 20.0; // Max water flow rate in
      const qIn = (mv / 100.0) * qInMax;

      // Outflow based on hydrostatic head (gravity drain proportional to sqrt(Height)) plus disturbance leakage
      const gravityOutflowCoeff = 0.65;
      const leakFactor = disturbance ? 8.5 : 0.0;
      const qOut = gravityOutflowCoeff * Math.sqrt(actualLevel) + leakFactor;

      // Process Time Constant / Capacitance (Rate of change of height)
      const tankArea = 1.6;
      const dH = ((qIn - qOut) / tankArea) * dt * 10; // Scaled for snappy feedback loop engagement

      // Update level and clamp
      let nextLevel = actualLevel + dH;
      nextLevel = Math.max(0.0, Math.min(100.0, nextLevel));

      // 3. Save states
      setActualLevel(parseFloat(nextLevel.toFixed(2)));
      setIntegral(nextIntegral);
      setPrevError(currentError);
      setControlOutput(parseFloat(mv.toFixed(1)));
      setOutflowRate(parseFloat(qOut.toFixed(2)));
      setTick((prev) => prev + 1);

      // Save historical data
      const timeSec = parseFloat(((tick + 1) * dt).toFixed(1));
      setPidHistory((prev) => {
        const item = {
          time: timeSec,
          setpoint: setpoint,
          actualLevel: parseFloat(nextLevel.toFixed(1)),
          controlOutput: parseFloat(mv.toFixed(1))
        };
        const updated = [...prev, item];
        if (updated.length > 50) {
          return updated.slice(1);
        }
        return updated;
      });
    },
    pidSimRunning ? 100 : null
  );

  // ==========================================================================
  // SIMULATOR 2: VFD ENERGY SAVINGS & AFFINITY LAWS STATE & MATH
  // ==========================================================================
  const [ratedPower, setRatedPower] = useState<number>(75); // kW
  const [operatingHours, setOperatingHours] = useState<number>(6000); // Hrs/year
  const [flowDemand, setFlowDemand] = useState<number>(75); // %
  const [tariff, setTariff] = useState<number>(0.15); // $/kWh

  const vfdCalculation = useMemo(() => {
    const demandFraction = flowDemand / 100.0;

    // Pump Affinity Law: Power P2 = P1 * (N2/N1)^3
    // Under VFD control, shaft power decreases with the cube of the speed (flow demand)
    const shaftPowerVFD = ratedPower * Math.pow(demandFraction, 3);
    // Standard VFD electrical efficiency (95%) and thermal overhead
    const electricalPowerVFD = shaftPowerVFD / 0.95;

    // Mechanical Throttling Valve Control:
    // Speed is locked at 100%, and throttling restricting flow decreases power consumption only slightly (non-linear flat curve)
    // P_Valve = P_Rated * (0.6 + 0.4 * flowDemand/100)
    const electricalPowerValve = ratedPower * (0.6 + 0.4 * demandFraction);

    // Energy Consumption (kWh per year)
    const annualEnergyVFD = electricalPowerVFD * operatingHours;
    const annualEnergyValve = electricalPowerValve * operatingHours;

    // Annual Costs ($)
    const annualCostVFD = annualEnergyVFD * tariff;
    const annualCostValve = annualEnergyValve * tariff;
    const annualSavings = Math.max(0, annualCostValve - annualCostVFD);

    // Energy Savings
    const kwhSaved = Math.max(0, annualEnergyValve - annualEnergyVFD);
    const reductionPercent = ((annualEnergyValve - annualEnergyVFD) / annualEnergyValve) * 100;

    // Environmental Impact: Carbon Emission Reduction (avg 0.4 kg CO2 per kWh)
    const co2ReductionTons = (kwhSaved * 0.4) / 1000;

    return {
      pVFD: parseFloat(electricalPowerVFD.toFixed(1)),
      pValve: parseFloat(electricalPowerValve.toFixed(1)),
      energyVFD: Math.round(annualEnergyVFD),
      energyValve: Math.round(annualEnergyValve),
      costVFD: parseFloat(annualCostVFD.toFixed(2)),
      costValve: parseFloat(annualCostValve.toFixed(2)),
      savings: parseFloat(annualSavings.toFixed(2)),
      kwhSaved: Math.round(kwhSaved),
      reductionPercent: parseFloat(reductionPercent.toFixed(1)),
      co2Saved: parseFloat(co2ReductionTons.toFixed(2))
    };
  }, [ratedPower, operatingHours, flowDemand, tariff]);

  // ==========================================================================
  // SIMULATOR 3: STEPPER MOTOR / BLDC SEQUENCE STATE & MATH
  // ==========================================================================
  const [driveMode, setDriveMode] = useState<'wave' | 'full' | 'half'>('full');
  const [stepInterval, setStepInterval] = useState<number>(400); // ms per step
  const [stepperRunning, setStepperRunning] = useState<boolean>(true);
  const [stepperSequenceIndex, setStepperSequenceIndex] = useState<number>(0);
  const [totalStepsTaken, setTotalStepsTaken] = useState<number>(0);

  // Sequence definitions
  // Binary Outputs [Phase A, Phase B, Phase A', Phase B']
  const waveDriveSequence = [
    [1, 0, 0, 0], // Step 0
    [0, 1, 0, 0], // Step 1
    [0, 0, 1, 0], // Step 2
    [0, 0, 0, 1]  // Step 3
  ];

  const fullStepSequence = [
    [1, 1, 0, 0], // Step 0
    [0, 1, 1, 0], // Step 1
    [0, 0, 1, 1], // Step 2
    [1, 0, 0, 1]  // Step 3
  ];

  const halfStepSequence = [
    [1, 0, 0, 0], // Step 0
    [1, 1, 0, 0], // Step 1
    [0, 1, 0, 0], // Step 2
    [0, 1, 1, 0], // Step 3
    [0, 0, 1, 0], // Step 4
    [0, 0, 1, 1], // Step 5
    [0, 0, 0, 1], // Step 6
    [1, 0, 0, 1]  // Step 7
  ];

  // Resolve active steps
  const activeSequence = useMemo(() => {
    if (driveMode === 'wave') return waveDriveSequence;
    if (driveMode === 'half') return halfStepSequence;
    return fullStepSequence;
  }, [driveMode]);

  const activePhases = activeSequence[stepperSequenceIndex] || [0, 0, 0, 0];

  // Calculate Rotor Angle (N/S orientation)
  // Align rotor to magnet field angle based on phase energizations:
  // Phase A at top (270deg), B at right (0deg), A' at bottom (90deg), B' at left (180deg)
  const rotorAngle = useMemo(() => {
    // Determine target magnetic field angle
    // In wave mode:
    // Step 0: 1000 -> Stator A active -> Rotor pulls to top (0 or 360 deg)
    // Step 1: 0100 -> Stator B active -> Rotor pulls to right (90 deg)
    // Step 2: 0010 -> Stator A' active -> Rotor pulls to bottom (180 deg)
    // Step 3: 0001 -> Stator B' active -> Rotor pulls to left (270 deg)
    if (driveMode === 'wave') {
      return stepperSequenceIndex * 90;
    }
    // In full step mode:
    // Step 0: 1100 -> A & B active -> Pulls between top & right (45 deg)
    // Step 1: 0110 -> B & A' active -> Pulls between right & bottom (135 deg)
    // Step 2: 0011 -> A' & B' active -> Pulls between bottom & left (225 deg)
    // Step 3: 1001 -> B' & A active -> Pulls between left & top (315 deg)
    if (driveMode === 'full') {
      return stepperSequenceIndex * 90 + 45;
    }
    // In half-step mode (alternating single and dual coil, 8 steps):
    // Step 0: 1000 -> 0 deg
    // Step 1: 1100 -> 45 deg
    // Step 2: 0100 -> 90 deg
    // Step 3: 0110 -> 135 deg
    // Step 4: 0010 -> 180 deg
    // Step 5: 0011 -> 225 deg
    // Step 6: 0001 -> 270 deg
    // Step 7: 1001 -> 315 deg
    return stepperSequenceIndex * 45;
  }, [driveMode, stepperSequenceIndex]);

  // Handle Stepper Sequence Step loop
  useInterval(
    () => {
      setStepperSequenceIndex((prev) => {
        const nextIdx = prev + 1;
        return nextIdx >= activeSequence.length ? 0 : nextIdx;
      });
      setTotalStepsTaken((prev) => prev + 1);
    },
    stepperRunning ? stepInterval : null
  );

  const resetStepper = () => {
    setStepperSequenceIndex(0);
    setTotalStepsTaken(0);
    setStepperRunning(false);
  };

  const manualStep = (direction: 'fwd' | 'rev') => {
    setStepperRunning(false);
    setStepperSequenceIndex((prev) => {
      if (direction === 'fwd') {
        const nextIdx = prev + 1;
        return nextIdx >= activeSequence.length ? 0 : nextIdx;
      } else {
        const prevIdx = prev - 1;
        return prevIdx < 0 ? activeSequence.length - 1 : prevIdx;
      }
    });
    setTotalStepsTaken((prev) => prev + (direction === 'fwd' ? 1 : -1));
  };

  return (
    <div className="min-h-screen bg-navy-dark text-slate-100 pb-16 font-sans selection:bg-emerald-accent/30 selection:text-white">
      {/* Top breadcrumb navigation */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          to="/"
          id="back-home-link"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO PORTAL
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Course Banner */}
        <div className="relative rounded-2xl border border-navy-light/60 bg-navy-light/20 p-6 md:p-8 overflow-hidden">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-emerald-accent/5 blur-3xl" />
          <div className="absolute left-1/4 bottom-0 h-32 w-32 rounded-full bg-amber-500/5 blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-accent font-semibold text-xs tracking-wider uppercase">
                <Activity className="h-4 w-4 animate-pulse" /> EEE 4145 Industrial Automation
              </div>
              <h1 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
                Industrial Automation <span className="text-emerald-accent">Suite</span>
              </h1>
              <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
                Advanced simulator suite covering Process PID Liquid Tank Control loops, Variable Frequency Drive (VFD) pump energy savings under Affinity Laws, and Stepper/BLDC Motor electromagnetic sequences.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-navy-dark/80 px-4 py-2 rounded-xl border border-navy-light/60 self-start md:self-auto font-mono text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-slate-300">SYSTEM: ONLINE</span>
            </div>
          </div>
        </div>

        {/* Modular Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-navy-light/60 pb-px" id="automation-tabs">
          <button
            onClick={() => setActiveTab('pid')}
            id="tab-pid"
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'pid'
                ? 'border-emerald-accent text-emerald-accent bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-navy-light/30'
            }`}
          >
            <Sliders className="h-4 w-4" /> Tank PID Loop
          </button>
          <button
            onClick={() => setActiveTab('vfd')}
            id="tab-vfd"
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'vfd'
                ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-navy-light/30'
            }`}
          >
            <TrendingUp className="h-4 w-4" /> VFD Affinity Savings
          </button>
          <button
            onClick={() => setActiveTab('stepper')}
            id="tab-stepper"
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'stepper'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-navy-light/30'
            }`}
          >
            <Cpu className="h-4 w-4" /> Stepper Drive Sequencer
          </button>
        </div>

        {/* ====================================================================
            TAB 1: TANK LEVEL PID PROCESS CONTROL SIMULATOR
            ==================================================================== */}
        {activeTab === 'pid' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn" id="pid-simulator-section">
            {/* Control Panel Card */}
            <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 rounded-2xl p-6 space-y-6 flex flex-col justify-between" id="pid-controls-card">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-navy-light/40">
                  <div className="flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-emerald-accent" />
                    <h3 className="font-display font-bold text-white text-sm uppercase tracking-wide">PID Controllers</h3>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-accent px-2 py-0.5 rounded-md border border-emerald-500/20">CLOSED LOOP</span>
                </div>

                {/* Target Setpoint Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-mono">Target Setpoint (SP)</span>
                    <span className="text-emerald-accent font-bold font-mono">{setpoint}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={setpoint}
                    onChange={(e) => setSetpoint(Number(e.target.value))}
                    className="w-full h-1.5 bg-navy-dark rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                    id="setpoint-slider"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>10%</span>
                    <span>50%</span>
                    <span>90%</span>
                  </div>
                </div>

                {/* Kp Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-mono">Proportional Gain (Kp)</span>
                    <span className="text-white font-bold font-mono">{kp.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={kp}
                    onChange={(e) => setKp(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-navy-dark rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                    id="kp-slider"
                  />
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Reacts to immediate current error. High values speed response but risk overshoot and oscillation.
                  </p>
                </div>

                {/* Ki Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-mono">Integral Gain (Ki)</span>
                    <span className="text-white font-bold font-mono">{ki.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="0.05"
                    value={ki}
                    onChange={(e) => setKi(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-navy-dark rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                    id="ki-slider"
                  />
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Eliminates steady-state offset by integrating accumulated historic error over time.
                  </p>
                </div>

                {/* Kd Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-mono">Derivative Gain (Kd)</span>
                    <span className="text-white font-bold font-mono">{kd.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.01"
                    value={kd}
                    onChange={(e) => setKd(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-navy-dark rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                    id="kd-slider"
                  />
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Predicts future errors by assessing the current rate of error change. Dampens oscillations.
                  </p>
                </div>

                {/* Disturbance / Valve Leakage Toggle */}
                <div className="bg-navy-dark/50 border border-navy-light/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`h-4 w-4 ${disturbance ? 'text-rose-400 animate-bounce' : 'text-slate-500'}`} />
                      <span className="text-xs font-mono font-bold text-slate-300">Disturbance (Leakage Outflow)</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer" id="leak-toggle-label">
                      <input
                        type="checkbox"
                        checked={disturbance}
                        onChange={() => setDisturbance(!disturbance)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Instantly opens a secondary drain valve on the tank bottom to test the controller's robustness against load changes.
                  </p>
                </div>
              </div>

              {/* Loop Simulation Control Buttons */}
              <div className="pt-6 border-t border-navy-light/40 flex items-center gap-3">
                <button
                  onClick={() => setPidSimRunning(!pidSimRunning)}
                  id="pid-play-pause-btn"
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                    pidSimRunning
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-accent hover:bg-emerald-500/20'
                  }`}
                >
                  {pidSimRunning ? (
                    <>
                      <Pause className="h-4 w-4" /> Pause Loop
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" /> Start Loop
                    </>
                  )}
                </button>
                <button
                  onClick={resetPidSimulation}
                  id="pid-reset-btn"
                  className="p-2.5 rounded-xl border border-navy-light bg-navy-dark text-slate-400 hover:text-white hover:border-slate-600 transition-all"
                  title="Reset Simulation State"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Visual Tank & Real-Time Plots */}
            <div className="lg:col-span-8 space-y-8">
              {/* Dynamic Readouts & SVG Live Tank */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* SVG Visualizer (5 columns) */}
                <div className="md:col-span-5 bg-navy-card border border-navy-light/60 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[360px]" id="tank-svg-card">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 text-center">Process Dynamic SVG Tank</h4>

                  <svg width="240" height="290" viewBox="0 0 240 290" className="overflow-visible" id="tank-svg">
                    {/* Definitions for Gradients */}
                    <defs>
                      <linearGradient id="fluidGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
                        <stop offset="60%" stopColor="#0369a1" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#075985" stopOpacity="1" />
                      </linearGradient>
                      <linearGradient id="tankBorder" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#334155" />
                        <stop offset="50%" stopColor="#1e293b" />
                        <stop offset="100%" stopColor="#334155" />
                      </linearGradient>
                    </defs>

                    {/* Tank Metallic Legs / Supports */}
                    <rect x="55" y="250" width="10" height="30" fill="#475569" rx="2" />
                    <rect x="175" y="250" width="10" height="30" fill="#475569" rx="2" />
                    <rect x="50" y="275" width="140" height="5" fill="#334155" rx="1" />

                    {/* Animated Inflow Pipe Water Stream (Behind tank front wall) */}
                    {controlOutput > 0.5 && (
                      <line
                        x1="70"
                        y1="40"
                        x2="70"
                        y2={250 - (actualLevel / 100.0) * 200}
                        stroke="#38bdf8"
                        strokeWidth={Math.max(2, Math.min(8, (controlOutput / 100) * 8 + 1))}
                        strokeDasharray="6,4"
                        strokeDashoffset={tick * -4}
                        strokeLinecap="round"
                        id="inflow-water-stream"
                      />
                    )}

                    {/* Dynamic Liquid Pool Representation */}
                    {actualLevel > 0 && (
                      <g id="liquid-group">
                        {/* Wavy liquid body */}
                        <path
                          d={`
                            M 53 247
                            L 53 ${250 - (actualLevel / 100.0) * 200}
                            q 33 ${3 * Math.sin(tick * 0.4)}, 67 0
                            t 67 0
                            L 187 247
                            Z
                          `}
                          fill="url(#fluidGradient)"
                          className="transition-all duration-150"
                        />
                        {/* Highlight line on wave top */}
                        <path
                          d={`
                            M 53 ${250 - (actualLevel / 100.0) * 200}
                            q 33 ${3 * Math.sin(tick * 0.4)}, 67 0
                            t 67 0
                          `}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2"
                          className="transition-all duration-150"
                        />
                      </g>
                    )}

                    {/* Tank Outer Frame (High-contrast thick container) */}
                    <rect
                      x="50"
                      y="40"
                      width="140"
                      height="210"
                      rx="8"
                      fill="none"
                      stroke="url(#tankBorder)"
                      strokeWidth="6"
                      id="tank-body-outline"
                    />

                    {/* Level Grid Ticks inside the tank */}
                    {[25, 50, 75].map((t) => {
                      const tickY = 250 - (t / 100) * 200;
                      return (
                        <g key={t} opacity="0.3">
                          <line x1="50" y1={tickY} x2="65" y2={tickY} stroke="#94a3b8" strokeWidth="1.5" />
                          <line x1="175" y1={tickY} x2="190" y2={tickY} stroke="#94a3b8" strokeWidth="1.5" />
                          <text x="75" y={tickY + 4} fill="#94a3b8" fontSize="9" className="font-mono">{t}%</text>
                        </g>
                      );
                    })}

                    {/* Inlet Water Pipe */}
                    <path
                      d="M 15 25 L 70 25 L 70 40"
                      fill="none"
                      stroke="#475569"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 15 25 L 70 25 L 70 40"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    {/* Animated inflow arrow */}
                    {controlOutput > 0.5 && (
                      <circle cx="40" cy="25" r="2" fill="#38bdf8" className="animate-ping" />
                    )}

                    {/* Drain Outlet Water Pipe */}
                    <path
                      d="M 187 235 L 215 235 L 215 270"
                      fill="none"
                      stroke="#475569"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 187 235 L 215 235 L 215 270"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />

                    {/* Animated Outflow stream dripping from outlet */}
                    {actualLevel > 1 && (
                      <line
                        x1="215"
                        y1="270"
                        x2="215"
                        y2="285"
                        stroke="#38bdf8"
                        strokeWidth={Math.max(2, Math.min(6, (outflowRate / 15) * 6 + 1))}
                        strokeDasharray="4,3"
                        strokeDashoffset={tick * 3}
                        id="drain-outflow-stream"
                      />
                    )}

                    {/* Disturbance Leakage Overlay (Spraying water from crack on the bottom-left of the tank) */}
                    {disturbance && (
                      <g id="leakage-spray-group">
                        {/* Crack indicator */}
                        <path d="M 47 220 L 53 222 L 50 226" fill="none" stroke="#ef4444" strokeWidth="2" />
                        <circle cx="50" cy="223" r="3" fill="#ef4444" className="animate-ping" />
                        {/* Spraying water path */}
                        <path
                          d={`M 50 223 Q ${25 + Math.sin(tick) * 5} ${230 + Math.cos(tick) * 3} 10 250`}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="3"
                          strokeDasharray="5,3"
                          strokeDashoffset={tick * 5}
                        />
                      </g>
                    )}

                    {/* Float Level Sensor Ball */}
                    <circle cx="120" cy={250 - (actualLevel / 100.0) * 200} r="7" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" className="transition-all duration-150" />
                    <line x1="120" y1="20" x2="120" y2={250 - (actualLevel / 100.0) * 200} stroke="#475569" strokeWidth="1.5" strokeDasharray="2,2" className="transition-all duration-150" />
                  </svg>
                </div>

                {/* Digital Readouts (7 columns) */}
                <div className="md:col-span-7 space-y-6 flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-4" id="pid-telemetry-grid">
                    {/* Level Gauge Readout */}
                    <div className="bg-navy-card border border-navy-light/60 rounded-xl p-4 flex flex-col justify-center">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-mono mb-1">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        <span>Actual Level (PV)</span>
                      </div>
                      <div className="text-2xl font-display font-black text-white font-mono">
                        {actualLevel.toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Target Setpoint: {setpoint}%
                      </div>
                    </div>

                    {/* Control Output Gauge Readout */}
                    <div className="bg-navy-card border border-navy-light/60 rounded-xl p-4 flex flex-col justify-center">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-mono mb-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>Inlet Valve (MV)</span>
                      </div>
                      <div className="text-2xl font-display font-black text-emerald-accent font-mono">
                        {controlOutput}%
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Flow Capacity: {(controlOutput * 0.2).toFixed(2)} units/s
                      </div>
                    </div>

                    {/* Controller Error Readout */}
                    <div className="bg-navy-card border border-navy-light/60 rounded-xl p-4 flex flex-col justify-center">
                      <div className="text-slate-400 text-xs font-mono mb-1 flex justify-between">
                        <span>Current Error (e)</span>
                        <span className="font-semibold text-slate-300">SP - PV</span>
                      </div>
                      <div className={`text-2xl font-display font-black font-mono ${Math.abs(setpoint - actualLevel) < 2 ? 'text-emerald-400' : 'text-amber-500'}`}>
                        {(setpoint - actualLevel).toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Deviation margin: {Math.abs(setpoint - actualLevel).toFixed(1)}%
                      </div>
                    </div>

                    {/* Fluid Outflow Readout */}
                    <div className="bg-navy-card border border-navy-light/60 rounded-xl p-4 flex flex-col justify-center">
                      <div className="text-slate-400 text-xs font-mono mb-1 flex justify-between">
                        <span>Drain Outflow (Q_out)</span>
                        {disturbance && <span className="text-rose-400 text-[10px] animate-pulse">LEAK ON</span>}
                      </div>
                      <div className="text-2xl font-display font-black text-sky-400 font-mono">
                        {outflowRate} units/s
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Hydrostatic gravity: {(0.65 * Math.sqrt(actualLevel)).toFixed(2)} u/s
                      </div>
                    </div>
                  </div>

                  {/* System Block Diagram representation */}
                  <div className="bg-navy-card/40 border border-navy-light/60 rounded-xl p-5 space-y-4">
                    <h5 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wide flex items-center gap-2">
                      <Info className="h-4 w-4 text-emerald-accent" /> Control System Block Diagram
                    </h5>
                    <div className="flex flex-col sm:flex-row items-center gap-3 text-center text-[10px] font-mono font-bold">
                      <div className="bg-navy-dark px-3 py-2 rounded-lg border border-navy-light text-amber-500">
                        Setpoint<br />({setpoint}%)
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600 hidden sm:block" />
                      <div className="bg-navy-dark px-3 py-2 rounded-lg border border-navy-light text-rose-400">
                        Error (e)<br />{((setpoint - actualLevel).toFixed(1))}%
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600 hidden sm:block" />
                      <div className="bg-navy-dark px-3 py-2 rounded-lg border border-navy-light text-emerald-accent">
                        PID Controller<br />MV ({controlOutput}%)
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600 hidden sm:block" />
                      <div className="bg-navy-dark px-3 py-2 rounded-lg border border-navy-light text-sky-400">
                        Process Tank<br />PV ({actualLevel}%)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recharts Strip Chart */}
              <div className="bg-navy-card border border-navy-light/60 rounded-2xl p-6" id="pid-chart-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-navy-light/40">
                  <div>
                    <h4 className="text-sm font-display font-bold text-white uppercase tracking-wider">Dynamic Strip-Chart Recorder</h4>
                    <p className="text-[11px] text-slate-500">Plotting real-time response curve of Target Setpoint vs. Process Level.</p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-5 rounded bg-amber-500 border border-amber-400 inline-block" />
                      <span className="text-slate-300">Setpoint (SP)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-5 rounded bg-blue-500 border border-blue-400 inline-block" />
                      <span className="text-slate-300">Actual Level (PV)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-5 rounded bg-emerald-500 border border-emerald-400 inline-block" />
                      <span className="text-slate-300">Valve Control (MV)</span>
                    </div>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pidHistory} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1E293B', borderRadius: '12px' }}
                        labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}
                        itemStyle={{ fontFamily: 'monospace', fontSize: '11px' }}
                      />
                      <Line type="monotone" dataKey="setpoint" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" name="Setpoint" dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="actualLevel" stroke="#3b82f6" strokeWidth={2.5} name="Actual Level" dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="controlOutput" stroke="#10B981" strokeWidth={1} strokeOpacity={0.65} name="Valve Open %" dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 2: VFD PUMP ENERGY SAVINGS & AFFINITY LAW CALCULATOR
            ==================================================================== */}
        {activeTab === 'vfd' && (
          <div className="space-y-8 animate-fadeIn" id="vfd-simulator-section">
            {/* Success Summary Card prominent at top */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden" id="vfd-savings-banner">
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-accent">
                  <Gauge className="h-8 w-8 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-display font-black text-xl text-white">Annual Industrial Energy Conservation</h4>
                  <p className="text-xs text-slate-400">
                    Calculations verified under standard Hydraulic Pump Affinity Laws. Flow demand throttled to <span className="text-emerald-accent font-bold">{flowDemand}%</span>.
                  </p>
                </div>
              </div>
              <div className="text-right md:border-l border-emerald-500/20 md:pl-8 flex flex-col justify-center items-end self-stretch">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Prominent Savings</span>
                <span className="text-3xl font-display font-black text-emerald-400 font-mono">
                  ${vfdCalculation.savings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-mono text-emerald-accent font-bold mt-1">
                  Saved {vfdCalculation.reductionPercent}% Energy ({vfdCalculation.kwhSaved.toLocaleString()} kWh/yr)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Inputs Form */}
              <div className="lg:col-span-5 bg-navy-card border border-navy-light/60 rounded-2xl p-6 space-y-6" id="vfd-inputs-card">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/40">
                  <Settings className="h-4 w-4 text-amber-500" />
                  <h3 className="font-display font-bold text-white text-sm uppercase tracking-wide">Flow Process Parameters</h3>
                </div>

                {/* Motor Rated Power */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Motor Rated Power</span>
                    <span className="text-white font-bold">{ratedPower} kW</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="350"
                    step="5"
                    value={ratedPower}
                    onChange={(e) => setRatedPower(Number(e.target.value))}
                    className="w-full h-1.5 bg-navy-dark rounded-lg appearance-none cursor-pointer accent-amber-500"
                    id="rated-power-slider"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>5 kW</span>
                    <span>175 kW</span>
                    <span>350 kW</span>
                  </div>
                </div>

                {/* Annual Operating Hours */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Annual Run Time</span>
                    <span className="text-white font-bold">{operatingHours} Hrs</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="8760"
                    step="100"
                    value={operatingHours}
                    onChange={(e) => setOperatingHours(Number(e.target.value))}
                    className="w-full h-1.5 bg-navy-dark rounded-lg appearance-none cursor-pointer accent-amber-500"
                    id="hours-slider"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>500 h</span>
                    <span>4,630 h</span>
                    <span>8,760 h (Continuous)</span>
                  </div>
                </div>

                {/* Flow Rate Demand */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Process Flow Demand</span>
                    <span className="text-amber-400 font-bold">{flowDemand}% Flow</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={flowDemand}
                    onChange={(e) => setFlowDemand(Number(e.target.value))}
                    className="w-full h-1.5 bg-navy-dark rounded-lg appearance-none cursor-pointer accent-amber-500"
                    id="flow-demand-slider"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>50% (Min limit)</span>
                    <span>75%</span>
                    <span>100% (Full Capacity)</span>
                  </div>
                </div>

                {/* Electricity Tariff */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Electricity Tariff Rate</span>
                    <span className="text-white font-bold">${tariff.toFixed(2)} / kWh</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.45"
                    step="0.01"
                    value={tariff}
                    onChange={(e) => setTariff(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-navy-dark rounded-lg appearance-none cursor-pointer accent-amber-500"
                    id="tariff-slider"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>$0.05</span>
                    <span>$0.25</span>
                    <span>$0.45</span>
                  </div>
                </div>

                {/* Affinity Laws Theory Card */}
                <div className="bg-navy-dark/40 border border-navy-light/60 rounded-xl p-4 space-y-2 text-xs leading-relaxed text-slate-400">
                  <p className="font-mono font-bold text-slate-300 text-[10px] uppercase tracking-wide flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-amber-500" /> Pump Affinity Equations
                  </p>
                  <p>
                    <strong>Affinity Law (Speed vs Power):</strong> Shaft power drawn by a centrifugal pump scales with the <em>cube of speed</em>:
                  </p>
                  <div className="bg-navy-dark/70 p-2 rounded border border-navy-light/80 font-mono text-center text-amber-400 text-xs my-2">
                    P₂ / P₁ = (N₂ / N₁)³ = (Q₂ / Q₁)³
                  </div>
                  <p>
                    Centrifugal mechanical throttling restricts flow at constant speed, causing pressure head buildup. Shaft power is barely reduced, remaining linear:
                  </p>
                  <div className="bg-navy-dark/70 p-2 rounded border border-navy-light/80 font-mono text-center text-rose-400 text-xs mt-2">
                    P_Valve = P_Rated × (0.6 + 0.4 × Q_demand)
                  </div>
                </div>
              </div>

              {/* Outputs Charts and Telemetry */}
              <div className="lg:col-span-7 space-y-6">
                {/* Visual Comparative Bars */}
                <div className="bg-navy-card border border-navy-light/60 rounded-2xl p-6" id="vfd-chart-card">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-navy-light/40 pb-2">Annual Operating Expense Comparison</h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Throttling Valve', Cost: vfdCalculation.costValve, Energy: vfdCalculation.energyValve, fill: '#ef4444' },
                          { name: 'VFD Control', Cost: vfdCalculation.costVFD, Energy: vfdCalculation.energyVFD, fill: '#10b981' }
                        ]}
                        margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} label={{ value: 'Annual Expense ($)', angle: -90, position: 'insideLeft', offset: -10, fill: '#64748b', fontSize: 11 }} />
                        <Tooltip
                          cursor={{ fill: '#1e293b', opacity: 0.2 }}
                          contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1E293B', borderRadius: '12px' }}
                          itemStyle={{ fontFamily: 'monospace', fontSize: '12px' }}
                          formatter={(value: any) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Annual Cost']}
                        />
                        <Bar dataKey="Cost" radius={[8, 8, 0, 0]}>
                          {/* Custom color mapping inside series */}
                          <line x1="0" y1="0" x2="0" y2="0" /> {/* Dummy tag to prevent TS empty structure */}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Technical Energy Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" id="vfd-telemetry-grid">
                  <div className="bg-navy-card border border-navy-light/60 rounded-xl p-4">
                    <div className="text-slate-500 font-mono text-[10px] uppercase mb-1">Demand Shaft Power</div>
                    <div className="space-y-1">
                      <div className="text-lg font-mono font-bold text-rose-400">
                        Valve: {vfdCalculation.pValve} kW
                      </div>
                      <div className="text-lg font-mono font-bold text-emerald-400">
                        VFD: {vfdCalculation.pVFD} kW
                      </div>
                    </div>
                  </div>

                  <div className="bg-navy-card border border-navy-light/60 rounded-xl p-4">
                    <div className="text-slate-500 font-mono text-[10px] uppercase mb-1">Annual Consumption</div>
                    <div className="space-y-1 font-mono text-xs">
                      <p className="text-slate-300">
                        Valve: <span className="font-bold">{vfdCalculation.energyValve.toLocaleString()} kWh</span>
                      </p>
                      <p className="text-slate-300">
                        VFD: <span className="font-bold text-emerald-400">{vfdCalculation.energyVFD.toLocaleString()} kWh</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-navy-card border border-navy-light/60 rounded-xl p-4 flex flex-col justify-between">
                    <div className="text-slate-500 font-mono text-[10px] uppercase mb-1">CO₂ Offset Reduction</div>
                    <div>
                      <div className="text-2xl font-mono font-black text-sky-400">
                        {vfdCalculation.co2Saved} Tons
                      </div>
                      <p className="text-[9px] text-slate-500 mt-0.5">Greenhouse gas offset per year</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 3: STEPPER MOTOR SEQUENCE VISUALIZER
            ==================================================================== */}
        {activeTab === 'stepper' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn" id="stepper-simulator-section">
            {/* Left Stator Controls and Drive Code */}
            <div className="lg:col-span-5 bg-navy-card border border-navy-light/60 rounded-2xl p-6 space-y-6 flex flex-col justify-between" id="stepper-controls-card">
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/40">
                  <Cpu className="h-4 w-4 text-cyan-400" />
                  <h3 className="font-display font-bold text-white text-sm uppercase tracking-wide">Drive Configurations</h3>
                </div>

                {/* Drive Mode Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-400">Excitation Mode (Sequence Type)</label>
                  <div className="grid grid-cols-3 gap-2" id="drive-mode-selector">
                    <button
                      onClick={() => { setDriveMode('wave'); setStepperSequenceIndex(0); }}
                      className={`py-2 px-3 rounded-lg text-[10px] font-mono font-bold tracking-tight uppercase border transition-all ${
                        driveMode === 'wave'
                          ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400'
                          : 'bg-navy-dark border-navy-light/80 text-slate-400 hover:text-white'
                      }`}
                    >
                      Wave Drive
                    </button>
                    <button
                      onClick={() => { setDriveMode('full'); setStepperSequenceIndex(0); }}
                      className={`py-2 px-3 rounded-lg text-[10px] font-mono font-bold tracking-tight uppercase border transition-all ${
                        driveMode === 'full'
                          ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400'
                          : 'bg-navy-dark border-navy-light/80 text-slate-400 hover:text-white'
                      }`}
                    >
                      Full Step
                    </button>
                    <button
                      onClick={() => { setDriveMode('half'); setStepperSequenceIndex(0); }}
                      className={`py-2 px-3 rounded-lg text-[10px] font-mono font-bold tracking-tight uppercase border transition-all ${
                        driveMode === 'half'
                          ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400'
                          : 'bg-navy-dark border-navy-light/80 text-slate-400 hover:text-white'
                      }`}
                    >
                      Half Step
                    </button>
                  </div>
                </div>

                {/* Velocity Frequency / Step Speed Interval */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Step Interval (Delay)</span>
                    <span className="text-cyan-400 font-bold">{stepInterval} ms / step</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="1500"
                    step="50"
                    value={stepInterval}
                    onChange={(e) => setStepInterval(Number(e.target.value))}
                    className="w-full h-1.5 bg-navy-dark rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    id="step-interval-slider"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>100 ms (Fast)</span>
                    <span>800 ms</span>
                    <span>1500 ms (Slow)</span>
                  </div>
                </div>

                {/* High fidelity State Digital Logic Levels Display */}
                <div className="bg-navy-dark/40 border border-navy-light/60 rounded-xl p-4 space-y-3" id="excitation-levels-display">
                  <h4 className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">Excitation Phase Logic Outputs</h4>
                  <div className="grid grid-cols-4 gap-2 font-mono text-center">
                    <div className={`p-2 rounded border transition-all ${activePhases[0] === 1 ? 'bg-amber-500/10 border-amber-400 text-amber-400' : 'bg-navy-dark/80 border-navy-light/60 text-slate-600'}`}>
                      <div className="text-[9px]">Phase A</div>
                      <div className="text-lg font-bold">{activePhases[0]}</div>
                    </div>
                    <div className={`p-2 rounded border transition-all ${activePhases[1] === 1 ? 'bg-rose-500/10 border-rose-400 text-rose-400' : 'bg-navy-dark/80 border-navy-light/60 text-slate-600'}`}>
                      <div className="text-[9px]">Phase B</div>
                      <div className="text-lg font-bold">{activePhases[1]}</div>
                    </div>
                    <div className={`p-2 rounded border transition-all ${activePhases[2] === 1 ? 'bg-amber-500/10 border-amber-400 text-amber-400' : 'bg-navy-dark/80 border-navy-light/60 text-slate-600'}`}>
                      <div className="text-[9px]">Phase A'</div>
                      <div className="text-lg font-bold">{activePhases[2]}</div>
                    </div>
                    <div className={`p-2 rounded border transition-all ${activePhases[3] === 1 ? 'bg-rose-500/10 border-rose-400 text-rose-400' : 'bg-navy-dark/80 border-navy-light/60 text-slate-600'}`}>
                      <div className="text-[9px]">Phase B'</div>
                      <div className="text-lg font-bold">{activePhases[3]}</div>
                    </div>
                  </div>
                </div>

                {/* Excitation Binary State Table */}
                <div className="border border-navy-light/60 rounded-xl overflow-hidden text-[10px] font-mono" id="excitation-table-card">
                  <div className="bg-navy-dark px-3 py-2 border-b border-navy-light/60 text-slate-400 font-bold uppercase tracking-wide">
                    Sequence Step Binary Registers
                  </div>
                  <div className="divide-y divide-navy-light/40 bg-navy-dark/20">
                    {activeSequence.map((seq, idx) => (
                      <div
                        key={idx}
                        className={`grid grid-cols-6 px-3 py-1.5 transition-all ${
                          stepperSequenceIndex === idx
                            ? 'bg-cyan-500/10 text-cyan-300 font-bold border-l-2 border-cyan-400'
                            : 'text-slate-500'
                        }`}
                      >
                        <span className="col-span-2">Step {idx}</span>
                        <span>{seq[0]}</span>
                        <span>{seq[1]}</span>
                        <span>{seq[2]}</span>
                        <span>{seq[3]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-navy-light/40 flex items-center gap-3">
                <button
                  onClick={() => setStepperRunning(!stepperRunning)}
                  id="stepper-play-pause-btn"
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                    stepperRunning
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                      : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
                  }`}
                >
                  {stepperRunning ? (
                    <>
                      <Pause className="h-4 w-4" /> Pause Drive
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" /> Run Drive
                    </>
                  )}
                </button>
                <button
                  onClick={() => manualStep('rev')}
                  id="stepper-prev-btn"
                  className="p-2.5 rounded-xl border border-navy-light bg-navy-dark text-slate-400 hover:text-white hover:border-slate-600 transition-all"
                  title="Manual Step Backward"
                  disabled={stepperRunning}
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </button>
                <button
                  onClick={() => manualStep('fwd')}
                  id="stepper-next-btn"
                  className="p-2.5 rounded-xl border border-navy-light bg-navy-dark text-slate-400 hover:text-white hover:border-slate-600 transition-all"
                  title="Manual Step Forward"
                  disabled={stepperRunning}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={resetStepper}
                  id="stepper-reset-btn"
                  className="p-2.5 rounded-xl border border-navy-light bg-navy-dark text-slate-400 hover:text-white hover:border-slate-600 transition-all"
                  title="Reset Sequencer"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Right SVG Top-Down Motor Animation & Physics Telemetry */}
            <div className="lg:col-span-7 bg-navy-card border border-navy-light/60 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center justify-center min-h-[380px]" id="stepper-visualizer-card">
              {/* Top-down SVG Motor representation */}
              <div className="flex-1 flex flex-col items-center">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-6 text-center">Top-down Stepper Motor 2D Simulator</h4>

                <svg width="270" height="270" viewBox="0 0 270 270" className="overflow-visible" id="stepper-svg">
                  {/* Define Glowing Filters for energized coils */}
                  <defs>
                    <filter id="coilGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Outer Steel Stator Body housing */}
                  <circle cx="135" cy="135" r="115" fill="#0b1329" stroke="#334155" strokeWidth="8" />
                  <circle cx="135" cy="135" r="95" fill="none" stroke="#1e293b" strokeWidth="3" />

                  {/* Rotating magnetic flux visualizer lines (from active stator poles to rotor) */}
                  {activePhases[0] === 1 && (
                    <line x1="135" y1="50" x2="135" y2="100" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,3" className="opacity-70 animate-pulse" />
                  )}
                  {activePhases[1] === 1 && (
                    <line x1="220" y1="135" x2="170" y2="135" stroke="#ef4444" strokeWidth="2" strokeDasharray="3,3" className="opacity-70 animate-pulse" />
                  )}
                  {activePhases[2] === 1 && (
                    <line x1="135" y1="220" x2="135" y2="170" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,3" className="opacity-70 animate-pulse" />
                  )}
                  {activePhases[3] === 1 && (
                    <line x1="50" y1="135" x2="100" y2="135" stroke="#ef4444" strokeWidth="2" strokeDasharray="3,3" className="opacity-70 animate-pulse" />
                  )}

                  {/* Stator Pole A: Top (0° / 360°) */}
                  <g id="stator-pole-a">
                    <rect x="120" y="25" width="30" height="40" rx="4" fill={activePhases[0] === 1 ? '#d97706' : '#334155'} filter={activePhases[0] === 1 ? 'url(#coilGlow)' : undefined} className="transition-all duration-150" />
                    {/* Winding coil detail lines */}
                    <path d="M 120 33 H 150 M 120 41 H 150 M 120 49 H 150 M 120 57 H 150" stroke={activePhases[0] === 1 ? '#fef08a' : '#1e293b'} strokeWidth="1.5" />
                    <text x="135" y="18" fill={activePhases[0] === 1 ? '#fbbf24' : '#64748b'} fontSize="10" className="font-mono font-bold" textAnchor="middle">Phase A</text>
                  </g>

                  {/* Stator Pole B: Right (90°) */}
                  <g id="stator-pole-b">
                    <rect x="205" y="120" width="40" height="30" rx="4" fill={activePhases[1] === 1 ? '#b91c1c' : '#334155'} filter={activePhases[1] === 1 ? 'url(#coilGlow)' : undefined} className="transition-all duration-150" />
                    {/* Winding coil detail lines */}
                    <path d="M 213 120 V 150 M 221 120 V 150 M 229 120 V 150 M 237 120 V 150" stroke={activePhases[1] === 1 ? '#fca5a5' : '#1e293b'} strokeWidth="1.5" />
                    <text x="235" y="166" fill={activePhases[1] === 1 ? '#f87171' : '#64748b'} fontSize="10" className="font-mono font-bold rotate-90" style={{ transformOrigin: '235px 166px' }} textAnchor="middle">Phase B</text>
                  </g>

                  {/* Stator Pole A': Bottom (180°) */}
                  <g id="stator-pole-a-prime">
                    <rect x="120" y="205" width="30" height="40" rx="4" fill={activePhases[2] === 1 ? '#d97706' : '#334155'} filter={activePhases[2] === 1 ? 'url(#coilGlow)' : undefined} className="transition-all duration-150" />
                    {/* Winding coil detail lines */}
                    <path d="M 120 213 H 150 M 120 221 H 150 M 120 229 H 150 M 120 237 H 150" stroke={activePhases[2] === 1 ? '#fef08a' : '#1e293b'} strokeWidth="1.5" />
                    <text x="135" y="260" fill={activePhases[2] === 1 ? '#fbbf24' : '#64748b'} fontSize="10" className="font-mono font-bold" textAnchor="middle">Phase A'</text>
                  </g>

                  {/* Stator Pole B': Left (270°) */}
                  <g id="stator-pole-b-prime">
                    <rect x="25" y="120" width="40" height="30" rx="4" fill={activePhases[3] === 1 ? '#b91c1c' : '#334155'} filter={activePhases[3] === 1 ? 'url(#coilGlow)' : undefined} className="transition-all duration-150" />
                    {/* Winding coil detail lines */}
                    <path d="M 33 120 V 150 M 41 120 V 150 M 49 120 V 150 M 57 120 V 150" stroke={activePhases[3] === 1 ? '#fca5a5' : '#1e293b'} strokeWidth="1.5" />
                    <text x="35" y="166" fill={activePhases[3] === 1 ? '#f87171' : '#64748b'} fontSize="10" className="font-mono font-bold rotate-90" style={{ transformOrigin: '35px 166px' }} textAnchor="middle">Phase B'</text>
                  </g>

                  {/* Magnetized ROTOR (Will physically rotate to target poles) */}
                  <g
                    style={{
                      transform: `rotate(${rotorAngle}deg)`,
                      transformOrigin: '135px 135px',
                      transition: driveMode === 'half' ? 'transform 0.15s ease-out' : 'transform 0.08s cubic-bezier(0.18, 0.89, 0.32, 1.28)'
                    }}
                    id="rotor-group"
                  >
                    {/* North Pole half (Amber/Orange red color) */}
                    <path d="M 85 135 A 50 50 0 0 1 185 135 Z" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1.5" />
                    <text x="135" y="112" fill="#ffffff" fontSize="13" className="font-mono font-black" textAnchor="middle">N</text>

                    {/* South Pole half (Blue slate color) */}
                    <path d="M 185 135 A 50 50 0 0 1 85 135 Z" fill="#2563eb" stroke="#1e3a8a" strokeWidth="1.5" />
                    <text x="135" y="162" fill="#ffffff" fontSize="13" className="font-mono font-black" textAnchor="middle">S</text>

                    {/* Core Iron center shaft rotor disc */}
                    <circle cx="135" cy="135" r="16" fill="#1e293b" stroke="#475569" strokeWidth="3" />
                    <circle cx="135" cy="135" r="6" fill="#0f172a" />
                  </g>
                </svg>
              </div>

              {/* Angle & Step Speed Telemetry */}
              <div className="w-full md:w-48 bg-navy-dark/60 rounded-xl p-4 flex flex-col justify-center border border-navy-light/60 space-y-4" id="stepper-telemetry">
                <div className="text-center pb-2 border-b border-navy-light/40">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Rotor Direction</span>
                  <div className="text-xs font-mono font-black text-cyan-400 mt-1">CLOCKWISE (CW)</div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Rotor Orientation</span>
                  <div className="text-2xl font-mono font-black text-white">
                    {rotorAngle}°
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Magnetic step: {(rotorAngle / 360).toFixed(2)} revs
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Total Pulse Cycles</span>
                  <div className="text-2xl font-mono font-black text-slate-300">
                    {totalStepsTaken} steps
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Mode resolution: {driveMode === 'half' ? '45°/step' : '90°/step'}
                  </span>
                </div>

                <div className="bg-navy-dark border border-navy-light rounded-lg p-2.5 text-[10px] font-mono leading-relaxed text-slate-400">
                  <span className="font-bold text-white uppercase block mb-1">State Vector</span>
                  [ {activePhases.join(' , ')} ]
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
