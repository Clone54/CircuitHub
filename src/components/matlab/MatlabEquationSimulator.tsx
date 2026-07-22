import React, { useState } from 'react';
import { Calculator, Play, Activity } from 'lucide-react';
import * as math from 'mathjs';
import { MatlabDataset } from '../../types';

interface MatlabEquationSimulatorProps {
  onSimulate: (dataset: MatlabDataset) => void;
  datasetCount: number;
}

const MATLAB_COLORS = [
  '#0072BD', '#D95319', '#EDB120', '#7E2F8E', '#77AC30', '#4DBEEE', '#A2142F'
];

export const MatlabEquationSimulator: React.FC<MatlabEquationSimulatorProps> = ({
  onSimulate,
  datasetCount
}) => {
  const [equation, setEquation] = useState('sin(x) * exp(-0.1 * x)');
  const [xStart, setXStart] = useState<number>(0);
  const [xEnd, setXEnd] = useState<number>(10);
  const [stepSize, setStepSize] = useState<number>(0.1);
  const [plotType, setPlotType] = useState<'continuous' | 'discrete'>('continuous');
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = () => {
    setError(null);
    try {
      if (xStart >= xEnd) throw new Error('X-Start must be less than X-End');
      if (stepSize <= 0) throw new Error('Step Size must be positive');
      
      const compiledExpr = math.compile(equation);
      const data = [];
      
      for (let x = xStart; x <= xEnd; x += stepSize) {
        // Round x to avoid floating point issues like 0.1 + 0.2 = 0.30000000000000004
        const roundedX = Number(x.toFixed(6));
        const y = compiledExpr.evaluate({ x: roundedX });
        if (typeof y !== 'number' || isNaN(y)) {
          throw new Error(`Equation did not return a valid number for x=${roundedX}`);
        }
        data.push({ x: roundedX, y });
      }

      if (data.length === 0) throw new Error('No data points generated');

      const color = MATLAB_COLORS[datasetCount % MATLAB_COLORS.length];
      
      onSimulate({
        id: `sim_${Date.now()}`,
        name: `f(x) = ${equation}`,
        color,
        plotType,
        data
      });
      
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate equation.');
    }
  };

  return (
    <div className="bg-navy-dark/60 border border-navy-light/40 rounded-xl overflow-hidden shadow-2xl flex flex-col h-full relative">
      <div className="bg-navy-dark/90 px-5 py-3 border-b border-navy-light/50 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-emerald-accent" />
          <h3 className="font-mono font-bold text-slate-100 text-sm">Equation Simulator</h3>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-6 overflow-y-auto">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5 ml-1">Function f(x) =</label>
            <input
              type="text"
              value={equation}
              onChange={(e) => setEquation(e.target.value)}
              placeholder="e.g., sin(x) * exp(-0.1 * x)"
              className="w-full bg-black/40 border border-navy-light rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:border-emerald-accent/50 focus:ring-1 focus:ring-emerald-accent/50 outline-none transition-all placeholder:text-slate-600"
            />
            {error && <p className="text-red-400 text-xs mt-2 font-medium">{error}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 ml-1">X-Start</label>
              <input
                type="number"
                value={xStart}
                onChange={(e) => setXStart(parseFloat(e.target.value))}
                className="w-full bg-black/40 border border-navy-light rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:border-emerald-accent/50 focus:ring-1 focus:ring-emerald-accent/50 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 ml-1">X-End</label>
              <input
                type="number"
                value={xEnd}
                onChange={(e) => setXEnd(parseFloat(e.target.value))}
                className="w-full bg-black/40 border border-navy-light rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:border-emerald-accent/50 focus:ring-1 focus:ring-emerald-accent/50 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 ml-1">Step Size</label>
              <input
                type="number"
                value={stepSize}
                onChange={(e) => setStepSize(parseFloat(e.target.value))}
                min="0.01"
                step="0.01"
                className="w-full bg-black/40 border border-navy-light rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:border-emerald-accent/50 focus:ring-1 focus:ring-emerald-accent/50 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5 ml-1">Plot Type</label>
            <div className="flex bg-black/40 p-1 rounded-lg border border-navy-light/60">
              <button
                onClick={() => setPlotType('continuous')}
                className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${
                  plotType === 'continuous'
                    ? 'bg-emerald-accent/20 text-emerald-accent'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Continuous (Line)
              </button>
              <button
                onClick={() => setPlotType('discrete')}
                className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${
                  plotType === 'discrete'
                    ? 'bg-emerald-accent/20 text-emerald-accent'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Discrete (Stem)
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-navy-dark/90 px-5 py-4 border-t border-navy-light/50 sticky bottom-0 z-10 flex gap-3">
        <button
          onClick={handleSimulate}
          className="flex-1 bg-emerald-accent hover:bg-emerald-accent/90 text-navy-dark font-bold py-2 px-4 rounded-lg text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        >
          <Activity className="h-4 w-4" />
          Simulate & Plot
        </button>
      </div>
    </div>
  );
};
