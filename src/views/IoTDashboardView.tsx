import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Grid,
  Zap,
  Activity,
  Cpu,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  BatteryCharging,
  Home,
  CheckCircle,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { IEEEReportButton } from '../components/IEEEReportButton';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface LoadPoint {
  hour: number;
  solar: number;
  home: number;
  grid: number;
}

interface DSMRecommendation {
  time: string;
  action: string;
  benefit: string;
}

interface DSMResponse {
  analysis: string;
  recommendations: DSMRecommendation[];
  savingsEstimate: string;
  isMocked?: boolean;
}

export default function IoTDashboardView() {
  const [solarCapacity, setSolarCapacity] = useState<number>(5.0); // kW
  const [batterySize, setBatterySize] = useState<number>(10.0); // kWh
  const [loadMultiplier, setLoadMultiplier] = useState<number>(1.0);
  const [selectedPreset, setSelectedPreset] = useState<string>('sunny_normal');
  const [loadProfile, setLoadProfile] = useState<LoadPoint[]>([]);
  
  // Real-time instantaneous stats
  const [currentHour, setCurrentHour] = useState<number>(12);
  const [simulatedLoad, setSimulatedLoad] = useState<number>(0);
  const [simulatedSolar, setSimulatedSolar] = useState<number>(0);
  const [simulatedGrid, setSimulatedGrid] = useState<number>(0);
  const [simulatedBatterySoC, setSimulatedBatterySoC] = useState<number>(65);

  // AI Response states
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<DSMResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Generate 24hr load profile based on presets and inputs
  const generateProfile = (preset: string, solCap: number, batSz: number, multiplier: number) => {
    const points: LoadPoint[] = [];
    
    for (let h = 0; h < 24; h++) {
      // 1. Solar Curve: peaks at hour 12 (12 PM)
      let baseSolar = 0;
      if (h >= 6 && h <= 18) {
        // Simple sine-based solar curves
        const angle = ((h - 6) / 12) * Math.PI;
        baseSolar = Math.sin(angle);
      }
      
      if (preset === 'cloudy_storm') {
        baseSolar *= 0.25; // 75% reduction
      } else if (preset === 'winter_cold') {
        baseSolar *= 0.65; // Shorter and lower solar
      }
      const solarVal = parseFloat((baseSolar * solCap).toFixed(2));

      // 2. Household load: dual peaks (breakfast 7-9 AM, dinner 6-10 PM)
      let baseHome = 0.5; // continuous idle load
      if (h >= 7 && h <= 9) {
        baseHome += 1.8 * Math.sin(((h - 7) / 2) * Math.PI);
      } else if (h >= 17 && h <= 22) {
        baseHome += 3.2 * Math.sin(((h - 17) / 5) * Math.PI);
      } else if (h > 9 && h < 17) {
        baseHome += 0.8; // mid-day usage
      } else {
        baseHome += 0.3; // night standby
      }

      if (preset === 'high_industrial') {
        baseHome *= 2.2;
      } else if (preset === 'winter_cold') {
        baseHome *= 1.4; // heating load
      }
      const homeVal = parseFloat((baseHome * multiplier).toFixed(2));

      // 3. Grid Interaction = home - solar
      // Let's assume some battery offsets. High solar charges battery, evening discharges
      const gridVal = parseFloat((homeVal - solarVal).toFixed(2));

      points.push({
        hour: h,
        solar: solarVal,
        home: homeVal,
        grid: gridVal
      });
    }

    setLoadProfile(points);
    return points;
  };

  // Run generation when inputs or preset changes
  useEffect(() => {
    const points = generateProfile(selectedPreset, solarCapacity, batterySize, loadMultiplier);
    
    // Update live simulated statistics for the current hour
    const activePoint = points.find(p => p.hour === currentHour) || points[12];
    setSimulatedSolar(activePoint.solar);
    setSimulatedLoad(activePoint.home);
    setSimulatedGrid(activePoint.grid);
  }, [solarCapacity, batterySize, loadMultiplier, selectedPreset, currentHour]);

  // Handle Preset quick selector
  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    if (preset === 'sunny_normal') {
      setSolarCapacity(5.0);
      setLoadMultiplier(1.0);
    } else if (preset === 'cloudy_storm') {
      setSolarCapacity(2.0);
      setLoadMultiplier(1.15);
    } else if (preset === 'winter_cold') {
      setSolarCapacity(4.0);
      setLoadMultiplier(1.4);
    } else if (preset === 'high_industrial') {
      setSolarCapacity(8.0);
      setLoadMultiplier(2.0);
    }
  };

  // Call the server-side AI Energy Manager
  const handleAnalyzeDSM = async () => {
    setIsLoadingAI(true);
    setAiError(null);
    setAiResult(null);

    try {
      const response = await fetch('/api/iot-dsm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ loadProfile })
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve AI analysis. Verify server connection.');
      }

      const data = await response.json();
      setAiResult(data);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'An unexpected server error occurred.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Format hour label
  const formatHour = (h: number) => {
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h > 12 ? `${h - 12} PM` : `${h} AM`;
  };

  return (
    <div id="iot-dashboard-view" className="min-h-screen bg-navy-dark text-slate-100 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Back button */}
        <div className="mb-6">
          <Link
            to="/tools"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> BACK TO TOOLS CATALOG
          </Link>
        </div>

        {/* Dashboard Header */}
        <div className="relative mb-8 rounded-2xl border border-navy-light/60 bg-navy-light/20 p-6 md:p-8 overflow-hidden">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-emerald-accent/5 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-cyan-accent/5 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-accent font-semibold text-xs tracking-wider uppercase mb-2">
                <Sparkles className="h-4 w-4 animate-pulse" /> EEE 4241 / EEE 4247 IoT & Smart Grids
              </div>
              <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
                Smart Grid & <span className="text-emerald-accent">IoT Microgrid</span> Dashboard
              </h1>
              <p className="mt-2 text-sm text-slate-400 max-w-2xl leading-relaxed">
                Interact with simulated power generation curves, configure storage battery profiles, and leverage the Generative AI Demand Side Management (DSM) agent to balance supply grid fluctuations.
              </p>
            </div>
            
            <button
              onClick={handleAnalyzeDSM}
              disabled={isLoadingAI}
              className="flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold uppercase rounded-xl border border-emerald-accent/30 bg-emerald-accent/10 text-emerald-accent hover:bg-emerald-accent hover:text-navy-dark transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoadingAI ? (
                <>
                  <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                  <span>Optimizing Grid...</span>
                </>
              ) : (
                <>
                  <Cpu className="h-4.5 w-4.5" />
                  <span>Consult AI Energy Manager</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Interactive Configuration & Simulation Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Quick Stats Panel */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-4 gap-4">
            
            {/* Live Solar Generation */}
            <div className="rounded-xl border border-navy-light/60 bg-navy-light/30 p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-amber-400 mb-2">
                <span className="text-xs font-mono font-semibold tracking-wider uppercase">Solar Generation</span>
                <Zap className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="text-2xl font-black text-white font-mono">
                  {simulatedSolar.toFixed(2)} <span className="text-sm font-normal text-slate-400">kW</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  At {formatHour(currentHour)} (Solar Peak Cap: {solarCapacity}kW)
                </p>
              </div>
            </div>

            {/* Household Consumption */}
            <div className="rounded-xl border border-navy-light/60 bg-navy-light/30 p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-cyan-400 mb-2">
                <span className="text-xs font-mono font-semibold tracking-wider uppercase">Home Demand</span>
                <Home className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="text-2xl font-black text-white font-mono">
                  {simulatedLoad.toFixed(2)} <span className="text-sm font-normal text-slate-400">kW</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Load multiplier: {loadMultiplier.toFixed(2)}x
                </p>
              </div>
            </div>

            {/* Utility Grid Exchange */}
            <div className={`rounded-xl border bg-navy-light/30 p-5 flex flex-col justify-between ${
              simulatedGrid <= 0 ? 'border-emerald-accent/40' : 'border-rose-500/40'
            }`}>
              <div className={`flex items-center justify-between mb-2 ${
                simulatedGrid <= 0 ? 'text-emerald-accent' : 'text-rose-400'
              }`}>
                <span className="text-xs font-mono font-semibold tracking-wider uppercase">
                  {simulatedGrid <= 0 ? 'Grid Feed-In (Sell)' : 'Grid Supply (Buy)'}
                </span>
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="text-2xl font-black text-white font-mono">
                  {Math.abs(simulatedGrid).toFixed(2)} <span className="text-sm font-normal text-slate-400">kW</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {simulatedGrid <= 0 ? 'Exporting excess PV energy' : 'Importing deficit from utility'}
                </p>
              </div>
            </div>

            {/* Storage Battery */}
            <div className="rounded-xl border border-navy-light/60 bg-navy-light/30 p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-accent mb-2">
                <span className="text-xs font-mono font-semibold tracking-wider uppercase">Battery SoC</span>
                <BatteryCharging className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="text-2xl font-black text-white font-mono">
                  {simulatedBatterySoC}% <span className="text-sm font-normal text-slate-400">SOC</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Storage Reserve: {batterySize} kWh
                </p>
              </div>
            </div>

          </div>

          {/* Quick Presets Menu */}
          <div className="rounded-xl border border-navy-light/60 bg-navy-light/30 p-5">
            <h3 className="text-xs font-mono font-bold text-slate-300 mb-3 uppercase tracking-wider">
              Profile Presets
            </h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handlePresetChange('sunny_normal')}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  selectedPreset === 'sunny_normal'
                    ? 'bg-emerald-accent/15 text-emerald-accent border border-emerald-accent/20'
                    : 'bg-navy-dark hover:bg-navy-light/40 border border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                ☀️ Sunny Day Peak
              </button>
              <button
                onClick={() => handlePresetChange('cloudy_storm')}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  selectedPreset === 'cloudy_storm'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    : 'bg-navy-dark hover:bg-navy-light/40 border border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                ☁️ Overcast & Heavy Rain
              </button>
              <button
                onClick={() => handlePresetChange('winter_cold')}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  selectedPreset === 'winter_cold'
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                    : 'bg-navy-dark hover:bg-navy-light/40 border border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                ❄️ Winter Space Heating
              </button>
              <button
                onClick={() => handlePresetChange('high_industrial')}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  selectedPreset === 'high_industrial'
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                    : 'bg-navy-dark hover:bg-navy-light/40 border border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                🏭 High Commercial load
              </button>
            </div>
          </div>

        </div>

        {/* Dashboard Body Grid: Simulation & Chart vs Adjusters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Visualizer Area */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Area Chart of 24 Hour Load Profile */}
            <div className="rounded-xl border border-navy-light/60 bg-navy-light/10 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-base font-bold text-white">24-Hour Active Microgrid Energy Flow</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Visualizing generation curves against demand to pinpoint high-tariff stress zones.
                  </p>
                </div>

                {/* Simulated clock slider */}
                <div className="flex items-center gap-3 bg-navy-dark px-3 py-2 rounded-lg border border-navy-light/60">
                  <span className="text-xs font-mono text-slate-400">HOUR:</span>
                  <input
                    type="range"
                    min="0"
                    max="23"
                    value={currentHour}
                    onChange={(e) => {
                      setCurrentHour(parseInt(e.target.value));
                      // Mock charge discharge battery SOC movement
                      setSimulatedBatterySoC(prev => {
                        const next = prev + (Math.random() > 0.5 ? 1 : -1);
                        return Math.max(20, Math.min(100, next));
                      });
                    }}
                    className="w-24 accent-emerald-accent cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-emerald-accent">
                    {formatHour(currentHour)}
                  </span>
                </div>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={loadProfile}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorHome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                    <XAxis 
                      dataKey="hour" 
                      tickFormatter={(hour) => `${hour}h`} 
                      stroke="#64748b" 
                      style={{ fontSize: '11px', fontFamily: 'monospace' }}
                    />
                    <YAxis 
                      label={{ value: 'kW', angle: -90, position: 'insideLeft', fill: '#64748b', style: {fontSize: '11px'} }}
                      stroke="#64748b" 
                      style={{ fontSize: '11px', fontFamily: 'monospace' }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0b1329', borderColor: '#1e293b', borderRadius: '8px' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}
                      itemStyle={{ fontSize: '12px' }}
                      formatter={(value: any, name: string) => [
                        `${value} kW`,
                        name === 'solar' ? '☀️ Solar Output' : name === 'home' ? '🏠 Home Load' : '🔌 Net Grid Exchange'
                      ]}
                      labelFormatter={(label) => `Hour: ${label}:00 (${formatHour(Number(label))})`}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconSize={10} 
                      style={{ fontSize: '11px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="solar" 
                      stroke="#eab308" 
                      fillOpacity={1} 
                      fill="url(#colorSolar)" 
                      name="solar"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="home" 
                      stroke="#22d3ee" 
                      fillOpacity={1} 
                      fill="url(#colorHome)" 
                      name="home"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="grid" 
                      stroke="#64748b" 
                      fillOpacity={0}
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      name="grid"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI DSM Response Section */}
            {(aiResult || isLoadingAI || aiError) && (
              <div className="rounded-xl border border-navy-light/60 bg-navy-light/10 p-6 space-y-6 max-h-[500px] overflow-y-auto">
                <div className="flex items-center gap-2 pb-4 border-b border-navy-light/60">
                  <div className="p-1.5 rounded-lg bg-emerald-accent/10 border border-emerald-accent/20">
                    <Cpu className="h-5 w-5 text-emerald-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      AI DSM Optimizer Report
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Generated server-side utilizing Google Gemini LLM reasoning.
                    </p>
                  </div>
                </div>

                {isLoadingAI && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <RefreshCw className="h-8 w-8 text-emerald-accent animate-spin" />
                    <p className="text-xs font-mono text-slate-400">
                      Uploading profiles & executing dispatch solvers...
                    </p>
                  </div>
                )}

                {aiError && (
                  <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-200 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold uppercase">Solver Interruption</h4>
                      <p className="text-xs text-slate-400 mt-1">{aiError}</p>
                    </div>
                  </div>
                )}

                {aiResult && (
                  <div className="space-y-6" id="iot-chart">
                    <div className="flex justify-end">
                      <IEEEReportButton
                        experimentName="IoT & Smart Grids: Demand-Side Management"
                        inputData={{
                          'Solar Capacity': solarCapacity + ' kW',
                          'Battery Size': batterySize + ' kWh',
                          'Load Multiplier': loadMultiplier.toString(),
                          'Preset Profile': selectedPreset
                        }}
                        outputData={{
                          'Estimated Savings': aiResult.savingsEstimate
                        }}
                        chartSelectors={['#iot-chart']}
                      />
                    </div>
                    {/* Savings Highlight */}
                    <div className="p-4 rounded-xl border border-emerald-accent/20 bg-emerald-accent/10 text-emerald-accent flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-accent shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-mono font-black uppercase tracking-wider">
                          Optimized Dispatch Solution
                        </h4>
                        <p className="text-sm font-bold text-slate-200 mt-1">
                          {aiResult.savingsEstimate}
                        </p>
                      </div>
                    </div>

                    {/* Executive Analysis */}
                    <div className="text-slate-300 text-sm leading-relaxed markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{aiResult.analysis}</ReactMarkdown>
                    </div>

                    {/* Recommendations List */}
                    <div>
                      <h4 className="text-xs font-mono font-bold text-slate-400 mb-3 uppercase tracking-wider">
                        Actionable Load-Shifting Timeline
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {aiResult.recommendations.map((rec, i) => (
                          <div key={i} className="p-4 rounded-xl border border-navy-light/60 bg-navy-dark/60 flex flex-col justify-between">
                            <div>
                              <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-md bg-emerald-accent/10 border border-emerald-accent/20 text-emerald-accent mb-2">
                                {rec.time}
                              </span>
                              <p className="text-xs font-semibold text-slate-200 leading-relaxed">
                                {rec.action}
                              </p>
                            </div>
                            <p className="text-[11px] text-slate-400 border-t border-navy-light/40 pt-2 mt-3">
                              <span className="font-bold text-emerald-accent">Benefit:</span> {rec.benefit}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* Sidebar Adjuster Inputs */}
          <div className="space-y-6">
            
            {/* Solar Inputs */}
            <div className="rounded-xl border border-navy-light/60 bg-navy-light/20 p-5 space-y-4">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-400" /> Solar PV Settings
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Installed Capacity</span>
                  <span className="font-mono font-bold text-white">{solarCapacity} kW</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="15.0"
                  step="0.5"
                  value={solarCapacity}
                  onChange={(e) => setSolarCapacity(parseFloat(e.target.value))}
                  className="w-full accent-emerald-accent cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">
                  Total cumulative DC peak rating of monocrystalline panels.
                </p>
              </div>
            </div>

            {/* Battery Storage Settings */}
            <div className="rounded-xl border border-navy-light/60 bg-navy-light/20 p-5 space-y-4">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <BatteryCharging className="h-3.5 w-3.5 text-emerald-accent" /> LiFePO4 Storage
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Battery Capacity</span>
                  <span className="font-mono font-bold text-white">{batterySize} kWh</span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="30.0"
                  step="1.0"
                  value={batterySize}
                  onChange={(e) => setBatterySize(parseFloat(e.target.value))}
                  className="w-full accent-emerald-accent cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">
                  Usable lithium energy depth for peak load shaving buffer.
                </p>
              </div>
            </div>

            {/* Household consumption multipliers */}
            <div className="rounded-xl border border-navy-light/60 bg-navy-light/20 p-5 space-y-4">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Home className="h-3.5 w-3.5 text-cyan-400" /> Base Consumption
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Demand Multiplier</span>
                  <span className="font-mono font-bold text-white">{loadMultiplier.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={loadMultiplier}
                  onChange={(e) => setLoadMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-emerald-accent cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">
                  Scales the base residential daily energy usage profiles.
                </p>
              </div>
            </div>

            {/* Educational Info box */}
            <div className="rounded-xl border border-navy-light/60 bg-navy-light/10 p-5 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-1 font-bold text-slate-300 uppercase font-mono text-[10px]">
                <HelpCircle className="h-3.5 w-3.5 text-indigo-400" /> Smart Grid Engineering
              </div>
              <p className="leading-relaxed">
                Modern microgrids integrate high ratios of intermittent solar PV distributed resources. Under EEE 4247/4241 concepts, we learn:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
                <li><strong className="text-slate-300">Peak Shaving</strong>: Discharging battery during evening peak tariffs.</li>
                <li><strong className="text-slate-300">Load Valley Filling</strong>: Charging batteries and starting heavy home appliances when grid power is clean, cheap, and abundant.</li>
              </ul>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
