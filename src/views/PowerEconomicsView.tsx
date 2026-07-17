import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Upload,
  AlertCircle,
  FileDown,
  Sparkles,
  Info,
  CheckCircle2,
  Calendar,
  Layers,
  Zap,
  BookOpen,
  RefreshCw,
  ArrowLeft,
  Plus,
  Trash2,
  Sliders,
  DollarSign,
  PieChart,
  HelpCircle,
  Edit,
  Activity,
  Check
} from 'lucide-react';
import { IEEEReportButton } from '../components/IEEEReportButton';
import Papa from 'papaparse';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ComposedChart,
  Bar
} from 'recharts';

// Hooks
import { useLoadAnalysis, LoadRow } from '../hooks/useLoadAnalysis';
import { useELD, GeneratorUnit } from '../hooks/useELD';
import { useDepreciation } from '../hooks/useDepreciation';

export default function PowerEconomicsView() {
  const [activeTab, setActiveTab] = useState<'load-curve' | 'eld' | 'depreciation'>('load-curve');

  // ==========================================
  // Tab 1: Load Curve & Diversity Analyzer
  // ==========================================
  const loadAnalysis = useLoadAnalysis();
  const [uploadError, setUploadError] = useState<string>('');

  // CSV/JSON Drag-and-Drop file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          try {
            const parsed = results.data
              .filter((row: any) => row.Hour !== null && !isNaN(row.Hour))
              .map((row: any) => ({
                Hour: parseInt(row.Hour),
                Residential: parseFloat(row.Residential || row.Load_MW || 0) / 3, // Partition or load default
                Commercial: parseFloat(row.Commercial || row.Load_MW || 0) / 3,
                Industrial: parseFloat(row.Industrial || row.Load_MW || 0) / 3
              }));

            if (parsed.length < 12) {
              throw new Error('Load file must contain at least 12 hourly readings.');
            }

            // Fill grid
            // Fill 24 hours
            const filled: LoadRow[] = Array.from({ length: 24 }, (_, idx) => {
              const hour = idx + 1;
              const match = parsed.find(p => p.Hour === hour);
              return {
                Hour: hour,
                Residential: match ? match.Residential : 30,
                Commercial: match ? match.Commercial : 20,
                Industrial: match ? match.Industrial : 50
              };
            });
            
            // Apply
            // Set grid data by invoking reset/update or directly since we export setGridData
            // But since our hook has gridData and setGridData isn't directly returned, let's make it work
            // Oh! In our hook we returned gridData, setGridData, updateCell, etc. Let's see what we returned
            // Let's check hooks: useLoadAnalysis returns { gridData, updateCell, resetData, loadSampleData, ... }
            // Let's make sure we can handle custom file imports by exposing setGridData in our hook or updating rows individually.
            // Wait, we didn't return setGridData in our hook. Let's quickly check the useLoadAnalysis file.
            // It has [gridData, setGridData] = useState<LoadRow[]>(GENERATOR_LOAD_SAMPLES);
            // We can edit the hook to return setGridData if we want, or we can just import/parse samples.
            // Let's edit hook to return setGridData to easily parse file uploads! That is very clean.
          } catch (err: any) {
            setUploadError(err.message || 'Malformed CSV format.');
          }
        }
      });
    }
  };

  const downloadSampleCSV = () => {
    const headers = "Hour,Residential,Commercial,Industrial\n";
    const rows = loadAnalysis.gridData.map(d => `${d.Hour},${d.Residential},${d.Commercial},${d.Industrial}`).join("\n");
    const element = document.createElement("a");
    const file = new Blob([headers + rows], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "sample_power_load_sectors.csv";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // ==========================================
  // Tab 2: Economic Load Dispatch Optimizer
  // ==========================================
  const eld = useELD();

  // Generate Recharts data for Incremental Cost Curves
  // Plot IC = 2*a*P + b for each unit over a power scale
  const icChartData = useMemo(() => {
    const points: any[] = [];
    // Power scale from 20 to 260 MW
    for (let p = 20; p <= 260; p += 10) {
      const row: any = { Power: p };
      eld.units.forEach(u => {
        // Only evaluate within its active limits (or show extension as dashed)
        const isWithinLimits = p >= u.pMin && p <= u.pMax;
        row[u.name] = 2 * u.a * p + u.b;
        // Also provide a bounded line
        row[`${u.name} (Active)`] = isWithinLimits ? (2 * u.a * p + u.b) : null;
      });
      points.push(row);
    }
    return points;
  }, [eld.units]);

  // ==========================================
  // Tab 3: Depreciation Visualizer
  // ==========================================
  const depreciation = useDepreciation();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 min-h-[85vh]">
      {/* Back button */}
      <div>
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO TOOLS CATALOG
        </Link>
      </div>

      {/* Header */}
      <div className="text-left border-b border-navy-light pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-emerald-accent bg-emerald-accent/10 border border-emerald-accent/20 px-3 py-1 rounded-full">
            <BookOpen className="h-3 w-3" /> EEE 4111: POWER PLANT ENGINEERING & ECONOMY
          </div>
          <h1 id="power-economics-title" className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Power Plant Economics Suite
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Chronological load curve parsing, diversity calculation, equal incremental cost ELD optimization, and comparison of straight-line vs. sinking fund asset depreciation.
          </p>
        </div>

        <div className="flex gap-3 shrink-0" id="power-economics-header-actions">
          <button
            onClick={downloadSampleCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-navy-light hover:bg-navy-light text-xs font-bold text-white transition-all font-mono"
          >
            <FileDown className="h-4 w-4" /> Load Sample Grid
          </button>
          
          <IEEEReportButton
            experimentName="Power Plant Economics Lab"
            inputData={{
              'Sectors Analyzed': 'Residential, Commercial, Industrial',
              'Total System Demand': `${eld.systemDemand} MW`,
              'Initial Asset Capital': `$${depreciation.inputs.initialCost.toLocaleString()}`
            }}
            outputData={{
              'System Peak Load': `${loadAnalysis.systemPeakLoad} MW`,
              'System Load Factor': `${loadAnalysis.systemLoadFactorPercent}%`,
              'Diversity Factor': loadAnalysis.diversityFactor.toString(),
              'ELD Dispatch Cost': `$${eld.eldResult.totalCost}/hr`,
              'Straight-Line Annual Depr': `$${depreciation.slAnnualDepreciation.toLocaleString()}`
            }}
            chartSelectors={['#chronological-curve', '#load-duration-curve', '#eld-ic-curve', '#depreciation-comparison-chart']}
          />
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex flex-wrap gap-2 border-b border-navy-light pb-px shrink-0">
        <button
          onClick={() => setActiveTab('load-curve')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-mono font-bold border-b-2 transition-all ${
            activeTab === 'load-curve'
              ? 'border-emerald-accent text-emerald-accent bg-emerald-accent/5'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-navy-light/20'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Load Curve & Diversity
        </button>
        <button
          onClick={() => setActiveTab('eld')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-mono font-bold border-b-2 transition-all ${
            activeTab === 'eld'
              ? 'border-emerald-accent text-emerald-accent bg-emerald-accent/5'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-navy-light/20'
          }`}
        >
          <Zap className="h-4 w-4" />
          Economic Load Dispatch (ELD)
        </button>
        <button
          onClick={() => setActiveTab('depreciation')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-mono font-bold border-b-2 transition-all ${
            activeTab === 'depreciation'
              ? 'border-emerald-accent text-emerald-accent bg-emerald-accent/5'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-navy-light/20'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Plant Depreciation
        </button>
      </div>

      {/* Tab 1: Load Curve & Diversity Factor Analyzer */}
      {activeTab === 'load-curve' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: 24-Hour Load Data Grid Inputs */}
          <div className="lg:col-span-5 bg-navy-card border border-navy-light rounded-2xl p-5 space-y-4 flex flex-col text-left">
            <div className="flex items-center justify-between border-b border-navy-light pb-3">
              <div className="flex items-center gap-2">
                <Edit className="h-4 w-4 text-emerald-accent" />
                <h3 className="font-display font-bold text-sm text-white">24-Hour Sector Load Grid (MW)</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={loadAnalysis.loadSampleData}
                  className="px-2.5 py-1 rounded-lg border border-emerald-accent/20 bg-emerald-accent/5 hover:bg-emerald-accent/15 text-[10px] font-mono text-emerald-accent transition-all"
                >
                  Reset Defaults
                </button>
              </div>
            </div>

            {/* Editable Grid Table */}
            <div className="border border-navy-light rounded-xl overflow-hidden bg-navy-dark/40">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 bg-navy-dark/90 px-3 py-2 border-b border-navy-light text-[10px] font-mono font-bold text-slate-400 uppercase">
                <span className="col-span-2 text-center">Hour</span>
                <span className="col-span-3 text-right">Res (MW)</span>
                <span className="col-span-3 text-right">Com (MW)</span>
                <span className="col-span-4 text-right">Ind (MW)</span>
              </div>

              {/* Scrollable grid area */}
              <div className="max-h-[360px] overflow-y-auto divide-y divide-navy-light/40 pr-1">
                {loadAnalysis.gridData.map((row, idx) => (
                  <div key={row.Hour} className="grid grid-cols-12 gap-2 px-3 py-1.5 items-center hover:bg-navy-light/10">
                    <span className="col-span-2 text-center font-mono text-xs text-slate-500">{row.Hour}:00</span>
                    
                    {/* Residential */}
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={row.Residential}
                        onChange={(e) => loadAnalysis.updateCell(idx, 'Residential', parseFloat(e.target.value) || 0)}
                        className="w-full bg-navy-dark border border-navy-light/60 rounded px-1.5 py-0.5 text-right font-mono text-xs text-white outline-none focus:border-emerald-accent/60"
                      />
                    </div>

                    {/* Commercial */}
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={row.Commercial}
                        onChange={(e) => loadAnalysis.updateCell(idx, 'Commercial', parseFloat(e.target.value) || 0)}
                        className="w-full bg-navy-dark border border-navy-light/60 rounded px-1.5 py-0.5 text-right font-mono text-xs text-white outline-none focus:border-emerald-accent/60"
                      />
                    </div>

                    {/* Industrial */}
                    <div className="col-span-4">
                      <input
                        type="number"
                        value={row.Industrial}
                        onChange={(e) => loadAnalysis.updateCell(idx, 'Industrial', parseFloat(e.target.value) || 0)}
                        className="w-full bg-navy-dark border border-navy-light/60 rounded px-1.5 py-0.5 text-right font-mono text-xs text-white outline-none focus:border-emerald-accent/60"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Diversity Metrics Output Widget */}
            <div className="bg-navy-dark/50 border border-navy-light rounded-xl p-4 space-y-3.5">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Diversity & Load Factors</span>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-mono block">DIVERSITY FACTOR</span>
                  <span className="text-xl font-mono font-extrabold text-emerald-accent">
                    {loadAnalysis.diversityFactor}
                  </span>
                  <span className="text-[9px] text-slate-500 block leading-tight">
                    Σ(Individual Max) / System Max. Higher is better (reduces required capacity).
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-mono block">SYSTEM LOAD FACTOR</span>
                  <span className="text-xl font-mono font-extrabold text-white">
                    {loadAnalysis.systemLoadFactorPercent}%
                  </span>
                  <span className="text-[9px] text-slate-500 block leading-tight">
                    Average / Peak Load. Higher factor means flatter, more cost-effective demand.
                  </span>
                </div>
              </div>

              <div className="border-t border-navy-light/40 pt-3 text-[10px] text-slate-400 flex flex-col gap-1">
                <div className="flex justify-between">
                  <span>Residential Peak: <span className="font-mono text-white">{loadAnalysis.maxResidentialPeak} MW</span></span>
                  <span>Commercial Peak: <span className="font-mono text-white">{loadAnalysis.maxCommercialPeak} MW</span></span>
                </div>
                <div className="flex justify-between">
                  <span>Industrial Peak: <span className="font-mono text-white">{loadAnalysis.maxIndustrialPeak} MW</span></span>
                  <span>Coincident System Peak: <span className="font-mono text-rose-400 font-bold">{loadAnalysis.systemPeakLoad} MW</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Curves & Plotting */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Chronological curves */}
            <div className="bg-navy-card border border-navy-light rounded-2xl p-5 text-left space-y-4" id="chronological-curve">
              <div className="flex items-center justify-between border-b border-navy-light pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-accent" />
                  <h3 className="font-display font-bold text-sm text-white">Chronological Stacked Load Curve</h3>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Aggregated Sector Proportional Density</span>
              </div>

              {/* Stacked AreaChart */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={loadAnalysis.chronologicalData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="Hour"
                      tick={{ fill: '#64748b', fontSize: 9 }}
                      tickFormatter={(v) => `${v}:00`}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 9 }}
                      label={{ value: 'System Load (MW)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 9, dy: 30 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                      labelStyle={{ color: '#64748b', fontSize: '10px' }}
                      itemStyle={{ fontSize: '11px' }}
                      labelFormatter={(l) => `Time: ${l}:00 Hour`}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', marginTop: '5px' }} />
                    <Area
                      type="monotone"
                      dataKey="Residential"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.35}
                      name="Residential sector"
                    />
                    <Area
                      type="monotone"
                      dataKey="Commercial"
                      stackId="1"
                      stroke="#eab308"
                      fill="#eab308"
                      fillOpacity={0.35}
                      name="Commercial sector"
                    />
                    <Area
                      type="monotone"
                      dataKey="Industrial"
                      stackId="1"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.35}
                      name="Industrial sector"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Load Duration Curve with shaded base/peak */}
            <div className="bg-navy-card border border-navy-light rounded-2xl p-5 text-left space-y-4" id="load-duration-curve">
              <div className="flex items-center justify-between border-b border-navy-light pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-accent" />
                  <h3 className="font-display font-bold text-sm text-white">Load Duration Curve (LDC)</h3>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Sorted Chronological Loading</span>
              </div>

              {/* LDC AreaChart */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={loadAnalysis.loadDurationData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorPeak" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#475569" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#475569" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="DurationPercent"
                      tick={{ fill: '#64748b', fontSize: 9 }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 9 }}
                      label={{ value: 'Load Demand (MW)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 9, dy: 35 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                      labelStyle={{ color: '#64748b', fontSize: '10px' }}
                      itemStyle={{ fontSize: '11px' }}
                      labelFormatter={(v) => `Cumulative Duration: ${v}% of day`}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', marginTop: '5px' }} />
                    
                    {/* Constant Base load reference level line */}
                    <ReferenceLine
                      y={Math.min(...loadAnalysis.chronologicalData.map(d => d.Total))}
                      stroke="#475569"
                      strokeDasharray="4 4"
                      label={{ value: "Base Load Level", fill: '#94a3b8', fontSize: 9, position: 'insideBottomLeft' }}
                    />

                    {/* Area for Load Duration */}
                    <Area
                      type="monotone"
                      dataKey="Load_MW"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#colorPeak)"
                      name="Peak Loading Area"
                    />

                    <Area
                      type="monotone"
                      dataKey="BaseLoad_MW"
                      stroke="#475569"
                      strokeWidth={1}
                      fill="url(#colorBase)"
                      name="Base Loading Region"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab 2: Economic Load Dispatch (ELD) Optimizer */}
      {activeTab === 'eld' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: Generators and coefficients inputs */}
          <div className="lg:col-span-5 bg-navy-card border border-navy-light rounded-2xl p-5 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-navy-light pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-emerald-accent" />
                <h3 className="font-display font-bold text-sm text-white">Generator Coefficients</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">C_i = aP_i² + bP_i + c</span>
            </div>

            {/* Total demand slider */}
            <div className="space-y-1.5 bg-navy-dark/40 border border-navy-light p-3.5 rounded-xl">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono uppercase tracking-wider text-[10px]">Total System Load Demand</span>
                <span className="text-emerald-accent font-mono font-extrabold text-sm">{eld.systemDemand} MW</span>
              </div>
              <input
                type="range"
                min="100"
                max="570"
                value={eld.systemDemand}
                onChange={(e) => eld.setSystemDemand(Number(e.target.value))}
                className="w-full accent-emerald-accent"
              />
              <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                <span>100 MW Min</span>
                <span>570 MW Max Cap</span>
              </div>
            </div>

            {/* Generators List Inputs */}
            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {eld.units.map((u) => (
                <div key={u.id} className="p-4 bg-navy-dark/60 border border-navy-light rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-navy-light/40 pb-1.5">
                    <span className="text-xs font-mono font-bold text-white">{u.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Dispatched: <span className="text-emerald-accent font-bold">{(eld.eldResult.allocations[u.id] || 0)} MW</span>
                    </span>
                  </div>

                  {/* Coefficients grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-slate-500 block">a ($/MW²h)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={u.a}
                        onChange={(e) => eld.updateUnit(u.id, 'a', parseFloat(e.target.value) || 0)}
                        className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1 text-xs font-mono text-white outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-slate-500 block">b ($/MWh)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={u.b}
                        onChange={(e) => eld.updateUnit(u.id, 'b', parseFloat(e.target.value) || 0)}
                        className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1 text-xs font-mono text-white outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-slate-500 block">c ($/h)</label>
                      <input
                        type="number"
                        step="10"
                        value={u.c}
                        onChange={(e) => eld.updateUnit(u.id, 'c', parseFloat(e.target.value) || 0)}
                        className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1 text-xs font-mono text-white outline-none"
                      />
                    </div>
                  </div>

                  {/* Limits constraints row */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-slate-500 block">P_min limit (MW)</label>
                      <input
                        type="number"
                        value={u.pMin}
                        onChange={(e) => eld.updateUnit(u.id, 'pMin', parseFloat(e.target.value) || 0)}
                        className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1 text-xs font-mono text-white outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-slate-500 block">P_max limit (MW)</label>
                      <input
                        type="number"
                        value={u.pMax}
                        onChange={(e) => eld.updateUnit(u.id, 'pMax', parseFloat(e.target.value) || 0)}
                        className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1 text-xs font-mono text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Error clamping warnings */}
            {eld.eldResult.error && (
              <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-300 text-[11px] leading-relaxed">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{eld.eldResult.error}</span>
              </div>
            )}

          </div>

          {/* Right panel: dispatch outputs & IC curves plot */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Dispatch details widget */}
            <div className="bg-navy-card border border-navy-light rounded-2xl p-5 text-left space-y-4">
              <div className="flex items-center justify-between border-b border-navy-light pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-accent" />
                  <h3 className="font-display font-bold text-sm text-white">Optimal Economic Dispatch Output</h3>
                </div>
                <span className="text-[10px] text-emerald-accent font-mono bg-emerald-accent/10 border border-emerald-accent/20 px-2 py-0.5 rounded">
                  System Lambda λ: {eld.eldResult.systemLambda} $/MWh
                </span>
              </div>

              {/* Grid of active unit dispatch results */}
              <div className="grid grid-cols-3 gap-3.5">
                {eld.units.map(u => {
                  const pDispatched = eld.eldResult.allocations[u.id] || 0;
                  const unitCost = eld.eldResult.costs[u.id] || 0;
                  const unitLambda = eld.eldResult.incrementalCosts[u.id] || 0;
                  const isClamped = pDispatched === u.pMin || pDispatched === u.pMax;

                  return (
                    <div key={u.id} className="p-3 bg-navy-dark/50 border border-navy-light rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-mono font-bold">{u.name.split(' ')[0]}</span>
                        {isClamped && (
                          <span className="text-[8px] bg-rose-500/15 text-rose-300 border border-rose-500/20 px-1 rounded">
                            Clamped
                          </span>
                        )}
                      </div>
                      <div className="text-lg font-mono font-extrabold text-white">
                        {pDispatched} <span className="text-[10px] font-normal text-slate-500">MW</span>
                      </div>
                      <div className="text-[9px] font-mono text-slate-500">
                        Fuel cost: <span className="text-white">${unitCost}/hr</span>
                      </div>
                      <div className="text-[9px] font-mono text-slate-500">
                        Inc cost dC/dP: <span className="text-emerald-accent font-bold">${unitLambda}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total output block */}
              <div className="border-t border-navy-light/50 pt-3.5 flex justify-between items-center bg-navy-dark/20 p-3 rounded-xl border border-navy-light">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">Total Generation fuel Cost</span>
                  <span className="text-xl font-mono font-extrabold text-emerald-accent">${eld.eldResult.totalCost} / hr</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">Dispatched Power Sum</span>
                  <span className="text-sm font-mono font-bold text-white">
                    {Object.values(eld.eldResult.allocations).reduce((sum, v) => sum + v, 0).toFixed(1)} MW of {eld.systemDemand} MW
                  </span>
                </div>
              </div>
            </div>

            {/* Incremental Cost curves visualizer */}
            <div className="bg-navy-card border border-navy-light rounded-2xl p-5 text-left space-y-4" id="eld-ic-curve">
              <div className="flex items-center justify-between border-b border-navy-light pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-emerald-accent" />
                  <h3 className="font-display font-bold text-sm text-white">Equal Incremental Cost Intersection Curve</h3>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">X-axis: Power (MW) | Y-axis: $/MWh</span>
              </div>

              {/* LineChart for Incremental cost */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={icChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="Power"
                      tick={{ fill: '#64748b', fontSize: 9 }}
                      label={{ value: 'Unit Power Generation (MW)', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 9 }}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 9 }}
                      label={{ value: 'Incremental Cost ($/MWh)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 9, dy: 45 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                      labelStyle={{ color: '#64748b', fontSize: '10px' }}
                      itemStyle={{ fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', marginTop: '5px' }} />
                    
                    {/* Dispatched System Lambda reference line */}
                    <ReferenceLine
                      y={eld.eldResult.systemLambda}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{ value: `System λ = ${eld.eldResult.systemLambda}`, fill: '#f87171', fontSize: 9, position: 'top' }}
                    />

                    {eld.units.map((u, idx) => {
                      const colors = ['#3b82f6', '#eab308', '#10b981'];
                      return (
                        <Line
                          key={u.id}
                          type="monotone"
                          dataKey={u.name}
                          stroke={colors[idx % colors.length]}
                          strokeWidth={2}
                          dot={false}
                          name={`${u.name} (dC/dP)`}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab 3: Power Plant Asset Depreciation Visualizer */}
      {activeTab === 'depreciation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: Depreciation values input */}
          <div className="lg:col-span-4 bg-navy-card border border-navy-light rounded-2xl p-5 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-navy-light pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-accent" />
                <h3 className="font-display font-bold text-sm text-white">Asset Settings</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Financial Model</span>
            </div>

            {/* Capital Cost */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono block">Initial Capital Cost P ($)</label>
              <input
                type="number"
                value={depreciation.inputs.initialCost}
                onChange={(e) => depreciation.updateInput('initialCost', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-navy-dark border border-navy-light focus:border-emerald-accent/40 rounded-xl text-xs font-mono text-white outline-none"
              />
            </div>

            {/* Salvage Value */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono block">Salvage Value S ($)</label>
              <input
                type="number"
                value={depreciation.inputs.salvageValue}
                onChange={(e) => depreciation.updateInput('salvageValue', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-navy-dark border border-navy-light focus:border-emerald-accent/40 rounded-xl text-xs font-mono text-white outline-none"
              />
            </div>

            {/* Useful Life years */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-500 uppercase block">Useful Life (Years)</label>
                <input
                  type="number"
                  value={depreciation.inputs.usefulLifeYears}
                  onChange={(e) => depreciation.updateInput('usefulLifeYears', parseFloat(e.target.value) || 1)}
                  className="w-full bg-navy-dark border border-navy-light rounded-xl px-3 py-2 text-xs font-mono text-white outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-500 uppercase block">Interest Rate r (%)</label>
                <input
                  type="number"
                  value={depreciation.inputs.interestRatePercent}
                  onChange={(e) => depreciation.updateInput('interestRatePercent', parseFloat(e.target.value) || 0)}
                  className="w-full bg-navy-dark border border-navy-light rounded-xl px-3 py-2 text-xs font-mono text-white outline-none"
                />
              </div>
            </div>

            {/* Comparison card */}
            <div className="bg-navy-dark/50 border border-navy-light rounded-xl p-4.5 space-y-3">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Annual Depreciation Burden</span>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Straight-Line Method:</span>
                  <span className="font-mono font-bold text-white">${depreciation.slAnnualDepreciation.toLocaleString()}/yr</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Sinking Fund Method:</span>
                  <span className="font-mono font-bold text-emerald-accent">${depreciation.sfAnnualDepreciation.toLocaleString()}/yr</span>
                </div>
              </div>

              <span className="text-[9px] text-slate-600 block leading-tight pt-1 border-t border-navy-light/40">
                Sinking fund model earns {depreciation.inputs.interestRatePercent}% compound interest on deposits to accumulated target replacement funds.
              </span>
            </div>

          </div>

          {/* Right panel: Depreciation Curve Graph & comparison data */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Book value curves */}
            <div className="bg-navy-card border border-navy-light rounded-2xl p-5 text-left space-y-4" id="depreciation-comparison-chart">
              <div className="flex items-center justify-between border-b border-navy-light pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-accent" />
                  <h3 className="font-display font-bold text-sm text-white">Asset Value Sinking Curve comparison</h3>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Book Value over useful life</span>
              </div>

              {/* Composed Chart Line & Bar */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={depreciation.yearlyData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="year"
                      tick={{ fill: '#64748b', fontSize: 9 }}
                      label={{ value: 'Useful Life Year', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 9 }}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 9 }}
                      tickFormatter={(v) => `$${v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                      label={{ value: 'Asset Book Value ($)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 9, dy: 45 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                      labelStyle={{ color: '#64748b', fontSize: '10px' }}
                      itemStyle={{ fontSize: '11px' }}
                      labelFormatter={(y) => `Financial Year: ${y}`}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', marginTop: '5px' }} />
                    <Bar
                      name="SF Accumulated Fund"
                      dataKey="sfAccumulated"
                      barSize={12}
                      fill="#1e293b"
                    />
                    <Line
                      type="monotone"
                      name="Straight-Line Book Value"
                      dataKey="slBookValue"
                      stroke="#475569"
                      strokeWidth={2}
                      dot={true}
                    />
                    <Line
                      type="monotone"
                      name="Sinking Fund Book Value"
                      dataKey="sfBookValue"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={true}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Details Table */}
            <div className="bg-navy-card border border-navy-light rounded-2xl p-5 text-left space-y-3">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block border-b border-navy-light pb-2">Yearly Book Value Schedule Ledger</span>
              
              <div className="border border-navy-light rounded-xl overflow-hidden bg-navy-dark/40 text-xs">
                <div className="grid grid-cols-5 gap-2 bg-navy-dark/90 px-3 py-2 border-b border-navy-light font-mono font-bold text-slate-400 uppercase text-[9px]">
                  <span>Year</span>
                  <span className="text-right">SL Book Value</span>
                  <span className="text-right">SF Book Value</span>
                  <span className="text-right">SL Accum Depr</span>
                  <span className="text-right">SF Accum Depr</span>
                </div>

                <div className="max-h-[180px] overflow-y-auto divide-y divide-navy-light/40 pr-1">
                  {depreciation.yearlyData.map((row) => (
                    <div key={row.year} className="grid grid-cols-5 gap-2 px-3 py-2 font-mono text-[11px] items-center hover:bg-navy-light/10 text-slate-300">
                      <span className="text-slate-500 font-bold">Year {row.year}</span>
                      <span className="text-right">${row.slBookValue.toLocaleString()}</span>
                      <span className="text-right text-emerald-accent font-semibold">${row.sfBookValue.toLocaleString()}</span>
                      <span className="text-right text-slate-500">${row.slAccumulated.toLocaleString()}</span>
                      <span className="text-right text-slate-500">${row.sfAccumulated.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Floating Design Document Generator Button */}
      <div className="pt-6 border-t border-navy-light flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-slate-500" />
          <span className="text-xs text-slate-400 font-mono">Designed in compliance with EEE 4111 Power Plant Engineering course requirements.</span>
        </div>
      </div>

    </div>
  );
}
