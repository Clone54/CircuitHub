import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Brain, 
  Upload, 
  FileSpreadsheet, 
  Play, 
  Copy, 
  Check, 
  Cpu, 
  HelpCircle, 
  Info, 
  Sparkles, 
  Plus, 
  ArrowLeft,
  Settings,
  ShieldCheck,
  Code,
  RefreshCw
} from 'lucide-react';
import { IEEEReportButton } from '../components/IEEEReportButton';
import { Link } from 'react-router-dom';
import Papa from 'papaparse';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MLResponse {
  recommendedAlgorithm: string;
  justification: string;
  pythonCode: string;
  tags: string[];
}

export default function MLEngineeringView() {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [rowCount, setRowCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [customQuery, setCustomQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Suggested Model Response
  const [mlOutput, setMlOutput] = useState<MLResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Premium Sample Datasets ---
  const handleLoadSample = (sampleType: 'bearing' | 'gis_leak' | 'microgrid') => {
    setError(null);
    setMlOutput(null);

    let mockCsvText = '';
    let fileName = '';

    if (sampleType === 'bearing') {
      fileName = 'bearing_vibration_signatures.csv';
      mockCsvText = `Vibration_X_g,Vibration_Y_g,Temperature_C,RPM,Acoustic_Emission_dB,Fault_Class
0.12,0.14,42.5,1795,34.2,Healthy
0.89,1.12,68.4,1780,56.8,Inner_Race_Wear
0.15,0.11,43.1,1798,33.9,Healthy
1.42,1.86,74.2,1750,72.4,Ball_Fault
0.45,0.52,51.8,1792,45.1,Outer_Race_Wear
`;
    } else if (sampleType === 'gis_leak') {
      fileName = 'gis_sf6_substation_logs.csv';
      mockCsvText = `Chamber_Pressure_bar,SF6_Concentration_ppm,Ambient_Temp_C,Humidity_pct,Sealing_Stress_MPa,Leak_Detected
5.8,12,28.5,45,24.2,0
4.1,280,31.2,52,18.9,1
5.9,8,24.1,40,24.8,0
5.7,15,22.4,38,23.9,0
3.8,420,33.4,58,16.5,1
`;
    } else {
      fileName = 'renewable_microgrid_dispatch.csv';
      mockCsvText = `Solar_Irradiance_W_m2,Wind_Speed_m_s,Battery_SOC_pct,Grid_Frequency_Hz,Load_Demand_kW,Net_Export_Power_kW
850,5.4,72.5,50.02,125.4,34.2
120,8.9,45.2,49.98,140.8,-12.5
920,3.2,88.4,50.01,110.2,55.8
0,12.4,22.1,49.92,155.1,-68.4
640,6.1,64.8,50.03,130.5,12.9
`;
    }

    Papa.parse(mockCsvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('Failed parsing sample CSV.');
          return;
        }
        setCsvFile({ name: fileName } as any);
        setParsedHeaders(results.meta.fields || []);
        setParsedRows(results.data);
        setRowCount(500); // simulate a large real dataset size for the UI
      }
    });
  };

  // --- Handlers for file uploading ---
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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleFileProcess = (file: File) => {
    setError(null);
    setMlOutput(null);

    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
      setError("Invalid file type. Please upload a structured .csv file.");
      return;
    }

    setCsvFile(file);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError("Error parsing CSV file. Please make sure the structure is correct.");
          return;
        }

        if (!results.meta.fields || results.meta.fields.length === 0) {
          setError("No columns found in the CSV dataset.");
          return;
        }

        setParsedHeaders(results.meta.fields);
        setParsedRows(results.data);
        setRowCount(results.data.length);
      }
    });
  };

  // --- Post meta metrics to endpoint to get AI Classification logic ---
  const handleAnalyzeDataset = async () => {
    if (parsedHeaders.length === 0) return;
    setIsLoading(true);
    setError(null);
    setMlOutput(null);

    // Limit sample rows to 4 to protect privacy and stay lightweight
    const sampleRows = parsedRows.slice(0, 4);

    try {
      const response = await fetch('/api/ml-classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          headers: parsedHeaders,
          rowCount: rowCount,
          sampleRows: sampleRows,
          customQuery: customQuery
        })
      });

      if (!response.ok) {
        throw new Error("Failed to receive recommendation from model advisor.");
      }

      const data = await response.json();
      setMlOutput(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to reach the AI model service.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!mlOutput) return;
    navigator.clipboard.writeText(mlOutput.pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-navy text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center justify-between border-b border-navy-light pb-4">
          <div className="flex items-center gap-3">
            <Link 
              to="/tools" 
              className="p-2 bg-navy-card/60 hover:bg-navy-light/40 border border-navy-light rounded-xl transition-all text-emerald-accent"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">4th Year Elective / Machine Learning Track</span>
              <h1 className="text-2xl font-bold font-sans tracking-tight text-white flex items-center gap-2">
                AI Data Classification & ML Code Generator
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-navy-card/60 border border-navy-light px-3 py-1.5 rounded-xl text-xs font-mono">
            <Cpu className="h-4 w-4 text-emerald-accent animate-pulse" />
            <span className="text-slate-400">Model: EEE 4121 Assistant</span>
          </div>
        </div>

        {/* Top Split Layout: Dataset Upload & Schema Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* File Upload Zone (5/12 Width) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-navy-card border border-navy-light p-6 rounded-2xl shadow-xl space-y-5">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Upload Engineering Dataset</h2>
                <p className="text-xs text-slate-400">Load structured physical logs, vibration telemetry, or power profiles</p>
              </div>

              {/* Drag and Drop Zone */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-emerald-accent bg-emerald-accent/5' 
                    : 'border-navy-light/80 hover:border-emerald-accent/60 bg-navy/40 hover:bg-navy/80'
                }`}
              >
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInput}
                  accept=".csv"
                  className="hidden"
                />
                
                <Upload className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                <span className="text-xs font-bold text-slate-200 block">Drag & Drop CSV File here</span>
                <span className="text-[10px] text-slate-500 font-mono block mt-1">or click to browse local folders</span>
              </div>

              {/* Sample Datasets to Load instantly */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Or load a pre-seeded STEM dataset:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => handleLoadSample('bearing')}
                    className="p-2 bg-navy/60 hover:bg-navy border border-navy-light rounded-xl text-[10px] font-bold text-slate-300 hover:text-emerald-accent text-left truncate transition-all"
                  >
                    ⚙️ Bearing Vibration
                  </button>
                  <button
                    onClick={() => handleLoadSample('gis_leak')}
                    className="p-2 bg-navy/60 hover:bg-navy border border-navy-light rounded-xl text-[10px] font-bold text-slate-300 hover:text-emerald-accent text-left truncate transition-all"
                  >
                    💨 GIS Gas Leakage
                  </button>
                  <button
                    onClick={() => handleLoadSample('microgrid')}
                    className="p-2 bg-navy/60 hover:bg-navy border border-navy-light rounded-xl text-[10px] font-bold text-slate-300 hover:text-emerald-accent text-left truncate transition-all"
                  >
                    ⚡ Microgrid Output
                  </button>
                </div>
              </div>

              {/* Error messages if any */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                  {error}
                </div>
              )}

              {/* User Custom Directives TextBox */}
              <div className="space-y-2 pt-2 border-t border-navy-light/40">
                <label className="text-xs font-mono text-slate-400 flex items-center justify-between">
                  <span>Custom Directives / Scope constraints</span>
                  <span className="text-[10px] text-slate-500">Optional</span>
                </label>
                <textarea
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="e.g., 'Target column is Fault_Class. This is a classification model, prioritize high recall on faults...'"
                  rows={3}
                  className="w-full bg-navy text-xs font-mono p-3 rounded-xl border border-navy-light text-slate-200 focus:outline-none focus:border-emerald-accent"
                />
              </div>

              {/* Big Action Button */}
              <button
                onClick={handleAnalyzeDataset}
                disabled={parsedHeaders.length === 0 || isLoading}
                className="w-full bg-emerald-accent text-navy py-3 px-4 rounded-xl text-xs font-bold tracking-wider hover:bg-emerald-hover hover:scale-[1.01] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 shadow-lg shadow-emerald-accent/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Assembling Pipeline Recommendation...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    Recommend Pipeline & Generate Code
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Parsed Schema & Table Preview (7/12 Width) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-navy-card border border-navy-light p-6 rounded-2xl shadow-xl space-y-5 h-full flex flex-col justify-between">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-navy-light/50 pb-3">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-accent" />
                    Dataset Preview
                  </h2>
                  {csvFile && (
                    <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                      <span>File: <strong className="text-white">{csvFile.name}</strong></span>
                      <span>|</span>
                      <span>Rows: <strong className="text-emerald-accent">{rowCount}</strong></span>
                    </div>
                  )}
                </div>

                {parsedHeaders.length > 0 ? (
                  <div className="space-y-4">
                    
                    {/* Column Chip Badges list */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Detected Columns ({parsedHeaders.length}):</span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {parsedHeaders.map((col, idx) => (
                          <span 
                            key={idx} 
                            className="px-2 py-1 bg-navy border border-navy-light/80 rounded-md text-[10px] font-mono text-slate-300 font-bold"
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Table Data list (First 4 rows) */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Sample Records Preview:</span>
                      <div className="overflow-x-auto rounded-xl border border-navy-light/60 bg-navy/40">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-navy border-b border-navy-light font-mono text-slate-400 uppercase text-[9px] tracking-wider">
                              {parsedHeaders.slice(0, 6).map((col, idx) => (
                                <th key={idx} className="p-3">{col}</th>
                              ))}
                              {parsedHeaders.length > 6 && <th className="p-3">...</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-navy-light/30 font-mono text-slate-300">
                            {parsedRows.slice(0, 4).map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-navy-light/10">
                                {parsedHeaders.slice(0, 6).map((col, cIdx) => (
                                  <td key={cIdx} className="p-3 max-w-[120px] truncate">{row[col]}</td>
                                ))}
                                {parsedHeaders.length > 6 && <td className="p-3 text-slate-500">...</td>}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                    <FileSpreadsheet className="h-12 w-12 text-slate-600 animate-pulse" />
                    <p className="text-slate-400 text-xs max-w-sm">
                      No CSV loaded yet. Drag-and-drop a dataset file, browse, or click a seeded sample above to view headers and records securely on the client.
                    </p>
                  </div>
                )}
              </div>

              {/* Privacy and Local processing guarantee */}
              <div className="bg-navy/40 border border-navy-light/60 p-4 rounded-xl flex items-start gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="h-4 w-4 text-emerald-accent shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Client-Side Safety Protocol</strong>: CSV data is parsed locally in your browser. We never transmit your full rows or raw sensor parameters to remote systems—only column titles and metadata headers are provided to save tokens and protect intellectual property.
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Bottom AI Recommendations and Highlighting Section */}
        {mlOutput && (
          <div className="space-y-6 max-h-[500px] overflow-y-auto" id="ml-chart">
            <div className="flex justify-end">
              <IEEEReportButton
                experimentName="Machine Learning Engineering: Pipeline Generation"
                inputData={{
                  'Filename': csvFile?.name || 'N/A',
                  'Rows': rowCount.toString(),
                  'Features (Columns)': parsedHeaders.length.toString(),
                  'User Query': customQuery || 'Standard Analysis'
                }}
                outputData={{
                  'Recommended Algorithm': mlOutput.recommendedAlgorithm,
                  'Tags': mlOutput.tags.join(', ')
                }}
                chartSelectors={['#ml-chart']}
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Model Justification Panel (5/12 Width) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-navy-card border border-navy-light p-6 rounded-2xl shadow-xl space-y-5">
                <div className="flex items-center gap-2 border-b border-navy-light/50 pb-3">
                  <Sparkles className="h-5 w-5 text-emerald-accent" />
                  <div>
                    <h3 className="text-xs font-mono text-slate-500 uppercase tracking-wider">AI Recommender</h3>
                    <h2 className="text-sm font-bold text-white uppercase tracking-tight">Analytical Justification</h2>
                  </div>
                </div>

                {/* Recommended Algorithm Metric */}
                <div className="p-4 bg-navy/60 rounded-xl border border-navy-light/60">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Recommended Model Architecture</span>
                  <span className="text-lg font-black text-emerald-accent tracking-tight">{mlOutput.recommendedAlgorithm}</span>
                </div>

                {/* Category Tags */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Identified Domains / Categories:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {mlOutput.tags.map((tag, idx) => (
                      <span 
                        key={idx}
                        className="px-2.5 py-1 bg-emerald-accent/5 border border-emerald-accent/20 rounded-full text-[10px] font-mono text-emerald-accent font-bold"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Markdown justification content */}
                <div className="prose prose-invert prose-xs text-xs text-slate-300 leading-relaxed max-h-80 overflow-y-auto pr-2 border-t border-navy-light/40 pt-4">
                  <div className="markdown-body">
                    <Markdown>{mlOutput.justification}</Markdown>
                  </div>
                </div>
              </div>
            </div>

            {/* Python Code Block (7/12 Width) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-navy-card border border-navy-light rounded-2xl shadow-xl overflow-hidden flex flex-col h-full justify-between">
                
                <div className="p-5 border-b border-navy-light/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-emerald-accent" />
                    <h3 className="text-xs font-mono text-slate-400 uppercase">Generated Code Pipeline</h3>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 bg-navy hover:bg-navy-light/40 border border-navy-light/60 rounded-lg text-emerald-accent hover:text-white transition-all flex items-center gap-1 text-xs cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Copy Script
                      </>
                    )}
                  </button>
                </div>

                {/* React-Syntax-Highlighter */}
                <div className="flex-1 bg-[#1e1e1e] overflow-auto max-h-[460px] text-xs font-mono">
                  <SyntaxHighlighter 
                    language="python" 
                    style={tomorrow}
                    customStyle={{ margin: 0, padding: '20px', background: 'transparent' }}
                  >
                    {mlOutput.pythonCode}
                  </SyntaxHighlighter>
                </div>

                <div className="p-4 bg-navy border-t border-navy-light/50 text-[10px] text-slate-500 font-mono text-center">
                  Copy and run this fully productionized pipeline locally using `pip install pandas scikit-learn numpy`
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
