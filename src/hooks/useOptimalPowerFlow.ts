import { useState, useMemo } from 'react';

export interface OPFNode {
  id: string;
  name: string;
  x: number; // percentage coordinate for 2D display
  y: number;
  type: 'slack' | 'industrial' | 'residential' | 'critical';
  baseLoad: number;
  maxGen: number;
  costPerMWh: number; // cost of generation
  description: string;
}

export interface OPFLine {
  id: string;
  from: string;
  to: string;
  reactance: number; // p.u.
  capacity: number; // MW
}

export function useOptimalPowerFlow() {
  // Demand sliders for each specific node (Node 2, Node 3, Node 4)
  const [loadNode2, setLoadNode2] = useState<number>(12); // MW at Industrial Park
  const [loadNode3, setLoadNode3] = useState<number>(8);  // MW at Residential
  const [loadNode4, setLoadNode4] = useState<number>(6);  // MW at Critical Hospital

  // Define static Nodes
  const nodes: OPFNode[] = useMemo(() => [
    { id: '1', name: 'Utility Substation', x: 15, y: 50, type: 'slack', baseLoad: 0, maxGen: 50, costPerMWh: 15, description: 'Bulk grid connection. Cheapest baseload power.' },
    { id: '2', name: 'Industrial Tech Park', x: 50, y: 18, type: 'industrial', baseLoad: loadNode2, maxGen: 15, costPerMWh: 28, description: 'High power industrial district with PV field.' },
    { id: '3', name: 'Residential Eco-District', x: 50, y: 82, type: 'residential', baseLoad: loadNode3, maxGen: 10, costPerMWh: 35, description: 'Smart homes with micro wind generation.' },
    { id: '4', name: 'Municipal Hospital', x: 85, y: 50, type: 'critical', baseLoad: loadNode4, maxGen: 6, costPerMWh: 65, description: 'Critical consumer with emergency diesel backup.' }
  ], [loadNode2, loadNode3, loadNode4]);

  // Define static Lines connecting the nodes
  const lines: OPFLine[] = useMemo(() => [
    { id: 'L12', from: '1', to: '2', reactance: 0.10, capacity: 15 }, // L1: Slack to Industrial
    { id: 'L13', from: '1', to: '3', reactance: 0.12, capacity: 12 }, // L2: Slack to Residential
    { id: 'L24', from: '2', to: '4', reactance: 0.08, capacity: 10 },  // L3: Industrial to Hospital
    { id: 'L34', from: '3', to: '4', reactance: 0.15, capacity: 6 },  // L4: Residential to Hospital
    { id: 'L23', from: '2', to: '3', reactance: 0.20, capacity: 5 }   // L5: Industrial to Residential intertie
  ], []);

  // Solve the $3x3$ matrix equation B * theta = P for angles theta2, theta3, theta4
  // using Cramer's rule. Node 1 is the slack bus (theta1 = 0).
  const solveDCTransmissionFlow = (
    pg1: number, pg2: number, pg3: number, pg4: number,
    pl2: number, pl3: number, pl4: number
  ) => {
    // Net real power injections (MW) at each node
    // P_k = P_Gk - P_Lk
    const P2 = pg2 - pl2;
    const P3 = pg3 - pl3;
    const P4 = pg4 - pl4;

    // Susceptances B_ij = 1 / X_ij
    const b12 = 1 / 0.10; // 10.0
    const b13 = 1 / 0.12; // 8.333
    const b24 = 1 / 0.08; // 12.5
    const b34 = 1 / 0.15; // 6.667
    const b23 = 1 / 0.20; // 5.0

    // Construct B_reduced susceptance matrix
    // Row 2: theta2 coefficient = b12 + b24 + b23 = 27.5
    //        theta3 coeff = -b23 = -5.0
    //        theta4 coeff = -b24 = -12.5
    // Row 3: theta2 coeff = -b23 = -5.0
    //        theta3 coeff = b13 + b34 + b23 = 20.0
    //        theta4 coeff = -b34 = -6.667
    // Row 4: theta2 coeff = -b24 = -12.5
    //        theta3 coeff = -b34 = -6.667
    //        theta4 coeff = b24 + b34 = 19.167

    const a11 = b12 + b24 + b23; // 27.5
    const a12 = -b23;            // -5.0
    const a13 = -b24;            // -12.5

    const a21 = -b23;            // -5.0
    const a22 = b13 + b34 + b23; // 20.0
    const a23 = -b34;            // -6.667

    const a31 = -b24;            // -12.5
    const a32 = -b34;            // -6.667
    const a33 = b24 + b34;       // 19.167

    // Det of B_reduced
    const detB = a11 * (a22 * a33 - a23 * a32) - a12 * (a21 * a33 - a23 * a31) + a13 * (a21 * a32 - a22 * a31);

    if (Math.abs(detB) < 1e-5) {
      return { theta2: 0, theta3: 0, theta4: 0, flows: { p12: 0, p13: 0, p24: 0, p34: 0, p23: 0 } };
    }

    // Solve for the angles theta2, theta3, theta4 using Cramer's rule
    // Replacing Column 1 with P vector
    const detB1 = P2 * (a22 * a33 - a23 * a32) - a12 * (P3 * a33 - a23 * P4) + a13 * (P3 * a32 - a22 * P4);
    // Replacing Column 2 with P vector
    const detB2 = a11 * (P3 * a33 - a23 * P4) - P2 * (a21 * a33 - a23 * a31) + a13 * (a21 * P4 - P3 * a31);
    // Replacing Column 3 with P vector
    const detB3 = a11 * (a22 * P4 - P3 * a32) - a12 * (a21 * P4 - P3 * a31) + P2 * (a21 * a32 - a22 * a31);

    const theta2 = detB1 / detB;
    const theta3 = detB2 / detB;
    const theta4 = detB3 / detB;

    // Calculate branch flows in MW: P_ij = (theta_i - theta_j) / X_ij
    // Since theta1 = 0 (slack bus)
    const p12 = (0 - theta2) * b12;
    const p13 = (0 - theta3) * b13;
    const p24 = (theta2 - theta4) * b24;
    const p34 = (theta3 - theta4) * b34;
    const p23 = (theta2 - theta3) * b23;

    return {
      theta2,
      theta3,
      theta4,
      flows: { p12, p13, p24, p34, p23 }
    };
  };

  // Run a deterministic grid-search OPF algorithm to dispatch generators PG1, PG2, PG3, PG4
  // to satisfy loads PL2, PL3, PL4 at MINIMUM overall generation cost while respecting line capacities
  const opfResult = useMemo(() => {
    const totalLoad = loadNode2 + loadNode3 + loadNode4;

    let minCost = Infinity;
    let bestDispatch = { pg1: 0, pg2: 0, pg3: 0, pg4: 0 };
    let bestFlows = { p12: 0, p13: 0, p24: 0, p34: 0, p23: 0 };
    let bestAngles = { t2: 0, t3: 0, t4: 0 };
    let bestPenalty = 0;

    // Grid search resolution:
    // Evaluate possible generation configurations for local nodes
    // Node 2 Max Gen: 15 MW, Step 1.5 MW (11 steps)
    // Node 3 Max Gen: 10 MW, Step 1.0 MW (11 steps)
    // Node 4 Max Gen: 6 MW, Step 1.0 MW (7 steps)
    // PG1 is calculated slack: TotalLoad - (PG2 + PG3 + PG4)
    // Evaluates 11 * 11 * 7 = 847 combinations. Runs in ~0.5ms in JS!
    const stepsPG2 = 10;
    const stepsPG3 = 10;
    const stepsPG4 = 6;

    for (let i = 0; i <= stepsPG2; i++) {
      const pg2 = (i / stepsPG2) * 15;
      for (let j = 0; j <= stepsPG3; j++) {
        const pg3 = (j / stepsPG3) * 10;
        for (let k = 0; k <= stepsPG4; k++) {
          const pg4 = (k / stepsPG4) * 6;

          const pg1 = totalLoad - (pg2 + pg3 + pg4);

          // Bound constraint on Slack Bus Generator Node 1 (Max 50 MW, Min 0 MW)
          if (pg1 < 0 || pg1 > 50) continue;

          // Solve power flow for this candidate dispatch
          const { theta2, theta3, theta4, flows } = solveDCTransmissionFlow(
            pg1, pg2, pg3, pg4,
            loadNode2, loadNode3, loadNode4
          );

          // Calculate raw fuel generation cost
          // Nodes: C1=$15, C2=$28, C3=$35, C4=$55
          const genCost = 15 * pg1 + 28 * pg2 + 35 * pg3 + 65 * pg4;

          // Compute penalty for transmission congestion / thermal violations
          let flowPenalty = 0;
          if (Math.abs(flows.p12) > 15) flowPenalty += (Math.abs(flows.p12) - 15) * 5000;
          if (Math.abs(flows.p13) > 12) flowPenalty += (Math.abs(flows.p13) - 12) * 5000;
          if (Math.abs(flows.p24) > 10) flowPenalty += (Math.abs(flows.p24) - 10) * 5000;
          if (Math.abs(flows.p34) > 6)  flowPenalty += (Math.abs(flows.p34) - 6) * 5000;
          if (Math.abs(flows.p23) > 5)  flowPenalty += (Math.abs(flows.p23) - 5) * 5000;

          const totalScore = genCost + flowPenalty;

          // Choose candidate with minimum total penalised score
          if (totalScore < minCost) {
            minCost = totalScore;
            bestDispatch = { pg1, pg2, pg3, pg4 };
            bestFlows = flows;
            bestAngles = { t2: theta2, t3: theta3, t4: theta4 };
            bestPenalty = flowPenalty;
          }
        }
      }
    }

    // In case no perfect fit was found, fall back to best dispatch evaluated
    const finalGenCost = 15 * bestDispatch.pg1 + 28 * bestDispatch.pg2 + 35 * bestDispatch.pg3 + 65 * bestDispatch.pg4;

    // Map computed line values into display list
    const branchOutputs = [
      { id: 'L12', from: '1', to: '2', name: 'L1: Substation to Industrial', flow: parseFloat(bestFlows.p12.toFixed(2)), capacity: 15, x1: 15, y1: 50, x2: 50, y2: 18 },
      { id: 'L13', from: '1', to: '3', name: 'L2: Substation to Residential', flow: parseFloat(bestFlows.p13.toFixed(2)), capacity: 12, x1: 15, y1: 50, x2: 50, y2: 82 },
      { id: 'L24', from: '2', to: '4', name: 'L3: Industrial to Hospital', flow: parseFloat(bestFlows.p24.toFixed(2)), capacity: 10, x1: 50, y1: 18, x2: 85, y2: 50 },
      { id: 'L34', from: '3', to: '4', name: 'L4: Residential to Hospital', flow: parseFloat(bestFlows.p34.toFixed(2)), capacity: 6, x1: 50, y1: 82, x2: 85, y2: 50 },
      { id: 'L23', from: '2', to: '3', name: 'L5: Industrial-Residential Intertie', flow: parseFloat(bestFlows.p23.toFixed(2)), capacity: 5, x1: 50, y1: 18, x2: 50, y2: 82 }
    ];

    // Determine congestion status
    const overallCongested = bestPenalty > 1.0;

    return {
      dispatch: {
        pg1: parseFloat(bestDispatch.pg1.toFixed(2)),
        pg2: parseFloat(bestDispatch.pg2.toFixed(2)),
        pg3: parseFloat(bestDispatch.pg3.toFixed(2)),
        pg4: parseFloat(bestDispatch.pg4.toFixed(2))
      },
      angles: {
        t2: parseFloat(bestAngles.t2.toFixed(4)),
        t3: parseFloat(bestAngles.t3.toFixed(4)),
        t4: parseFloat(bestAngles.t4.toFixed(4))
      },
      branches: branchOutputs,
      metrics: {
        totalLoad: parseFloat(totalLoad.toFixed(2)),
        totalCost: parseFloat(finalGenCost.toFixed(2)),
        avgCostPerMWh: parseFloat((finalGenCost / (totalLoad || 1)).toFixed(2)),
        isCongested: overallCongested
      }
    };
  }, [loadNode2, loadNode3, loadNode4]);

  return {
    loadNode2,
    setLoadNode2,
    loadNode3,
    setLoadNode3,
    loadNode4,
    setLoadNode4,
    nodes,
    opfResult
  };
}
