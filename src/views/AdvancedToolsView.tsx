import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMotorMath } from '../hooks/useMotorMath';
import { usePowerElectronics, ConverterType } from '../hooks/usePowerElectronics';
import { useTransmissionLine } from '../hooks/useTransmissionLine';
import { IEEEReportButton } from '../components/IEEEReportButton';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  Zap,
  Cpu,
  Activity,
  Sliders,
  Play,
  RotateCcw,
  BookOpen,
  Info,
  Wrench,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';

export default function AdvancedToolsView() {
  const [activeTab, setActiveTab] = useState<'motor' | 'converter' | 'pid' | 'transmission'>('motor');

  // 1. Motor Math Hooks
  const {
    inputs: motorIn,
    setInputs: setMotorIn,
    outputs: motorOut,
  } = useMotorMath({
    frequency: 50,
    poles: 4,
    rotorSpeed: 1440,
  });

  // 2. Power Electronics Designer Hooks
  const {
    inputs: converterIn,
    setInputs: setConverterIn,
    outputs: converterOut,
  } = usePowerElectronics({
    type: 'buck',
    vin: 12,
    vout: 5,
    fs: 100, // 100 kHz
    iout: 2, // 2 Amps
    voltageRipplePercent: 1.0, // 1%
    currentRipplePercent: 30, // 30%
  });

  // 3. PID Controller Visualizer State & Simulation
  const [kp, setKp] = useState<number>(3.0);
  const [ki, setKi] = useState<number>(1.5);
  const [kd, setKd] = useState<number>(0.2);

  const pidData = useMemo(() => {
    const data = [];
    const dt = 0.04;
    const tMax = 5.0;
    
    // Plant characteristics: standard underdamped second-order system
    const wn = 3.5;  // natural frequency
    const zeta = 0.35; // damping ratio
    
    // Simulation state
    let y = 0;   // system output
    let dy = 0;  // derivative of output
    let integralE = 0;
    let prevE = 1.0;

    for (let t = 0; t <= tMax; t += dt) {
      const r = 1.0; // Unit Step Input
      const e = r - y;
      
      integralE += e * dt;
      // Clamp to prevent integration windup
      integralE = Math.max(-4, Math.min(4, integralE));
      
      const de = (e - prevE) / dt;
      prevE = e;

      // Controller law
      let u = kp * e + ki * integralE + kd * de;
      u = Math.max(-10, Math.min(10, u)); // actuator saturation

      // ODE: d2y/dt2 = wn^2 * (u - y) - 2 * zeta * wn * dy/dt
      const d2y = Math.pow(wn, 2) * (u - y) - 2 * zeta * wn * dy;
      
      dy += d2y * dt;
      y += dy * dt;

      // stability limit guards
      if (isNaN(y) || Math.abs(y) > 20) {
        y = y > 0 ? 2.5 : -0.5;
      }

      data.push({
        time: t.toFixed(2),
        'Set Point': r,
        'System Output': parseFloat(y.toFixed(3)),
      });
    }
    return data;
  }, [kp, ki, kd]);

  // Determine PID characteristics
  const pidMetrics = useMemo(() => {
    let peak = 0;
    let settlingTime = 'N/A';
    let steadyStateError = 0;

    const values = pidData.map(d => d['System Output']);
    peak = Math.max(...values);
    const overshoot = Math.max(0, ((peak - 1.0) / 1.0) * 100);

    // Find settling time (within 5% of final value 1.0, so 0.95 to 1.05)
    for (let i = pidData.length - 1; i >= 0; i--) {
      const val = values[i];
      if (val < 0.95 || val > 1.05) {
        const timeVal = parseFloat(pidData[i].time);
        if (timeVal > 0) {
          settlingTime = `${(timeVal + 0.04).toFixed(2)}s`;
        }
        break;
      }
    }
    if (settlingTime === 'N/A') settlingTime = '< 0.5s';

    steadyStateError = Math.abs(1.0 - values[values.length - 1]);

    return {
      overshoot: overshoot.toFixed(1),
      settlingTime,
      steadyStateError: (steadyStateError * 100).toFixed(1) + '%',
    };
  }, [pidData]);

  // 4. Transmission Line Hooks
  const {
    inputs: transIn,
    setInputs: setTransIn,
    outputs: transOut,
  } = useTransmissionLine({
    vs: 11, // 11 kV Line-to-Line
    pLoad: 2.0, // 2 MW
    qLoad: 1.2, // 1.2 MVAR
    r: 1.5, // 1.5 Ohms per phase
    x: 2.5, // 2.5 Ohms per phase
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO HOME
        </Link>
      </div>

      {/* Header section */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-emerald-accent/10 border border-emerald-accent/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-accent uppercase tracking-wider">
          <Activity className="h-4 w-4" /> Advanced Cores & Syllabus Modules
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
          Advanced Engineering Calculators Suite
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-3xl leading-relaxed">
          High-fidelity design analyzers calibrated for Upper-level Department of Electrical and Electronic Engineering courses.
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap gap-2 border-b border-navy-light/60 pb-1">
        {[
          { id: 'motor', label: 'Induction Motor Analyzer', subtitle: 'Electrical Machines' },
          { id: 'converter', label: 'DC-DC Converter Designer', subtitle: 'Power Electronics' },
          { id: 'pid', label: 'PID Controller Simulator', subtitle: 'Control Systems' },
          { id: 'transmission', label: 'Short Transmission Line', subtitle: 'Power Systems' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-3 rounded-xl border text-left transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-accent/10 border-emerald-accent/30 text-emerald-accent shadow-md'
                : 'bg-navy-card/40 border-navy-light/40 text-slate-400 hover:bg-navy-light/20 hover:text-white'
            }`}
          >
            <div className="text-xs font-bold font-display">{tab.label}</div>
            <div className="text-[10px] opacity-75 font-mono">{tab.subtitle}</div>
          </button>
        ))}
      </div>

      {/* TAB CONTENT SPACES */}
      <div className="bg-navy-card border border-navy-light p-6 sm:p-8 rounded-3xl shadow-xl min-h-[480px]">
        
        {/* 1. INDUCTION MOTOR ANALYZER */}
        {activeTab === 'motor' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="border-l-4 border-emerald-accent pl-4">
              <h2 className="text-xl font-bold text-white font-display">3-Phase Induction Motor Analyzer</h2>
              <p className="text-xs text-slate-400 mt-1">
                Computes synchronous rotating magnetic field frequency and slip ratios based on mechanical load velocities.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Inputs */}
              <div className="space-y-5 bg-navy-dark p-6 rounded-2xl border border-navy-light">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-navy-light pb-2">
                  <Sliders className="h-4 w-4 text-emerald-accent" /> Input Parameters
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Supply Frequency (f)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={motorIn.frequency}
                        onChange={(e) => setMotorIn({ ...motorIn, frequency: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-navy-card border border-navy-light rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-accent"
                        placeholder="e.g. 50"
                      />
                      <span className="absolute right-4 top-2.5 text-[10px] text-slate-500 font-mono">Hz</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Number of Poles (P)
                    </label>
                    <select
                      value={motorIn.poles}
                      onChange={(e) => setMotorIn({ ...motorIn, poles: parseInt(e.target.value) || 2 })}
                      className="w-full bg-navy-card border border-navy-light rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-accent"
                    >
                      {[2, 4, 6, 8, 10, 12].map((p) => (
                        <option key={p} value={p}>
                          {p} Poles
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Rotor Speed (Nr)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={motorIn.rotorSpeed}
                        onChange={(e) => setMotorIn({ ...motorIn, rotorSpeed: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-navy-card border border-navy-light rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-accent"
                        placeholder="e.g. 1440"
                      />
                      <span className="absolute right-4 top-2.5 text-[10px] text-slate-500 font-mono">RPM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Outputs & Results */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-end mb-4">
                  <IEEEReportButton
                    experimentName="Electrical Machines: 3-Phase Induction Motor Speed and Slip Analysis"
                    inputData={{
                      'Frequency (f)': motorIn.frequency + ' Hz',
                      'Number of Poles (P)': motorIn.poles,
                      'Rotor Speed (Nr)': motorIn.rotorSpeed + ' RPM'
                    }}
                    outputData={{
                      'Synchronous Speed (Ns)': motorOut.synchronousSpeed.toFixed(0) + ' RPM',
                      'Rotor Slip (s)': motorOut.slipPercentage + ' %',
                      'Induced Rotor Frequency (fr)': motorOut.frequencyRotor.toFixed(2) + ' Hz',
                      'Status': motorOut.status.toUpperCase()
                    }}
                  />
                </div>
                {motorOut.error ? (
                  <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-2xl flex gap-3 text-red-400">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <div className="text-xs space-y-1">
                      <span className="font-bold block">Validation Alert</span>
                      <p>{motorOut.error}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl flex gap-3 text-emerald-400">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <div className="text-xs space-y-1">
                      <span className="font-bold block">Physical State Locked</span>
                      <p>Rotor speeds validated. Standard motor operations computed successfully.</p>
                    </div>
                  </div>
                )}

                {/* Metric Display Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-navy-dark border border-navy-light p-5 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Synchronous Speed (Ns)
                    </span>
                    <span className="text-2xl font-extrabold text-white font-mono block">
                      {motorOut.synchronousSpeed.toFixed(0)} <span className="text-xs font-semibold text-slate-500">RPM</span>
                    </span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Magnetic field velocity generated by stator windings. Ns = 120f / P.
                    </p>
                  </div>

                  <div className="bg-navy-dark border border-navy-light p-5 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Rotor Slip (s)
                    </span>
                    <span className="text-2xl font-extrabold text-emerald-accent font-mono block">
                      {motorOut.slipPercentage}%
                    </span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Fractional delay between magnetic speed and physical rotor speed. s = (Ns - Nr) / Ns.
                    </p>
                  </div>

                  <div className="bg-navy-dark border border-navy-light p-5 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Induced Rotor Frequency (fr)
                    </span>
                    <span className="text-2xl font-extrabold text-white font-mono block">
                      {motorOut.frequencyRotor.toFixed(2)} <span className="text-xs font-semibold text-slate-500">Hz</span>
                    </span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Frequency of currents induced in the rotor cage. fr = s * f.
                    </p>
                  </div>

                  <div className="bg-navy-dark border border-navy-light p-5 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Operating Condition Mode
                    </span>
                    <span className="text-base font-extrabold text-white uppercase font-display block mt-1.5">
                      {motorOut.status === 'normal' && (
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                          Induction Motor
                        </span>
                      )}
                      {motorOut.status === 'stalled' && (
                        <span className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full border border-red-500/20">
                          Stalled Rotor
                        </span>
                      )}
                      {motorOut.status === 'generator' && (
                        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                          Asynchronous Gen.
                        </span>
                      )}
                      {motorOut.status === 'invalid' && (
                        <span className="px-3 py-1 bg-slate-500/10 text-slate-400 rounded-full border border-slate-500/20">
                          Invalid Bounds
                        </span>
                      )}
                    </span>
                    <p className="text-[10px] text-slate-500 leading-relaxed mt-2.5">
                      Classified dynamically based on slip value. Slip = 100% represents a locked rotor.
                    </p>
                  </div>
                </div>

                {/* Educational Theory Accordion or note */}
                <div className="bg-navy-dark/40 border border-navy-light p-4 rounded-xl flex gap-3 text-xs text-slate-400">
                  <Info className="h-5 w-5 text-emerald-accent shrink-0" />
                  <div className="space-y-1">
                    <span className="font-bold text-white block">Syllabus Insights (Electrical Machines)</span>
                    <p>
                      In physical 3-phase systems, rotor currents generate torque proportional to slip. An ideal rotor operating at perfect synchronous velocity (Nr = Ns) would experience no relative magnetic flux cutting, reducing induced currents and electromagnetic torque to zero.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. DC-DC CONVERTER DESIGNER */}
        {activeTab === 'converter' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="border-l-4 border-emerald-accent pl-4">
              <h2 className="text-xl font-bold text-white font-display">DC-DC Switched Converter Designer</h2>
              <p className="text-xs text-slate-400 mt-1">
                Calculates power component boundaries (minimum inductors and filtering capacitors) for Buck and Boost topologies.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Inputs block */}
              <div className="space-y-5 bg-navy-dark p-6 rounded-2xl border border-navy-light">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-navy-light pb-2">
                  <Sliders className="h-4 w-4 text-emerald-accent" /> Input Parameters
                </h3>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Topology Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setConverterIn({ ...converterIn, type: 'buck' })}
                        className={`py-2 rounded-xl border font-bold text-center transition-all ${
                          converterIn.type === 'buck'
                            ? 'bg-emerald-accent/10 border-emerald-accent/30 text-emerald-accent'
                            : 'bg-navy-card border-navy-light text-slate-400 hover:text-white'
                        }`}
                      >
                        Buck (Step Down)
                      </button>
                      <button
                        type="button"
                        onClick={() => setConverterIn({ ...converterIn, type: 'boost' })}
                        className={`py-2 rounded-xl border font-bold text-center transition-all ${
                          converterIn.type === 'boost'
                            ? 'bg-emerald-accent/10 border-emerald-accent/30 text-emerald-accent'
                            : 'bg-navy-card border-navy-light text-slate-400 hover:text-white'
                        }`}
                      >
                        Boost (Step Up)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">
                        Vin
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={converterIn.vin}
                          onChange={(e) => setConverterIn({ ...converterIn, vin: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                        />
                        <span className="absolute right-3 top-2 text-[10px] text-slate-500">V</span>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">
                        Vout
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={converterIn.vout}
                          onChange={(e) => setConverterIn({ ...converterIn, vout: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                        />
                        <span className="absolute right-3 top-2 text-[10px] text-slate-500">V</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">
                        Switch Freq (fs)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={converterIn.fs}
                          onChange={(e) => setConverterIn({ ...converterIn, fs: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                        />
                        <span className="absolute right-3 top-2 text-[10px] text-slate-500">kHz</span>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">
                        Output Current
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={converterIn.iout}
                          onChange={(e) => setConverterIn({ ...converterIn, iout: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                        />
                        <span className="absolute right-3 top-2 text-[10px] text-slate-500">A</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">
                        Target V Ripple
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={converterIn.voltageRipplePercent}
                          onChange={(e) => setConverterIn({ ...converterIn, voltageRipplePercent: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                        />
                        <span className="absolute right-3 top-2 text-[10px] text-slate-500">%</span>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">
                        Target I Ripple
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={converterIn.currentRipplePercent}
                          onChange={(e) => setConverterIn({ ...converterIn, currentRipplePercent: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                        />
                        <span className="absolute right-3 top-2 text-[10px] text-slate-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Outputs block */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-end mb-4">
                  <IEEEReportButton
                    experimentName={`Power Electronics: ${converterIn.type === 'buck' ? 'Buck' : 'Boost'} DC-DC Converter Design`}
                    inputData={{
                      'Topology': converterIn.type === 'buck' ? 'Buck (Step-Down)' : 'Boost (Step-Up)',
                      'Input Voltage (Vin)': converterIn.vin + ' V',
                      'Output Voltage (Vout)': converterIn.vout + ' V',
                      'Switching Frequency (fs)': converterIn.fs + ' kHz',
                      'Voltage Ripple Target': converterIn.voltageRipplePercent + ' %',
                      'Current Ripple Target': converterIn.currentRipplePercent + ' %'
                    }}
                    outputData={{
                      'Duty Cycle (D)': converterOut.dutyCycle.toString(),
                      'Duty Cycle %': converterOut.dutyCyclePercent.toString() + ' %',
                      'Min Inductor (Lmin)': converterOut.lMinCCM.toFixed(2) + ' μH',
                      'Output Capacitor (Cout)': converterOut.cOut.toFixed(2) + ' μF'
                    }}
                  />
                </div>
                {converterOut.error ? (
                  <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-2xl flex gap-3 text-red-400">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <div className="text-xs space-y-1">
                      <span className="font-bold block">Design Boundary Overstepped</span>
                      <p>{converterOut.error}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl flex gap-3 text-emerald-400">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <div className="text-xs space-y-1">
                      <span className="font-bold block">Topology Validated</span>
                      <p>Switched duty cycles are continuous. Designing optimal component thresholds...</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-navy-dark border border-navy-light p-5 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Duty Cycle (D)
                    </span>
                    <span className="text-2xl font-extrabold text-white font-mono block">
                      {converterOut.dutyCyclePercent}%
                    </span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Proportion of time power transistor is active. D = Vout/Vin (Buck), 1 - Vin/Vout (Boost).
                    </p>
                  </div>

                  <div className="bg-navy-dark border border-navy-light p-5 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Minimum CCM Inductance (Lmin)
                    </span>
                    <span className="text-2xl font-extrabold text-emerald-accent font-mono block">
                      {converterOut.lMinCCM.toFixed(2)} <span className="text-xs font-semibold text-slate-500">μH</span>
                    </span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Absolute boundary to prevent discontinuous inductor current (DCM mode).
                    </p>
                  </div>

                  <div className="bg-navy-dark border border-navy-light p-5 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Design Inductance (L for target ripple)
                    </span>
                    <span className="text-2xl font-extrabold text-white font-mono block">
                      {converterOut.lDesign.toFixed(2)} <span className="text-xs font-semibold text-slate-500">μH</span>
                    </span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Inductor sizing to restrict peak-to-peak inductor current ripple to {converterIn.currentRipplePercent}%.
                    </p>
                  </div>

                  <div className="bg-navy-dark border border-navy-light p-5 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Output Filter Capacitor (Cout)
                    </span>
                    <span className="text-2xl font-extrabold text-emerald-accent font-mono block">
                      {converterOut.cOut.toFixed(2)} <span className="text-xs font-semibold text-slate-500">μF</span>
                    </span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Filtering capacitance required to maintain steady output voltage ripple below {converterIn.voltageRipplePercent}%.
                    </p>
                  </div>
                </div>

                <div className="bg-navy-dark/40 border border-navy-light p-4 rounded-xl flex gap-3 text-xs text-slate-400">
                  <Lightbulb className="h-5 w-5 text-emerald-accent shrink-0" />
                  <div className="space-y-1">
                    <span className="font-bold text-white block">Power Electronics Engineering Note</span>
                    <p>
                      Selecting an inductor larger than Lmin ensures the converter maintains a continuous current profile under maximum loads, reducing conduction losses and EMI noise on power rails.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. PID CONTROLLER VISUALIZER */}
        {activeTab === 'pid' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="border-l-4 border-emerald-accent pl-4">
              <h2 className="text-xl font-bold text-white font-display">PID Control System step response visualizer</h2>
              <p className="text-xs text-slate-400 mt-1">
                Simulates real-time dynamics of a second-order electrical/mechanical plant tuned using Proportional, Integral, and Derivative gains.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sliders for tuning */}
              <div className="space-y-5 bg-navy-dark p-6 rounded-2xl border border-navy-light">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-navy-light pb-2">
                  <Sliders className="h-4 w-4 text-emerald-accent" /> Control System Gain Coefficients
                </h3>

                <div className="space-y-5 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-slate-300">Proportional Gain (Kp)</span>
                      <span className="font-mono text-emerald-accent font-bold">{kp.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      step="0.1"
                      value={kp}
                      onChange={(e) => setKp(parseFloat(e.target.value))}
                      className="w-full accent-emerald-accent h-1.5 bg-navy-light rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Increases speed of response and reduces steady-state offset error.
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-slate-300">Integral Gain (Ki)</span>
                      <span className="font-mono text-emerald-accent font-bold">{ki.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={ki}
                      onChange={(e) => setKi(parseFloat(e.target.value))}
                      className="w-full accent-emerald-accent h-1.5 bg-navy-light rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Eliminates steady-state error completely, but may induce oscillatory overshoots.
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-slate-300">Derivative Gain (Kd)</span>
                      <span className="font-mono text-emerald-accent font-bold">{kd.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.05"
                      value={kd}
                      onChange={(e) => setKd(parseFloat(e.target.value))}
                      className="w-full accent-emerald-accent h-1.5 bg-navy-light rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Acts as a dampener to prevent overshoots and stabilize settling margins.
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-navy-light/60 flex justify-between">
                  <button
                    onClick={() => {
                      setKp(3.0);
                      setKi(1.5);
                      setKd(0.2);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-navy-light text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" /> Reset Standard Tuning
                  </button>
                </div>
              </div>

              {/* Live plot and performance parameters */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-end mb-4">
                  <IEEEReportButton
                    experimentName="Control Systems: PID Controller Tuning and Step Response"
                    inputData={{
                      'Proportional Gain (Kp)': kp,
                      'Integral Gain (Ki)': ki,
                      'Derivative Gain (Kd)': kd
                    }}
                    outputData={{
                      'Peak Response': Math.max(...pidData.map(d => d['System Output'] ?? 0)).toFixed(3),
                      'Final Steady-State': (pidData[pidData.length - 1]?.['System Output'] ?? 0).toFixed(3)
                    }}
                    chartSelectors={['#pid-chart']}
                  />
                </div>
                <div className="bg-navy-dark border border-navy-light p-4 rounded-2xl" id="pid-chart">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-emerald-accent" /> Closed-Loop System Unit Step Response
                    </h3>
                  </div>

                  <div className="h-64 w-full text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={pidData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="time" stroke="#475569" label={{ value: 'Time (seconds)', position: 'insideBottomRight', offset: -5 }} />
                        <YAxis stroke="#475569" domain={[0, 1.8]} />
                        <Tooltip contentStyle={{ backgroundColor: '#131A2C', borderColor: '#1E293B', color: '#F8FAFC' }} />
                        <Legend />
                        <Line type="monotone" dataKey="Set Point" stroke="#475569" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
                        <Line type="monotone" dataKey="System Output" stroke="#10B981" strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Simulated feedback Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-navy-dark border border-navy-light p-4 rounded-xl text-center">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Overshoot</span>
                    <span className="block text-lg font-extrabold text-white font-mono mt-1">
                      {pidMetrics.overshoot}%
                    </span>
                  </div>

                  <div className="bg-navy-dark border border-navy-light p-4 rounded-xl text-center">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Settling Time</span>
                    <span className="block text-lg font-extrabold text-emerald-accent font-mono mt-1">
                      {pidMetrics.settlingTime}
                    </span>
                  </div>

                  <div className="bg-navy-dark border border-navy-light p-4 rounded-xl text-center">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">SS Error Offset</span>
                    <span className="block text-lg font-extrabold text-white font-mono mt-1">
                      {pidMetrics.steadyStateError}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. TRANSMISSION LINE CALCULATOR */}
        {activeTab === 'transmission' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="border-l-4 border-emerald-accent pl-4">
              <h2 className="text-xl font-bold text-white font-display">Short Transmission Line Calculator</h2>
              <p className="text-xs text-slate-400 mt-1">
                Computes exact receiving-end line voltages, power factors, and efficiency margins over short distance distribution networks.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Inputs */}
              <div className="space-y-5 bg-navy-dark p-6 rounded-2xl border border-navy-light">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-navy-light pb-2">
                  <Sliders className="h-4 w-4 text-emerald-accent" /> Grid & Load Inputs
                </h3>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Sending Voltage (Vs L-L)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={transIn.vs}
                        onChange={(e) => setTransIn({ ...transIn, vs: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                      />
                      <span className="absolute right-3 top-2 text-[10px] text-slate-500">kV</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">
                        Real Power (P)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={transIn.pLoad}
                          onChange={(e) => setTransIn({ ...transIn, pLoad: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                        />
                        <span className="absolute right-3 top-2 text-[10px] text-slate-500">MW</span>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">
                        Reactive Power (Q)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={transIn.qLoad}
                          onChange={(e) => setTransIn({ ...transIn, qLoad: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                        />
                        <span className="absolute right-3 top-2 text-[10px] text-slate-500">MVAR</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">
                        Resistance (R)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={transIn.r}
                          onChange={(e) => setTransIn({ ...transIn, r: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                        />
                        <span className="absolute right-3 top-2 text-[10px] text-slate-500">Ω/ph</span>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">
                        Reactance (X)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={transIn.x}
                          onChange={(e) => setTransIn({ ...transIn, x: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-navy-card border border-navy-light rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-accent"
                        />
                        <span className="absolute right-3 top-2 text-[10px] text-slate-500">Ω/ph</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Outputs block */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-end mb-4">
                  <IEEEReportButton
                    experimentName="Power Systems: Transmission Line Analysis"
                    inputData={{
                      'Sending Voltage (Vs)': transIn.vs + ' kV',
                      'Load Real Power (P)': transIn.pLoad + ' MW',
                      'Load Reactive Power (Q)': transIn.qLoad + ' MVAR',
                      'Line Resistance (R)': transIn.r + ' Ω/ph',
                      'Line Reactance (X)': transIn.x + ' Ω/ph'
                    }}
                    outputData={{
                      'Receiving End Voltage (Vr)': transOut.vr.toFixed(2) + ' kV',
                      'Voltage Regulation': transOut.voltageRegulation.toFixed(2) + ' %',
                      'Transmission Efficiency (η)': transOut.efficiency.toFixed(2) + ' %',
                      'Line Current': transOut.currentMag.toFixed(2) + ' A'
                    }}
                  />
                </div>
                {transOut.error ? (
                  <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-2xl flex gap-3 text-red-400">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <div className="text-xs space-y-1">
                      <span className="font-bold block">Power Flow Divergence</span>
                      <p>{transOut.error}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl flex gap-3 text-emerald-400">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <div className="text-xs space-y-1">
                      <span className="font-bold block">Equations Solved</span>
                      <p>Closed quadratic formulation for Short Line model has converged perfectly.</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-navy-dark border border-navy-light p-5 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Receiving-end Voltage (Vr L-L)
                    </span>
                    <span className="text-2xl font-extrabold text-white font-mono block">
                      {transOut.vr.toFixed(3)} <span className="text-xs font-semibold text-slate-500">kV</span>
                    </span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Terminal voltage available at the load hub. Shows drop after line impedance.
                    </p>
                  </div>

                  <div className="bg-navy-dark border border-navy-light p-5 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Voltage Regulation (VR%)
                    </span>
                    <span className="text-2xl font-extrabold text-emerald-accent font-mono block">
                      {transOut.voltageRegulation.toFixed(2)}%
                    </span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Indicates voltage stability level. Lower percentages signify robust terminal regulations.
                    </p>
                  </div>

                  <div className="bg-navy-dark border border-navy-light p-5 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Transmission Efficiency (η%)
                    </span>
                    <span className="text-2xl font-extrabold text-white font-mono block">
                      {transOut.efficiency.toFixed(2)}%
                    </span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Percentage of sent power successfully delivered to the load. Losses = {transOut.losses.toFixed(3)} MW.
                    </p>
                  </div>

                  <div className="bg-navy-dark border border-navy-light p-5 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Operating Line Current & PF
                    </span>
                    <div className="text-base font-extrabold text-white font-mono block mt-1">
                      {transOut.currentMag.toFixed(1)} <span className="text-xs font-semibold text-slate-500">Amps</span> @ {transOut.powerFactor.toFixed(3)} {transOut.pfType}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed mt-2.5">
                      Phasor current flowing through copper windings. Reactive power determines pf lag/lead behavior.
                    </p>
                  </div>
                </div>

                <div className="bg-navy-dark/40 border border-navy-light p-4 rounded-xl flex gap-3 text-xs text-slate-400">
                  <BookOpen className="h-5 w-5 text-emerald-accent shrink-0" />
                  <div className="space-y-1">
                    <span className="font-bold text-white block">Short Line Mathematical Theory</span>
                    <p>
                      Short lines (under 80 km length) ignore capacitive charging reactances. The mathematical relation is bounded per-phase by the phasor equation: Vs_phase = Vr_phase + I_phase * (R + jX).
                    </p>
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
