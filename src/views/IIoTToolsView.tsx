import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  Cpu,
  Database,
  Sliders,
  Play,
  Pause,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Gauge,
  Wifi,
  Cloud,
  Network,
  Wrench,
  Trash2,
  Plus,
  Loader2,
  Settings,
  ShieldCheck,
  TrendingUp,
  Server,
  Layers,
  Flame,
  Binary
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
  ScatterChart,
  Scatter,
  ReferenceLine,
  Legend
} from 'recharts';
import { useTelemetrySimulation } from '../hooks/useTelemetrySimulation';
import { useNetworkLatency } from '../hooks/useNetworkLatency';
import { usePredictiveMaintenance } from '../hooks/usePredictiveMaintenance';

export default function IIoTToolsView() {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'latency' | 'maintenance'>('telemetry');

  // ==========================================
  // TAB 1: TELEMETRY SIMULATOR CONFIG
  // ==========================================
  const [dhtActive, setDhtActive] = useState(true);
  const [mq2Active, setMq2Active] = useState(true);
  const [ultrasonicActive, setUltrasonicActive] = useState(true);
  const [transInterval, setTransInterval] = useState(500); // ms
  const [mq2Threshold, setMq2Threshold] = useState(300); // PPM limit

  const {
    data: telemetryData,
    current: telemetryCurrent,
    isAlarmActive,
    triggerGasSpike,
    clearAlarm,
  } = useTelemetrySimulation({
    dhtActive,
    mq2Active,
    ultrasonicActive,
    interval: transInterval,
    mq2Threshold,
  });

  // ==========================================
  // TAB 2: FOG VS CLOUD LATENCY CONFIG
  // ==========================================
  const [payloadSize, setPayloadSize] = useState(16); // KB per node
  const [activeNodes, setActiveNodes] = useState(250); // nodes
  const [wanBandwidth, setWanBandwidth] = useState(10); // Mbps

  const {
    inputs: latencyInputs,
    setInputs: setLatencyInputs,
    stats: latencyStats,
  } = useNetworkLatency({
    payloadSize,
    activeNodes,
    bandwidth: wanBandwidth,
  });

  // Sync state changes back to the hook
  useEffect(() => {
    setLatencyInputs({
      payloadSize,
      activeNodes,
      bandwidth: wanBandwidth,
    });
  }, [payloadSize, activeNodes, wanBandwidth, setLatencyInputs]);

  // Animated packet simulator states
  const [packetTick, setPacketTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setPacketTick(prev => (prev + 1) % 100);
    }, 40);
    return () => clearInterval(t);
  }, []);

  // Bar chart data for Fog vs Cloud
  const latencyBarData = useMemo(() => {
    return [
      {
        name: 'Direct to Cloud',
        'Total Latency (ms)': latencyStats.cloud.latency,
        'Prop Delay': latencyStats.cloud.propDelay,
        'Trans Delay': latencyStats.cloud.transDelay,
        'Processing Delay': latencyStats.cloud.processingDelay,
        'Bandwidth Consumption': latencyStats.cloud.bandwidthRate,
      },
      {
        name: 'Fog Node Architecture',
        'Total Latency (ms)': latencyStats.fog.latency,
        'Prop Delay': latencyStats.fog.edgeToFogDelay, // Local delay
        'Trans Delay': latencyStats.fog.processingDelay, // Fog processing
        'Processing Delay': latencyStats.fog.fogToCloudDelay, // WAN delay to Cloud
        'Bandwidth Consumption': latencyStats.fog.bandwidthRate,
      }
    ];
  }, [latencyStats]);

  // ==========================================
  // TAB 3: PREDICTIVE MAINTENANCE CONFIG
  // ==========================================
  const {
    dataPoints,
    failureThreshold,
    setFailureThreshold,
    currentHours,
    setCurrentHours,
    addDataPoint,
    deleteDataPoint,
    clearAllData,
    loadPreset,
    analytics,
  } = usePredictiveMaintenance();

  const [newHours, setNewHours] = useState('');
  const [newVibe, setNewVibe] = useState('');

  const handleAddPoint = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseInt(newHours);
    const v = parseFloat(newVibe);
    if (!isNaN(h) && !isNaN(v) && h >= 0 && v >= 0) {
      addDataPoint(h, v);
      setNewHours('');
      setNewVibe('');
    }
  };

  return (
    <div className="min-h-screen bg-navy-dark text-slate-100 pb-12 font-sans selection:bg-emerald-accent/30 selection:text-white">
      {/* Top Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO DEPT CATALOG
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* SCADA System Title Banner */}
        <div className="relative rounded-2xl border border-navy-light/60 bg-navy-light/20 p-6 md:p-8 overflow-hidden">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-blue-500/5 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-emerald-accent/5 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-accent font-semibold text-xs tracking-wider uppercase mb-2">
                <Wifi className="h-4 w-4 animate-pulse" /> EEE 4241 Industrial IoT & Automation Suite
              </div>
              <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
                IIoT Edge Telemetry & <span className="text-emerald-accent">Fog Analytics</span>
              </h1>
              <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed font-sans">
                An advanced lab simulator focused on Industry 4.0 applications. Study localized sensor polling rates, compare WAN bandwidth compression at local Fog Gateways, and predict machinery health with linear regression trendlines.
              </p>
            </div>
            <div className="bg-navy-dark/60 border border-navy-light px-4 py-3 rounded-xl flex items-center gap-3 shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-accent/10 border border-emerald-accent/20">
                <Network className="h-5 w-5 text-emerald-accent animate-spin-slow" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-500 tracking-wider uppercase">SCADA STATUS</div>
                <div className="text-xs font-mono font-bold text-emerald-accent">IIoT CO-PROCESSOR ONLINE</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-navy-light/60 pb-px">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'telemetry'
                ? 'border-emerald-accent text-emerald-accent bg-emerald-accent/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'
            }`}
          >
            <Gauge className="h-4 w-4" />
            1. SCADA Telemetry & Alerts
          </button>
          <button
            onClick={() => setActiveTab('latency')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'latency'
                ? 'border-emerald-accent text-emerald-accent bg-emerald-accent/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'
            }`}
          >
            <Layers className="h-4 w-4" />
            2. Fog vs. Cloud Architecture
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'maintenance'
                ? 'border-emerald-accent text-emerald-accent bg-emerald-accent/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'
            }`}
          >
            <Wrench className="h-4 w-4" />
            3. Predictive Machine Health
          </button>
        </div>

        {/* Tab Switchboard */}
        <div className="animate-fadeIn">
          {/* ========================================== */}
          {/* TAB 1: SCADA TELEMETRY & ALERTS */}
          {/* ========================================== */}
          {activeTab === 'telemetry' && (
            <div className="space-y-8">
              {/* Telemetry Alarm Banner */}
              {isAlarmActive && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl flex items-center justify-between gap-4 animate-pulse">
                  <div className="flex gap-3 items-center">
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      <Flame className="h-5 w-5" />
                    </div>
                    <div>
                      <strong className="block font-bold font-mono text-sm tracking-wide uppercase">HAZARDOUS ATMOSPHERE ALARM</strong>
                      <span className="text-xs text-slate-300 font-mono">
                        MQ2 gas sensor detected {telemetryCurrent.mq2} PPM, exceeding the safety threshold of {mq2Threshold} PPM. Exhaust fans activated.
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={clearAlarm}
                    className="px-4 py-2 bg-rose-500 text-white font-mono text-xs font-bold uppercase rounded-lg hover:bg-rose-600 transition-all cursor-pointer shadow-md shrink-0"
                  >
                    Mute Alarm & Purge Gas
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Inputs & Config Panel */}
                <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  <div>
                    <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono border-b border-navy-light/60 pb-3 flex items-center gap-2">
                      <Sliders className="h-4.5 w-4.5 text-emerald-accent" />
                      Industrial Node Config
                    </h3>
                  </div>

                  <div className="space-y-6">
                    {/* Active Sensors Toggles */}
                    <div className="space-y-2">
                      <label className="text-xs font-mono font-bold text-slate-400 block uppercase tracking-wider">
                        Virtual Sensor Activations
                      </label>
                      <div className="space-y-2">
                        <button
                          onClick={() => setDhtActive(!dhtActive)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-xs font-mono cursor-pointer ${
                            dhtActive
                              ? 'bg-emerald-accent/10 border-emerald-accent/40 text-emerald-accent'
                              : 'bg-navy-dark/40 border-navy-light/55 text-slate-500'
                          }`}
                        >
                          <span>DHT-11 Temp & Humidity Sensor</span>
                          <span className="text-[10px] font-bold uppercase">{dhtActive ? 'Active' : 'Disabled'}</span>
                        </button>

                        <button
                          onClick={() => setMq2Active(!mq2Active)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-xs font-mono cursor-pointer ${
                            mq2Active
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                              : 'bg-navy-dark/40 border-navy-light/55 text-slate-500'
                          }`}
                        >
                          <span>MQ2 Combustible Gas Sensor</span>
                          <span className="text-[10px] font-bold uppercase">{mq2Active ? 'Active' : 'Disabled'}</span>
                        </button>

                        <button
                          onClick={() => setUltrasonicActive(!ultrasonicActive)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-xs font-mono cursor-pointer ${
                            ultrasonicActive
                              ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                              : 'bg-navy-dark/40 border-navy-light/55 text-slate-500'
                          }`}
                        >
                          <span>HC-SR04 Ultrasonic Distance</span>
                          <span className="text-[10px] font-bold uppercase">{ultrasonicActive ? 'Active' : 'Disabled'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Data Transmission Rate */}
                    <div className="space-y-2">
                      <div className="flex justify-between font-mono text-xs">
                        <span className="text-slate-400 uppercase font-bold">Telemetry Sample Rate</span>
                        <span className="text-emerald-accent font-bold">{transInterval} ms</span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="2000"
                        step="100"
                        value={transInterval}
                        onChange={e => setTransInterval(parseInt(e.target.value))}
                        className="w-full accent-emerald-accent"
                      />
                      <span className="text-[10px] text-slate-500 font-mono block">
                        Lower interval simulates dense raw edge-streaming (e.g. 10 Hz polling rate).
                      </span>
                    </div>

                    {/* Alarm threshold for MQ2 */}
                    <div className="space-y-2 border-t border-navy-light/40 pt-4">
                      <div className="flex justify-between font-mono text-xs">
                        <span className="text-slate-400 uppercase font-bold">Gas Safety Limit (MQ2)</span>
                        <span className="text-amber-400 font-bold">{mq2Threshold} PPM</span>
                      </div>
                      <input
                        type="range"
                        min="150"
                        max="500"
                        step="10"
                        value={mq2Threshold}
                        onChange={e => setMq2Threshold(parseInt(e.target.value))}
                        className="w-full accent-amber-400"
                      />
                    </div>

                    {/* Manual Spiker button */}
                    <div className="border-t border-navy-light/40 pt-4">
                      <button
                        onClick={triggerGasSpike}
                        disabled={!mq2Active}
                        className={`w-full py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          mq2Active
                            ? 'bg-amber-500 text-navy-dark hover:bg-amber-400 shadow-md'
                            : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Flame className="h-4 w-4" />
                        Trigger Toxic Gas Spike
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Dashboard Grid */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Digital Readouts (SCADA Gauges) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* DHT-11 Widget */}
                    <div className="bg-navy-card border border-navy-light/60 p-5 rounded-2xl relative overflow-hidden">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Temp / Hum (DHT-11)</span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${dhtActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700/30 text-slate-500 border border-slate-700/40'}`}>
                          {dhtActive ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-4 mt-1.5">
                        <div className="text-3xl font-mono font-black text-white">
                          {dhtActive ? `${telemetryCurrent.temp}°C` : '---'}
                        </div>
                        <div className="text-sm font-mono font-medium text-slate-400">
                          {dhtActive ? `${telemetryCurrent.humidity}% RH` : '---'}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span>Calibration: Factory ISO</span>
                        <span>Noise: ±0.3</span>
                      </div>
                    </div>

                    {/* MQ2 Gas Level Widget */}
                    <div className={`bg-navy-card border p-5 rounded-2xl relative overflow-hidden transition-all duration-300 ${isAlarmActive ? 'border-rose-500/50 bg-rose-500/5' : 'border-navy-light/60'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Gas Concentration (MQ2)</span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${mq2Active ? (isAlarmActive ? 'bg-rose-500/25 text-rose-400 animate-pulse border border-rose-500/40' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20') : 'bg-slate-700/30 text-slate-500 border border-slate-700/40'}`}>
                          {mq2Active ? (isAlarmActive ? 'DANGER' : 'ONLINE') : 'OFFLINE'}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-1.5">
                        <div className={`text-3xl font-mono font-black ${isAlarmActive ? 'text-rose-400' : 'text-white'}`}>
                          {mq2Active ? `${telemetryCurrent.mq2}` : '---'}
                        </div>
                        <div className="text-xs font-mono font-bold text-slate-500">PPM</div>
                      </div>

                      {/* Gas level bar */}
                      <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${isAlarmActive ? 'bg-rose-500' : 'bg-amber-400'}`}
                          style={{ width: mq2Active ? `${Math.min(100, (telemetryCurrent.mq2 / 500) * 100)}%` : '0%' }}
                        />
                      </div>
                    </div>

                    {/* HC-SR04 Ultrasonic Widget */}
                    <div className="bg-navy-card border border-navy-light/60 p-5 rounded-2xl relative overflow-hidden">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Distance (HC-SR04)</span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${ultrasonicActive ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-700/30 text-slate-500 border border-slate-700/40'}`}>
                          {ultrasonicActive ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-1.5">
                        <div className="text-3xl font-mono font-black text-white">
                          {ultrasonicActive ? `${telemetryCurrent.distance}` : '---'}
                        </div>
                        <div className="text-xs font-mono font-bold text-slate-500">cm</div>
                      </div>

                      {/* Distance Visualizer bar */}
                      <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: ultrasonicActive ? `${Math.min(100, (telemetryCurrent.distance / 400) * 100)}%` : '0%' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Temperature & Humidity Moving Chart */}
                  <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                        Real-time Environmental Telemetry (DHT-11 Time Series)
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        Showing rolling 50-sample buffer
                      </span>
                    </div>

                    <div className="h-64 w-full">
                      {dhtActive ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={telemetryData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis
                              dataKey="time"
                              stroke="#475569"
                              style={{ fontSize: '9px', fontFamily: 'monospace' }}
                              tickLine={false}
                            />
                            <YAxis
                              yAxisId="left"
                              stroke="#10b981"
                              style={{ fontSize: '9px', fontFamily: 'monospace' }}
                              domain={['dataMin - 1', 'dataMax + 1']}
                              tickLine={false}
                            />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              stroke="#60a5fa"
                              style={{ fontSize: '9px', fontFamily: 'monospace' }}
                              domain={['dataMin - 5', 'dataMax + 5']}
                              tickLine={false}
                            />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                            />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="temp"
                              stroke="#10b981"
                              strokeWidth={2}
                              dot={false}
                              name="Temperature (°C)"
                              animationDuration={0}
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="humidity"
                              stroke="#60a5fa"
                              strokeWidth={2}
                              dot={false}
                              name="Humidity (% RH)"
                              animationDuration={0}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                          DHT-11 Sensor inactive. Enable sensor switch to view rolling chart.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 2: FOG VS CLOUD LATENCY SIMULATION */}
          {/* ========================================== */}
          {activeTab === 'latency' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Inputs & Config Panel */}
                <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  <div>
                    <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono border-b border-navy-light/60 pb-3 flex items-center gap-2">
                      <Settings className="h-4.5 w-4.5 text-emerald-accent" />
                      Network & Gateway Controls
                    </h3>
                  </div>

                  <div className="space-y-6 font-mono text-xs">
                    {/* Active Nodes Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400 uppercase font-bold">Active Sensor Nodes</span>
                        <span className="text-emerald-accent font-bold">{activeNodes} Nodes</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="1000"
                        step="5"
                        value={activeNodes}
                        onChange={e => setActiveNodes(parseInt(e.target.value))}
                        className="w-full accent-emerald-accent"
                      />
                      <span className="text-[10px] text-slate-500 block">
                        Represents a factory-floor array of industrial instruments.
                      </span>
                    </div>

                    {/* Payload Size per node */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400 uppercase font-bold">Payload Size / Node</span>
                        <span className="text-emerald-accent font-bold">{payloadSize} KB</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="128"
                        step="1"
                        value={payloadSize}
                        onChange={e => setPayloadSize(parseInt(e.target.value))}
                        className="w-full accent-emerald-accent"
                      />
                      <span className="text-[10px] text-slate-500 block">
                        Raw sensor log packets, JSON strings, or high-freq logs.
                      </span>
                    </div>

                    {/* WAN Bandwidth */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400 uppercase font-bold">WAN Bandwidth (Internet)</span>
                        <span className="text-emerald-accent font-bold">{wanBandwidth} Mbps</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        step="1"
                        value={wanBandwidth}
                        onChange={e => setWanBandwidth(parseInt(e.target.value))}
                        className="w-full accent-emerald-accent"
                      />
                      <span className="text-[10px] text-slate-500 block">
                        Backhaul connection speed connecting local facility to Cloud.
                      </span>
                    </div>

                    {/* Architecture efficiency readouts */}
                    <div className="bg-navy-dark/60 border border-navy-light/50 p-4 rounded-xl space-y-3">
                      <div className="text-[10px] text-slate-400 font-bold uppercase border-b border-navy-light pb-2 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-accent" />
                        Edge/Fog Efficiency Gains
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">WAN Latency Saved:</span>
                        <span className="text-emerald-accent font-bold">
                          {latencyStats.savings.latency}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">WAN Bandwidth Saved:</span>
                        <span className="text-emerald-accent font-bold">
                          {latencyStats.savings.bandwidth}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Topology & Charts Visualizer */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Dynamic Interactive Topology Diagram */}
                  <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                      Network Packet Propagation Topology
                    </h4>
                    
                    <div className="bg-navy-dark/70 border border-navy-light/40 rounded-xl p-4 flex flex-col items-center relative overflow-hidden">
                      <svg viewBox="0 0 600 240" className="w-full h-auto max-w-xl text-slate-300">
                        {/* Define SVG gradient arrows */}
                        <defs>
                          <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
                          </marker>
                        </defs>

                        {/* Top Layer: Cloud Data Center */}
                        <g transform="translate(300, 30)">
                          <rect x="-80" y="-18" width="160" height="36" rx="6" className="fill-blue-500/10 stroke-blue-500 stroke-2" />
                          <Cloud className="h-5 w-5 text-blue-400 absolute" style={{ transform: 'translate(-60px, -10px)' }} />
                          <text x="0" y="4" className="fill-white font-mono text-[10px] font-bold" textAnchor="middle">CENTRAL CLOUD</text>
                          <text x="0" y="14" className="fill-slate-500 font-mono text-[7px]" textAnchor="middle">Remote AWS/GCP (High Ping)</text>
                        </g>

                        {/* Middle Layer: Fog Gateway Node */}
                        <g transform="translate(300, 120)">
                          <rect x="-80" y="-18" width="160" height="36" rx="6" className="fill-emerald-accent/10 stroke-emerald-accent stroke-2" />
                          <Server className="h-5 w-5 text-emerald-accent absolute" style={{ transform: 'translate(-60px, -10px)' }} />
                          <text x="0" y="4" className="fill-white font-mono text-[10px] font-bold" textAnchor="middle">LOCAL FOG NODE</text>
                          <text x="0" y="14" className="fill-slate-500 font-mono text-[7px]" textAnchor="middle">Industrial Gateway (LAN Edge)</text>
                        </g>

                        {/* Bottom Layer: Distributed Edge Sensors */}
                        <g transform="translate(120, 210)">
                          <circle cx="0" cy="0" r="16" className="fill-navy-card stroke-slate-500 stroke-2" />
                          <Cpu className="h-4 w-4 text-slate-400 absolute" style={{ transform: 'translate(-8px, -8px)' }} />
                          <text x="0" y="28" className="fill-slate-400 font-mono text-[8px]" textAnchor="middle">Sensor Array 1</text>
                        </g>

                        <g transform="translate(300, 210)">
                          <circle cx="0" cy="0" r="16" className="fill-navy-card stroke-slate-500 stroke-2" />
                          <Cpu className="h-4 w-4 text-slate-400 absolute" style={{ transform: 'translate(-8px, -8px)' }} />
                          <text x="0" y="28" className="fill-slate-400 font-mono text-[8px]" textAnchor="middle">Sensor Array 2</text>
                        </g>

                        <g transform="translate(480, 210)">
                          <circle cx="0" cy="0" r="16" className="fill-navy-card stroke-slate-500 stroke-2" />
                          <Cpu className="h-4 w-4 text-slate-400 absolute" style={{ transform: 'translate(-8px, -8px)' }} />
                          <text x="0" y="28" className="fill-slate-400 font-mono text-[8px]" textAnchor="middle">Sensor Array 3</text>
                        </g>

                        {/* Connection Paths */}
                        {/* Direct Edge to Cloud Paths (Gray dashed) */}
                        <line x1="120" y1="194" x2="250" y2="48" className="stroke-slate-700 stroke-1 stroke-dasharray[2]" strokeDasharray="3 3" />
                        <line x1="480" y1="194" x2="350" y2="48" className="stroke-slate-700 stroke-1 stroke-dasharray[2]" strokeDasharray="3 3" />

                        {/* Edge to Fog Paths (Solid LAN lines) */}
                        <line x1="120" y1="194" x2="250" y2="138" className="stroke-emerald-400/50 stroke-1.5" />
                        <line x1="300" y1="194" x2="300" y2="138" className="stroke-emerald-400/50 stroke-1.5" />
                        <line x1="480" y1="194" x2="350" y2="138" className="stroke-emerald-400/50 stroke-1.5" />

                        {/* Fog to Cloud WAN Path */}
                        <line x1="300" y1="102" x2="300" y2="48" className="stroke-blue-400 stroke-2" />

                        {/* Animated Packets */}
                        {/* LAN Packets traveling Edge -> Fog */}
                        {(() => {
                          const pct = packetTick / 100;
                          const p1x = 120 + (250 - 120) * pct;
                          const p1y = 194 + (138 - 194) * pct;
                          const p2x = 300;
                          const p2y = 194 + (138 - 194) * pct;
                          const p3x = 480 + (350 - 480) * pct;
                          const p3y = 194 + (138 - 194) * pct;

                          return (
                            <g>
                              <circle cx={p1x} cy={p1y} r="3" className="fill-emerald-400 animate-pulse" />
                              <circle cx={p2x} cy={p2y} r="3" className="fill-emerald-400 animate-pulse" />
                              <circle cx={p3x} cy={p3y} r="3" className="fill-emerald-400 animate-pulse" />
                            </g>
                          );
                        })()}

                        {/* WAN Packets traveling Fog -> Cloud (representing summarized payload) */}
                        {(() => {
                          const pct = (packetTick + 50) % 100 / 100;
                          const px = 300;
                          const py = 102 + (48 - 102) * pct;
                          return (
                            <circle cx={px} cy={py} r="4.5" className="fill-blue-400" />
                          );
                        })()}
                      </svg>
                      
                      <div className="text-[10px] text-slate-500 font-mono text-center max-w-md leading-relaxed mt-2 border-t border-navy-light pt-2">
                        <b className="text-emerald-accent">Fog Gateway</b> ingests rapid raw bursts locally, processes them (averaging & filtration), and sends a single <b>Consolidated Payload (2 KB)</b> over the WAN link to prevent congestion.
                      </div>
                    </div>
                  </div>

                  {/* Latency and Bandwidth Bar Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Latency Comparison Bar Chart */}
                    <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4">
                      <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                        Latency Breakdown (Lower is Better)
                      </h4>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={latencyBarData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '10px' }} />
                            <YAxis stroke="#64748b" style={{ fontSize: '10px' }} label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', offset: 10, fill: '#94a3b8', fontSize: 10 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                            <Bar dataKey="Total Latency (ms)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Bandwidth Consumption Bar Chart */}
                    <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4">
                      <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                        WAN Bandwidth Consumption (Lower is Better)
                      </h4>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={latencyBarData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '10px' }} />
                            <YAxis stroke="#64748b" style={{ fontSize: '10px' }} label={{ value: 'WAN Rate (MB/s)', angle: -90, position: 'insideLeft', offset: 10, fill: '#94a3b8', fontSize: 10 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                            <Bar dataKey="Bandwidth Consumption" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 3: PREDICTIVE MACHINE HEALTH */}
          {/* ========================================== */}
          {activeTab === 'maintenance' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Asset Health Overview Board */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <div className="bg-navy-card border border-navy-light/60 p-5 rounded-2xl font-mono">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Asset Status</div>
                  <div className={`text-xl font-bold ${analytics.status.includes('CRITICAL') ? 'text-rose-400 animate-pulse' : 'text-emerald-accent'}`}>
                    {analytics.status}
                  </div>
                </div>

                <div className="bg-navy-card border border-navy-light/60 p-5 rounded-2xl font-mono">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Health Indicator Score</div>
                  <div className="text-3xl font-black text-white">{analytics.healthScore}%</div>
                </div>

                <div className="bg-navy-card border border-navy-light/60 p-5 rounded-2xl font-mono">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Estimated RUL</div>
                  <div className="text-3xl font-black text-amber-400">
                    {analytics.slope > 0 ? `${analytics.rul} Hrs` : 'N/A'}
                  </div>
                </div>

                <div className="bg-navy-card border border-navy-light/60 p-5 rounded-2xl font-mono">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Regression Fit Quality (R²)</div>
                  <div className="text-3xl font-black text-blue-400">{analytics.r2}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Inputs & Historical Dataset Controls */}
                <div className="lg:col-span-5 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                  <div>
                    <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono border-b border-navy-light/60 pb-3 flex items-center gap-2">
                      <Binary className="h-4.5 w-4.5 text-emerald-accent" />
                      Historical Operating Grid
                    </h3>
                  </div>

                  <div className="space-y-6 font-mono text-xs">
                    {/* Select Preset Sample Data */}
                    <div className="space-y-2">
                      <label className="text-slate-400 font-bold uppercase block tracking-wider text-[10px]">
                        Select Equipment Spec
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => loadPreset('spindle')}
                          className="px-2 py-2 bg-navy-dark border border-navy-light/60 hover:bg-navy-light/40 rounded-xl text-center text-[10px] font-bold text-white uppercase cursor-pointer"
                        >
                          CNC Spindle
                        </button>
                        <button
                          onClick={() => loadPreset('fan')}
                          className="px-2 py-2 bg-navy-dark border border-navy-light/60 hover:bg-navy-light/40 rounded-xl text-center text-[10px] font-bold text-white uppercase cursor-pointer"
                        >
                          Draft Fan
                        </button>
                        <button
                          onClick={() => loadPreset('conveyor')}
                          className="px-2 py-2 bg-navy-dark border border-navy-light/60 hover:bg-navy-light/40 rounded-xl text-center text-[10px] font-bold text-white uppercase cursor-pointer"
                        >
                          Pump Motor
                        </button>
                      </div>
                    </div>

                    {/* Operational Variables */}
                    <div className="space-y-4 border-t border-navy-light/40 pt-4">
                      {/* Current operating hours */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400 uppercase font-bold">Current Operating Hours</span>
                          <span className="text-emerald-accent font-bold">{currentHours} Hrs</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={analytics.failHours > 0 ? analytics.failHours : 8000}
                          value={currentHours}
                          onChange={e => setCurrentHours(parseInt(e.target.value))}
                          className="w-full accent-emerald-accent"
                        />
                      </div>

                      {/* Failure vibration threshold */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400 uppercase font-bold">Failure Limit Threshold</span>
                          <span className="text-rose-400 font-bold">{failureThreshold.toFixed(1)} mm/s</span>
                        </div>
                        <input
                          type="range"
                          min="3.0"
                          max="15.0"
                          step="0.5"
                          value={failureThreshold}
                          onChange={e => setFailureThreshold(parseFloat(e.target.value))}
                          className="w-full accent-rose-500"
                        />
                        <span className="text-[10px] text-slate-500 block">
                          ISO 10816 machinery standard warning threshold for severe vibration.
                        </span>
                      </div>
                    </div>

                    {/* Add Custom Point Form */}
                    <form onSubmit={handleAddPoint} className="space-y-3 border-t border-navy-light/40 pt-4">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Add New Log Entry
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] text-slate-500 uppercase block mb-1">Runtime (Hrs)</label>
                          <input
                            type="number"
                            placeholder="e.g. 1500"
                            value={newHours}
                            onChange={e => setNewHours(e.target.value)}
                            className="w-full bg-navy-dark border border-navy-light rounded-xl px-2 py-1.5 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 uppercase block mb-1">Vibration (mm/s)</label>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="e.g. 2.1"
                            value={newVibe}
                            onChange={e => setNewVibe(e.target.value)}
                            className="w-full bg-navy-dark border border-navy-light rounded-xl px-2 py-1.5 text-white text-xs"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-1.5 bg-emerald-accent text-navy-dark hover:bg-emerald-400 font-mono font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Plus className="h-4 w-4" /> Add Record
                      </button>
                    </form>

                    {/* Data Table */}
                    <div className="border-t border-navy-light/40 pt-4 space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                        <span>Log Registry ({dataPoints.length} points)</span>
                        <button
                          type="button"
                          onClick={clearAllData}
                          className="text-rose-400 hover:text-rose-300 font-bold uppercase cursor-pointer"
                        >
                          Clear All
                        </button>
                      </div>

                      <div className="max-h-48 overflow-y-auto border border-navy-light/50 rounded-xl bg-navy-dark/40 divide-y divide-navy-light/40">
                        {dataPoints.length === 0 ? (
                          <div className="py-8 text-center text-slate-500 text-[11px]">
                            No history. Add a point above or load a preset.
                          </div>
                        ) : (
                          dataPoints.map(pt => (
                            <div key={pt.id} className="flex justify-between items-center px-3 py-2 text-[11px]">
                              <span>Runtime: <b className="text-white">{pt.hours} Hrs</b></span>
                              <div className="flex items-center gap-3">
                                <span>Vibration: <b className="text-amber-400">{pt.vibration.toFixed(1)} mm/s</b></span>
                                <button
                                  type="button"
                                  onClick={() => deleteDataPoint(pt.id)}
                                  className="text-slate-500 hover:text-rose-400 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ML Plot & Formula Analysis */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Scatter plot with extrapolated trend line */}
                  <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                      Regression Curve Analysis & failure extrapolation
                    </h4>
                    
                    <div className="h-80 w-full relative">
                      {dataPoints.length < 2 ? (
                        <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                          Insufficient data to perform linear regression. Minimum 2 points required.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{ top: 15, right: 15, left: -25, bottom: 15 }}>
                            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                            <XAxis
                              type="number"
                              dataKey="hours"
                              stroke="#64748b"
                              style={{ fontSize: '10px' }}
                              label={{ value: 'Operating Hours (Hrs)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }}
                            />
                            <YAxis
                              type="number"
                              dataKey="vibration"
                              stroke="#64748b"
                              style={{ fontSize: '10px' }}
                              label={{ value: 'Spindle Vibration (mm/s)', angle: -90, position: 'insideLeft', offset: 10, fill: '#94a3b8', fontSize: 10 }}
                            />
                            
                            {/* Failure limit boundary */}
                            <ReferenceLine
                              y={failureThreshold}
                              stroke="#ef4444"
                              strokeWidth={1.5}
                              strokeDasharray="4 4"
                              label={{ value: 'CRITICAL FAILURE LIMIT', fill: '#f87171', fontSize: 8, position: 'top' }}
                            />

                            {/* Current Hours reference line */}
                            <ReferenceLine
                              x={currentHours}
                              stroke="#10b981"
                              strokeWidth={1.5}
                              strokeDasharray="2 2"
                              label={{ value: 'CURRENT', fill: '#34d399', fontSize: 8, position: 'insideBottomRight' }}
                            />

                            {/* Raw Data Scatter Points */}
                            <Scatter
                              name="Log Points"
                              data={dataPoints}
                              fill="#10b981"
                              shape="circle"
                            />

                            {/* Predictive Regression Line */}
                            <Scatter
                              name="Regression Trend"
                              data={analytics.regressionLine}
                              line={{ stroke: '#fbbf24', strokeWidth: 2 }}
                              shape={() => null}
                            />

                            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                          </ScatterChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Math block */}
                  <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider border-b border-navy-light pb-2">
                      Regression Math & Residual Fit
                    </h4>
                    <div className="font-mono text-xs text-slate-300 space-y-3 leading-relaxed">
                      <p>
                        The trendline equation is derived via Ordinary Least Squares (OLS) linear optimization:
                      </p>
                      <div className="bg-navy-dark/70 border border-navy-light p-3 rounded-xl text-center font-bold text-white">
                        Vibration (y) = {analytics.slope} · Operating Hours (x) + {analytics.intercept}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-400 pt-1">
                        <div>
                          • Slope (m): <b className="text-white">{analytics.slope}</b> mm/s per operating hour.
                        </div>
                        <div>
                          • Intercept (c): <b className="text-white">{analytics.intercept}</b> mm/s initial value.
                        </div>
                        <div>
                          • R² Fit: <b className="text-white">{analytics.r2}</b> (closer to 1.0 indicates perfect linear fit).
                        </div>
                        <div>
                          • Est. Failure Point: <b className="text-white">{analytics.failHours} Hrs</b>.
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
    </div>
  );
}
