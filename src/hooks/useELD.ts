import { useState, useMemo } from 'react';

export interface GeneratorUnit {
  id: string;
  name: string;
  a: number; // $/MW^2h
  b: number; // $/MWh
  c: number; // $/h
  pMin: number; // MW
  pMax: number; // MW
}

export interface ELDInputs {
  units: GeneratorUnit[];
  systemDemand: number; // MW
}

export interface ELDResult {
  allocations: { [unitId: string]: number }; // MW allocated
  costs: { [unitId: string]: number }; // $/h cost
  incrementalCosts: { [unitId: string]: number }; // $/MWh (lambda)
  totalCost: number; // $/h
  systemLambda: number; // Optimal system lambda
  error?: string;
}

export function useELD() {
  const [units, setUnits] = useState<GeneratorUnit[]>([
    { id: 'g1', name: 'Unit 1 (Coal Steam)', a: 0.004, b: 8.0, c: 200, pMin: 50, pMax: 250 },
    { id: 'g2', name: 'Unit 2 (Combined Gas)', a: 0.006, b: 7.0, c: 150, pMin: 50, pMax: 200 },
    { id: 'g3', name: 'Unit 3 (Open Gas Turbine)', a: 0.009, b: 9.5, c: 100, pMin: 20, pMax: 120 }
  ]);

  const [systemDemand, setSystemDemand] = useState<number>(300); // MW

  const updateUnit = (id: string, field: keyof GeneratorUnit, value: number | string) => {
    setUnits(prev => prev.map(unit => {
      if (unit.id !== id) return unit;
      return {
        ...unit,
        [field]: typeof value === 'string' ? value : Math.max(0, value)
      };
    }));
  };

  const eldResult = useMemo<ELDResult>(() => {
    const activeUnits = [...units];
    const N = activeUnits.length;
    if (N === 0) {
      return { allocations: {}, costs: {}, incrementalCosts: {}, totalCost: 0, systemLambda: 0, error: 'No active generation units defined.' };
    }

    // Verify system load constraint limits
    const totalMin = activeUnits.reduce((sum, u) => sum + u.pMin, 0);
    const totalMax = activeUnits.reduce((sum, u) => sum + u.pMax, 0);

    if (systemDemand < totalMin) {
      // Clamped to minimums
      const allocations: { [id: string]: number } = {};
      const costs: { [id: string]: number } = {};
      const incrementalCosts: { [id: string]: number } = {};
      let totalCost = 0;
      activeUnits.forEach(u => {
        allocations[u.id] = u.pMin;
        costs[u.id] = u.a * u.pMin * u.pMin + u.b * u.pMin + u.c;
        incrementalCosts[u.id] = 2 * u.a * u.pMin + u.b;
        totalCost += costs[u.id];
      });
      return {
        allocations,
        costs,
        incrementalCosts,
        totalCost: Math.round(totalCost * 100) / 100,
        systemLambda: 0,
        error: `Demand is below minimum system capability (${totalMin} MW). Units clamped to minimum values.`
      };
    }

    if (systemDemand > totalMax) {
      // Clamped to maximums
      const allocations: { [id: string]: number } = {};
      const costs: { [id: string]: number } = {};
      const incrementalCosts: { [id: string]: number } = {};
      let totalCost = 0;
      activeUnits.forEach(u => {
        allocations[u.id] = u.pMax;
        costs[u.id] = u.a * u.pMax * u.pMax + u.b * u.pMax + u.c;
        incrementalCosts[u.id] = 2 * u.a * u.pMax + u.b;
        totalCost += costs[u.id];
      });
      return {
        allocations,
        costs,
        incrementalCosts,
        totalCost: Math.round(totalCost * 100) / 100,
        systemLambda: 0,
        error: `Demand exceeds maximum system capability (${totalMax} MW). Units saturated to maximum capacity.`
      };
    }

    // Interactive Equal Incremental Cost Solver with limits clamping
    // We iteratively solve lambda for unconstrained units.
    let remainingUnits = [...activeUnits];
    let demandToMeet = systemDemand;
    const finalAllocations: { [id: string]: number } = {};
    let systemLambda = 0;

    let solved = false;
    let iterations = 0;
    const maxIterations = 10;

    while (!solved && iterations < maxIterations) {
      iterations++;
      
      // Calculate analytical lambda for the unconstrained subset
      // lambda = (demand + sum(b_i / (2 * a_i))) / sum(1 / (2 * a_i))
      let sumNumerator = demandToMeet;
      let sumDenominator = 0;

      for (const u of remainingUnits) {
        sumNumerator += u.b / (2 * u.a);
        sumDenominator += 1 / (2 * u.a);
      }

      const calculatedLambda = sumNumerator / sumDenominator;
      systemLambda = calculatedLambda;

      // Find allocations for the subset
      let hasViolations = false;
      const unitsToClamp: { unit: GeneratorUnit; value: number }[] = [];

      for (const u of remainingUnits) {
        const pOpt = (calculatedLambda - u.b) / (2 * u.a);
        
        if (pOpt > u.pMax) {
          unitsToClamp.push({ unit: u, value: u.pMax });
          hasViolations = true;
        } else if (pOpt < u.pMin) {
          unitsToClamp.push({ unit: u, value: u.pMin });
          hasViolations = true;
        }
      }

      if (!hasViolations) {
        // No violations, we are finished! Apply allocations for unconstrained units
        for (const u of remainingUnits) {
          finalAllocations[u.id] = (calculatedLambda - u.b) / (2 * u.a);
        }
        solved = true;
      } else {
        // Clamp the most violating units or clamp all violating ones
        // To be safe and stable, clamp the violating units, deduct their power, and remove them
        for (const clamp of unitsToClamp) {
          finalAllocations[clamp.unit.id] = clamp.value;
          demandToMeet -= clamp.value;
          remainingUnits = remainingUnits.filter(u => u.id !== clamp.unit.id);
        }

        // If no units are left unconstrained, we are finished
        if (remainingUnits.length === 0) {
          solved = true;
        }
      }
    }

    // Build costs
    const costs: { [id: string]: number } = {};
    const incrementalCosts: { [id: string]: number } = {};
    let totalCost = 0;

    activeUnits.forEach(u => {
      const p = Math.round((finalAllocations[u.id] ?? u.pMin) * 100) / 100;
      finalAllocations[u.id] = p;
      costs[u.id] = Math.round((u.a * p * p + u.b * p + u.c) * 100) / 100;
      incrementalCosts[u.id] = Math.round((2 * u.a * p + u.b) * 100) / 100;
      totalCost += costs[u.id];
    });

    return {
      allocations: finalAllocations,
      costs,
      incrementalCosts,
      totalCost: Math.round(totalCost * 100) / 100,
      systemLambda: Math.round(systemLambda * 1000) / 1000
    };
  }, [units, systemDemand]);

  return {
    units,
    systemDemand,
    setSystemDemand,
    updateUnit,
    eldResult
  };
}
