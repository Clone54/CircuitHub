import { useState, useMemo } from 'react';

export interface TransmissionLine {
  id: string;
  fromBus: number;
  toBus: number;
  baseFlow: number; // in MW
  capacity: number; // in MW (Thermal Limit)
  currentFlow: number; // in MW (Dynamic)
  loadingPercent: number; // currentFlow / capacity * 100
  status: 'active' | 'tripped';
}

export interface SecurityRankingEntry {
  lineId: string;
  trippedLineName: string;
  performanceIndex: number;
  maxPostContingencyLoading: number; // Maximum loading on any remaining line
  overloadedLinesCount: number;
  criticalLine: string; // The line that gets most overloaded
}

export function useContingencyAnalysis() {
  // 5-bus, 6-line transmission system definition
  const baseLines: TransmissionLine[] = [
    { id: 'Line 1', fromBus: 1, toBus: 2, baseFlow: 90, capacity: 130, currentFlow: 90, loadingPercent: 0, status: 'active' },
    { id: 'Line 2', fromBus: 1, toBus: 3, baseFlow: 75, capacity: 110, currentFlow: 75, loadingPercent: 0, status: 'active' },
    { id: 'Line 3', fromBus: 2, toBus: 3, baseFlow: 35, capacity: 80, currentFlow: 35, loadingPercent: 0, status: 'active' },
    { id: 'Line 4', fromBus: 2, toBus: 4, baseFlow: 110, capacity: 160, currentFlow: 110, loadingPercent: 0, status: 'active' },
    { id: 'Line 5', fromBus: 3, toBus: 5, baseFlow: 95, capacity: 130, currentFlow: 95, loadingPercent: 0, status: 'active' },
    { id: 'Line 6', fromBus: 4, toBus: 5, baseFlow: 60, capacity: 120, currentFlow: 60, loadingPercent: 0, status: 'active' }
  ];

  // Selected tripped line (null means Base Case)
  const [trippedLineId, setTrippedLineId] = useState<string | null>(null);

  // Pre-defined Line Outage Distribution Factors (LODF)
  // LODF[trippedLine][affectedLine] = delta_Flow_affected / base_Flow_tripped
  const lodfFactors: Record<string, Record<string, number>> = {
    'Line 1': {
      'Line 2': 0.62,
      'Line 3': 0.38,
      'Line 4': -0.15,
      'Line 5': 0.22,
      'Line 6': 0.12
    },
    'Line 2': {
      'Line 1': 0.58,
      'Line 3': -0.42,
      'Line 4': 0.18,
      'Line 5': 0.44,
      'Line 6': 0.24
    },
    'Line 3': {
      'Line 1': 0.28,
      'Line 2': -0.32,
      'Line 4': 0.12,
      'Line 5': -0.18,
      'Line 6': 0.08
    },
    'Line 4': {
      'Line 1': -0.22,
      'Line 2': 0.14,
      'Line 3': 0.32,
      'Line 5': 0.42,
      'Line 6': 0.64
    },
    'Line 5': {
      'Line 1': 0.18,
      'Line 2': 0.38,
      'Line 3': -0.22,
      'Line 4': 0.48,
      'Line 6': 0.58
    },
    'Line 6': {
      'Line 1': 0.12,
      'Line 2': 0.15,
      'Line 3': 0.10,
      'Line 4': 0.62,
      'Line 5': 0.48
    }
  };

  // Helper function to calculate flows for a hypothetical or actual outage
  const calculateFlowsForOutage = (trippedId: string | null) => {
    return baseLines.map((line) => {
      if (trippedId === null) {
        return {
          ...line,
          currentFlow: line.baseFlow,
          loadingPercent: parseFloat((Math.abs(line.baseFlow) / line.capacity * 100).toFixed(1)),
          status: 'active' as const
        };
      }

      if (line.id === trippedId) {
        return {
          ...line,
          currentFlow: 0,
          loadingPercent: 0,
          status: 'tripped' as const
        };
      }

      // Calculate post-contingency flow using LODF
      const preContingencyTrippedFlow = baseLines.find(b => b.id === trippedId)?.baseFlow || 0;
      const lodf = lodfFactors[trippedId]?.[line.id] || 0;
      const postContingencyFlow = line.baseFlow + (lodf * preContingencyTrippedFlow);

      return {
        ...line,
        currentFlow: parseFloat(postContingencyFlow.toFixed(1)),
        loadingPercent: parseFloat((Math.abs(postContingencyFlow) / line.capacity * 100).toFixed(1)),
        status: 'active' as const
      };
    });
  };

  // 1. Current State Lines calculation
  const lines = useMemo(() => {
    return calculateFlowsForOutage(trippedLineId);
  }, [trippedLineId]);

  // 2. Perform N-1 contingency for ALL lines to create the Security Ranking Table
  // Calculated using the Active Power Performance Index (PI)
  // PI = Sum_{l != k} (P_l_post / Capacity_l)^4  --- higher means more severe overloads
  const securityRanking = useMemo<SecurityRankingEntry[]>(() => {
    return baseLines.map((tLine) => {
      const hypotheticalFlows = calculateFlowsForOutage(tLine.id);
      
      let piSum = 0;
      let maxLoading = 0;
      let overloadCount = 0;
      let worstLine = 'None';

      hypotheticalFlows.forEach((hLine) => {
        if (hLine.id === tLine.id) return; // Skip the tripped line itself

        // Loading ratio (MW_flow / MW_capacity)
        const ratio = Math.abs(hLine.currentFlow) / hLine.capacity;
        
        // Add to PI (using power of 4 to heavily penalize overloads)
        piSum += Math.pow(ratio, 4);

        if (hLine.loadingPercent > maxLoading) {
          maxLoading = hLine.loadingPercent;
          worstLine = `${hLine.id} (${hLine.fromBus}-${hLine.toBus})`;
        }

        if (hLine.loadingPercent >= 100) {
          overloadCount++;
        }
      });

      return {
        lineId: tLine.id,
        trippedLineName: `${tLine.id} (Bus ${tLine.fromBus} → ${tLine.toBus})`,
        performanceIndex: parseFloat(piSum.toFixed(3)),
        maxPostContingencyLoading: maxLoading,
        overloadedLinesCount: overloadCount,
        criticalLine: worstLine
      };
    }).sort((a, b) => b.performanceIndex - a.performanceIndex); // Rank by highest severity index first
  }, []);

  // System security state summary
  const systemState = useMemo(() => {
    const overloaded = lines.filter(l => l.status === 'active' && l.loadingPercent >= 100);
    const warning = lines.filter(l => l.status === 'active' && l.loadingPercent >= 85 && l.loadingPercent < 100);

    let status: 'secure' | 'alert' | 'critical' = 'secure';
    let message = 'Normal State: All transmission lines within safe operating limits.';

    if (overloaded.length > 0) {
      status = 'critical';
      message = `N-1 Outage Alert: ${overloaded.length} line(s) overloaded! Flash-tripping risks detected.`;
    } else if (warning.length > 0) {
      status = 'alert';
      message = `Contingency Loading Alert: ${warning.length} line(s) operating near thermal limits (>85%).`;
    } else if (trippedLineId !== null) {
      status = 'secure';
      message = `Contingency Stable: ${trippedLineId} tripped. Post-contingency flows successfully re-distributed without overloads.`;
    }

    return {
      status,
      message,
      overloadedCount: overloaded.length,
      warningCount: warning.length
    };
  }, [lines, trippedLineId]);

  return {
    lines,
    trippedLineId,
    setTrippedLineId,
    securityRanking,
    systemState,
    resetContingency: () => setTrippedLineId(null)
  };
}
