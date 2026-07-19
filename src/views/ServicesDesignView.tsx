import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Lightbulb,
  Cpu,
  Calculator,
  LayoutGrid,
  ShieldAlert,
  BookOpen,
  Info,
  CheckCircle2,
  TrendingUp,
  Sliders,
  Sparkles,
  Layers,
  Zap,
  ArrowLeft,
  ChevronRight,
  Shield,
  FileText,
  Compass,
  AlertTriangle
} from 'lucide-react';
import { IEEEReportButton } from '../components/IEEEReportButton';
import { useIlluminationDesign } from '../hooks/useIlluminationDesign';
import { useSubstationRating } from '../hooks/useSubstationRating';
import { useLightningProtection } from '../hooks/useLightningProtection';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';

export default function ServicesDesignView() {
  const [activeTab, setActiveTab] = useState<'estimator' | 'substation' | 'lightning'>('estimator');

  // --- Tab 1: Illumination & Cable/Breaker Estimator State ---
  const [roomLength, setRoomLength] = useState<number>(12);
  const [roomWidth, setRoomWidth] = useState<number>(8);
  const [mountingHeight, setMountingHeight] = useState<number>(3);
  const [targetLux, setTargetLux] = useState<number>(500); // e.g. Office study level
  const [lampLumens, setLampLumens] = useState<number>(2400); // LED tube/lamp
  const [utilFactor, setUtilFactor] = useState<number>(0.65); // UF
  const [maintFactor, setMaintFactor] = useState<number>(0.8); // MF

  const [connectedLoad, setConnectedLoad] = useState<number>(22); // kW
  const [pf, setPf] = useState<number>(0.85);
  const [sizingPhase, setSizingPhase] = useState<'single' | 'three'>('three');
  const [systemVoltage, setSystemVoltage] = useState<number>(400); // V

  // Preset Lux Levels
  const LUX_PRESETS = [
    { label: 'Bedroom (150 lx)', value: 150 },
    { label: 'Living Room (200 lx)', value: 200 },
    { label: 'Classroom / Lab (300 lx)', value: 300 },
    { label: 'Office / Study (500 lx)', value: 500 },
    { label: 'Drafting Room (750 lx)', value: 750 }
  ];

  // Preset Lumens
  const LUMENS_PRESETS = [
    { label: '9W LED Bulb (900 lm)', value: 900 },
    { label: '18W LED Tube (1800 lm)', value: 1800 },
    { label: '24W Premium LED (2400 lm)', value: 2400 },
    { label: '40W High Output LED (4000 lm)', value: 4000 }
  ];

  const handleSizingPhaseChange = (phase: 'single' | 'three') => {
    setSizingPhase(phase);
    setSystemVoltage(phase === 'single' ? 220 : 400);
  };

  // Run custom hook calculations
  const illuminationOut = useIlluminationDesign({
    length: roomLength,
    width: roomWidth,
    mountingHeight,
    targetLux,
    lampLumens,
    utilFactor,
    maintFactor
  });

  const FLCResult = useMemo(() => {
    const powerW = connectedLoad * 1000;
    let current = 0;
    if (sizingPhase === 'single') {
      current = powerW / (systemVoltage * pf);
    } else {
      current = powerW / (Math.sqrt(3) * systemVoltage * pf);
    }
    const flc = Math.round(current * 100) / 100;
    const safetyAmps = flc * 1.25;

    // Cable and Breaker Sizing Lookup Tables (simplified IEC/BNBC standard PVC copper multi-core)
    const STANDARD_CBS = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 400];
    const recBreaker = STANDARD_CBS.find(rating => rating >= safetyAmps) || 400;

    let recCable = '1.5 mm²';
    let cableCurrentCapacity = 16;
    let cableDesc = 'Standard light/fan sub-circuits.';

    if (recBreaker <= 10) {
      recCable = '1.5 mm²';
      cableCurrentCapacity = 16;
      cableDesc = 'Residential sub-circuits for lighting.';
    } else if (recBreaker <= 16) {
      recCable = '2.5 mm²';
      cableCurrentCapacity = 22;
      cableDesc = 'Standard power socket outlets.';
    } else if (recBreaker <= 25) {
      recCable = '4.0 mm²';
      cableCurrentCapacity = 30;
      cableDesc = 'High-load sockets (AC, microwave, geyser).';
    } else if (recBreaker <= 32) {
      recCable = '6.0 mm²';
      cableCurrentCapacity = 38;
      cableDesc = 'DB sub-mains / high power equipment.';
    } else if (recBreaker <= 50) {
      recCable = '10.0 mm²';
      cableCurrentCapacity = 52;
      cableDesc = 'Sub-mains from SDB to MDB.';
    } else if (recBreaker <= 63) {
      recCable = '16.0 mm²';
      cableCurrentCapacity = 69;
      cableDesc = 'Residential main service feeds.';
    } else if (recBreaker <= 80) {
      recCable = '25.0 mm²';
      cableCurrentCapacity = 92;
      cableDesc = 'Mains feed for small commercial units.';
    } else if (recBreaker <= 100) {
      recCable = '35.0 mm²';
      cableCurrentCapacity = 114;
      cableDesc = 'Main commercial service connection.';
    } else if (recBreaker <= 125) {
      recCable = '50.0 mm²';
      cableCurrentCapacity = 139;
      cableDesc = 'Heavy commercial mains distribution.';
    } else if (recBreaker <= 160) {
      recCable = '70.0 mm²';
      cableCurrentCapacity = 175;
      cableDesc = 'Industrial feeder service distribution.';
    } else if (recBreaker <= 200) {
      recCable = '95.0 mm²';
      cableCurrentCapacity = 212;
      cableDesc = 'Substation output heavy line links.';
    } else {
      recCable = '120.0 mm²';
      cableCurrentCapacity = 246;
      cableDesc = 'Heavy service connection line.';
    }

    return {
      flc,
      safetyAmps: Math.round(safetyAmps * 100) / 100,
      recBreaker,
      recCable,
      cableCurrentCapacity,
      cableDesc
    };
  }, [connectedLoad, sizingPhase, systemVoltage, pf]);


  // --- Tab 2: Dynamic Substation SLD Generator State ---
  const [subCapacityKVA, setSubCapacityKVA] = useState<number>(500); // S in kVA
  const [subHtKV, setSubHtKV] = useState<number>(11); // HT in kV
  const [subLtV, setSubLtV] = useState<number>(400); // LT in V
  const [subPfInit, setSubPfInit] = useState<number>(0.8);
  const [subPfTarget, setSubPfTarget] = useState<number>(0.98);

  const substationOut = useSubstationRating({
    capacityKVA: subCapacityKVA,
    primaryVoltageKV: subHtKV,
    secondaryVoltageV: subLtV,
    pfInitial: subPfInit,
    pfTarget: subPfTarget
  });


  // --- Tab 3: Lightning Protection Visualizer State ---
  const [structureHeight, setStructureHeight] = useState<number>(24); // m
  const [mastHeight, setMastHeight] = useState<number>(4); // m
  const [structureWidth, setStructureWidth] = useState<number>(30); // m
  const [protectionLevel, setProtectionLevel] = useState<'Class I' | 'Class II' | 'Class III' | 'Class IV'>('Class I');
  const [lightningMethod, setLightningMethod] = useState<'rolling-sphere' | 'protective-angle'>('rolling-sphere');

  const lightningOut = useLightningProtection({
    buildingHeight: structureHeight,
    mastHeight,
    buildingWidth: structureWidth,
    protectionLevel,
    method: lightningMethod
  });


  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 min-h-[85vh]">
      {/* Back to Tools Navigation */}
      <div>
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO MODULE CATALOG
        </Link>
      </div>

      {/* Hero Header Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-navy-light pb-6 text-left">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-emerald-accent bg-emerald-accent/10 border border-emerald-accent/20 px-3 py-1 rounded-full">
            <BookOpen className="h-3 w-3" /> EEE 4100: ELECTRICAL SERVICES & BUILDING ELECTRIFICATION
          </div>
          <h1 id="electrical-services-title" className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Electrical Services Design Suite
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Professional calculators for commercial building electrification, dynamic substation SLDs, and lightning safety envelopes compliant with BNBC/NFPA codes.
          </p>
        </div>

        {/* Module Navigation Tabs */}
        <div className="flex flex-wrap bg-navy-card p-1 rounded-xl border border-navy-light shrink-0">
          <button
            onClick={() => setActiveTab('estimator')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'estimator' ? 'bg-emerald-accent text-navy-dark shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Lightbulb className="h-4 w-4" /> Building Services
          </button>
          <button
            onClick={() => setActiveTab('substation')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'substation' ? 'bg-emerald-accent text-navy-dark shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Zap className="h-4 w-4" /> Substation SLD
          </button>
          <button
            onClick={() => setActiveTab('lightning')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'lightning' ? 'bg-emerald-accent text-navy-dark shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Shield className="h-4 w-4" /> Lightning Protection
          </button>
        </div>
      </div>

      {/* MAIN SUITE VIEWPORT */}
      {activeTab === 'estimator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Inputs Section - Col span 4 */}
          <div className="lg:col-span-4 bg-navy-card border border-navy-light rounded-2xl p-6 space-y-6 text-left">
            <div className="flex items-center gap-2 border-b border-navy-light pb-3">
              <Sliders className="h-4 w-4 text-emerald-accent" />
              <h3 className="font-display font-bold text-sm text-white">Electrification Parameters</h3>
            </div>

            {/* Sub-Section 1: Room & Illumination */}
            <div className="space-y-4">
              <div className="border-b border-navy-light/40 pb-2">
                <span className="text-[11px] font-mono font-bold text-emerald-accent uppercase tracking-wider">1. Symmetrical Illumination</span>
              </div>

              {/* Room Dimensions */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Room Dimensions (m)</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-500 font-mono">Length (L)</label>
                    <input
                      type="number"
                      min={1}
                      value={roomLength}
                      onChange={(e) => setRoomLength(Math.max(1, parseFloat(e.target.value) || 0))}
                      className="w-full px-2 py-1.5 bg-navy-dark border border-navy-light rounded-lg text-xs font-mono text-white outline-none focus:border-emerald-accent"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 font-mono">Width (W)</label>
                    <input
                      type="number"
                      min={1}
                      value={roomWidth}
                      onChange={(e) => setRoomWidth(Math.max(1, parseFloat(e.target.value) || 0))}
                      className="w-full px-2 py-1.5 bg-navy-dark border border-navy-light rounded-lg text-xs font-mono text-white outline-none focus:border-emerald-accent"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 font-mono">Mount Ht</label>
                    <input
                      type="number"
                      min={1}
                      value={mountingHeight}
                      onChange={(e) => setMountingHeight(Math.max(1, parseFloat(e.target.value) || 0))}
                      className="w-full px-2 py-1.5 bg-navy-dark border border-navy-light rounded-lg text-xs font-mono text-white outline-none focus:border-emerald-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Target Lux Level */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Target Lux Level</label>
                  <span className="text-[10px] text-emerald-accent font-mono">{targetLux} lx</span>
                </div>
                <input
                  type="number"
                  min={1}
                  value={targetLux}
                  onChange={(e) => setTargetLux(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 bg-navy-dark border border-navy-light rounded-lg text-xs font-mono text-white outline-none focus:border-emerald-accent"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {LUX_PRESETS.map(preset => (
                    <button
                      key={preset.value}
                      onClick={() => setTargetLux(preset.value)}
                      className={`px-1.5 py-0.5 rounded text-[9px] transition-all font-mono ${targetLux === preset.value ? 'bg-emerald-accent/20 border border-emerald-accent/30 text-emerald-accent' : 'bg-navy-dark hover:bg-navy-light text-slate-400'}`}
                    >
                      {preset.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Luminous Flux */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Lumens Per Lamp</label>
                  <span className="text-[10px] text-emerald-accent font-mono">{lampLumens} lm</span>
                </div>
                <input
                  type="number"
                  min={1}
                  value={lampLumens}
                  onChange={(e) => setLampLumens(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 bg-navy-dark border border-navy-light rounded-lg text-xs font-mono text-white outline-none focus:border-emerald-accent"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {LUMENS_PRESETS.map(preset => (
                    <button
                      key={preset.value}
                      onClick={() => setLampLumens(preset.value)}
                      className={`px-1.5 py-0.5 rounded text-[9px] transition-all font-mono ${lampLumens === preset.value ? 'bg-emerald-accent/20 border border-emerald-accent/30 text-emerald-accent' : 'bg-navy-dark hover:bg-navy-light text-slate-400'}`}
                    >
                      {preset.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Coefficients */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-mono text-slate-500 uppercase">Util. Factor (UF)</label>
                  <input
                    type="number"
                    step={0.05}
                    min={0.1}
                    max={1}
                    value={utilFactor}
                    onChange={(e) => setUtilFactor(Math.min(1, Math.max(0.1, parseFloat(e.target.value) || 0.6)))}
                    className="w-full px-2.5 py-1.5 bg-navy-dark border border-navy-light rounded-lg text-xs font-mono text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-slate-500 uppercase">Maint. Factor (MF)</label>
                  <input
                    type="number"
                    step={0.05}
                    min={0.1}
                    max={1}
                    value={maintFactor}
                    onChange={(e) => setMaintFactor(Math.min(1, Math.max(0.1, parseFloat(e.target.value) || 0.8)))}
                    className="w-full px-2.5 py-1.5 bg-navy-dark border border-navy-light rounded-lg text-xs font-mono text-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Sub-Section 2: Electrical Load Sizing */}
            <div className="space-y-4 pt-4 border-t border-navy-light/40">
              <div className="border-b border-navy-light/40 pb-2">
                <span className="text-[11px] font-mono font-bold text-emerald-accent uppercase tracking-wider">2. Connected Load & Cable Sizing</span>
              </div>

              {/* Connected Load kW */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Total Load Power (kW)</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0.1}
                    step={0.5}
                    value={connectedLoad}
                    onChange={(e) => setConnectedLoad(Math.max(0.1, parseFloat(e.target.value) || 0))}
                    className="w-full pl-3 pr-10 py-1.5 bg-navy-dark border border-navy-light rounded-lg text-xs font-mono text-white outline-none focus:border-emerald-accent"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center text-[10px] font-mono text-slate-500 font-bold">
                    kW
                  </div>
                </div>
              </div>

              {/* Power supply phase */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Supply Topology Phase</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSizingPhaseChange('single')}
                    className={`py-1 rounded-lg border text-[10px] font-mono transition-all ${sizingPhase === 'single' ? 'bg-emerald-accent/20 border-emerald-accent text-emerald-accent' : 'bg-navy-dark border-navy-light text-slate-400'}`}
                  >
                    1-Phase (220V)
                  </button>
                  <button
                    onClick={() => handleSizingPhaseChange('three')}
                    className={`py-1 rounded-lg border text-[10px] font-mono transition-all ${sizingPhase === 'three' ? 'bg-emerald-accent/20 border-emerald-accent text-emerald-accent' : 'bg-navy-dark border-navy-light text-slate-400'}`}
                  >
                    3-Phase (400V)
                  </button>
                </div>
              </div>

              {/* Line voltage and pf */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-mono text-slate-500 uppercase">Voltage (V)</label>
                  <input
                    type="number"
                    min={1}
                    value={systemVoltage}
                    onChange={(e) => setSystemVoltage(Math.max(1, parseInt(e.target.value) || 220))}
                    className="w-full px-2.5 py-1.5 bg-navy-dark border border-navy-light rounded-lg text-xs font-mono text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-slate-500 uppercase">Power Factor (pf)</label>
                  <input
                    type="number"
                    step={0.01}
                    min={0.1}
                    max={1}
                    value={pf}
                    onChange={(e) => setPf(Math.min(1, Math.max(0.1, parseFloat(e.target.value) || 0.85)))}
                    className="w-full px-2.5 py-1.5 bg-navy-dark border border-navy-light rounded-lg text-xs font-mono text-white outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Outputs / Dashboard Area - Col span 8 */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex justify-end">
              <IEEEReportButton
                experimentName="Illumination and Electrical Load Design Spec"
                inputData={{
                  'Room Parameters': `${roomLength}m L x ${roomWidth}m W x ${mountingHeight}m Mounting Ht`,
                  'Target Illuminance': `${targetLux} Lux`,
                  'Lamp Power Output': `${lampLumens} Lumens`,
                  'Coefficients (UF/MF)': `${utilFactor} / ${maintFactor}`,
                  'Electrical Load': `${connectedLoad} kW (${sizingPhase === 'single' ? '1-Phase' : '3-Phase'}, ${systemVoltage}V, ${pf} pf)`
                }}
                outputData={{
                  'Total Symmetrical Grid': `${illuminationOut.cols} Cols x ${illuminationOut.rows} Rows`,
                  'Symmetrical Fixtures': `${illuminationOut.finalLamps} lamps (Achieved: ${illuminationOut.actualLux} Lux)`,
                  'Spacing To Height Ratio': `${illuminationOut.spaceRatio} (Standard <= 1.5)`,
                  'Full Load Current (FLC)': `${FLCResult.flc} Amps`,
                  'Circuit Breaker Recommended': `${FLCResult.recBreaker} Amps (continuous safety limit)`,
                  'PVC Copper Cable Size': `${FLCResult.recCable} (Rated for ${FLCResult.cableCurrentCapacity}A)`
                }}
                chartSelectors={['#illumination-topdown-view']}
              />
            </div>

            {/* Calculations Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Illumination Sizing Output Spec Card */}
              <div className="bg-navy-card border border-navy-light rounded-2xl p-6 text-left space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 border-b border-navy-light pb-3 mb-2">
                    <Lightbulb className="h-4 w-4 text-emerald-accent" />
                    <h3 className="font-display font-bold text-sm text-white">Illumination Specifications</h3>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between border-b border-navy-light/40 py-1.5">
                      <span className="text-slate-400">Total Flux Required:</span>
                      <span className="text-white font-bold">{illuminationOut.totalLumens.toLocaleString()} lm</span>
                    </div>
                    <div className="flex justify-between border-b border-navy-light/40 py-1.5">
                      <span className="text-slate-400">Mathematical Exact Lamps:</span>
                      <span className="text-white font-bold">{illuminationOut.rawLamps} lamps</span>
                    </div>
                    <div className="flex justify-between border-b border-navy-light/40 py-1.5">
                      <span className="text-slate-400">Symmetrical Grid Plan:</span>
                      <span className="text-emerald-accent font-bold">{illuminationOut.cols} Cols x {illuminationOut.rows} Rows</span>
                    </div>
                    <div className="flex justify-between border-b border-navy-light/40 py-1.5">
                      <span className="text-slate-400">Total Symmetrical Fixtures:</span>
                      <span className="text-emerald-accent font-bold">{illuminationOut.finalLamps} lamps</span>
                    </div>
                    <div className="flex justify-between border-b border-navy-light/40 py-1.5">
                      <span className="text-slate-400">Achieved Illuminance (E):</span>
                      <span className="text-white font-bold">{illuminationOut.actualLux} Lux</span>
                    </div>
                    <div className="flex justify-between border-b border-navy-light/40 py-1.5">
                      <span className="text-slate-400">Spacing Ratio (S/Hm):</span>
                      <span className={`font-bold ${illuminationOut.spaceRatio <= 1.5 ? 'text-emerald-accent' : 'text-amber-500'}`}>
                        {illuminationOut.spaceRatio} {illuminationOut.spaceRatio <= 1.5 ? '(Optimal)' : '(Non-Uniform)'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-navy-dark/40 border border-navy-light p-3 rounded-lg text-[10px] text-slate-400 space-y-1">
                  <span className="text-emerald-accent font-bold uppercase tracking-wider block font-mono">Lumen Formula (BNBC)</span>
                  <p className="font-mono">N = (E * A) / (F * UF * MF)</p>
                  <p className="leading-relaxed font-sans">
                    Guarantees standard lighting uniformity index exceeding 0.70 inside learning spaces and critical office environments.
                  </p>
                </div>
              </div>

              {/* Switchgear & Cable Sizing Output Spec Card */}
              <div className="bg-navy-card border border-navy-light rounded-2xl p-6 text-left space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 border-b border-navy-light pb-3 mb-2">
                    <Zap className="h-4 w-4 text-emerald-accent" />
                    <h3 className="font-display font-bold text-sm text-white">Switchgear & Cable Sizing</h3>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between border-b border-navy-light/40 py-1.5">
                      <span className="text-slate-400">Full Load Current (FLC):</span>
                      <span className="text-white font-bold">{FLCResult.flc} A</span>
                    </div>
                    <div className="flex justify-between border-b border-navy-light/40 py-1.5">
                      <span className="text-slate-400">Continuous Current (125%):</span>
                      <span className="text-white font-bold">{FLCResult.safetyAmps} A</span>
                    </div>
                    <div className="flex justify-between border-b border-navy-light/40 py-1.5">
                      <span className="text-slate-400">Recommended MCB/MCCB:</span>
                      <span className="text-emerald-accent font-bold">{FLCResult.recBreaker} A</span>
                    </div>
                    <div className="flex justify-between border-b border-navy-light/40 py-1.5">
                      <span className="text-slate-400">Recommended Cable size:</span>
                      <span className="text-emerald-accent font-bold">{FLCResult.recCable} NYY/PVC</span>
                    </div>
                    <div className="flex justify-between border-b border-navy-light/40 py-1.5">
                      <span className="text-slate-400">Cable Current Capacity:</span>
                      <span className="text-white font-bold">{FLCResult.cableCurrentCapacity} A</span>
                    </div>
                    <div className="flex justify-between border-b border-navy-light/40 py-1.5">
                      <span className="text-slate-400">Cable Sizing Note:</span>
                      <span className="text-slate-300 font-sans text-[11px] leading-tight block text-right">
                        {FLCResult.cableDesc}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-navy-dark/40 border border-navy-light p-3 rounded-lg text-[10px] text-slate-400 space-y-1">
                  <span className="text-emerald-accent font-bold uppercase tracking-wider block font-mono">FLC Formula</span>
                  <p className="font-mono">
                    {sizingPhase === 'single' ? 'I = P / (V * pf)' : 'I = P / (√3 * V * pf)'}
                  </p>
                  <p className="leading-relaxed font-sans">
                    Applies the BNBC 1.25 multiplier limit for continuous thermal load operation to protect copper conductors from insulation degradation.
                  </p>
                </div>
              </div>
            </div>

            {/* Symmetrical Lighting Top-Down Visualizer Grid SVG */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-navy-card border border-navy-light rounded-2xl p-6 flex flex-col justify-between text-left" id="illumination-topdown-view">
                <div>
                  <div className="flex items-center gap-2 border-b border-navy-light pb-3 mb-2">
                    <LayoutGrid className="h-4 w-4 text-emerald-accent" />
                    <h3 className="font-display font-bold text-sm text-white">Luminaires Placement Schematic</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block mb-3">
                    Top-down cross-sectional room uniform layout: {roomLength}m x {roomWidth}m (Spacing: X={illuminationOut.colSpacing}m, Y={illuminationOut.rowSpacing}m)
                  </span>
                </div>

                {/* Top down room layout SVG */}
                <div className="bg-navy-dark/60 border border-navy-light p-3 rounded-xl flex items-center justify-center min-h-[180px]">
                  <svg viewBox="0 0 400 240" className="w-full h-auto max-h-[160px]">
                    <rect x="5" y="5" width="390" height="230" rx="10" fill="#090f1d" stroke="#1e293b" strokeWidth="2" />
                    
                    {/* Render grid guide paths */}
                    <g opacity="0.1" stroke="#10b981" strokeWidth="0.5" strokeDasharray="3,3">
                      {Array.from({ length: illuminationOut.cols }).map((_, i) => {
                        const x = 5 + (390 / illuminationOut.cols) * (i + 0.5);
                        return <line key={`gx-${i}`} x1={x} y1="5" x2={x} y2="235" />;
                      })}
                      {Array.from({ length: illuminationOut.rows }).map((_, i) => {
                        const y = 5 + (230 / illuminationOut.rows) * (i + 0.5);
                        return <line key={`gy-${i}`} x1="5" y1={y} x2="395" y2={y} />;
                      })}
                    </g>

                    {/* Uniform lamps placement */}
                    {Array.from({ length: illuminationOut.cols }).map((_, cIdx) => {
                      const x = 5 + (390 / illuminationOut.cols) * (cIdx + 0.5);
                      return Array.from({ length: illuminationOut.rows }).map((_, rIdx) => {
                        const y = 5 + (230 / illuminationOut.rows) * (rIdx + 0.5);
                        return (
                          <g key={`lamp-${cIdx}-${rIdx}`}>
                            <circle cx={x} cy={y} r="14" fill="url(#lamp-glow)" opacity="0.5" />
                            <circle cx={x} cy={y} r="4" fill="#0d1527" stroke="#10b981" strokeWidth="1" />
                            <circle cx={x} cy={y} r="1.5" fill="#ffffff" />
                          </g>
                        );
                      });
                    })}

                    <defs>
                      <radialGradient id="lamp-glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                  </svg>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 text-[9px] text-slate-400 font-mono">
                  <div className="bg-navy-dark/40 px-2 py-1 border border-navy-light/60 rounded text-center">
                    Col interval ≈ {illuminationOut.colSpacing} m
                  </div>
                  <div className="bg-navy-dark/40 px-2 py-1 border border-navy-light/60 rounded text-center">
                    Row interval ≈ {illuminationOut.rowSpacing} m
                  </div>
                </div>
              </div>

              {/* Cable Core Cross Section gauge graphic */}
              <div className="bg-navy-card border border-navy-light rounded-2xl p-6 flex flex-col justify-between text-left">
                <div>
                  <div className="flex items-center gap-2 border-b border-navy-light pb-3 mb-2">
                    <ShieldAlert className="h-4 w-4 text-emerald-accent" />
                    <h3 className="font-display font-bold text-sm text-white">Cable Cross-Section Gauge</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block mb-3">
                    Approximate relative cross-section of copper core: {FLCResult.recCable} PVC/NYY
                  </span>
                </div>

                {/* Scaled Wire Gauge Circle */}
                <div className="bg-navy-dark/60 border border-navy-light p-4 rounded-xl flex flex-col items-center justify-center min-h-[180px] space-y-3">
                  <div className="relative flex items-center justify-center">
                    {/* Outer PVC Insulation circle */}
                    <div
                      className="rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center"
                      style={{
                        width: `${Math.min(140, 50 + parseFloat(FLCResult.recCable) * 4.5)}px`,
                        height: `${Math.min(140, 50 + parseFloat(FLCResult.recCable) * 4.5)}px`
                      }}
                    >
                      {/* Copper conductor core */}
                      <div
                        className="rounded-full bg-amber-600 border border-amber-400 animate-pulse"
                        style={{
                          width: `${Math.min(110, 25 + parseFloat(FLCResult.recCable) * 3.5)}px`,
                          height: `${Math.min(110, 25 + parseFloat(FLCResult.recCable) * 3.5)}px`
                        }}
                      />
                    </div>
                    {/* Center text tag */}
                    <div className="absolute">
                      <span className="text-white text-[10px] font-mono font-extrabold bg-navy-card/90 border border-navy-light/60 px-2 py-0.5 rounded shadow">
                        {FLCResult.recCable}
                      </span>
                    </div>
                  </div>
                  <div className="text-[9px] font-mono text-center space-y-0.5">
                    <span className="text-emerald-accent block">Conductor: 99.9% Electrolytic Copper</span>
                    <span className="text-slate-400 block">Insulation Thickness: Compliant with IEC 60502-1</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[9px] text-slate-500 justify-center mt-3">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-accent shrink-0" />
                  <span>Correct sizing protects building against overload fire risks.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'substation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left panel - Inputs */}
          <div className="lg:col-span-4 bg-navy-card border border-navy-light rounded-2xl p-6 space-y-6 text-left">
            <div className="flex items-center gap-2 border-b border-navy-light pb-3">
              <Sliders className="h-4 w-4 text-emerald-accent" />
              <h3 className="font-display font-bold text-sm text-white">Substation Inputs</h3>
            </div>

            <div className="space-y-4">
              {/* Capacity S in kVA */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Substation Capacity (S)</label>
                <div className="relative">
                  <input
                    type="number"
                    min={50}
                    step={50}
                    value={subCapacityKVA}
                    onChange={(e) => setSubCapacityKVA(Math.max(10, parseInt(e.target.value) || 200))}
                    className="w-full pl-3 pr-12 py-2 bg-navy-dark border border-navy-light rounded-lg text-xs font-mono text-white outline-none focus:border-emerald-accent"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center text-xs font-mono text-slate-500 font-bold">
                    kVA
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 pt-1.5">
                  {[100, 250, 500, 750, 1000, 1250].map(kva => (
                    <button
                      key={kva}
                      onClick={() => setSubCapacityKVA(kva)}
                      className={`px-1.5 py-0.5 rounded text-[9px] transition-all font-mono ${subCapacityKVA === kva ? 'bg-emerald-accent/20 border border-emerald-accent/30 text-emerald-accent' : 'bg-navy-dark hover:bg-navy-light text-slate-400'}`}
                    >
                      {kva}k
                    </button>
                  ))}
                </div>
              </div>

              {/* Voltage Primary/Secondary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Primary HT (kV)</label>
                  <input
                    type="number"
                    step={1}
                    min={1}
                    value={subHtKV}
                    onChange={(e) => setSubHtKV(Math.max(1, parseFloat(e.target.value) || 11))}
                    className="w-full px-2.5 py-1.5 bg-navy-dark border border-navy-light rounded-lg text-xs font-mono text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Secondary LT (V)</label>
                  <input
                    type="number"
                    min={100}
                    value={subLtV}
                    onChange={(e) => setSubLtV(Math.max(100, parseInt(e.target.value) || 400))}
                    className="w-full px-2.5 py-1.5 bg-navy-dark border border-navy-light rounded-lg text-xs font-mono text-white outline-none"
                  />
                </div>
              </div>

              {/* Power Factor Improvements */}
              <div className="space-y-3 pt-3 border-t border-navy-light/40">
                <span className="text-[11px] font-mono font-bold text-emerald-accent uppercase tracking-wider block">PFI Plant Calibration</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Initial PF</label>
                    <input
                      type="number"
                      step={0.01}
                      min={0.4}
                      max={1}
                      value={subPfInit}
                      onChange={(e) => setSubPfInit(Math.min(1, Math.max(0.4, parseFloat(e.target.value) || 0.8)))}
                      className="w-full px-2.5 py-1.5 bg-navy-dark border border-navy-light rounded-lg text-xs font-mono text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Target PF</label>
                    <input
                      type="number"
                      step={0.01}
                      min={0.8}
                      max={1}
                      value={subPfTarget}
                      onChange={(e) => setSubPfTarget(Math.min(1, Math.max(0.8, parseFloat(e.target.value) || 0.98)))}
                      className="w-full px-2.5 py-1.5 bg-navy-dark border border-navy-light rounded-lg text-xs font-mono text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-navy-dark/40 border border-navy-light rounded-lg text-[10px] text-slate-400 space-y-1 font-mono">
              <p className="text-emerald-accent font-bold">SLD Calculations Guide:</p>
              <p>HT Nominal: S / (√3 * V_HT)</p>
              <p>LT Nominal: S / (√3 * V_LT_kV)</p>
              <p>PFI Plant Capacity (kVAR):</p>
              <p className="text-[9px] text-slate-500 leading-tight">Q_PFI = P * (tan(acos(pf_init)) - tan(acos(pf_target)))</p>
            </div>
          </div>

          {/* Right panel - Scrollable Single Line Diagram (SLD) & Specifications */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex justify-end">
              <IEEEReportButton
                experimentName="Substation SLD Sizing and PFI Design"
                inputData={{
                  'Substation S rating': `${subCapacityKVA} kVA`,
                  'HT Side voltage': `${subHtKV} kV`,
                  'LT Side voltage': `${subLtV} V`,
                  'Power factor initial': subPfInit,
                  'Power factor target': subPfTarget
                }}
                outputData={{
                  'HT Nominal line current': `${substationOut.htNominalCurrent} Amps`,
                  'LT Nominal line current': `${substationOut.ltNominalCurrent} Amps`,
                  'Recommended VCB switchgear': `${substationOut.recommendedHtBreaker} A`,
                  'Recommended ACB low tension': `${substationOut.recommendedLtBreaker} A`,
                  'PFI Reactive capacity': `${substationOut.pfiCapacityKVAR} kVAR`,
                  'Sized LT Cable runs': substationOut.recommendedLtCable
                }}
                chartSelectors={['#substation-sld-panel']}
              />
            </div>

            {/* Substation specification parameters bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-navy-card border border-navy-light p-3 rounded-xl text-left font-mono">
                <span className="text-[9px] text-slate-500 uppercase block">HT FLC</span>
                <span className="text-sm font-bold text-white">{substationOut.htNominalCurrent} A</span>
              </div>
              <div className="bg-navy-card border border-navy-light p-3 rounded-xl text-left font-mono">
                <span className="text-[9px] text-slate-500 uppercase block">LT FLC</span>
                <span className="text-sm font-bold text-white">{substationOut.ltNominalCurrent} A</span>
              </div>
              <div className="bg-navy-card border border-navy-light p-3 rounded-xl text-left font-mono">
                <span className="text-[9px] text-emerald-accent uppercase block">PFI Plant</span>
                <span className="text-sm font-bold text-emerald-accent">{substationOut.pfiCapacityKVAR} kVAR</span>
              </div>
              <div className="bg-navy-card border border-navy-light p-3 rounded-xl text-left font-mono">
                <span className="text-[9px] text-slate-500 uppercase block">TX losses est.</span>
                <span className="text-sm font-bold text-white">{substationOut.transformerLossesEst} kW</span>
              </div>
            </div>

            {/* Scrollable responsive SVG Single Line Diagram Card */}
            <div className="bg-navy-card border border-navy-light rounded-2xl p-6 text-left space-y-4" id="substation-sld-panel">
              <div className="flex items-center justify-between border-b border-navy-light pb-3">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-emerald-accent" />
                  <h3 className="font-display font-bold text-sm text-white">Dynamic Substation SLD Schematic</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono bg-navy-light border border-navy-light/60 px-2 py-0.5 rounded">
                  Dyn11, {subHtKV}kV/{subLtV/1000}kV Vector
                </span>
              </div>

              {/* Scrollable Container with stylized SVG */}
              <div className="overflow-x-auto bg-navy-dark/70 border border-navy-light rounded-xl p-4 flex justify-center">
                <div className="min-w-[450px] w-full">
                  <svg viewBox="0 0 500 580" className="w-full h-auto text-slate-100 font-mono">
                    {/* Definitions */}
                    <defs>
                      <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
                      </marker>
                    </defs>

                    {/* INCOMING 11kV LINE */}
                    <g transform="translate(0,0)">
                      <line x1="250" y1="10" x2="250" y2="40" stroke="#f59e0b" strokeWidth="2.5" />
                      <line x1="230" y1="10" x2="270" y2="10" stroke="#f59e0b" strokeWidth="3" />
                      <text x="280" y="25" className="text-[10px] fill-amber-400 font-bold">Incoming HT Supply ({subHtKV} kV)</text>
                    </g>

                    {/* VCB (VACUUM CIRCUIT BREAKER) */}
                    <g transform="translate(0,0)">
                      <rect x="225" y="40" width="50" height="40" rx="4" fill="#111827" stroke="#ef4444" strokeWidth="2" />
                      <text x="250" y="64" className="text-[10px] text-center font-extrabold fill-red-500" textAnchor="middle">VCB</text>
                      <text x="285" y="55" className="text-[9px] fill-slate-300">HT Circuit Breaker</text>
                      <text x="285" y="68" className="text-[9px] fill-emerald-accent">Rating: {substationOut.recommendedHtBreaker} A</text>
                    </g>

                    {/* CURRENT TRANSFORMER (HT CT) */}
                    <g transform="translate(0,0)">
                      <line x1="250" y1="80" x2="250" y2="105" stroke="#f59e0b" strokeWidth="2" />
                      <circle cx="250" cy="115" r="10" fill="none" stroke="#10b981" strokeWidth="1.5" />
                      <circle cx="250" cy="122" r="10" fill="none" stroke="#10b981" strokeWidth="1.5" />
                      <text x="280" y="122" className="text-[9px] fill-slate-400">HT CT (Protection & Metering)</text>
                    </g>

                    {/* TRANSFORMER */}
                    <g transform="translate(0,0)">
                      <line x1="250" y1="132" x2="250" y2="160" stroke="#f59e0b" strokeWidth="2" />
                      {/* Transformer circle symbols */}
                      <circle cx="250" cy="180" r="20" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                      <circle cx="250" cy="205" r="20" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                      
                      {/* Delta Wye labels inside circles */}
                      <text x="250" y="184" className="text-[11px] font-extrabold fill-amber-500" textAnchor="middle">Δ</text>
                      <text x="250" y="210" className="text-[11px] font-extrabold fill-sky-400" textAnchor="middle">Y</text>
                      
                      <text x="285" y="180" className="text-[10px] font-extrabold fill-white">Transformer: {subCapacityKVA} kVA</text>
                      <text x="285" y="195" className="text-[9px] fill-slate-400">Step-Down Dyn11</text>
                      <text x="285" y="210" className="text-[9px] fill-slate-400">Ratio: {subHtKV}kV / {subLtV/1000}kV</text>
                    </g>

                    {/* LT MAIN ACB */}
                    <g transform="translate(0,0)">
                      <line x1="250" y1="225" x2="250" y2="255" stroke="#38bdf8" strokeWidth="2.5" />
                      <rect x="225" y="255" width="50" height="40" rx="4" fill="#111827" stroke="#ef4444" strokeWidth="2" />
                      <text x="250" y="279" className="text-[10px] font-extrabold fill-red-500" textAnchor="middle">ACB</text>
                      <text x="285" y="270" className="text-[9px] fill-slate-300">LT Main Air Circuit Breaker</text>
                      <text x="285" y="283" className="text-[9px] fill-emerald-accent">Sized: {substationOut.recommendedLtBreaker} A</text>
                    </g>

                    {/* MAIN BUSBAR (THREE PHASE 400V) */}
                    <g transform="translate(0,0)">
                      <line x1="250" y1="295" x2="250" y2="330" stroke="#38bdf8" strokeWidth="2.5" />
                      
                      {/* Horizontal busbars representation */}
                      <line x1="80" y1="330" x2="420" y2="330" stroke="#38bdf8" strokeWidth="3" />
                      <line x1="80" y1="335" x2="420" y2="335" stroke="#ef4444" strokeWidth="1" />
                      <line x1="80" y1="340" x2="420" y2="340" stroke="#f59e0b" strokeWidth="1" />
                      
                      <text x="250" y="322" className="text-[9px] fill-sky-400 font-bold" textAnchor="middle">LT MAIN BUSBAR ({subLtV}V/230V)</text>
                    </g>

                    {/* LEFT BRANCH - PFI PLANT (CAPACITOR BANK) */}
                    <g transform="translate(0,0)">
                      <line x1="150" y1="340" x2="150" y2="380" stroke="#38bdf8" strokeWidth="2" />
                      
                      {/* Switch symbol */}
                      <circle cx="150" cy="380" r="3" fill="#ef4444" />
                      <line x1="150" y1="380" x2="165" y2="395" stroke="#ef4444" strokeWidth="1.5" />
                      <circle cx="150" cy="405" r="3" fill="#ef4444" />
                      
                      <line x1="150" y1="405" x2="150" y2="430" stroke="#38bdf8" strokeWidth="2" />
                      
                      {/* PFI Box */}
                      <rect x="110" y="430" width="80" height="45" rx="3" fill="#111827" stroke="#38bdf8" strokeWidth="2" />
                      <text x="150" y="450" className="text-[9px] font-extrabold fill-sky-400" textAnchor="middle">PFI PLANT</text>
                      <text x="150" y="465" className="text-[9px] font-bold fill-emerald-accent" textAnchor="middle">{substationOut.pfiCapacityKVAR} kVAR</text>
                      
                      <text x="100" y="495" className="text-[9px] fill-slate-400 text-center block w-24">Capacitor Bank for Power Factor Correction</text>
                    </g>

                    {/* RIGHT BRANCH - OUTGOING FEEDERS TO LOAD */}
                    <g transform="translate(0,0)">
                      <line x1="350" y1="340" x2="350" y2="380" stroke="#38bdf8" strokeWidth="2" />
                      
                      {/* MCCB Box */}
                      <rect x="325" y="380" width="50" height="30" rx="3" fill="#111827" stroke="#ef4444" strokeWidth="1.5" />
                      <text x="350" y="398" className="text-[9px] font-extrabold fill-red-500" textAnchor="middle">MCCB</text>
                      
                      <line x1="350" y1="410" x2="350" y2="440" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
                      
                      {/* Cable Sizing text tags */}
                      <rect x="290" y="445" width="125" height="40" rx="4" fill="#0f172a" stroke="#1e293b" />
                      <text x="352" y="457" className="text-[8px] font-bold fill-emerald-accent" textAnchor="middle">CABLE RATING</text>
                      <text x="352" y="470" className="text-[8px] fill-white" textAnchor="middle">{substationOut.recommendedLtCable.split('PVC')[0]}</text>
                      <text x="352" y="480" className="text-[8px] fill-white" textAnchor="middle">{substationOut.recommendedLtCable.split('XLPE')[1] || ''}</text>
                      
                      <text x="350" y="505" className="text-[9px] font-bold fill-slate-300" textAnchor="middle">To Main Distribution</text>
                      <text x="350" y="518" className="text-[9px] font-bold fill-slate-300" textAnchor="middle">Board (MDB)</text>
                    </g>

                  </svg>
                </div>
              </div>

              <div className="flex gap-2.5 items-start bg-navy-dark/40 border border-navy-light p-3 rounded-xl">
                <Info className="h-5 w-5 text-emerald-accent shrink-0 mt-0.5" />
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  The generated schematic displays real-time sizing calculations matching local utility guidelines. PFI plant capacity is sized dynamically to improve the lagging power factor to 0.98, avoiding active kVA penalties on grid integration.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'lightning' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left panel - Inputs */}
          <div className="lg:col-span-4 bg-navy-card border border-navy-light rounded-2xl p-6 space-y-6 text-left">
            <div className="flex items-center gap-2 border-b border-navy-light pb-3">
              <Sliders className="h-4 w-4 text-emerald-accent" />
              <h3 className="font-display font-bold text-sm text-white">Structure Inputs</h3>
            </div>

            <div className="space-y-4">
              {/* Structure Height */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Structure Roof Height</label>
                <div className="relative">
                  <input
                    type="number"
                    min={2}
                    max={100}
                    value={structureHeight}
                    onChange={(e) => setStructureHeight(Math.max(2, parseFloat(e.target.value) || 10))}
                    className="w-full pl-3 pr-10 py-1.5 bg-navy-dark border border-navy-light rounded-lg text-xs font-mono text-white outline-none focus:border-emerald-accent"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center text-xs font-mono text-slate-500 font-bold">
                    meters
                  </div>
                </div>
              </div>

              {/* Mast Height */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Air Terminal (Mast) Height</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0.5}
                    max={20}
                    step={0.5}
                    value={mastHeight}
                    onChange={(e) => setMastHeight(Math.max(0.5, parseFloat(e.target.value) || 2))}
                    className="w-full pl-3 pr-10 py-1.5 bg-navy-dark border border-navy-light rounded-lg text-xs font-mono text-white outline-none focus:border-emerald-accent"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center text-xs font-mono text-slate-500 font-bold">
                    meters
                  </div>
                </div>
              </div>

              {/* Building Width */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Structure Width (2D Profiler)</label>
                <div className="relative">
                  <input
                    type="number"
                    min={5}
                    max={150}
                    value={structureWidth}
                    onChange={(e) => setStructureWidth(Math.max(5, parseFloat(e.target.value) || 20))}
                    className="w-full pl-3 pr-10 py-1.5 bg-navy-dark border border-navy-light rounded-lg text-xs font-mono text-white outline-none focus:border-emerald-accent"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center text-xs font-mono text-slate-500 font-bold">
                    meters
                  </div>
                </div>
              </div>

              {/* Class of protection level */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Protection level Class (NFPA 780)</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Class I', 'Class II', 'Class III', 'Class IV'] as const).map(level => (
                    <button
                      key={level}
                      onClick={() => setProtectionLevel(level)}
                      className={`py-1 rounded-lg border text-[10px] font-mono transition-all ${protectionLevel === level ? 'bg-emerald-accent/20 border-emerald-accent text-emerald-accent' : 'bg-navy-dark border-navy-light text-slate-400'}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Protection Method */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Calculation Methodology</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setLightningMethod('rolling-sphere')}
                    className={`py-1 rounded-lg border text-[10px] font-mono transition-all ${lightningMethod === 'rolling-sphere' ? 'bg-emerald-accent/20 border-emerald-accent text-emerald-accent' : 'bg-navy-dark border-navy-light text-slate-400'}`}
                  >
                    Rolling Sphere
                  </button>
                  <button
                    onClick={() => setLightningMethod('protective-angle')}
                    className={`py-1 rounded-lg border text-[10px] font-mono transition-all ${lightningMethod === 'protective-angle' ? 'bg-emerald-accent/20 border-emerald-accent text-emerald-accent' : 'bg-navy-dark border-navy-light text-slate-400'}`}
                  >
                    Protective Angle
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-navy-dark/40 border border-navy-light rounded-lg text-[10px] text-slate-400 space-y-1 font-mono">
              <span className="text-emerald-accent font-bold block uppercase">IEC 62305 Standard Radii:</span>
              <p>Class I: R = 20m | Class II: R = 30m</p>
              <p>Class III: R = 45m | Class IV: R = 60m</p>
              <p className="pt-2 leading-relaxed font-sans">
                The protective mast height at the center creates a shielding cone protecting building coordinates inside the visual safe zone.
              </p>
            </div>
          </div>

          {/* Right panel - Dynamic Recharts protection zone graph & calculations */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex justify-end">
              <IEEEReportButton
                experimentName="Lightning Protection Zone Engineering Assessment"
                inputData={{
                  'Building Height': `${structureHeight} meters`,
                  'Air Terminal Height': `${mastHeight} meters`,
                  'Building Profiler Width': `${structureWidth} meters`,
                  'Protection Class Level': protectionLevel,
                  'Selected Siting Method': lightningMethod === 'rolling-sphere' ? 'Rolling Sphere Method' : 'Protective Angle Method'
                }}
                outputData={{
                  'Total System Height (h)': `${lightningOut.totalHeight} meters`,
                  'Class Sphere Radius (R)': `${lightningOut.rollingSphereRadius} m`,
                  'Interpreted Protective Angle': `${lightningOut.protectiveAngle}°`,
                  'Calculated Radius Ground': `${lightningOut.protectionRadiusGround} m`,
                  'Calculated Radius Roof': `${lightningOut.protectionRadiusRoof} m`,
                  'Siting Protection Status': lightningOut.isFullyProtected ? 'FULLY PROTECTED' : 'WARNING: INCOMPLETE COVERAGE'
                }}
                chartSelectors={['#lightning-assessment-graph']}
              />
            </div>

            {/* Lightning calculations outputs dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-navy-card border border-navy-light p-3 rounded-xl text-left font-mono">
                <span className="text-[9px] text-slate-500 uppercase block">Total Ht (h)</span>
                <span className="text-sm font-bold text-white">{lightningOut.totalHeight} m</span>
              </div>
              <div className="bg-navy-card border border-navy-light p-3 rounded-xl text-left font-mono">
                <span className="text-[9px] text-slate-500 uppercase block">
                  {lightningMethod === 'rolling-sphere' ? 'Sphere Radius (R)' : 'Protection Angle'}
                </span>
                <span className="text-sm font-bold text-white">
                  {lightningMethod === 'rolling-sphere' ? `${lightningOut.rollingSphereRadius} m` : `${lightningOut.protectiveAngle}°`}
                </span>
              </div>
              <div className="bg-navy-card border border-navy-light p-3 rounded-xl text-left font-mono">
                <span className="text-[9px] text-emerald-accent uppercase block">Ground Radius</span>
                <span className="text-sm font-bold text-emerald-accent">{lightningOut.protectionRadiusGround} m</span>
              </div>
              <div className="bg-navy-card border border-navy-light p-3 rounded-xl text-left font-mono">
                <span className="text-[9px] text-slate-500 uppercase block">Siting Check</span>
                {lightningOut.isFullyProtected ? (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-accent/20 border border-emerald-accent/30 text-emerald-accent font-bold inline-block">
                    SAFE CORE
                  </span>
                ) : (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-500 font-bold inline-block">
                    MARGIN RISK
                  </span>
                )}
              </div>
            </div>

            {/* Recharts Protective Zone Side Profile Card */}
            <div className="bg-navy-card border border-navy-light rounded-2xl p-6 text-left space-y-4" id="lightning-assessment-graph">
              <div className="flex items-center justify-between border-b border-navy-light pb-3">
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-emerald-accent" />
                  <h3 className="font-display font-bold text-sm text-white">2D Zone of Protection Profile</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono bg-navy-light border border-navy-light/60 px-2 py-0.5 rounded">
                  Vertical Side View Cross-Section
                </span>
              </div>

              {/* Recharts Area Chart */}
              <div className="h-[280px] bg-navy-dark/40 border border-navy-light rounded-xl p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={lightningOut.chartData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorProtection" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorStructure" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="x"
                      type="number"
                      domain={['auto', 'auto']}
                      stroke="#475569"
                      fontSize={9}
                      tickFormatter={(val) => `${val}m`}
                    />
                    <YAxis
                      stroke="#475569"
                      fontSize={9}
                      tickFormatter={(val) => `${val}m`}
                    />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                      labelStyle={{ color: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                      itemStyle={{ fontSize: 10, fontFamily: 'monospace' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 5 }} />
                    
                    {/* Safe Protection Area Envelope */}
                    <Area
                      type="monotone"
                      dataKey="protectionY"
                      stroke="#10b981"
                      strokeWidth={1.5}
                      fill="url(#colorProtection)"
                      name="Protected Safe Volume"
                    />

                    {/* Structure Side View Profile Area */}
                    <Area
                      type="step"
                      dataKey="buildingY"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      fill="url(#colorStructure)"
                      name="Building & Mast Profile"
                    />

                    {/* Roof level marker */}
                    <ReferenceLine y={structureHeight} stroke="#475569" strokeDasharray="3 3" label={{ value: 'Roof Level', fill: '#94a3b8', fontSize: 8, position: 'insideTopLeft' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* status explanations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-navy-dark/40 border border-navy-light p-3.5 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-emerald-accent uppercase tracking-wider block">Zone Boundaries</span>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    Ground level protection extends to <strong className="text-emerald-accent">{lightningOut.protectionRadiusGround}m</strong> on each side from the central air terminal mast. The roof clearance safety radius is <strong className="text-emerald-accent">{lightningOut.protectionRadiusRoof}m</strong>.
                  </p>
                </div>

                <div className="bg-navy-dark/40 border border-navy-light p-3.5 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-emerald-accent uppercase tracking-wider block">Siting Assessment</span>
                  <div className="flex items-start gap-2 pt-0.5">
                    {lightningOut.isFullyProtected ? (
                      <>
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-accent shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                          <strong>Fully Protected:</strong> The structure roof falls completely under the shielding curve of the air terminal. Complies with NFPA 780 safety regulations.
                        </p>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-500 leading-relaxed font-sans">
                          <strong>Edge Coverage Risk:</strong> The roof corner boundary exceeds the safety cone. Increase the air terminal mast height or add additional side masts for full coverage.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
