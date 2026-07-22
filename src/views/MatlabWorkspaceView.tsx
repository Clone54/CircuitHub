import React, { useState } from 'react';
import {
  Terminal,
  Cpu,
  PenTool,
  Code2,
  AlertCircle,
  BarChart3,
  Sparkles,
  ArrowLeft,
  FileCode2,
  Layers,
  Calculator
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMatlabWorkspace } from '../hooks/useMatlabWorkspace';
import { MatlabManualEntry } from '../components/matlab/MatlabManualEntry';
import { MatlabEditor } from '../components/matlab/MatlabEditor';
import { MatlabEquationSimulator } from '../components/matlab/MatlabEquationSimulator';
import { MatlabGraphViewer } from '../components/matlab/MatlabGraphViewer';
import { MatlabDataTable } from '../components/matlab/MatlabDataTable';

export default function MatlabWorkspaceView() {
  const {
    mode,
    setMode,
    xAxisLabel,
    setXAxisLabel,
    yAxisLabel,
    setYAxisLabel,
    datasets,
    activeConditionId,
    setActiveConditionId,
    inputX,
    setInputX,
    inputY,
    setInputY,
    codeScript,
    setCodeScript,
    isParsing,
    error,
    showGrid,
    setShowGrid,
    showMarkers,
    setShowMarkers,
    lineType,
    setLineType,
    addDataPoint,
    addDataset,
    nextCondition,
    updateDatasetName,
    updateDatasetColor,
    deleteDataPoint,
    deleteDataset,
    clearAllData,
    loadPresetData,
    parseMatlabCode,
    exportAsCSV
  } = useMatlabWorkspace();

  const [isAnimated, setIsAnimated] = useState(false);

  return (
    <div className="min-h-screen bg-navy-dark text-slate-100 font-sans pb-16">
      {/* Top Banner Header */}
      <div className="border-b border-navy-light/80 bg-navy-dark/90 backdrop-blur-md sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link
                  to="/tools"
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-accent transition-colors mr-2"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Tools</span>
                </Link>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-accent/10 border border-emerald-accent/30 text-emerald-accent text-[11px] font-mono font-bold uppercase tracking-wider">
                  MATLAB Suite v2.4
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight flex items-center gap-2">
                <Terminal className="h-6 w-6 text-emerald-accent" />
                <span>MATLAB :: Advanced Data & Code Visualization Workspace</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Plot multi-condition curves, manage increasing/decreasing states, or extract data directly from raw MATLAB scripts using integrated AI parsing.
              </p>
            </div>

            {/* Mode Toggle Tabs */}
            <div className="flex items-center bg-black/40 border border-navy-light/80 p-1 rounded-xl shrink-0 self-start md:self-auto overflow-x-auto">
              <button
                onClick={() => setMode('manual')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  mode === 'manual'
                    ? 'bg-emerald-accent text-navy-dark shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-light/30'
                }`}
              >
                <PenTool className="h-4 w-4" />
                <span>Manual</span>
              </button>
              <button
                onClick={() => setMode('parser')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  mode === 'parser'
                    ? 'bg-emerald-accent text-navy-dark shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-light/30'
                }`}
              >
                <Code2 className="h-4 w-4" />
                <span>Parser</span>
              </button>
              <button
                onClick={() => setMode('simulator')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  mode === 'simulator'
                    ? 'bg-emerald-accent text-navy-dark shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-light/30'
                }`}
              >
                <Calculator className="h-4 w-4" />
                <span>Simulator</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-400 animate-fadeIn">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-xs font-medium leading-relaxed">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Panel: Input Mode Control */}
          <div className="lg:col-span-5 space-y-6">
            {mode === 'manual' && (
              <MatlabManualEntry
                xAxisLabel={xAxisLabel}
                setXAxisLabel={setXAxisLabel}
                yAxisLabel={yAxisLabel}
                setYAxisLabel={setYAxisLabel}
                datasets={datasets}
                activeConditionId={activeConditionId}
                setActiveConditionId={setActiveConditionId}
                inputX={inputX}
                setInputX={setInputX}
                inputY={inputY}
                setInputY={setInputY}
                onAddDataPoint={addDataPoint}
                onNextCondition={nextCondition}
                onUpdateName={updateDatasetName}
                onUpdateColor={updateDatasetColor}
                onDeleteDataset={deleteDataset}
                onLoadPreset={loadPresetData}
              />
            )}
            
            {mode === 'parser' && (
              <MatlabEditor
                codeScript={codeScript}
                setCodeScript={setCodeScript}
                isParsing={isParsing}
                error={error}
                onParse={() => parseMatlabCode()}
              />
            )}

            {mode === 'simulator' && (
              <MatlabEquationSimulator
                onSimulate={addDataset}
                datasetCount={datasets.length}
              />
            )}
          </div>

          {/* Right Panel: Recharts MATLAB Graph Viewer & Dataset Inspector */}
          <div className="lg:col-span-7 space-y-6">
            <MatlabGraphViewer
              xAxisLabel={xAxisLabel}
              yAxisLabel={yAxisLabel}
              datasets={datasets}
              showGrid={showGrid}
              setShowGrid={setShowGrid}
              showMarkers={showMarkers}
              setShowMarkers={setShowMarkers}
              lineType={lineType}
              setLineType={setLineType}
              onExportCSV={exportAsCSV}
              isAnimated={isAnimated}
              setIsAnimated={setIsAnimated}
            />

            <MatlabDataTable
              xAxisLabel={xAxisLabel}
              yAxisLabel={yAxisLabel}
              datasets={datasets}
              onDeletePoint={deleteDataPoint}
              onDeleteDataset={deleteDataset}
              onClearAll={clearAllData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
