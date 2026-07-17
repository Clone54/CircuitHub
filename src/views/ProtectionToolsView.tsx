import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Zap,
  Shield,
  Sparkles,
  TrendingUp,
  Cpu,
  Wrench,
  Info,
  Brain,
  Clock,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  Settings,
  CheckCircle2,
  HelpCircle,
  Maximize2
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  Legend,
  ScatterChart,
  Scatter,
  AreaChart,
  Area
} from 'recharts';
import { IEEEReportButton } from '../components/IEEEReportButton';

// Custom Hooks for relay / switchgear logic
import { useIDMTRelay } from '../hooks/useIDMTRelay';
import { useDistanceRelay } from '../hooks/useDistanceRelay';
import { useTRV } from '../hooks/useTRV';

type TabId = 'relay' | 'distance' | 'trv' | 'advisor';

export default function ProtectionToolsView() {
  const [activeTab, setActiveTab] = useState<TabId>('relay');

  // ==========================================
  // TAB 1: IDMT Relay Coordination Simulator
  // ==========================================
  const {
    faultCurrent: idmtFaultCurrent,
    setFaultCurrent: setIdmtFaultCurrent,
    ctPrimary: idmtCtPrimary,
    setCtPrimary: setIdmtCtPrimary,
    ctSecondary: idmtCtSecondary,
    setCtSecondary: setIdmtCtSecondary,
    plugSetting: idmtPlugSetting,
    setPlugSetting: setIdmtPlugSetting,
    tms: idmtTms,
    setTms: setIdmtTms,
    standard: idmtStandard,
    setStandard: setIdmtStandard,
    iecCurve,
    setIecCurve,
    ieeeCurve,
    setIeeeCurve,
    settingCurrent: idmtSettingCurrent,
    psm: idmtPsm,
    operatingTime: idmtOperatingTime,
    tccData,
    activeCurveLabel: idmtActiveCurveLabel
  } = useIDMTRelay();

  // ==========================================
  // TAB 2: Distance Relay R-X Trajectory Plotter
  // ==========================================
  const {
    rLine,
    setRLine,
    xLine,
    setXLine,
    zone1Percent,
    setZone1Percent,
    zone2Percent,
    setZone2Percent,
    zone3Percent,
    setZone3Percent,
    rFault,
    setRFault,
    xFault,
    setXFault,
    lineImpedanceMag,
    lineAngleDeg,
    zone1Reach,
    zone2Reach,
    zone3Reach,
    isInsideZone1,
    isInsideZone2,
    isInsideZone3,
    tripStatus: distanceTripStatus,
    zone1CirclePoints,
    zone2CirclePoints,
    zone3CirclePoints,
    lineVector
  } = useDistanceRelay();

  // Dynamic axis domains for Distance Relay ScatterChart to ensure circles are visually symmetric
  const scatterDomain = useMemo(() => {
    const maxVal = Math.max(
      rLine * (zone3Percent / 100) * 1.3,
      xLine * (zone3Percent / 100) * 1.3,
      rFault * 1.3,
      xFault * 1.3,
      10
    );
    return {
      r: [-maxVal * 0.3, maxVal],
      x: [-maxVal * 0.3, maxVal]
    };
  }, [rLine, xLine, zone3Percent, rFault, xFault]);

  // ==========================================
  // TAB 3: Transient Recovery Voltage (TRV) Calculator
  // ==========================================
  const [trvL, setTrvL] = useState<number>(4.5); // mH
  const [trvC, setTrvC] = useState<number>(0.02); // µF
  const [trvVMax, setTrvVMax] = useState<number>(27.0); // kV peak
  const [trvDamping, setTrvDamping] = useState<number>(0.12);

  const {
    trvMetrics,
    trvWaveformData
  } = useTRV({
    initialInductance: trvL,
    initialCapacitance: trvC,
    initialVMax: trvVMax,
    initialDampingFactor: trvDamping
  });

  // Sync parameters inside hook
  const handleLChange = (val: number) => setTrvL(val);
  const handleCChange = (val: number) => setTrvC(val);
  const handleVMaxChange = (val: number) => setTrvVMax(val);
  const handleDampingChange = (val: number) => setTrvDamping(val);

  // ==========================================
  // TAB 4: AI Smart Switchgear Advisor
  // ==========================================
  const [selectedVoltage, setSelectedVoltage] = useState<string>('33 kV');
  const [expectedFaultCurrent, setExpectedFaultCurrent] = useState<string>('25 kA');
  const [substationEnv, setSubstationEnv] = useState<string>('Outdoor Polluted Area');
  const [customRequirements, setCustomRequirements] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const triggerAdvisorAnalysis = async () => {
    setAiLoading(true);
    setAiResult(null);

    try {
      const response = await fetch('/api/switchgear-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemVoltage: selectedVoltage,
          faultLevel: expectedFaultCurrent,
          environment: substationEnv,
          customQuery: customRequirements
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiResult(data);
      } else {
        throw new Error('Server returned an error');
      }
    } catch (err) {
      console.error('Advisor request failed, loading local system fallback', err);
      setAiResult({
        recommendedDevice: 'SF6 Gas Insulated Switchgear (GIS) with Numeric Line Protection Relays',
        breakerType: 'Sulfur Hexafluoride (SF6) Circuit Breaker',
        relayTypes: [
          'High-Speed Numeric Distance Relay (ANSI 21)',
          'Phase and Ground Overcurrent IDMT Relay (ANSI 51/51N)',
          'Circuit Breaker Failure Protection Relay (ANSI 50BF)'
        ],
        technicalJustification: `For a **${selectedVoltage}** substation situated in a **${substationEnv}**, standard outdoor air-insulated breakers are susceptible to insulator tracking, flashovers, and premature contacts erosion. An **SF6 Gas Insulated Switchgear (GIS)** provides a sealed, completely enclosed operational environment, impervious to humidity, salt, or heavy pollution. A breaking capacity of **${expectedFaultCurrent}** is comfortably managed by SF6's superior molecular arc quenching speed. The protection suite includes numeric distance and overcurrent relays for rapid fault clearing within 3 cycles, maintaining grid synchronism.`,
        estimatedLifecycle: '30-45 Years with automated gas-density monitoring.',
        specifications: [
          { parameter: 'Nominal Operating Voltage', value: selectedVoltage },
          { parameter: 'Rated Short-Circuit Interruption', value: expectedFaultCurrent },
          { parameter: 'Gas Pressure Rating (nominal)', value: '0.55 MPa (absolute)' },
          { parameter: 'Lightning Impulse Insulation (BIL)', value: '170 kV (Peak)' },
          { parameter: 'Rated Opening Time', value: '< 35 ms' }
        ],
        isMocked: true
      });
    } finally {
      setAiLoading(false);
    }
  };

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
          4th Year Even Semester / EEE 4211
        </span>
      </div>

      {/* Hero Title Section */}
      <div className="bg-gradient-to-r from-navy-card/90 via-navy-light/40 to-navy-card border border-navy-light/60 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-accent/10 border border-emerald-accent/30 text-xs font-bold text-emerald-accent uppercase tracking-wider">
            <Shield className="h-4.5 w-4.5 text-emerald-accent" /> Protection & Switchgear Analytics
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-black tracking-tight text-white">
            Power Protection <span className="text-emerald-accent">Lab Suite</span>
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            Analyze Time-Current Characteristics (TCC) for IDMT overcurrent protection systems, plot complex R-X plane trajectory circles for distance relays, simulate high-frequency Transient Recovery Voltage (TRV) of circuit breakers, and consult the AI switchgear advisor.
          </p>
        </div>
        {/* Abstract pattern background */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none"></div>
      </div>

      {/* Tab Switcher */}
      <div className="flex flex-wrap gap-2 border-b border-navy-light/40 pb-1">
        {[
          { id: 'relay', label: 'IDMT Relay Coordinator', icon: Clock },
          { id: 'distance', label: 'Distance Relay (R-X Plane)', icon: Shield },
          { id: 'trv', label: 'Transient Recovery Voltage (TRV)', icon: Activity },
          { id: 'advisor', label: 'AI Switchgear Advisor', icon: Brain }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer border ${
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

      {/* Tab Contents */}
      <div className="animate-fadeIn">

        {/* ========================================== */}
        {/* TAB 1: IDMT RELAY COORDINATION SIMULATOR */}
        {/* ========================================== */}
        {activeTab === 'relay' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Input Controls */}
            <div className="lg:col-span-5 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6 text-left">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Settings className="h-5 w-5 text-emerald-accent" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">
                  Relay Standard & Parameters
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                {/* Standard Toggle */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Relay Standard Curve Family</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['IEC', 'IEEE'].map((std) => (
                      <button
                        key={std}
                        type="button"
                        onClick={() => setIdmtStandard(std as any)}
                        className={`py-2 px-3 rounded-xl border text-center font-bold tracking-wide transition-all ${
                          idmtStandard === std
                            ? 'bg-emerald-accent/15 border-emerald-accent/60 text-emerald-accent'
                            : 'bg-navy-dark border-navy-light/40 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {std} (Standard)
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fault Current */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium flex justify-between">
                    <span>Fault Current (I_f)</span>
                    <span className="text-emerald-accent font-mono font-bold">{idmtFaultCurrent.toLocaleString()} A</span>
                  </label>
                  <input
                    type="range"
                    min={500}
                    max={15000}
                    step={100}
                    value={idmtFaultCurrent}
                    onChange={(e) => setIdmtFaultCurrent(Number(e.target.value))}
                    className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>500 A</span>
                    <span>15,000 A</span>
                  </div>
                </div>

                {/* CT Ratio */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">CT Primary (CTR Primary)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={idmtCtPrimary}
                        onChange={(e) => setIdmtCtPrimary(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-navy-dark border border-navy-light/60 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-accent/80 font-mono"
                      />
                      <span className="absolute right-3 top-2.5 text-slate-500 font-mono">A</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">CT Secondary</label>
                    <select
                      value={idmtCtSecondary}
                      onChange={(e) => setIdmtCtSecondary(Number(e.target.value))}
                      className="w-full bg-navy-dark border border-navy-light/60 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-accent/80 font-mono"
                    >
                      <option value={1}>1 Amp</option>
                      <option value={5}>5 Amps</option>
                    </select>
                  </div>
                </div>

                {/* Plug Setting */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium flex justify-between">
                    <span>Plug Setting (PS)</span>
                    <span className="text-emerald-accent font-mono font-bold">{idmtPlugSetting}%</span>
                  </label>
                  <input
                    type="range"
                    min={50}
                    max={200}
                    step={25}
                    value={idmtPlugSetting}
                    onChange={(e) => setIdmtPlugSetting(Number(e.target.value))}
                    className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>50%</span>
                    <span>100% (Standard)</span>
                    <span>200%</span>
                  </div>
                </div>

                {/* Time Multiplier Setting */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium flex justify-between">
                    <span>Time Multiplier Setting (TMS / TD)</span>
                    <span className="text-emerald-accent font-mono font-bold">{idmtTms.toFixed(2)}</span>
                  </label>
                  <input
                    type="range"
                    min={0.01}
                    max={1.2}
                    step={0.01}
                    value={idmtTms}
                    onChange={(e) => setIdmtTms(Number(e.target.value))}
                    className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0.01</span>
                    <span>1.20</span>
                  </div>
                </div>

                {/* Curve Type selector */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Relay Characteristics Curve</label>
                  {idmtStandard === 'IEC' ? (
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'NI', label: 'Normal Inverse' },
                        { id: 'VI', label: 'Very Inverse' },
                        { id: 'EI', label: 'Extremely Inverse' }
                      ].map((btn) => (
                        <button
                          key={btn.id}
                          type="button"
                          onClick={() => setIecCurve(btn.id as any)}
                          className={`px-2 py-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            iecCurve === btn.id
                              ? 'bg-emerald-accent/15 border-emerald-accent/50 text-emerald-accent font-bold'
                              : 'bg-navy-dark border-navy-light/40 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          <span className="text-[10px]">{btn.label}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'MI', label: 'Moderately Inv' },
                        { id: 'VI', label: 'Very Inverse' },
                        { id: 'EI', label: 'Extremely Inv' }
                      ].map((btn) => (
                        <button
                          key={btn.id}
                          type="button"
                          onClick={() => setIeeeCurve(btn.id as any)}
                          className={`px-2 py-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            ieeeCurve === btn.id
                              ? 'bg-emerald-accent/15 border-emerald-accent/50 text-emerald-accent font-bold'
                              : 'bg-navy-dark border-navy-light/40 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          <span className="text-[10px]">{btn.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Math formulation reference */}
              <div className="bg-navy-dark p-4 rounded-xl border border-navy-light/40 text-[10px] text-slate-400 space-y-1.5 font-mono">
                <div className="text-slate-300 font-bold uppercase tracking-wider text-[9px]">
                  Standard TCC Formula Reference:
                </div>
                {idmtStandard === 'IEC' ? (
                  <>
                    <p className="text-emerald-accent">t = TMS * [ k / (PSM^α - 1) ]</p>
                    <p className="text-slate-500">
                      • {iecCurve === 'NI' && 'Normal Inverse (NI): k = 0.14, α = 0.02'}
                      {iecCurve === 'VI' && 'Very Inverse (VI): k = 13.5, α = 1.0'}
                      {iecCurve === 'EI' && 'Extremely Inverse (EI): k = 80.0, α = 2.0'}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-emerald-accent">t = TMS * [ A / (PSM^p - 1) + B ]</p>
                    <p className="text-slate-500">
                      • {ieeeCurve === 'MI' && 'Moderately Inverse (MI): A = 0.0515, B = 0.1140, p = 0.02'}
                      {ieeeCurve === 'VI' && 'Very Inverse (VI): A = 19.61, B = 0.491, p = 2.0'}
                      {ieeeCurve === 'EI' && 'Extremely Inverse (EI): A = 28.2, B = 0.1217, p = 2.0'}
                    </p>
                  </>
                )}
                <p className="text-[9px] text-slate-500 pt-1 border-t border-navy-light/30">
                  PSM = Fault Current / (CT Primary * Plug Setting %)
                </p>
              </div>
            </div>

            {/* Simulation Outputs and Graphical TCC Curve */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="flex justify-end">
                <IEEEReportButton
                  experimentName="Power System Protection: IDMT Relay Coordination"
                  inputData={{
                    'Fault Current (If)': idmtFaultCurrent + ' A',
                    'CT Ratio': `${idmtCtPrimary} / ${idmtCtSecondary}`,
                    'Plug Setting (PS)': idmtPlugSetting + ' %',
                    'Time Multiplier (TMS)': idmtTms,
                    'Curve Type': idmtActiveCurveLabel
                  }}
                  outputData={{
                    'Relay Setting Amps': idmtSettingCurrent.toFixed(2) + ' A',
                    'Plug Setting Multiplier (PSM)': idmtPsm.toFixed(2),
                    'Expected Operating Time': idmtOperatingTime !== null ? idmtOperatingTime.toFixed(3) + ' s' : 'Relay Inactive'
                  }}
                  chartSelectors={['#protection-chart']}
                />
              </div>

              {/* Numeric Calculations Output Card */}
              <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 pb-2 border-b border-navy-light/40">
                  Relay Operating Output Metrics
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Relay setting current */}
                  <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Setting Amps (Is)</span>
                    <span className="text-xl font-bold text-white tracking-tight mt-1">
                      {idmtSettingCurrent.toFixed(2)} <span className="text-xs text-slate-400 font-normal">A (sec)</span>
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1 font-mono leading-tight">
                      Pickup threshold (secondary side)
                    </span>
                  </div>

                  {/* PSM value */}
                  <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Plug Setting Multiplier</span>
                    <span className="text-xl font-bold text-emerald-accent tracking-tight mt-1 font-mono">
                      {idmtPsm.toFixed(3)}
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1 font-mono leading-tight">
                      Fault to pickup ratio ({idmtPsm > 1 ? 'Trip Active' : 'Restrain'})
                    </span>
                  </div>

                  {/* Trip Operating Time */}
                  <div className="bg-navy-dark/60 p-4 rounded-xl border border-navy-light/40 flex flex-col justify-between relative overflow-hidden">
                    <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Operating Trip Time (t)</span>
                    {idmtOperatingTime !== null ? (
                      <span className="text-2xl font-black text-emerald-accent tracking-tight mt-1 font-mono flex items-baseline gap-1 animate-pulse">
                        {idmtOperatingTime.toFixed(3)} <span className="text-xs font-bold text-white uppercase">Sec</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-red-400 tracking-tight mt-2 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 shrink-0 animate-bounce" /> BELOW PICKUP
                      </span>
                    )}
                    <span className="text-[9px] text-slate-500 mt-1 font-mono leading-tight">
                      Time for breaker trip initiation
                    </span>
                  </div>
                </div>

                {idmtOperatingTime === null && (
                  <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-3 text-xs text-red-300">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
                    <div>
                      <span className="font-bold">Relay Pickup Restrained:</span> The fault current is lower than the relay pickup setting current ({ (idmtCtPrimary * (idmtPlugSetting / 100)).toLocaleString() } A primary). The relay will not issue a breaker trip command.
                    </div>
                  </div>
                )}
              </div>

              {/* TCC logarithmic LineChart */}
              <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4" id="protection-chart">
                <div className="flex justify-between items-center pb-2 border-b border-navy-light/40">
                  <span className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                    Time-Current Characteristic (TCC) Curves (Log-Log)
                  </span>
                  <span className="text-[9px] font-mono text-emerald-accent bg-emerald-accent/5 px-2 py-0.5 border border-emerald-accent/20 rounded">
                    {idmtStandard} Standards Series
                  </span>
                </div>

                <div className="h-[280px] w-full font-mono text-[9px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={tccData}
                      margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="psm"
                        scale="log"
                        type="number"
                        domain={[1.1, 30]}
                        stroke="#94a3b8"
                        label={{ value: 'Plug Setting Multiplier (PSM)', position: 'insideBottom', offset: -5, fill: '#64748b' }}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        domain={[0.01, 20]}
                        scale="log"
                        type="number"
                        label={{ value: 'Trip Operating Time (Seconds)', angle: -90, position: 'insideLeft', offset: 15, fill: '#64748b' }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                        itemStyle={{ color: '#10b981' }}
                      />
                      <Legend verticalAlign="top" height={36} iconSize={10} />
                      
                      {idmtStandard === 'IEC' ? (
                        <>
                          <Line
                            type="monotone"
                            dataKey="IEC Normal Inverse"
                            stroke={iecCurve === 'NI' ? '#10b981' : '#334155'}
                            strokeWidth={iecCurve === 'NI' ? 3 : 1}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="IEC Very Inverse"
                            stroke={iecCurve === 'VI' ? '#10b981' : '#334155'}
                            strokeWidth={iecCurve === 'VI' ? 3 : 1}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="IEC Extremely Inverse"
                            stroke={iecCurve === 'EI' ? '#10b981' : '#334155'}
                            strokeWidth={iecCurve === 'EI' ? 3 : 1}
                            dot={false}
                          />
                        </>
                      ) : (
                        <>
                          <Line
                            type="monotone"
                            dataKey="IEEE Moderately Inverse"
                            stroke={ieeeCurve === 'MI' ? '#10b981' : '#334155'}
                            strokeWidth={ieeeCurve === 'MI' ? 3 : 1}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="IEEE Very Inverse"
                            stroke={ieeeCurve === 'VI' ? '#10b981' : '#334155'}
                            strokeWidth={ieeeCurve === 'VI' ? 3 : 1}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="IEEE Extremely Inverse"
                            stroke={ieeeCurve === 'EI' ? '#10b981' : '#334155'}
                            strokeWidth={ieeeCurve === 'EI' ? 3 : 1}
                            dot={false}
                          />
                        </>
                      )}

                      {/* Display current operating coordinate on the chart if active */}
                      {idmtOperatingTime !== null && idmtPsm >= 1.1 && idmtPsm <= 30 && (
                        <ReferenceDot
                          x={idmtPsm}
                          y={idmtOperatingTime}
                          r={6}
                          fill="#10b981"
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40">
                  <Info className="h-4 w-4 text-emerald-accent shrink-0" />
                  <span>
                    The green dot represents your current operational coordinate: <strong>PSM = {idmtPsm.toFixed(2)}</strong>, operating time = <strong>{idmtOperatingTime ? `${idmtOperatingTime.toFixed(3)}s` : 'N/A'}</strong> on the <strong>{idmtActiveCurveLabel}</strong> curve.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: DISTANCE RELAY R-X TRAJECTORY PLOTTER */}
        {/* ========================================== */}
        {activeTab === 'distance' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Input panel left column */}
            <div className="lg:col-span-5 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6 text-left">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Settings className="h-5 w-5 text-emerald-accent" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">
                  Distance Protection Params
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                {/* Transmission Line Impedance */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-300 block">Protected Transmission Line (Z_line)</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-400">Resistance (R_line)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step={0.1}
                          value={rLine}
                          onChange={(e) => setRLine(Math.max(0.1, Number(e.target.value)))}
                          className="w-full bg-navy-dark border border-navy-light/60 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-accent/80 font-mono"
                        />
                        <span className="absolute right-3 top-2 text-slate-500 font-mono">Ω</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400">Reactance (X_line)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step={0.1}
                          value={xLine}
                          onChange={(e) => setXLine(Math.max(0.1, Number(e.target.value)))}
                          className="w-full bg-navy-dark border border-navy-light/60 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-accent/80 font-mono"
                        />
                        <span className="absolute right-3 top-2 text-slate-500 font-mono">Ω</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono flex justify-between px-1">
                    <span>Line Impedance magnitude: <strong className="text-emerald-accent">{lineImpedanceMag.toFixed(2)} Ω</strong></span>
                    <span>Angle: <strong className="text-emerald-accent">{lineAngleDeg.toFixed(1)}°</strong></span>
                  </div>
                </div>

                {/* Zone Settings */}
                <div className="space-y-3 pt-2 border-t border-navy-light/30">
                  <span className="font-bold text-slate-300 block">Polar Mho Reach Settings</span>
                  
                  {/* Zone 1 Reach */}
                  <div className="space-y-1">
                    <label className="text-slate-400 flex justify-between">
                      <span>Zone 1 reach (80% Standard)</span>
                      <span className="font-mono text-emerald-accent font-bold">{zone1Percent}% ({zone1Reach.r.toFixed(1)} + j{zone1Reach.x.toFixed(1)} Ω)</span>
                    </label>
                    <input
                      type="range"
                      min={50}
                      max={95}
                      step={1}
                      value={zone1Percent}
                      onChange={(e) => setZone1Percent(Number(e.target.value))}
                      className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                  </div>

                  {/* Zone 2 Reach */}
                  <div className="space-y-1">
                    <label className="text-slate-400 flex justify-between">
                      <span>Zone 2 reach (120% Standard)</span>
                      <span className="font-mono text-amber-500 font-bold">{zone2Percent}% ({zone2Reach.r.toFixed(1)} + j{zone2Reach.x.toFixed(1)} Ω)</span>
                    </label>
                    <input
                      type="range"
                      min={100}
                      max={140}
                      step={1}
                      value={zone2Percent}
                      onChange={(e) => setZone2Percent(Number(e.target.value))}
                      className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>

                  {/* Zone 3 Reach */}
                  <div className="space-y-1">
                    <label className="text-slate-400 flex justify-between">
                      <span>Zone 3 reach (150% Standard)</span>
                      <span className="font-mono text-yellow-500 font-bold">{zone3Percent}% ({zone3Reach.r.toFixed(1)} + j{zone3Reach.x.toFixed(1)} Ω)</span>
                    </label>
                    <input
                      type="range"
                      min={130}
                      max={180}
                      step={1}
                      value={zone3Percent}
                      onChange={(e) => setZone3Percent(Number(e.target.value))}
                      className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                  </div>
                </div>

                {/* Fault Data Input */}
                <div className="space-y-2 pt-2 border-t border-navy-light/30">
                  <span className="font-bold text-slate-300 block">Measured Fault Impedance (Z_fault)</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-400">Fault Resistance (R_f)</label>
                      <input
                        type="number"
                        step={0.1}
                        value={rFault}
                        onChange={(e) => setRFault(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-navy-dark border border-navy-light/60 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-accent/80 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400">Fault Reactance (X_f)</label>
                      <input
                        type="number"
                        step={0.1}
                        value={xFault}
                        onChange={(e) => setXFault(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-navy-dark border border-navy-light/60 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-accent/80 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Theoretical Info Box */}
              <div className="bg-navy-dark p-4 rounded-xl border border-navy-light/40 text-[10px] text-slate-400 space-y-1.5 font-mono">
                <div className="text-slate-300 font-bold uppercase tracking-wider text-[9px]">
                  Mho Relay Physics:
                </div>
                <p className="leading-relaxed">
                  A self-polarized Mho distance relay acts as an impedance comparator. Its boundary is represented as a circle passing through the complex origin (0,0), with its reach vector representing the circle's diameter.
                </p>
                <p className="leading-relaxed text-slate-500">
                  The relay trips if the measured loop impedance phasor (R_f + jX_f) falls within the circular zone boundary.
                </p>
              </div>
            </div>

            {/* Visual plot right column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="flex justify-end">
                <IEEEReportButton
                  experimentName="Power System Protection: Distance Relay Mho Trajectory"
                  inputData={{
                    'Line Resistance (R_line)': rLine + ' Ω',
                    'Line Reactance (X_line)': xLine + ' Ω',
                    'Zone 1 reach': zone1Percent + ' %',
                    'Zone 2 reach': zone2Percent + ' %',
                    'Zone 3 reach': zone3Percent + ' %',
                    'Fault Resistance (R_f)': rFault + ' Ω',
                    'Fault Reactance (X_f)': xFault + ' Ω'
                  }}
                  outputData={{
                    'Z_fault Magnitude': Math.sqrt(rFault * rFault + xFault * xFault).toFixed(2) + ' Ω',
                    'Z_fault Phase Angle': ((Math.atan2(xFault, rFault) * 180) / Math.PI).toFixed(1) + '°',
                    'Zone 1 Status': isInsideZone1 ? 'Trip' : 'Restrain',
                    'Zone 2 Status': isInsideZone2 ? 'Trip' : 'Restrain',
                    'Zone 3 Status': isInsideZone3 ? 'Trip' : 'Restrain',
                    'Protection Classification': distanceTripStatus.label
                  }}
                  chartSelectors={['#distance-relay-chart']}
                />
              </div>

              {/* Status Output Box */}
              <div className={`p-5 rounded-2xl border ${distanceTripStatus.color} shadow-lg space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                    Active Protection Relay State (ANSI 21)
                  </span>
                  <span className="text-xs font-mono font-extrabold px-2 py-0.5 rounded-full border border-current bg-current/10">
                    {distanceTripStatus.delay}
                  </span>
                </div>
                <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                  <Shield className="h-5 w-5 shrink-0" /> {distanceTripStatus.label}
                </h3>
                <p className="text-xs opacity-90 leading-relaxed font-sans">
                  {distanceTripStatus.description}
                </p>
              </div>

              {/* Distance Relay Chart */}
              <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4" id="distance-relay-chart">
                <div className="flex justify-between items-center pb-2 border-b border-navy-light/40">
                  <span className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                    R-X Complex Impedance Plane Trajectory Plotter
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono text-red-400">
                      <span className="h-2 w-2 rounded-full bg-red-500"></span> Z1
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono text-amber-500">
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span> Z2
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono text-yellow-500">
                      <span className="h-2 w-2 rounded-full bg-yellow-400"></span> Z3
                    </span>
                  </div>
                </div>

                {/* Recharts ScatterChart to represent R-X polar circles */}
                <div className="h-[300px] w-full font-mono text-[9px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        type="number"
                        dataKey="r"
                        name="Resistance"
                        unit="Ω"
                        stroke="#94a3b8"
                        domain={scatterDomain.r}
                        label={{ value: 'Resistance R (Ohms)', position: 'insideBottom', offset: -5, fill: '#64748b' }}
                      />
                      <YAxis
                        type="number"
                        dataKey="x"
                        name="Reactance"
                        unit="Ω"
                        stroke="#94a3b8"
                        domain={scatterDomain.x}
                        label={{ value: 'Reactance X (Ohms)', angle: -90, position: 'insideLeft', offset: 15, fill: '#64748b' }}
                      />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      />
                      
                      {/* Zone 3 Circle boundary */}
                      <Scatter
                        name="Zone 3 Mho (Backup)"
                        data={zone3CirclePoints}
                        fill="none"
                        stroke="#facc15"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        line={{ stroke: '#facc15', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                        shape={() => null} // Draws line only
                      />

                      {/* Zone 2 Circle boundary */}
                      <Scatter
                        name="Zone 2 Mho (Delayed)"
                        data={zone2CirclePoints}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        line={{ stroke: '#f59e0b', strokeWidth: 1.5 }}
                        shape={() => null}
                      />

                      {/* Zone 1 Circle boundary */}
                      <Scatter
                        name="Zone 1 Mho (Instantaneous)"
                        data={zone1CirclePoints}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth={2}
                        line={{ stroke: '#ef4444', strokeWidth: 2 }}
                        shape={() => null}
                      />

                      {/* Protected Transmission Line vector */}
                      <Scatter
                        name="Transmission Line Z"
                        data={lineVector}
                        fill="#38bdf8"
                        line={{ stroke: '#38bdf8', strokeWidth: 3 }}
                        shape="circle"
                      />

                      {/* Fault Point */}
                      <Scatter
                        name="Fault Impedance Point (Z_fault)"
                        data={[{ r: rFault, x: xFault }]}
                        fill="#f97316"
                        shape={(props) => {
                          const { cx, cy } = props;
                          return (
                            <g>
                              {/* Pulsing visual highlight */}
                              <circle cx={cx} cy={cy} r={9} fill="#f97316" fillOpacity={0.2} stroke="#f97316" strokeWidth={1} />
                              <circle cx={cx} cy={cy} r={4} fill="#ff7849" stroke="#ffffff" strokeWidth={1.5} />
                              <line x1={cx - 12} y1={cy} x2={cx + 12} y2={cy} stroke="#ff7849" strokeWidth={1.5} />
                              <line x1={cx} y1={cy - 12} x2={cx} y2={cy + 12} stroke="#ff7849" strokeWidth={1.5} />
                            </g>
                          );
                        }}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40">
                  <Info className="h-4 w-4 text-emerald-accent shrink-0" />
                  <span>
                    The target crosshair represents the fault impedance at <strong>{rFault} + j{xFault} Ω</strong>. It is evaluated relative to the concentric Mho circles passing through the origin.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 3: TRANSIENT RECOVERY VOLTAGE CALCULATOR */}
        {/* ========================================== */}
        {activeTab === 'trv' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Input Controls */}
            <div className="lg:col-span-5 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6 text-left">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Wrench className="h-5 w-5 text-emerald-accent" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">
                  Breaker System Parameters
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                {/* Active Recovery Voltage Peak */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Active Recovery Voltage Peak (V_max)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={trvVMax}
                      onChange={(e) => handleVMaxChange(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-navy-dark border border-navy-light/60 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-accent/80 font-mono"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-500 font-mono">kV</span>
                  </div>
                </div>

                {/* System Inductance */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium flex justify-between">
                    <span>Equivalent System Inductance (L)</span>
                    <span className="text-emerald-accent font-mono font-bold">{trvL.toFixed(1)} mH</span>
                  </label>
                  <input
                    type="range"
                    min={0.5}
                    max={15.0}
                    step={0.1}
                    value={trvL}
                    onChange={(e) => handleLChange(Number(e.target.value))}
                    className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0.5 mH</span>
                    <span>15.0 mH</span>
                  </div>
                </div>

                {/* System Capacitance */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium flex justify-between">
                    <span>Stray Substation Capacitance (C)</span>
                    <span className="text-emerald-accent font-mono font-bold">{trvC.toFixed(3)} µF</span>
                  </label>
                  <input
                    type="range"
                    min={0.001}
                    max={0.100}
                    step={0.001}
                    value={trvC}
                    onChange={(e) => handleCChange(Number(e.target.value))}
                    className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0.001 µF</span>
                    <span>0.100 µF</span>
                  </div>
                </div>

                {/* Damping factor */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium flex justify-between">
                    <span>System Parasitic Damping Factor</span>
                    <span className="text-emerald-accent font-mono font-bold">{(trvDamping * 100).toFixed(0)}%</span>
                  </label>
                  <input
                    type="range"
                    min={0.00}
                    max={0.50}
                    step={0.01}
                    value={trvDamping}
                    onChange={(e) => handleDampingChange(Number(e.target.value))}
                    className="w-full h-1 bg-navy-light/50 rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0% (Undamped Ideal)</span>
                    <span>50% (Highly Damped)</span>
                  </div>
                </div>
              </div>

              {/* Circuit theory summary card */}
              <div className="bg-navy-dark p-4 rounded-xl border border-navy-light/40 text-[10px] text-slate-400 space-y-2">
                <div className="text-slate-300 font-bold uppercase tracking-wider text-[9px]">
                  TRV Waveform Physics
                </div>
                <p className="leading-relaxed font-mono text-slate-400">
                  When circuit breaker contacts part at current zero, the arc extinguishes and the recovering voltage oscillates high-frequency across the parting gap.
                </p>
                <p className="leading-relaxed font-mono text-slate-500">
                  • Theoretical undamped Peak TRV = 2 * V_max<br/>
                  • Oscillation Frequency = 1 / (2*π*sqrt(L*C))<br/>
                  • Average RRRV (Rate of Rise of Recovery Voltage) represents breaker dielectric stress. High RRRV causes breaker restriking (arc re-ignition).
                </p>
              </div>
            </div>

            {/* Calculations & Chart */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="flex justify-end">
                <IEEEReportButton
                  experimentName="Power System Protection: Transient Recovery Voltage (TRV)"
                  inputData={{
                    'Active Recovery Peak (V_max)': trvVMax + ' kV',
                    'Equivalent Inductance (L)': trvL.toFixed(2) + ' mH',
                    'Equivalent Capacitance (C)': trvC.toFixed(3) + ' µF',
                    'Damping': trvDamping
                  }}
                  outputData={{
                    'Natural Frequency (fn)': (trvMetrics.fn / 1000).toFixed(2) + ' kHz',
                    'Max Theoretical Peak TRV': trvMetrics.maxTRV.toFixed(2) + ' kV',
                    'Time to Peak (tp)': trvMetrics.tpUs.toFixed(2) + ' µs',
                    'Average Rate of Rise (RRRV)': trvMetrics.rrrv.toFixed(3) + ' kV/µs'
                  }}
                  chartSelectors={['#trv-chart']}
                />
              </div>

              {/* Output parameters */}
              <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 pb-2 border-b border-navy-light/40">
                  Transient Recovery Voltage Output Metrics
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {/* Natural Frequency */}
                  <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40 flex flex-col justify-between">
                    <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">Natural Freq (fn)</span>
                    <span className="text-base font-bold text-white tracking-tight mt-1 font-mono">
                      {(trvMetrics.fn / 1000).toFixed(2)} <span className="text-[10px] text-slate-400">kHz</span>
                    </span>
                  </div>

                  {/* Vmax recovery peak */}
                  <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40 flex flex-col justify-between">
                    <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">Recovery Peak (V_max)</span>
                    <span className="text-base font-bold text-white tracking-tight mt-1 font-mono">
                      {trvVMax.toFixed(1)} <span className="text-[10px] text-slate-400">kV</span>
                    </span>
                  </div>

                  {/* Maximum TRV peak */}
                  <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40 flex flex-col justify-between">
                    <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">Max Peak TRV</span>
                    <span className="text-base font-bold text-emerald-accent tracking-tight mt-1 font-mono">
                      {trvMetrics.maxTRV.toFixed(1)} <span className="text-[10px] text-slate-400">kV</span>
                    </span>
                  </div>

                  {/* RRRV max rate */}
                  <div className="bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40 flex flex-col justify-between">
                    <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">Average RRRV</span>
                    <span className="text-base font-bold text-emerald-accent tracking-tight mt-1 font-mono">
                      {trvMetrics.rrrv.toFixed(3)} <span className="text-[10px] text-slate-400">kV/µs</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Recharts TRV AreaChart */}
              <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4" id="trv-chart">
                <div className="flex justify-between items-center pb-2 border-b border-navy-light/40">
                  <span className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                    Transient Recovery Voltage Waveform Simulation
                  </span>
                  <span className="text-[9px] font-mono text-emerald-accent bg-emerald-accent/5 px-2 py-0.5 border border-emerald-accent/20 rounded">
                    Area Simulation (Time-Domain)
                  </span>
                </div>

                <div className="h-[250px] w-full font-mono text-[9px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trvWaveformData}
                      margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="colorTrv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="timeUs"
                        stroke="#94a3b8"
                        label={{ value: 'Time (Microseconds - µs)', position: 'insideBottom', offset: -5, fill: '#64748b' }}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        label={{ value: 'Voltage (kV)', angle: -90, position: 'insideLeft', offset: 15, fill: '#64748b' }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                        itemStyle={{ color: '#10b981' }}
                      />
                      <Legend verticalAlign="top" height={36} iconSize={10} />
                      <Area
                        type="monotone"
                        dataKey="trv"
                        name="Transient Recovery Voltage V_TRV(t)"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorTrv)"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="vMaxLine"
                        name="Steady State Peak Voltage (V_max)"
                        stroke="#38bdf8"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="maxTrvLimit"
                        name="Max Theoretical peak limit (2 * V_max)"
                        stroke="#ef4444"
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 bg-navy-dark/60 p-3 rounded-xl border border-navy-light/40">
                  <Info className="h-4 w-4 text-emerald-accent shrink-0" />
                  <span>
                    The simulation displays the oscillatory surge superimposed right after current zero. The average rate of rise is <strong>{trvMetrics.rrrv.toFixed(3)} kV/µs</strong>, and reaches peak at <strong>{trvMetrics.tpUs.toFixed(1)} µs</strong>.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 4: AI SMART SWITCHGEAR ADVISOR */}
        {/* ========================================== */}
        {activeTab === 'advisor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Input Form Column */}
            <div className="lg:col-span-5 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6 text-left">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Brain className="h-5 w-5 text-emerald-accent" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">
                  Substation Parameters Form
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                {/* Nominal Voltage */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Nominal System Voltage</label>
                  <select
                    value={selectedVoltage}
                    onChange={(e) => setSelectedVoltage(e.target.value)}
                    className="w-full bg-navy-dark border border-navy-light/60 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-accent/80 font-mono"
                  >
                    <option value="11 kV">11 kV (Distribution Level)</option>
                    <option value="33 kV">33 kV (Sub-Transmission Level)</option>
                    <option value="132 kV">132 kV (Transmission Level)</option>
                    <option value="230 kV">230 kV (Grid Transmission)</option>
                    <option value="400 kV">400 kV (Extra High Voltage)</option>
                  </select>
                </div>

                {/* Fault Level */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Expected Symmetric Fault Current</label>
                  <select
                    value={expectedFaultCurrent}
                    onChange={(e) => setExpectedFaultCurrent(e.target.value)}
                    className="w-full bg-navy-dark border border-navy-light/60 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-accent/80 font-mono"
                  >
                    <option value="16 kA">16 kA</option>
                    <option value="25 kA">25 kA (Standard Industrial)</option>
                    <option value="31.5 kA">31.5 kA</option>
                    <option value="40 kA">40 kA (Heavy Substation)</option>
                    <option value="50 kA">50 kA (Ultra Grid Peak)</option>
                  </select>
                </div>

                {/* Environment */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Operational Environment</label>
                  <select
                    value={substationEnv}
                    onChange={(e) => setSubstationEnv(e.target.value)}
                    className="w-full bg-navy-dark border border-navy-light/60 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-accent/80 font-mono"
                  >
                    <option value="Clean Inland Substation">Clean Inland Substation</option>
                    <option value="Outdoor Polluted Area">Outdoor Polluted Area (Industrial/Ash)</option>
                    <option value="Coastal / High Saline Marine">Coastal / High Saline Marine</option>
                    <option value="Desert / High Hot Ambient Temperature">Desert / High Hot Ambient Temperature</option>
                    <option value="Indoor Compact Substation">Indoor Compact Substation</option>
                  </select>
                </div>

                {/* Custom requirements */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Additional Custom Engineering Requirements (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="e.g., I need auto-reclosing relay protection schemes, fast clearance, or compliance with seismic zone requirements."
                    value={customRequirements}
                    onChange={(e) => setCustomRequirements(e.target.value)}
                    className="w-full bg-navy-dark border border-navy-light/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-accent/80"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  onClick={triggerAdvisorAnalysis}
                  disabled={aiLoading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-emerald-accent hover:bg-emerald-hover disabled:bg-slate-700 text-navy-dark font-bold text-xs rounded-xl shadow-lg shadow-emerald-accent/10 transition-all cursor-pointer"
                >
                  {aiLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      COGNITIVE DESIGN THINKING...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4.5 w-4.5" />
                      GENERATE AI RECOMMENDATION
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Advisor Response Mapped UI Column */}
            <div className="lg:col-span-7 text-left">
              {aiLoading && (
                <div className="bg-navy-card/40 border border-dashed border-navy-light/60 p-12 text-center rounded-2xl flex flex-col items-center justify-center gap-4 animate-pulse min-h-[420px]">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-accent/10 border border-emerald-accent/30 text-emerald-accent">
                    <Cpu className="h-5 w-5 animate-spin" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-mono font-bold tracking-widest text-emerald-accent uppercase">
                      Consulting Substation Protection Core...
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-sm">
                      Gemini is currently assessing IEEE and IEC guidelines to compile the breaker breaking capacities, insulation levels, and numeric protection relay schemes.
                    </p>
                  </div>
                </div>
              )}

              {!aiLoading && !aiResult && (
                <div className="bg-navy-card/40 border border-dashed border-navy-light/60 p-12 text-center rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-500 min-h-[420px]">
                  <Brain className="h-10 w-10 text-slate-600 mb-2" />
                  <p className="text-xs font-mono font-bold uppercase tracking-wider">
                    Ready for AI Consultation
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Select your nominal system voltage, short circuit ratings, and environmental parameters, then trigger the AI core to synthesize an expert switchgear specification.
                  </p>
                </div>
              )}

              {aiResult && (
                <div className="bg-navy-card border border-navy-light/60 rounded-2xl p-6 space-y-6 shadow-xl animate-fadeIn max-h-[500px] overflow-y-auto">
                  {/* Recommended device card header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-navy-light/60">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-emerald-accent text-[10px] font-mono tracking-widest uppercase font-black">
                        <Sparkles className="h-4 w-4" /> RECONSTRUCTED STATION BLUEPRINT
                      </div>
                      <h3 className="text-lg font-black text-white tracking-tight">
                        {aiResult.recommendedDevice}
                      </h3>
                    </div>
                    {aiResult.isMocked && (
                      <span className="text-[9px] font-mono font-bold text-emerald-accent/80 bg-emerald-accent/5 px-2 py-0.5 border border-emerald-accent/20 rounded">
                        FALLBACK SCHEMA
                      </span>
                    )}
                  </div>

                  {/* Bento grids for core components */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Breaker type */}
                    <div className="bg-navy-dark/60 border border-navy-light/40 p-4 rounded-xl space-y-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                        Primary Circuit Breaker
                      </span>
                      <p className="text-xs font-bold text-white">{aiResult.breakerType}</p>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                        <Clock className="h-3.5 w-3.5 text-emerald-accent" />
                        Est. Lifecycle: {aiResult.estimatedLifecycle}
                      </div>
                    </div>

                    {/* Protection Relays */}
                    <div className="bg-navy-dark/60 border border-navy-light/40 p-4 rounded-xl space-y-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                        Recommended Relay Suite
                      </span>
                      <ul className="space-y-1">
                        {aiResult.relayTypes.map((relay: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[10px] text-slate-300">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-accent shrink-0 mt-0.5" />
                            <span>{relay}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Technical Justification */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Technical Engineering Justification
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed bg-navy-dark/40 border border-navy-light/40 p-4 rounded-xl font-sans whitespace-pre-line">
                      {aiResult.technicalJustification}
                    </p>
                  </div>

                  {/* Rating Specifications Table */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Standard Rating Specifications
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-navy-light/40 bg-navy-dark/40">
                      <table className="w-full text-left text-[11px] font-mono">
                        <thead className="bg-navy-light/30 border-b border-navy-light/40 text-slate-400">
                          <tr>
                            <th className="px-4 py-2 font-bold uppercase tracking-wide">Parameter</th>
                            <th className="px-4 py-2 font-bold uppercase tracking-wide">AI Recommendation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-light/30 text-slate-300">
                          {aiResult.specifications.map((spec: any, idx: number) => (
                            <tr key={idx} className="hover:bg-navy-light/10 transition-colors">
                              <td className="px-4 py-2.5 font-medium text-slate-400">{spec.parameter}</td>
                              <td className="px-4 py-2.5 text-white font-bold">{spec.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
