import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, Table, FileSpreadsheet, PlusCircle } from 'lucide-react';
import { MatlabDataset } from '../../types';

interface MatlabDataTableProps {
  xAxisLabel: string;
  yAxisLabel: string;
  datasets: MatlabDataset[];
  onDeletePoint: (datasetId: string, pointIndex: number) => void;
  onDeleteDataset: (datasetId: string) => void;
  onClearAll: () => void;
}

export const MatlabDataTable: React.FC<MatlabDataTableProps> = ({
  xAxisLabel,
  yAxisLabel,
  datasets,
  onDeletePoint,
  onDeleteDataset,
  onClearAll
}) => {
  const [openDatasetId, setOpenDatasetId] = useState<string | null>(datasets[0]?.id || null);

  const toggleAccordion = (id: string) => {
    setOpenDatasetId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-navy-dark/80 border border-navy-light/80 rounded-xl overflow-hidden shadow-xl space-y-0">
      {/* Table Header Bar */}
      <div className="bg-navy-dark border-b border-navy-light/60 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Table className="h-4 w-4 text-emerald-accent" />
          <span>Parsed & Logged Dataset Inspector</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-all cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Workspace</span>
          </button>
        </div>
      </div>

      {/* Accordion List for Datasets */}
      <div className="divide-y divide-navy-light/40">
        {datasets.map((ds) => {
          const isOpen = openDatasetId === ds.id;
          return (
            <div key={ds.id} className="transition-all">
              {/* Accordion Header */}
              <div
                onClick={() => toggleAccordion(ds.id)}
                className="p-4 flex items-center justify-between gap-3 bg-navy-dark/40 hover:bg-navy-light/20 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: ds.color }}
                  />
                  <span className="text-xs font-semibold text-slate-100 font-mono">
                    {ds.name}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 bg-navy-light/40 px-2 py-0.5 rounded">
                    {ds.data.length} Data Points
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {datasets.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDataset(ds.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete Dataset"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Accordion Body Table */}
              {isOpen && (
                <div className="p-4 bg-black/20 border-t border-navy-light/30">
                  {ds.data.length === 0 ? (
                    <div className="text-xs text-slate-400 italic py-3 text-center">
                      No points added yet for this condition loop.
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-60 overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead>
                          <tr className="border-b border-navy-light/60 text-slate-400 bg-navy-dark/60">
                            <th className="p-2.5 w-16">Index</th>
                            <th className="p-2.5">{xAxisLabel}</th>
                            <th className="p-2.5">{yAxisLabel}</th>
                            <th className="p-2.5 text-right w-20">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-light/30 text-slate-200">
                          {ds.data.map((pt, pIdx) => (
                            <tr
                              key={pIdx}
                              className="hover:bg-navy-light/30 transition-colors"
                            >
                              <td className="p-2.5 text-slate-500">#{pIdx + 1}</td>
                              <td className="p-2.5 font-semibold text-emerald-accent">
                                {pt.x}
                              </td>
                              <td className="p-2.5 font-semibold text-sky-400">
                                {pt.y}
                              </td>
                              <td className="p-2.5 text-right">
                                <button
                                  onClick={() => onDeletePoint(ds.id, pIdx)}
                                  className="p-1 rounded text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                                  title="Delete Point"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
