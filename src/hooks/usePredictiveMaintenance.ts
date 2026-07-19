import { useState, useMemo } from 'react';

export interface DataPoint {
  id: string;
  hours: number;
  vibration: number; // mm/s
}

export const PRESET_SPINDLE: DataPoint[] = [
  { id: '1', hours: 200, vibration: 1.1 },
  { id: '2', hours: 600, vibration: 1.3 },
  { id: '3', hours: 1200, vibration: 1.6 },
  { id: '4', hours: 1800, vibration: 1.9 },
  { id: '5', hours: 2400, vibration: 2.4 },
  { id: '6', hours: 3000, vibration: 3.1 },
  { id: '7', hours: 3600, vibration: 3.8 },
  { id: '8', hours: 4200, vibration: 4.6 },
];

export const PRESET_FAN: DataPoint[] = [
  { id: '1', hours: 500, vibration: 0.8 },
  { id: '2', hours: 1500, vibration: 1.2 },
  { id: '3', hours: 2500, vibration: 1.5 },
  { id: '4', hours: 3500, vibration: 2.1 },
  { id: '5', hours: 4500, vibration: 2.8 },
  { id: '6', hours: 5500, vibration: 3.6 },
];

export const PRESET_CONVEYOR: DataPoint[] = [
  { id: '1', hours: 100, vibration: 1.5 },
  { id: '2', hours: 400, vibration: 1.8 },
  { id: '3', hours: 800, vibration: 2.2 },
  { id: '4', hours: 1200, vibration: 2.9 },
  { id: '5', hours: 1600, vibration: 3.8 },
  { id: '6', hours: 2000, vibration: 4.9 },
];

export function usePredictiveMaintenance() {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>(PRESET_SPINDLE);
  const [failureThreshold, setFailureThreshold] = useState<number>(8.0); // mm/s
  const [currentHours, setCurrentHours] = useState<number>(4200);

  // Load Presets
  const loadPreset = (type: 'spindle' | 'fan' | 'conveyor') => {
    if (type === 'spindle') {
      setDataPoints(PRESET_SPINDLE);
      setCurrentHours(4200);
      setFailureThreshold(8.0);
    } else if (type === 'fan') {
      setDataPoints(PRESET_FAN);
      setCurrentHours(5500);
      setFailureThreshold(6.5);
    } else if (type === 'conveyor') {
      setDataPoints(PRESET_CONVEYOR);
      setCurrentHours(2000);
      setFailureThreshold(9.0);
    }
  };

  // Add Custom Data Point
  const addDataPoint = (hours: number, vibration: number) => {
    const newPt: DataPoint = {
      id: Date.now().toString(),
      hours,
      vibration,
    };
    setDataPoints(prev => [...prev, newPt].sort((a, b) => a.hours - b.hours));
  };

  // Delete Data Point
  const deleteDataPoint = (id: string) => {
    setDataPoints(prev => prev.filter(pt => pt.id !== id));
  };

  // Clear All
  const clearAllData = () => {
    setDataPoints([]);
  };

  // Linear Regression Calculation
  const analytics = useMemo(() => {
    const N = dataPoints.length;
    if (N < 2) {
      return {
        slope: 0,
        intercept: 0,
        r2: 0,
        failHours: 0,
        rul: 0,
        regressionLine: [],
        status: 'Insufficient Data',
        healthScore: 100,
      };
    }

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    let sumYY = 0;

    for (let i = 0; i < N; i++) {
      const x = dataPoints[i].hours;
      const y = dataPoints[i].vibration;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
      sumYY += y * y;
    }

    const denominator = N * sumXX - sumX * sumX;
    if (denominator === 0) {
      return {
        slope: 0,
        intercept: 0,
        r2: 0,
        failHours: 0,
        rul: 0,
        regressionLine: [],
        status: 'Divide by zero error',
        healthScore: 100,
      };
    }

    const slope = (N * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / N;

    // R^2 Calculation
    const meanY = sumY / N;
    let ssTot = 0; // Total sum of squares
    let ssRes = 0; // Residual sum of squares
    for (let i = 0; i < N; i++) {
      const x = dataPoints[i].hours;
      const y = dataPoints[i].vibration;
      const yPred = slope * x + intercept;
      ssTot += Math.pow(y - meanY, 2);
      ssRes += Math.pow(y - yPred, 2);
    }
    const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

    // Predict failure operating hours (where slope * X + intercept = failureThreshold)
    let failHours = 0;
    let rul = 0;
    if (slope > 0) {
      failHours = (failureThreshold - intercept) / slope;
      rul = Math.max(0, failHours - currentHours);
    }

    // Health Score based on current vibration percentage of failure threshold
    // Let's query the latest point or currentHours prediction
    const currentEstVibe = slope * currentHours + intercept;
    const healthPercent = Math.max(0, Math.min(100, 100 - (currentEstVibe / failureThreshold) * 100));

    // Determine status text
    let status = 'Healthy';
    if (healthPercent < 30) {
      status = 'CRITICAL FAILURE RISK';
    } else if (healthPercent < 60) {
      status = 'Maintenance Required';
    } else if (healthPercent < 85) {
      status = 'Slight Degradation';
    }

    // Generate trend line coordinate points (from x=0 to x=failHours * 1.2 or 8000 max)
    const regressionLine = [];
    const maxPlotHours = Math.max(8000, failHours > 0 ? failHours * 1.15 : 6000);
    const stepSize = maxPlotHours / 20;

    for (let h = 0; h <= maxPlotHours; h += stepSize) {
      const vibe = slope * h + intercept;
      if (vibe >= 0) {
        regressionLine.push({
          hours: Math.round(h),
          vibration: parseFloat(vibe.toFixed(2)),
          limit: failureThreshold,
        });
      }
    }

    return {
      slope: parseFloat(slope.toFixed(6)),
      intercept: parseFloat(intercept.toFixed(4)),
      r2: parseFloat(r2.toFixed(4)),
      failHours: Math.round(failHours),
      rul: Math.round(rul),
      regressionLine,
      status,
      healthScore: Math.round(healthPercent),
    };
  }, [dataPoints, failureThreshold, currentHours]);

  return {
    dataPoints,
    failureThreshold,
    setFailureThreshold,
    currentHours,
    setCurrentHours,
    addDataPoint,
    deleteDataPoint,
    clearAllData,
    loadPreset,
    analytics,
  };
}
