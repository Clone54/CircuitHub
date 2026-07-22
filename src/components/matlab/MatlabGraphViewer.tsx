import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  Grid,
  Eye,
  Download,
  Maximize2,
  Minimize2,
  Activity,
  Sliders,
  Play
} from 'lucide-react';
import { MatlabDataset } from '../../types';
import { useSweepAnimation } from '../../hooks/useSweepAnimation';

interface MatlabGraphViewerProps {
  xAxisLabel: string;
  yAxisLabel: string;
  datasets: MatlabDataset[];
  showGrid: boolean;
  setShowGrid: (val: boolean | ((prev: boolean) => boolean)) => void;
  showMarkers: boolean;
  setShowMarkers: (val: boolean | ((prev: boolean) => boolean)) => void;
  lineType: 'monotone' | 'linear' | 'step';
  setLineType: (type: 'monotone' | 'linear' | 'step') => void;
  onExportCSV: () => void;
  isAnimated?: boolean;
  setIsAnimated?: (val: boolean | ((prev: boolean) => boolean)) => void;
}

// Custom shape renderer for true MATLAB stem plots
const StemPoint = (props: any) => {
  const { cx, cy, xAxis, yAxis, fill } = props;
  
  // Calculate the exact pixel Y-coordinate for the baseline (y = 0)
  // If yAxis.scale(0) is undefined, fallback to the bottom edge of the chart
  const zeroY = yAxis && yAxis.scale ? yAxis.scale(0) : cy; 

  return (
    <g>
      {/* The Stem: Line from y=0 to the data point */}
      <line 
        x1={cx} 
        y1={zeroY} 
        x2={cx} 
        y2={cy} 
        stroke={fill} 
        strokeWidth={2} 
      />
      {/* The Head: Marker at the data point */}
      <circle 
        cx={cx} 
        cy={cy} 
        r={4} 
        fill={fill} 
      />
    </g>
  );
};

