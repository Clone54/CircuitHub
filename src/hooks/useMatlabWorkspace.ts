import { useState, useCallback } from 'react';
import { MatlabDataset, MatlabDataPoint, MatlabParseResult } from '../types';

export const MATLAB_COLORS = [
  '#0072BD', // MATLAB Blue
  '#D95319', // MATLAB Red / Orange
  '#EDB120', // MATLAB Yellow / Gold
  '#7E2F8E', // MATLAB Purple
  '#77AC30', // MATLAB Green
  '#4DBEEE', // MATLAB Cyan
  '#A2142F', // MATLAB Dark Red
];

const DEFAULT_SCRIPT = `% MATLAB Multi-Curve Plot Script
% Example: Hysteresis loop (Increasing & Decreasing V_ds)

V_inc = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
I_inc = [0, 0.12, 0.45, 1.05, 1.95, 3.10, 4.40, 5.80, 7.20, 8.50, 9.60];

V_dec = [5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.5, 0];
I_dec = [9.60, 8.80, 7.80, 6.60, 5.20, 3.80, 2.50, 1.45, 0.65, 0.18, 0];

plot(V_inc, I_inc, '-o', 'DisplayName', 'Increasing Sweep');
hold on;
plot(V_dec, I_dec, '-s', 'DisplayName', 'Decreasing Sweep');
xlabel('Voltage - V_ds (V)');
ylabel('Drain Current - I_d (mA)');
title('MOSFET Drain Characteristics with Hysteresis');
grid on;`;

