import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  Zap,
  Cpu,
  Gauge,
  Sliders,
  Play,
  Pause,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  TrendingUp,
  SlidersHorizontal
} from 'lucide-react';
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
  Legend
} from 'recharts';
import { useReferenceFrame } from '../hooks/useReferenceFrame';

// Standard 6-Step commutation tables
interface CommutationState {
  stepNum: number;
  phaseA: 'High' | 'Low' | 'Float';
  phaseB: 'High' | 'Low' | 'Float';
  phaseC: 'High' | 'Low' | 'Float';
  switches: {
    q1: boolean; // High A
    q2: boolean; // Low A
    q3: boolean; // High B
    q4: boolean; // Low B
    q5: boolean; // High C
    q6: boolean; // Low C
  };
  angle: number; // electrical field angle in degrees
  explanation: string;
}

const COMMUTATION_FORWARD: Record<string, CommutationState> = {
  '101': {
    stepNum: 1,
    phaseA: 'High',
    phaseB: 'Low',
    phaseC: 'Float',
    switches: { q1: true, q2: false, q3: false, q4: true, q5: false, q6: false },
    angle: 0,
    explanation: 'Phase A is connected to +VDC, Phase B is connected to GND. Current flows from A to B.'
  },
  '100': {
    stepNum: 2,
    phaseA: 'High',
    phaseB: 'Float',
    phaseC: 'Low',
    switches: { q1: true, q2: false, q3: false, q4: false, q5: false, q6: true },
    angle: 60,
    explanation: 'Phase A is connected to +VDC, Phase C is connected to GND. Current flows from A to C.'
  },
  '110': {
    stepNum: 3,
    phaseA: 'Float',
    phaseB: 'High',
    phaseC: 'Low',
    switches: { q1: false, q2: false, q3: true, q4: false, q5: false, q6: true },
    angle: 120,
    explanation: 'Phase B is connected to +VDC, Phase C is connected to GND. Current flows from B to C.'
  },
  '010': {
    stepNum: 4,
    phaseA: 'Low',
    phaseB: 'High',
    phaseC: 'Float',
    switches: { q1: false, q2: true, q3: true, q4: false, q5: false, q6: false },
    angle: 180,
    explanation: 'Phase B is connected to +VDC, Phase A is connected to GND. Current flows from B to A.'
  },
  '011': {
    stepNum: 5,
    phaseA: 'Low',
    phaseB: 'Float',
    phaseC: 'High',
    switches: { q1: false, q2: true, q3: false, q4: false, q5: true, q6: false },
    angle: 240,
    explanation: 'Phase C is connected to +VDC, Phase A is connected to GND. Current flows from C to A.'
  },
  '001': {
    stepNum: 6,
    phaseA: 'Float',
    phaseB: 'Low',
    phaseC: 'High',
    switches: { q1: false, q2: false, q3: false, q4: true, q5: true, q6: false },
    angle: 300,
    explanation: 'Phase C is connected to +VDC, Phase B is connected to GND. Current flows from C to B.'
  }
};

const COMMUTATION_REVERSE: Record<string, CommutationState> = {
  '101': {
    stepNum: 1,
    phaseA: 'Low',
    phaseB: 'High',
    phaseC: 'Float',
    switches: { q1: false, q2: true, q3: true, q4: false, q5: false, q6: false },
    angle: 180,
    explanation: 'REVERSE: Phase B is connected to +VDC, Phase A is connected to GND. Current flows B to A.'
  },
  '100': {
    stepNum: 2,
    phaseA: 'Low',
    phaseB: 'Float',
    phaseC: 'High',
    switches: { q1: false, q2: true, q3: false, q4: false, q5: true, q6: false },
    angle: 240,
    explanation: 'REVERSE: Phase C is connected to +VDC, Phase A is connected to GND. Current flows C to A.'
  },
  '110': {
    stepNum: 3,
    phaseA: 'Float',
    phaseB: 'Low',
    phaseC: 'High',
    switches: { q1: false, q2: false, q3: false, q4: true, q5: true, q6: false },
    angle: 300,
    explanation: 'REVERSE: Phase C is connected to +VDC, Phase B is connected to GND. Current flows C to B.'
  },
  '010': {
    stepNum: 4,
    phaseA: 'High',
    phaseB: 'Low',
    phaseC: 'Float',
    switches: { q1: true, q2: false, q3: false, q4: true, q5: false, q6: false },
    angle: 0,
    explanation: 'REVERSE: Phase A is connected to +VDC, Phase B is connected to GND. Current flows A to B.'
  },
  '011': {
    stepNum: 5,
    phaseA: 'High',
    phaseB: 'Float',
    phaseC: 'Low',
    switches: { q1: true, q2: false, q3: false, q4: false, q5: false, q6: true },
    angle: 60,
    explanation: 'REVERSE: Phase A is connected to +VDC, Phase C is connected to GND. Current flows A to C.'
  },
  '001': {
    stepNum: 6,
    phaseA: 'Float',
    phaseB: 'High',
    phaseC: 'Low',
    switches: { q1: false, q2: false, q3: true, q4: false, q5: false, q6: true },
    angle: 120,
    explanation: 'REVERSE: Phase B is connected to +VDC, Phase C is connected to GND. Current flows B to C.'
  }
};

