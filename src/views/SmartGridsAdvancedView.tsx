import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Cpu,
  Activity,
  Sliders,
  Play,
  RotateCcw,
  Network,
  Database,
  Server,
  Terminal,
  FileText,
  BatteryCharging,
  Sun,
  Zap,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Compass,
  ArrowRight,
  Shield,
  Clock,
  Sparkles
} from 'lucide-react';
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

import { useAMIProtocol, AMIProtocol, AMINetworkLayer } from '../hooks/useAMIProtocol';
import { useDemandResponse } from '../hooks/useDemandResponse';
import { useOptimalPowerFlow } from '../hooks/useOptimalPowerFlow';

export default function SmartGridsAdvancedView() {
  const [activeTab, setActiveTab] = useState<'ami' | 'der' | 'opf'>('ami');

  // ==========================================
  // TAB 1: AMI PROTOCOL SIMULATION
  // ==========================================
  const {
    protocol,
    setProtocol,
    networkLayer,
    setNetworkLayer,
    transmissionState,
    triggerTransmission,
    resetSimulation,
    packetDetails,
    latencyMs,
    errorRate,
    payload
  } = useAMIProtocol();

  // Helper coordinate variables for packet animation on SVG map
  // Positions:
  // Appliance: (x: 15%, y: 50%)
  // Smart Meter: (x: 42%, y: 50%)
  // Concentrator: (x: 68%, y: 50%)
  // Utility Server: (x: 90%, y: 50%)
  const getPacketPosition = () => {
    switch (transmissionState) {
      case 'idle':
        return { cx: '15%', cy: '50%', opacity: 0 };
      case 'appliance_to_meter':
        return { cx: '28.5%', cy: '50%', opacity: 1, label: 'HAN Stream' };
      case 'meter_to_concentrator':
        return { cx: '55%', cy: '50%', opacity: 1, label: 'NAN Packet' };
      case 'concentrator_to_server':
        return { cx: '79%', cy: '50%', opacity: 1, label: 'WAN Payload' };
      case 'complete':
        return { cx: '90%', cy: '50%', opacity: 0 };
    }
  };

  const packetPos = getPacketPosition();

  // ==========================================
  // TAB 2: DER DEMAND RESPONSE
  // ==========================================
  const {
    peakPrice,
    setPeakPrice,
    batteryAge,
    setBatteryAge,
    assets,
    setAssets,
    batteryStats,
    hourlyData,
    stats: derStats,
    drThreshold
  } = useDemandResponse();

  // ==========================================
  // TAB 3: GIS-BASED OPTIMAL POWER FLOW
  // ==========================================
  const {
    loadNode2,
    setLoadNode2,
    loadNode3,
    setLoadNode3,
    loadNode4,
    setLoadNode4,
    nodes,
    opfResult
  } = useOptimalPowerFlow();

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 pb-12 font-sans selection:bg-teal-500/30 selection:text-white">
      {/* Breadcrumb Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO ACADEMIC CATALOG
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6 space-y-8">
        
        {/* Course Banner */}
        <div className="relative rounded-2xl border border-teal-500/20 bg-teal-950/10 p-6 md:p-8 overflow-hidden">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-teal-500/5 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs tracking-wider uppercase mb-2 font-mono">
                <Sparkles className="h-4 w-4 animate-pulse" /> EEE 4247 Advanced Smart Grid Engineering
              </div>
              <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
                Smart Grid Operations & <span className="text-teal-400">Demand Management</span>
              </h1>
              <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
                Design modern power grids. Model multi-layered Advanced Metering Infrastructure (AMI) payloads, evaluate Home Battery electrochemical degradation metrics under peak demand response load-shaping, and calculate GIS-based optimal power flow (OPF) to avoid line thermal congestions.
              </p>
            </div>
            
            <div className="bg-[#0e1424]/90 border border-slate-800 px-4 py-3 rounded-xl flex items-center gap-3 shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 border border-teal-500/20">
                <Cpu className="h-5 w-5 text-teal-400" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-500 tracking-wider uppercase">DECISION CORE</div>
                <div className="text-xs font-mono font-bold text-teal-400">AMI & DER SOLVER ENGAGED</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-1 border-b border-slate-800 pb-px">
          <button
            onClick={() => setActiveTab('ami')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'ami'
                ? 'border-teal-400 text-teal-400 bg-teal-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
            }`}
          >
            <Network className="h-4 w-4" />
            1. AMI Protocol Flow
          </button>
          <button
            onClick={() => setActiveTab('der')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'der'
                ? 'border-teal-400 text-teal-400 bg-teal-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
            }`}
          >
            <BatteryCharging className="h-4 w-4" />
            2. DER Load Shaping
          </button>
          <button
            onClick={() => setActiveTab('opf')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'opf'
                ? 'border-teal-400 text-teal-400 bg-teal-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
            }`}
          >
            <Compass className="h-4 w-4" />
            3. GIS-Based OPF Routing
          </button>
        </div>

        {/* Main Interface */}
        <div className="space-y-6">

          {/* ========================================== */}
          {/* TAB 1: AMI & PROTOCOL FLOW SIMULATOR */}
          {/* ========================================== */}
          {activeTab === 'ami' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Parameters Column */}
              <div className="lg:col-span-4 bg-[#0c1121] border border-slate-800/80 p-6 rounded-2xl space-y-6">
                <div>
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Sliders className="h-4.5 w-4.5 text-teal-400" />
                    AMI Config Parameters
                  </h3>
                </div>

                <div className="space-y-5 font-mono text-xs">
                  {/* Protocol Selector */}
                  <div className="space-y-2">
                    <label className="text-slate-400 uppercase font-bold text-[10px] tracking-wide block">Communication Protocol</label>
                    <select
                      value={protocol}
                      onChange={(e) => setProtocol(e.target.value as AMIProtocol)}
                      className="w-full bg-[#080d19] border border-slate-700 rounded-lg py-2 px-3 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-teal-400 focus:outline-none"
                    >
                      <option value="modbus">Modbus RTU over TCP</option>
                      <option value="dnp3">DNP3 (IEEE 1815)</option>
                      <option value="iec61850">IEC 61850 (MMS Map)</option>
                    </select>
                    <span className="text-[10px] text-slate-500 leading-normal block">
                      {protocol === 'modbus' && 'Classic industrial protocol using register map configurations.'}
                      {protocol === 'dnp3' && 'Robust SCADA telemetry using class-based analog/binary datasets.'}
                      {protocol === 'iec61850' && 'Substation object-oriented logical nodes and detailed quality bits.'}
                    </span>
                  </div>

                  {/* Network Layer */}
                  <div className="space-y-2">
                    <label className="text-slate-400 uppercase font-bold text-[10px] tracking-wide block">Physical Network Layer</label>
                    <div className="grid grid-cols-3 gap-1 bg-[#080d19] p-1 border border-slate-800 rounded-lg">
                      {(['han', 'nan', 'wan'] as AMINetworkLayer[]).map((layer) => (
                        <button
                          key={layer}
                          onClick={() => setNetworkLayer(layer)}
                          className={`py-1.5 rounded text-center text-[10px] font-bold uppercase transition-all ${
                            networkLayer === layer
                              ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {layer === 'han' && 'HAN'}
                          {layer === 'nan' && 'NAN'}
                          {layer === 'wan' && 'WAN'}
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-500 leading-normal block">
                      {networkLayer === 'han' && 'Home Area Network: Zigbee/Bluetooth (Short Range, 2.4GHz)'}
                      {networkLayer === 'nan' && 'Neighborhood Area: WiMAX/PLC Mesh (Medium Range Grid)'}
                      {networkLayer === 'wan' && 'Wide Area Network: Cellular/Fiber (High Speed Backbone)'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-slate-800 flex gap-2">
                    <button
                      onClick={triggerTransmission}
                      disabled={transmissionState !== 'idle' && transmissionState !== 'complete'}
                      className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-400 text-[#070a13] font-bold font-mono text-[11px] rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                    >
                      <Play className="h-3.5 w-3.5 fill-[#070a13]" />
                      Request Meter Data
                    </button>
                    <button
                      onClick={resetSimulation}
                      className="px-3 py-2.5 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 rounded-lg flex items-center justify-center transition-all"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Layer Statistics Panel */}
                <div className="bg-[#080d19] border border-slate-800 p-4 rounded-xl font-mono space-y-3">
                  <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Network Quality Metrics</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] text-slate-400 block">BASE RTT LATENCY</span>
                      <span className="text-sm font-bold text-teal-400">{latencyMs} ms</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">ERROR RATE (BER)</span>
                      <span className="text-sm font-bold text-rose-400">{errorRate}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulation Visuals Column */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Visual SVG Network Map */}
                <div className="bg-[#0c1121] border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                      <Network className="h-4 w-4 text-teal-400" />
                      AMI Multi-Layer Communications Map
                    </span>
                    <span className="text-[10px] font-mono bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded border border-teal-500/20">
                      STATE: {transmissionState.toUpperCase()}
                    </span>
                  </div>

                  {/* SVG Map Layout */}
                  <div className="relative h-44 bg-[#080d19]/80 border border-slate-800 rounded-xl overflow-hidden flex items-center">
                    
                    {/* SVG Connections and Lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {/* Connection Line 1: HAN */}
                      <line
                        x1="15%" y1="50%" x2="42%" y2="50%"
                        stroke={transmissionState === 'appliance_to_meter' ? '#2dd4bf' : '#1e293b'}
                        strokeWidth="2.5"
                        strokeDasharray="5 5"
                        className={transmissionState === 'appliance_to_meter' ? 'animate-pulse' : ''}
                      />
                      {/* Connection Line 2: NAN */}
                      <line
                        x1="42%" y1="50%" x2="68%" y2="50%"
                        stroke={transmissionState === 'meter_to_concentrator' ? '#2dd4bf' : '#1e293b'}
                        strokeWidth="2.5"
                        strokeDasharray="5 5"
                        className={transmissionState === 'meter_to_concentrator' ? 'animate-pulse' : ''}
                      />
                      {/* Connection Line 3: WAN */}
                      <line
                        x1="68%" y1="50%" x2="90%" y2="50%"
                        stroke={transmissionState === 'concentrator_to_server' ? '#2dd4bf' : '#1e293b'}
                        strokeWidth="2.5"
                        strokeDasharray="5 5"
                        className={transmissionState === 'concentrator_to_server' ? 'animate-pulse' : ''}
                      />

                      {/* Moving Packet Dot */}
                      {transmissionState !== 'idle' && transmissionState !== 'complete' && (
                        <circle
                          cx={packetPos.cx}
                          cy={packetPos.cy}
                          r="6"
                          fill="#2dd4bf"
                          className="shadow-[0_0_15px_#2dd4bf] animate-bounce"
                        />
                      )}
                    </svg>

                    {/* Nodes positioned absolutely over the SVG lines */}
                    <div className="w-full flex justify-between px-[8%] relative z-10 font-mono text-xs">
                      
                      {/* Node A: Home Appliance */}
                      <div className="flex flex-col items-center space-y-1.5">
                        <div className={`h-11 w-11 rounded-full flex items-center justify-center border transition-all ${
                          transmissionState === 'appliance_to_meter'
                            ? 'bg-teal-500/10 border-teal-400 shadow-[0_0_10px_#2dd4bf33]'
                            : 'bg-[#0f172a] border-slate-800'
                        }`}>
                          <Zap className={`h-5 w-5 ${transmissionState === 'appliance_to_meter' ? 'text-teal-400' : 'text-slate-500'}`} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">HAN Node</span>
                        <span className="text-[8px] text-slate-600">Smart Dryer</span>
                      </div>

                      {/* Node B: Smart Meter */}
                      <div className="flex flex-col items-center space-y-1.5">
                        <div className={`h-11 w-11 rounded-full flex items-center justify-center border transition-all ${
                          transmissionState === 'meter_to_concentrator'
                            ? 'bg-teal-500/10 border-teal-400 shadow-[0_0_10px_#2dd4bf33]'
                            : 'bg-[#0f172a] border-slate-800'
                        }`}>
                          <Database className={`h-5 w-5 ${transmissionState === 'meter_to_concentrator' ? 'text-teal-400' : 'text-slate-500'}`} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Smart Meter</span>
                        <span className="text-[8px] text-slate-600">NAN Boundary</span>
                      </div>

                      {/* Node C: Data Concentrator */}
                      <div className="flex flex-col items-center space-y-1.5">
                        <div className={`h-11 w-11 rounded-full flex items-center justify-center border transition-all ${
                          transmissionState === 'concentrator_to_server'
                            ? 'bg-teal-500/10 border-teal-400 shadow-[0_0_10px_#2dd4bf33]'
                            : 'bg-[#0f172a] border-slate-800'
                        }`}>
                          <Server className={`h-5 w-5 ${transmissionState === 'concentrator_to_server' ? 'text-teal-400' : 'text-slate-500'}`} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Concentrator</span>
                        <span className="text-[8px] text-slate-600">Aggregation hub</span>
                      </div>

                      {/* Node D: Central Server */}
                      <div className="flex flex-col items-center space-y-1.5">
                        <div className={`h-11 w-11 rounded-full flex items-center justify-center border transition-all ${
                          transmissionState === 'complete'
                            ? 'bg-teal-500/20 border-emerald-400 shadow-[0_0_15px_#10b98144]'
                            : 'bg-[#0f172a] border-slate-800'
                        }`}>
                          <Server className={`h-5 w-5 ${transmissionState === 'complete' ? 'text-emerald-400' : 'text-slate-500'}`} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Utility MDMS</span>
                        <span className="text-[8px] text-slate-600">Secure WAN Central</span>
                      </div>

                    </div>
                  </div>

                  {/* Packet details live console ticker */}
                  <div className="mt-4 bg-[#080d19] border border-slate-800 rounded-xl px-4 py-3 font-mono text-[10px] flex items-start gap-2.5">
                    <Terminal className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-teal-400 font-bold block mb-0.5">AMI CONSOLE LINK TACTICAL FEED</span>
                      <span className="text-slate-300 leading-normal block">{packetDetails}</span>
                    </div>
                  </div>
                </div>

                {/* Packet payload JSON side panel parser */}
                <div className="bg-[#0c1121] border border-slate-800 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                      <FileText className="h-4 w-4 text-teal-400" />
                      Dynamic Frame Payload Parser ({protocol.toUpperCase()})
                    </h4>
                    <span className="text-[9px] font-mono text-slate-500">MAPPED STRUCT SCHEMA</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px]">
                    
                    {/* Header Structure Panel */}
                    <div className="space-y-2">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">FRAME HEADER METADATA</span>
                      <div className="bg-[#080d19] border border-slate-800/60 p-4 rounded-xl space-y-1.5 h-60 overflow-y-auto">
                        {Object.entries(payload.header).map(([key, val]) => (
                          <div key={key} className="flex justify-between border-b border-slate-900 pb-1.5 last:border-0 last:pb-0">
                            <span className="text-slate-400 font-medium">{key}:</span>
                            <span className="text-slate-200 font-bold text-right">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Register Payload Data Panel */}
                    <div className="space-y-2">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">DEVICE REGISTER & DATASET MAP</span>
                      <div className="bg-[#080d19] border border-slate-800/60 p-4 rounded-xl h-60 overflow-y-auto">
                        <pre className="text-teal-300 whitespace-pre-wrap leading-relaxed text-[10px]">
                          {JSON.stringify(payload.payload, null, 2)}
                        </pre>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 2: DER LOAD SHAPING & DEMAND RESPONSE */}
          {/* ========================================== */}
          {activeTab === 'der' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Controls Column */}
              <div className="lg:col-span-4 bg-[#0c1121] border border-slate-800/80 p-6 rounded-2xl space-y-6">
                <div>
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Sliders className="h-4.5 w-4.5 text-teal-400" />
                    DER Configuration
                  </h3>
                </div>

                <div className="space-y-6 font-mono text-xs">
                  {/* Dynamic pricing simulation slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wide">Real-time Peak Price</span>
                      <span className="text-teal-400 font-bold">${peakPrice.toFixed(2)} / kWh</span>
                    </div>
                    <input
                      type="range"
                      min="0.10"
                      max="1.20"
                      step="0.05"
                      value={peakPrice}
                      onChange={(e) => setPeakPrice(parseFloat(e.target.value))}
                      className="w-full accent-teal-400 bg-slate-800 rounded-lg appearance-none h-1.5"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>Cheap ($0.10)</span>
                      <span className="text-rose-400 font-semibold">DR Active (&gt;$0.40)</span>
                      <span>Spike ($1.20)</span>
                    </div>
                  </div>

                  {/* Battery Aging Slider */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wide">Battery Bank Age</span>
                      <span className="text-teal-400 font-bold">{batteryAge} Years</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="1"
                      value={batteryAge}
                      onChange={(e) => setBatteryAge(parseInt(e.target.value))}
                      className="w-full accent-teal-400 bg-slate-800 rounded-lg appearance-none h-1.5"
                    />
                    <span className="text-[10px] text-slate-500 leading-normal block">
                      Models dynamic capacity loss and internal resistance over 5-year chemical lifecycle.
                    </span>
                  </div>

                  {/* Asset Toggles */}
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <label className="text-slate-400 uppercase font-bold text-[10px] tracking-wide block">Active Grid Assets</label>
                    <div className="space-y-2 font-sans">
                      
                      {/* Solar */}
                      <label className="flex items-center justify-between bg-[#080d19] border border-slate-800 p-3 rounded-xl cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Sun className={`h-4.5 w-4.5 ${assets.solarPV ? 'text-amber-400' : 'text-slate-500'}`} />
                          <div>
                            <div className="text-xs font-semibold text-slate-200">Solar PV Arrays</div>
                            <div className="text-[9px] font-mono text-slate-500">5.0 kW peak panel installation</div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={assets.solarPV}
                          onChange={(e) => setAssets(prev => ({ ...prev, solarPV: e.target.checked }))}
                          className="w-4 h-4 rounded text-teal-500 focus:ring-teal-400 accent-teal-400 bg-slate-900 border-slate-800 cursor-pointer"
                        />
                      </label>

                      {/* EV Charger */}
                      <label className="flex items-center justify-between bg-[#080d19] border border-slate-800 p-3 rounded-xl cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Zap className={`h-4.5 w-4.5 ${assets.evCharger ? 'text-teal-400' : 'text-slate-500'}`} />
                          <div>
                            <div className="text-xs font-semibold text-slate-200">Level-2 EV Charger</div>
                            <div className="text-[9px] font-mono text-slate-500">7.0 kW demand (Throttled under DR)</div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={assets.evCharger}
                          onChange={(e) => setAssets(prev => ({ ...prev, evCharger: e.target.checked }))}
                          className="w-4 h-4 rounded text-teal-500 focus:ring-teal-400 accent-teal-400 bg-slate-900 border-slate-800 cursor-pointer"
                        />
                      </label>

                      {/* Home Battery */}
                      <label className="flex items-center justify-between bg-[#080d19] border border-slate-800 p-3 rounded-xl cursor-pointer">
                        <div className="flex items-center gap-2">
                          <BatteryCharging className={`h-4.5 w-4.5 ${assets.homeBattery ? 'text-emerald-400' : 'text-slate-500'}`} />
                          <div>
                            <div className="text-xs font-semibold text-slate-200">12V 130Ah Battery</div>
                            <div className="text-[9px] font-mono text-slate-500">Storage Backup (Self-consumption)</div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={assets.homeBattery}
                          onChange={(e) => setAssets(prev => ({ ...prev, homeBattery: e.target.checked }))}
                          className="w-4 h-4 rounded text-teal-500 focus:ring-teal-400 accent-teal-400 bg-slate-900 border-slate-800 cursor-pointer"
                        />
                      </label>

                    </div>
                  </div>
                </div>
              </div>

              {/* Outputs and Chart Column */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Metrics Readouts */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {/* Peak Shaved */}
                  <div className="bg-[#0c1121] border border-slate-800 p-4 rounded-xl font-mono">
                    <div className="text-[9px] text-slate-400 uppercase font-bold mb-1">Peak Load Shaved</div>
                    <div className="text-lg font-black text-emerald-400">{derStats.peakReductionKW} kW</div>
                    <span className="text-[8px] text-slate-500 leading-none">Avoids expensive utility grid capacity fees</span>
                  </div>

                  {/* Net Cost Without DR */}
                  <div className="bg-[#0c1121] border border-slate-800 p-4 rounded-xl font-mono">
                    <div className="text-[9px] text-slate-400 uppercase font-bold mb-1">Uncontrolled Cost</div>
                    <div className="text-lg font-black text-rose-400">${derStats.baseCost}</div>
                    <span className="text-[8px] text-slate-500 leading-none">Flat dispatch daily grid expense</span>
                  </div>

                  {/* Net Cost With DR */}
                  <div className="bg-[#0c1121] border border-slate-800 p-4 rounded-xl font-mono">
                    <div className="text-[9px] text-slate-400 uppercase font-bold mb-1">Optimized Cost</div>
                    <div className="text-lg font-black text-teal-400">${derStats.drCost}</div>
                    <span className="text-[8px] text-slate-500 leading-none">With active DER peak-load management</span>
                  </div>

                  {/* Net Monetary Savings */}
                  <div className="bg-[#0c1121] border border-slate-800 p-4 rounded-xl font-mono">
                    <div className="text-[9px] text-slate-400 uppercase font-bold mb-1">DR Net Savings</div>
                    <div className="text-lg font-black text-yellow-400">${derStats.costSavings} / day</div>
                    <span className="text-[8px] text-slate-500 leading-none">Estimated annual: ${(derStats.costSavings * 365).toFixed(0)}</span>
                  </div>
                </div>

                {/* Recharts AreaChart (24-Hour Load Curve) */}
                <div className="bg-[#0c1121] border border-slate-800 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                      <Activity className="h-4 w-4 text-teal-400" />
                      Residential 24-Hour Energy Mix Profile
                    </h4>
                    {peakPrice >= drThreshold && (
                      <span className="text-[9px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded animate-pulse">
                        DEMAND RESPONSE ACTIVE (Evening Price Spike)
                      </span>
                    )}
                  </div>

                  <div className="h-72 w-full font-mono text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                          dataKey="hour"
                          stroke="#64748b"
                        />
                        <YAxis
                          stroke="#64748b"
                          label={{ value: 'Real-Time Power (kW)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10, offset: 15 }}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0c1121', borderColor: '#1e293b', color: '#fff', fontSize: '11px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        
                        {/* Area layers */}
                        <Area
                          type="monotone"
                          dataKey="gridImport"
                          stackId="1"
                          stroke="#2563eb"
                          fill="#1d4ed8"
                          fillOpacity={0.4}
                          name="Grid Import"
                        />
                        <Area
                          type="monotone"
                          dataKey="solarGen"
                          stackId="1"
                          stroke="#f59e0b"
                          fill="#d97706"
                          fillOpacity={0.4}
                          name="Solar Self-Consumption"
                        />
                        <Area
                          type="monotone"
                          dataKey="batteryDischarge"
                          stackId="1"
                          stroke="#10b981"
                          fill="#059669"
                          fillOpacity={0.4}
                          name="Battery Discharge"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Battery Health Analysis Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Electrochemical stats */}
                  <div className="bg-[#0c1121] border border-slate-800 p-5 rounded-2xl space-y-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
                      <Shield className="h-4 w-4 text-emerald-400" />
                      5-Year Battery Electrochemical State
                    </span>
                    
                    <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                      <div className="bg-[#080d19] p-3 rounded-xl">
                        <span className="text-[8px] text-slate-500 block">STATE OF HEALTH (SoH)</span>
                        <span className="text-sm font-bold text-slate-200">{batteryStats.soh}%</span>
                      </div>
                      <div className="bg-[#080d19] p-3 rounded-xl">
                        <span className="text-[8px] text-slate-500 block">CURRENT STORAGE</span>
                        <span className="text-sm font-bold text-slate-200">{batteryStats.currentCapacityKWh} kWh</span>
                      </div>
                      <div className="bg-[#080d19] p-3 rounded-xl">
                        <span className="text-[8px] text-slate-500 block">ROUND-TRIP EFF.</span>
                        <span className="text-sm font-bold text-slate-200">{batteryStats.efficiencyPercent}%</span>
                      </div>
                      <div className="bg-[#080d19] p-3 rounded-xl">
                        <span className="text-[8px] text-slate-500 block">INTERNAL RESISTANCE</span>
                        <span className="text-sm font-bold text-slate-200">{batteryStats.internalResistance} mΩ</span>
                      </div>
                    </div>
                  </div>

                  {/* Operational explanation */}
                  <div className="bg-[#0c1121] border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-3 text-xs leading-relaxed">
                    <div>
                      <span className="font-mono font-bold text-teal-400 block mb-1">Demand Response Optimization Logic</span>
                      <p className="text-slate-400 font-sans">
                        When the grid dynamic price climbs above the critical threshold (${drThreshold.toFixed(2)}/kWh), the smart controller initiates peak load shaving. By throttling the Level-2 EV charger power and dispatching the home battery system during high cost windows, grid imports are minimized. 
                      </p>
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/20 px-4 py-3 rounded-xl font-mono text-[10px] flex items-center gap-3">
                      <Clock className="h-5 w-5 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-emerald-400 font-bold block">GRID ECO PERFORMANCE</span>
                        <span className="text-slate-300">Daily carbon emissions shaved: <b className="text-white">{derStats.co2ReductionKg} kg CO2</b></span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 3: GIS-BASED OPTIMAL POWER FLOW (OPF) */}
          {/* ========================================== */}
          {activeTab === 'opf' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Sliders and Metrics Column */}
              <div className="lg:col-span-4 bg-[#0c1121] border border-slate-800/80 p-6 rounded-2xl space-y-6">
                <div>
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Sliders className="h-4.5 w-4.5 text-teal-400" />
                    Microgrid Bus Loads
                  </h3>
                </div>

                {/* Node loads input */}
                <div className="space-y-5 font-mono text-xs">
                  {/* Node 2 Load */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase font-bold text-[10px]">Node 2 (Industrial) Load</span>
                      <span className="text-teal-400 font-bold">{loadNode2} MW</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={loadNode2}
                      onChange={(e) => setLoadNode2(parseInt(e.target.value))}
                      className="w-full accent-teal-400 bg-slate-800 rounded-lg appearance-none h-1.5"
                    />
                  </div>

                  {/* Node 3 Load */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase font-bold text-[10px]">Node 3 (Residential) Load</span>
                      <span className="text-teal-400 font-bold">{loadNode3} MW</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      step="1"
                      value={loadNode3}
                      onChange={(e) => setLoadNode3(parseInt(e.target.value))}
                      className="w-full accent-teal-400 bg-slate-800 rounded-lg appearance-none h-1.5"
                    />
                  </div>

                  {/* Node 4 Load */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase font-bold text-[10px]">Node 4 (Hospital) Load</span>
                      <span className="text-teal-400 font-bold">{loadNode4} MW</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={loadNode4}
                      onChange={(e) => setLoadNode4(parseInt(e.target.value))}
                      className="w-full accent-teal-400 bg-slate-800 rounded-lg appearance-none h-1.5"
                    />
                  </div>
                </div>

                {/* OPF Economic & Security Readout */}
                <div className="bg-[#080d19] border border-slate-800 p-5 rounded-xl font-mono space-y-4">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">OPF Optimizer Results</span>
                  
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b border-slate-900 pb-2">
                      <span className="text-slate-400">Total System Demand:</span>
                      <span className="text-slate-200 font-bold">{opfResult.metrics.totalLoad} MW</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-2">
                      <span className="text-slate-400">Total Generation Cost:</span>
                      <span className="text-teal-400 font-bold">${opfResult.metrics.totalCost} / hr</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-2">
                      <span className="text-slate-400">Average Bus LMP:</span>
                      <span className="text-slate-200 font-bold">${opfResult.metrics.avgCostPerMWh} / MWh</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Security Status:</span>
                      {opfResult.metrics.isCongested ? (
                        <span className="text-rose-400 font-bold flex items-center gap-1 uppercase text-[10px] bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          <AlertTriangle className="h-3 w-3" />
                          CONGESTED
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold uppercase text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          NORMAL (SECURE)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* GIS Interactive Visualizer Column */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Visualizer Map container */}
                <div className="bg-[#0c1121] border border-slate-800 p-6 rounded-2xl space-y-4 relative">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                      <Compass className="h-4 w-4 text-teal-400" />
                      Dynamic GIS Power Routing & Congestion Map
                    </h4>
                    <span className="text-[9px] font-mono text-slate-500">IEEE 4-BUS TRANSMISSION GRID</span>
                  </div>

                  {/* 2D Grid map container using SVG */}
                  <div className="relative h-96 bg-[#080d19] border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center">
                    
                    {/* SVG canvas for transmission links */}
                    <svg className="absolute inset-0 w-full h-full">
                      {/* Grid/background design dots */}
                      <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <circle cx="2" cy="2" r="1" fill="#1e293b" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />

                      {/* Transmission lines */}
                      {opfResult.branches.map((line) => {
                        const lineLoadingPercent = (Math.abs(line.flow) / line.capacity) * 100;
                        let strokeColor = '#10b981'; // green (Optimal)
                        let isPulsing = false;
                        if (lineLoadingPercent >= 100) {
                          strokeColor = '#f43f5e'; // red (Overloaded)
                          isPulsing = true;
                        } else if (lineLoadingPercent >= 80) {
                          strokeColor = '#eab308'; // yellow (Warning)
                        }

                        // Scale line thickness between 1.5px and 8px based on capacity used
                        const strokeWidth = Math.max(1.5, Math.min(8, 1.5 + (Math.abs(line.flow) / line.capacity) * 6));

                        return (
                          <g key={line.id}>
                            <line
                              x1={`${line.x1}%`}
                              y1={`${line.y1}%`}
                              x2={`${line.x2}%`}
                              y2={`${line.y2}%`}
                              stroke={strokeColor}
                              strokeWidth={strokeWidth}
                              className={isPulsing ? 'animate-pulse' : ''}
                            />
                            {/* Directional Flow Arrow */}
                            {Math.abs(line.flow) > 0.1 && (
                              <circle
                                r="4"
                                fill="#fff"
                                className="shadow-[0_0_8px_#fff]"
                              >
                                <animateMotion
                                  dur={`${Math.max(1, 5 - (Math.abs(line.flow) / line.capacity) * 4)}s`}
                                  repeatCount="indefinite"
                                  path={line.flow >= 0
                                    ? `M ${line.x1 * 0.01 * 800} ${line.y1 * 0.01 * 384} L ${line.x2 * 0.01 * 800} ${line.y2 * 0.01 * 384}`
                                    : `M ${line.x2 * 0.01 * 800} ${line.y2 * 0.01 * 384} L ${line.x1 * 0.01 * 800} ${line.y1 * 0.01 * 384}`
                                  }
                                />
                              </circle>
                            )}
                          </g>
                        );
                      })}
                    </svg>

                    {/* Nodes absolutely positioned over map coordinates */}
                    {nodes.map((node) => {
                      // Get calculated dispatch generation and load
                      let nodeGen = 0;
                      let nodeLoad = node.baseLoad;
                      if (node.id === '1') nodeGen = opfResult.dispatch.pg1;
                      if (node.id === '2') nodeGen = opfResult.dispatch.pg2;
                      if (node.id === '3') nodeGen = opfResult.dispatch.pg3;
                      if (node.id === '4') nodeGen = opfResult.dispatch.pg4;

                      return (
                        <div
                          key={node.id}
                          className="absolute -translate-x-1/2 -translate-y-1/2 font-mono text-[9px] p-2.5 bg-slate-900/90 border border-slate-700 rounded-xl shadow-lg w-44 space-y-1 z-20 hover:border-teal-500/50 transition-all cursor-default"
                          style={{ left: `${node.x}%`, top: `${node.y}%` }}
                        >
                          <div className="flex items-center gap-1 border-b border-slate-800 pb-1">
                            <MapPin className={`h-3.5 w-3.5 ${
                              node.type === 'slack' ? 'text-blue-400' :
                              node.type === 'industrial' ? 'text-amber-400' :
                              node.type === 'residential' ? 'text-teal-400' : 'text-rose-400'
                            }`} />
                            <span className="font-bold text-white text-[10px] truncate">{node.name}</span>
                          </div>

                          <div className="space-y-0.5 text-slate-400 font-semibold">
                            <div className="flex justify-between">
                              <span>Load:</span>
                              <span className="text-slate-200">{nodeLoad} MW</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Generation:</span>
                              <span className="text-emerald-400">{nodeGen} MW</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Gen Cost:</span>
                              <span className="text-slate-300">${node.costPerMWh}/MWh</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Congestion warning legend */}
                    <div className="absolute bottom-4 left-4 bg-[#0c1121]/95 border border-slate-800 p-3 rounded-lg text-[9px] font-mono space-y-1 shadow-lg z-30">
                      <span className="text-slate-500 font-bold block uppercase">Transmission Load Indicators</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-slate-300">Optimal (&lt;80% capacity)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-yellow-400" />
                        <span className="text-slate-300">Heavy loading (80%-100% capacity)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-rose-400 font-bold">Congested (&gt;100% capacity)</span>
                      </div>
                    </div>
                  </div>

                  {/* Flow routing table analysis */}
                  <div className="bg-[#080d19] border border-slate-800 rounded-xl p-4 font-mono text-[10px] space-y-3">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">OPF Power Routing Branch Details</span>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {opfResult.branches.map((line) => {
                        const lineLoadingPercent = (Math.abs(line.flow) / line.capacity) * 100;
                        return (
                          <div key={line.id} className="bg-[#0c1121] border border-slate-800 p-2.5 rounded-lg space-y-1">
                            <div className="text-[9px] text-slate-400 font-bold border-b border-slate-900 pb-1 truncate">{line.name}</div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Flow:</span>
                              <span className={line.flow >= 0 ? 'text-teal-400 font-bold' : 'text-blue-400 font-bold'}>{line.flow} MW</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Loading:</span>
                              <span className={lineLoadingPercent >= 100 ? 'text-rose-400 font-bold' : lineLoadingPercent >= 80 ? 'text-yellow-400 font-bold' : 'text-slate-300 font-semibold'}>
                                {lineLoadingPercent.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Operational physics description */}
                  <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl text-xs space-y-2 leading-relaxed">
                    <div className="font-mono font-bold text-teal-400 flex items-center gap-1">
                      <Compass className="h-3.5 w-3.5" />
                      Engineering Physics: DC Optimal Power Flow (OPF)
                    </div>
                    <p className="text-slate-400 font-sans">
                      Unlike standard economic dispatch (which loads cheap generators unconditionally), OPF respects actual grid physics. Power flow spreads according to node voltage angles and line susceptances (P_ij = [theta_i - theta_j] / X_ij). Under heavy load at Node 2 or Node 4, drawing cheap baseload from Node 1 (Utility) overloads the lines. The OPF optimization forces the dispatch of expensive local generators (such as Node 4 Emergency backup at $65/MWh) to shave transmission flow, safeguarding grid security and preventing thermal breakdown.
                    </p>
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
