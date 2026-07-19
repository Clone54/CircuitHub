import { useState, useMemo } from 'react';

export interface BreakevenInputs {
  hvacTerminalCost: number; // in Million $ (M$)
  hvacLineCost: number;     // in M$ per km
  hvdcTerminalCost: number; // in Million $ (M$)
  hvdcLineCost: number;     // in M$ per km
}

export function useBreakevenAnalysis(initialInputs: BreakevenInputs) {
  const [inputs, setInputs] = useState<BreakevenInputs>(initialInputs);

  const stats = useMemo(() => {
    const { hvacTerminalCost, hvacLineCost, hvdcTerminalCost, hvdcLineCost } = inputs;

    const costDiffTerminals = hvdcTerminalCost - hvacTerminalCost;
    const costDiffLines = hvacLineCost - hvdcLineCost;

    let breakevenDistance = 0;
    let hasBreakeven = false;

    if (costDiffLines > 0 && costDiffTerminals > 0) {
      breakevenDistance = costDiffTerminals / costDiffLines;
      hasBreakeven = true;
    }

    return {
      breakevenDistance: parseFloat(breakevenDistance.toFixed(1)),
      hasBreakeven,
      costDiffTerminals,
      costDiffLines,
    };
  }, [inputs]);

  const costPlotData = useMemo(() => {
    const { hvacTerminalCost, hvacLineCost, hvdcTerminalCost, hvdcLineCost } = inputs;
    const { breakevenDistance, hasBreakeven } = stats;

    const data = [];
    // If no breakeven, use 1000 km as max range. Otherwise, center around breakeven (up to 1.6x breakeven)
    const maxDistance = hasBreakeven ? Math.max(400, breakevenDistance * 1.6) : 1000;
    const steps = 15;
    const stepSize = maxDistance / steps;

    for (let i = 0; i <= steps; i++) {
      const dist = i * stepSize;
      const hvacTotal = hvacTerminalCost + hvacLineCost * dist;
      const hvdcTotal = hvdcTerminalCost + hvdcLineCost * dist;

      data.push({
        distance: Math.round(dist),
        hvacCost: parseFloat(hvacTotal.toFixed(2)),
        hvdcCost: parseFloat(hvdcTotal.toFixed(2)),
      });
    }

    // Insert the exact breakeven point if valid, to ensure precise visual intersection on the chart
    if (hasBreakeven) {
      const hvacAtBreakeven = hvacTerminalCost + hvacLineCost * breakevenDistance;
      const hvdcAtBreakeven = hvdcTerminalCost + hvdcLineCost * breakevenDistance;
      
      data.push({
        distance: Math.round(breakevenDistance),
        hvacCost: parseFloat(hvacAtBreakeven.toFixed(2)),
        hvdcCost: parseFloat(hvdcAtBreakeven.toFixed(2)),
        isBreakevenPoint: true,
      });

      // Sort data by distance so Recharts renders correctly
      data.sort((a, b) => a.distance - b.distance);
    }

    return data;
  }, [inputs, stats]);

  return {
    inputs,
    setInputs,
    stats,
    costPlotData,
  };
}
