import { useState, useMemo } from 'react';

export interface UnitParameters {
  id: number;
  name: string;
  minPower: number; // P_min in MW
  maxPower: number; // P_max in MW
  startupCost: number; // Startup cost in $
  incrementalCost: number; // Operating cost in $/MWh
  color: string; // Theme color for chart stacking
}

export interface HourCommitment {
  hour: number;
  load: number; // Demand in MW
  unit1Power: number; // MW dispatched
  unit2Power: number; // MW dispatched
  unit3Power: number; // MW dispatched
  totalGeneration: number;
  isUnit1On: boolean;
  isUnit2On: boolean;
  isUnit3On: boolean;
  operatingCost: number;
  startupCostThisHour: number;
}

export type LoadProfileType = 'summer_peak' | 'winter_low' | 'industrial_flat';

export function useUnitCommitment() {
  // Preset 24-hour Load Profiles (MW)
  const loadProfiles: Record<LoadProfileType, number[]> = {
    summer_peak: [
      180, 160, 150, 140, 150, 170, 220, 300, 380, 440, 500, 540,
      580, 620, 650, 640, 610, 560, 480, 420, 360, 300, 240, 200
    ],
    winter_low: [
      210, 190, 180, 180, 190, 220, 290, 380, 410, 380, 330, 290,
      270, 260, 280, 320, 400, 450, 430, 380, 320, 280, 250, 220
    ],
    industrial_flat: [
      380, 370, 370, 380, 390, 400, 420, 430, 430, 440, 440, 430,
      430, 420, 430, 440, 450, 440, 430, 410, 400, 390, 380, 380
    ]
  };

  const [selectedProfile, setSelectedProfile] = useState<LoadProfileType>('summer_peak');

  // Generator 1 (Base Coal)
  const [u1Min, setU1Min] = useState<number>(100);
  const [u1Max, setU1Max] = useState<number>(450);
  const [u1Startup, setU1Startup] = useState<number>(12000);
  const [u1Cost, setU1Cost] = useState<number>(18.5);

  // Generator 2 (Mid Gas)
  const [u2Min, setU2Min] = useState<number>(50);
  const [u2Max, setU2Max] = useState<number>(250);
  const [u2Startup, setU2Startup] = useState<number>(4500);
  const [u2Cost, setU2Cost] = useState<number>(32.0);

  // Generator 3 (Peaker Diesel)
  const [u3Min, setU3Min] = useState<number>(10);
  const [u3Max, setU3Max] = useState<number>(100);
  const [u3Startup, setU3Startup] = useState<number>(800);
  const [u3Cost, setU3Cost] = useState<number>(68.0);

  // Units parameter consolidation
  const units = useMemo<UnitParameters[]>(() => [
    { id: 1, name: 'Unit 1 (Coal Base)', minPower: u1Min, maxPower: u1Max, startupCost: u1Startup, incrementalCost: u1Cost, color: '#3b82f6' }, // blue
    { id: 2, name: 'Unit 2 (CCGT Gas)', minPower: u2Min, maxPower: u2Max, startupCost: u2Startup, incrementalCost: u2Cost, color: '#10b981' }, // emerald
    { id: 3, name: 'Unit 3 (Gas Peaker)', minPower: u3Min, maxPower: u3Max, startupCost: u3Startup, incrementalCost: u3Cost, color: '#f59e0b' } // amber
  ], [u1Min, u1Max, u1Startup, u1Cost, u2Min, u2Max, u2Startup, u2Cost, u3Min, u3Max, u3Startup, u3Cost]);

  const solverResults = useMemo(() => {
    const loads = loadProfiles[selectedProfile];
    const hoursCount = 24;
    const statesCount = 8; // 2^3 binary states: 0 to 7

    // Helper: Economic Dispatch for a single state (3-bit) and load
    const dispatchUnitState = (state: number, loadMW: number) => {
      const u1On = (state & 4) !== 0;
      const u2On = (state & 2) !== 0;
      const u3On = (state & 1) !== 0;

      const activeUnits = [
        { on: u1On, u: units[0] },
        { on: u2On, u: units[1] },
        { on: u3On, u: units[2] }
      ];

      const committed = activeUnits.filter(x => x.on);
      
      // Calculate capacity bounds
      const minGen = committed.reduce((sum, item) => sum + item.u.minPower, 0);
      const maxGen = committed.reduce((sum, item) => sum + item.u.maxPower, 0);

      // Infeasible if load is completely outside state boundaries
      if (committed.length === 0) {
        return { feasible: false, cost: Infinity, p: [0, 0, 0], overGen: 0 };
      }
      if (loadMW > maxGen) {
        // Not enough capacity
        return { feasible: false, cost: Infinity, p: [0, 0, 0], overGen: 0 };
      }

      // Initialize all powers to 0 or minPower
      const p = [0, 0, 0];
      committed.forEach(item => {
        p[item.u.id - 1] = item.u.minPower;
      });

      let remainingLoad = loadMW - minGen;
      let overGen = 0;

      if (remainingLoad < 0) {
        // Over-generation scenario. The load is less than the minimum stable output of active generators.
        // We force them to generate minPower (to keep grid physics happy) and apply an over-generation penalty.
        overGen = Math.abs(remainingLoad);
        remainingLoad = 0;
      }

      // Greedy dispatch of remaining load (cheapest incremental cost first)
      if (remainingLoad > 0) {
        const sortedCommitted = [...committed].sort((a, b) => a.u.incrementalCost - b.u.incrementalCost);
        
        for (const item of sortedCommitted) {
          const idx = item.u.id - 1;
          const room = item.u.maxPower - item.u.minPower;
          const allocation = Math.min(remainingLoad, room);
          p[idx] += allocation;
          remainingLoad -= allocation;
          if (remainingLoad <= 0) break;
        }
      }

      // Sum operating fuel costs: P_i * incrementalCost
      let operatingCost = 0;
      p.forEach((powerVal, i) => {
        if (powerVal > 0) {
          operatingCost += powerVal * units[i].incrementalCost;
        }
      });

      // Add severe penalty for over-generation or unallocated loads
      if (overGen > 0) {
        operatingCost += overGen * 250; // $250/MWh dumping penalty
      }

      return {
        feasible: true,
        cost: operatingCost,
        p,
        overGen
      };
    };

    // Helper: Startup cost calculation transitioning from state s_prev to s
    const getStartupCost = (sPrev: number, sNext: number) => {
      let cost = 0;
      for (let i = 0; i < 3; i++) {
        const prevOn = (sPrev & (1 << (2 - i))) !== 0;
        const nextOn = (sNext & (1 << (2 - i))) !== 0;
        if (!prevOn && nextOn) {
          cost += units[i].startupCost;
        }
      }
      return cost;
    };

    // DP Table setup
    // dp[hour][state] = min cost to reach this state
    // parent[hour][state] = previous state that gave min cost
    const dp: number[][] = Array.from({ length: hoursCount }, () => Array(statesCount).fill(Infinity));
    const parent: number[][] = Array.from({ length: hoursCount }, () => Array(statesCount).fill(-1));

    // Dynamic programming state initial condition (t=0)
    // Assume all generators were initially OFF (state 0)
    const initialPrevState = 0;
    for (let s = 0; s < statesCount; s++) {
      const dispatch = dispatchUnitState(s, loads[0]);
      if (dispatch.feasible) {
        const startup = getStartupCost(initialPrevState, s);
        dp[0][s] = dispatch.cost + startup;
      }
    }

    // DP Forward Pass
    for (let t = 1; t < hoursCount; t++) {
      const loadAtT = loads[t];
      for (let s = 0; s < statesCount; s++) {
        const dispatch = dispatchUnitState(s, loadAtT);
        if (!dispatch.feasible) continue;

        let minCost = Infinity;
        let bestPrev = -1;

        for (let sPrev = 0; sPrev < statesCount; sPrev++) {
          if (dp[t - 1][sPrev] === Infinity) continue;
          
          const startup = getStartupCost(sPrev, s);
          const transitionCost = dp[t - 1][sPrev] + startup + dispatch.cost;

          if (transitionCost < minCost) {
            minCost = transitionCost;
            bestPrev = sPrev;
          }
        }

        dp[t][s] = minCost;
        parent[t][s] = bestPrev;
      }
    }

    // Find the cheapest final state at t=23
    let minFinalCost = Infinity;
    let optimalFinalState = -1;
    for (let s = 0; s < statesCount; s++) {
      if (dp[hoursCount - 1][s] < minFinalCost) {
        minFinalCost = dp[hoursCount - 1][s];
        optimalFinalState = s;
      }
    }

    // If no feasible commitment found, fallback to turning all units ON (state 7)
    if (optimalFinalState === -1) {
      optimalFinalState = 7;
    }

    // Backtrack to assemble the optimal sequence of states
    const optimalStates: number[] = Array(hoursCount).fill(0);
    let currState = optimalFinalState;
    optimalStates[hoursCount - 1] = currState;

    for (let t = hoursCount - 1; t > 0; t--) {
      currState = parent[t][currState];
      if (currState === -1) {
        // Backup safety backtrack
        currState = 7; 
      }
      optimalStates[t - 1] = currState;
    }

    // Re-dispatch hours using the optimal states to construct display data
    const schedule: HourCommitment[] = [];
    let totalOptimizedCost = 0;
    let totalStartupCost = 0;
    let prevS = 0; // Assume start off

    for (let t = 0; t < hoursCount; t++) {
      const state = optimalStates[t];
      const loadMW = loads[t];
      const dispatch = dispatchUnitState(state, loadMW);
      const startup = getStartupCost(prevS, state);

      schedule.push({
        hour: t,
        load: loadMW,
        unit1Power: dispatch.p[0],
        unit2Power: dispatch.p[1],
        unit3Power: dispatch.p[2],
        totalGeneration: dispatch.p[0] + dispatch.p[1] + dispatch.p[2],
        isUnit1On: (state & 4) !== 0,
        isUnit2On: (state & 2) !== 0,
        isUnit3On: (state & 1) !== 0,
        operatingCost: dispatch.feasible ? dispatch.cost : 0,
        startupCostThisHour: startup
      });

      totalOptimizedCost += (dispatch.feasible ? dispatch.cost : 0) + startup;
      totalStartupCost += startup;
      prevS = state;
    }

    return {
      schedule,
      totalOptimizedCost: parseFloat(totalOptimizedCost.toFixed(2)),
      totalStartupCost: parseFloat(totalStartupCost.toFixed(2)),
    };
  }, [
    selectedProfile,
    u1Min, u1Max, u1Startup, u1Cost,
    u2Min, u2Max, u2Startup, u2Cost,
    u3Min, u3Max, u3Startup, u3Cost
  ]);

  return {
    selectedProfile,
    setSelectedProfile,
    profilesList: Object.keys(loadProfiles) as LoadProfileType[],
    loadProfiles,
    
    // Unit 1
    u1Min, setU1Min,
    u1Max, setU1Max,
    u1Startup, setU1Startup,
    u1Cost, setU1Cost,

    // Unit 2
    u2Min, setU2Min,
    u2Max, setU2Max,
    u2Startup, setU2Startup,
    u2Cost, setU2Cost,

    // Unit 3
    u3Min, setU3Min,
    u3Max, setU3Max,
    u3Startup, setU3Startup,
    u3Cost, setU3Cost,

    units,
    ...solverResults
  };
}
