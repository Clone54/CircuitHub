import { useState, useMemo } from 'react';

export interface GeneratorUnit {
  id: string;
  name: string;
  capacity: number; // MW
  forRate: number; // Forced Outage Rate (0.01 to 0.20)
}

export interface COPTEntry {
  outageMW: number;
  availableMW: number;
  probability: number;
  cumulativeProbability: number;
  isRiskState: boolean; // True if availableMW < peakLoad
  deficiency: number; // peakLoad - availableMW (if > 0)
}

export function useLOLP() {
  const [generators, setGenerators] = useState<GeneratorUnit[]>([
    { id: '1', name: 'Coal Base G1', capacity: 150, forRate: 0.03 },
    { id: '2', name: 'Gas CCGT G2', capacity: 100, forRate: 0.05 },
    { id: '3', name: 'Gas Peaker G3', capacity: 50, forRate: 0.08 },
    { id: '4', name: 'Diesel Peaker G4', capacity: 50, forRate: 0.12 },
  ]);

  const [peakLoad, setPeakLoad] = useState<number>(270); // in MW

  // Add generator
  const addGenerator = (name: string, capacity: number, forRate: number) => {
    const id = (Math.max(...generators.map(g => parseInt(g.id) || 0), 0) + 1).toString();
    setGenerators([...generators, { id, name, capacity, forRate }]);
  };

  // Remove generator
  const removeGenerator = (id: string) => {
    if (generators.length <= 1) return;
    setGenerators(generators.filter(g => g.id !== id));
  };

  // Update generator parameters
  const updateGenerator = (id: string, capacity: number, forRate: number) => {
    setGenerators(generators.map(g => g.id === id ? { ...g, capacity, forRate: Math.max(0, Math.min(1, forRate)) } : g));
  };

  // Construct COPT and compute LOLP & LOEP
  const results = useMemo(() => {
    const totalCapacity = generators.reduce((sum, g) => sum + g.capacity, 0);

    // To construct the COPT, we can expand all 2^N states
    // Since N is small (usually 3 to 6), a binary expansion is extremely fast and robust.
    // If N is larger, we would do recursive combination, but even for N=10, 2^10 = 1024 which is instantaneous.
    // Let's do a general combination map to group identical outage capacities
    const outageMap: Record<number, number> = {}; // outageMW -> probability

    const n = generators.length;
    const numStates = Math.pow(2, n);

    for (let i = 0; i < numStates; i++) {
      let stateOutageMW = 0;
      let stateProb = 1;

      for (let j = 0; j < n; j++) {
        const gen = generators[j];
        const isOut = (i & (1 << j)) !== 0;

        if (isOut) {
          stateOutageMW += gen.capacity;
          stateProb *= gen.forRate;
        } else {
          stateProb *= (1 - gen.forRate);
        }
      }

      outageMap[stateOutageMW] = (outageMap[stateOutageMW] || 0) + stateProb;
    }

    // Convert map to sorted array of unique outage states
    const rawEntries = Object.keys(outageMap).map(key => {
      const outageMW = parseInt(key);
      return {
        outageMW,
        availableMW: totalCapacity - outageMW,
        probability: outageMap[outageMW],
      };
    }).sort((a, b) => a.outageMW - b.outageMW);

    // Calculate Cumulative Probabilities (R_outage >= x)
    // To do this, cumulative probability for outage >= X is the sum of probabilities of all outages >= X
    const copt: COPTEntry[] = [];
    let cumulative = 1.0;

    for (let i = 0; i < rawEntries.length; i++) {
      const entry = rawEntries[i];
      
      // Cumulative probability for outage >= entry.outageMW is the sum of entry.probability + all higher outage probabilities
      const probGreaterOrEqual = rawEntries
        .filter(r => r.outageMW >= entry.outageMW)
        .reduce((sum, r) => sum + r.probability, 0);

      const deficiency = Math.max(0, peakLoad - entry.availableMW);

      copt.push({
        outageMW: entry.outageMW,
        availableMW: entry.availableMW,
        probability: parseFloat(entry.probability.toFixed(8)),
        cumulativeProbability: parseFloat(probGreaterOrEqual.toFixed(8)),
        isRiskState: entry.availableMW < peakLoad,
        deficiency,
      });
    }

    // Calculate Loss of Load Probability (LOLP)
    // LOLP is the probability that available capacity is less than Peak Load
    const lolp = copt
      .filter(entry => entry.isRiskState)
      .reduce((sum, entry) => sum + entry.probability, 0);

    // Expected Energy Not Served (EENS) index or LOEP (Loss of Energy Probability)
    // LOEP = Sum(P_state * Deficiency) / PeakLoad (often represented as energy index, let's calculate exact expected energy loss per peak period)
    const expectedEnergyNotServedMW = copt
      .filter(entry => entry.isRiskState)
      .reduce((sum, entry) => sum + (entry.probability * entry.deficiency), 0);

    const loep = peakLoad > 0 ? (expectedEnergyNotServedMW / peakLoad) : 0;

    // Convert LOLP to Days/Year
    const lolpDaysPerYear = lolp * 365.25;

    return {
      totalCapacity,
      copt,
      lolp: parseFloat(lolp.toFixed(6)),
      lolpDaysPerYear: parseFloat(lolpDaysPerYear.toFixed(3)),
      expectedEnergyNotServedMW: parseFloat(expectedEnergyNotServedMW.toFixed(2)),
      loep: parseFloat(loep.toFixed(6)),
    };
  }, [generators, peakLoad]);

  return {
    generators,
    addGenerator,
    removeGenerator,
    updateGenerator,
    peakLoad,
    setPeakLoad,
    ...results,
  };
}
