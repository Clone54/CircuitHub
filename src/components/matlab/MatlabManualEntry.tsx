import React from 'react';
import { PlusCircle, Sliders, Layers, Sparkles, Trash2, ArrowRight } from 'lucide-react';
import { MatlabDataset } from '../../types';
import { MATLAB_COLORS } from '../../hooks/useMatlabWorkspace';

interface MatlabManualEntryProps {
  xAxisLabel: string;
  setXAxisLabel: (val: string) => void;
  yAxisLabel: string;
  setYAxisLabel: (val: string) => void;
  datasets: MatlabDataset[];
  activeConditionId: string;
  setActiveConditionId: (id: string) => void;
  inputX: string;
  setInputX: (val: string) => void;
  inputY: string;
  setInputY: (val: string) => void;
  onAddDataPoint: () => void;
  onNextCondition: () => void;
  onUpdateName: (id: string, name: string) => void;
  onUpdateColor: (id: string, color: string) => void;
  onDeleteDataset: (id: string) => void;
  onLoadPreset: (preset: 'hysteresis' | 'diode' | 'rc_transient') => void;
}

export const MatlabManualEntry: React.FC<MatlabManualEntryProps> = ({
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
  onAddDataPoint,
  onNextCondition,
  onUpdateName,
  onUpdateColor,
  onDeleteDataset,
  onLoadPreset
}) => {
  const activeDataset = datasets.find((d) => d.id === activeConditionId) || datasets[0];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddDataPoint();
    }
  };

  return (
    <div className="space-y-6">
      {/* Preset Quick Loaders */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-navy-dark/70 border border-navy-light/60 p-4 rounded-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-accent uppercase tracking-wider">
          <Sparkles className="h-4 w-4" />
          <span>Quick Lab Presets:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onLoadPreset('hysteresis')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-navy-light/50 hover:bg-navy-light border border-navy-light/80 text-slate-200 transition-all cursor-pointer"
          >
            Hysteresis Loop (V vs I)
          </button>
          <button
            onClick={() => onLoadPreset('diode')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-navy-light/50 hover:bg-navy-light border border-navy-light/80 text-slate-200 transition-all cursor-pointer"
          >
            Diode I-V Curve
          </button>
          <button
            onClick={() => onLoadPreset('rc_transient')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-navy-light/50 hover:bg-navy-light border border-navy-light/80 text-slate-200 transition-all cursor-pointer"
          >
            RC Transient Response
          </button>
        </div>
      </div>

      {/* Axis Configuration Panel */}
      <div className="bg-navy-dark/60 border border-navy-light/60 p-5 rounded-xl space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 border-b border-navy-light/40 pb-2">
          <Sliders className="h-4 w-4 text-emerald-accent" />
          <span>Axis Configuration Panel</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              X-Axis Label (Quantity & Unit)
            </label>
            <input
              type="text"
              value={xAxisLabel}
              onChange={(e) => setXAxisLabel(e.target.value)}
              placeholder="e.g. Voltage - V_ds (V)"
              className="w-full rounded-lg bg-navy-dark border border-navy-light/80 px-3.5 py-2 text-xs text-slate-100 focus:border-emerald-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Y-Axis Label (Quantity & Unit)
            </label>
            <input
              type="text"
              value={yAxisLabel}
              onChange={(e) => setYAxisLabel(e.target.value)}
              placeholder="e.g. Drain Current - I_d (mA)"
              className="w-full rounded-lg bg-navy-dark border border-navy-light/80 px-3.5 py-2 text-xs text-slate-100 focus:border-emerald-accent focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Condition & Dataset Management */}
      <div className="bg-navy-dark/60 border border-navy-light/60 p-5 rounded-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-light/40 pb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Layers className="h-4 w-4 text-emerald-accent" />
            <span>Condition & Dataset Selector</span>
          </div>
          <button
            onClick={onNextCondition}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-accent hover:bg-emerald-400 text-navy-dark font-semibold text-xs transition-all shadow-md cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Next Condition</span>
          </button>
        </div>

        {/* Dataset Tabs */}
        <div className="flex flex-wrap gap-2">
          {datasets.map((ds) => {
            const isActive = ds.id === activeConditionId;
            return (
              <div
                key={ds.id}
                onClick={() => setActiveConditionId(ds.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                  isActive
                    ? 'bg-navy-light/80 border-emerald-accent text-white shadow-sm'
                    : 'bg-navy-dark/50 border-navy-light/50 text-slate-400 hover:text-slate-200 hover:border-navy-light'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: ds.color }}
                />
                <span className="truncate max-w-[140px]">{ds.name}</span>
                <span className="text-[10px] opacity-60 font-mono">({ds.data.length} pts)</span>
              </div>
            );
          })}
        </div>

        {/* Active Condition Details & Customization */}
        {activeDataset && (
          <div className="bg-navy-dark/80 border border-navy-light/80 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 mt-2">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400">Color:</label>
                <input
                  type="color"
                  value={activeDataset.color}
                  onChange={(e) => onUpdateColor(activeDataset.id, e.target.value)}
                  className="w-7 h-7 rounded border-none bg-transparent cursor-pointer"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[11px] text-slate-400 mb-0.5">Condition Name</label>
                <input
                  type="text"
                  value={activeDataset.name}
                  onChange={(e) => onUpdateName(activeDataset.id, e.target.value)}
                  className="w-full rounded bg-navy-dark border border-navy-light/80 px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-accent focus:outline-none"
                />
              </div>
            </div>
            {datasets.length > 1 && (
              <button
                onClick={() => onDeleteDataset(activeDataset.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-all cursor-pointer"
                title="Delete this condition dataset"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove Condition</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Data Point Input Form */}
      <div className="bg-navy-dark/60 border border-navy-light/60 p-5 rounded-xl space-y-4">
        <div className="text-sm font-semibold text-slate-200">
          Add Data Point to <span style={{ color: activeDataset?.color }}>{activeDataset?.name}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              X Value ({xAxisLabel.split('(')[0].trim() || 'X'})
            </label>
            <input
              type="number"
              step="any"
              value={inputX}
              onChange={(e) => setInputX(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 1.25"
              className="w-full rounded-lg bg-navy-dark border border-navy-light/80 px-3.5 py-2 text-xs text-slate-100 font-mono focus:border-emerald-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Y Value ({yAxisLabel.split('(')[0].trim() || 'Y'})
            </label>
            <input
              type="number"
              step="any"
              value={inputY}
              onChange={(e) => setInputY(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 3.42"
              className="w-full rounded-lg bg-navy-dark border border-navy-light/80 px-3.5 py-2 text-xs text-slate-100 font-mono focus:border-emerald-accent focus:outline-none"
            />
          </div>
          <div>
            <button
              onClick={onAddDataPoint}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-accent hover:bg-emerald-400 text-navy-dark font-semibold text-xs transition-all shadow-md cursor-pointer"
            >
              <span>Add Data Point</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