export function useMatlabWorkspace() {
  const [mode, setMode] = useState<'manual' | 'parser' | 'simulator'>('manual');
  const [xAxisLabel, setXAxisLabel] = useState<string>('Voltage - V_ds (V)');
  const [yAxisLabel, setYAxisLabel] = useState<string>('Drain Current - I_d (mA)');
  
  // Datasets state
  const [datasets, setDatasets] = useState<MatlabDataset[]>([
    {
      id: 'ds_1',
      name: 'Condition 1: Increasing Loop',
      color: MATLAB_COLORS[0],
      data: [
        { x: 0.0, y: 0.0 },
        { x: 0.5, y: 0.2 },
        { x: 1.0, y: 0.8 },
        { x: 1.5, y: 1.9 },
        { x: 2.0, y: 3.5 },
        { x: 2.5, y: 5.2 },
        { x: 3.0, y: 7.0 }
      ]
    },
    {
      id: 'ds_2',
      name: 'Condition 2: Decreasing Loop',
      color: MATLAB_COLORS[1],
      data: [
        { x: 3.0, y: 7.0 },
        { x: 2.5, y: 5.6 },
        { x: 2.0, y: 4.1 },
        { x: 1.5, y: 2.4 },
        { x: 1.0, y: 1.1 },
        { x: 0.5, y: 0.3 },
        { x: 0.0, y: 0.0 }
      ]
    }
  ]);

  const [activeConditionId, setActiveConditionId] = useState<string>('ds_1');
  
  // Data point form states
  const [inputX, setInputX] = useState<string>('');
  const [inputY, setInputY] = useState<string>('');
  
  // Code Parser states
  const [codeScript, setCodeScript] = useState<string>(DEFAULT_SCRIPT);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Visualization Preferences
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showMarkers, setShowMarkers] = useState<boolean>(true);
  const [lineType, setLineType] = useState<'monotone' | 'linear' | 'step'>('monotone');

  // Add Data Point to Active Condition
  const addDataPoint = useCallback((xVal?: number | any, yVal?: number | any) => {
    setError(null);
    const x = typeof xVal === 'number' ? xVal : parseFloat(inputX);
    const y = typeof yVal === 'number' ? yVal : parseFloat(inputY);

    if (isNaN(x) || isNaN(y)) {
      setError('Please enter valid numeric values for both X and Y coordinates.');
      return false;
    }

    setDatasets((prev) =>
      prev.map((ds) => {
        if (ds.id === activeConditionId) {
          return {
            ...ds,
            data: [...ds.data, { x, y }]
          };
        }
        return ds;
      })
    );

    setInputX('');
    setInputY('');
    return true;
  }, [inputX, inputY, activeConditionId]);

  // Next Condition / New Condition
  const nextCondition = useCallback(() => {
    setError(null);
    setDatasets((prev) => {
      const nextIndex = prev.length + 1;
      const color = MATLAB_COLORS[(nextIndex - 1) % MATLAB_COLORS.length];
      const newDataset: MatlabDataset = {
        id: `ds_${Date.now()}`,
        name: `Condition ${nextIndex}: Loop ${nextIndex}`,
        color,
        data: []
      };
      setActiveConditionId(newDataset.id);
      return [...prev, newDataset];
    });
  }, []);

  // Add Entire Dataset
  const addDataset = useCallback((newDataset: MatlabDataset) => {
    setDatasets(prev => [...prev, newDataset]);
  }, []);

  // Update Dataset Name
  const updateDatasetName = useCallback((id: string, name: string) => {
    setDatasets((prev) =>
      prev.map((ds) => (ds.id === id ? { ...ds, name } : ds))
    );
  }, []);

  // Update Dataset Color
  const updateDatasetColor = useCallback((id: string, color: string) => {
    setDatasets((prev) =>
      prev.map((ds) => (ds.id === id ? { ...ds, color } : ds))
    );
  }, []);

  // Delete specific point
  const deleteDataPoint = useCallback((datasetId: string, pointIndex: number) => {
    setDatasets((prev) =>
      prev.map((ds) => {
        if (ds.id === datasetId) {
          const newData = [...ds.data];
          newData.splice(pointIndex, 1);
          return { ...ds, data: newData };
        }
        return ds;
      })
    );
  }, []);

  // Delete entire dataset
  const deleteDataset = useCallback((datasetId: string) => {
    setDatasets((prev) => {
      if (prev.length <= 1) {
        setError('At least one dataset must remain in the workspace.');
        return prev;
      }
      const filtered = prev.filter((ds) => ds.id !== datasetId);
      if (activeConditionId === datasetId) {
        setActiveConditionId(filtered[0].id);
      }
      return filtered;
    });
  }, [activeConditionId]);

  // Clear all data
  const clearAllData = useCallback(() => {
    setDatasets([
      {
        id: 'ds_1',
        name: 'Condition 1: Primary Sweep',
        color: MATLAB_COLORS[0],
        data: []
      }
    ]);
    setActiveConditionId('ds_1');
    setError(null);
  }, []);

  // Preset Data Loader
  const loadPresetData = useCallback((preset: 'hysteresis' | 'diode' | 'rc_transient') => {
    setError(null);
    if (preset === 'hysteresis') {
      setXAxisLabel('Voltage - V_ds (V)');
      setYAxisLabel('Drain Current - I_d (mA)');
      const ds1: MatlabDataset = {
        id: 'ds_h1',
        name: 'Forward Sweep (Increasing V_ds)',
        color: MATLAB_COLORS[0],
        data: [
          { x: 0, y: 0 },
          { x: 0.5, y: 0.15 },
          { x: 1.0, y: 0.6 },
          { x: 1.5, y: 1.4 },
          { x: 2.0, y: 2.8 },
          { x: 2.5, y: 4.6 },
          { x: 3.0, y: 6.8 }
        ]
      };
      const ds2: MatlabDataset = {
        id: 'ds_h2',
        name: 'Reverse Sweep (Decreasing V_ds)',
        color: MATLAB_COLORS[1],
        data: [
          { x: 3.0, y: 6.8 },
          { x: 2.5, y: 5.2 },
          { x: 2.0, y: 3.6 },
          { x: 1.5, y: 2.1 },
          { x: 1.0, y: 0.9 },
          { x: 0.5, y: 0.25 },
          { x: 0, y: 0 }
        ]
      };
      setDatasets([ds1, ds2]);
      setActiveConditionId(ds1.id);
    } else if (preset === 'diode') {
      setXAxisLabel('Forward Voltage - V_f (V)');
      setYAxisLabel('Diode Current - I_f (mA)');
      const ds1: MatlabDataset = {
        id: 'ds_d1',
        name: 'Silicon Diode (1N4148 @ 25°C)',
        color: MATLAB_COLORS[0],
        data: [
          { x: 0.0, y: 0.00 },
          { x: 0.2, y: 0.01 },
          { x: 0.4, y: 0.05 },
          { x: 0.5, y: 0.20 },
          { x: 0.6, y: 1.10 },
          { x: 0.65, y: 3.50 },
          { x: 0.70, y: 10.20 },
          { x: 0.75, y: 28.00 }
        ]
      };
      const ds2: MatlabDataset = {
        id: 'ds_d2',
        name: 'Germanium Diode (1N34A @ 25°C)',
        color: MATLAB_COLORS[3],
        data: [
          { x: 0.0, y: 0.00 },
          { x: 0.1, y: 0.02 },
          { x: 0.2, y: 0.15 },
          { x: 0.3, y: 0.85 },
          { x: 0.4, y: 4.20 },
          { x: 0.5, y: 18.50 },
          { x: 0.55, y: 35.00 }
        ]
      };
      setDatasets([ds1, ds2]);
      setActiveConditionId(ds1.id);
    } else if (preset === 'rc_transient') {
      setXAxisLabel('Time - t (ms)');
      setYAxisLabel('Capacitor Voltage - V_c (V)');
      const ds1: MatlabDataset = {
        id: 'ds_rc1',
        name: 'Charging Curve (R=10kΩ, C=1µF)',
        color: MATLAB_COLORS[0],
        data: [
          { x: 0, y: 0.0 },
          { x: 2, y: 1.81 },
          { x: 5, y: 3.93 },
          { x: 10, y: 6.32 },
          { x: 15, y: 7.77 },
          { x: 20, y: 8.65 },
          { x: 30, y: 9.50 },
          { x: 40, y: 9.82 },
          { x: 50, y: 9.93 }
        ]
      };
      const ds2: MatlabDataset = {
        id: 'ds_rc2',
        name: 'Discharging Curve (R=10kΩ, C=1µF)',
        color: MATLAB_COLORS[1],
        data: [
          { x: 0, y: 10.0 },
          { x: 2, y: 8.19 },
          { x: 5, y: 6.07 },
          { x: 10, y: 3.68 },
          { x: 15, y: 2.23 },
          { x: 20, y: 1.35 },
          { x: 30, y: 0.50 },
          { x: 40, y: 0.18 },
          { x: 50, y: 0.07 }
        ]
      };
      setDatasets([ds1, ds2]);
      setActiveConditionId(ds1.id);
    }
  }, []);

  // Parse MATLAB Script via AI Backend
  const parseMatlabCode = useCallback(async (codeToParse?: string) => {
    const targetCode = codeToParse !== undefined ? codeToParse : codeScript;
    if (!targetCode || !targetCode.trim()) {
      setError('Please paste or write a MATLAB script before parsing.');
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      const response = await fetch('/api/matlab-execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: targetCode })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.errorMessage || errJson.message || `HTTP error ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'error') {
        throw new Error(result.errorMessage || 'Unknown compilation error from AI.');
      }

      if (result.xAxisLabel) setXAxisLabel(result.xAxisLabel);
      if (result.yAxisLabel) setYAxisLabel(result.yAxisLabel);

      if (Array.isArray(result.datasets) && result.datasets.length > 0) {
        // Ensure each dataset has unique id & color
        const processedDatasets = result.datasets.map((ds: any, idx: number) => ({
          id: ds.id || `parsed_ds_${idx}_${Date.now()}`,
          name: ds.name || `Parsed Curve ${idx + 1}`,
          color: ds.color || MATLAB_COLORS[idx % MATLAB_COLORS.length],
          plotType: ds.plotType || 'continuous',
          data: Array.isArray(ds.data) ? ds.data.filter((p: any) => typeof p.x === 'number' && typeof p.y === 'number') : []
        }));

        setDatasets(processedDatasets);
        setActiveConditionId(processedDatasets[0].id);
      } else {
        throw new Error('No numeric datasets could be extracted from the provided MATLAB script.');
      }
    } catch (err: any) {
      console.error('MATLAB AI Parsing error:', err);
      setError(err.message || 'Failed to parse MATLAB code. Please check syntax.');
    } finally {
      setIsParsing(false);
    }
  }, [codeScript]);

  // Export Datasets as CSV
  const exportAsCSV = useCallback(() => {
    if (datasets.length === 0) return;

    let csvContent = `data:text/csv;charset=utf-8,`;
    csvContent += `X-Axis (${xAxisLabel}),Y-Axis (${yAxisLabel}),Dataset Name\n`;

    datasets.forEach((ds) => {
      ds.data.forEach((p) => {
        csvContent += `${p.x},${p.y},"${ds.name.replace(/"/g, '""')}"\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `matlab_workspace_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [datasets, xAxisLabel, yAxisLabel]);

  return {
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
    setError,
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
  };
}
