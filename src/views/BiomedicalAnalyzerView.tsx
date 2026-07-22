import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Cpu,
  RefreshCw,
  Heart,
  Filter,
  Sliders,
  ShieldCheck,
  Search
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
  ReferenceLine
} from 'recharts';
import Papa from 'papaparse';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface ECGPoint {
  time: number; // millisecond
  voltage: number; // millivolt
}

interface BioAnalysisResponse {
  heartRate: number;
  rhythmClassification: string;
  noiseAssessment: string;
  clinicalSummary: string;
  recommendations: string[];
  isMocked?: boolean;
}

export default function BiomedicalAnalyzerView() {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [ecgData, setEcgData] = useState<ECGPoint[]>([]);
  const [zoomRange, setZoomRange] = useState<[number, number]>([0, 800]); // in ms or sample window
  const [windowSize, setWindowSize] = useState<number>(1000); // ms window to display
  const [windowOffset, setWindowOffset] = useState<number>(0);

  // Statistics parsed
  const [sampleRate, setSampleRate] = useState<number>(250); // Hz
  const [maxVal, setMaxVal] = useState<number>(0);
  const [minVal, setMinVal] = useState<number>(0);
  const [peakCount, setPeakCount] = useState<number>(0);

  // AI Response states
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [aiOutput, setAiOutput] = useState<BioAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Generate Realistic ECG presets ---
  const loadECGPreset = (type: 'healthy' | 'tachycardia' | 'arrhythmia') => {
    setError(null);
    setAiOutput(null);
    
    let generatedPoints: ECGPoint[] = [];
    let name = '';
    let calculatedBpm = 72;

    const fs = 250; // 250Hz sampling rate
    const totalDurationSeconds = 8;
    const totalSamples = fs * totalDurationSeconds;

    // Standard single-period ECG waveform synthesis (P, Q, R, S, T)
    const synthesizeECGPeriod = (t: number, hr: number, noiseLevel: number, wanderFreq = 0) => {
      // t is relative phase within the heartbeat cycle (0 to 1)
      let value = 0;

      // P wave: small positive bell curve
      if (t >= 0.1 && t <= 0.2) {
        value += 0.15 * Math.sin(((t - 0.1) / 0.1) * Math.PI);
      }
      // Q wave: small negative deflection
      if (t >= 0.28 && t <= 0.3) {
        value -= 0.12 * Math.sin(((t - 0.28) / 0.02) * Math.PI);
      }
      // R wave: massive positive spike
      if (t >= 0.3 && t <= 0.33) {
        value += 1.25 * Math.sin(((t - 0.3) / 0.03) * Math.PI);
      }
      // S wave: negative deflection
      if (t >= 0.33 && t <= 0.36) {
        value -= 0.35 * Math.sin(((t - 0.33) / 0.03) * Math.PI);
      }
      // T wave: moderate positive bell curve
      if (t >= 0.45 && t <= 0.6) {
        value += 0.32 * Math.sin(((t - 0.45) / 0.15) * Math.PI);
      }

      // Add high-frequency noise
      value += (Math.random() - 0.5) * noiseLevel;

      // Add low-frequency baseline wander (breathing)
      if (wanderFreq > 0) {
        // Simple breathing drift
        value += 0.25 * Math.sin(t * Math.PI * wanderFreq);
      }

      return parseFloat(value.toFixed(3));
    };

    if (type === 'healthy') {
      name = 'lead_II_healthy_cardiac_250hz.csv';
      calculatedBpm = 74;
      const periodInSamples = fs / (calculatedBpm / 60); // samples per beat (~202 samples)
      
      for (let i = 0; i < totalSamples; i++) {
        const timeMs = Math.round((i / fs) * 1000);
        const cyclePhase = (i % Math.round(periodInSamples)) / periodInSamples;
        const voltage = synthesizeECGPeriod(cyclePhase, calculatedBpm, 0.02);
        generatedPoints.push({ time: timeMs, voltage });
      }
    } else if (type === 'tachycardia') {
      name = 'lead_II_sinus_tachycardia_50hz_mains.csv';
      calculatedBpm = 115;
      const periodInSamples = fs / (calculatedBpm / 60); // ~130 samples per beat
      
      for (let i = 0; i < totalSamples; i++) {
        const timeMs = Math.round((i / fs) * 1000);
        const cyclePhase = (i % Math.round(periodInSamples)) / periodInSamples;
        // Inject 50 Hz power-line sinusoidal hum (t is in seconds: i/fs)
        const mainsHum = 0.18 * Math.sin(2 * Math.PI * 50 * (i / fs));
        const voltage = synthesizeECGPeriod(cyclePhase, calculatedBpm, 0.05) + mainsHum;
        generatedPoints.push({ time: timeMs, voltage: parseFloat(voltage.toFixed(3)) });
      }
    } else {
      name = 'lead_II_bradycardia_severe_wander.csv';
      calculatedBpm = 45;
      const periodInSamples = fs / (calculatedBpm / 60); // ~333 samples per beat
      
      for (let i = 0; i < totalSamples; i++) {
        const timeMs = Math.round((i / fs) * 1000);
        const cyclePhase = (i % Math.round(periodInSamples)) / periodInSamples;
        // Severe slow baseline wander (~0.4 Hz respirator drift)
        const wander = 0.32 * Math.sin(2 * Math.PI * 0.4 * (i / fs));
        const voltage = synthesizeECGPeriod(cyclePhase, calculatedBpm, 0.01) + wander;
        generatedPoints.push({ time: timeMs, voltage: parseFloat(voltage.toFixed(3)) });
      }
    }

    setCsvFile({ name } as any);
    setEcgData(generatedPoints);
    setWindowOffset(0);

    // Calculate immediate descriptive statistics on the generated preset
    const voltages = generatedPoints.map(p => p.voltage);
    setMaxVal(Math.max(...voltages));
    setMinVal(Math.min(...voltages));
    
    // Simple R-peak finder (threshold-based above 0.8mV)
    let peaks = 0;
    for (let k = 1; k < voltages.length - 1; k++) {
      if (voltages[k] > 0.8 && voltages[k] > voltages[k - 1] && voltages[k] > voltages[k + 1]) {
        peaks++;
        k += 50; // dead band time to avoid double detection of same peak
      }
    }
    setPeakCount(peaks);
  };

  // --- File Uploader logic ---
  const processCSVData = (text: string, filename: string) => {
    Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('Syntax or format error detected while parsing CSV rows.');
          return;
        }

        // Identify Time and Voltage columns
        const fields = results.meta.fields || [];
        const timeCol = fields.find(f => /time|ms|sec|t/i.test(f)) || fields[0];
        const voltCol = fields.find(f => /volt|mv|amp|value|ecg/i.test(f)) || fields[1];

        if (!voltCol) {
          setError('Could not locate a numeric voltage/amplitude column in the uploaded headers.');
          return;
        }

        const parsed: ECGPoint[] = results.data.map((row: any, idx: number) => {
          let tVal = row[timeCol];
          if (typeof tVal !== 'number') {
            tVal = idx * 4; // fallback: assume 250Hz sample rate (4ms spacing)
          } else {
            // If time is in seconds, convert to ms
            if (tVal < 100) tVal *= 1000;
          }
          return {
            time: Math.round(tVal),
            voltage: Number(row[voltCol]) || 0
          };
        });

        if (parsed.length === 0) {
          setError('The CSV dataset contains no valid continuous readings.');
          return;
        }

        setEcgData(parsed);
        setWindowOffset(0);
        setCsvFile({ name: filename } as any);

        const voltages = parsed.map(p => p.voltage);
        setMaxVal(Math.max(...voltages));
        setMinVal(Math.min(...voltages));

        // R peak detection
        let peaks = 0;
        for (let k = 1; k < voltages.length - 1; k++) {
          if (voltages[k] > 0.7 && voltages[k] > voltages[k - 1] && voltages[k] > voltages[k + 1]) {
            peaks++;
            k += 40; // blanking period
          }
        }
        setPeakCount(peaks);
      }
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            processCSVData(event.target.result as string, file.name);
          }
        };
        reader.readAsText(file);
      } else {
        setError('Please drop a formatted spreadsheet dataset ending in .csv');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          processCSVData(event.target.result as string, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // --- Call Biomedical AI Endpoint ---
  const handleAnalyzeECG = async () => {
    if (ecgData.length === 0) return;
    setIsLoadingAI(true);
    setError(null);
    setAiOutput(null);

    // Extract statistical summaries and a small subset of sample points to stay under token limits
    const statsSummary = `Sampling Rate: 250Hz. Total recorded samples: ${ecgData.length}. Maximum voltage peak: ${maxVal} mV. Minimum peak: ${minVal} mV. Est. R-peaks counted physically: ${peakCount} peaks over ${(ecgData[ecgData.length-1].time - ecgData[0].time)/1000} seconds.`;
    
    // Sub-sample 40 evenly distributed points for shape reference
    const sampleIndices = Array.from({ length: 40 }, (_, idx) => Math.floor(idx * (ecgData.length / 40)));
    const samplePoints = sampleIndices.map(i => ecgData[i] || ecgData[0]);

    try {
      const response = await fetch('/api/biomedical-ecg-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          signalDataSummary: statsSummary,
          samplePoints
        })
      });

      if (!response.ok) {
        throw new Error('Failed to parse ECG analysis from server.');
      }

      const data = await response.json();
      setAiOutput(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Server connection interrupted while uploading bio-signals.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Get current active segment of data for Recharts window
  const getVisiblePoints = () => {
    if (ecgData.length === 0) return [];
    
    // Locate the index representing offset time
    const startIdx = ecgData.findIndex(p => p.time >= windowOffset);
    const validStart = startIdx === -1 ? 0 : startIdx;
    
    // Slice data points spanning the window size
    const sliceEnd = ecgData.findIndex(p => p.time >= windowOffset + windowSize);
    const validEnd = sliceEnd === -1 ? ecgData.length : sliceEnd;

    return ecgData.slice(validStart, validEnd);
  };

  const visibleData = getVisiblePoints();
  const maxTime = ecgData.length > 0 ? ecgData[ecgData.length - 1].time : 0;

  return (
    <div id="biomedical-analyzer-view" className="min-h-screen bg-navy-dark text-slate-100 pb-16">
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

        {/* Header section */}
        <div className="relative mb-8 rounded-2xl border border-navy-light/60 bg-navy-light/20 p-6 md:p-8 overflow-hidden">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-rose-500/5 blur-3xl" />
          <div className="absolute left-1/4 bottom-0 h-32 w-32 rounded-full bg-emerald-accent/5 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs tracking-wider uppercase mb-2">
                <Heart className="h-4 w-4 text-rose-500 animate-pulse" /> EEE 4261 Biomedical Instrumentation
              </div>
              <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
                Biomedical Signal <span className="text-rose-400">ECG AI</span> Analyzer
              </h1>
              <p className="mt-2 text-sm text-slate-400 max-w-2xl leading-relaxed">
                Upload raw physiological data logs to visualize standard multi-lead ECG cardiac vectors. Identify ventricular complexes and mains noise, with clinical summaries curated by Gemini's medical DSP engine.
              </p>
            </div>
            
            {ecgData.length > 0 && (
              <button
                onClick={handleAnalyzeECG}
                disabled={isLoadingAI}
                className="flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold uppercase rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none shrink-0"
              >
                {isLoadingAI ? (
                  <>
                    <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                    <span>Analyzing Waveform...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="h-4.5 w-4.5" />
                    <span>Request AI Bio-Report</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ECG Data Loader Zone */}
        {ecgData.length === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            
            {/* Left Side: Drag & Drop Area */}
            <div className="lg:col-span-2">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`group border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-80 bg-navy-light/10 ${
                  dragActive
                    ? 'border-rose-400 bg-rose-500/5'
                    : 'border-navy-light/80 hover:border-rose-400/50 hover:bg-navy-light/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20 group-hover:scale-110 transition-transform mb-4">
                  <Upload className="h-6 w-6 text-rose-400" />
                </div>
                <h3 className="font-display text-lg font-bold text-white mb-2">
                  Upload physiological ECG log CSV
                </h3>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6">
                  CSV must contain column fields representing time (milliseconds) and continuous potential differences (millivolts).
                </p>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-navy-light text-xs font-mono font-bold text-slate-300 border border-navy-light/60 group-hover:text-rose-400 group-hover:border-rose-400/30 transition-colors"
                >
                  Browse Directory Files
                </button>
              </div>
            </div>

            {/* Right Side: Fast Presets Loader */}
            <div className="rounded-2xl border border-navy-light/60 bg-navy-light/20 p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-display text-sm font-bold text-slate-200 mb-2 uppercase tracking-wide">
                  ECG Diagnostic Presets
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Don't have a diagnostic signal CSV available? Load synthetic wave models modeled after actual cardiovascular diagnostics:
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => loadECGPreset('healthy')}
                    className="w-full text-left p-3.5 text-xs font-medium rounded-xl bg-navy-dark hover:bg-navy-light/40 border border-navy-light/60 hover:border-emerald-accent/40 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-bold text-emerald-accent block">Normal Sinus Rhythm</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Healthy R-complex, 74 BPM, standard P & T deflection</span>
                    </div>
                    <Heart className="h-4.5 w-4.5 text-emerald-accent group-hover:scale-110 transition-transform shrink-0" />
                  </button>

                  <button
                    onClick={() => loadECGPreset('tachycardia')}
                    className="w-full text-left p-3.5 text-xs font-medium rounded-xl bg-navy-dark hover:bg-navy-light/40 border border-navy-light/60 hover:border-amber-400/40 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-bold text-amber-400 block">Tachycardia + 50Hz Mains Hum</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Elevated rate (~115 BPM) with simulated AC electromagnetic noise</span>
                    </div>
                    <Heart className="h-4.5 w-4.5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                  </button>

                  <button
                    onClick={() => loadECGPreset('arrhythmia')}
                    className="w-full text-left p-3.5 text-xs font-medium rounded-xl bg-navy-dark hover:bg-navy-light/40 border border-navy-light/60 hover:border-cyan-400/40 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-bold text-cyan-400 block">Bradycardia + Respiration Drift</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Slow rate (~45 BPM) with baseline wander thermal noise</span>
                    </div>
                    <Heart className="h-4.5 w-4.5 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Interactive Analyzer Screen */}
        {ecgData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Visual Waveform Screen & Control Sliders */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Waveform Card */}
              <div className="rounded-2xl border border-navy-light/60 bg-navy-light/10 p-6">
                
                {/* Meta details */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-navy-light/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                      <h3 className="font-display font-bold text-white text-sm">
                        Lead II ECG Signal Stream
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Filename: <span className="font-mono text-rose-400">{csvFile?.name}</span>
                    </p>
                  </div>

                  {/* Window offset positioning control */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setWindowOffset(prev => Math.max(0, prev - windowSize))}
                      disabled={windowOffset <= 0}
                      className="px-2.5 py-1 text-xs font-mono rounded bg-navy-dark border border-navy-light/80 text-slate-300 hover:text-white cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                    >
                      ◀ Prev Segment
                    </button>
                    <span className="text-xs font-mono text-slate-400">
                      {windowOffset} - {Math.min(maxTime, windowOffset + windowSize)} ms
                    </span>
                    <button
                      onClick={() => setWindowOffset(prev => Math.min(maxTime - windowSize, prev + windowSize))}
                      disabled={windowOffset + windowSize >= maxTime}
                      className="px-2.5 py-1 text-xs font-mono rounded bg-navy-dark border border-navy-light/80 text-slate-300 hover:text-white cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                    >
                      Next Segment ▶
                    </button>
                  </div>
                </div>

                {/* The Chart */}
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={visibleData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                      <XAxis
                        dataKey="time"
                        stroke="#64748b"
                        tickFormatter={(t) => `${t} ms`}
                        style={{ fontSize: '11px', fontFamily: 'monospace' }}
                      />
                      <YAxis
                        domain={[-1.5, 2.0]}
                        stroke="#64748b"
                        label={{ value: 'Voltage (mV)', angle: -90, position: 'insideLeft', fill: '#64748b', style: {fontSize: '11px'} }}
                        style={{ fontSize: '11px', fontFamily: 'monospace' }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0b1329', borderColor: '#1e293b', borderRadius: '8px' }}
                        labelStyle={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}
                        itemStyle={{ fontSize: '12px' }}
                        formatter={(value: any) => [`${value} mV`, 'ECG Signal Potential']}
                        labelFormatter={(label) => `Time: ${label} ms`}
                      />
                      <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                      <ReferenceLine y={1.0} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: 'R-Peak Trigger', fill: '#ef4444', style: {fontSize: '10px', fontFamily: 'monospace'}, position: 'right' }} />
                      <Line
                        type="monotone"
                        dataKey="voltage"
                        stroke="#ef4444"
                        dot={false}
                        strokeWidth={2}
                        animationDuration={300}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Navigation scrollbar */}
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-500">
                    <span>0 ms (Start)</span>
                    <span>Scroll to browse whole waveform record</span>
                    <span>{maxTime} ms (End)</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, maxTime - windowSize)}
                    value={windowOffset}
                    onChange={(e) => setWindowOffset(parseInt(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>

              </div>

              {/* Display AI Results if loaded */}
              {(aiOutput || isLoadingAI || error) && (
                <div className="rounded-2xl border border-navy-light/60 bg-navy-light/10 p-6 space-y-6 max-h-[500px] overflow-y-auto">
                  
                  {/* Title of AI Diagnostics */}
                  <div className="flex items-center gap-2 pb-4 border-b border-navy-light/60">
                    <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                      <Cpu className="h-5 w-5 text-rose-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Gemini Cardio-DSP Diagnostic Report
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Real-time physiological assessment & digital signal filtering design constraints.
                      </p>
                    </div>
                  </div>

                  {isLoadingAI && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                      <RefreshCw className="h-8 w-8 text-rose-500 animate-spin" />
                      <p className="text-xs font-mono text-slate-400">
                        Analyzing ECG interval metrics & extracting frequency spectrums...
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-200 text-xs flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {aiOutput && (
                    <div className="space-y-6" id="biomedical-chart">
                      <div className="flex justify-end">
                        <IEEEReportButton
                          experimentName="Biomedical Engineering: ECG Signal Analysis"
                          inputData={{
                            'Filename': csvFile?.name || 'N/A',
                            'Sample Rate': sampleRate + ' Hz',
                            'Duration': (ecgData.length / sampleRate).toFixed(2) + ' s',
                            'Total Samples': ecgData.length.toString()
                          }}
                          outputData={{
                            'Estimated Heart Rate': aiOutput.heartRate + ' BPM',
                            'Rhythm Classification': aiOutput.rhythmClassification,
                            'Signal Noise Quality': aiOutput.noiseAssessment
                          }}
                          chartSelectors={['#biomedical-chart']}
                        />
                      </div>
                      
                      {/* Metric Callouts */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        <div className="p-4 rounded-xl border border-navy-light/60 bg-navy-dark/40">
                          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider">
                            Estimated Heart Rate
                          </span>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-2xl font-black text-rose-400 font-mono">
                              {aiOutput.heartRate}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">BPM</span>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl border border-navy-light/60 bg-navy-dark/40">
                          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider">
                            Rhythm Classification
                          </span>
                          <p className="text-sm font-bold text-slate-200 mt-1 leading-snug">
                            {aiOutput.rhythmClassification}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl border border-navy-light/60 bg-navy-dark/40">
                          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider">
                            Signal Quality Assessment
                          </span>
                          <p className="text-xs font-medium text-slate-300 mt-1 leading-relaxed">
                            {aiOutput.noiseAssessment}
                          </p>
                        </div>

                      </div>

                      {/* Clinical summary markdown */}
                      <div className="text-slate-300 text-sm leading-relaxed markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{aiOutput.clinicalSummary}</ReactMarkdown>
                      </div>

                      {/* Filter/Hardware design checklist */}
                      <div>
                        <h4 className="text-xs font-mono font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                          <Filter className="h-3.5 w-3.5 text-indigo-400" /> Biomedical DSP Filter Engineering Requirements
                        </h4>
                        <div className="space-y-2.5">
                          {aiOutput.recommendations.map((rec, idx) => (
                            <div key={idx} className="flex gap-3 p-3.5 rounded-xl border border-navy-light/40 bg-navy-dark/30 text-slate-300 text-xs leading-relaxed">
                              <span className="h-5 w-5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Sidebar Controls */}
            <div className="space-y-6">
              
              {/* Slider for Window display settings */}
              <div className="rounded-xl border border-navy-light/60 bg-navy-light/20 p-5 space-y-4">
                <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-rose-400" /> Window Settings
                </h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Duration Displayed</span>
                    <span className="font-mono font-bold text-white">{windowSize} ms</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="3000"
                    step="100"
                    value={windowSize}
                    onChange={(e) => setWindowSize(parseInt(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500">
                    Adjusting zooms inside the ECG paper trace to inspect individual QRS complex peaks.
                  </p>
                </div>
              </div>

              {/* Signal Metrics Board */}
              <div className="rounded-xl border border-navy-light/60 bg-navy-light/20 p-5 space-y-4">
                <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Signal DSP Metrics
                </h3>
                
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between pb-2 border-b border-navy-light/40">
                    <span className="text-slate-400">Sample Frequency:</span>
                    <span className="text-slate-200">250 Hz</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-navy-light/40">
                    <span className="text-slate-400">Total Length:</span>
                    <span className="text-slate-200">{ecgData.length} records</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-navy-light/40">
                    <span className="text-slate-400">Voltage Max/Min:</span>
                    <span className="text-rose-400">{maxVal} / {minVal} mV</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-navy-light/40">
                    <span className="text-slate-400">Counted R-Peaks:</span>
                    <span className="text-emerald-accent font-bold">{peakCount} peaks</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEcgData([]);
                    setCsvFile(null);
                    setAiOutput(null);
                  }}
                  className="w-full py-2 rounded-lg border border-navy-light bg-navy-dark text-slate-300 hover:text-rose-400 hover:border-rose-400/40 transition-all text-xs font-mono font-bold cursor-pointer"
                >
                  Unload Signal File
                </button>
              </div>

              {/* Informative Help Box */}
              <div className="rounded-xl border border-navy-light/60 bg-navy-light/10 p-5 text-xs text-slate-400 space-y-2">
                <div className="flex items-center gap-1 font-bold text-slate-300 uppercase font-mono text-[10px]">
                  <HelpCircle className="h-3.5 w-3.5 text-indigo-400" /> Cardiac Wave Theory
                </div>
                <p className="leading-relaxed">
                  Under Lead II ECG configurations (RA to LL electrode):
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
                  <li><strong className="text-slate-300">P-wave</strong>: Atrial depolarization contraction (typically positive deflection).</li>
                  <li><strong className="text-slate-300">QRS Complex</strong>: Ventricular depolarization (sharp electrical force representing heartbeat).</li>
                  <li><strong className="text-slate-300">T-wave</strong>: Ventricular repolarization recovery.</li>
                </ul>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