export const MatlabGraphViewer: React.FC<MatlabGraphViewerProps> = ({
  xAxisLabel,
  yAxisLabel,
  datasets,
  showGrid,
  setShowGrid,
  showMarkers,
  setShowMarkers,
  lineType,
  setLineType,
  onExportCSV,
  isAnimated = false,
  setIsAnimated = () => {}
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Use animation hook
  const animatedDatasets = useSweepAnimation(datasets, isAnimated, 20);

  // Check if any dataset has data (based on original datasets to avoid 0 initially)
  const totalPoints = datasets.reduce((sum, ds) => sum + ds.data.length, 0);

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-navy-dark/95 border border-navy-light/80 p-3 rounded-lg shadow-2xl backdrop-blur-md text-xs font-mono space-y-1">
          <div className="text-slate-400 border-b border-navy-light/50 pb-1 mb-1 font-semibold">
            {xAxisLabel}: <span className="text-emerald-accent">{label}</span>
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-bold text-white">
                {typeof entry.value === 'number' ? entry.value.toFixed(4) : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`bg-navy-dark border border-navy-light/80 rounded-xl overflow-hidden shadow-2xl flex flex-col transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 m-0 rounded-2xl' : 'w-full'
      }`}
    >
      {/* MATLAB Window Header */}
      <div className="bg-navy-dark border-b border-navy-light/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
          </div>
          <span className="text-xs font-mono font-bold text-slate-200 ml-2">
            Figure 1: {yAxisLabel.split('-')[0].trim()} vs {xAxisLabel.split('-')[0].trim()}
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] font-medium transition-all cursor-pointer ${
              showGrid
                ? 'bg-emerald-accent/20 border-emerald-accent text-emerald-accent'
                : 'bg-navy-light/40 border-navy-light text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Grid Lines"
          >
            <Grid className="h-3.5 w-3.5" />
            <span>Grid</span>
          </button>

          <button
            onClick={() => setShowMarkers(!showMarkers)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] font-medium transition-all cursor-pointer ${
              showMarkers
                ? 'bg-emerald-accent/20 border-emerald-accent text-emerald-accent'
                : 'bg-navy-light/40 border-navy-light text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Circular Markers"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Markers</span>
          </button>

          <button
            onClick={() => setIsAnimated(!isAnimated)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] font-medium transition-all cursor-pointer ${
              isAnimated
                ? 'bg-emerald-accent/20 border-emerald-accent text-emerald-accent'
                : 'bg-navy-light/40 border-navy-light text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Sweep Animation"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Animate</span>
          </button>

          {/* Line Type Selector */}
          <div className="flex items-center gap-1 bg-navy-dark/90 border border-navy-light/60 p-0.5 rounded text-[11px]">
            <button
              onClick={() => setLineType('monotone')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                lineType === 'monotone' ? 'bg-emerald-accent text-navy-dark font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Smooth
            </button>
            <button
              onClick={() => setLineType('linear')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                lineType === 'linear' ? 'bg-emerald-accent text-navy-dark font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Linear
            </button>
            <button
              onClick={() => setLineType('step')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                lineType === 'step' ? 'bg-emerald-accent text-navy-dark font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Step
            </button>
          </div>

          <button
            onClick={onExportCSV}
            className="flex items-center gap-1 px-2.5 py-1 rounded border border-navy-light bg-navy-light/40 hover:bg-navy-light text-slate-200 text-[11px] font-medium transition-all cursor-pointer"
            title="Export Data as CSV"
          >
            <Download className="h-3.5 w-3.5 text-emerald-accent" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded border border-navy-light bg-navy-light/40 hover:bg-navy-light text-slate-300 transition-all cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Chart'}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="p-4 sm:p-6 flex-1 min-h-[380px] sm:min-h-[460px] bg-slate-950/60 relative flex flex-col justify-center">
        {totalPoints === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 px-4 gap-3">
            <div className="w-12 h-12 rounded-full bg-navy-light/30 border border-navy-light flex items-center justify-center text-slate-400">
              <Activity className="h-6 w-6 text-emerald-accent" />
            </div>
            <div className="text-sm font-semibold text-slate-200">No Data Points to Plot</div>
            <p className="text-xs text-slate-400 max-w-sm">
              Add points manually using the input form or paste a MATLAB script in the Parser mode to render multi-curve plots.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={isFullscreen ? 540 : 420}>
            <ComposedChart margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
              {showGrid && (
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.8} />
              )}
              <XAxis
                dataKey="x"
                type="number"
                domain={['auto', 'auto']}
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                label={{
                  value: xAxisLabel,
                  position: 'bottom',
                  offset: 10,
                  fill: '#10b981',
                  fontSize: 12,
                  fontWeight: 600
                }}
              />
              <YAxis
                dataKey="y"
                type="number"
                domain={['auto', 'auto']}
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                label={{
                  value: yAxisLabel,
                  angle: -90,
                  position: 'insideLeft',
                  offset: -5,
                  fill: '#10b981',
                  fontSize: 12,
                  fontWeight: 600
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  paddingBottom: '10px'
                }}
              />
              <ReferenceLine y={0} stroke="#475569" strokeDasharray="2 2" />
              <ReferenceLine x={0} stroke="#475569" strokeDasharray="2 2" />

              {animatedDatasets.map((ds) => {
                if (ds.plotType === 'discrete') {
                  return (
                    <Scatter
                      key={ds.id}
                      name={ds.name}
                      data={ds.data}
                      fill={ds.color}
                      shape={<StemPoint />}
                      isAnimationActive={false}
                    />
                  );
                }
                return (
                  <Line
                    key={ds.id}
                    data={ds.data}
                    name={ds.name}
                    dataKey="y"
                    stroke={ds.color}
                    strokeWidth={2.5}
                    dot={showMarkers}
                    activeDot={{ r: 6, fill: ds.color, stroke: '#ffffff', strokeWidth: 2 }}
                    type={lineType}
                    isAnimationActive={false}
                  />
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Specs / Info Bar */}
      <div className="bg-navy-dark border-t border-navy-light/60 px-4 py-2 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <span>Active Datasets: <strong className="text-emerald-accent">{datasets.length}</strong></span>
          <span>Total Points: <strong className="text-emerald-accent">{totalPoints}</strong></span>
        </div>
        <div className="text-slate-500">
          MATLAB Recharts Plot Engine v2.4
        </div>
      </div>
    </div>
  );
};
