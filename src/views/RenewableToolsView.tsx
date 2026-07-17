import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sun, 
  Wind,
  Zap,
  Flame,
  HelpCircle,
  Info,
  TrendingUp,
  RotateCcw,
  Play,
  Pause,
  ArrowLeft,
  Check,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceDot,
  ReferenceLine,
  LineChart
} from 'recharts';
import { IEEEReportButton } from '../components/IEEEReportButton';

// Custom hooks
import { usePVSimulator } from '../hooks/usePVSimulator';
import { useWindPower } from '../hooks/useWindPower';
import { useDroopControl } from '../hooks/useDroopControl';

export default function RenewableToolsView() {
  // Tab selector inside the view
  const [activeTab, setActiveTab] = useState<'pv-mppt' | 'wind' | 'droop' | 'paschen'>('pv-mppt');

  // ==============================================
  // 1. SOLAR PV & MPPT SIMULATOR STATES
  // ==============================================
  const [pvIrradiance, setPvIrradiance] = useState<number>(1000); // W/m^2
  const [pvTemperature, setPvTemperature] = useState<number>(25); // °C
  const [pvPartialShading, setPvPartialShading] = useState<boolean>(false);
  const [pvIsc0, setPvIsc0] = useState<number>(8.5); // Ref Short Circuit Current
  const [pvVoc0, setPvVoc0] = useState<number>(21.5); // Ref Open Circuit Voltage

  const {
    points: pvPoints,
    mpp: pvMpp,
    mpptState,
    mpptType,
    setMpptType,
    mpptRunning,
    setMpptRunning,
    resetMppt
  } = usePVSimulator(pvIrradiance, pvTemperature, pvPartialShading, pvIsc0, pvVoc0);

  // ==============================================
  // 2. WIND TURBINE POWER STATES
  // ==============================================
  const [windRadius, setWindRadius] = useState<number>(15); // meters
  const [windDensity, setWindDensity] = useState<number>(1.225); // kg/m^3 (sea level standard)
  const [windCp, setWindCp] = useState<number>(0.42); // Power Coefficient (Betz limit is 0.593)
  const [windCutIn, setWindCutIn] = useState<number>(3.0); // m/s
  const [windRated, setWindRated] = useState<number>(12.0); // m/s
  const [windCutOut, setWindCutOut] = useState<number>(20.0); // m/s

  const {
    points: windPoints,
    sweptArea: windSweptArea,
    ratedPowerKW: windRatedPower,
    betzEfficiency: windBetzEfficiency
  } = useWindPower(windRadius, windDensity, windCp, windCutIn, windRated, windCutOut);

  // ==============================================
  // 3. MICROGRID INVERTER DROOP STATES
  // ==============================================
  const [droopRating1, setDroopRating1] = useState<number>(50); // kW
  const [droopRating2, setDroopRating2] = useState<number>(50); // kW
  const [droopMp1, setDroopMp1] = useState<number>(0.04); // Hz/kW
  const [droopMp2, setDroopMp2] = useState<number>(0.04); // Hz/kW
  const [droopNq1, setDroopNq1] = useState<number>(0.5); // V/kVAR
  const [droopNq2, setDroopNq2] = useState<number>(0.5); // V/kVAR
  const [droopPLoad, setDroopPLoad] = useState<number>(60); // kW
  const [droopQLoad, setDroopQLoad] = useState<number>(30); // kVAR
  const [droopChartType, setDroopChartType] = useState<'pf' | 'qv'>('pf');

  const {
    p1: droopP1,
    p2: droopP2,
    q1: droopQ1,
    q2: droopQ2,
    fSteady: droopFSteady,
    vSteady: droopVSteady,
    pfPoints: droopPfPoints,
    qvPoints: droopQvPoints,
    p1Percent: droopP1Percent,
    p2Percent: droopP2Percent,
    sharingIsProportional: droopSharingIsProportional
  } = useDroopControl(
    droopRating1,
    droopRating2,
    droopMp1,
    droopMp2,
    droopNq1,
    droopNq2,
    droopPLoad,
    droopQLoad
  );

  // ==============================================
  // 4. PASCHEN BREAKDOWN STATES (RETINED ORIGINAL)
  // ==============================================
  const [paschenGas, setPaschenGas] = useState<'air' | 'sf6' | 'n2' | 'he'>('air');
  const [paschenPressure, setPaschenPressure] = useState<number>(1.0); // bar
  const [paschenGap, setPaschenGap] = useState<number>(5.0); // mm
  const [paschenGamma, setPaschenGamma] = useState<number>(0.02); // Secondary emission

  const paschenData = React.useMemo(() => {
    const gasConstants: Record<string, { name: string; A: number; B: number; desc: string }> = {
      air: { 
        name: 'Dry Air', 
        A: 15, 
        B: 365, 
        desc: 'Standard atmospheric air. Excellent baseline for air clearances.' 
      },
      sf6: { 
        name: 'Sulfur Hexafluoride (SF6)', 
        A: 40.2, 
        B: 890, 
        desc: 'Electronegative gas. Extremely high dielectric strength, used in GIS.' 
      },
      n2: { 
        name: 'Pure Nitrogen (N2)', 
        A: 12, 
        B: 342, 
        desc: 'Eco-friendly alternative with slightly higher breakdown than ambient air.' 
      },
      he: { 
        name: 'Helium (He)', 
        A: 3, 
        B: 34, 
        desc: 'Light noble gas. Very low ionization limits, low breakdown threshold.' 
      }
    };

    const gas = gasConstants[paschenGas];
    const pTorr = paschenPressure * 750.06;
    const dCm = paschenGap * 0.1;
    const pd = pTorr * dCm; // Torr-cm

    const lnTerm = Math.log(Math.max(1e-12, gas.A * pd));
    const secTerm = Math.log(Math.log(1 + 1 / paschenGamma));
    const denom = lnTerm - secTerm;

    let breakdownVoltageVal = 0;
    if (denom > 0) {
      breakdownVoltageVal = (gas.B * pd) / denom;
    } else {
      breakdownVoltageVal = 300;
    }

    const breakdownVoltage = parseFloat((breakdownVoltageVal / 1000).toFixed(2)); // kV

    const curvePoints: any[] = [];
    const minPd = 0.05;
    const maxPd = 5.0;
    
    for (let i = 1; i <= 50; i++) {
      const fraction = i / 50;
      const currentPd = minPd + fraction * (maxPd - minPd);
      const lnt = Math.log(Math.max(1e-12, gas.A * currentPd));
      const den = lnt - secTerm;
      let vb = 300;
      if (den > 0) {
        vb = (gas.B * currentPd) / den;
      }
      curvePoints.push({
        pdValue: parseFloat(currentPd.toFixed(3)),
        vBreakdown: parseFloat((vb / 1000).toFixed(2))
      });
    }

    return {
      currentPd: parseFloat(pd.toFixed(2)),
      breakdownVoltage,
      gasName: gas.name,
      gasDesc: gas.desc,
      constants: { A: gas.A, B: gas.B },
      curvePoints
    };
  }, [paschenGas, paschenPressure, paschenGap, paschenGamma]);

  return (
    <div className="min-h-screen bg-navy text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        
        {/* Navigation Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-navy-light pb-6 gap-4">
          <div className="flex items-center gap-3">
            <Link 
              to="/tools" 
              className="p-2.5 bg-navy-card/60 hover:bg-navy-light/40 border border-navy-light rounded-xl transition-all text-emerald-accent"
              title="Back to Catalog"
              id="back-btn"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">EEE 4147 / Renewable Energy & Microgrids</span>
              <h1 className="text-2xl font-bold font-sans tracking-tight text-white flex items-center gap-2">
                Renewable Energy & Automation Suite
              </h1>
            </div>
          </div>

          {/* Core Module Selector */}
          <div className="flex flex-wrap bg-navy-card/60 border border-navy-light rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab('pv-mppt')}
              className={`px-3 py-2 rounded-lg text-xs font-bold tracking-wide transition-all flex items-center gap-1.5 ${
                activeTab === 'pv-mppt'
                  ? 'bg-emerald-accent text-navy shadow-lg shadow-emerald-accent/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-navy-light/20'
              }`}
              id="pv-mppt-tab"
            >
              <Sun className="h-3.5 w-3.5" />
              PV Array & MPPT
            </button>
            <button
              onClick={() => setActiveTab('wind')}
              className={`px-3 py-2 rounded-lg text-xs font-bold tracking-wide transition-all flex items-center gap-1.5 ${
                activeTab === 'wind'
                  ? 'bg-emerald-accent text-navy shadow-lg shadow-emerald-accent/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-navy-light/20'
              }`}
              id="wind-tab"
            >
              <Wind className="h-3.5 w-3.5" />
              Wind Turbine & Betz
            </button>
            <button
              onClick={() => setActiveTab('droop')}
              className={`px-3 py-2 rounded-lg text-xs font-bold tracking-wide transition-all flex items-center gap-1.5 ${
                activeTab === 'droop'
                  ? 'bg-emerald-accent text-navy shadow-lg shadow-emerald-accent/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-navy-light/20'
              }`}
              id="droop-tab"
            >
              <Layers className="h-3.5 w-3.5" />
              Microgrid Droop
            </button>
            <button
              onClick={() => setActiveTab('paschen')}
              className={`px-3 py-2 rounded-lg text-xs font-bold tracking-wide transition-all flex items-center gap-1.5 ${
                activeTab === 'paschen'
                  ? 'bg-emerald-accent text-navy shadow-lg shadow-emerald-accent/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-navy-light/20'
              }`}
              id="paschen-tab"
            >
              <Flame className="h-3.5 w-3.5" />
              HV breakdown
            </button>
          </div>
        </div>

        {/* ========================================================
            TAB 1: PV ARRAY I-V/P-V CURVE & MPPT SIMULATOR
            ======================================================== */}
        {activeTab === 'pv-mppt' && (
          <div className="space-y-6">
            
            {/* Header info bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-navy-card/40 border border-navy-light rounded-2xl p-6 gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sun className="h-5 w-5 text-amber-500 animate-pulse" />
                  PV Array Characteristics & MPPT Solver
                </h2>
                <p className="text-xs text-slate-400 max-w-2xl mt-1">
                  Models a 36-cell solar module split into two series strings with protective bypass diodes. Under partial shading, the bypass diode conduction creates multiple local maxima on the power curve, posing a challenge for conventional tracking algorithms.
                </p>
              </div>
              <IEEEReportButton
                experimentName="Photovoltaic (PV) MPPT & Partial Shading Analysis"
                inputData={{
                  'Solar Irradiance (G)': pvIrradiance + ' W/m²',
                  'Cell Temperature (T)': pvTemperature + ' °C',
                  'Partial Shading Status': pvPartialShading ? 'ENABLED (Multi-peak)' : 'DISABLED (Single-peak)',
                  'MPPT Tracker Algorithm': mpptType === 'po' ? 'Perturb & Observe (P&O)' : 'Global Sweep Scanner',
                  'Nominal Cell Ratings': `Isc0=${pvIsc0}A, Voc0=${pvVoc0}V`
                }}
                outputData={{
                  'Global Peak Power (GMPP)': pvMpp.power + ' W',
                  'Tracked Voltage (V_track)': mpptState.voltage + ' V',
                  'Tracked Power (P_track)': mpptState.power + ' W',
                  'Tracker Status': mpptState.status.toUpperCase(),
                  'MPPT Efficiency (%)': parseFloat(((mpptState.power / pvMpp.power) * 100).toFixed(1)) + '%'
                }}
                chartSelectors={['#mppt-chart-container']}
              />
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-navy-card border border-navy-light p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">True Global MPP (GMPP)</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold font-mono text-emerald-accent">{pvMpp.power}</span>
                  <span className="text-xs text-slate-400 font-mono">W</span>
                </div>
              </div>
              <div className="bg-navy-card border border-navy-light p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Tracked Operating Power</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold font-mono text-sky-400">{mpptState.power}</span>
                  <span className="text-xs text-slate-400 font-mono">W</span>
                </div>
              </div>
              <div className="bg-navy-card border border-navy-light p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">MPPT Efficiency</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold font-mono text-amber-500">
                    {pvMpp.power > 0 ? ((mpptState.power / pvMpp.power) * 100).toFixed(1) : '0.0'}%
                  </span>
                </div>
              </div>
              <div className="bg-navy-card border border-navy-light p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Tracker Status</span>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${
                    mpptState.status === 'settled' ? 'bg-emerald-500 animate-pulse' :
                    mpptState.status === 'sweeping' || mpptState.status === 'tracking' ? 'bg-amber-500 animate-bounce' :
                    'bg-slate-600'
                  }`}></span>
                  <span className="text-xs font-bold font-mono text-white capitalize">{mpptState.status}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Controls Column */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Physical Slider Controls */}
                <div className="bg-navy-card border border-navy-light p-6 rounded-2xl shadow-xl space-y-5">
                  <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider border-b border-navy-light/40 pb-2 flex items-center gap-1.5">
                    <Cpu className="h-4 w-4 text-emerald-accent" />
                    1. Env & Array Configuration
                  </h3>

                  {/* Irradiance */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Irradiance (G)</span>
                      <span className="text-white font-bold">{pvIrradiance} W/m²</span>
                    </div>
                    <input
                      type="range"
                      min="200"
                      max="1200"
                      step="50"
                      value={pvIrradiance}
                      onChange={(e) => setPvIrradiance(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-navy-light rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>200 (Overcast)</span>
                      <span>1200 (Peak Direct)</span>
                    </div>
                  </div>

                  {/* Temperature */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Cell Temp (Tc)</span>
                      <span className="text-white font-bold">{pvTemperature} °C</span>
                    </div>
                    <input
                      type="range"
                      min="-10"
                      max="80"
                      step="2"
                      value={pvTemperature}
                      onChange={(e) => setPvTemperature(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-navy-light rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>-10 °C (Frosty)</span>
                      <span>80 °C (Extreme Thermal)</span>
                    </div>
                  </div>

                  {/* Partial Shading Switch */}
                  <div className="flex items-center justify-between bg-navy/60 p-3.5 rounded-xl border border-navy-light/60">
                    <div>
                      <span className="text-xs font-bold text-white block">Partial Shading</span>
                      <span className="text-[10px] text-slate-400">Simulate shade on Substring B</span>
                    </div>
                    <button
                      onClick={() => setPvPartialShading(!pvPartialShading)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        pvPartialShading ? 'bg-emerald-accent' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          pvPartialShading ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Reference cell parameters toggler to keep things detailed */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-navy-light/30">
                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Isc0 Ref (A)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="5.0"
                        max="15.0"
                        value={pvIsc0}
                        onChange={(e) => setPvIsc0(Math.max(5.0, parseFloat(e.target.value) || 5.0))}
                        className="w-full bg-navy border border-navy-light rounded-lg p-1.5 text-xs font-mono text-center text-emerald-accent"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Voc0 Ref (V)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="15.0"
                        max="30.0"
                        value={pvVoc0}
                        onChange={(e) => setPvVoc0(Math.max(15.0, parseFloat(e.target.value) || 15.0))}
                        className="w-full bg-navy border border-navy-light rounded-lg p-1.5 text-xs font-mono text-center text-emerald-accent"
                      />
                    </div>
                  </div>
                </div>

                {/* MPPT Driver panel */}
                <div className="bg-navy-card border border-navy-light p-6 rounded-2xl shadow-xl space-y-4">
                  <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider border-b border-navy-light/40 pb-2 flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-emerald-accent" />
                    2. MPPT Tracking Simulator
                  </h3>

                  {/* MPPT Mode Selector */}
                  <div className="grid grid-cols-2 gap-2 bg-navy/60 p-1 border border-navy-light/50 rounded-xl">
                    <button
                      onClick={() => {
                        setMpptType('po');
                        resetMppt();
                      }}
                      className={`p-2 rounded-lg text-[11px] font-bold tracking-wide transition-all ${
                        mpptType === 'po'
                          ? 'bg-navy-light text-white border border-navy-light'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Perturb & Observe (P&O)
                    </button>
                    <button
                      onClick={() => {
                        setMpptType('global');
                        resetMppt();
                      }}
                      className={`p-2 rounded-lg text-[11px] font-bold tracking-wide transition-all ${
                        mpptType === 'global'
                          ? 'bg-navy-light text-white border border-navy-light'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Global Sweep Scan
                    </button>
                  </div>

                  {/* MPPT Description */}
                  <p className="text-[11px] text-slate-400 italic bg-navy/30 p-2.5 rounded-lg">
                    {mpptType === 'po' 
                      ? "P&O MPPT uses iterative step perturbations. In partial shading, it easily gets trapped in local peaks, as it only looks at immediate adjacent power trends."
                      : "Global Sweep sweeps the full voltage range to map the entire curve, finding the absolute global peak (GMPP) and escaping local shadow valleys."
                    }
                  </p>

                  {/* MPPT Control Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setMpptRunning(!mpptRunning)}
                      className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition-all ${
                        mpptRunning 
                          ? 'bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20' 
                          : 'bg-emerald-accent/10 border-emerald-accent/40 text-emerald-accent hover:bg-emerald-accent/20'
                      }`}
                    >
                      {mpptRunning ? (
                        <>
                          <Pause className="h-3.5 w-3.5" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" />
                          Run
                        </>
                      )}
                    </button>
                    <button
                      onClick={resetMppt}
                      className="py-2 px-3 rounded-xl bg-navy border border-navy-light text-slate-300 font-bold text-xs flex items-center justify-center gap-1 hover:bg-navy-light/30 transition-all"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset
                    </button>
                    <button
                      onClick={() => {
                        resetMppt();
                        setMpptRunning(true);
                      }}
                      className="py-2 px-3 rounded-xl bg-emerald-accent text-navy font-bold text-xs flex items-center justify-center hover:bg-emerald-accent-hover transition-all"
                    >
                      Quick Start
                    </button>
                  </div>
                </div>

              </div>

              {/* Visualization Column */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Curve Plots */}
                <div className="bg-navy-card border border-navy-light p-6 rounded-2xl shadow-xl space-y-4" id="mppt-chart-container">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-navy-light/30 pb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dynamic PV Curve Plotter</h4>
                      <p className="text-[10px] text-slate-500 font-mono">X-Axis: Voltage (V) | Left Y: Current (A) | Right Y: Power (W)</p>
                    </div>
                    <div className="flex items-center gap-3 bg-navy/80 p-2 rounded-xl border border-navy-light/60 text-[10px] font-mono">
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        <span className="h-2 w-2 bg-amber-500 rounded-full inline-block"></span> I-V Curve
                      </span>
                      <span className="flex items-center gap-1 text-sky-400 font-bold">
                        <span className="h-2 w-2 bg-sky-400 rounded-full inline-block"></span> P-V Curve
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <span className="h-2 w-2 bg-emerald-500 rounded-full inline-block"></span> GMPP
                      </span>
                    </div>
                  </div>

                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={pvPoints}
                        margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
                      >
                        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="voltage" 
                          stroke="#64748b" 
                          type="number"
                          domain={[0, 'auto']}
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          label={{ value: 'Voltage (V)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
                        />
                        <YAxis 
                          yAxisId="left"
                          stroke="#f59e0b" 
                          tick={{ fill: '#f59e0b', fontSize: 10 }}
                          label={{ value: 'Current (A)', angle: -90, position: 'insideLeft', offset: 0, fill: '#f59e0b', fontSize: 11 }}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          stroke="#38bdf8" 
                          tick={{ fill: '#38bdf8', fontSize: 10 }}
                          label={{ value: 'Power (W)', angle: 90, position: 'insideRight', offset: 10, fill: '#38bdf8', fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                          labelStyle={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}
                          itemStyle={{ fontSize: '12px' }}
                        />
                        
                        {/* P-V Area under curve */}
                        <Area
                          yAxisId="right"
                          type="monotone"
                          dataKey="power"
                          fill="#0284c7"
                          fillOpacity={0.08}
                          stroke="none"
                        />

                        {/* I-V Curve */}
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="current" 
                          stroke="#f59e0b" 
                          strokeWidth={2.5} 
                          dot={false}
                          activeDot={{ r: 5 }}
                        />

                        {/* P-V Curve */}
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="power" 
                          stroke="#38bdf8" 
                          strokeWidth={2.5} 
                          dot={false}
                          activeDot={{ r: 5 }}
                        />

                        {/* Actual Global MPP Reference Highlight */}
                        <ReferenceDot
                          yAxisId="right"
                          x={pvMpp.voltage}
                          y={pvMpp.power}
                          r={6}
                          fill="#10b981"
                          stroke="#ffffff"
                          strokeWidth={2}
                        />

                        {/* Animated MPPT Tracker Dot */}
                        <ReferenceDot
                          yAxisId="right"
                          x={mpptState.voltage}
                          y={mpptState.power}
                          r={8}
                          fill="#ef4444"
                          stroke="#ffffff"
                          strokeWidth={2.5}
                          className="animate-pulse"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Tracker state box */}
                  <div className="bg-navy bg-opacity-60 border border-navy-light/60 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 font-bold text-[10px]">
                        TRACKER
                      </span>
                      <div>
                        <span className="text-white font-bold block">Perturbation State</span>
                        <span className="text-[10px] text-slate-500">Real-time operating point coordinates</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-6 text-center sm:text-right">
                      <div>
                        <span className="text-[10px] text-slate-500 block">V_track</span>
                        <span className="text-sm font-bold text-red-400">{mpptState.voltage.toFixed(1)} V</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">I_track</span>
                        <span className="text-sm font-bold text-amber-400">{mpptState.current.toFixed(2)} A</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">P_track</span>
                        <span className="text-sm font-bold text-sky-400">{mpptState.power.toFixed(1)} W</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Substring Schematics */}
                <div className="bg-navy-card/30 border border-navy-light p-5 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2 border-r border-navy-light/30 pr-4">
                    <h5 className="font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <Sparkles className="h-4 w-4 text-emerald-accent" />
                      Module String Equivalent
                    </h5>
                    <p className="text-slate-400 leading-relaxed">
                      This virtual solar panel is divided into Substring A (18 series cells) and Substring B (18 series cells). Each string is shunted by a bypass diode.
                    </p>
                    <p className="text-slate-400">
                      When Shading is ON, Substring B receives only 35% sunlight. When current exceeds 2.9A, Substring B's bypass diode conducts, limiting its output and creating a shaded dip.
                    </p>
                  </div>
                  <div className="flex flex-col justify-center space-y-3 bg-navy/40 p-4 rounded-xl border border-navy-light/40 font-mono text-[11px]">
                    <div className="flex justify-between items-center pb-2 border-b border-navy-light/30">
                      <span className="text-slate-400">Substring A (Sunny):</span>
                      <span className="text-emerald-400 font-bold">100% G ({pvIrradiance} W/m²)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Substring B (Shaded):</span>
                      <span className={pvPartialShading ? 'text-amber-500 font-bold' : 'text-emerald-400 font-bold'}>
                        {pvPartialShading ? '35% G (' + Math.round(pvIrradiance * 0.35) + ' W/m²)' : '100% G (' + pvIrradiance + ' W/m²)'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ========================================================
            TAB 2: WIND TURBINE POWER & BETZ LIMIT PLOTTER
            ======================================================== */}
        {activeTab === 'wind' && (
          <div className="space-y-6">
            
            {/* Header info bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-navy-card/40 border border-navy-light rounded-2xl p-6 gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Wind className="h-5 w-5 text-emerald-accent" />
                  Wind Turbine Power & Pitch Control Simulator
                </h2>
                <p className="text-xs text-slate-400 max-w-2xl mt-1">
                  Plots aerodynamic mechanical power vs wind speed, demonstrating physical operational boundaries: Cut-in (spins start), Rated (maximum generator load reached), and Cut-out (survival brake activated).
                </p>
              </div>
              <IEEEReportButton
                experimentName="Aerodynamic Limits of Wind Energy & Turbine Pitch Control"
                inputData={{
                  'Blade Radius (r)': windRadius + ' m',
                  'Air Density (rho)': windDensity + ' kg/m³',
                  'Power Coefficient (Cp)': windCp,
                  'Cut-in Speed': windCutIn + ' m/s',
                  'Rated Speed': windRated + ' m/s',
                  'Cut-out Speed': windCutOut + ' m/s'
                }}
                outputData={{
                  'Blade Swept Area': windSweptArea + ' m²',
                  'Maximum Rated Power': windRatedPower + ' kW',
                  'Theoretical Betz Limit Ratio': windBetzEfficiency + '%'
                }}
                chartSelectors={['#wind-chart-container']}
              />
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-navy-card border border-navy-light p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Swept Rotor Area</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold font-mono text-emerald-accent">{windSweptArea}</span>
                  <span className="text-xs text-slate-400 font-mono">m²</span>
                </div>
              </div>
              <div className="bg-navy-card border border-navy-light p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Rated Electrical Power</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold font-mono text-sky-400">{windRatedPower}</span>
                  <span className="text-xs text-slate-400 font-mono">kW</span>
                </div>
              </div>
              <div className="bg-navy-card border border-navy-light p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Betz Efficiency Limit</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold font-mono text-amber-500">{windBetzEfficiency}%</span>
                </div>
              </div>
              <div className="bg-navy-card border border-navy-light p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Operational Status</span>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold font-mono text-white capitalize">Active Pitch Regulated</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Controls Column */}
              <div className="lg:col-span-1 space-y-6">
                
                <div className="bg-navy-card border border-navy-light p-6 rounded-2xl shadow-xl space-y-5">
                  <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider border-b border-navy-light/40 pb-2 flex items-center gap-1.5">
                    <Cpu className="h-4 w-4 text-emerald-accent" />
                    Aerodynamic Parameters
                  </h3>

                  {/* Blade Radius */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Blade Radius (r)</span>
                      <span className="text-white font-bold">{windRadius} m</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="60"
                      step="1"
                      value={windRadius}
                      onChange={(e) => setWindRadius(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-navy-light rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>5 m (Residential)</span>
                      <span>60 m (Utility Grid)</span>
                    </div>
                  </div>

                  {/* Air Density */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Air Density (ρ)</span>
                      <span className="text-white font-bold">{windDensity.toFixed(3)} kg/m³</span>
                    </div>
                    <input
                      type="range"
                      min="0.900"
                      max="1.350"
                      step="0.005"
                      value={windDensity}
                      onChange={(e) => setWindDensity(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-navy-light rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>0.900 (High Alt)</span>
                      <span>1.350 (Cold Sea Level)</span>
                    </div>
                  </div>

                  {/* Power Coefficient Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Power Coefficient (Cp)</span>
                      <span className="text-white font-bold">{windCp.toFixed(3)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.10"
                      max="0.593"
                      step="0.01"
                      value={windCp}
                      onChange={(e) => setWindCp(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-navy-light rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>0.10 (Poor Aerodynamic)</span>
                      <span className="text-emerald-400 font-bold">0.593 (Betz Limit)</span>
                    </div>
                  </div>
                </div>

                {/* Threshold Limits card */}
                <div className="bg-navy-card border border-navy-light p-6 rounded-2xl shadow-xl space-y-4">
                  <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider border-b border-navy-light/40 pb-2 flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-emerald-accent" />
                    Turbine Speed Settings
                  </h3>

                  {/* Cut-in Speed */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Cut-In Speed</span>
                      <span className="text-white font-bold">{windCutIn} m/s</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="5.0"
                      step="0.5"
                      value={windCutIn}
                      onChange={(e) => setWindCutIn(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-navy-light rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                    />
                  </div>

                  {/* Rated Speed */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Rated Speed</span>
                      <span className="text-white font-bold">{windRated} m/s</span>
                    </div>
                    <input
                      type="range"
                      min="8.0"
                      max="15.0"
                      step="0.5"
                      value={windRated}
                      onChange={(e) => setWindRated(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-navy-light rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                    />
                  </div>

                  {/* Cut-out Speed */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Cut-Out Speed</span>
                      <span className="text-white font-bold">{windCutOut} m/s</span>
                    </div>
                    <input
                      type="range"
                      min="16.0"
                      max="25.0"
                      step="0.5"
                      value={windCutOut}
                      onChange={(e) => setWindCutOut(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-navy-light rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                    />
                  </div>
                </div>

              </div>

              {/* Visualization Column */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Wind Curve Plot */}
                <div className="bg-navy-card border border-navy-light p-6 rounded-2xl shadow-xl space-y-4" id="wind-chart-container">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-navy-light/30 pb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Turbine Power Curve</h4>
                      <p className="text-[10px] text-slate-500 font-mono">Power Output (kW) vs. Wind Speed (m/s)</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 bg-navy/80 p-2 rounded-xl border border-navy-light/60 text-[10px] font-mono">
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <span className="h-2 w-2 bg-emerald-400 rounded-full inline-block"></span> Actual curve
                      </span>
                      <span className="flex items-center gap-1 text-slate-400 font-bold">
                        <span className="h-2 w-2 bg-slate-500 rounded-full inline-block"></span> Uncontrolled
                      </span>
                      <span className="flex items-center gap-1 text-orange-400 font-bold">
                        <span className="h-2 w-2 bg-orange-400 rounded-full inline-block"></span> Betz Boundary
                      </span>
                    </div>
                  </div>

                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={windPoints}
                        margin={{ top: 20, right: 30, bottom: 20, left: 10 }}
                      >
                        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="speed" 
                          stroke="#64748b" 
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          label={{ value: 'Wind Speed (m/s)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
                        />
                        <YAxis 
                          stroke="#10b981" 
                          tick={{ fill: '#10b981', fontSize: 10 }}
                          label={{ value: 'Mechanical Power (kW)', angle: -90, position: 'insideLeft', offset: 0, fill: '#10b981', fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                          labelStyle={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}
                          itemStyle={{ fontSize: '12px' }}
                        />
                        
                        {/* Cut-in Speed boundary */}
                        <ReferenceLine 
                          x={windCutIn} 
                          stroke="#64748b" 
                          strokeDasharray="4 4"
                          label={{ value: 'Cut-In', position: 'top', fill: '#64748b', fontSize: 10 }}
                        />

                        {/* Rated speed (where blade pitch begins flatline) */}
                        <ReferenceLine 
                          x={windRated} 
                          stroke="#38bdf8" 
                          strokeDasharray="4 4"
                          label={{ value: 'Rated Speed (Pitch Active)', position: 'top', fill: '#38bdf8', fontSize: 10 }}
                        />

                        {/* Cut-out shutdown speed */}
                        <ReferenceLine 
                          x={windCutOut} 
                          stroke="#ef4444" 
                          strokeDasharray="4 4"
                          label={{ value: 'Cut-Out (Emergency Brake)', position: 'top', fill: '#ef4444', fontSize: 10 }}
                        />

                        {/* Betz Limit Power */}
                        <Line 
                          type="monotone" 
                          dataKey="betzLimit" 
                          stroke="#f97316" 
                          strokeDasharray="3 3"
                          strokeWidth={1.5} 
                          dot={false}
                        />

                        {/* Uncontrolled Cubic Climber */}
                        <Line 
                          type="monotone" 
                          dataKey="uncontrolledPower" 
                          stroke="#475569" 
                          strokeDasharray="5 5"
                          strokeWidth={1.5} 
                          dot={false}
                        />

                        {/* Actual Operational Power Curve */}
                        <Line 
                          type="monotone" 
                          dataKey="actualPower" 
                          stroke="#10b981" 
                          strokeWidth={3} 
                          dot={false}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Speed zone info */}
                  <div className="bg-navy bg-opacity-60 border border-navy-light/60 p-4 rounded-xl text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-400 font-mono">
                      <span className="h-2 w-2 bg-emerald-400 rounded-full inline-block"></span>
                      Zone Reference:
                    </span>
                    <div className="font-mono text-slate-300 text-[10px] space-x-4">
                      <span>Cut-In = <strong className="text-white">{windCutIn} m/s</strong></span>
                      <span>Rated = <strong className="text-sky-400">{windRated} m/s</strong></span>
                      <span>Cut-Out = <strong className="text-red-400">{windCutOut} m/s</strong></span>
                    </div>
                  </div>
                </div>

                {/* Betz limit explanation */}
                <div className="bg-navy-card/40 border border-navy-light p-5 rounded-2xl text-xs space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <HelpCircle className="h-4 w-4 text-emerald-accent" />
                    Aerodynamic Principle: The Betz Limit
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    Albert Betz proved in 1919 that no turbine can capture more than <strong>59.3%</strong> of the kinetic energy in wind (<code className="text-white">Cp = 16/27 ≈ 0.593</code>). The remaining energy must reside in the air moving away from the turbine to maintain steady fluid flow.
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    Between rated speed ({windRated} m/s) and cut-out speed ({windCutOut} m/s), <strong>Pitch Control</strong> rotates the blades along their longitudinal axis. This reduces the aerodynamic lift coefficient to keep mechanical loading exactly on the generator's safety boundary.
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ========================================================
            TAB 3: MICROGRID INVERTER DROOP CONTROL ANALYZER
            ======================================================== */}
        {activeTab === 'droop' && (
          <div className="space-y-6">
            
            {/* Header info bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-navy-card/40 border border-navy-light rounded-2xl p-6 gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-sky-400" />
                  Microgrid Inverter Droop Control & Load Sharing
                </h2>
                <p className="text-xs text-slate-400 max-w-2xl mt-1">
                  Simulates peer-to-peer active and reactive power sharing among grid-forming parallel inverters. Demonstrates how frequency and voltage droop characteristics enable autonomous grid stability without communications.
                </p>
              </div>
              <IEEEReportButton
                experimentName="Parallel Inverter Droop Control & Microgrid Load Sharing"
                inputData={{
                  'Inverter 1 capacity': droopRating1 + ' kW',
                  'Inverter 2 capacity': droopRating2 + ' kW',
                  'Active Droop mp1': droopMp1 + ' Hz/kW',
                  'Active Droop mp2': droopMp2 + ' Hz/kW',
                  'Reactive Droop nq1': droopNq1 + ' V/kVAR',
                  'Reactive Droop nq2': droopNq2 + ' V/kVAR',
                  'Active Load Demand': droopPLoad + ' kW',
                  'Reactive Load Demand': droopQLoad + ' kVAR'
                }}
                outputData={{
                  'Inverter 1 Share': `${droopP1} kW (${droopP1Percent}%)`,
                  'Inverter 2 Share': `${droopP2} kW (${droopP2Percent}%)`,
                  'Steady Frequency': droopFSteady + ' Hz',
                  'Steady Voltage': droopVSteady + ' V',
                  'Capacity Overloaded': (droopP1 > droopRating1 || droopP2 > droopRating2) ? 'YES (OVERLOAD)' : 'NO'
                }}
                chartSelectors={['#droop-chart-container']}
              />
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-navy-card border border-navy-light p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Steady System Frequency</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold font-mono text-emerald-accent">{droopFSteady}</span>
                  <span className="text-xs text-slate-400 font-mono">Hz</span>
                </div>
              </div>
              <div className="bg-navy-card border border-navy-light p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Steady Terminal Voltage</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold font-mono text-sky-400">{droopVSteady}</span>
                  <span className="text-xs text-slate-400 font-mono">V</span>
                </div>
              </div>
              <div className="bg-navy-card border border-navy-light p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Inverter 1 Active Share</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-bold font-mono text-white">{droopP1}</span>
                  <span className="text-xs font-mono text-slate-400">kW ({droopP1Percent}%)</span>
                </div>
              </div>
              <div className="bg-navy-card border border-navy-light p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Inverter 2 Active Share</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-bold font-mono text-white">{droopP2}</span>
                  <span className="text-xs font-mono text-slate-400">kW ({droopP2Percent}%)</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Controls Column */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Inverter 1 Specs */}
                <div className="bg-navy-card border border-navy-light p-5 rounded-2xl shadow-xl space-y-4">
                  <h3 className="text-xs font-bold font-mono text-sky-400 uppercase tracking-wider border-b border-navy-light/40 pb-2 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                    Inverter 1 Settings
                  </h3>

                  {/* Rating */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Rating Capacity (S1)</span>
                      <span className="text-white font-bold">{droopRating1} kW</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="150"
                      step="5"
                      value={droopRating1}
                      onChange={(e) => setDroopRating1(parseInt(e.target.value))}
                      className="w-full h-1 bg-navy-light rounded-lg appearance-none cursor-pointer accent-sky-400"
                    />
                  </div>

                  {/* Active Droop mp1 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Frequency Droop (m_p1)</span>
                      <span className="text-white font-bold">{droopMp1.toFixed(3)} Hz/kW</span>
                    </div>
                    <input
                      type="range"
                      min="0.010"
                      max="0.100"
                      step="0.005"
                      value={droopMp1}
                      onChange={(e) => setDroopMp1(parseFloat(e.target.value))}
                      className="w-full h-1 bg-navy-light rounded-lg appearance-none cursor-pointer accent-sky-400"
                    />
                  </div>

                  {/* Reactive Droop nq1 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Voltage Droop (n_q1)</span>
                      <span className="text-white font-bold">{droopNq1.toFixed(2)} V/kVAR</span>
                    </div>
                    <input
                      type="range"
                      min="0.10"
                      max="2.00"
                      step="0.05"
                      value={droopNq1}
                      onChange={(e) => setDroopNq1(parseFloat(e.target.value))}
                      className="w-full h-1 bg-navy-light rounded-lg appearance-none cursor-pointer accent-sky-400"
                    />
                  </div>
                </div>

                {/* Inverter 2 Specs */}
                <div className="bg-navy-card border border-navy-light p-5 rounded-2xl shadow-xl space-y-4">
                  <h3 className="text-xs font-bold font-mono text-amber-500 uppercase tracking-wider border-b border-navy-light/40 pb-2 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                    Inverter 2 Settings
                  </h3>

                  {/* Rating */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Rating Capacity (S2)</span>
                      <span className="text-white font-bold">{droopRating2} kW</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="150"
                      step="5"
                      value={droopRating2}
                      onChange={(e) => setDroopRating2(parseInt(e.target.value))}
                      className="w-full h-1 bg-navy-light rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>

                  {/* Active Droop mp2 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Frequency Droop (m_p2)</span>
                      <span className="text-white font-bold">{droopMp2.toFixed(3)} Hz/kW</span>
                    </div>
                    <input
                      type="range"
                      min="0.010"
                      max="0.100"
                      step="0.005"
                      value={droopMp2}
                      onChange={(e) => setDroopMp2(parseFloat(e.target.value))}
                      className="w-full h-1 bg-navy-light rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>

                  {/* Reactive Droop nq2 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Voltage Droop (n_q2)</span>
                      <span className="text-white font-bold">{droopNq2.toFixed(2)} V/kVAR</span>
                    </div>
                    <input
                      type="range"
                      min="0.10"
                      max="2.00"
                      step="0.05"
                      value={droopNq2}
                      onChange={(e) => setDroopNq2(parseFloat(e.target.value))}
                      className="w-full h-1 bg-navy-light rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                </div>

                {/* Total Load Sliders */}
                <div className="bg-navy-card border border-navy-light p-5 rounded-2xl shadow-xl space-y-4">
                  <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider border-b border-navy-light/40 pb-2 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-emerald-accent" />
                    Microgrid Combined Load
                  </h3>

                  {/* Active Load PLoad */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Active Load (P_load)</span>
                      <span className="text-white font-bold">{droopPLoad} kW</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max={droopRating1 + droopRating2}
                      step="2"
                      value={droopPLoad}
                      onChange={(e) => setDroopPLoad(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-navy-light rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                      <span>10 kW</span>
                      <span>Total Capacity: {droopRating1 + droopRating2} kW</span>
                    </div>
                  </div>

                  {/* Reactive Load QLoad */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Reactive Load (Q_load)</span>
                      <span className="text-white font-bold">{droopQLoad} kVAR</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max={Math.round(0.8 * (droopRating1 + droopRating2))}
                      step="1"
                      value={droopQLoad}
                      onChange={(e) => setDroopQLoad(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-navy-light rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                      <span>5 kVAR</span>
                      <span>Max limit: {Math.round(0.8 * (droopRating1 + droopRating2))} kVAR</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Visualization Column */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Intersection Chart */}
                <div className="bg-navy-card border border-navy-light p-6 rounded-2xl shadow-xl space-y-4" id="droop-chart-container">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-navy-light/30 pb-3">
                    <div>
                      {/* Chart title switcher */}
                      <div className="flex items-center bg-navy p-1 rounded-xl border border-navy-light/60">
                        <button
                          onClick={() => setDroopChartType('pf')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition-all ${
                            droopChartType === 'pf' ? 'bg-navy-light text-white border border-navy-light' : 'text-slate-400'
                          }`}
                        >
                          P-f Droop Line
                        </button>
                        <button
                          onClick={() => setDroopChartType('qv')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition-all ${
                            droopChartType === 'qv' ? 'bg-navy-light text-white border border-navy-light' : 'text-slate-400'
                          }`}
                        >
                          Q-V Droop Line
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-mono">
                      <span className="flex items-center gap-1 text-sky-400 font-bold">
                        <span className="h-2 w-2 bg-sky-400 rounded-full inline-block"></span> Inverter 1 Droop
                      </span>
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        <span className="h-2 w-2 bg-amber-500 rounded-full inline-block"></span> Inverter 2 Droop
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <span className="h-2 w-2 bg-emerald-400 rounded-full inline-block"></span> Steady Point
                      </span>
                    </div>
                  </div>

                  {droopChartType === 'pf' ? (
                    // 1. ACTIVE POWER FREQUENCY CHART
                    <div className="space-y-4">
                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={droopPfPoints}
                            margin={{ top: 20, right: 30, bottom: 20, left: 10 }}
                          >
                            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="pActive" 
                              stroke="#64748b" 
                              type="number"
                              domain={[0, droopPLoad]}
                              tick={{ fill: '#64748b', fontSize: 10 }}
                              label={{ value: 'Active Power (X-axis, coordinate)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
                            />
                            <YAxis 
                              stroke="#64748b" 
                              type="number"
                              domain={['auto', 'auto']}
                              tick={{ fill: '#64748b', fontSize: 10 }}
                              label={{ value: 'Frequency (Hz)', angle: -90, position: 'insideLeft', offset: 0, fill: '#64748b', fontSize: 11 }}
                            />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                              labelStyle={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}
                              itemStyle={{ fontSize: '12px' }}
                            />

                            {/* Inverter 1 Droop Line (climbing down from left to right) */}
                            <Line 
                              type="monotone" 
                              dataKey="inv1Freq" 
                              stroke="#38bdf8" 
                              strokeWidth={3} 
                              dot={false}
                            />

                            {/* Inverter 2 Droop Line (climbing down from right to left) */}
                            <Line 
                              type="monotone" 
                              dataKey="inv2Freq" 
                              stroke="#f59e0b" 
                              strokeWidth={3} 
                              dot={false}
                            />

                            {/* Vertical line dividing load sharing */}
                            <ReferenceLine 
                              x={droopP1} 
                              stroke="#10b981" 
                              strokeDasharray="4 4"
                              label={{ value: `P1 = ${droopP1} kW (Left Share)`, position: 'insideLeft', fill: '#10b981', fontSize: 10 }}
                            />

                            {/* Horizontal Reference Line at Steady Frequency */}
                            <ReferenceLine 
                              y={droopFSteady} 
                              stroke="#10b981" 
                              strokeDasharray="4 4"
                              label={{ value: `Steady Freq = ${droopFSteady} Hz`, position: 'insideBottomRight', fill: '#10b981', fontSize: 10 }}
                            />

                            {/* Intersection dot */}
                            <ReferenceDot
                              x={droopP1}
                              y={droopFSteady}
                              r={7}
                              fill="#10b981"
                              stroke="#ffffff"
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Power division explanation */}
                      <div className="bg-navy bg-opacity-60 border border-navy-light/60 p-4 rounded-xl flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">Total Load shared:</span>
                        <div className="text-slate-200">
                          Inverter 1: <strong className="text-sky-400">{droopP1} kW</strong> | Inverter 2: <strong className="text-amber-500">{droopP2} kW</strong> | f_steady: <strong className="text-emerald-accent">{droopFSteady} Hz</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // 2. REACTIVE POWER VOLTAGE CHART
                    <div className="space-y-4">
                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={droopQvPoints}
                            margin={{ top: 20, right: 30, bottom: 20, left: 10 }}
                          >
                            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="qReactive" 
                              stroke="#64748b" 
                              type="number"
                              domain={[0, droopQLoad]}
                              tick={{ fill: '#64748b', fontSize: 10 }}
                              label={{ value: 'Reactive Power (kVAR)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
                            />
                            <YAxis 
                              stroke="#64748b" 
                              type="number"
                              domain={['auto', 'auto']}
                              tick={{ fill: '#64748b', fontSize: 10 }}
                              label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft', offset: 0, fill: '#64748b', fontSize: 11 }}
                            />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                              labelStyle={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}
                              itemStyle={{ fontSize: '12px' }}
                            />

                            {/* Inverter 1 Droop Line */}
                            <Line 
                              type="monotone" 
                              dataKey="inv1Volt" 
                              stroke="#38bdf8" 
                              strokeWidth={3} 
                              dot={false}
                            />

                            {/* Inverter 2 Droop Line */}
                            <Line 
                              type="monotone" 
                              dataKey="inv2Volt" 
                              stroke="#f59e0b" 
                              strokeWidth={3} 
                              dot={false}
                            />

                            {/* Vertical divider */}
                            <ReferenceLine 
                              x={droopQ1} 
                              stroke="#10b981" 
                              strokeDasharray="4 4"
                              label={{ value: `Q1 = ${droopQ1} kVAR`, position: 'insideLeft', fill: '#10b981', fontSize: 10 }}
                            />

                            {/* Steady state voltage divider */}
                            <ReferenceLine 
                              y={droopVSteady} 
                              stroke="#10b981" 
                              strokeDasharray="4 4"
                              label={{ value: `Steady Volt = ${droopVSteady} V`, position: 'insideBottomRight', fill: '#10b981', fontSize: 10 }}
                            />

                            {/* Intersection dot */}
                            <ReferenceDot
                              x={droopQ1}
                              y={droopVSteady}
                              r={7}
                              fill="#10b981"
                              stroke="#ffffff"
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Reactive division explanation */}
                      <div className="bg-navy bg-opacity-60 border border-navy-light/60 p-4 rounded-xl flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">Total Reactive shared:</span>
                        <div className="text-slate-200">
                          Inverter 1: <strong className="text-sky-400">{droopQ1} kVAR</strong> | Inverter 2: <strong className="text-amber-500">{droopQ2} kVAR</strong> | V_steady: <strong className="text-emerald-accent">{droopVSteady} V</strong>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Academic explanation card */}
                <div className="bg-navy-card/40 border border-navy-light p-5 rounded-2xl text-xs space-y-3">
                  <h4 className="font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <HelpCircle className="h-4 w-4 text-sky-400" />
                    Theoretical Concept: Proportional Capacity Sharing
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    In a microgrid, multiple inverters share load without communication. To share the active power load proportionally to their rated capacities (i.e., <code className="text-white">P1/S1 = P2/S2</code>), their droop coefficients must be adjusted inversely proportional to their capacities:
                  </p>
                  <div className="text-[10px] text-sky-300 font-mono bg-navy/60 p-2.5 rounded border border-navy-light/60 text-center">
                    m_p1 * Rating1 = m_p2 * Rating2
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-navy/40 border border-navy-light/40">
                    <span className={`h-2 w-2 rounded-full ${droopSharingIsProportional ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-pulse'}`}></span>
                    <span className="font-mono text-[10px]">
                      {droopSharingIsProportional 
                        ? "PROPORTIONAL SHARING ENGAGED: Slopes are tuned optimally to ratings!" 
                        : "MISMATCH WARNING: Droop coefficients mismatch! Inverter load shares are disproportionate."}
                    </span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ========================================================
            TAB 4: HV BREAKDOWN ESTIMATOR (PASCHEN'S LAW)
            ======================================================== */}
        {activeTab === 'paschen' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            
            {/* Control Panel */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-navy-card border border-navy-light p-6 rounded-2xl shadow-xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/50">
                  <Flame className="h-5 w-5 text-red-500 animate-pulse" />
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Substation Gas Chamber</h2>
                    <p className="text-2xl font-mono text-emerald-accent">Paschen breakdown</p>
                  </div>
                </div>

                {/* Gas Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-400 block">Insulating Gas Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'air', label: 'Dry Air' },
                      { id: 'sf6', label: 'SF6' },
                      { id: 'n2', label: 'N2' },
                      { id: 'he', label: 'Helium' }
                    ].map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setPaschenGas(g.id as any)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          paschenGas === g.id
                            ? 'bg-red-500/10 border-red-500/40 text-red-400'
                            : 'bg-navy/40 border-navy-light/40 text-slate-400 hover:text-slate-200 hover:bg-navy-light/10'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed pt-1 italic">{paschenData.gasDesc}</p>
                </div>

                {/* Gas Chamber Pressure */}
                <div className="space-y-2 pt-2 border-t border-navy-light/30">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Chamber Pressure (p)</span>
                    <span className="text-white font-bold">{paschenPressure.toFixed(1)} bar</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="10.0"
                    step="0.1"
                    value={paschenPressure}
                    onChange={(e) => setPaschenPressure(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-navy-light rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0.1 (Low Vacuum)</span>
                    <span>10.0 (High Pressure GIS)</span>
                  </div>
                </div>

                {/* Gap Distance */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Electrode Gap (d)</span>
                    <span className="text-white font-bold">{paschenGap.toFixed(1)} mm</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="50.0"
                    step="0.1"
                    value={paschenGap}
                    onChange={(e) => setPaschenGap(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-navy-light rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0.1 mm (Narrow Spark)</span>
                    <span>50.0 mm (Clearance gap)</span>
                  </div>
                </div>

                {/* Secondary Emission Coeff */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Secondary Emission (γ)</span>
                    <span className="text-white font-bold">{paschenGamma}</span>
                  </div>
                  <input
                    type="range"
                    min="0.005"
                    max="0.1"
                    step="0.005"
                    value={paschenGamma}
                    onChange={(e) => setPaschenGamma(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-navy-light rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                </div>
              </div>

              {/* Paschen Info Card */}
              <div className="bg-navy-card/40 border border-navy-light p-5 rounded-2xl space-y-3 text-xs">
                <h3 className="font-bold text-white flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-red-400" />
                  What is Paschen&apos;s Law?
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Paschen&apos;s Law determines the dielectric breakdown voltage of gas between parallel plates as a non-linear function of the gas pressure and gap distance product (<code className="text-white">p · d</code>).
                </p>
                <div className="text-[10px] text-red-400/80 font-mono bg-navy/60 p-2 rounded border border-navy-light/60">
                  V_B = (B * p*d) / [ ln(A * p*d) - ln(ln(1 + 1/γ)) ]
                </div>
              </div>
            </div>

            {/* Visualizer and Paschen Curve Side (2/3 Width) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-end mb-4">
                <IEEEReportButton
                  experimentName="High Voltage Engineering: Paschen's Law Breakdown"
                  inputData={{
                    'Gas Medium': paschenData.gasName,
                    'Pressure (p)': paschenPressure + ' bar',
                    'Gap Distance (d)': paschenGap.toFixed(2) + ' mm',
                    'Secondary Emission (γ)': paschenGamma
                  }}
                  outputData={{
                    'Gas Constant A': paschenData.constants.A.toString(),
                    'Gas Constant B': paschenData.constants.B.toString(),
                    'Gas Product (p·d)': paschenData.currentPd + ' Torr-cm',
                    'Breakdown Voltage (Vb)': paschenData.breakdownVoltage + ' kV'
                  }}
                  chartSelectors={['#paschen-chart-container']}
                />
              </div>
              
              {/* Massive Output Dial / Readout */}
              <div className="bg-navy-card border border-navy-light p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block">Estimated Breakdown Voltage</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black font-mono text-red-500 tracking-tight">
                      {paschenData.breakdownVoltage}
                    </span>
                    <span className="text-xl text-slate-400 font-bold">kV</span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm">
                    In standard conditions, gas ionization will generate an arc if the voltage across the {paschenGap}mm gap exceeds this limit.
                  </p>
                </div>

                <div className="bg-navy border border-navy-light/80 p-4 rounded-xl flex flex-col gap-3 w-full md:w-64 font-mono text-xs">
                  <div className="flex justify-between border-b border-navy-light/40 pb-1.5">
                    <span className="text-slate-500">Gas Product (p·d):</span>
                    <span className="text-white font-bold">{paschenData.currentPd} Torr-cm</span>
                  </div>
                  <div className="flex justify-between border-b border-navy-light/40 pb-1.5">
                    <span className="text-slate-500">Gas Constant A:</span>
                    <span className="text-white">{paschenData.constants.A}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gas Constant B:</span>
                    <span className="text-white">{paschenData.constants.B}</span>
                  </div>
                </div>
              </div>

              {/* Curve Graph */}
              <div className="bg-navy-card border border-navy-light p-6 rounded-2xl shadow-xl space-y-4" id="paschen-chart-container">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Theoretical Paschen Curve ({paschenData.gasName})
                    </h3>
                    <p className="text-xs text-slate-400">Breakdown Voltage (Vb) vs. Pressure-Gap product (p · d)</p>
                  </div>
                  <span className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-mono font-bold">
                    Min Vb limit ≈ 300 V
                  </span>
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={paschenData.curvePoints}
                      margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
                    >
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="pdValue" 
                        stroke="#64748b" 
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        label={{ value: 'p · d Product (Torr-cm)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
                      />
                      <YAxis 
                        stroke="#ef4444" 
                        tick={{ fill: '#ef4444', fontSize: 10 }}
                        label={{ value: 'Breakdown Voltage (kV)', angle: -90, position: 'insideLeft', offset: 0, fill: '#ef4444', fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                        labelStyle={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}
                        itemStyle={{ fontSize: '12px' }}
                      />
                      
                      {/* Paschen curve line */}
                      <Line 
                        type="monotone" 
                        dataKey="vBreakdown" 
                        stroke="#ef4444" 
                        strokeWidth={3} 
                        dot={false}
                        activeDot={{ r: 6 }}
                      />

                      {/* Current operating point marker */}
                      {paschenData.currentPd <= 5.0 && (
                        <ReferenceDot
                          x={paschenData.currentPd}
                          y={paschenData.breakdownVoltage}
                          r={7}
                          fill="#facc15"
                          stroke="#ffffff"
                          strokeWidth={2.5}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Operating Point Details */}
                <div className="bg-navy bg-opacity-60 border border-navy-light/60 p-4 rounded-xl flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-400 font-mono">
                    <span className="h-2 w-2 bg-yellow-400 rounded-full inline-block animate-ping"></span>
                    Current State:
                  </span>
                  <div className="font-mono text-slate-200">
                    p = <strong className="text-white">{paschenPressure.toFixed(1)} bar</strong> | d = <strong className="text-white">{paschenGap.toFixed(1)} mm</strong> | product = <strong className="text-emerald-accent">{paschenData.currentPd} Torr-cm</strong>
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