export default function MachineDrivesView() {
  const [activeTab, setActiveTab] = useState<'bldc' | 'clarkepark' | 'foc'>('bldc');

  // ==========================================
  // TAB 1: BLDC COMMUTATION STATE
  // ==========================================
  const [hallA, setHallA] = useState<number>(1);
  const [hallB, setHallB] = useState<number>(0);
  const [hallC, setHallC] = useState<number>(1);
  const [direction, setDirection] = useState<'Forward' | 'Reverse'>('Forward');

  const hallStr = `${hallA}${hallB}${hallC}`;
  const isHallInvalid = hallStr === '000' || hallStr === '111';

  // Get Commutation Step Info
  const activeStepInfo = useMemo<CommutationState | null>(() => {
    if (isHallInvalid) return null;
    const table = direction === 'Forward' ? COMMUTATION_FORWARD : COMMUTATION_REVERSE;
    return table[hallStr] || null;
  }, [hallStr, direction, isHallInvalid]);

  // ==========================================
  // TAB 2: CLARKE & PARK TRANSFORMATION
  // ==========================================
  const [isRotating, setIsRotating] = useState(true);
  const [rotAngle, setRotAngle] = useState(0); // Slider 0-360

  const { inputs: refInputs, setInputs: setRefInputs, outputs: refOutputs } = useReferenceFrame({
    amplitude: 10,
    frequency: 50,
    theta: rotAngle,
    phiMode: 'q-axis',
    phiManual: 90
  });

  // Sync theta input
  useEffect(() => {
    setRefInputs(prev => ({ ...prev, theta: rotAngle }));
  }, [rotAngle, setRefInputs]);

  // Animation for rotating currents
  useEffect(() => {
    let animationFrameId: number;
    if (isRotating) {
      const updateAngle = () => {
        setRotAngle(prev => (prev + 1.5) % 360);
        animationFrameId = requestAnimationFrame(updateAngle);
      };
      animationFrameId = requestAnimationFrame(updateAngle);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [isRotating]);

  // Coordinates for 2D Scatter plot
  const scatterData = useMemo(() => {
    const { I_alpha, I_beta, I_d, I_q, phi } = refOutputs;
    const thetaRad = (rotAngle * Math.PI) / 180;

    // Vector d component in alpha-beta frame
    const d_x = I_d * Math.cos(thetaRad);
    const d_y = I_d * Math.sin(thetaRad);

    // Vector q component in alpha-beta frame (90 degrees ahead of d-axis)
    const q_x = I_q * Math.cos(thetaRad + Math.PI / 2);
    const q_y = I_q * Math.sin(thetaRad + Math.PI / 2);

    return {
      statorVector: [{ x: I_alpha, y: I_beta }],
      dAxisProjection: [{ x: d_x, y: d_y }],
      qAxisProjection: [{ x: q_x, y: q_y }],
      dAxisGuide: [
        { x: -14 * Math.cos(thetaRad), y: -14 * Math.sin(thetaRad) },
        { x: 14 * Math.cos(thetaRad), y: 14 * Math.sin(thetaRad) }
      ],
      qAxisGuide: [
        { x: -14 * Math.cos(thetaRad + Math.PI / 2), y: -14 * Math.sin(thetaRad + Math.PI / 2) },
        { x: 14 * Math.cos(thetaRad + Math.PI / 2), y: 14 * Math.sin(thetaRad + Math.PI / 2) }
      ]
    };
  }, [refOutputs, rotAngle]);

  // ==========================================
  // TAB 3: FIELD ORIENTED CONTROL (FOC) SIM
  // ==========================================
  const [iqRef, setIqRef] = useState(8.0); // Torque demand (A)
  const [idRef, setIdRef] = useState(0.0); // Flux demand (A) - normally 0 for maximum efficiency
  const [kp, setKp] = useState(15.0);
  const [ki, setKi] = useState(120.0);

  // Closed loop simulation of decoupled current controllers
  const focSimulationData = useMemo(() => {
    const dt = 0.0001; // 0.1 ms step
    const duration = 0.04; // 40 ms simulation
    const steps = duration / dt;
    
    // Plant params (Armature inductance & resistance)
    const R = 1.5; // Stator coil Resistance
    const L = 0.006; // Stator coil Inductance
    
    // States for d-axis
    let actual_Id = 0.0;
    let errInt_Id = 0.0;
    
    // States for q-axis
    let actual_Iq = 0.0;
    let errInt_Iq = 0.0;

    const data = [];

    for (let i = 0; i < steps; i++) {
      const t = i * dt;
      const tMs = t * 1000;
      
      // Step references at t = 5ms
      const current_id_ref = tMs >= 5 ? idRef : 0.0;
      const current_iq_ref = tMs >= 5 ? iqRef : 0.0;

      // --- d-loop controller ---
      const err_id = current_id_ref - actual_Id;
      errInt_Id += err_id * dt;
      // Clamp integrator anti-windup
      errInt_Id = Math.max(-10, Math.min(10, errInt_Id));
      let v_d_control = kp * err_id + ki * errInt_Id;
      // Saturation limit of DC Link (e.g., 24V max)
      v_d_control = Math.max(-24, Math.min(24, v_d_control));

      // Plant update d-axis current: di/dt = (V - R*i) / L
      const dId_dt = (v_d_control - R * actual_Id) / L;
      actual_Id += dId_dt * dt;

      // --- q-loop controller ---
      const err_iq = current_iq_ref - actual_Iq;
      errInt_Iq += err_iq * dt;
      errInt_Iq = Math.max(-10, Math.min(10, errInt_Iq));
      let v_q_control = kp * err_iq + ki * errInt_Iq;
      v_q_control = Math.max(-24, Math.min(24, v_q_control));

      // Plant update q-axis current
      const dIq_dt = (v_q_control - R * actual_Iq) / L;
      actual_Iq += dIq_dt * dt;

      // Capture data every 2 steps to reduce chart footprint
      if (i % 2 === 0) {
        data.push({
          time: parseFloat(tMs.toFixed(2)),
          id_ref: parseFloat(current_id_ref.toFixed(2)),
          id_act: parseFloat(actual_Id.toFixed(2)),
          iq_ref: parseFloat(current_iq_ref.toFixed(2)),
          iq_act: parseFloat(actual_Iq.toFixed(2)),
          v_d: parseFloat(v_d_control.toFixed(2)),
          v_q: parseFloat(v_q_control.toFixed(2))
        });
      }
    }

    return data;
  }, [iqRef, idRef, kp, ki]);

  // Switch Q1-Q6 SVG Draw logic helpers
  const renderSwitch = (
    x: number,
    y: number,
    isClosed: boolean,
    name: string,
    colorClass: string
  ) => {
    return (
      <g key={name} className="transition-all duration-150">
        {/* Switch label */}
        <text x={x - 22} y={y + 5} className="fill-slate-500 font-mono text-[9px] font-bold">
          {name.toUpperCase()}
        </text>

        {/* Contact terminals */}
        <circle cx={x} cy={y - 12} r="3" className="fill-navy-card stroke-slate-500 stroke-2" />
        <circle cx={x} cy={y + 12} r="3" className="fill-navy-card stroke-slate-500 stroke-2" />

        {isClosed ? (
          // Solid closed line representing saturated switch
          <line
            x1={x}
            y1={y - 12}
            x2={x}
            y2={y + 12}
            className={`${colorClass} stroke-[3.5]`}
          />
        ) : (
          // Diagonal open switch contact
          <line
            x1={x}
            y1={y - 12}
            x2={x + 12}
            y2={y + 8}
            className="stroke-slate-500 stroke-2"
          />
        )}
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-navy-dark text-slate-100 pb-12 font-sans selection:bg-emerald-accent/30 selection:text-white">
      {/* Top Breadcrumb Navigation */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO DEPT CATALOG
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Header Board */}
        <div className="relative rounded-2xl border border-navy-light/60 bg-navy-light/20 p-6 md:p-8 overflow-hidden">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-emerald-accent/5 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-accent font-semibold text-xs tracking-wider uppercase mb-2">
                <Zap className="h-4 w-4 animate-pulse" /> EEE 4149 Motor Drives & Special Machines Suite
              </div>
              <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
                Vector Control & <span className="text-emerald-accent">BLDC Drives</span>
              </h1>
              <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
                An advanced lab simulator for studying 3-phase BLDC electronic commutation, 2D Clarke and Park space vector axis rotations, and closed-loop FOC decoupling loops.
              </p>
            </div>
            <div className="bg-navy-dark/60 border border-navy-light px-4 py-3 rounded-xl flex items-center gap-3 shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-accent/10 border border-emerald-accent/20">
                <Cpu className="h-5 w-5 text-emerald-accent animate-spin-slow" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-500 tracking-wider uppercase">DRIVES ENGINE</div>
                <div className="text-xs font-mono font-bold text-emerald-accent">FOC CO-PROCESSOR v1.2</div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Primary Navigation Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-navy-light/60 pb-px">
          <button
            onClick={() => setActiveTab('bldc')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'bldc'
                ? 'border-emerald-accent text-emerald-accent bg-emerald-accent/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'
            }`}
          >
            <Gauge className="h-4 w-4" />
            1. BLDC 6-Step Commutation
          </button>
          <button
            onClick={() => setActiveTab('clarkepark')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'clarkepark'
                ? 'border-emerald-accent text-emerald-accent bg-emerald-accent/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'
            }`}
          >
            <Activity className="h-4 w-4" />
            2. Clarke & Park transformations
          </button>
          <button
            onClick={() => setActiveTab('foc')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'foc'
                ? 'border-emerald-accent text-emerald-accent bg-emerald-accent/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'
            }`}
          >
            <Sliders className="h-4 w-4" />
            3. FOC Decoupled PI Tuning
          </button>
        </div>

        {/* Tab Switchboard */}
        <div className="animate-fadeIn">
          {/* ========================================== */}
          {/* TAB 1: BLDC 6-STEP COMMUTATION */}
          {/* ========================================== */}
          {activeTab === 'bldc' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Inputs Card */}
              <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div>
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono border-b border-navy-light/60 pb-3 flex items-center gap-2">
                    <SlidersHorizontal className="h-4.5 w-4.5 text-emerald-accent" />
                    Commutation Inputs
                  </h3>
                </div>

                <div className="space-y-6">
                  {/* Hall Sensors Toggle State */}
                  <div className="space-y-3">
                    <label className="text-xs font-mono font-bold text-slate-400 block uppercase tracking-wider">
                      Hall Sensor Outputs
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Hall A (Ha)', val: hallA, set: setHallA },
                        { label: 'Hall B (Hb)', val: hallB, set: setHallB },
                        { label: 'Hall C (Hc)', val: hallC, set: setHallC }
                      ].map(hall => (
                        <button
                          key={hall.label}
                          onClick={() => hall.set(prev => (prev === 1 ? 0 : 1))}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-250 font-mono cursor-pointer ${
                            hall.val === 1
                              ? 'bg-emerald-accent/15 border-emerald-accent text-emerald-accent shadow-md font-bold'
                              : 'bg-navy-dark border-navy-light/50 text-slate-400 hover:bg-navy-light/30'
                          }`}
                        >
                          <span className="text-[10px] text-slate-500 mb-1">{hall.label.replace('Hall ', 'Phase ')}</span>
                          <span className="text-lg font-black">{hall.val}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Motor Direction Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-bold text-slate-400 block uppercase tracking-wider">
                      Motor Shaft Direction
                    </label>
                    <div className="flex bg-navy-dark border border-navy-light/60 p-1 rounded-xl">
                      <button
                        onClick={() => setDirection('Forward')}
                        className={`flex-1 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all cursor-pointer ${
                          direction === 'Forward'
                            ? 'bg-emerald-accent text-navy-dark shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Forward (CW)
                      </button>
                      <button
                        onClick={() => setDirection('Reverse')}
                        className={`flex-1 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all cursor-pointer ${
                          direction === 'Reverse'
                            ? 'bg-emerald-accent text-navy-dark shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Reverse (CCW)
                      </button>
                    </div>
                  </div>

                  {/* Validation State Indicator */}
                  {isHallInvalid ? (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex gap-2 items-start text-xs font-mono leading-relaxed">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <div>
                        <strong className="block font-bold mb-1">INVALID HALL STATE: {hallStr}</strong>
                        Binary states 000 and 111 are physically impossible in standard 120° spaced Hall sensor layouts. Switch transistors are disabled to prevent a direct DC shoot-through.
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Current Hall Vector:</span>
                        <span className="font-bold tracking-widest bg-emerald-accent/10 px-2 py-0.5 rounded border border-emerald-accent/20">[{hallStr}]</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono border-t border-navy-light/30 pt-2">
                        <span className="text-slate-400">Commutation Step:</span>
                        <span className="font-bold text-white">Step {activeStepInfo?.stepNum} of 6</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono border-t border-navy-light/30 pt-2">
                        <span className="text-slate-400">Stator Field Angle:</span>
                        <span className="font-bold text-white font-mono">{activeStepInfo?.angle}°</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Outputs/Visualizations */}
              <div className="lg:col-span-8 space-y-6">
                {/* Visualizer Card */}
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  <div className="flex justify-between items-center border-b border-navy-light/40 pb-3">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                      Phase Inverter State & Current Loop (Y-Connected Stator)
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      Real-time interactive schematic
                    </span>
                  </div>

                  {isHallInvalid ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500 font-mono text-xs text-center space-y-3 bg-navy-dark/40 rounded-xl border border-dashed border-navy-light/60">
                      <AlertCircle className="h-8 w-8 text-rose-500/80 animate-pulse" />
                      <div>
                        <p className="font-bold text-slate-400">SW_BRIDGE_FAULT: DRIVER INHIBIT</p>
                        <p className="text-[11px] mt-1 text-slate-500">Toggle Hall sensors away from [000] or [111] to activate switching vectors.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Interactive Inverter and Stator Coil SVG */}
                      <div className="bg-navy-dark/50 border border-navy-light/40 rounded-xl p-4 flex flex-col items-center">
                        <svg viewBox="0 0 680 200" className="w-full h-auto max-w-2xl text-slate-300">
                          {/* Rail Lines */}
                          <line x1="40" y1="20" x2="340" y2="20" className="stroke-slate-600 stroke-2" />
                          <text x="40" y="15" className="fill-emerald-400 font-mono text-[9px] font-bold">+V_DC</text>
                          
                          <line x1="40" y1="180" x2="340" y2="180" className="stroke-slate-600 stroke-2" strokeDasharray="3 3" />
                          <text x="40" y="195" className="fill-rose-400 font-mono text-[9px] font-bold">GND</text>

                          {/* Leg A (A) */}
                          <line x1="100" y1="20" x2="100" y2="50" className="stroke-slate-600 stroke-2" />
                          {renderSwitch(100, 65, !!activeStepInfo?.switches.q1, 'q1', 'stroke-emerald-400')}
                          <line x1="100" y1="80" x2="100" y2="120" className="stroke-slate-600 stroke-2" />
                          {renderSwitch(100, 135, !!activeStepInfo?.switches.q2, 'q2', 'stroke-rose-400')}
                          <line x1="100" y1="150" x2="100" y2="180" className="stroke-slate-600 stroke-2" />

                          {/* Leg B (B) */}
                          <line x1="200" y1="20" x2="200" y2="50" className="stroke-slate-600 stroke-2" />
                          {renderSwitch(200, 65, !!activeStepInfo?.switches.q3, 'q3', 'stroke-emerald-400')}
                          <line x1="200" y1="80" x2="200" y2="120" className="stroke-slate-600 stroke-2" />
                          {renderSwitch(200, 135, !!activeStepInfo?.switches.q4, 'q4', 'stroke-rose-400')}
                          <line x1="200" y1="150" x2="200" y2="180" className="stroke-slate-600 stroke-2" />

                          {/* Leg C (C) */}
                          <line x1="300" y1="20" x2="300" y2="50" className="stroke-slate-600 stroke-2" />
                          {renderSwitch(300, 65, !!activeStepInfo?.switches.q5, 'q5', 'stroke-emerald-400')}
                          <line x1="300" y1="80" x2="300" y2="120" className="stroke-slate-600 stroke-2" />
                          {renderSwitch(300, 135, !!activeStepInfo?.switches.q6, 'q6', 'stroke-rose-400')}
                          <line x1="300" y1="150" x2="300" y2="180" className="stroke-slate-600 stroke-2" />

                          {/* Node connections to Stator */}
                          <line x1="100" y1="100" x2="420" y2="60" className={`stroke-2 ${activeStepInfo?.phaseA === 'High' ? 'stroke-emerald-400 stroke-[3]' : activeStepInfo?.phaseA === 'Low' ? 'stroke-rose-400 stroke-[3]' : 'stroke-slate-600'}`} />
                          <text x="110" y="94" className="fill-slate-400 font-mono text-[9px]">A</text>

                          <line x1="200" y1="100" x2="420" y2="140" className={`stroke-2 ${activeStepInfo?.phaseB === 'High' ? 'stroke-emerald-400 stroke-[3]' : activeStepInfo?.phaseB === 'Low' ? 'stroke-rose-400 stroke-[3]' : 'stroke-slate-600'}`} />
                          <text x="210" y="94" className="fill-slate-400 font-mono text-[9px]">B</text>

                          <line x1="300" y1="100" x2="520" y2="100" className={`stroke-2 ${activeStepInfo?.phaseC === 'High' ? 'stroke-emerald-400 stroke-[3]' : activeStepInfo?.phaseC === 'Low' ? 'stroke-rose-400 stroke-[3]' : 'stroke-slate-600'}`} />
                          <text x="310" y="94" className="fill-slate-400 font-mono text-[9px]">C</text>

                          {/* Stator Coils (Y-Connected) */}
                          {/* Central Neutral Point N at (460, 100) */}
                          <circle cx="460" cy="100" r="4" className="fill-slate-400" />
                          <text x="460" y="90" className="fill-slate-400 font-mono text-[9px] font-bold">N</text>

                          {/* Coil A Path */}
                          <path
                            d="M 420 60 Q 425 65 430 60 Q 435 65 440 60 Q 445 65 450 60 L 460 100"
                            fill="none"
                            className={`stroke-2 ${
                              activeStepInfo?.phaseA === 'High'
                                ? 'stroke-emerald-400 stroke-[3.5] animate-pulse'
                                : activeStepInfo?.phaseA === 'Low'
                                ? 'stroke-rose-400 stroke-[3.5] animate-pulse'
                                : 'stroke-slate-600'
                            }`}
                          />
                          <text x="400" y="55" className="fill-slate-400 font-mono text-[9px] font-bold">Phase A Coil</text>

                          {/* Coil B Path */}
                          <path
                            d="M 420 140 Q 425 135 430 140 Q 435 135 440 140 Q 445 135 450 140 L 460 100"
                            fill="none"
                            className={`stroke-2 ${
                              activeStepInfo?.phaseB === 'High'
                                ? 'stroke-emerald-400 stroke-[3.5] animate-pulse'
                                : activeStepInfo?.phaseB === 'Low'
                                ? 'stroke-rose-400 stroke-[3.5] animate-pulse'
                                : 'stroke-slate-600'
                            }`}
                          />
                          <text x="400" y="155" className="fill-slate-400 font-mono text-[9px] font-bold">Phase B Coil</text>

                          {/* Coil C Path */}
                          <path
                            d="M 520 100 Q 510 95 500 100 Q 490 95 480 100 L 460 100"
                            fill="none"
                            className={`stroke-2 ${
                              activeStepInfo?.phaseC === 'High'
                                ? 'stroke-emerald-400 stroke-[3.5] animate-pulse'
                                : activeStepInfo?.phaseC === 'Low'
                                ? 'stroke-rose-400 stroke-[3.5] animate-pulse'
                                : 'stroke-slate-600'
                            }`}
                          />
                          <text x="500" y="90" className="fill-slate-400 font-mono text-[9px] font-bold">Phase C Coil</text>

                          {/* ROTOR AND MAGNETIC FIELD PLOT */}
                          <g transform="translate(600, 100)">
                            {/* Rotor outer stator circle */}
                            <circle cx="0" cy="0" r="45" className="fill-navy-card stroke-slate-600 stroke-2" />
                            
                            {/* Stator poles markers A B C */}
                            <text x="0" y="-32" className="fill-slate-400 font-mono text-[8px] font-bold" textAnchor="middle">A</text>
                            <text x="-28" y="18" className="fill-slate-400 font-mono text-[8px] font-bold" textAnchor="middle">B</text>
                            <text x="28" y="18" className="fill-slate-400 font-mono text-[8px] font-bold" textAnchor="middle">C</text>

                            {/* Stator Magnetic Vector Arrow */}
                            {(() => {
                              const thetaRad = ((activeStepInfo?.angle || 0) * Math.PI) / 180;
                              const endX = 35 * Math.cos(thetaRad);
                              const endY = -35 * Math.sin(thetaRad); // SVG y is downward, invert
                              return (
                                <g>
                                  {/* Stator Field Line */}
                                  <line
                                    x1="0"
                                    y1="0"
                                    x2={endX}
                                    y2={endY}
                                    className="stroke-emerald-400 stroke-[3]"
                                  />
                                  <circle cx={endX} cy={endY} r="4" className="fill-emerald-400" />
                                  <text x="0" y="4" className="fill-slate-500 font-mono text-[7px] text-center" textAnchor="middle">STATOR B</text>
                                </g>
                              );
                            })()}

                            {/* Permanent Magnet Rotor Needle */}
                            {(() => {
                              // The rotor lags or aligns with the field, let's align it with a beautiful compass needle
                              const thetaRad = ((activeStepInfo?.angle || 0) * Math.PI) / 180;
                              const rotorX = 22 * Math.cos(thetaRad);
                              const rotorY = -22 * Math.sin(thetaRad);
                              const rotOppX = -12 * Math.cos(thetaRad);
                              const rotOppY = 12 * Math.sin(thetaRad);
                              return (
                                <g opacity="0.85">
                                  {/* North Pole (Red) */}
                                  <polygon
                                    points={`0,0 ${rotorX},${rotorY} ${-rotorY/2},${rotorX/2}`}
                                    className="fill-rose-500"
                                  />
                                  {/* South Pole (Blue) */}
                                  <polygon
                                    points={`0,0 ${rotOppX},${rotOppY} ${rotOppY/2},${-rotOppX/2}`}
                                    className="fill-blue-500"
                                  />
                                </g>
                              );
                            })()}
                          </g>
                          <text x="600" y="165" className="fill-slate-500 font-mono text-[9px] font-bold" textAnchor="middle">Rotor Orientation</text>
                        </svg>
                      </div>

                      {/* Mathematical Explanation */}
                      <div className="bg-navy-dark/40 border border-navy-light/40 p-4 rounded-xl space-y-3 font-mono text-xs text-slate-300 leading-relaxed">
                        <div className="flex items-center gap-2 text-white font-bold">
                          <HelpCircle className="h-4 w-4 text-emerald-accent" />
                          <span>How BLDC Commutation Works</span>
                        </div>
                        <p>
                          {activeStepInfo?.explanation}
                        </p>
                        <p className="text-slate-400">
                          To rotate the motor continuously, the stator coils must produce a magnetic field vector that remains 90 electrical degrees ahead of the rotor magnet. The Hall sensors detect the rotor position and dictate the precise step in the 6-step switching cycle, keeping the torque output maximized.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 2: CLARKE & PARK AXIS ROTATION */}
          {/* ========================================== */}
          {activeTab === 'clarkepark' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Controls Panel */}
              <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div>
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono border-b border-navy-light/60 pb-3 flex items-center gap-2">
                    <SlidersHorizontal className="h-4.5 w-4.5 text-emerald-accent" />
                    AC Current & Rotor Inputs
                  </h3>
                </div>

                <div className="space-y-6 font-mono text-xs">
                  {/* Phase amplitude */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase font-bold">Stator Peak Current (I_m)</span>
                      <span className="text-emerald-accent font-bold">{refInputs.amplitude} A</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="0.5"
                      value={refInputs.amplitude}
                      onChange={e => setRefInputs(prev => ({ ...prev, amplitude: parseFloat(e.target.value) }))}
                      className="w-full accent-emerald-accent"
                    />
                  </div>

                  {/* Frequency */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase font-bold">Frequency (f)</span>
                      <span className="text-emerald-accent font-bold">{refInputs.frequency} Hz</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={refInputs.frequency}
                      onChange={e => setRefInputs(prev => ({ ...prev, frequency: parseFloat(e.target.value) }))}
                      className="w-full accent-emerald-accent"
                    />
                  </div>

                  {/* Rotor angle slider */}
                  <div className="space-y-2 border-t border-navy-light/40 pt-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase font-bold">Rotor Angle (θ)</span>
                      <span className="text-amber-400 font-bold">{Math.round(rotAngle)}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={Math.round(rotAngle)}
                      onChange={e => {
                        setRotAngle(parseInt(e.target.value));
                        setIsRotating(false); // pause rotation on manual drag
                      }}
                      className="w-full accent-amber-400"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] text-slate-500">Auto Sweep Phase:</span>
                      <button
                        onClick={() => setIsRotating(!isRotating)}
                        className={`px-3 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wide flex items-center gap-1 cursor-pointer transition-all ${
                          isRotating
                            ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                            : 'bg-emerald-accent/15 border border-emerald-accent text-emerald-accent'
                        }`}
                      >
                        {isRotating ? (
                          <>
                            <Pause className="h-3 w-3" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3" /> Sweep Vector
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Stator current mode */}
                  <div className="space-y-2 border-t border-navy-light/40 pt-4">
                    <label className="text-slate-400 uppercase font-bold block">Current Angle (φ) Mode</label>
                    <select
                      value={refInputs.phiMode}
                      onChange={e => setRefInputs(prev => ({ ...prev, phiMode: e.target.value as any }))}
                      className="w-full bg-navy-dark border border-navy-light rounded-xl px-3 py-2 text-white text-xs font-mono"
                    >
                      <option value="q-axis">Align with Q-Axis (φ = θ + 90°)</option>
                      <option value="d-axis">Align with D-Axis (φ = θ)</option>
                      <option value="manual">Manual Angle Slider</option>
                    </select>
                  </div>

                  {refInputs.phiMode === 'manual' && (
                    <div className="space-y-2 animate-fadeIn">
                      <div className="flex justify-between">
                        <span className="text-slate-400 uppercase font-bold">Manual Current Angle (φ)</span>
                        <span className="text-emerald-accent font-bold">{refInputs.phiManual}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={refInputs.phiManual}
                        onChange={e => setRefInputs(prev => ({ ...prev, phiManual: parseInt(e.target.value) }))}
                        className="w-full accent-emerald-accent"
                      />
                    </div>
                  )}

                  {/* Calculated Digital Indicators */}
                  <div className="bg-navy-dark/60 border border-navy-light/50 p-4 rounded-xl space-y-2.5 font-mono text-xs">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold border-b border-navy-light pb-1.5 uppercase">
                      <span>Variable</span>
                      <span>Stator Coordinate Value</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phase Currents:</span>
                      <span className="text-slate-200">
                        Ia: <b className="text-white font-bold">{refOutputs.Ia.toFixed(1)}A</b>, 
                        Ib: <b className="text-white font-bold">{refOutputs.Ib.toFixed(1)}A</b>
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-navy-light/30 pt-1.5">
                      <span className="text-slate-400">Clarke (I_α, I_β):</span>
                      <span className="text-emerald-accent font-bold">
                        ({refOutputs.I_alpha.toFixed(2)}, {refOutputs.I_beta.toFixed(2)}) A
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-navy-light/30 pt-1.5">
                      <span className="text-slate-400">Park (I_d, I_q):</span>
                      <span className="text-amber-400 font-bold">
                        (d: {refOutputs.I_d.toFixed(2)}, q: {refOutputs.I_q.toFixed(2)}) A
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Graphic Plotters */}
              <div className="lg:col-span-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Plot 1: Time Domain Sine Waves */}
                  <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                      Stator Phase Currents (Ia, Ib, Ic)
                    </h4>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={refOutputs.timeData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis
                            dataKey="time"
                            stroke="#64748b"
                            style={{ fontSize: '10px', fontFamily: 'monospace' }}
                            label={{ value: 'Time (ms)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }}
                          />
                          <YAxis
                            stroke="#64748b"
                            style={{ fontSize: '10px', fontFamily: 'monospace' }}
                            label={{ value: 'Current (A)', angle: -90, position: 'insideLeft', offset: 10, fill: '#94a3b8', fontSize: 10 }}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                          />
                          <Line type="monotone" dataKey="Ia" stroke="#10b981" strokeWidth={2} dot={false} name="Ia" />
                          <Line type="monotone" dataKey="Ib" stroke="#3b82f6" strokeWidth={2} dot={false} name="Ib" />
                          <Line type="monotone" dataKey="Ic" stroke="#fbbf24" strokeWidth={2} dot={false} name="Ic" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Plot 2: Rotating Space Vector 2D Scatter Chart */}
                  <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                      D-Q Coordinate Axis Rotation plane
                    </h4>
                    <div className="h-64 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                          <CartesianGrid stroke="#1e293b" strokeDasharray="2 2" />
                          <XAxis
                            type="number"
                            dataKey="x"
                            domain={[-14, 14]}
                            stroke="#64748b"
                            style={{ fontSize: '10px' }}
                            label={{ value: 'Alpha Axis (Stator)', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 9 }}
                          />
                          <YAxis
                            type="number"
                            dataKey="y"
                            domain={[-14, 14]}
                            stroke="#64748b"
                            style={{ fontSize: '10px' }}
                            label={{ value: 'Beta Axis', angle: -90, position: 'insideLeft', offset: 10, fill: '#94a3b8', fontSize: 9 }}
                          />
                          
                          {/* Circle trajectory */}
                          <Scatter
                            data={refOutputs.trajectoryData.map(pt => ({ x: pt.alpha, y: pt.beta }))}
                            line={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '3 3' }}
                            shape={() => null}
                            name="Trajectory"
                          />

                          {/* D-Axis orientation Line */}
                          <Scatter
                            data={scatterData.dAxisGuide}
                            line={{ stroke: '#f59e0b', strokeWidth: 1.5 }}
                            shape={() => null}
                            name="D-Axis (Flux)"
                          />

                          {/* Q-Axis orientation Line */}
                          <Scatter
                            data={scatterData.qAxisGuide}
                            line={{ stroke: '#10b981', strokeWidth: 1.5 }}
                            shape={() => null}
                            name="Q-Axis (Torque)"
                          />

                          {/* Stator current actual vector */}
                          <Scatter
                            data={scatterData.statorVector}
                            fill="#10b981"
                            name="I_s Stator Current"
                          />

                          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        </ScatterChart>
                      </ResponsiveContainer>
                      {/* Manual Overlay labels inside scatter chart */}
                      <div className="absolute top-2 right-2 bg-navy-dark/90 border border-navy-light px-2.5 py-1.5 rounded text-[9px] font-mono space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-0.5 bg-amber-500 inline-block"></span>
                          <span className="text-slate-300">D-Axis (θ = {Math.round(rotAngle)}°)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-0.5 bg-emerald-500 inline-block"></span>
                          <span className="text-slate-300">Q-Axis (θ + 90°)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clarke Park Math Card */}
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider border-b border-navy-light pb-2">
                    Reference Frame Transformations
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono text-slate-400 leading-relaxed">
                    <div className="space-y-2">
                      <b className="text-white font-bold block mb-1">1. Clarke Transformation (ABC to αβ)</b>
                      <p>Projects 3-phase stationary variables onto 2-phase orthogonal stationary coordinates:</p>
                      <div className="bg-navy-dark/60 p-2.5 rounded-lg text-emerald-accent border border-navy-light/40 text-center my-2">
                        I_α = 2/3 * (I_a - 0.5 * I_b - 0.5 * I_c)<br/>
                        I_β = 1/sqrt(3) * (I_b - I_c)
                      </div>
                    </div>
                    <div className="space-y-2">
                      <b className="text-white font-bold block mb-1">2. Park Transformation (αβ to dq)</b>
                      <p>Rotates stationary orthogonal coordinates into rotating rotor reference frame:</p>
                      <div className="bg-navy-dark/60 p-2.5 rounded-lg text-amber-400 border border-navy-light/40 text-center my-2">
                        I_d = I_α * cos(θ) + I_β * sin(θ)<br/>
                        I_q = -I_α * sin(θ) + I_β * cos(θ)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 3: FIELD ORIENTED CONTROL (FOC) */}
          {/* ========================================== */}
          {activeTab === 'foc' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Controller Tuning Inputs */}
              <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div>
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono border-b border-navy-light/60 pb-3 flex items-center gap-2">
                    <SlidersHorizontal className="h-4.5 w-4.5 text-emerald-accent" />
                    PI Controller Parameters
                  </h3>
                </div>

                <div className="space-y-6 font-mono text-xs">
                  {/* Torque Reference Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase font-bold">Torque demand (I_q_ref)</span>
                      <span className="text-emerald-accent font-bold">{iqRef.toFixed(1)} A</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      step="0.5"
                      value={iqRef}
                      onChange={e => setIqRef(parseFloat(e.target.value))}
                      className="w-full accent-emerald-accent"
                    />
                  </div>

                  {/* Flux Reference Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase font-bold">Flux demand (I_d_ref)</span>
                      <span className="text-blue-400 font-bold">{idRef.toFixed(1)} A</span>
                    </div>
                    <input
                      type="range"
                      min="-5"
                      max="5"
                      step="0.5"
                      value={idRef}
                      onChange={e => setIdRef(parseFloat(e.target.value))}
                      className="w-full accent-blue-400"
                    />
                    <span className="text-[10px] text-slate-500 block leading-tight mt-1">
                      Typically held at 0.0 A for Permanent Magnet synchronous motors to guarantee maximum torque per ampere (MTPA).
                    </span>
                  </div>

                  {/* Proportional Gain Kp */}
                  <div className="space-y-2 border-t border-navy-light/40 pt-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase font-bold">Proportional Gain (K_p)</span>
                      <span className="text-white font-bold">{kp}</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="40"
                      step="1"
                      value={kp}
                      onChange={e => setKp(parseFloat(e.target.value))}
                      className="w-full accent-emerald-accent"
                    />
                  </div>

                  {/* Integral Gain Ki */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase font-bold">Integral Gain (K_i)</span>
                      <span className="text-white font-bold">{ki}</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="300"
                      step="10"
                      value={ki}
                      onChange={e => setKi(parseFloat(e.target.value))}
                      className="w-full accent-emerald-accent"
                    />
                  </div>

                  {/* PI Controller Explanation Block */}
                  <div className="bg-navy-dark/60 border border-navy-light/50 p-4 rounded-xl space-y-2 font-mono text-xs">
                    <div className="text-slate-400 font-bold uppercase text-[10px]">Loop Tuning Guide</div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Increase <b className="text-emerald-accent font-semibold">K_p</b> to achieve a faster rise time. If K_p is too large, the response will overshoot and ring. Increase <b className="text-emerald-accent font-semibold">K_i</b> to eliminate steady-state error quicker.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step Response Chart Outputs */}
              <div className="lg:col-span-8 space-y-6">
                {/* Side-by-Side Response Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Chart 1: Torque response (Iq) */}
                  <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-navy-light/30 pb-2">
                      <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                        Torque loop: Iq response
                      </h4>
                      <span className="text-[10px] font-mono text-emerald-accent font-bold">Iq_ref vs Iq_act</span>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={focSimulationData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis
                            dataKey="time"
                            stroke="#64748b"
                            style={{ fontSize: '10px', fontFamily: 'monospace' }}
                            label={{ value: 'Time (ms)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }}
                          />
                          <YAxis
                            stroke="#64748b"
                            style={{ fontSize: '10px', fontFamily: 'monospace' }}
                            label={{ value: 'Current (A)', angle: -90, position: 'insideLeft', offset: 10, fill: '#94a3b8', fontSize: 10 }}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                          />
                          <Line type="monotone" dataKey="iq_ref" stroke="#10b981" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Iq Ref" />
                          <Line type="monotone" dataKey="iq_act" stroke="#10b981" strokeWidth={2.5} dot={false} name="Iq Actual" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Flux response (Id) */}
                  <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-navy-light/30 pb-2">
                      <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                        Flux loop: Id response
                      </h4>
                      <span className="text-[10px] font-mono text-blue-400 font-bold">Id_ref vs Id_act</span>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={focSimulationData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis
                            dataKey="time"
                            stroke="#64748b"
                            style={{ fontSize: '10px', fontFamily: 'monospace' }}
                            label={{ value: 'Time (ms)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }}
                          />
                          <YAxis
                            stroke="#64748b"
                            style={{ fontSize: '10px', fontFamily: 'monospace' }}
                            label={{ value: 'Current (A)', angle: -90, position: 'insideLeft', offset: 10, fill: '#94a3b8', fontSize: 10 }}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                          />
                          <Line type="monotone" dataKey="id_ref" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Id Ref" />
                          <Line type="monotone" dataKey="id_act" stroke="#3b82f6" strokeWidth={2.5} dot={false} name="Id Actual" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Demonstration of Decoupled Control banner */}
                <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-accent/10 border border-emerald-accent/20 shrink-0">
                      <TrendingUp className="h-5 w-5 text-emerald-accent" />
                    </div>
                    <div className="space-y-1.5 font-mono text-xs">
                      <h4 className="text-white font-bold uppercase tracking-wider">
                        Decoupled Field-Oriented Control Demonstration
                      </h4>
                      <p className="text-slate-400 leading-relaxed">
                        Notice that the <b className="text-white">Id Response</b> loop remains completely undisturbed at its set reference point even when you make massive, sudden, step changes to the <b className="text-white">Iq Reference</b> (Torque loop). 
                      </p>
                      <p className="text-slate-500 leading-relaxed text-[11px] pt-1">
                        In non-vector scalar control (like V/f), changing speed or load couples directly into the motor core flux, risking stator magnetic saturations or torque droop. By implementing d-q axis decoupling feedback loops, FOC handles stator magnetic flux (Id) and rotor electromagnetic torque (Iq) as completely independent variables.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
